/* --- ARCHIVO: lib/gemini.ts --- */

/**
 * Envía las imágenes al backend propio (/api/analyze) para procesarlas con Gemini 2.0.
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

    console.log("[Gemini Lib] Iniciando análisis con el nuevo motor 2.0...");
    
    const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            images: base64Images,
            prompt: customPrompt
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Error de servidor" }));
        throw new Error(errData.error || `Error HTTP: ${response.status}`);
    }

    const result = await response.json();

    // Normalización de datos extraídos
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
    console.error("Error en analyzeReceipt (Gemini 2.0):", error);
    throw new Error(error.message || "No se pudo analizar el ticket. Inténtalo de nuevo.");
  }
};