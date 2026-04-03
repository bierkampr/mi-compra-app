import { NextResponse } from "next/server";

// ─── UTILIDADES ────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Devuelve todas las claves de Mistral disponibles en orden.
 * Busca: MISTRAL_API_KEY, MISTRAL_API_KEY_1, MISTRAL_API_KEY_2 ... _5
 */
const getAllMistralKeys = (): string[] => {
  const keys: string[] = [];
  if (process.env.MISTRAL_API_KEY) keys.push(process.env.MISTRAL_API_KEY);
  for (let i = 1; i <= 5; i++) {
    const k = process.env[`MISTRAL_API_KEY_${i}`];
    if (k) keys.push(k);
  }
  return keys;
};

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

// ─── PASO A: VISIÓN (Mistral Pixtral) ─────────────────────────────────────────

/**
 * Envía UNA imagen a Mistral con UNA clave específica y devuelve la transcripción.
 * Incluye reintento automático en caso de rate limit (429).
 */
const transcribeImageWithMistral = async (
  apiKey: string,
  imageBase64: string,
  imageIndex: number,
  totalImages: number
): Promise<string> => {
  const imageUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const instruction =
    totalImages > 1
      ? `Eres un experto en lectura de tickets de compra. Esta es la PARTE ${imageIndex + 1} de ${totalImages} de un mismo ticket largo fotografiado en secciones. Transcribe LITERALMENTE todo el texto que veas: nombre del comercio, productos, cantidades, precios unitarios y subtotales. Mantén cada producto en su propia línea con su precio al lado. Es muy importante capturar el TOTAL si aparece.`
      : `Eres un experto en lectura de tickets de compra. Transcribe LITERALMENTE todo el texto de este ticket: nombre del comercio, fecha, todos los productos con sus cantidades, precios unitarios, subtotales y el TOTAL final.`;

  let attempt = 0;
  while (attempt < 3) {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "pixtral-12b-2409",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 2000,
      }),
    });

    // Rate limit: esperar y reintentar
    if (response.status === 429) {
      const waitMs = attempt === 0 ? 5000 : 12000;
      console.warn(`[Mistral] Rate limit en imagen ${imageIndex + 1}. Reintentando en ${waitMs / 1000}s...`);
      await sleep(waitMs);
      attempt++;
      continue;
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Mistral error ${response.status} en imagen ${imageIndex + 1}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error(`Mistral devolvió respuesta vacía para imagen ${imageIndex + 1}`);

    return content;
  }

  throw new Error(`Mistral agotó reintentos para imagen ${imageIndex + 1}`);
};

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
Recibirás una o varias transcripciones literales del mismo ticket (puede estar dividido en partes).
Tu tarea es unificar toda la información y devolver UN ÚNICO objeto JSON válido.

REGLAS CRÍTICAS:
- "comercio": nombre comercial conocido en STRING (ej: "MERCADONA"). Nunca el nombre legal largo.
- "fecha": formato "DD/MM/AAAA". Si no aparece, usa la fecha de hoy.
- "total": número final pagado. Si hay varias partes, NO sumes los totales parciales, busca el TOTAL FINAL del ticket.
- "productos": array con TODOS los productos, sin duplicar los que aparezcan en solapamientos entre partes.
- Cada producto: { "cantidad": número, "nombre_ticket": "texto literal del ticket", "nombre_base": "nombre limpio", "subtotal": número }
- Si no hay "nombre_base" claro, usa el mismo valor que "nombre_ticket".
- Responde SOLO con el JSON. Sin texto adicional, sin bloques de código, sin explicaciones.

FORMATO EXACTO:
{
  "comercio": "string",
  "fecha": "DD/MM/AAAA",
  "total": number,
  "productos": [
    { "cantidad": number, "nombre_ticket": "string", "nombre_base": "string", "subtotal": number }
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

    const mistralKeys = getAllMistralKeys();
    if (mistralKeys.length === 0) {
      return NextResponse.json(
        { error: "No hay claves de Mistral configuradas en el servidor." },
        { status: 500 }
      );
    }

    // ── PASO A: cada imagen → su propia clave Mistral en paralelo ──────────────
    console.log(`[Pipeline] Paso A: ${images.length} imagen(es) → ${mistralKeys.length} clave(s) Mistral disponibles.`);

    const visionPromises = images.map(async (img: string, index: number) => {
      // Asignar clave rotando: imagen 0 → clave 0, imagen 1 → clave 1, etc.
      // Si hay más imágenes que claves, se reutiliza por módulo (ej: 3 imgs, 2 claves → 0,1,0)
      const keyIndex = index % mistralKeys.length;
      const apiKey = mistralKeys[keyIndex];

      console.log(`[Mistral] Imagen ${index + 1} → clave ${keyIndex + 1}`);

      // Si la clave asignada falla, intentar con las demás
      const keysToTry = [
        apiKey,
        ...mistralKeys.filter((_, i) => i !== keyIndex),
      ];

      for (const key of keysToTry) {
        try {
          return await transcribeImageWithMistral(key, img, index, images.length);
        } catch (err: any) {
          console.warn(`[Mistral] Clave falló para imagen ${index + 1}: ${err.message}`);
        }
      }

      throw new Error(`No se pudo transcribir la imagen ${index + 1} con ninguna clave de Mistral.`);
    });

    const transcriptions = await Promise.all(visionPromises);
    console.log(`[Pipeline] Paso A completado. ${transcriptions.length} transcripción(es) obtenidas.`);

    // Verificar que las transcripciones tienen contenido real
    const validTranscriptions = transcriptions.filter(t => t && t.trim().length > 10);
    if (validTranscriptions.length === 0) {
      throw new Error("Mistral no pudo extraer texto legible de las imágenes. Asegúrate de que las fotos sean nítidas.");
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

    console.log(`[Pipeline] Completado. Comercio: ${finalResponse.comercio}, Productos: ${finalResponse.productos.length}, Total: ${finalResponse.total}`);
    return NextResponse.json(finalResponse);

  } catch (error: any) {
    console.error("─── ERROR CRÍTICO EN /api/analyze ───", error.message);
    return NextResponse.json(
      { error: error.message || "Error interno al procesar el ticket." },
      { status: 500 }
    );
  }
}