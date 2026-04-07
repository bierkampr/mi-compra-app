# CHANGELOG — Mi Compra App

> Historial de cambios significativos. Fuente: IA_INSTRUCTIONS.md (rescatado) + auditoría 2026-04-02.

---

## [v3.4] — 2026-04-07 — Sistema de Logging IA + Ruleta Multi-Plataforma + Limpieza de Seguridad

### 1. Sistema de Logs de Escaneo → Supabase
- Creado `supabase/scan_logs.sql`: tabla `scan_logs` con campos de plataforma, rotación, ticket, duración y resultado. Incluye índices, RLS (anon insert/select) y vista `scan_stats` (agrupada por día).
- Creado `lib/scan-logger.ts`: función `logScan()` fire-and-forget. Lee `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`; si no están configuradas, omite el log sin romper el pipeline.
- Modificado `app/api/analyze/route.ts`: llama `void logScan({...})` al finalizar con éxito y también en el bloque de error, con todos los metadatos del pipeline.

### 2. Ruleta de Visión Multi-Plataforma con Metadata
- Modificado `lib/vision-roulette.ts`: la función `transcribeImagesWithRoulette` ya no devuelve solo `string[]` sino `RouletteResult { transcriptions, meta }`.
- Nuevo tipo `RouletteMeta`: `platformsUsed`, `modelsUsed`, `blacklistedSlots`, `rotationCount`, `totalSlots`.
- Plataformas activas validadas: **Groq** (Llama 4 Scout 17B), **Mistral** (Pixtral Large), **NVIDIA NIM** (Nemotron Nano 12B VL), **Scaleway** (Pixtral 12B).
- Eliminadas plataformas no funcionales: OpenRouter (timeout), GitHub GPT-4.1 (subtotales incorrectos), Cloudflare, TogetherAI, Moondream, LLM7, Fireworks.

### 3. Limpieza de Secretos (GitHub Push Protection)
- Eliminadas todas las API keys hardcodeadas de `app/api/test-vision/route.ts`, `docs/VISION_AI_UPGRADE.md` y `TEST_VISION_TECHNICAL_REPORT.md`.
- Sustituidas por `process.env.MISTRAL_API_KEY_1`, `process.env.SCALEWAY_API_KEY_1`, `process.env.NVIDIA_API_KEY_1`, etc.

### 4. App de Pruebas excluida del repositorio
- Añadido al `.gitignore`: `app/api/test-vision/`, `app/test-vision/`, `vision-test-*.txt`, `varaibles.txt`, `AI_MODELOS_VISION.md`, `TEST_VISION_TECHNICAL_REPORT.md`, `ia-disponibles.txt`.
- Archivos eliminados del repositorio remoto (`git rm --cached`) — permanecen solo en local.

### 5. Bugfix crítico: crash al iniciar la app
- **Causa**: `DashboardView` usaba `db.presupuestoMensual` y `stats.prevMonthTotal` pero `app/page.tsx` no pasaba `db`/`updateAndSync` como props ni calculaba `prevMonthTotal` en el `useMemo`.
- **Fix** en `app/page.tsx`: añadidos `db={db}` y `updateAndSync={updateAndSync}` al render de `DashboardView`, y añadido cálculo de `prevMonthTotal` a `stats`.

### 6. Seguridad Supabase Advisor
- Actualizado `supabase/scan_logs.sql`: vista `scan_stats` creada con `WITH (security_invoker = true)` para eliminar el warning "Security Definer View".
- Para instalaciones existentes: ejecutar `ALTER VIEW scan_stats SET (security_invoker = true);` en el SQL Editor.
- El warning "RLS Policy Always True" en `anon_insert` es intencional (logging anónimo del servidor).

### Pendiente del usuario
- Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en **Vercel → Settings → Environment Variables** y hacer Redeploy para activar el logger en producción.

---

## [v3.3] — 2026-04-04 — Ejecución de Fases (Insights, Presupuestos y Garantías)

**Implementación P.E.S. Automática de Mejoras Financieras.**

### 1. Insights Financieros (Comparativa Mes a Mes)
- Implementada lógica exacta por día en `app/page.tsx` para una comparación justa (`prevMonthTotal`).
- UI: Píldora de crecimiento/ahorro dinámico bajo el saldo total del mes.

### 2. Sistema de Presupuestos
- Ampliado `AppDB` con `presupuestoMensual`.
- Integrada barra de progreso reactiva (verde < 75%, naranja < 90%, roja > 90%).
- Formulario `inline` no invasivo en el Dashboard.

### 3. Gestor de Garantías
- Ampliado `Gasto` con `hasWarranty`.
- Nuevo toggle selector prominente en `ReviewModal.tsx` al guardar tickets.
- Filtro superior en la lista de registros del `DashboardView.tsx` para aislar tickets importantes.

### 4. Core UX y Normalización
**Resolución de fricciones del día a día (Acentos y Orden de la Lista)**
- Implementada función `cleanString` para remover acentos de las vocales respetando la "Ñ".
- El buscador de la lista de compras ahora filtra, normaliza y guarda los productos sin acentos, unificando historiales (ej. "JABÓN" y "JABON" ahora comparten el mismo ID).
- La lista de compras ahora envía automáticamente los ítems tachados (`checked: true`) al fondo de la lista de pendientes, manteniendo arriba lo que falta por comprar.

---

## [v3.2] — 2026-04-03 — Revert: Pipeline IA vuelve a Mistral+Groq

**Intento de migración BYOI (Bring Your Own Identity) con Google OAuth2 + Gemini cancelado por inviabilidad técnica.**

