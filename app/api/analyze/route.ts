/* --- ARCHIVO: app/api/analyze/route.ts --- */
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, prompt } = await req.json();

    // 1. Verificación de la API Key
    const mistralApiKey = process.env.MISTRAL_API_KEY;

    if (!mistralApiKey) {
      console.error("❌ ERROR: MISTRAL_API_KEY no configurada en Vercel.");
      return NextResponse.json(
        { error: "El servidor no tiene configurada la llave de Mistral." }, 
        { status: 500 }
      );
    }

    // 2. Validación de entrada
    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { error: "El texto del OCR está vacío o es demasiado corto." }, 
        { status: 400 }
      );
    }

    console.log(`[Mistral API] Procesando texto OCR (${text.length} caracteres)...`);

    // 3. Llamada a Mistral
    // Nota: Usamos mistral-small-latest si quieres ahorrar tokens/dinero, 
    // o mistral-large-latest para máxima precisión.
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model: "mistral-large-latest", 
        messages: [
          {
            role: "system",
            content: "Eres un experto en extracción de datos de tickets. Tu salida debe ser estrictamente un objeto JSON válido. No incluyas explicaciones ni markdown."
          },
          {
            role: "user",
            content: `Analiza este texto de ticket y devuelve un JSON siguiendo este prompt: ${prompt}. \n\n Texto del ticket: ${text}`
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" } // Mistral requiere que el prompt mencione "JSON"
      })
    });

    // 4. Manejo de errores de la API
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error de Mistral AI:", errorData);
      return NextResponse.json(
        { error: `Mistral error: ${errorData.message || response.statusText}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content;

    if (!resultText) {
      throw new Error("Mistral devolvió una respuesta vacía.");
    }

    // 5. Parsear y devolver
    try {
      const parsed = JSON.parse(resultText);
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("❌ Error parseando JSON de Mistral:", resultText);
      return NextResponse.json({ error: "La IA no devolvió un JSON válido." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("--- FALLO CRÍTICO EN API ANALYZE ---", error);
    return NextResponse.json(
      { error: error.message || "Error interno en el servidor" }, 
      { status: 500 }
    );
  }
}