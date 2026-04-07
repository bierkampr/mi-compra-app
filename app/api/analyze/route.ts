import { NextResponse } from "next/server";
import { transcribeImagesWithRoulette } from "@/lib/vision-roulette";
import { logScan } from "@/lib/scan-logger";

// ─── UTILIDADES ────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Devuelve todas las claves de Groq disponibles en orden.
 * Busca: GROQ_API_KEY, GROQ_API_KEY_1, GROQ_API_KEY_2 ... _5
 */
const getAllGroqKeys = (): string[] => {
  const keys: string[] = [];
  if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);
  for (let i = 1; i <= 5; i++) {
    const k = process.env[`GROQ_API_KEY_${i}`];
    if (k) keys.push(k);
  }
  return keys;
};

// ─── PASO A: VISIÓN → delegado a lib/vision-roulette.ts (ruleta multi-plataforma)

// ─── PASO B: SÍNTESIS JSON (Groq) ─────────────────────────────────────────────

/**
 * Recibe las transcripciones de texto de Mistral y las convierte en el JSON
 * estructurado que necesita la app. Intenta con todas las claves de Groq disponibles.
 */
const synthesizeWithGroq = async (
  transcriptions: string[],
  userPrompt: string
): Promise<any> => {
  const groqKeys = getAllGroqKeys();
  if (groqKeys.length === 0) {
    throw new Error("No hay claves de Groq configuradas (GROQ_API_KEY o GROQ_API_KEY_1).");
  }

  const combinedText = transcriptions
    .map((t, i) =>
      transcriptions.length > 1
        ? `--- PARTE ${i + 1} DEL TICKET ---\n${t}`
        : t
    )
    .join("\n\n");

  const systemPrompt = `Eres un sintetizador de datos de tickets de compra.
Recibirás una o varias transcripciones del mismo ticket (puede estar dividido en partes).
Tu tarea es unificar toda la información y devolver UN ÚNICO objeto JSON válido.

REGLAS CRÍTICAS:
- "comercio": nombre comercial corto en MAYÚSCULAS (ej: "MERCADONA", "LIDL"). Nunca el nombre legal largo.
- "fecha": formato "DD/MM/AAAA". Si no aparece o es inválida, usa la fecha de hoy. Valida que el mes esté entre 01-12.
- "total": número final pagado. Si hay varias partes, NO sumes los totales parciales — busca el TOTAL FINAL del ticket.
- "productos": array con TODOS los productos, sin duplicar los que aparezcan en solapamientos entre partes.
- "nombre_ticket": texto literal del ticket. NUNCA incluir peso (kg), precio por kilo (€/kg) ni información adicional — solo el nombre del artículo.
- "nombre_base": nombre normalizado en Title Case, interpretando abreviaturas comunes (CC ZERO ZERO 2 → Coca-Cola Zero Zero 2L, LACON → Lacón, GRISSINI → Grissini). Si no hay interpretación posible, usa Title Case del nombre_ticket.
- No incluir líneas de IVA, descuentos, cambio ni totales parciales como productos.
- Responde SOLO con el JSON. Sin texto adicional, sin bloques de código markdown, sin explicaciones.

FORMATO EXACTO:
{
  "comercio": "STRING MAYÚSCULAS",
  "fecha": "DD/MM/AAAA",
  "total": number,
  "productos": [
    { "cantidad": number, "nombre_ticket": "string", "nombre_base": "String Title Case", "subtotal": number }
  ]
}`;

  for (let i = 0; i < groqKeys.length; i++) {
    try {
      console.log(`[Groq] Intentando síntesis con clave ${i + 1}...`);

      let attempt = 0;
      while (attempt < 2) {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKeys[i]}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `${userPrompt}\n\nTRANSCRIPCIÓN(ES) DEL TICKET:\n${combinedText}`,
              },
            ],
            temperature: 0,
            response_format: { type: "json_object" },
            max_tokens: 2000,
          }),
        });

        if (response.status === 429) {
          console.warn(`[Groq] Rate limit con clave ${i + 1}. Esperando 5s...`);
          await sleep(5000);
          attempt++;
          continue;
        }

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error?.message || `Groq error ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("Groq devolvió respuesta vacía.");

        return JSON.parse(content);
      }

      throw new Error(`Groq agotó reintentos con clave ${i + 1}`);
    } catch (err: any) {
      console.error(`[Groq] Fallo con clave ${i + 1}: ${err.message}`);
      if (i === groqKeys.length - 1) {
        throw new Error("Todas las claves de Groq han fallado en la síntesis.");
      }
      // Intentar con la siguiente clave
    }
  }

  throw new Error("Síntesis fallida: sin claves disponibles.");
};

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { images, prompt, mode } = await req.json();

    // Modo manual: devolver estructura vacía
    if (mode === "manual") {
      return NextResponse.json({
        comercio: "INGRESO MANUAL",
        fecha: new Date().toLocaleDateString("es-ES"),
        total: 0,
        productos: [],
      });
    }

    // Validación de entrada
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No se recibieron imágenes." }, { status: 400 });
    }
    if (images.length > 3) {
      return NextResponse.json({ error: "Máximo 3 imágenes por análisis." }, { status: 400 });
    }

    const pipelineStart = Date.now();

    // ── PASO A: ruleta multi-plataforma (cada imagen → API key aleatoria) ──────
    console.log(`[Pipeline] Paso A: ${images.length} imagen(es) → ruleta multi-plataforma`);

    const { transcriptions, meta } = await transcribeImagesWithRoulette(images);
    console.log(`[Pipeline] Paso A completado. ${transcriptions.length} transcripción(es) obtenidas. Plataformas: ${meta.platformsUsed.join(", ")} | Rotaciones: ${meta.rotationCount}`);

    // Verificar que las transcripciones tienen contenido real
    const validTranscriptions = transcriptions.filter(t => t && t.trim().length > 10);
    if (validTranscriptions.length === 0) {
      throw new Error("No se pudo extraer texto legible de las imágenes. Asegúrate de que las fotos sean nítidas.");
    }

    // ── PASO B: Groq sintetiza todas las transcripciones en JSON final ──────────
    console.log(`[Pipeline] Paso B: Groq sintetizando ${validTranscriptions.length} transcripción(es)...`);
    const result = await synthesizeWithGroq(validTranscriptions, prompt);

    // ── Normalización defensiva del resultado ───────────────────────────────────
    let finalComercio = "SIN NOMBRE";
    if (result.comercio) {
      if (typeof result.comercio === "string" && result.comercio.trim()) {
        finalComercio = result.comercio;
      } else if (typeof result.comercio === "object") {
        const found = Object.values(result.comercio).find(
          v => typeof v === "string" && (v as string).length > 0
        );
        if (found) finalComercio = found as string;
      }
    }

    const finalResponse = {
      comercio: finalComercio.toUpperCase().trim(),
      fecha: result.fecha || new Date().toLocaleDateString("es-ES"),
      total: Number(result.total) || 0,
      productos: (result.productos || []).map((p: any) => ({
        cantidad: Number(p.cantidad) || 1,
        nombre_ticket: String(p.nombre_ticket || "PRODUCTO"),
        nombre_base: String(p.nombre_base || p.nombre_ticket || "PRODUCTO"),
        subtotal: Number(p.subtotal) || 0,
      })),
    };

    const durationMs = Date.now() - pipelineStart;
    console.log(`[Pipeline] Completado en ${durationMs}ms. Comercio: ${finalResponse.comercio}, Productos: ${finalResponse.productos.length}, Total: ${finalResponse.total}`);

    // ── LOG SUPABASE (fire-and-forget) ───────────────────────────────────────
    void logScan({
      platform_used:    meta.platformsUsed[0] ?? "UNKNOWN",
      model:            meta.modelsUsed[0]    ?? "UNKNOWN",
      rotation_count:   meta.rotationCount,
      blacklisted_slots: meta.blacklistedSlots,
      image_count:      images.length,
      comercio:         finalResponse.comercio,
      product_count:    finalResponse.productos.length,
      total_amount:     finalResponse.total,
      duration_ms:      durationMs,
      success:          true,
      error_message:    null,
    });

    return NextResponse.json(finalResponse);

  } catch (error: any) {
    console.error("─── ERROR CRÍTICO EN /api/analyze ───", error.message);

    // ── LOG DE ERROR (fire-and-forget) ───────────────────────────────────────
    void logScan({
      platform_used:    "UNKNOWN",
      model:            "UNKNOWN",
      rotation_count:   0,
      blacklisted_slots: [],
      image_count:      0,
      comercio:         null,
      product_count:    null,
      total_amount:     null,
      duration_ms:      0,
      success:          false,
      error_message:    error.message || "Error desconocido",
    });

    return NextResponse.json(
      { error: error.message || "Error interno al procesar el ticket." },
      { status: 500 }
    );
  }
}