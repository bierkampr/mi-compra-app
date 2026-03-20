import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Importación mantenida por si acaso, pero no usada activamente

const getMistralApiKey = (index: number = 0): string | undefined => {
  let key;
  let i = index;
  while (!key) {
    key = process.env[`MISTRAL_API_KEY_${i + 1}`];
    if (key) return key;
    if (i === 0) {
      key = process.env.MISTRAL_API_KEY;
      if (key) return key;
    }
    i++;
    if (i > 5) break; // Límite de búsqueda para evitar bucle infinito
  }
  return undefined;
};

// Gemini API key retrieval function is no longer needed for this specific task.
// Keeping it commented out for potential future use or reference.
/*
const getGeminiApiKey = (index: number = 0): string | undefined => {
  let key;
  let i = index;
  while (!key) {
    key = process.env[`GEMINI_API_KEY_${i + 1}`];
    if (key) return key;
    if (i === 0) {
      key = process.env.GEMINI_API_KEY;
      if (key) return key;
    }
    i++;
    if (i > 5) break; // Límite de búsqueda para evitar bucle infinito
  }
  return undefined;
};
*/

const getGroqApiKey = (index: number = 0): string | undefined => {
  let key;
  let i = index;
  while (!key) {
    key = process.env[`GROQ_API_KEY_${i + 1}`];
    if (key) return key;
    if (i === 0) {
      key = process.env.GROQ_API_KEY;
      if (key) return key;
    }
    i++;
    if (i > 5) break; // Límite de búsqueda para evitar bucle infinito
  }
  return undefined;
};

