/* --- INICIO ARCHIVO: lib/utils.ts --- */

/**
 * Comprime y optimiza imágenes de tickets para OCR.
 * Funciona de forma idéntica en iOS, Android y Web.
 */
export const compressImage = (base64Str: string, maxWidth = 700, quality = 0.5): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Cálculo de proporciones
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve(base64Str);

      // Dibujamos la imagen original en el canvas redimensionado
      ctx.drawImage(img, 0, 0, width, height);

      // --- PROCESAMIENTO DE IMAGEN PARA OCR (Mejora compatibilidad iOS/Android) ---
      // Obtenemos los datos de la imagen para aplicar filtros manuales
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // 1. Convertir a Escala de Grises (Luminancia)
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // 2. Aumentar Contraste (Algoritmo de umbral suave)
        // Esto ayuda a que el texto negro sobre papel blanco sea mucho más nítido para la IA
        let contrastValue = gray;
        if (gray < 128) {
          contrastValue = gray * 0.8; // Oscurecer más los grises oscuros
        } else {
          contrastValue = gray * 1.2; // Aclarar más los grises claros
        }

        // Limitar valores entre 0 y 255
        const finalVal = Math.min(255, Math.max(0, contrastValue));

        data[i] = finalVal;     // Rojo
        data[i + 1] = finalVal; // Verde
        data[i + 2] = finalVal; // Azul
      }

      // Ponemos los datos procesados de vuelta en el canvas
      ctx.putImageData(imageData, 0, 0);

      // Exportamos a JPEG con calidad controlada
      // JPEG es más ligero que PNG para Base64
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.onerror = () => {
      console.error("Error cargando la imagen para compresión");
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

/* --- FIN ARCHIVO: lib/utils.ts --- */