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
    const { text, prompt } = await req.json();

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

    // 4. Ejecución del análisis OCR y estructuración
    console.log(`[Gemini 3 Flash] Analizando TEXTO OCR del ticket...`);
    
    const result = await model.generateContent([
      `Analiza el siguiente texto extraído de un ticket de compra mediante OCR. 
      Corrige posibles errores de lectura (como confusiones entre O y 0, o l y 1) basándote en el contexto de productos y precios.
      
      TEXTO DEL TICKET:
      """
      ${text}
      """
      
      ${prompt}
      
      Responde estrictamente con un JSON válido siguiendo la estructura solicitada.`
    ]);

    const response = await result.response;
    const iaText = response.text();

    if (!iaText) {
      throw new Error("La IA no generó una respuesta válida.");
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