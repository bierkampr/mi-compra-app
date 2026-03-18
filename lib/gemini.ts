/* --- ARCHIVO: lib/gemini.ts --- */

/**
 * Envía las imágenes al backend propio (/api/analyze).
 * No enviamos la API KEY en el cuerpo para mayor seguridad, 
 * el servidor la tomará de sus propias variables de entorno.
 */
export const analyzeReceipt = async (base64Images: string[], mode: string, customPrompt: string) => {
  try {
    if (mode === 'manual') {
      return { 
        comercio: "INGRESO MANUAL", 
        fecha: new Date().toLocaleDateString('es-ES'), 
        total: 0, 
        productos: [] 
      };
    }

    console.log("[Gemini Lib] Llamando al puente de servidor...");
    
    const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            images: base64Images,
            prompt: customPrompt
            // Ya no enviamos la apiKey aquí por seguridad
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Error en el servidor" }));
        throw new Error(errData.error || `Error ${response.status}`);
    }

    const result = await response.json();

    let finalComercio = "SIN NOMBRE";
    if (result.comercio) {
      if (typeof result.comercio === 'string' && result.comercio.trim() !== "") {
        finalComercio = result.comercio;
      } else if (typeof result.comercio === 'object') {
        const found = Object.values(result.comercio).find(v => typeof v === 'string' && v.length > 0);
        if (found) finalComercio = found as string;
      }
    }

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
    console.error("Error en analyzeReceipt:", error);
    throw new Error(error.message || "Fallo en el análisis del ticket.");
  }
};