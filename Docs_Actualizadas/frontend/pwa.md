# PWA (Progressive Web App)

> Fuente: `public/manifest.json`, `app/layout.tsx`, `app/hooks/usePWAInstall.ts`.

---

## Configuracion

La app está configurada como PWA instalable en móviles y escritorio.

### manifest.json (`public/manifest.json`)
Define nombre, iconos, colores de tema y modo de visualización (standalone).

### Meta Tags en layout.tsx
- `<meta name="theme-color">` — color de la barra del navegador.
- `<meta name="apple-mobile-web-app-capable">` — soporte iOS.
- `<meta name="apple-mobile-web-app-status-bar-style">` — barra de estado iOS.
- Links a iconos para apple-touch-icon.

## Instalacion en Dispositivo

1. **Android/Chrome:** Aparece el banner `PWAInstallBanner` con el prompt nativo.
2. **iOS/Safari:** El banner muestra instrucciones manuales (Compartir → Añadir a pantalla de inicio).

El hook `usePWAInstall.ts` captura el evento `beforeinstallprompt` y lo guarda para activarlo cuando el usuario hace tap en el banner.

## Capacidades Offline

La app es funcional sin conexión porque:
- Todo el estado se lee de `localStorage` en el montaje inicial.
- La sincronización con Google Drive es silenciosa y en segundo plano.
- Si Drive falla (sin red), los datos locales siguen siendo la fuente de verdad.
- El análisis de tickets **requiere conexión** (llamada a `/api/analyze`).

## Imagenes del Tutorial

Las capturas de pantalla de ayuda están en `public/tutorial/` y se usan en `HelpModal.tsx`.
Las capturas de `imagenes/` (agregar.png, añadir-a-pantalla.png, etc.) son assets de demostración
de la funcionalidad PWA, usados en la documentación de soporte.
