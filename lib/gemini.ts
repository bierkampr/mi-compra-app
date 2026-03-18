/* --- ARCHIVO: lib/gemini.ts --- */

/**
 * Cliente de comunicación con el puente de servidor para análisis de tickets.
 * Utiliza el modelo gemini-flash-latest para máxima precisión y actualización constante.
 */
export const analyzeReceipt = async (base64Images: string[], mode: string, customPrompt: string) => {
  try {
    // 1. Omitir IA si es entrada manual
    if (mode === 'manual') {
      return { 
        comercio: "INGRESO MANUAL", 
        fecha: new Date().toLocaleDateString('es-ES'), 
        total: 0, 
        productos: [] 
      };
    }

    console.log("[Gemini Lib] Solicitando análisis al motor FLASH-LATEST...");
    
    // 2. Petición a nuestra API Route interna
    const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            images: base64Images,
            prompt: customPrompt
        })
    });

    // 3. Gestión de errores de red y servidor
    if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Error en el puente de servidor" }));
        throw new Error(errData.error || `Fallo de comunicación (${response.status})`);
    }

    const result = await response.json();

    // 4. LIMPIEZA Y NORMALIZACIÓN DE RESULTADOS
    // Evitamos problemas de tipos (ej: que el total venga como string)
    let finalComercio = "COMERCIO DESCONOCIDO";
    
    if (result.comercio) {
      if (typeof result.comercio === 'string' && result.comercio.trim() !== "") {
        finalComercio = result.comercio;
      } else if (typeof result.comercio === 'object') {
        // Fallback si la IA devuelve un objeto de comercio
        const found = Object.values(result.comercio).find(v => typeof v === 'string' && v.length > 0);
        if (found) finalComercio = found as string;
      }
    }

    // 5. Devolución de objeto estructurado para la App
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
    console.error("Error en proceso analyzeReceipt:", error);
    // Este mensaje lo verá el usuario en el alert de ScannerView
    throw new Error(error.message || "No se pudo analizar el ticket en este momento.");
  }
};