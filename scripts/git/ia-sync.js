/**
 * IA SYNC - Automatización de Guardado y Log para Mi Compra App
 * Este script automatiza la actualización de IA_INSTRUCTIONS.md y la subida a Git.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = 'IA_INSTRUCTIONS.md';
const SUBIR_SCRIPT = 'subir.js';

// Colores para terminal
const blue = "\x1b[34m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const reset = "\x1b[0m";

async function main() {
    console.log(`${blue}🔄 Iniciando IA Sync...${reset}`);

    // 1. Obtener cambios del log (Si se pasan por argumento o input)
    const args = process.argv.slice(2);
    let logMessage = args.join(' ');

    if (!logMessage) {
        console.log(`${yellow}⚠️ No se proporcionó mensaje de log. Usando log genérico.${reset}`);
        logMessage = "Actualizaciones generales del sistema.";
    }

    // 2. Formatear y añadir a IA_INSTRUCTIONS.md
    try {
        let content = fs.readFileSync(LOG_FILE, 'utf8');
        const fecha = new Date().toLocaleDateString('es-ES');
        
        const newLogEntry = `\n${fecha} - IA Auto-Update\n${logMessage.split('\\n').map(line => `- ${line}`).join('\n')}\n`;
        
        // Buscamos la sección de historial
        if (content.includes('7. HISTORIAL DE CAMBIOS Y APRENDIZAJES (IA LOG)')) {
            content = content.replace('7. HISTORIAL DE CAMBIOS Y APRENDIZAJES (IA LOG)', `7. HISTORIAL DE CAMBIOS Y APRENDIZAJES (IA LOG)\n${newLogEntry}`);
            fs.writeFileSync(LOG_FILE, content);
            console.log(`${green}📝 Historial actualizado en ${LOG_FILE}${reset}`);
        } else {
            console.log(`${yellow}⚠️ No se encontró la sección de log en ${LOG_FILE}. Saltando paso.${reset}`);
        }
    } catch (e) {
        console.error("Error actualizando historial:", e.message);
    }

    // 3. Ejecutar subida a Git
    try {
        console.log(`${blue}🚀 Llamando a subir.js...${reset}`);
        execSync(`node ${SUBIR_SCRIPT}`, { stdio: 'inherit' });
    } catch (e) {
        console.error("Error en la subida:", e.message);
    }
}

main();
