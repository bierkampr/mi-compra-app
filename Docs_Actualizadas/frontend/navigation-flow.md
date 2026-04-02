# Flujo de Navegacion y Vistas

> Fuente: `app/page.tsx` — controla `activeTab` y `user.loggedIn`.

---

## Estado de Control

En `app/page.tsx`:
- `user.loggedIn: boolean` — determina si mostrar `AuthView` o la app principal.
- `activeTab: 'dashboard' | 'list' | 'scanner' | 'settings'` — vista activa.
- `selectedGasto: Gasto | null` — si existe, `DetailView` se superpone.
- `showReviewModal: boolean` — controla `ReviewModal`.
- `showConfirmModal: boolean` — controla `ConfirmModal`.

## Mapa de Flujo

```
App carga
    │
    ├─ [sin sesión] → AuthView
    │                    │ login Google
    │                    ▼
    │               Carga AppDB desde localStorage / Google Drive
    │                    │
    └─ [con sesión] ─────▼
                    Navigation (tabs)
                    │
                    ├─ tab: dashboard → DashboardView
                    │                      │ click en gasto
                    │                      ▼
                    │                  DetailView (z-1200, overlay)
                    │
                    ├─ tab: list → ShoppingListView
                    │                  │ botón scanner
                    │                  ▼
                    │              ScannerView (modal)
                    │                  │ análisis IA completo
                    │                  ▼
                    │              ReviewModal (z-1100)
                    │                  │ confirmar
                    │                  ▼
                    │              updateAndSync() → vuelta a List/Dashboard
                    │
                    ├─ tab: scanner → ScannerView (directo)
                    │
                    └─ tab: settings → SettingsView
```

## Carga Inicial de Datos

1. `page.tsx` al montar: lee `localStorage` (`mi_compra_cache_db`) → estado instantáneo.
2. Si hay `access_token` válido: intenta sincronizar con Google Drive en segundo plano.
3. Si Drive tiene datos más recientes: actualiza `localStorage` y el estado React.
4. Si no hay sesión: solo muestra `AuthView` (no necesita datos).