const callMistralVision = async (apiKey: string, images: string[], instruction: string) => {
  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: instruction },
        ...images.map((img: string) => ({
          type: "image_url",
          image_url: { url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}` }
        }))
      ]
    }
  ];

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "pixtral-large-latest", // Modelo específico para visión de Mistral
      messages: messages,
      max_tokens: 1000
    })
  });

  const data = await response.json();
  if (!response.ok || !data.choices?.[0]?.message?.content) {
    console.error("Error en Mistral Vision:", data);
    // Lanzamos un error más específico si el contenido no está presente o la respuesta no es OK
    throw new Error(data.error?.message || `Mistral API error: ${response.status} - ${data.error?.type || 'Unknown error'}`);
  }
  return data.choices[0].message.content;
};

// Gemini function removed as it's no longer used for vision processing.
/*
const callGeminiVision = async (apiKey: string, image: string, instruction: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const base64ToGenerativePart = (base64String: string) => {
    const parts = base64String.split(";base64,");
    const mimeType = parts[0].split(":")[1];
    const data = parts[1];
    return { inlineData: { data, mimeType } };
  };

  const result = await model.generateContent([
    instruction,
    base64ToGenerativePart(image)
  ]);
  const response = await result.response;
  const text = response.text();
  if (!text) {
    throw new Error("Error al transcribir con Gemini.");
  }
  return text;
};
*/

export async function POST(req: Request) {
  try {
    const { images, prompt, mode } = await req.json();

    if (mode === "manual") {
      return NextResponse.json({ comercio: "MANUAL", productos: [], total: 0 });
    }

    if (!images || images.length === 0) {
      // Este check ya está en el cliente, pero es bueno tenerlo aquí también.
      return NextResponse.json({ error: "No se recibieron imágenes para analizar." }, { status: 400 });
    }

    let allRawTranscriptions: string[] = [];

    console.log(`[V2.0 Pipeline] Paso A: Iniciando Visión SOLO con Mistral...`);

    if (images.length === 1) {
      let transcriptionAttempted = false;
      let mistralApiKeyIndex = 0;

      while (!transcriptionAttempted) {
        const mistralApiKey = getMistralApiKey(mistralApiKeyIndex);
        if (mistralApiKey) {
          try {
            console.log(`Intentando transcripción con Mistral (1 foto) - Clave ${mistralApiKeyIndex + 1}...`);
            const rawTranscription = await callMistralVision(mistralApiKey, images, "Transcribe literalmente este ticket de compra. Mantén los precios al lado de sus productos.");
            allRawTranscriptions.push(rawTranscription);
            transcriptionAttempted = true;
          } catch (error: any) {
            console.error(`Fallo en Mistral para 1 foto (Clave ${mistralApiKeyIndex + 1}):`, error.message);
            mistralApiKeyIndex++;
            if (!getMistralApiKey(mistralApiKeyIndex)) {
              // Si no quedan más claves de Mistral, lanzamos el error final.
              throw new Error("Todas las claves de Mistral han fallado para procesar la imagen.");
            }
          }
        } else {
          // Si no hay claves de Mistral disponibles desde el principio.
          throw new Error("No hay claves de Mistral configuradas.");
        }
      }
    } else if (images.length > 1 && images.length <= 3) {
      // Procesamos imágenes en paralelo, cada una intentando con Mistral.
      const visionPromises = images.map(async (img: string, index: number) => {
        let transcriptionAttempted = false;
        let mistralApiKeyIndex = 0;

        while (!transcriptionAttempted) {
          const mistralApiKey = getMistralApiKey(mistralApiKeyIndex);
          if (mistralApiKey) {
            try {
              console.log(`Intentando transcripción de imagen ${index + 1} con Mistral - Clave ${mistralApiKeyIndex + 1}...`);
              const rawTranscription = await callMistralVision(mistralApiKey, [img], `Transcribe literalmente la imagen ${index + 1} de este ticket de compra. Mantén los precios al lado de sus productos.`);
              transcriptionAttempted = true;
              return rawTranscription;
            } catch (error: any) {
              console.error(`Fallo en Mistral para imagen ${index + 1} (Clave ${mistralApiKeyIndex + 1}):`, error.message);
              mistralApiKeyIndex++;
              if (!getMistralApiKey(mistralApiKeyIndex)) {
                // Si no quedan más claves de Mistral para esta imagen específica.
                throw new Error(`Todas las claves de Mistral han fallado para la imagen ${index + 1}.`);
              }
            }
          } else {
            // Si no hay claves de Mistral disponibles para esta imagen.
            throw new Error(`No hay claves de Mistral disponibles para la imagen ${index + 1}.`);
          }
        }
        // Si el bucle termina sin éxito (lo cual no debería ocurrir si los throws funcionan)
        throw new Error(`Fallo desconocido en la transcripción para la imagen ${index + 1} con Mistral.`);
      });

      allRawTranscriptions = await Promise.all(visionPromises);
    } else {
      // Ya cubierto en el check inicial, pero por si acaso.
      return NextResponse.json({ error: "Número de imágenes no soportado. Máximo 3." }, { status: 400 });
    }

    // Verificación final de transcripción combinada
    const combinedTranscription = Array.from(new Set(allRawTranscriptions.join("\n").split("\n"))).join("\n");
    if (!combinedTranscription.trim()) {
      // Si después de todos los intentos Mistral no pudo extraer texto.
      throw new Error("Mistral no pudo extraer texto válido de las imágenes.");
    }

    // --- PASO B: RAZONAMIENTO (Groq / Llama 3.3 70B como sintetizador) ---
    // MANTENEMOS GROQ PARA EL RAZONAMIENTO SEGÚN ARQUITECTURA ORIGINAL
    console.log("[V2.0 Pipeline] Paso B: Iniciando Razonamiento y Validación con Groq...");
    let groqApiKeyIndex = 0;
    let reasoningAttempted = false;
    let finalResult: string | undefined;

    while (!reasoningAttempted) {
      let groqApiKey = getGroqApiKey(groqApiKeyIndex);
      if (groqApiKey) {
        try {
          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile", // Modelo de razonamiento
              messages: [
                {
                  role: "system",
                  content: "Sintetiza texto de tickets en JSON. Asegura coherencia de totales y ajusta productos si hay discrepancias. Formato: {comercio, fecha, total, productos: [{cantidad, nombre_ticket, subtotal}]}. Solo responde con el JSON."
                },
                {
                  role: "user",
                  content: `${prompt} \n\n TEXTO TRANSCRITO (Mistral): \n ${combinedTranscription}`
                }
              ],
              temperature: 0.1,
              response_format: { type: "json_object" }
            })
          });

          if (!groqResponse.ok) {
            const errorData = await groqResponse.json();
            console.error("Error en Groq API:", errorData);
            if (groqResponse.status === 429 || groqResponse.status >= 500) {
              throw new Error(`Groq API error (status: ${groqResponse.status}), intentando con otra clave.`);
            } else {
              throw new Error(errorData.error?.message || "Error desconocido al razonar con Groq.");
            }
          }

          const groqData = await groqResponse.json();
          if (!groqData.choices?.[0]?.message?.content) {
            throw new Error("Groq no pudo generar un contenido válido.");
          }
          finalResult = groqData.choices[0].message.content;
          reasoningAttempted = true;
          break;
        } catch (error: any) {
          console.error("Fallo en Groq, intentando con otra clave:", error.message);
          groqApiKeyIndex++;
          if (!getGroqApiKey(groqApiKeyIndex)) {
            throw new Error("Todas las claves de Groq han fallado para el razonamiento.");
          }
        }
      } else {
        throw new Error("No hay claves de Groq disponibles para el razonamiento.");
      }
    }

    if (!finalResult) {
      throw new Error("El modelo de razonamiento no pudo generar un resultado final.");
    }
    return NextResponse.json(JSON.parse(finalResult));

  } catch (error: any) {
    console.error("--- FALLO CRÍTICO PIPELINE (Mistral Vision / Groq Reasoning) ---", error);
    // Capturamos errores tanto de visión (Mistral) como de razonamiento (Groq).
    return NextResponse.json({ error: error.message || "Error interno en el pipeline" }, { status: 500 });
  }
}