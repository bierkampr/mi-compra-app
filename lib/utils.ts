/**
 * Normaliza texto: minúsculas, quita acentos y carácteres especiales.
 */
export const normalizeText = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .trim();
};

/**
 * Normaliza nombres de comercios para fusionarlos en estadísticas.
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
 * AGRUPACIÓN DE PRODUCTOS REPETIDOS
 */
export const groupRepeatedProducts = (products: any[]) => {
  const map = new Map();

  products.forEach(p => {
    const key = p.nombre_ticket.toUpperCase().trim();
    if (map.has(key)) {
      const existing = map.get(key);
      existing.cantidad = (existing.cantidad || 1) + (p.cantidad || 1);
      existing.subtotal = Number(existing.subtotal) + Number(p.subtotal);
    } else {
      map.set(key, { ...p, cantidad: p.cantidad || 1 });
    }
  });

  return Array.from(map.values());
};

/**
 * COMPRESIÓN BALANCEADA (800px / 0.5)
 * Volvemos a la configuración estable para evitar errores 429.
 */
export const compressImage = (base64Str: string, maxWidth = 800, quality = 0.5): Promise<string> => {
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

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        let contrastValue = gray;
        if (gray < 128) {
          contrastValue = gray * 0.8; 
        } else {
          contrastValue = gray * 1.2; 
        }
        const finalVal = Math.min(255, Math.max(0, contrastValue));
        data[i] = data[i+1] = data[i+2] = finalVal;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.onerror = () => resolve(base64Str);
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