# INDICE MAESTRO — Mi Compra App

> Versión: 3.0 | Auditado: 2026-04-02
> **Este archivo es el punto de entrada para toda IA o desarrollador.**
> Antes de modificar cualquier cosa, consulta el módulo correspondiente aquí.

---

## Orientacion Rapida

| Quieres saber sobre... | Lee este archivo |
|---|---|
| Visión general del sistema | [architecture.md](./architecture.md) |
| Variables de entorno y setup | [environment.md](./environment.md) |
| Los 13 componentes React | [frontend/components.md](./frontend/components.md) |
| Flujo de pantallas y navegación | [frontend/navigation-flow.md](./frontend/navigation-flow.md) |
| PWA y manifest | [frontend/pwa.md](./frontend/pwa.md) |
| Las 3 rutas API del servidor | [backend/api-routes.md](./backend/api-routes.md) |
| Pipeline de IA (Mistral + Groq) | [backend/ai-pipeline.md](./backend/ai-pipeline.md) |
| **⚠️ Por qué NO usar OAuth de Google para IA** | [**backend/gemini-byoi-postmortem.md**](./backend/gemini-byoi-postmortem.md) |
| Sincronización de datos (Drive + localStorage) | [lib/data-sync.md](./lib/data-sync.md) |
| Autenticación OAuth2 Google | [lib/auth.md](./lib/auth.md) |
| Esquema Supabase y modelo de datos | [lib/database.md](./lib/database.md) |
| Clases CSS premium, z-index, colores | [ui/design-system.md](./ui/design-system.md) |
| Sistema i18n (español/inglés) | [ui/i18n.md](./ui/i18n.md) |
| Scripts de desarrollo (qué hace cada uno) | [dev-tools/scripts.md](./dev-tools/scripts.md) |
| Historial de cambios | [CHANGELOG.md](./CHANGELOG.md) |
| **Reglas del Agente IA (Skills)** | [**agent-skills.md**](./agent-skills.md) |

---

## Mapa de Archivos de Codigo Fuente

```
app/
  page.tsx              ← Estado global (AppDB), lógica de sincronización
  layout.tsx            ← Layout raíz, meta PWA, COOP header
  globals.css           ← Clases CSS premium custom
  components/           → ver frontend/components.md
    AuthView.tsx
    DashboardView.tsx
    ShoppingListView.tsx
    ScannerView.tsx
    ReviewModal.tsx
    DetailView.tsx
    ConfirmModal.tsx
    HelpModal.tsx
    HelpTooltip.tsx
    Navigation.tsx
    Providers.tsx
    PWAInstallBanner.tsx
    SettingsView.tsx
  hooks/
    usePWAInstall.ts
  api/
    analyze/route.ts    → ver backend/ai-pipeline.md
    auth/token/route.ts → ver lib/auth.md
    auth/refresh/route.ts → ver lib/auth.md

lib/
  ai-client.ts          ← Cliente fetch hacia /api/analyze
  config.ts             ← CLIENT_ID, FILE_NAME, SUPABASE_URL
  gdrive.ts             ← API Google Drive (upload/download/refresh)
  i18n.ts               ← Sistema de traducciones
  products.ts           ← Búsqueda fuzzy en Supabase
  supabase.ts           ← Cliente Supabase inicializado
  tokenStore.ts         ← Gestión tokens OAuth2 (sessionStorage + localStorage)
  types.ts              ← Interfaces TypeScript (Gasto, ListItem, AppDB...)
  utils.ts              ← Funciones helpers
  gemini.ts             ← [ARCHIVO CANDIDATO A ELIMINACION] Re-export de ai-client, no importado

locales/
  es.json               ← Textos en español
  en.json               ← Textos en inglés

public/
  manifest.json         ← Config PWA (nombre, iconos, colores)
```

---

## Reglas de Desarrollo (Resumen Ejecutivo)

1. **Mutacion de estado:** Siempre vía `updateAndSync(newDb)` en `app/page.tsx`.
2. **Textos:** Todo texto visible en UI via `txt('modulo.clave')` (i18n obligatorio).
3. **Z-Index:** Respetar jerarquía estricta — ver [ui/design-system.md](./ui/design-system.md).
4. **API Keys:** Nunca en el cliente. Solo en `app/api/analyze/route.ts` via `process.env`.
5. **Offline-First:** No bloquear render inicial con llamadas a Supabase.
6. **CSS:** Usar clases definidas en `globals.css`, no inventar clases inline complejas.
