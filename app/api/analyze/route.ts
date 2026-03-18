/* --- ARCHIVO: app/api/analyze/route.ts --- */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { images, prompt } = await req.json();

    // LEEMOS LA LLAVE DIRECTAMENTE DESDE EL SERVIDOR (SEGURIDAD TOTAL)
    const serverApiKey = process.env.GEMINI_API_KEY;

    if (!serverApiKey) {
      console.error("ERROR: GEMINI_API_KEY no encontrada en las variables de entorno del servidor.");
      return NextResponse.json(
        { error: "Configuración incompleta en el servidor (API Key faltante)." }, 
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(serverApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.1 
      }
    });

    const imageParts = images.map((img: string) => {
      const base64Data = img.includes(",") ? img.split(",")[1] : img;
      return {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      };
    });

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("Error en API Gemini:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al procesar con Gemini" }, 
      { status: 500 }
    );
  }
}