const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const MODULES_DIR = path.join(DOCS_DIR, 'modules');

// Crear directorios si no existen
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
if (!fs.existsSync(MODULES_DIR)) fs.mkdirSync(MODULES_DIR, { recursive: true });

const documentos = {
  // 1. VISIÓN GENERAL
  'overview.md': `# Visión General: Mi Compra App

## Propósito
Gestor de gastos personales e inventario de lista de compras offline-first. Utiliza Inteligencia Artificial para extraer información de tickets de compra (fotos) de forma automática.

## Stack Tecnológico
- **Framework:** Next.js 15 (App Router) + React 19.
- **Estilos:** Tailwind CSS (con clases base premium personalizadas en \`globals.css\`).
- **PWA:** Funciona como aplicación instalable (\`manifest.json\`).
- **Iconografía:** \`lucide-react\`.
- **Internacionalización:** Sistema propio (\`lib/i18n.ts\`).

## Filosofía de Desarrollo
- **Offline-First:** La app debe funcionar sin internet leyendo de \`localStorage\`.
- **UI Premium:** Uso de \`card-premium\`, \`btn-primary\`, y esquemas ultra-oscuros (\`#0D0F1A\`).
- **Seguridad:** Las API Keys de IA NUNCA van al cliente. Todo el procesamiento de IA ocurre en rutas API (\`/api/analyze\`).
`,

  // 2. ARQUITECTURA GENERAL
  'architecture.md': `# Arquitectura del Sistema

## Flujo de Datos Híbrido
La app utiliza una estrategia de 3 capas para el almacenamiento:
1. **Capa Local (Primaria):** \`localStorage\` (\`mi_compra_cache_db\`). Acceso instantáneo.
2. **Capa Personal (Respaldo):** Google Drive AppDataFolder (\`mi_compra_data.json\`). Archivo oculto en el drive del usuario.
3. **Capa Global (Catálogo):** Supabase. Guarda el catálogo maestro de productos y evolución de precios.

## Z-Index Hierarchy (ESTRICTA)
No alterar estos valores en los componentes:
- \`z-[9999]\`: Modales críticos y overlays de sistema.
- \`z-[9000]\`: Spinner de carga global (\`Loader2\`).
- \`z-[1200]\`: \`DetailView\`.
- \`z-[1100]\`: \`ReviewModal\`.
- \`z-[1000]\`: \`ScannerView.Capture\`.
- \`z-[600]\`: Modales de contenido completo.
- \`z-[100]\`: Navegación inferior (\`nav-bottom\`).

## Gestión de Estado Central
El estado de la base de datos se maneja en \`app/page.tsx\` con la interfaz \`AppDB\`. Toda mutación de estado DB debe pasar por la función \`updateAndSync(newDb)\` para asegurar la persistencia en Drive.
`,

  // 3. BASE DE DATOS
  'database.md': `# Base de Datos y Modelos

## Modelo Local (AppDB)
\`\`\`typescript
interface AppDB {
  gastos: Gasto[];
  lista: ListItem[];
  customCategories: string[];
}
\`\`\`
- Todo gasto tiene un \`category\` (ej: 'super', 'mini', 'dining', etc).
- Los \`photoIds\` guardan las referencias de los tickets subidos a Google Drive.

## Supabase (Catálogo Maestro)
Supabase no guarda gastos de usuarios, guarda *conocimiento colectivo*:
1. **Tabla \`productos\`**: \`id\`, \`nombre_base\`, \`categoria\`.
2. **Tabla \`producto_alias\`**: Mapea nombres raros de tickets (ej. "TOMATE FRITO HDA") al \`nombre_base\` ("TOMATE FRITO").
3. **Tabla \`producto_detalles\`**: Guarda el \`ultimo_precio\` de un producto en un comercio específico.

## Reglas de Modificación
- Nunca consultar Supabase en el renderizado inicial crítico (rompería el offline-first).
- Las llamadas a Supabase son para sincronización "silenciosa" en segundo plano (ej: \`syncProductWithSupabase\`).
`,

  // 4. API ROUTES
  'api.md': `# Rutas API (Servidor)

## 1. POST \`/api/analyze/route.ts\`
**Propósito:** Pipeline de IA distribuido para procesar fotos de tickets.
- **Fase A (Visión):** Usa **Mistral** (pixtral-large-latest) para transcribir fotos. Soporta hasta 3 fotos y las une. Tiene sistema de rotación de claves (\`MISTRAL_API_KEY_1\`, etc.).
- **Fase B (Razonamiento):** Usa **Groq** (llama-3.3-70b-versatile) para transformar la transcripción de Mistral en un JSON estructurado con comercios, totales y lista de productos.

## 2. Autenticación (\`/api/auth/token\` y \`/api/auth/refresh\`)
- Permiten ocultar el \`GOOGLE_CLIENT_SECRET\` en el servidor.
- Intercambian el código OAuth del cliente por \`access_token\` y \`refresh_token\` para acceder a Google Drive.
`,

  // 5. MÓDULOS DE COMPONENTES
  'modules/components.md': `# Módulos UI Principales

Toda la UI principal reside en \`app/components/\` y se renderiza condicionalmente en \`app/page.tsx\` según el estado \`activeTab\`.

## Flujo de Pantallas
1. **AuthView**: Inicia sesión con Google Identity Services (GSI).
2. **DashboardView**: Muestra gráficos SVG nativos (donut chart) y listado mensual. Filtra gastos por la fecha de \`currentViewDate\`.
3. **ShoppingListView**: Lista de la compra. Tiene un buscador inteligente que chequea \`Supabase\` para autocompletado fuzzy.
4. **ScannerView**: Interfaz de cámara nativa (WebRTC). Captura, recorta y comprime imágenes antes de pasarlas a la IA.
5. **ReviewModal**: Pantalla crucial donde el humano revisa lo que la IA extrajo antes de guardarlo. Muestra comparación de precios históricos.
6. **DetailView**: Visor del gasto y lightbox para ver el ticket en grande recuperado de Google Drive.

## Regla de Estilos
Todos los componentes deben usar \`txt('ruta.al.texto')\` pasándoselo por props desde \`page.tsx\` para el soporte i18n.
`,

  // 6. MÓDULO IA
  'modules/ai.md': `# Módulo de Inteligencia Artificial

## Implementación
El cliente envía imágenes en Base64 a \`/api/analyze\` mediante \`analyzeReceipt()\` en \`lib/gemini.ts\` (Nota: se conservó el nombre gemini.ts por legado, pero usa Mistral/Groq).

## Interfaz de Respuesta Esperada (JSON)
\`\`\`json
{
  "comercio": "string",
  "fecha": "DD/MM/AAAA",
  "total": number,
  "productos":[
    { "cantidad": number, "nombre_ticket": "string", "nombre_base": "string", "subtotal": number }
  ]
}
\`\`\`

## Fusión de Tickets Largos
Si un ticket es largo, el cliente envía hasta 3 imágenes. El servidor las procesa en paralelo usando Mistral Vision, concatena el texto, y se lo pasa a Groq con la instrucción estricta de "UNIR en un solo JSON sin duplicar solapamientos".
`
};

