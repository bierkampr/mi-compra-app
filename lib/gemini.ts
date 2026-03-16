import { MISTRAL_API_KEY } from "./config";

export const analyzeReceipt = async (base64Images: string[], mode: string, customPrompt: string) => {
  try {
    if (!MISTRAL_API_KEY) {
      throw new Error("La llave de Mistral no está configurada en Vercel.");
    }

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

    // --- NUEVO: ESCUDO CONTRA ERRORES ---
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Mistral API Error ${response.status}: ${errorData.error?.message || 'Error desconocido'}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error("La IA no devolvió resultados. Revisa tu cuota en Mistral.");
    }

    const result = JSON.parse(data.choices[0].message.content);

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
    console.error("DEBUG IA:", error);
    throw new Error(error.message);
  }
};