/* --- ARCHIVO: app/api/analyze/route.ts --- */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { images, prompt } = await req.json();

    // 1. Verificar la API KEY en el servidor
    const serverApiKey = process.env.GEMINI_API_KEY;

    if (!serverApiKey) {
      return NextResponse.json(
        { error: "API Key de Gemini no configurada en Vercel." }, 
        { status: 500 }
      );
    }

    // 2. Inicializar Google AI
    const genAI = new GoogleGenerativeAI(serverApiKey);
    
    // USAMOS EL MODELO QUE APARECE EN TU LISTA: gemini-2.0-flash
    // Es más rápido y preciso que el 1.5
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
    });

    // 3. Preparar las imágenes
    const imageParts = images.map((img: string) => {
      const base64Data = img.includes(",") ? img.split(",")[1] : img;
      return {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      };
    });

    // 4. Ejecutar el análisis
    // Gemini 2.0 maneja mucho mejor el formato JSON nativo
    const result = await model.generateContent([
      prompt + "\n\nResponde únicamente en formato JSON puro.",
      ...imageParts
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("La IA devolvió una respuesta vacía.");
    }

    // Limpieza de Markdown (por seguridad si la IA lo añade)
    const cleanJsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json(JSON.parse(cleanJsonString));

  } catch (error: any) {
    console.error("--- ERROR EN API ROUTE GEMINI 2.0 ---");
    console.error(error);

    return NextResponse.json(
      { error: `Error de IA: ${error.message}` }, 
      { status: 500 }
    );
  }
}