### Problema
Se intentó usar el token OAuth2 del usuario para llamar a la Gemini API (`generativelanguage.googleapis.com`) y así eliminar el costo de API Keys propias. Esto resultó inviable porque:
- El endpoint gratuito de Gemini **solo acepta API Keys**, no tokens OAuth de usuario
- Los scopes OAuth para Gemini (`generative-language`, `generative-language.peruserquota`) no autorizan llamadas al endpoint de generación
- El endpoint OAuth de Google AI es Vertex AI, que requiere billing activado

### Decisión
Revertir al pipeline original Mistral Pixtral + Groq LLaMA que funcionaba correctamente.

### Documentación del error
Ver [backend/gemini-byoi-postmortem.md](./backend/gemini-byoi-postmortem.md) para el análisis completo y lecciones aprendidas.

---

## [v3.1] — 2026-04-02 — Cross-Browser, Zoom Lock & PWA Universal

**Fijado bloqueo de zoom absoluto (triple capa), homologación cross-browser y botón instalar universal.**

### Zoom Lock
- `layout.tsx`: viewport `user-scalable=no, maximum-scale=1.0`
- `globals.css`: `touch-action: manipulation` + `-webkit-text-size-adjust: 100%` en `html, body`
- `globals.css`: `-webkit-appearance: none; appearance: none` en `button, input, select, textarea`

### Layout Fix
- `.app-layout`: `min-h-screen` → `h-full`, eliminado `pb-44` (movido a scroll container como `pb-[200px]`)
- `.app-layout`: `padding-top: env(safe-area-inset-top)` restaurado
- `ScannerView.tsx`: `space-y-6` → `h-full flex flex-col gap-6` (sin scroll, ocupa pantalla completa)

### PWA Install Universal
- `usePWAInstall.ts`: `isFirefox` detectado, incluido en `canInstall`
- `PWAInstallBanner.tsx`: modal Firefox de 3 pasos de texto
- `SettingsView.tsx`: `onClick` corregido para iOS/Firefox (antes era `undefined`, ahora muestra hint inline)
- `locales/es.json` + `locales/en.json`: 5 claves nuevas `pwa.firefox_*` + `pwa.ios_hint`

### Documentación
- `Docs_Actualizadas/agent-skills.md`: Skills 1-6 del agente IA documentadas con historial de decisiones
- `INDEX.md`: entrada añadida para `agent-skills.md`

---

## [v3.0] — 2026-04-02 — Auditoría Estructural

**Auditoría completa del proyecto. Limpieza de raíz, scripts y documentación.**

### Cambios Estructurales
- Scripts dispersos en raíz movidos a `scripts/dev-tools/` y `scripts/git/`.
- Archivos HTML de diseño movidos a `scripts/design/`.
- Directorio `/docs/` antiguo eliminado (reemplazado por `/Docs_Actualizadas/`).
- Directorio `/Auditoria_Proyecto_Consolidado/` eliminado (parcialmente vacío, obsoleto).
- `IA_INSTRUCTIONS.md` eliminado (contenido rescatado y distribuido en nueva documentación).

### Codigo Muerto Identificado
- `lib/gemini.ts` — Contiene solo `export * from './ai-client'`. No importado en ningún lugar.
- `route.ts` (raíz) — Copia duplicada de `app/api/analyze/route.ts`. No procesado por Next.js.
- `next.config.ts` — Stub vacío. Config real está en `next.config.mjs`.
- `postcss.config.mjs` — Usa `@tailwindcss/postcss` (Tailwind v4). El proyecto usa Tailwind v3. Config activo es `postcss.config.js`.

### Nueva Documentacion
- `Docs_Actualizadas/INDEX.md` — Índice maestro con mapa de navegación.
- `Docs_Actualizadas/architecture.md` — Arquitectura del sistema.
- `Docs_Actualizadas/environment.md` — Variables de entorno.
- `Docs_Actualizadas/frontend/` — Componentes, navegación, PWA.
- `Docs_Actualizadas/backend/` — Rutas API, pipeline de IA.
- `Docs_Actualizadas/lib/` — Sincronización, auth, base de datos.
- `Docs_Actualizadas/ui/` — Sistema de diseño, i18n.
- `Docs_Actualizadas/dev-tools/` — Guía de scripts.

---

## [v2.0] — 2026-03-25 — Correcciones de Produccion

- Resuelto error 400 en `lib/gemini.ts` (hoy `lib/ai-client.ts`): validación de entrada de imágenes.
- Corregido error 401 en `lib/gdrive.ts`: generadores de FormData para reintentos tras renovación de token.
- Corregidos errores de sintaxis en `lib/gemini.ts` y `lib/gdrive.ts` que impedían el build.

---

## [v2.0] — 2026-03-24 — Reparacion Vercel

- Corregida sintaxis en `app/api/analyze/route.ts` (lógica de rotación de claves).
- Eliminada dependencia de cliente `tesseract.js` de `app/components/ScannerView.tsx`.

---

## [v2.0] — 2026-03-20 — Sistema de IA Distribuida

- Implementado pipeline de dos pasos: Mistral Pixtral (visión) + Groq Llama 3.3 70B (síntesis).
- Sistema de rotación de claves de API para fiabilidad y gestión de cuotas.
- Soporte para tickets largos (hasta 3 imágenes procesadas en paralelo).
- Eliminada dependencia de OCR local (tesseract.js).

---

## [v1.0] — Inicial

- App offline-first con Next.js 15, React 19, Tailwind CSS.
- Autenticación Google OAuth2 con flujo seguro de token.
- Sincronización con Google Drive AppDataFolder.
- Catálogo de productos en Supabase.
- PWA instalable con manifest.json.
