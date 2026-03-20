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
 * COMPRESIÓN DE ALTA FIDELIDAD PARA GEMINI
 * Optimizada para aprovechar la capacidad multilineal de Gemini Flash 1.5/2.0.
 * Mantenemos un margen para el límite de 4.5MB de Vercel API.
 * 
 * La compresión de imágenes se ha eliminado para maximizar la calidad del OCR.
 * Ahora, `compressImage` simplemente devuelve la imagen original en base64.
 */
export const compressImage = (base64Str: string): Promise<string> => {
  return Promise.resolve(base64Str);
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

/**
 * PREPROCESADO AVANZADO PARA OCR (CLIENT-SIDE)
 * Aplica escalado, escala de grises, contraste dinámico y threshold.
 */
export const preprocessForOCR = (base64Str: string, mode: 'high' | 'moderate' = 'high'): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Escalado 2x para mejorar precisión de OCR
      const scale = 2;
      const width = img.width * scale;
      const height = img.height * scale;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve(base64Str);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Threshold dinámico basado en el modo
      const threshold = mode === 'high' ? 120 : 150;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Escala de grises (Luminosidad)
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Contraste y Threshold (Binarización Blanco/Negro)
        // Si es más oscuro que el threshold, negro puro; si no, blanco puro.
        const v = gray < threshold ? 0 : 255;
        
        data[i] = data[i+1] = data[i+2] = v;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(base64Str);
  });
};

/**
 * LIMPIEZA INTELIGENTE DE TEXTO OCR
 */
export const cleanOCRText = (text: string): string => {
  const lines = text.split("\n");
  const cleanedLines: string[] = [];

  for (const line of lines) {
    let cleanLine = line.trim();

    // 1. Correcciones comunes de caracteres
    cleanLine = cleanLine
      .replace(/([0-9])O/g, "$10") // Número seguido de O -> 0
      .replace(/O([0-9])/g, "0$1") // O seguido de número -> 0
      .replace(/([0-9])l/g, "$11") // Número seguido de l -> 1
      .replace(/l([0-9])/g, "1$1") // l seguido de número -> 1
      .replace(/\|/g, "1")        // | -> 1
      .replace(/[^\w\s.,€$*%+-/]/g, ""); // Eliminar caracteres basura

    // 2. Normalización de precios (0,80 -> 0.80)
    cleanLine = cleanLine.replace(/(\d+),(\d{2})\b/g, "$1.$2");

    // 3. Filtrado de líneas vacías o irrelevantes
    // Una línea se considera relevante si tiene más de 3 caracteres O contiene al menos un número y es más larga que 1 caracter
    const containsNumber = /\d/.test(cleanLine);
    const isMeaningful = cleanLine.length > 3 || (containsNumber && cleanLine.length > 1);

    if (isMeaningful) {
      cleanedLines.push(cleanLine);
    }
  }

  return Array.from(new Set(cleanedLines)).join("\n"); // Eliminar duplicados y unir
};
