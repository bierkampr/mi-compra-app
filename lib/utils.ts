/* --- ARCHIVO: lib/utils.ts (Actualizado) --- */

/**
 * Normaliza texto: minúsculas, quita acentos y carácteres especiales.
 * "Atún Claro" -> "atun claro"
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quita acentos
    .replace(/[^a-z0-9 ]/g, " ")    // Quita símbolos
    .trim();
};

/**
 * Calcula la afinidad entre un nombre de ticket y un ítem de la lista.
 * Devuelve un número basado en palabras coincidentes.
 */
export const calculateMatchScore = (ticketName: string, listName: string): number => {
  const tWords = normalizeText(ticketName).split(/\s+/);
  const lWords = normalizeText(listName).split(/\s+/);
  
  let score = 0;
  lWords.forEach(word => {
    // Ignoramos palabras cortas (de, la, el, con...) para no falsear el match
    if (word.length <= 2) return; 
    if (tWords.includes(word)) score += 10; // Match exacto de palabra
    else if (tWords.some(tw => tw.includes(word) || word.includes(tw))) score += 5; // Match parcial
  });
  
  return score;
};

/**
 * Comprime y optimiza imágenes de tickets para OCR.
 */
export const compressImage = (base64Str: string, maxWidth = 700, quality = 0.5): Promise<string> => {
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
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Str);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Filtro de contraste básico para OCR
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const val = gray < 128 ? gray * 0.8 : gray * 1.2;
        data[i] = data[i+1] = data[i+2] = Math.min(255, Math.max(0, val));
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

/**
 * Exporta a CSV
 */
export const exportToCSV = (gastos: any[]) => {
  if (!gastos || gastos.length === 0) return;
  const headers = ["Fecha", "Comercio", "Total", "Productos"];
  const rows = gastos.map(g => [g.fecha, `"${g.comercio}"`, g.total, `"${g.productos?.map((p: any) => p.nombre_base).join(" | ")}"`]);
  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `mis_gastos_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
};