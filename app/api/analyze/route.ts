import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    if (i > 5) break;
  }
  return undefined;
};

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
    if (i > 5) break;
  }
  return undefined;
};

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
    if (i > 5) break;
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

export async function POST(req: Request) {
  try {
    const { images, prompt, mode } = await req.json();

    if (mode === "manual") {
      return NextResponse.json({ comercio: "MANUAL", productos: [], total: 0 });
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No se recibieron imágenes para analizar." }, { status: 400 });
    }

    let allRawTranscriptions: string[] = [];

    console.log(`[V2.0 Pipeline] Paso A: Iniciando Visión Distribuida con ${images.length} imágenes...`);

    if (images.length === 1) {
      let transcriptionAttempted = false;
      let mistralApiKeyIndex = 0;
      let geminiApiKeyIndex = 0;

      while (!transcriptionAttempted) {
        let mistralApiKey = getMistralApiKey(mistralApiKeyIndex);
        if (mistralApiKey) {
          try {
            const rawTranscription = await callMistralVision(mistralApiKey, images, "Transcribe literalmente este ticket de compra. Mantén los precios al lado de sus productos.");
            allRawTranscriptions.push(rawTranscription);
            transcriptionAttempted = true;
          } catch (error: any) {
            mistralApiKeyIndex++;
            if (!getMistralApiKey(mistralApiKeyIndex)) {
              let geminiApiKey = getGeminiApiKey(geminiApiKeyIndex);
              if (geminiApiKey) {
                try {
                  const rawTranscription = await callGeminiVision(geminiApiKey, images[0], "Transcribe literalmente este ticket de compra. Mantén los precios al lado de sus productos.");
                  allRawTranscriptions.push(rawTranscription);
                  transcriptionAttempted = true;
                } catch (geminiError: any) {
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
          let geminiApiKey = getGeminiApiKey(geminiApiKeyIndex);
          if (geminiApiKey) {
            try {
              const rawTranscription = await callGeminiVision(geminiApiKey, images[0], "Transcribe literalmente este ticket de compra. Mantén los precios al lado de sus productos.");
              allRawTranscriptions.push(rawTranscription);
              transcriptionAttempted = true;
            } catch (geminiError: any) {
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
      const visionPromises = images.map(async (img: string, index: number) => {
        let transcriptionAttempted = false;
        let mistralApiKeyIndex = 0;
        let geminiApiKeyIndex = 0;

        while (!transcriptionAttempted) {
          let mistralApiKey = getMistralApiKey(mistralApiKeyIndex);
          if (mistralApiKey) {
            try {
              const rawTranscription = await callMistralVision(mistralApiKey, [img], `Transcribe literalmente la imagen ${index + 1} de este ticket de compra. Mantén los precios al lado de sus productos.`);
              transcriptionAttempted = true;
              return rawTranscription;
            } catch (error: any) {
              mistralApiKeyIndex++;
              if (!getMistralApiKey(mistralApiKeyIndex)) {
                let geminiApiKey = getGeminiApiKey(geminiApiKeyIndex);
                if (geminiApiKey) {
                  try {
                    const rawTranscription = await callGeminiVision(geminiApiKey, img, `Transcribe literalmente la imagen ${index + 1} de este ticket de compra. Mantén los precios al lado de sus productos.`);
                    transcriptionAttempted = true;
                    return rawTranscription;
                  } catch (geminiError: any) {
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
            let geminiApiKey = getGeminiApiKey(geminiApiKeyIndex);
            if (geminiApiKey) {
              try {
                const rawTranscription = await callGeminiVision(geminiApiKey, img, `Transcribe literalmente la imagen ${index + 1} de este ticket de compra. Mantén los precios al lado de sus productos.`);
                transcriptionAttempted = true;
                return rawTranscription;
              } catch (geminiError: any) {
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
        throw new Error(`Fallo desconocido en la transcripción para la imagen ${index + 1}.`);
      });
      allRawTranscriptions = await Promise.all(visionPromises);
    } else {
      return NextResponse.json({ error: "Número de imágenes no soportado. Máximo 3." }, { status: 400 });
    }

    const combinedTranscription = Array.from(new Set(allRawTranscriptions.join("\n").split("\n"))).join("\n");
    if (!combinedTranscription.trim()) {
      throw new Error("Ningún modelo de visión pudo extraer texto.");
    }

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
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content: "Sintetiza texto de tickets en JSON. Asegura coherencia de totales y ajusta productos si hay discrepancias. Formato: {comercio, fecha, total, productos: [{cantidad, nombre_ticket, subtotal}]}."
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

          if (!groqResponse.ok) {
            const errorData = await groqResponse.json();
            if (groqResponse.status === 429 || groqResponse.status >= 500) {
              throw new Error(`Groq API error (status: ${groqResponse.status}), intentando con otra clave.`);
            } else {
              throw new Error(errorData.error?.message || "Error desconocido al razonar con Groq.");
            }
          }

          const groqData = await groqResponse.json();
          finalResult = groqData.choices[0].message.content;
          reasoningAttempted = true;
          break;
        } catch (error: any) {
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
    console.error("--- FALLO CRÍTICO PIPELINE V2.0 ---", error);
    return NextResponse.json({ error: error.message || "Error interno en el pipeline" }, { status: 500 });
  }
}
