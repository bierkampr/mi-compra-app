/* --- ARCHIVO: lib/gemini.ts --- */

/**
 * Cliente encargado de solicitar el análisis de tickets al servidor.
 * No utiliza llaves de API directamente por seguridad; se comunica con 
 * la ruta interna /api/analyze que gestiona Gemini 3 Flash Preview.
 */
export const analyzeReceipt = async (base64Images: string[], mode: string, customPrompt: string) => {
  try {
    // 1. Omitir procesamiento de IA si el usuario eligió entrada manual
    if (mode === 'manual') {
      return { 
        comercio: "INGRESO MANUAL", 
        fecha: new Date().toLocaleDateString('es-ES'), 
        total: 0, 
        productos: [] 
      };
    }

    console.log("[Gemini Lib] Solicitando análisis al puente de servidor (Gemini 3 Flash)...");
    
    // 2. Realizar la petición a nuestra API interna en Next.js
    // No enviamos llaves aquí, el servidor las tiene protegidas.
    const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            images: base64Images,
            prompt: customPrompt
        })
    });

    // 3. Gestión de errores de comunicación
    if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Error de red" }));
        throw new Error(errData.error || `Error en el servidor: ${response.status}`);
    }

    // 4. Obtención del resultado procesado por la IA
    const result = await response.json();

    // 5. NORMALIZACIÓN DE LA RESPUESTA (Limpieza Pro-UI)
    // Garantizamos que el comercio sea siempre un string limpio y en mayúsculas
    let finalComercio = "SIN NOMBRE";
    
    if (result.comercio) {
      if (typeof result.comercio === 'string' && result.comercio.trim() !== "") {
        finalComercio = result.comercio;
      } else if (typeof result.comercio === 'object') {
        // Fallback: Si la IA devuelve un objeto accidentalmente, extraemos el primer valor útil
        const found = Object.values(result.comercio).find(v => typeof v === 'string' && v.length > 0);
        if (found) finalComercio = found as string;
      }
    }

    // 6. Estructura final estricta para el resto de la aplicación
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
    console.error("--- ERROR EN analyzeReceipt ---");
    console.error(error);
    
    // Propagamos el mensaje para que ScannerView lo muestre en un alert
    throw new Error(error.message || "No se pudo procesar el ticket. Inténtalo de nuevo.");
  }
};