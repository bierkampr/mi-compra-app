/**
 * Normaliza texto: minúsculas, quita acentos y carácteres especiales.
 * Fundamental para el buscador de la lista de compras.
 */
export const normalizeText = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quita acentos
    .replace(/[^a-z0-9 ]/g, " ")    // Quita símbolos
    .trim();
};

/**
 * Normaliza nombres de comercios para fusionarlos en estadísticas.
 * Ejemplo: "MERCADONA, S.A." -> "MERCADONA"
 */
export const normalizeStoreName = (name: string): string => {
  if (!name) return "DESCONOCIDO";
  return name
    .toUpperCase()
    .replace(/\s+(S\.A\.|S\.L\.|S\.L\.U\.|SA|SL|INC|CORP)$/g, "")
    .replace(/[.,]/g, "")
    .trim();
};

/**
 * Calcula la afinidad entre un nombre de ticket y un ítem de la lista.
 * Devuelve una puntuación para ordenar las sugerencias.
 */
export const calculateMatchScore = (ticketName: string, listName: string): number => {
  const tWords = normalizeText(ticketName).split(/\s+/);
  const lWords = normalizeText(listName).split(/\s+/);
  
  let score = 0;
  lWords.forEach(word => {
    if (word.length <= 2) return; 
    if (tWords.includes(word)) score += 10; 
    else if (tWords.some(tw => tw.includes(word) || word.includes(tw))) score += 5; 
  });
  
  return score;
};

/**
 * COMPRESIÓN EXTREMA PARA OCR (600px / Calidad 0.3)
 * Diseñada para enviar 2-3 fotos a Mistral sin superar límites de tokens (Error 429).
 */
export const compressImage = (base64Str: string, maxWidth = 600, quality = 0.3): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve(base64Str);

      ctx.drawImage(img, 0, 0, width, height);

      // --- FILTRO OCR DE ALTO CONTRASTE (OPTIMIZADO PARA BAJA RESOLUCIÓN) ---
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Escala de grises por luminancia
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Umbral de contraste agresivo: los grises se vuelven negros o blancos
        let contrastValue = gray;
        if (gray < 120) {
          contrastValue = gray * 0.5; // Forzar a negro
        } else {
          contrastValue = gray * 1.5; // Forzar a blanco
        }

        const finalVal = Math.min(255, Math.max(0, contrastValue));
        data[i] = data[i+1] = data[i+2] = finalVal;
      }

      ctx.putImageData(imageData, 0, 0);

      // JPEG a 0.3 genera archivos de aprox 70-100KB, permitiendo enviar varias fotos
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.onerror = () => {
      console.error("Error cargando la imagen");
      resolve(base64Str);
    };
  });
};

/**
 * Exporta los gastos a formato CSV descargable.
 */
export const exportToCSV = (gastos: any[]) => {
  if (!gastos || gastos.length === 0) return;
  const headers = ["Fecha", "Comercio", "Total", "Productos"];
  const rows = gastos.map(g => [
    g.fecha, 
    `"${g.comercio}"`, 
    g.total, 
    `"${g.productos?.map((p: any) => p.nombre_base).join(" | ")}"`
  ]);
  
  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `mis_gastos_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
  URL.revokeObjectURL(url);
};