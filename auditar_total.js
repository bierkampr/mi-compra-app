/* --- ARCHIVO: auditar_total.js --- */

const fs = require('fs');
const path = require('path');

// Lista completa y actualizada según tu nueva estructura modular
const archivos = [
  'package.json',
  'tailwind.config.js',
  'postcss.config.js',
  'next.config.mjs',
  'tsconfig.json',
  'auditar_total.js',
  'public/manifest.json',
  'app/globals.css',
  'app/layout.tsx',
  'app/page.tsx',
  // --- COMPONENTES ---
  'app/components/AuthView.tsx',
  'app/components/DashboardView.tsx',
  'app/components/DetailView.tsx',
  'app/components/Navigation.tsx',
  'app/components/Providers.tsx',
  'app/components/ReviewModal.tsx',
  'app/components/ScannerView.tsx',
  'app/components/SettingsView.tsx',
  'app/components/ShoppingListView.tsx',
  // --- LIBRERÍAS ---
  'lib/config.ts',
  'lib/gemini.ts',
  'lib/gdrive.ts',
  'lib/i18n.ts',
  'lib/products.ts',
  'lib/supabase.ts',
  'lib/utils.ts',
  // --- LOCALES (TRADUCCIONES) ---
  'locales/en.json',
  'locales/es.json'
];

let contenidoTotal = "=== PROYECTO: MI COMPRA APP - FULL MODULAR ESTRUCTURE ===\n";
contenidoTotal += "Fecha de exportación: " + new Date().toLocaleString() + "\n";
contenidoTotal += "Descripción: App de gastos con IA, Modularizada, Alias Inteligentes y Diseño Denso.\n";
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
    console.log(`\n🚀 ¡TODO LISTO! Se ha generado ${outputPath}`);
    console.log(`Este archivo ahora contiene los 9 componentes modulares y la lógica de Alias.`);
} catch (error) {
    console.error(`❌ Error al escribir el archivo: ${error.message}`);
}