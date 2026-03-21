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
 * Renderiza la imagen a un canvas con el maxSide y quality dados,
 * aplica el filtro de contraste y devuelve el base64 resultante.
 */
const renderToCanvas = (
  img: HTMLImageElement,
  maxSide: number,
  quality: number
): string => {
  let width = img.width;
  let height = img.height;

  // Escalar por el lado más largo, sin importar orientación
  const longest = Math.max(width, height);
  if (longest > maxSide) {
    const scale = maxSide / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return img.src;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Filtro de contraste: oscurece la tinta, aclara el fondo
  // Mejora la lectura del texto sin binarizar (evita pixelado en las letras)
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const v = gray < 140 ? gray * 0.6 : Math.min(255, gray * 1.2);
    data[i] = data[i + 1] = data[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/jpeg', quality);
};

/**
 * Compresión inteligente y adaptativa.
 *
 * Límites fijos basados en pruebas reales con Mistral:
 *   - Máximo 1000px en el lado más largo (vertical u horizontal)
 *   - Máximo 110 KB de peso final
 *
 * Estrategia:
 *   1. Escala a 1000px si la imagen es más grande.
 *   2. Intenta con calidad 0.78 → si pesa más de 110KB, baja 0.05 por paso.
 *   3. Si con calidad mínima (0.35) aún pesa demasiado, reduce maxSide 50px y repite.
 *   4. Siempre devuelve la mejor calidad posible dentro de los límites.
 */
export const compressImage = (base64Str: string, photoCount: number = 1): Promise<string> => {
  const MAX_SIDE_PX = 1000;
  const MAX_SIZE_KB = 110;
  const MIN_QUALITY  = 0.35;
  const QUALITY_STEP = 0.05;
  const MIN_SIDE_PX  = 300;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;

    img.onload = () => {
      let maxSide = MAX_SIDE_PX;
      let quality = 0.78;

      const tryNext = (): void => {
        const result = renderToCanvas(img, maxSide, quality);
        const kb = (result.length * 0.75) / 1024;

        if (kb <= MAX_SIZE_KB) {
          // ✅ Dentro del límite — devolver
          console.log(`[compressImage] OK: ${maxSide}px · q${Math.round(quality * 100)}% · ${Math.round(kb)}KB`);
          resolve(result);
          return;
        }

        // Primero bajar calidad
        if (quality - QUALITY_STEP >= MIN_QUALITY) {
          quality = Math.round((quality - QUALITY_STEP) * 100) / 100;
          tryNext();
          return;
        }

        // Calidad al mínimo: reducir resolución y resetear calidad
        if (maxSide - 50 >= MIN_SIDE_PX) {
          maxSide -= 50;
          quality = 0.78;
          tryNext();
          return;
        }

        // Último recurso: devolver lo que hay aunque supere el límite
        console.warn(`[compressImage] No se pudo reducir a ${MAX_SIZE_KB}KB. Enviando ${Math.round(kb)}KB.`);
        resolve(result);
      };

      tryNext();
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

      const threshold = mode === 'high' ? 120 : 150;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
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
    const trimmed = line.trim();
    if (trimmed.length < 2) continue;
    if (/^[\s\-_=*#]+$/.test(trimmed)) continue;
    cleanedLines.push(trimmed);
  }

  return cleanedLines.join("\n");
};