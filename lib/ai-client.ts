/* --- ARCHIVO: lib/ai-client.ts --- */

/**
 * v3.0: Pipeline Gemini — usa el token OAuth2 del usuario para la IA.
 * Ya no depende de API Keys del servidor.
 * El token se envía como Bearer en el header Authorization.
 */
export const analyzeReceipt = async (
  images: string[],
  mode: string,
  customPrompt: string,
  userToken: string
) => {
  try {
    if (mode === 'manual') {
      return { 
        comercio: "INGRESO MANUAL", 
        fecha: new Date().toLocaleDateString("es-ES"), 
        total: 0, 
        productos: []
      };
    }

    console.log("[v3.0] Enviando imágenes al Pipeline Gemini...", images.length, "imagen(es)");
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error(`No hay imágenes válidas. Recibido: ${JSON.stringify(images)}`);
    }

    if (!userToken) {
      throw new Error("AI_PERMISSION_DENIED: No tienes la IA activada. Activa el permiso de Google para escanear tickets.");
    }

    const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`,
        },
        body: JSON.stringify({
            images: images,
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
    console.error("Error en analyzeReceipt v3.0:", error);
    throw new Error(error.message || "No se pudo procesar el ticket con Gemini.");
  }
};
