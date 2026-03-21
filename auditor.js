const fs = require('fs');
const path = require('path');

/** 
 * CONFIGURACIÓN DE SEGURIDAD Y FILTRADO
 * Añade aquí carpetas que no quieras que la IA lea (ej: imágenes, videos)
 */
const CONFIG = {
    outputFile: 'project_digest.xml',
    excludedFolders: [
        'node_modules', '.git', 'dist', 'build', '.next', 'out', 
        'coverage', 'bin', 'obj', 'vendor', '.vscode'
    ],
    excludedFiles: [
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 
        'project_digest.xml', '.DS_Store', 'favicon.ico'
    ],
    allowedExtensions: [
        '.ts', '.js', '.tsx', '.jsx', '.json', '.py', '.md', 
        '.html', '.css', '.prisma', '.sql', '.env', '.clinerules'
    ]
};

const PROJECT_ROOT = process.cwd();

function shouldIgnore(filePath, isDirectory) {
    const name = path.basename(filePath);
    
    // Ignorar carpetas ocultas o configuradas
    if (CONFIG.excludedFolders.includes(name) || name.startsWith('.')) {
        if (name !== '.clinerules' && name !== '.env') return true; 
    }

    if (isDirectory) {
        return CONFIG.excludedFolders.includes(name);
    } else {
        const ext = path.extname(name).toLowerCase();
        return CONFIG.excludedFiles.includes(name) || !CONFIG.allowedExtensions.includes(ext);
    }
}

function scanFiles(dir, fileList = []) {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relPath = path.relative(PROJECT_ROOT, fullPath);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!shouldIgnore(fullPath, true)) {
                scanFiles(fullPath, fileList);
            }
        } else {
            if (!shouldIgnore(fullPath, false)) {
                fileList.push(fullPath);
            }
        }
    });
    return fileList;
}

function generateDigest() {
    console.log('🚀 Iniciando escaneo del proyecto...');
    const files = scanFiles(PROJECT_ROOT);
    
    let xmlOutput = `<?xml version="1.0" encoding="UTF-8"?>\n<project_context>\n`;
    
    // 1. Mapa de Estructura
    xmlOutput += `<project_structure>\n`;
    files.forEach(f => {
        xmlOutput += `  <file_path>${path.relative(PROJECT_ROOT, f)}</file_path>\n`;
    });
    xmlOutput += `</project_structure>\n\n`;

    // 2. Contenido de Archivos
    console.log(`📄 Procesando ${files.length} archivos...`);
    
    files.forEach(f => {
        const relPath = path.relative(PROJECT_ROOT, f);
        try {
            const content = fs.readFileSync(f, 'utf8');
            // Escapar caracteres básicos para que el XML no se rompa (opcional pero recomendado)
            const safeContent = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            xmlOutput += `<file path="${relPath}">\n${safeContent}\n</file>\n\n`;
        } catch (err) {
            console.error(`❌ Error leyendo ${relPath}: ${err.message}`);
        }
    });

    xmlOutput += `</project_context>`;

    try {
        fs.writeFileSync(CONFIG.outputFile, xmlOutput);
        console.log(`\n✅ ¡Éxito! Archivo generado: ${CONFIG.outputFile}`);
        console.log(`📈 Tamaño aproximado: ${(xmlOutput.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`💡 Ahora sube este archivo a Claude o GPT-4 para generar tu documentación.`);
    } catch (err) {
        console.error(`❌ Error escribiendo el archivo de salida: ${err.message}`);
    }
}

generateDigest();