const clineRules = `## REGLAS PERSISTENTES PARA CLINE (Mi Compra App)

### 1. Modelo Operativo Híbrido (Importante)
Eres la IA local de desarrollo. NO necesitas leer todo el código fuente de Next.js para cada cambio.
Antes de modificar cualquier funcionalidad, lee los archivos en \`/docs\` pertinentes a tu tarea.

### 2. Arquitectura Obligatoria
- **Next.js 15 App Router:** Uso estricto de componentes de cliente (\`"use client"\`) en \`/app/components\`.
- **Z-Index:** Respeta absolutamente la jerarquía en \`/docs/architecture.md\`.
- **CSS:** Usa clases de \`globals.css\` (\`btn-primary\`, \`card-premium\`, \`input-premium\`, \`text-small-caps\`). No inventes clases complejas en línea.

### 3. Mutación de Datos
- Las variables de estado globales viven en \`app/page.tsx\`.
- Si modificas el flujo de datos (\`AppDB\`), DEBES llamar a \`updateAndSync\` para asegurar la subida silenciosa a Google Drive y el \`localStorage\`.
- Si tocas el pipeline de IA, asegúrate de editar \`app/api/analyze/route.ts\`.

### 4. Textos e Idioma
- Todo texto visible en UI debe estar envuelto en \`txt('modulo.llave')\`.
- Si agregas una función nueva, agrega sus traducciones en \`locales/es.json\` y \`locales/en.json\`.

### 5. Contratos de Modificación
- Si creas un componente nuevo, documenta su rol en \`/docs/modules/components.md\`.
- No añadas librerías externas sin validación (el proyecto busca minimizar dependencias).
- Evita usar \`localStorage\` directamente en los componentes hijos; solicita y actualiza desde \`page.tsx\`.

Respeta estas reglas como tu constitución.
`;

function generarDocumentacion() {
    console.log("🚀 Iniciando generación de Memoria Estructurada (/docs)...");

    // Generar MDs
    for (const [filename, content] of Object.entries(documentos)) {
        const filePath = path.join(DOCS_DIR, filename);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Creado: docs/${filename}`);
    }

    // Generar .clinerules
    const rulesPath = path.join(PROJECT_ROOT, '.clinerules');
    fs.writeFileSync(rulesPath, clineRules, 'utf8');
    console.log(`✅ Creado: .clinerules`);

    console.log("\n🎉 ¡Arquitectura Híbrida lista! La IA Local ya puede programar consumiendo los archivos .md.");
}

generarDocumentacion();