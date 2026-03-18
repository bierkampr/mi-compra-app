/* --- ARCHIVO: app/api/analyze/route.ts --- */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * Handler de servidor para procesar tickets con el modelo Gemini Flash más reciente.
 * El uso del alias "-latest" garantiza que la app siempre use la versión más optimizada.
 */
export async function POST(req: Request) {
  try {
    const { images, prompt } = await req.json();

    // 1. Validar presencia de la API KEY en el servidor (Vercel)
    const serverApiKey = process.env.GEMINI_API_KEY;

    if (!serverApiKey) {
      console.error("ERROR: GEMINI_API_KEY no configurada en las variables de entorno.");
      return NextResponse.json(
        { error: "La configuración del servidor no incluye la clave de acceso a la IA." }, 
        { status: 500 }
      );
    }

    // 2. Inicializar el SDK de Google
    const genAI = new GoogleGenerativeAI(serverApiKey);
    
    // Usamos el alias universal para tener siempre la última versión estable
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0 // Precisión absoluta para evitar errores en números
      }
    });

    // 3. Preparar los datos de imagen (Base64 puro)
    const imageParts = images.map((img: string) => {
      const base64Data = img.includes(",") ? img.split(",")[1] : img;
      return {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      };
    });

    // 4. Llamada a la IA con instrucciones de formato estrictas
    console.log(`[API Analyze] Procesando ticket con gemini-flash-latest...`);
    
    const result = await model.generateContent([
      prompt + "\n\nResponde estrictamente con un JSON válido. Sin texto introductorio.",
      ...imageParts
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("El modelo no generó ninguna respuesta.");
    }

    // 5. Limpieza de formato Markdown y parseo
    const cleanJsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
        const parsed = JSON.parse(cleanJsonString);
        return NextResponse.json(parsed);
    } catch (parseError) {
        console.error("Error al parsear el JSON de la IA:", text);
        throw new Error("La respuesta de la IA no tiene un formato válido.");
    }

  } catch (error: any) {
    console.error("--- FALLO CRÍTICO EN API ROUTE ---");
    console.error(error);

    return NextResponse.json(
      { error: `Error en el motor de IA: ${error.message}` }, 
      { status: 500 }
    );
  }
}