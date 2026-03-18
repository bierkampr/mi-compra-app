/* --- ARCHIVO: app/api/analyze/route.ts --- */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * BRIDGE DE SERVIDOR PARA GEMINI 3 FLASH PREVIEW
 * Procesa las imágenes de los tickets utilizando el motor más reciente de Google.
 * Esta ruta se ejecuta en el servidor (Vercel) para proteger la API Key y 
 * evitar bloqueos regionales en España/UE.
 */
export async function POST(req: Request) {
  try {
    // 1. Recepción de datos del cliente
    const { images, prompt } = await req.json();

    // 2. Acceso seguro a la API KEY (Configurada en el Dashboard de Vercel)
    const serverApiKey = process.env.GEMINI_API_KEY;

    if (!serverApiKey) {
      console.error("CRÍTICO: GEMINI_API_KEY no encontrada en el servidor.");
      return NextResponse.json(
        { error: "Error de configuración: El servidor no tiene acceso a la IA." }, 
        { status: 500 }
      );
    }

    // 3. Inicialización del SDK de Google Generative AI
    const genAI = new GoogleGenerativeAI(serverApiKey);
    
    /**
     * Configuramos el modelo 'gemini-flash-latest'.
     * En marzo de 2026, este alias apunta a Gemini 3 Flash Preview.
     */
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { 
        // Obligamos a la IA a responder en formato JSON puro
        responseMimeType: "application/json",
        temperature: 0.1 // Mínima aleatoriedad para datos numéricos precisos
      }
    });

    // 4. Transformación de imágenes para el SDK
    if (!images || !Array.isArray(images)) {
      throw new Error("Formato de imágenes no válido.");
    }

    const imageParts = images.map((img: string) => {
      // Extraemos el contenido base64 puro eliminando el encabezado de data:image/jpeg
      const base64Data = img.includes(",") ? img.split(",")[1] : img;
      return {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      };
    });

    // 5. Ejecución del análisis OCR y estructuración
    console.log(`[Gemini 3 Flash] Analizando ticket con ${images.length} capturas...`);
    
    const result = await model.generateContent([
      prompt + "\n\nResponde estrictamente con un JSON válido siguiendo la estructura solicitada.",
      ...imageParts
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("La IA no generó una respuesta válida.");
    }

    // 6. Limpieza y validación del JSON
    // Eliminamos posibles bloques de markdown que la IA pudiera incluir por error
    const cleanJsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
        const parsedData = JSON.parse(cleanJsonString);
        return NextResponse.json(parsedData);
    } catch (parseError) {
        console.error("Error al parsear respuesta de IA:", text);
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