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
 * 1 foto: Máx 1600px / Calidad 0.85
 * 2 fotos: Máx 1400px / Calidad 0.8
 * 3 fotos: Máx 1200px / Calidad 0.75
 */
export const compressImage = (base64Str: string, photoCount: number = 1): Promise<string> => {
  return new Promise((resolve) => {
    let maxSide = 1600;
    let quality = 0.85;

    if (photoCount === 2) {
      maxSide = 1400;
      quality = 0.8;
    } else if (photoCount >= 3) {
      maxSide = 1200;
      quality = 0.75;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Escalado proporcional basado en el lado más largo
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

      // FILTRO DE CLARIDAD TEXTUAL (Optimizado para Gemini)
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Suavizamos el contraste para no pixelar caracteres pequeños
        let v = gray;
        if (gray < 130) {
            v = gray * 0.8; // Oscurece tinta
        } else {
            v = Math.min(255, gray * 1.1); // Limpia papel
        }
        
        data[i] = data[i+1] = data[i+2] = v;
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
  return text
    .split('\n')
    .map(line => {
      let cleanLine = line.trim();
      
      // 1. Correcciones comunes de caracteres
      // "0" <-> "O" en contextos numéricos
      // "1" <-> "l" / "|"
      cleanLine = cleanLine
        .replace(/([0-9])O/g, '$10')
        .replace(/O([0-9])/g, '0$1')
        .replace(/([0-9])l/g, '$11')
        .replace(/l([0-9])/g, '1$1')
        .replace(/\|/g, '1');

      // 2. Normalización de precios (0,80 -> 0.80)
      cleanLine = cleanLine.replace(/(\d+),(\d{2})\b/g, '$1.$2');

      // 3. Eliminar caracteres basura manteniendo lo relevante
      cleanLine = cleanLine.replace(/[^\w\s.,€$*%+-/]/g, '');

      return cleanLine;
    })
    // 4. Eliminar líneas vacías o irrelevantes
    .filter(line => line.length > 3 || (line.length > 0 && /\d/.test(line)))
    .join('\n');
};
