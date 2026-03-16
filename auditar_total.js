const fs = require('fs');
const path = require('path');

// Lista completa de todos los archivos que componen el sistema actual (ACTUALIZADA)
const archivos = [
  'package.json',
  'tailwind.config.js',
  'postcss.config.js',
  'next.config.mjs', // Configuración de Next.js
  'tsconfig.json',    // Configuración de TypeScript
  'auditar_total.js', // Tu script de auditoría
  'public/manifest.json', // IMPORTANTE para la PWA
  'app/globals.css',
  'app/layout.tsx',
  'app/page.tsx',
  'lib/config.ts',
  'lib/gemini.ts',
  'lib/gdrive.ts',
  'lib/products.ts',
  'lib/supabase.ts',
  'lib/utils.ts'
];

let contenidoTotal = "=== PROYECTO: MI COMPRA APP - FULL ESTRUCTURE ===\n";
contenidoTotal += "Fecha de exportación: " + new Date().toLocaleString() + "\n";
contenidoTotal += "Descripción: App de gastos con IA, Modo Offline (PWA), Navegación Mensual y Sync Google Drive.\n";
contenidoTotal += "================================================\n\n";

archivos.forEach(archivo => {
  const fullPath = path.join(process.cwd(), archivo);
  if (fs.existsSync(fullPath)) {
    contenidoTotal += `\n\n/* --- INICIO ARCHIVO: ${archivo} --- */\n\n`;
    contenidoTotal += fs.readFileSync(fullPath, 'utf8');
    contenidoTotal += `\n\n/* --- FIN ARCHIVO: ${archivo} --- */\n`;
    console.log(`✅ Procesado: ${archivo}`);
  } else {
    contenidoTotal += `\n\n⚠️ ARCHIVO NO ENCONTRADO: ${archivo}\n`;
    console.log(`⚠️ No encontrado: ${archivo}`);
  }
});

const outputPath = 'PROYECTO_COMPLETO.txt';
try {
    fs.writeFileSync(outputPath, contenidoTotal);
    console.log(`\n🚀 ¡TODO LISTO! El archivo ${outputPath} ha sido generado.`);
    console.log(`Este archivo ahora contiene la lógica PWA y los filtros OCR actualizados.`);
} catch (error) {
    console.error(`❌ Error al escribir el archivo: ${error.message}`);
}