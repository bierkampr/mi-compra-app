/* --- ARCHIVO: app/api/analyze/route.ts --- */
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Función para obtener una clave de API de Mistral de forma rotativa
const getMistralApiKey = (index: number = 0): string | undefined => {
  let key;
  let i = index;
  while (!key) {
    key = process.env[`MISTRAL_API_KEY_${i + 1}`];
    if (key) return key;
    if (i === 0) {
      // Si la primera clave no existe, comprobamos la clave sin número para compatibilidad
      key = process.env.MISTRAL_API_KEY;
      if (key) return key;
    }
    i++;
    if (i > 5) break; // Límite de búsqueda para evitar bucle infinito
  }
  return undefined;
};

// Función para obtener una clave de API de Gemini de forma rotativa
const getGeminiApiKey = (index: number = 0): string | undefined => {
  let key;
  let i = index;
  while (!key) {
    key = process.env[`GEMINI_API_KEY_${i + 1}`];
    if (key) return key;
    if (i === 0) {
      // Si la primera clave no existe, comprobamos la clave sin número para compatibilidad
      key = process.env.GEMINI_API_KEY;
      if (key) return key;
    }
    i++;
    if (i > 5) break; // Límite de búsqueda para evitar bucle infinito
  }
  return undefined;
};

// Función para obtener una clave de API de Groq de forma rotativa
const getGroqApiKey = (index: number = 0): string | undefined => {
  let key;
  let i = index;
  while (!key) {
    key = process.env[`GROQ_API_KEY_${i + 1}`];
    if (key) return key;
    if (i === 0) {
      // Si la primera clave no existe, comprobamos la clave sin número para compatibilidad
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
          image_url: { url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}` }
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
      model: "pixtral-large-latest",
      messages: messages,
      max_tokens: 1000
    })
  });

  const data = await response.json();
  if (!response.ok || !data.choices?.[0]?.message?.content) {
    console.error("Error en Mistral Vision:", data);
    throw new Error(data.error?.message || "Error al transcribir con Mistral.");
  }
  return data.choices[0].message.content;
};

const callGeminiVision = async (apiKey: string, image: string, instruction: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const base64ToGenerativePart = (base64String: string) => {
    const parts = base64String.split(';base64,');
    const mimeType = parts[0].split(':')[1];
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

export async function POST(req: Request) {
  try {
    const { images, prompt, mode } = await req.json();

    if (mode === 'manual') {
      return NextResponse.json({ comercio: "MANUAL", productos: [], total: 0 });
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No se recibieron imágenes para analizar." }, { status: 400 });
    }

    let allRawTranscriptions: string[] = [];

    // --- PASO A: VISIÓN DISTRIBUIDA ---
    console.log(`[V2.0 Pipeline] Paso A: Iniciando Visión Distribuida con ${images.length} imágenes...`);

    if (images.length === 1) {
      // Lógica para 1 foto: Mistral con fallback a Gemini
      let transcriptionAttempted = false;
      let mistralApiKeyIndex = 0;
      let geminiApiKeyIndex = 0;

      while (!transcriptionAttempted) {
        let mistralApiKey = getMistralApiKey(mistralApiKeyIndex);
        if (mistralApiKey) {
          try {
            console.log("Intentando transcripción con Mistral (1 foto)...");
            const rawTranscription = await callMistralVision(mistralApiKey, images, "Transcribe literalmente este ticket de compra. Mantén los precios al lado de sus productos.");
            allRawTranscriptions.push(rawTranscription);
            transcriptionAttempted = true;
            break;
          } catch (error: any) {
            console.error("Fallo en Mistral para 1 foto, intentando con otra clave o fallback:", error.message);
            mistralApiKeyIndex++;
            if (!getMistralApiKey(mistralApiKeyIndex)) {
              // Si no hay más claves de Mistral, intentamos con Gemini
              let geminiApiKey = getGeminiApiKey(geminiApiKeyIndex);
              if (geminiApiKey) {
                try {
                  console.log("Fallo en todas las claves de Mistral. Intentando transcripción con Gemini (1 foto)...");
                  const rawTranscription = await callGeminiVision(geminiApiKey, images[0], "Transcribe literalmente este ticket de compra. Mantén los precios al lado de sus productos.");
                  allRawTranscriptions.push(rawTranscription);
                  transcriptionAttempted = true;
                  break;
                } catch (geminiError: any) {
                  console.error("Fallo en Gemini para 1 foto, intentando con otra clave:", geminiError.message);
                  geminiApiKeyIndex++;
                  if (!getGeminiApiKey(geminiApiKeyIndex)) {
                    throw new Error("Todas las APIs de visión han fallado para 1 foto.");
                  }
                }
              } else {
                throw new Error("Todas las APIs de visión han fallado para 1 foto.");
              }
            }
          }
        } else {
          // Si no hay claves de Mistral desde el principio, intentamos con Gemini
          let geminiApiKey = getGeminiApiKey(geminiApiKeyIndex);
          if (geminiApiKey) {
            try {
              console.log("No hay claves de Mistral. Intentando transcripción con Gemini (1 foto)...");
              const rawTranscription = await callGeminiVision(geminiApiKey, images[0], "Transcribe literalmente este ticket de compra. Mantén los precios al lado de sus productos.");
              allRawTranscriptions.push(rawTranscription);
              transcriptionAttempted = true;
              break;
            } catch (geminiError: any) {
              console.error("Fallo en Gemini para 1 foto, intentando con otra clave:", geminiError.message);
              geminiApiKeyIndex++;
              if (!getGeminiApiKey(geminiApiKeyIndex)) {
                throw new Error("Todas las APIs de visión han fallado para 1 foto.");
              }
            }
          } else {
            throw new Error("Todas las APIs de visión han fallado para 1 foto.");
          }
        }
      }
    } else if (images.length > 1 && images.length <= 3) {
      // Lógica para 2 o 3 fotos: Cada imagen a una IA distinta
      const visionPromises = images.map(async (img: string, index: number) => {
        let transcriptionAttempted = false;
        let mistralApiKeyIndex = 0;
        let geminiApiKeyIndex = 0;

        while (!transcriptionAttempted) {
          let mistralApiKey = getMistralApiKey(mistralApiKeyIndex);
          if (mistralApiKey) {
            try {
              console.log(`Intentando transcripción de imagen ${index + 1} con Mistral...`);
              const rawTranscription = await callMistralVision(mistralApiKey, [img], `Transcribe literalmente la imagen ${index + 1} de este ticket de compra. Mantén los precios al lado de sus productos.`);
              transcriptionAttempted = true;
              return rawTranscription;
            } catch (error: any) {
              console.error(`Fallo en Mistral para imagen ${index + 1}, intentando con otra clave o fallback:`, error.message);
              mistralApiKeyIndex++;
              if (!getMistralApiKey(mistralApiKeyIndex)) {
                // Si no hay más claves de Mistral, intentamos con Gemini
                let geminiApiKey = getGeminiApiKey(geminiApiKeyIndex);
                if (geminiApiKey) {
                  try {
                    console.log(`Fallo en todas las claves de Mistral. Intentando transcripción de imagen ${index + 1} con Gemini...`);
                    const rawTranscription = await callGeminiVision(geminiApiKey, img, `Transcribe literalmente la imagen ${index + 1} de este ticket de compra. Mantén los precios al lado de sus productos.`);
                    transcriptionAttempted = true;
                    return rawTranscription;
                  } catch (geminiError: any) {
                    console.error(`Fallo en Gemini para imagen ${index + 1}, intentando con otra clave:`, geminiError.message);
                    geminiApiKeyIndex++;
                    if (!getGeminiApiKey(geminiApiKeyIndex)) {
                      throw new Error(`Todas las APIs de visión han fallado para la imagen ${index + 1}.`);
                    }
                  }
                } else {
                  throw new Error(`Todas las APIs de visión han fallado para la imagen ${index + 1}.`);
                }
              }
            }
          } else {
            // Si no hay claves de Mistral desde el principio, intentamos con Gemini
            let geminiApiKey = getGeminiApiKey(geminiApiKeyIndex);
            if (geminiApiKey) {
              try {
                console.log(`No hay claves de Mistral. Intentando transcripción de imagen ${index + 1} con Gemini...`);
                const rawTranscription = await callGeminiVision(geminiApiKey, img, `Transcribe literalmente la imagen ${index + 1} de este ticket de compra. Mantén los precios al lado de sus productos.`);
                transcriptionAttempted = true;
                return rawTranscription;
              } catch (geminiError: any) {
                console.error(`Fallo en Gemini para imagen ${index + 1}, intentando con otra clave:`, geminiError.message);
                geminiApiKeyIndex++;
                if (!getGeminiApiKey(geminiApiKeyIndex)) {
                  throw new Error(`Todas las APIs de visión han fallado para la imagen ${index + 1}.`);
                }
              }
            } else {
              throw new Error(`Todas las APIs de visión han fallado para la imagen ${index + 1}.`);
            }
          }
        }
        // Esto no debería ser alcanzado si la lógica es correcta y siempre hay un throw
        throw new Error(`Fallo desconocido en la transcripción para la imagen ${index + 1}.`);
      });

      allRawTranscriptions = await Promise.all(visionPromises);

    } else {
      return NextResponse.json({ error: "Número de imágenes no soportado. Máximo 3." }, { status: 400 });
    }

    const combinedTranscription = Array.from(new Set(allRawTranscriptions.join('\n').split('\n'))).join('\n');

    if (!combinedTranscription.trim()) {
      throw new Error("Ningún modelo de visión pudo extraer texto.");
    }

    // --- PASO B: RAZONAMIENTO (Groq / Llama 3.3 70B o Gemini Pro como fallback) ---
    console.log("[V2.0 Pipeline] Paso B: Iniciando Razonamiento y Validación...");

    let groqApiKeyIndex = 0;
    let geminiApiKeyIndexForReasoning = 0; // Usar un índice separado para Gemini Pro
    let reasoningAttempted = false;
    let finalResult: string | undefined;

    while (!reasoningAttempted) {
      let groqApiKey = getGroqApiKey(groqApiKeyIndex);
      if (groqApiKey) {
        try {
          console.log("Intentando razonamiento con Groq...");
          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content: "Eres un experto contable. Tu salida debe ser exclusivamente JSON. Debes asegurar que la suma de subtotales de los productos coincida con el total indicado. Si hay discrepancias, prioriza el total del ticket y ajusta los subtotales de forma lógica."
                },
                {
                  role: "user",
                  content: `${prompt} \n\n TEXTO TRANSCRITO: \n ${combinedTranscription}`
                }
              ],
              temperature: 0.1,
              response_format: { type: "json_object" }
            })
          });

          const groqData = await groqResponse.json();
          if (!groqResponse.ok || !groqData.choices?.[0]?.message?.content) {
            throw new Error(groqData.error?.message || "Error al razonar con Groq.");
          }
          finalResult = groqData.choices[0].message.content;
          reasoningAttempted = true;
          break;
        } catch (error: any) {
          console.error("Fallo en Groq, intentando con otra clave o fallback a Gemini Pro:", error.message);
          groqApiKeyIndex++;
          if (!getGroqApiKey(groqApiKeyIndex)) {
            // Si no hay más claves de Groq, intentamos con Gemini Pro
            let geminiProApiKey = getGeminiApiKey(geminiApiKeyIndexForReasoning);
            if (geminiProApiKey) {
              try {
                console.log("Fallo en todas las claves de Groq. Intentando razonamiento con Gemini Pro...");
                const genAI = new GoogleGenerativeAI(geminiProApiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });

                const result = await model.generateContent([
                  { role: "system", content: "Eres un experto contable. Tu salida debe ser exclusivamente JSON. Debes asegurar que la suma de subtotales de los productos coincida con el total indicado. Si hay discrepancias, prioriza el total del ticket y ajusta los subtotales de forma lógica." },
                  { role: "user", content: `${prompt} \n\n TEXTO TRANSCRITO: \n ${combinedTranscription}` }
                ]);
                const response = await result.response;
                const text = response.text();
                if (!text) {
                  throw new Error("Error al razonar con Gemini Pro.");
                }
                finalResult = text;
                reasoningAttempted = true;
                break;
              } catch (geminiProError: any) {
                console.error("Fallo en Gemini Pro, intentando con otra clave:", geminiProError.message);
                geminiApiKeyIndexForReasoning++;
                if (!getGeminiApiKey(geminiApiKeyIndexForReasoning)) {
                  throw new Error("Todas las APIs de razonamiento han fallado.");
                }
              }
            } else {
              throw new Error("Todas las APIs de razonamiento han fallado.");
            }
          }
        }
      } else {
        // Si no hay claves de Groq desde el principio, intentamos con Gemini Pro
        let geminiProApiKey = getGeminiApiKey(geminiApiKeyIndexForReasoning);
        if (geminiProApiKey) {
          try {
            console.log("No hay claves de Groq. Intentando razonamiento con Gemini Pro...");
            const genAI = new GoogleGenerativeAI(geminiProApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const result = await model.generateContent([
              { role: "system", content: "Eres un experto contable. Tu salida debe ser exclusivamente JSON. Debes asegurar que la suma de subtotales de los productos coincida con el total indicado. Si hay discrepancias, prioriza el total del ticket y ajusta los subtotales de forma lógica." },
              { role: "user", content: `${prompt} \n\n TEXTO TRANSCRITO: \n ${combinedTranscription}` }
            ]);
            const response = await result.response;
            const text = response.text();
            if (!text) {
              throw new Error("Error al razonar con Gemini Pro.");
            }
            finalResult = text;
            reasoningAttempted = true;
            break;
          } catch (geminiProError: any) {
            console.error("Fallo en Gemini Pro, intentando con otra clave:", geminiProError.message);
            geminiApiKeyIndexForReasoning++;
            if (!getGeminiApiKey(geminiApiKeyIndexForReasoning)) {
              throw new Error("Todas las APIs de razonamiento han fallado.");
            }
          }
        } else {
          throw new Error("Todas las APIs de razonamiento han fallado.");
        }
      }
    }

    if (!finalResult) {
      throw new Error("El modelo de razonamiento no pudo generar un resultado final.");
    }

    return NextResponse.json(JSON.parse(finalResult));

  } catch (error: any) {
    console.error("--- FALLO CRÍTICO PIPELINE V2.0 ---", error);
    return NextResponse.json({ error: error.message || "Error interno en el pipeline" }, { status: 500 });
  }
}