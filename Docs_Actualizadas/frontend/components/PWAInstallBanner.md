# PWAInstallBanner.tsx — Diccionario del Componente

> Archivo: `app/components/PWAInstallBanner.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Banner flotante de instalación de la PWA. Detecta automáticamente el navegador y plataforma para mostrar la experiencia de instalación correcta: prompt nativo para Chrome/Edge, tutorial de 4 pasos con screenshots para iOS, y guía de 3 pasos de texto para Firefox. Se descarta permanentemente con `localStorage`.

---

## Props

```typescript
interface PWAInstallBannerProps {
  txt: (key: string) => string;    // Función i18n
}
```

---

## Estado interno

| Variable | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `installPrompt` | `any \| null` | `null` | Evento `beforeinstallprompt` capturado (Chrome/Edge) |
| `showBanner` | `boolean` | `false` | Controla la visibilidad del banner principal |
| `showIOSTutorial` | `boolean` | `false` | Muestra la pantalla completa de tutorial iOS |
| `showFirefoxTip` | `boolean` | `false` | Muestra el bottom sheet de instrucciones Firefox |
| `iosStep` | `number` | `0` | Paso actual del tutorial iOS (0–3) |
| `isIOS` | `boolean` | `false` | True si el dispositivo es iPhone/iPad/iPod |
| `isFirefox` | `boolean` | `false` | True si el navegador es Firefox (y no iOS) |

---

## Efectos (useEffect)

**`[]` (mount once)**:
1. Si `localStorage.getItem('pwa_banner_dismissed')` → no hace nada
2. Si la app ya está en modo standalone (installada) → no hace nada
3. Detecta iOS: `/iPhone|iPad|iPod/i.test(userAgent)`
4. Detecta Firefox: `/Firefox/i.test(userAgent) && !ios`
5. Si iOS o Firefox: `setShowBanner(true)` (no hay evento nativo, el banner aparece siempre)
6. Si Chrome/Edge: escucha `beforeinstallprompt` → lo guarda en `installPrompt` + `setShowBanner(true)`
7. Cleanup: elimina el listener de `beforeinstallprompt`

---

## Funciones

### `handleInstall()`
Solo para Chrome/Edge:
1. Llama `installPrompt.prompt()` — muestra el diálogo nativo del sistema
2. Espera `installPrompt.userChoice`
3. Si `outcome === 'accepted'` → `setShowBanner(false)`

### `handleDismiss()`
1. Oculta todas las vistas: `setShowBanner(false)`, `setShowIOSTutorial(false)`, `setShowFirefoxTip(false)`
2. `localStorage.setItem('pwa_banner_dismissed', 'true')` — permanente: el banner nunca vuelve a aparecer

---

## Datos de los pasos iOS

```typescript
const iosSteps = [
  { title, desc, img: '/tutorial/cuadro-compartir.jpg' },     // Paso 1: botón compartir
  { title, desc, img: '/tutorial/ver-mas.jpg' },               // Paso 2: ver más opciones
  { title, desc, img: '/tutorial/añadir-a-pantalla.jpg' },    // Paso 3: añadir a pantalla inicio
  { title, desc, img: '/tutorial/agregar.jpg' },               // Paso 4: confirmar "Agregar"
];
```

Las imágenes están en `public/tutorial/`. La imagen del paso 3 tiene la `ñ` URL-encoded (`%C3%B1`).

---

## Layout — Tres vistas posibles

### Vista 1: Banner fijo superior (default, `!showIOSTutorial`)
- Posición: `fixed top-0` con `paddingTop: env(safe-area-inset-top)` (respeta notch iOS)
- Z-index: `z-[500]`
- Fondo: gradiente violeta `from-[#3d1fc8] via-brand-primary to-[#4318BB]`
- Animación: `slide-in-from-top-2`

**Botón principal** (toda la barra menos el X):
- iOS → `setShowIOSTutorial(true)`
- Firefox → `setShowFirefoxTip(true)`
- Chrome/Edge → `handleInstall()`
- Muestra: icono `Smartphone` + título `pwa.banner_title` + descripción + botón `pwa.install_btn` o `pwa.ios_btn`

**Botón X** (posición absoluta):
- `w-14 h-full` — área táctil grande
- → `handleDismiss()`

### Vista 2: Guía Firefox (bottom sheet, `showFirefoxTip`)
- Overlay: `fixed inset-0 z-[9998]`, `bg-black/70 backdrop-blur-md`
- 3 pasos numerados (naranja) con texto de cada paso
- Botón cerrar → `handleDismiss()`

### Vista 3: Tutorial iOS pantalla completa (`showIOSTutorial`)
- `fixed inset-0 z-[9998]`, fondo `brand-bg`
- Animación: `slide-in-from-bottom`

**Header**: contador "Paso X / 4" + título del paso actual + botón `X`

**Barra de progreso**: 4 segmentos, los anteriores en violeta, el actual en violeta pulsante, los siguientes en blanco/10

**Imagen**: `max-w-[280px]`, redondeada, borde, número del paso sobreimpuesto (`rounded-full`)

**Descripción**: card con `brand-primary/20` border

**Botones de navegación**:
- Izquierda: "Atrás" (si `iosStep > 0`) o "Omitir" (`help.skip`) si es el primer paso
- Derecha: "Siguiente" + `ChevronRight` (si hay más pasos) o "✓ done" (último paso)
- Ambos botones → `setIosStep()` o `handleDismiss()` en el último paso

---

## Z-Index

| Elemento | Z-Index |
|---|---|
| Banner fijo superior | `z-[500]` |
| Tutorial iOS / guía Firefox | `z-[9998]` |

---

## localStorage

| Clave | Cuándo se escribe | Efecto |
|---|---|---|
| `pwa_banner_dismissed` | Al hacer `handleDismiss()` | El banner nunca vuelve a aparecer (aunque se recargue) |

---

## Iconos (lucide-react)

| Icono | Uso |
|---|---|
| `X` | Cerrar banner / cerrar guía Firefox / cerrar tutorial iOS |
| `ChevronRight` | Flecha en el botón del banner + botón "Siguiente" del tutorial iOS |
| `ChevronLeft` | Botón "Atrás" del tutorial iOS |
| `Smartphone` | Icono en el banner + icono en la guía Firefox |

---

## Claves i18n usadas

| Clave | Descripción |
|---|---|
| `pwa.banner_title` | Título del banner |
| `pwa.banner_desc` | Descripción corta del banner |
| `pwa.install_btn` | Texto botón Chrome (INSTALAR) |
| `pwa.ios_btn` | Texto botón iOS/Firefox (VER CÓMO) |
| `pwa.firefox_title` | Título de la guía Firefox |
| `pwa.firefox_step1/2/3` | Pasos de instalación Firefox |
| `pwa.ios_tutorial_label` | "PASO" (en el stepper del tutorial iOS) |
| `pwa.ios_step1/2/3/4_title` | Títulos de cada paso iOS |
| `pwa.ios_step1/2/3/4_desc` | Descripciones de cada paso iOS |
| `pwa.ios_done` | Texto del botón final ("¡LISTO!") |
| `pwa.ios_hint` | Subtexto del banner en iOS (cuando no está instalado) |
| `pwa.firefox_hint` | Subtexto del banner en Firefox |
| `help.next` | "Siguiente" |
| `help.skip` | "Omitir" |
| `help.close` | "Cerrar" |

---

## Notas importantes

- El banner respeta el notch de iOS con `paddingTop: env(safe-area-inset-top)` (inline style, no Tailwind, porque las variables CSS dinámicas no funcionan con `pt-[]`)
- La imagen del paso 3 de iOS (`añadir-a-pantalla.jpg`) tiene la ñ URL-encoded para evitar problemas con servidores que no manejan correctamente caracteres especiales en paths
- El componente tiene su propia detección de plataforma independiente de `usePWAInstall` (duplicada pero separada del hook para no acoplarse)
- `handleDismiss` en el tutorial iOS cierra directamente sin preguntar — el usuario no pierde datos al cerrar
