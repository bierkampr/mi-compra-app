import { NextResponse } from "next/server";

// ─── PIPELINE v3.0: GEMINI VIA TOKEN DEL USUARIO ──────────────────────────────
// Reemplaza el pipeline Mistral+Groq por una ÚNICA llamada a Gemini 2.0 Flash.
// La cuota de IA se consume de la cuenta personal del usuario, no de API Keys propias.
// ────────────────────────────────────────────────────────────────────────────────

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Construye el prompt del sistema para la extracción de datos del ticket.
 */
const buildSystemPrompt = (userPrompt: string): string => {
  return `Eres un experto extractor de datos de tickets de compra.

INSTRUCCIONES:
- Si recibes MÚLTIPLES IMÁGENES, son partes de un MISMO Y ÚNICO TICKET fotografiado en secciones.
- Une toda la información en un solo objeto JSON.
- NO DUPLIQUES productos si aparecen en el solapamiento de las fotos.

REGLAS CRÍTICAS:
1. "comercio": STRING con el nombre comercial conocido (ej: "MERCADONA"), NO el nombre legal largo.
2. "fecha": formato "DD/MM/AAAA". Si no aparece, usa la fecha de hoy.
3. "total": el número FINAL pagado. Si hay varias partes, busca el TOTAL FINAL.
4. "productos": array con TODOS los productos, sin duplicar.
5. Cada producto: { "cantidad": number, "nombre_ticket": "texto literal", "nombre_base": "nombre limpio", "subtotal": number }
6. Responde SOLO con el JSON. Sin texto adicional, sin bloques de código, sin explicaciones.

FORMATO JSON ESTRICTO:
{
  "comercio": "string",
  "fecha": "DD/MM/AAAA",
  "total": number,
  "productos": [
    { "cantidad": number, "nombre_ticket": "string", "nombre_base": "string", "subtotal": number }
  ]
}

${userPrompt}`;
};

/**
 * Llama a Gemini 2.0 Flash con el token OAuth2 del usuario.
 * Envía las imágenes inline como parts multimodales.
 */
const analyzeWithGemini = async (
  userToken: string,
  images: string[],
  userPrompt: string
): Promise<any> => {
  // Construir las "parts" multimodales: texto + imágenes
  const parts: any[] = [
    { text: buildSystemPrompt(userPrompt) },
  ];

  // Añadir cada imagen como inline_data
  for (const img of images) {
    // Extraer el tipo MIME y los datos base64
    let mimeType = "image/jpeg";
    let base64Data = img;

    if (img.startsWith("data:")) {
      const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        // Fallback: quitar el prefijo data: genérico
        base64Data = img.split(",")[1] || img;
      }
    }

    parts.push({
      inlineData: {
        mimeType,
        data: base64Data,
      },
    });
  }

  const requestBody = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  };

  console.log(`[Gemini] Enviando ${images.length} imagen(es) con token del usuario...`);

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `Error ${response.status}`;

    // Error específico: falta de permiso de IA
    if (response.status === 403) {
      throw new Error("AI_PERMISSION_DENIED: El usuario no ha concedido el permiso de IA generativa. Debe reautorizarse.");
    }

    // Error de cuota del usuario
    if (response.status === 429) {
      throw new Error("AI_RATE_LIMIT: Has alcanzado el límite de uso de IA. Inténtalo de nuevo en unos minutos.");
    }

    // Token expirado
    if (response.status === 401) {
      throw new Error("AI_TOKEN_EXPIRED: Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
    }

    throw new Error(`Gemini error: ${errorMessage}`);
  }

  const data = await response.json();

  // Extraer el contenido de la respuesta de Gemini
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error("Gemini devolvió una respuesta vacía. Intenta con una foto más nítida.");
  }

  // Parsear el JSON de la respuesta
  try {
    return JSON.parse(textContent);
  } catch {
    // Intentar limpiar la respuesta si tiene markdown
    const cleaned = textContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  }
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

    // Extraer el token del usuario del header Authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "AI_PERMISSION_DENIED: No se recibió token de autorización. Activa la IA de Google para escanear tickets." },
        { status: 401 }
      );
    }
    const userToken = authHeader.replace("Bearer ", "");

    // ── LLAMADA ÚNICA A GEMINI ──────────────────────────────────────────────────
    console.log(`[Pipeline v3.0] ${images.length} imagen(es) → Gemini 2.0 Flash (token usuario)`);

    const result = await analyzeWithGemini(userToken, images, prompt || "");

    // ── Normalización defensiva del resultado ───────────────────────────────────
    let finalComercio = "SIN NOMBRE";
    if (result.comercio) {
      if (typeof result.comercio === "string" && result.comercio.trim()) {
        finalComercio = result.comercio;
      } else if (typeof result.comercio === "object") {
        const found = Object.values(result.comercio).find(
          (v) => typeof v === "string" && (v as string).length > 0
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

    console.log(
      `[Pipeline v3.0] Completado. Comercio: ${finalResponse.comercio}, Productos: ${finalResponse.productos.length}, Total: ${finalResponse.total}`
    );
    return NextResponse.json(finalResponse);
  } catch (error: any) {
    console.error("─── ERROR EN /api/analyze (v3.0) ───", error.message);

    // Propagar errores específicos con su código
    if (error.message.startsWith("AI_PERMISSION_DENIED")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.startsWith("AI_RATE_LIMIT")) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error.message.startsWith("AI_TOKEN_EXPIRED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || "Error interno al procesar el ticket." },
      { status: 500 }
    );
  }
}