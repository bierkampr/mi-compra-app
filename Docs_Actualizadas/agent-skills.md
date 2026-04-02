# Core AI Agent Skills — Mi Compra App

> Instrucciones de nivel de sistema para cualquier Agente de IA operando en este proyecto.
> Estas reglas tienen **prioridad máxima** y son inquebrantables.
> Añadidas: 2026-04-02.

---

## Skills Genéricas (Comportamiento del Agente)

### Skill 1: P.E.S. (Phased Execution System) — Anti-Saturación

**Regla:** NUNCA ejecutar múltiples tareas complejas de golpe. Si el usuario pide N cosas en un prompt, DETENERSE, analizar y dividir en Fases (Fase 1, Fase 2...).

**Ejecución:** Trabajar ÚNICAMENTE en la Fase actual. No leer archivos ni escribir código de la Fase 2 hasta que la Fase 1 esté 100% completada y verificada.

**Por qué:** Evita saturación de contexto, errores en cascada y modificaciones innecesarias de archivos no relacionados con el paso actual.

---

### Skill 2: Index-Driven Memory — Ahorro Extremo de Tokens

**Regla:** Está PROHIBIDO explorar directorios enteros buscando cómo funciona algo.

**Ejecución:** Siempre abrir PRIMERO este archivo (`INDEX.md`). Usar el índice para apuntar exactamente al archivo que se necesita leer. Entrar, leer, salir.

**Por qué:** Evita consumo innecesario de tokens de contexto leyendo decenas de archivos irrelevantes.

---

### Skill 3: C.D.P. (Continuous Documentation Protocol) — Memoria Histórica

**Regla:** Al finalizar CADA tarea o Fase de código, actualizar la documentación correspondiente ANTES de pasar a la siguiente fase.

**Regla de NO BORRADO:** NUNCA eliminar documentación de algo que fue reemplazado o que falló.

**Ejecución:**
- Si un código o enfoque no funcionó o fue reemplazado, moverlo a sección `### Historial / Deprecated` en el doc correspondiente.
- Explicar SIEMPRE el POR QUÉ del cambio.

**Ejemplo obligatorio de formato:**
> "Intento 1: Uso de meta tags para zoom → falló en iOS Safari (ignora `user-scalable`). Reemplazado por CSS táctico en `globals.css` con `touch-action: manipulation` y `-webkit-text-size-adjust: 100%`."

**Por qué:** Evita que futuras IAs repitan errores ya cometidos y diagnosticados.

---

## Skills Específicas del Proyecto (Reglas de la App)

### Skill 4: UI/UX Cross-Browser Master — PWA & Frontend

**Regla:** Todo código visual debe ser "Pixel-Perfect" y homologado para Webkit (Safari), Blink (Chrome) y Gecko (Firefox).

**Ejecución de Zoom:** Está estrictamente PROHIBIDO permitir zoom. Estrategia activa (triple capa):
1. `<meta name="viewport" content="..., maximum-scale=1.0, user-scalable=no">` en `layout.tsx`
2. `touch-action: manipulation` y `-webkit-text-size-adjust: 100%` en `html, body` en `globals.css`
3. `font-size: 16px !important` en todos los `input, select, textarea` en `globals.css`

**Ejecución de Safe Areas:** Todo el layout principal DEBE respetar notches usando `env(safe-area-inset-*)`:
- `padding-top: env(safe-area-inset-top)` → `.app-layout` en `globals.css`
- `bottom: calc(...+ env(safe-area-inset-bottom))` → `.nav-bottom` en `globals.css`
- `paddingTop: 'env(safe-area-inset-top)'` → `PWAInstallBanner.tsx` (banner fijo)

**Ejecución de Appearance Reset:** Todos los `button, input, select, textarea` deben tener:
```css
-webkit-appearance: none;
appearance: none;
```

---

### Skill 5: PWA Install Handler — Compatibilidad Universal

**Regla:** El botón "Instalar" JAMÁS debe arrojar error silencioso o romper la UI.

**Ejecución por navegador:**

| Navegador | Mecanismo | Implementado en |
|---|---|---|
| Chrome / Edge / Android | `beforeinstallprompt` → prompt nativo | `usePWAInstall.ts`, `PWAInstallBanner.tsx` |
| iOS Safari | Modal tutorial 4 pasos (imágenes) | `PWAInstallBanner.tsx` — `showIOSTutorial` |
| Firefox | Modal 3 pasos de texto | `PWAInstallBanner.tsx` — `showFirefoxTip` |
| Settings (secundario) | Toggle hint inline | `SettingsView.tsx` — `showInstallHint` |

**Detección en `usePWAInstall.ts`:**
```ts
setIsIOS(/iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream);
setIsFirefox(/Firefox/i.test(ua) && !(/iPhone|iPad|iPod/.test(ua)));
```

`canInstall = !!installPrompt || isIOS || isFirefox`

---

### Skill 6: Arquitectura Tailwind sin Scroll de Contenedor

**Regla:** La app debe sentirse como app nativa, no como página web.

**Ejecución:** El contenedor principal debe usar `h-full` (acotado por el `html, body { position: fixed; height: 100% }` del fix iOS), con el contenido scrollable como hijo `flex-1 overflow-y-auto`.

**Clearance del nav-bottom:**
- Contenedor scrollable (`page.tsx`): `pb-[200px]` — garantiza que el último ítem quede visible sobre la barra flotante.
- Vistas estáticas como `ScannerView`: usar `h-full flex flex-col` en lugar de `space-y-*` para llenar el espacio sin generar scroll.

**Estructura actual:**
```
<main class="app-layout">          ← h-full flex flex-col, safe-area-top
  <Navigation />                   ← nav-bottom es fixed (no consume espacio de layout)
  <div class="flex-1 overflow-y-auto pt-4 pb-[200px] no-scrollbar">
    <DashboardView />  ← puede scrollear
    <ScannerView />    ← h-full flex flex-col (no scrollea)
    <ShoppingListView />
    <SettingsView />
  </div>
</main>
```

---

## Historial / Deprecated

### [2026-04-02] Intento 1 — .app-layout con min-h-screen y padding fijo

`.app-layout` usaba `min-h-screen flex flex-col ... pb-44 pt-4`. Problemas:

- `min-h-screen` no acotaba la altura máxima, por lo que `flex-1` en el hijo no funcionaba correctamente para calcular la altura disponible.
- `pb-44` creaba un padding permanente enorme en el `main`, visible como espacio vacío blanco en algunas vistas.
- El `padding-bottom` y `padding-top` con `env(safe-area-inset-*)` estaban en el `main`, no en el contenedor scrollable.

**Reemplazado por:** `h-full` (acotado por el fix iOS `html, body { height: 100% }`), sin `pb-44` en el layout. El padding inferior se movió al contenedor scrollable (`pb-[200px]`). Safe-area-top se mantiene en `.app-layout`.
