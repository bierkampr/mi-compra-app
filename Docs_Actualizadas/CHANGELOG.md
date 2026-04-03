# CHANGELOG — Mi Compra App

> Historial de cambios significativos. Fuente: IA_INSTRUCTIONS.md (rescatado) + auditoría 2026-04-02.

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
