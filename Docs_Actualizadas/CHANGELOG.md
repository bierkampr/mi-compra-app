# CHANGELOG — Mi Compra App

> Historial de cambios significativos. Fuente: IA_INSTRUCTIONS.md (rescatado) + auditoría 2026-04-02.

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
