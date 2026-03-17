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
 * Normaliza nombres de comercios para fusionarlos.
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
 * COMPRESIÓN ULTRA-EXTREMA PARA VISION TOKENS
 * El error 429 se debe al área total de píxeles (Tokens).
 * Reducimos el lado largo a un máximo estricto según número de fotos.
 * 
 * 1 foto: Máx 700px / Calidad 0.4
 * 2 fotos: Máx 500px / Calidad 0.3
 * 3 fotos: Máx 400px / Calidad 0.2
 */
export const compressImage = (base64Str: string, photoCount: number = 1): Promise<string> => {
  return new Promise((resolve) => {
    // Definimos el límite del lado más largo (sea ancho o alto)
    let maxSide = 700;
    let quality = 0.4;

    if (photoCount === 2) {
      maxSide = 500;
      quality = 0.3;
    } else if (photoCount >= 3) {
      maxSide = 400;
      quality = 0.2;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculamos el escalado basado en el lado más largo
      if (width > height) {
        if (width > maxSide) {
          height *= maxSide / width;
          width = maxSide;
        }
      } else {
        if (height > maxSide) {
          width *= maxSide / height;
          height = maxSide;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve(base64Str);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Filtro de contraste agresivo para mantener legibilidad a baja resolución
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Forzamos blanco y negro puro casi al 100% para reducir peso y mejorar OCR
        let contrastValue = gray < 120 ? 0 : 255; 
        data[i] = data[i+1] = data[i+2] = contrastValue;
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
  const rows = gastos.map(g => [g.fecha, `"${g.comercio}"`, g.total, `"${g.productos?.map((p: any) => p.nombre_base).join(" | ")}"`]);
  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `mis_gastos_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
};