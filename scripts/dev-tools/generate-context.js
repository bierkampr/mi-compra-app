/* --- ARCHIVO: auditar_total.js --- */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // Carpetas donde se encuentra el código principal
  directorios: ['app', 'lib', 'locales', 'public'],
  
  // Extensiones de archivos que queremos leer
  extensionesPermitidas: [
    '.ts', '.tsx', '.js', '.mjs', '.json',
    '.css', '.md', '.d.ts', '.jsx'
  ],

  // Archivos que NO queremos que la IA analice (basado en tus capturas)
  excluir: [
    'node_modules',
    '.next',
    '.git',
    'favicon.ico',
    'aud.js',
    'subir.js',
    'ia_sync.js', // Nuevo script de sincronización
    'auditar_total.js', // Este mismo archivo
    'PROYECTO_COMPLETO.txt',
    'package-lock.json', // Opcional: es muy largo y suele gastar muchos tokens
    '.env.local' // Opcional: por seguridad
  ]
};

let contenidoTotal = "=== PROYECTO: MI COMPRA APP - AUDITORÍA COMPLETA ===\n";
contenidoTotal += "Fecha de exportación: " + new Date().toLocaleString() + "\n";
contenidoTotal += "================================================\n\n";

// 🔍 Función para validar si es archivo de texto
function esArchivoTexto(ruta) {
  try {
    const buffer = fs.readFileSync(ruta);
    return !buffer.includes(0);
  } catch {
    return false;
  }
}

// 📂 Recorrido recursivo mejorado
function obtenerArchivos(dir, listaArchivos = []) {
  if (!fs.existsSync(dir)) return listaArchivos;

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(process.cwd(), fullPath);

    // ❌ Saltar si está en la lista de excluidos
    if (CONFIG.excluir.includes(file) || CONFIG.excluir.includes(relativePath)) return;

    if (fs.statSync(fullPath).isDirectory()) {
      obtenerArchivos(fullPath, listaArchivos);
    } else {
      const ext = path.extname(fullPath);
      if (CONFIG.extensionesPermitidas.includes(ext)) {
        listaArchivos.push(relativePath);
      }
    }
  });

  return listaArchivos;
}

// --- PROCESAMIENTO ---

// 1. Asegurar que IA_INSTRUCTIONS.md vaya de primero si existe
let todosLosArchivos = [];
const prioritario = 'IA_INSTRUCTIONS.md';
if (fs.existsSync(path.join(process.cwd(), prioritario))) {
  todosLosArchivos.push(prioritario);
}

// 2. Escanear archivos sueltos en la RAÍZ (para pillar configs nuevos)
const archivosRaiz = fs.readdirSync(process.cwd()).filter(file => {
  const fullPath = path.join(process.cwd(), file);
  const isFile = fs.statSync(fullPath).isFile();
  const hasExt = CONFIG.extensionesPermitidas.includes(path.extname(file));
  const notExcluded = !CONFIG.excluir.includes(file);
  return isFile && hasExt && notExcluded && file !== prioritario;
});
todosLosArchivos = [...todosLosArchivos, ...archivosRaiz];

// 3. Escanear carpetas del proyecto
CONFIG.directorios.forEach(dir => {
  const rutaDir = path.join(process.cwd(), dir);
  todosLosArchivos = todosLosArchivos.concat(obtenerArchivos(rutaDir));
});

// Eliminar duplicados
todosLosArchivos = [...new Set(todosLosArchivos)];

// 📄 4. Leer y concatenar contenido
console.log("Reading files...");
todosLosArchivos.forEach(archivo => {
  const fullPath = path.join(process.cwd(), archivo);

  if (fs.existsSync(fullPath) && esArchivoTexto(fullPath)) {
    try {
      const contenido = fs.readFileSync(fullPath, 'utf8');
      contenidoTotal += `\n/* --- INICIO ARCHIVO: ${archivo} --- */\n`;
      contenidoTotal += contenido;
      contenidoTotal += `\n/* --- FIN ARCHIVO: ${archivo} --- */\n`;
      console.log(`✅ Incluido: ${archivo}`);
    } catch (err) {
      console.log(`❌ Error en: ${archivo}`);
    }
  }
});

// 💾 5. Guardar resultado
const outputPath = 'PROYECTO_COMPLETO.txt';
try {
  fs.writeFileSync(outputPath, contenidoTotal);
  console.log(`\n🚀 ¡ÉXITO!`);
  console.log(`Total archivos procesados: ${todosLosArchivos.length}`);
  console.log(`Generado en: ${outputPath}`);
} catch (error) {
  console.error(`❌ Error al guardar: ${error.message}`);
}