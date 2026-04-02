# Componentes React — Mi Compra App

> Todos los componentes viven en `app/components/`.
> Se renderizan condicionalmente en `app/page.tsx` según `activeTab` y estado de sesión.
> Para el flujo de navegación entre vistas, ver [navigation-flow.md](./navigation-flow.md).

---

## Componentes de Vista Principal (Views)

### AuthView.tsx
- **Rol:** Pantalla de bienvenida y login. Se muestra cuando no hay sesión activa (`!user.loggedIn`).
- **Funciona:** Inicializa Google Identity Services (GSI), gestiona el flujo OAuth2.
- **Output:** Llama al callback `onLogin(user)` en `page.tsx` al autenticarse.

### DashboardView.tsx
- **Rol:** Vista principal post-login. Muestra resumen de gastos del mes actual.
- **Incluye:** Donut chart SVG nativo (sin librerías externas), listado de gastos por fecha.
- **Props clave:** `db`, `currentViewDate`, `onViewDateChange`, `onSelectGasto`, `txt`.
- **Filtrado:** Muestra gastos del mes según `currentViewDate`, no el mes real.

### ShoppingListView.tsx
- **Rol:** Lista de la compra interactiva. Permite añadir, tachar y eliminar items.
- **Integración Supabase:** Buscador con autocompletado fuzzy que consulta `productos` y `producto_alias`.
- **Integración Scanner:** Botón para abrir `ScannerView` desde esta pantalla.
- **Props clave:** `db`, `onUpdateDb`, `onOpenScanner`, `txt`.

### ScannerView.tsx
- **Rol:** Interfaz de cámara nativa (WebRTC). Captura, recorta y comprime imágenes antes de enviarlas a la IA.
- **Flujo:** Captura hasta 3 fotos → llama `analyzeReceipt()` (lib/ai-client.ts) → abre `ReviewModal`.
- **Sin dependencias OCR:** Todo el procesamiento visual ocurre en el servidor.
- **Props clave:** `onClose`, `onAnalysisComplete`, `txt`.

### ReviewModal.tsx
- **Rol:** Pantalla crítica donde el humano revisa lo que la IA extrajo del ticket antes de guardarlo.
- **Incluye:** Comparación de precios históricos (via Supabase), edición de campos, confirmación.
- **Z-Index:** `z-[1100]` (ver [design-system.md](../ui/design-system.md)).
- **Props clave:** `analysisResult`, `onConfirm`, `onCancel`, `db`, `txt`.

### DetailView.tsx
- **Rol:** Visor detallado de un gasto guardado. Incluye lightbox para ver el ticket (imagen desde Google Drive).
- **Z-Index:** `z-[1200]`.
- **Props clave:** `gasto`, `onClose`, `accessToken`, `txt`.

### SettingsView.tsx
- **Rol:** Configuración de usuario. Gestión de cuenta, categorías custom, idioma.
- **Props clave:** `user`, `onLogout`, `db`, `onUpdateDb`, `currentLang`, `onChangeLang`, `txt`.

---

## Componentes Modales / Utilitarios

### ConfirmModal.tsx
- **Rol:** Modal genérico de confirmación (Sí / No). Usado para borrar gastos, cerrar sesión, etc.
- **Z-Index:** `z-[9999]`.

### HelpModal.tsx
- **Rol:** Modal con instrucciones de uso de la app. Muestra capturas y texto explicativo.

### HelpTooltip.tsx
- **Rol:** Tooltip inline de ayuda contextual. Se muestra al hacer hover/tap sobre iconos `?`.

---

## Componentes de Layout / Sistema

### Navigation.tsx
- **Rol:** Barra de navegación inferior fija. Tabs: Dashboard, Lista, Scanner, Ajustes.
- **Z-Index:** `z-[100]` (nav-bottom class).
- **Nota:** Maneja safe-area-inset para iOS (padding extra en notch).

### Providers.tsx
- **Rol:** Wrapper de contextos globales de React (si aplica). Envuelve la app en `layout.tsx`.

### PWAInstallBanner.tsx
- **Rol:** Banner que invita al usuario a instalar la PWA. Solo aparece si el dispositivo soporta instalación.
- **Hook asociado:** `app/hooks/usePWAInstall.ts` — detecta el evento `beforeinstallprompt`.

---

## Hooks Personalizados

### usePWAInstall.ts (`app/hooks/`)
- **Rol:** Escucha el evento `beforeinstallprompt` del navegador y lo expone para `PWAInstallBanner`.
- **Returns:** `{ canInstall: boolean, promptInstall: () => void }`.
