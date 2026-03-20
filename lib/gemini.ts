/* --- ARCHIVO: lib/gemini.ts --- */

/**
 * v2.0: Se elimina la dependencia de OCR local.
 * Envía las imágenes capturadas directamente al pipeline distribuido del servidor.
 */
export const analyzeReceipt = async (images: string[], mode: string, customPrompt: string) => {
  try {
    if (mode === 'manual') {
      return { 
        comercio: "INGRESO MANUAL", 
        fecha: new Date().toLocaleDateString("es-ES"), 
        total: 0, 
        productos: [
      };
    }

    console.log("[V2.0] Enviando imágenes al Pipeline de Servidor...", images);
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("No hay imágenes válidas para enviar al pipeline.");
    }

    const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            images: images, // Array de base64
            prompt: customPrompt,
            mode: mode
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Error de red" }));
        throw new Error(errData.error || `Error en el servidor: ${response.status}`);
    }

    const result = await response.json();

    // Normalización de seguridad
    return {
      comercio: (result.comercio || "DESCONOCIDO").toUpperCase().trim(),
      fecha: result.fecha || new Date().toLocaleDateString("es-ES"),
      total: Number(result.total) || 0,
      productos: (result.productos || []).map((p: any) => ({
        cantidad: Number(p.cantidad) || 1,
        nombre_ticket: String(p.nombre_ticket || "PRODUCTO"),
        nombre_base: String(p.nombre_base || p.nombre_ticket || "PRODUCTO"),
        subtotal: Number(p.subtotal) || 0
      }))
    };

  } catch (error: any) {
    console.error("Error en analyzeReceipt v2.0:", error);
    throw new Error(error.message || "No se pudo procesar el ticket con la nueva IA.");
  }
};