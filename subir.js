/* --- ARCHIVO: subir.js (AUTOMÁTICO Y SEGURO) --- */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración de archivos prohibidos
const PROHIBIDOS = ['.env.local', '.env', 'PROYECTO_COMPLETO.txt', '.next', 'node_modules'];

// Colores para terminal
const green = "\x1b[32m";
const blue = "\x1b[34m";
const yellow = "\x1b[33m";
const red = "\x1b[31m";
const reset = "\x1b[0m";

console.log(`${blue}=== SISTEMA DE SUBIDA AUTOMÁTICA Y SEGURA ===${reset}\n`);

async function ejecutar() {
  try {
    // 1. VERIFICAR Y REPARAR .GITIGNORE
    console.log(`${yellow}🛡️ Verificando blindaje de seguridad...${reset}`);
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    let contenidoIgnore = "";
    
    if (fs.existsSync(gitignorePath)) {
      contenidoIgnore = fs.readFileSync(gitignorePath, 'utf8');
    }

    let modificado = false;
    PROHIBIDOS.forEach(archivo => {
      if (!contenidoIgnore.includes(archivo)) {
        contenidoIgnore += `\n${archivo}`;
        modificado = true;
        console.log(`${red}⚠️ Bloqueando automáticamente: ${archivo}${reset}`);
      }
    });

    if (modificado) {
      fs.writeFileSync(gitignorePath, contenidoIgnore.trim() + '\n');
      console.log(`${green}✅ .gitignore actualizado y blindado.${reset}`);
    }

    // 2. DETECTAR CAMBIOS
    console.log(`${yellow}🔍 Analizando cambios...${reset}`);
    const status = execSync('git status --short').toString().trim();
    
    if (!status) {
      console.log(`${green}☕ Nada nuevo que subir. Todo al día.${reset}`);
      process.exit(0);
    }

    const lineas = status.split('\n').length;

    // 3. LIMPIEZA PREVENTIVA DEL ÍNDICE
    // Si por error Git intentaba seguir el archivo prohibido, lo sacamos del commit
    try {
        execSync('git rm --cached PROYECTO_COMPLETO.txt', { stdio: 'ignore' });
    } catch (e) { /* No estaba en el indice, ignoramos */ }

    // 4. PREPARAR Y COMMIT AUTOMÁTICO
    console.log(`${blue}📦 Preparando paquete de actualización...${reset}`);
    execSync('git add .');

    const fecha = new Date().toLocaleString();
    const commitMsg = `Auto-Update: ${fecha} (${lineas} archivos)`;
    
    console.log(`${blue}📝 Creando commit: "${commitMsg}"${reset}`);
    execSync(`git commit -m "${commitMsg}"`);

    // 5. SUBIDA A GITHUB
    console.log(`${yellow}🚀 Subiendo a GitHub...${reset}`);
    execSync('git push');

    console.log(`\n${green}✨ ¡ÉXITO! Tu código está seguro en la nube.${reset}`);

  } catch (error) {
    console.error(`\n${red}❌ ERROR EN LA SUBIDA:${reset}`);
    const salida = error.stdout?.toString() || error.message;
    console.error(salida);

    if (salida.includes('GH013') || salida.includes('PUSH PROTECTION')) {
      console.log(`\n${yellow}💡 NOTA DE SEGURIDAD:${reset}`);
      console.log(`GitHub detectó una clave en un commit anterior.`);
      console.log(`Para arreglarlo DEBES entrar a este link y autorizarlo una sola vez:`);
      console.log(`${blue}https://github.com/bierkampr/mi-compra-app/security/secret-scanning/unblock-secret/...${reset}`);
    }
  }
}

ejecutar();