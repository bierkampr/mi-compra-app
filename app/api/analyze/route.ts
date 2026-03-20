/* --- ARCHIVO: app/api/analyze/route.ts --- */

import { NextResponse } from "next/server";

/**
 * BRIDGE DE SERVIDOR PARA MISTRAL AI
 * Procesa los tickets utilizando el modelo Mistral Large.
 * Esta ruta se ejecuta en el servidor (Vercel) para proteger la API Key y 
 * optimizar el rendimiento y la flexibilidad.
 */
export async function POST(req: Request) {
  try {
    // 1. Recepción de datos del cliente
    const { text, prompt } = await req.json();

    // 2. Acceso seguro a la API KEY (Configurada en el Dashboard de Vercel)
    const mistralApiKey = process.env.MISTRAL_API_KEY;

    if (!mistralApiKey) {
      console.error("CRÍTICO: MISTRAL_API_KEY no encontrada en el servidor.");
      return NextResponse.json(
        { error: "Error de configuración: El servidor no tiene acceso a la IA." }, 
        { status: 500 }
      );
    }

    // 3. Configuración y llamada a la API de Mistral
    console.log(`[Mistral Large] Analizando TEXTO OCR del ticket...`);
    
    const messages = [
      {
        role: "system",
        content: `Eres un asistente experto en analizar tickets de compra. Tu tarea es extraer la información relevante y estructurarla en un JSON.
                  Corrige posibles errores de OCR (como confusiones entre O y 0, o l y 1) basándote en el contexto de productos y precios.
                  Siempre responde SÓLO con el JSON solicitado, sin texto adicional, explicaciones o markdown.`
      },
      {
        role: "user",
        content: `Aquí está el texto extraído de un ticket de compra:
                  """
                  ${text}
                  """
                  
                  ${prompt}
                  
                  Necesito un JSON estrictamente con la siguiente estructura:
                  {
                    "comercio": "[string, nombre del comercio]",
                    "fecha": "[string, fecha de compra en formato DD/MM/YYYY]",
                    "total": [number, total de la compra],
                    "productos": [
                      {
                        "cantidad": [number, cantidad del producto],
                        "nombre_ticket": "[string, nombre tal cual en el ticket]",
                        "nombre_base": "[string, nombre normalizado/común]",
                        "subtotal": [number, subtotal del producto]
                      }
                    ]
                  }
                  Asegúrate de que todos los campos sean del tipo correcto y los números estén en formato numérico (usando "." como separador decimal).`
      }
    ];

    const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model: "mistral-large-latest", // O mistral-medium-latest
        messages,
        temperature: 0.1, // Mínima aleatoriedad para datos numéricos precisos
        response_format: { type: "json_object" } // Forzar respuesta JSON
      })
    });

    if (!mistralResponse.ok) {
      const errorBody = await mistralResponse.json().catch(() => ({ message: "Error desconocido de Mistral" }));
      console.error("Error de Mistral API:", mistralResponse.status, errorBody);
      throw new Error(errorBody.message || `Error de la API de Mistral: ${mistralResponse.status}`);
    }

    const mistralData = await mistralResponse.json();
    const iaText = mistralData.choices[0]?.message?.content;

    if (!iaText) {
      throw new Error("Mistral no generó una respuesta válida.");
    }

    // 6. Limpieza y validación del JSON
    // Eliminamos posibles bloques de markdown que la IA pudiera incluir por error
    const cleanJsonString = iaText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
        const parsedData = JSON.parse(cleanJsonString);
        return NextResponse.json(parsedData);
    } catch (parseError) {
        console.error("Error al parsear respuesta de IA:", iaText);
        return NextResponse.json(
            { error: "La respuesta de la IA tiene un formato inválido." }, 
            { status: 500 }
        );
    }

  } catch (error: any) {
    console.error("--- FALLO EN PROCESAMIENTO GEMINI 3 ---");
    console.error(error);

    let message = error.message || "Error interno en el servidor de análisis";
    
    // Manejo de errores de cuota o región
    if (message.includes("429") || message.includes("quota")) {
        message = "Límite de peticiones alcanzado. Por favor, espera un minuto.";
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}