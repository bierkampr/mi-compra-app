/* --- ARCHIVO: auditar_total.js --- */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  directorios: ['app', 'lib', 'locales', 'public'],
  archivosRaiz: [
    'package.json',
    'package-lock.json',
    'tailwind.config.js',
    'postcss.config.js',
    'postcss.config.mjs',
    'next.config.mjs',
    'next.config.ts',
    'next-env.d.ts',
    'tsconfig.json',
    'eslint.config.mjs',
    'README.md',
    '.env.local'
  ],
  extensionesPermitidas: [
    '.ts', '.tsx', '.js', '.mjs', '.json',
    '.css', '.md', '.d.ts', '.jsx'
  ],
  excluir: [
    'node_modules',
    '.next',
    '.git',
    'favicon.ico',
    'aud.js',
    'subir.js'
  ]
};

let contenidoTotal = "=== PROYECTO: MI COMPRA APP - AUDITORÍA COMPLETA ===\n";
contenidoTotal += "Fecha de exportación: " + new Date().toLocaleString() + "\n";
contenidoTotal += "================================================\n\n";

// 🔍 Detectar si archivo es texto
function esArchivoTexto(ruta) {
  try {
    const buffer = fs.readFileSync(ruta);
    return !buffer.includes(0); // si tiene null byte → binario
  } catch {
    return false;
  }
}

// 📂 Recorrido recursivo
function obtenerArchivos(dir, listaArchivos = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);

    // ❌ excluir
    if (CONFIG.excluir.includes(file)) return;

    if (fs.statSync(fullPath).isDirectory()) {
      obtenerArchivos(fullPath, listaArchivos);
    } else {
      const ext = path.extname(fullPath);

      if (CONFIG.extensionesPermitidas.includes(ext)) {
        const rutaRelativa = path.relative(process.cwd(), fullPath);
        listaArchivos.push(rutaRelativa);
      }
    }
  });

  return listaArchivos;
}

// 🧠 1. Recopilar archivos
let todosLosArchivos = [...CONFIG.archivosRaiz];

CONFIG.directorios.forEach(dir => {
  const rutaDir = path.join(process.cwd(), dir);
  if (fs.existsSync(rutaDir)) {
    todosLosArchivos = todosLosArchivos.concat(obtenerArchivos(rutaDir));
  }
});

// eliminar duplicados
todosLosArchivos = [...new Set(todosLosArchivos)];

// 📄 2. Leer contenido
todosLosArchivos.forEach(archivo => {
  const fullPath = path.join(process.cwd(), archivo);

  if (
    fs.existsSync(fullPath) &&
    fs.lstatSync(fullPath).isFile() &&
    esArchivoTexto(fullPath)
  ) {
    try {
      const contenido = fs.readFileSync(fullPath, 'utf8');

      contenidoTotal += `\n\n/* --- INICIO ARCHIVO: ${archivo} --- */\n\n`;
      contenidoTotal += contenido;
      contenidoTotal += `\n\n/* --- FIN ARCHIVO: ${archivo} --- */\n`;

      console.log(`✅ ${archivo}`);
    } catch (err) {
      console.log(`❌ Error leyendo: ${archivo}`);
    }
  }
});

// 💾 3. Guardar archivo final
const outputPath = 'PROYECTO_COMPLETO.txt';

try {
  fs.writeFileSync(outputPath, contenidoTotal);
  console.log(`\n🚀 ¡EXTRACCIÓN EXITOSA!`);
  console.log(`Archivos procesados: ${todosLosArchivos.length}`);
  console.log(`Archivo generado: ${outputPath}`);
} catch (error) {
  console.error(`❌ Error al escribir: ${error.message}`);
}