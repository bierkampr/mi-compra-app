# PWA Manifest — public/manifest.json

> Fuente: `public/manifest.json`
> Auditado: 2026-04-24

---

## Resumen

Configuración de la Progressive Web App (PWA). Define cómo la app se comporta cuando se instala en dispositivos móviles y escritorio.

---

## Configuración Actual

```json
{
  "name": "Mi Compra App",
  "short_name": "Mi Compra",
  "description": "Gestor de gastos con IA y modo offline",
  "start_url": "/",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui"],
  "orientation": "portrait",
  "background_color": "#0D0F1A",
  "theme_color": "#0D0F1A",
  "icons": [...]
}
```

---

## Campos Explicados

### name
**Valor:** "Mi Compra App"
**Uso:** Nombre completo de la app en instaladores y menús.

### short_name
**Valor:** "Mi Compra"
**Uso:** Nombre corto cuando hay espacio limitado (barra de tareas, icono).

### description
**Valor:** "Gestor de gastos con IA y modo offline"
**Uso:** Descripción en stores de apps.

### start_url
**Valor:** "/"
**Uso:** URL que se abre al lanzar la app.

### display
**Valor:** "standalone"
**Opciones:**
- `standalone` - Se ejecuta como app nativa (sin barra de navegador)
- `minimal-ui` - UI mínima del navegador
- `browser` - Se ejecuta en navegador normal

### display_override
**Valor:** `["standalone", "minimal-ui"]`
**Propósito:** Prioridad de modos de display. Intenta standalone primero, fallback a minimal-ui.

### orientation
**Valor:** "portrait"
**Propósito:** Forzar orientación vertical en móviles.

### background_color
**Valor:** "#0D0F1A"
**Propósito:** Color de fondo mientras la app carga.

### theme_color
**Valor:** "#0D0F1A"
**Propósito:** Color de la barra de dirección del navegador. Debe coincidir con `<meta name="theme-color">` en `layout.tsx`.

---

## Iconos

```json
"icons": [
  {
    "src": "https://cdn-icons-png.flaticon.com/512/2331/2331970.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "https://cdn-icons-png.flaticon.com/512/2331/2331970.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "maskable"
  },
  {
    "src": "https://cdn-icons-png.flaticon.com/512/2331/2331970.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any"
  }
]
```

**purpose:**
- `any` - Icono general
- `maskable` - Icono adaptativo para notificaciones (Android)

**Nota:** Actualmente usa iconos de Flaticon (CDN externo). Para producción, considerar usar iconos locales en `public/icons/`.

---

## Integración

**En `app/layout.tsx`:**
```typescript
export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mi Compra",
  },
};
```

**En `app/layout.tsx` (meta tags):**
```html
<meta name="theme-color" content="#0D0F1A" />
```

---

## Hook Asociado

**`app/hooks/usePWAInstall.ts`:** Detecta el evento `beforeinstallprompt` del navegador y expone la función para activar el prompt nativo de instalación.
