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
 * COMPRESIÓN ULTRA-AGRESIVA ADAPTATIVA
 * Reducimos drásticamente las dimensiones para evitar Error 429 por exceso de tokens.
 * La IA lee perfectamente a 600px-800px si el contraste es alto.
 * 
 * 1 foto: 800px / 0.5 calidad
 * 2 fotos: 700px / 0.3 calidad
 * 3 fotos: 600px / 0.25 calidad
 */
export const compressImage = (base64Str: string, photoCount: number = 1): Promise<string> => {
  return new Promise((resolve) => {
    // Presupuesto de píxeles muy ajustado para Mistral
    let maxWidth = 800;
    let quality = 0.5;

    if (photoCount === 2) {
      maxWidth = 700;
      quality = 0.3;
    } else if (photoCount >= 3) {
      maxWidth = 600;
      quality = 0.25;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Redimensionado proporcional estricto
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve(base64Str);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Filtro de alto contraste para compensar la baja resolución
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Binarización suave: Todo lo que no sea texto oscuro se vuelve muy claro
        // Esto reduce enormemente el ruido y el peso del JPG final
        let contrastValue = gray < 110 ? gray * 0.5 : Math.min(255, gray * 1.4);
        data[i] = data[i+1] = data[i+2] = contrastValue;
      }

      ctx.putImageData(imageData, 0, 0);
      
      // Convertimos a JPEG con la calidad reducida
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