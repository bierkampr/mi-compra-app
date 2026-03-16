/* --- INICIO ARCHIVO: lib/gemini.ts --- */

import { MISTRAL_API_KEY } from "./config";

/**
 * Envía las imágenes de los tickets a Mistral AI (Pixtral) para su análisis.
 * Incluye gestión de errores robusta para evitar bloqueos en iOS/Android.
 */
export const analyzeReceipt = async (base64Images: string[], mode: string, customPrompt: string) => {
  try {
    if (!MISTRAL_API_KEY) {
      throw new Error("La llave de API de Mistral no está configurada.");
    }

    // El modo manual no requiere procesamiento de IA
    if (mode === 'manual') {
      return { 
        comercio: "INGRESO MANUAL", 
        fecha: new Date().toLocaleDateString('es-ES'), 
        total: 0, 
        productos: [] 
      };
    }

    const url = "https://api.mistral.ai/v1/chat/completions";

    // Preparamos el contenido multimedia siguiendo el esquema oficial de Mistral
    const imageContent = base64Images.map(img => ({
      type: "image_url",
      image_url: { url: img } // Formato de objeto anidado para mayor compatibilidad
    }));

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${MISTRAL_API_KEY}`, 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        "model": "pixtral-12b-2409",
        "messages": [
          { 
            "role": "user", 
            "content": [
              { "type": "text", "text": customPrompt }, 
              ...imageContent
            ] 
          }
        ],
        "response_format": { "type": "json_object" },
        "temperature": 0
      }),
      // Evita que navegadores móviles (iOS) mantengan conexiones latentes que causen 429 falsos
      keepalive: false 
    });

    // --- MANEJO DE ERRORES DETALLADO ---
    if (!response.ok) {
      let errorMessage = `Error ${response.status}`;
      try {
        const errorJson = await response.json();
        // Si es un 429, especificamos que es por límite de velocidad/cuota
        if (response.status === 429) {
          errorMessage = "Límite de velocidad excedido (429). Por favor, espera un momento antes de reintentar.";
        } else {
          errorMessage = errorJson.error?.message || errorMessage;
        }
      } catch (e) {
        errorMessage = "Error de conexión con la IA. Verifica tu internet.";
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Verificamos que la respuesta contenga los datos esperados antes de procesar
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message?.content) {
      throw new Error("La IA devolvió una respuesta vacía o incompleta.");
    }

    const result = JSON.parse(data.choices[0].message.content);

    // --- LÓGICA DE LIMPIEZA DE COMERCIO (Evita el error [object Object]) ---
    let finalComercio = "SIN NOMBRE";
    
    if (result.comercio) {
      if (typeof result.comercio === 'string' && result.comercio.trim() !== "") {
        finalComercio = result.comercio;
      } else if (typeof result.comercio === 'object') {
        // Si la IA devuelve un objeto, buscamos cualquier string dentro de sus valores
        const found = Object.values(result.comercio).find(v => typeof v === 'string' && v.length > 0);
        if (found) finalComercio = found as string;
      }
    }

    // Retornamos el objeto estructurado y limpio
    return {
      comercio: finalComercio.toUpperCase().trim(),
      fecha: result.fecha || new Date().toLocaleDateString('es-ES'),
      total: Number(result.total) || 0,
      productos: (result.productos || []).map((p: any) => ({
        cantidad: Number(p.cantidad) || 1,
        nombre_ticket: String(p.nombre_ticket || "PRODUCTO"),
        nombre_base: String(p.nombre_base || p.nombre_ticket || "PRODUCTO"),
        subtotal: Number(p.subtotal) || 0
      }))
    };
  } catch (error: any) {
    console.error("DEBUG IA ERROR:", error);
    // Propagamos el error con un mensaje limpio para el usuario
    throw new Error(error.message || "Error desconocido al procesar el ticket.");
  }
};

/* --- FIN ARCHIVO: lib/gemini.ts --- */