# Hook usePWAInstall — app/hooks/usePWAInstall.ts

> Fuente: `app/hooks/usePWAInstall.ts`
> Auditado: 2026-04-24
> Importado en: `app/components/PWAInstallBanner.tsx`

---

## Resumen

Hook personalizado que detecta si la PWA puede instalarse y maneja el evento `beforeinstallprompt`.

---

## Estado del Hook

```typescript
{
  canInstall: boolean;      // Si el dispositivo soporta instalación
  installPrompt: any;       // Objeto prompt nativo (si existe)
  isIOS: boolean;           // Si es dispositivo iOS
  isFirefox: boolean;       // Si es navegador Firefox
  isInstalled: boolean;     // Si ya está instalado (standalone)
  handleInstall: () => Promise<boolean>;  // Función para activar instalación
}
```

---

## Funciones

### handleInstall(): Promise<boolean>
Activa el prompt nativo de instalación del navegador.

**Retorna:**
- `true` si el usuario aceptó la instalación
- `false` si rechazó o no había prompt disponible

**Flujo:**
1. Verifica que `installPrompt` exista
2. Llama `installPrompt.prompt()`
3. Espera la decisión del usuario
4. Si aceptó → limpia el prompt (ya no se puede volver a mostrar)
5. Devuelve `outcome === 'accepted'`

---

## Detección de Plataforma

### iOS
Detectado por user agent: `/iPhone|iPad|iPod/`
iOS no soporta `beforeinstallprompt` - necesita instrucciones manuales.

### Firefox
Detectado por user agent: `/Firefox/i` (excluyendo iOS)
Firefox soporta instalación pero con flujo diferente.

### Standalone
Detectado por media query: `window.matchMedia('(display-mode: standalone)')`
Si es true, la app ya está instalada.

---

## Integración

**En `app/components/PWAInstallBanner.tsx`:**
```typescript
import { usePWAInstall } from '../hooks/usePWAInstall';

const { canInstall, installPrompt, isIOS, isFirefox, isInstalled, handleInstall } = usePWAInstall();

if (!canInstall || isInstalled) return null;

// Mostrar banner según plataforma
if (isIOS) return <IOSTutorial />;
if (isFirefox) return <FirefoxTutorial />;
return <NativeBanner onInstall={handleInstall} />;
```

---

## Evento beforeinstallprompt

El hook escucha el evento global `beforeinstallprompt`:
```typescript
window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault();
  _prompt = e;
  setInstallPrompt(e);
});
```

El evento se previene para poder mostrar el banner en el momento deseado.
