/* --- ARCHIVO: auditar_total.js --- */

const fs = require('fs');
const path = require('path');

// Configuración de carpetas y archivos a incluir/excluir
const CONFIG = {
  directorios: ['app', 'lib', 'locales'], // Carpetas donde buscará recursivamente
  archivosRaiz: [
    'package.json',
    'tailwind.config.js',
    'postcss.config.js',
    'postcss.config.mjs',
    'next.config.mjs',
    'next.config.ts',
    'tsconfig.json',
    'eslint.config.mjs',
    'README.md',
    '.env.local' // Ten cuidado: esto incluye tus llaves secretas
  ],
  extensionesPermitidas: ['.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.md'],
  excluir: ['node_modules', '.next', '.git', 'package-lock.json', 'favicon.ico']
};

let contenidoTotal = "=== PROYECTO: MI COMPRA APP - AUDITORÍA COMPLETA ===\n";
contenidoTotal += "Fecha de exportación: " + new Date().toLocaleString() + "\n";
contenidoTotal += "Estructura detectada automáticamente desde la raíz.\n";
contenidoTotal += "================================================\n\n";

// Función para obtener archivos recursivamente
function obtenerArchivos(dir, listaArchivos = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (!CONFIG.excluir.includes(file)) {
        obtenerArchivos(name, listaArchivos);
      }
    } else {
      const ext = path.extname(name);
      if (CONFIG.extensionesPermitidas.includes(ext) && !CONFIG.excluir.includes(file)) {
        // Convertir a ruta relativa para el log
        const rutaRelativa = path.relative(process.cwd(), name);
        listaArchivos.push(rutaRelativa);
      }
    }
  });
  return listaArchivos;
}

// 1. Recopilar todos los archivos
let todosLosArchivos = [...CONFIG.archivosRaiz];

CONFIG.directorios.forEach(dir => {
  const rutaDir = path.join(process.cwd(), dir);
  if (fs.existsSync(rutaDir)) {
    todosLosArchivos = todosLosArchivos.concat(obtenerArchivos(rutaDir));
  }
});

// Eliminar duplicados si los hubiera
todosLosArchivos = [...new Set(todosLosArchivos)];

// 2. Leer y concatenar contenido
todosLosArchivos.forEach(archivo => {
  const fullPath = path.join(process.cwd(), archivo);
  
  if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
    try {
      const contenido = fs.readFileSync(fullPath, 'utf8');
      contenidoTotal += `\n\n/* --- INICIO ARCHIVO: ${archivo} --- */\n\n`;
      contenidoTotal += contenido;
      contenidoTotal += `\n\n/* --- FIN ARCHIVO: ${archivo} --- */\n`;
      console.log(`✅ Procesado: ${archivo}`);
    } catch (err) {
      console.log(`❌ Error leyendo: ${archivo}`);
    }
  }
});

const outputPath = 'PROYECTO_COMPLETO.txt';
try {
  fs.writeFileSync(outputPath, contenidoTotal);
  console.log(`\n🚀 ¡EXTRACCIÓN EXITOSA!`);
  console.log(`Se han procesado ${todosLosArchivos.length} archivos.`);
  console.log(`Archivo generado: ${outputPath}`);
} catch (error) {
  console.error(`❌ Error al escribir el archivo final: ${error.message}`);
}