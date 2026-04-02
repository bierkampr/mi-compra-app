# REPORTE DE AUDITORÍA v3.0 — Mi Compra App

**Fecha:** 2026-04-02
**Auditor:** Agente Autónomo Senior de Arquitectura

---

## FASE 1 — Limpieza Estructural

### 1.1 Archivos Movidos desde la Raíz

#### Scripts → /scripts/

| Archivo original (raíz) | Nuevo path | Descripción |
|---|---|---|
| `aud.js` | `scripts/dev-tools/generate-context.js` | Genera PROYECTO_COMPLETO.txt para contexto de IA |
| `auditor.js` | `scripts/dev-tools/generate-digest.js` | Genera project_digest.xml (alternativa XML) |
| `generar_memoria.js` | `scripts/dev-tools/generate-docs.js` | Generador de documentación /docs/ (obsoleto) |
| `ia_sync.js` | `scripts/git/ia-sync.js` | Sincronizador de log + git push (obsoleto) |
| `subir.js` | `scripts/git/push.js` | Automatizador seguro de git add/commit/push |

#### Archivos HTML de Diseño → /scripts/design/

| Archivo original (raíz) | Nuevo path |
|---|---|
| `design-preview.html` | `scripts/design/design-preview.html` |
| `design_framework.html` | `scripts/design/design-framework.html` |
| `design-system-report.md` | `scripts/design/design-system-report.md` |

---

### 1.2 Código Muerto Identificado (Candidatos a Eliminación Permanente)

Los siguientes archivos existen en el proyecto pero **NO están siendo utilizados**:

| Archivo | Motivo | Acción recomendada |
|---|---|---|
| `lib/gemini.ts` | Contiene solo `export * from './ai-client'`. No es importado en ningún archivo del proyecto. Nombre legacy de cuando se usaba Gemini directamente. | **ELIMINAR** |
| `route.ts` (raíz) | Copia exacta de `app/api/analyze/route.ts`. Al estar fuera de `app/api/`, Next.js no lo registra como ruta. Es un archivo huérfano. | **ELIMINAR** |
| `next.config.ts` | Stub vacío (`const nextConfig: NextConfig = {}`). La configuración real (CORS, build options) está en `next.config.mjs`. | **ELIMINAR** |
| `postcss.config.mjs` | Usa `@tailwindcss/postcss` (API de Tailwind v4). El proyecto usa Tailwind v3.4.17. El config activo es `postcss.config.js`. | **ELIMINAR** |

#### Artefactos Generados (no son código)

| Archivo | Tamaño | Descripción | Estado |
|---|---|---|---|
| `PROYECTO_COMPLETO.txt` | 183KB | Output de `generate-context.js` | Ya en `.gitignore`. No eliminar, se regenera. |
| `project_digest.xml` | 217KB | Output de `generate-digest.js` | Ya en `.gitignore`. No eliminar, se regenera. |
| `Miniconda3-latest-Windows-x86_64.exe` | ~98MB | Instalador de Python/Conda sin relación con el proyecto | **ELIMINAR MANUALMENTE** (98MB en repo es un problema serio) |

---

## FASE 2 — Documentación

### 2.1 Documentación Eliminada

| Directorio/Archivo | Motivo de eliminación |
|---|---|
| `/docs/` (completo) | Generada automáticamente por `generar_memoria.js`. Obsoleta, reemplazada por `/Docs_Actualizadas/`. |
| `/Auditoria_Proyecto_Consolidado/` (completo) | Sistema de auditoría anterior. Mayormente vacío (Backend/, Base_de_Datos/, Frontend/, Infraestructura_y_Entorno/ sin contenido). Solo tenía 2 archivos de contenido, rescatados. |
| `IA_INSTRUCTIONS.md` (raíz) | Reemplazado por la nueva documentación modular. Contenido rescatado en `Docs_Actualizadas/`. |

### 2.2 Nueva Estructura de Documentación /Docs_Actualizadas/

```
Docs_Actualizadas/
├── INDEX.md                   ← ÍNDICE MAESTRO — Leer primero
├── architecture.md            ← Visión general, stack, flujos de datos
├── environment.md             ← Variables de entorno y configuración
├── CHANGELOG.md               ← Historial de cambios
│
├── frontend/
│   ├── components.md          ← Los 13 componentes React + hook usePWAInstall
│   ├── navigation-flow.md     ← Flujo de pantallas y estado de control
│   └── pwa.md                 ← PWA, manifest, offline capabilities
│
├── backend/
│   ├── api-routes.md          ← 3 rutas API (analyze, auth/token, auth/refresh)
│   └── ai-pipeline.md         ← Pipeline Mistral + Groq, rotación de claves
│
├── lib/
│   ├── data-sync.md           ← updateAndSync, localStorage, Google Drive
│   ├── auth.md                ← OAuth2 flow, tokenStore, renovación automática
│   └── database.md            ← AppDB, Gasto, ListItem, tablas Supabase
│
├── ui/
│   ├── design-system.md       ← Colores, clases CSS premium, jerarquía z-index
│   └── i18n.md                ← Sistema de internacionalización custom
│
└── dev-tools/
    └── scripts.md             ← Qué hace cada script en /scripts/
```

---

## FASE 3 — Árbol de Directorios de Scripts

```
scripts/
├── dev-tools/
│   ├── generate-context.js    (node scripts/dev-tools/generate-context.js)
│   ├── generate-digest.js     (node scripts/dev-tools/generate-digest.js)
│   └── generate-docs.js       (OBSOLETO - genera /docs/ antiguo)
│
├── git/
│   ├── push.js                (node scripts/git/push.js)
│   └── ia-sync.js             (OBSOLETO - depende de IA_INSTRUCTIONS.md eliminado)
│
└── design/
    ├── design-preview.html
    ├── design-framework.html
    └── design-system-report.md
```

---

## FASE 4 — Resumen Ejecutivo

### Estado del proyecto post-auditoría

| Métrica | Antes | Después |
|---|---|---|
| Archivos sueltos en raíz | 14 (sin contar configs) | 6 (solo configs legítimos) |
| Scripts en raíz | 5 | 0 |
| Directorios de documentación | 3 (/docs, /Auditoria…, raíz) | 1 (/Docs_Actualizadas) |
| Archivos de doc (.md) | 14 dispersos y redundantes | 13 modulares y navegables |
| Configs duplicados activos | 2 pares (next.config, postcss.config) | Identificados y documentados |
| Código muerto | No documentado | 4 archivos identificados explícitamente |

### Configuraciones Activas (confirmadas por código)

| Config | Archivo activo | Archivo muerto |
|---|---|---|
| Next.js | `next.config.mjs` | `next.config.ts` (stub vacío) |
| PostCSS | `postcss.config.js` | `postcss.config.mjs` (Tailwind v4, incorrecto) |

### Acciones Manuales Pendientes (requieren decisión del equipo)

1. **Eliminar archivos muertos:** `lib/gemini.ts`, `route.ts` (raíz), `next.config.ts`, `postcss.config.mjs`.
2. **Eliminar `Miniconda3-latest-Windows-x86_64.exe`** (98MB, no pertenece al proyecto).
3. **Revisar `scripts/git/ia-sync.js`** — funciona con `IA_INSTRUCTIONS.md` que fue eliminado.
4. **Actualizar `.clinerules`** si se sigue usando Cline — apuntar a `/Docs_Actualizadas/INDEX.md`.

---

*Reporte generado automáticamente por auditoría estructural 2026-04-02.*
