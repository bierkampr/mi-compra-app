import { MISTRAL_API_KEY } from "./config";

export const analyzeReceipt = async (base64Images: string[], mode: string, customPrompt: string) => {
  try {
    if (mode === 'manual') {
      return { comercio: "SIN NOMBRE", fecha: new Date().toLocaleDateString('es-ES'), total: 0, productos: [] };
    }

    const url = "https://api.mistral.ai/v1/chat/completions";
    const imageContent = base64Images.map(img => ({ type: "image_url", image_url: img }));

    const response = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${MISTRAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        "model": "pixtral-12b-2409",
        "messages": [{ "role": "user", "content": [{ "type": "text", "text": customPrompt }, ...imageContent] }],
        "response_format": { "type": "json_object" },
        "temperature": 0
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    // --- LÓGICA DE LIMPIEZA DE NOMBRE ---
    let finalComercio = "SIN NOMBRE"; // Valor por defecto solicitado
    
    if (result.comercio) {
      if (typeof result.comercio === 'string' && result.comercio.trim() !== "") {
        finalComercio = result.comercio;
      } else if (typeof result.comercio === 'object') {
        const found = Object.values(result.comercio).find(v => typeof v === 'string' && v.length > 0);
        if (found) finalComercio = found as string;
      }
    }

    return {
      comercio: finalComercio.toUpperCase(),
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
    throw new Error("Error en la IA: " + error.message);
  }
};