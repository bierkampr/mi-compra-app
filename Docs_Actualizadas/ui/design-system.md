# Sistema de Diseño — Mi Compra App

> Fuente: `app/globals.css`, `tailwind.config.js`, `app/layout.tsx`.
> Auditado: 2026-04-02.

---

## Paleta de Colores

| Token | Valor | Uso |
|---|---|---|
| Fondo principal | `#0D0F1A` | Background de toda la app |
| Superficie cards | `#151829` / `#1a1f35` | Cards, modales |
| Acento primario | Gradiente azul/púrpura | Botones, highlights |
| Texto primario | `#E2E8F0` | Texto principal |
| Texto secundario | `#94A3B8` | Labels, subtítulos |

---

## Clases CSS Premium (globals.css)

Estas clases son las únicas que deben usarse para componentes UI.
No inventar clases Tailwind complejas inline. Si algo no tiene clase, definirla en `globals.css`.

| Clase | Descripción |
|---|---|
| `card-premium` | Card con fondo oscuro, borde sutil, sombra |
| `btn-primary` | Botón principal con gradiente de acento |
| `btn-secondary` | Botón secundario, estilo ghost |
| `input-premium` | Input con fondo oscuro y borde sutil |
| `text-small-caps` | Texto en versalitas (small caps) |
| `text-fluid-lg` | Texto fluido grande (responsive) |
| `text-fluid-2xl` | Texto fluido extra grande (responsive) |
| `nav-bottom` | Barra de navegación inferior fija |

---

## Jerarquia Z-Index (ESTRICTA — no modificar)

| Z-Index | Componente | Descripción |
|---|---|---|
| `z-[9999]` | `ConfirmModal` | Modales críticos, overlays de sistema |
| `z-[9000]` | Spinner global | Loading overlay (`Loader2`) |
| `z-[1200]` | `DetailView` | Visor de gasto completo |
| `z-[1100]` | `ReviewModal` | Revisión de ticket de IA |
| `z-[1000]` | `ScannerView` (captura) | Overlay de cámara |
| `z-[600]` | Modales de contenido | Modales generales |
| `z-[100]` | `Navigation` | Barra inferior (nav-bottom) |

> Cualquier nuevo modal DEBE respetar esta jerarquía.
> Añadir el z-index en esta tabla al crear un nuevo overlay.

---

## Tipografia Fluida

Usar `text-fluid-lg` y `text-fluid-2xl` para títulos y encabezados importantes.
Garantizan legibilidad en pantallas desde 320px (mobile pequeño) a 1440px.

---

## iOS / Android Mobile

- `safe-area-inset-bottom` en la `Navigation` para respetar el notch inferior de iOS.
- `android.hardware.back.button` gestionado en `page.tsx` (historial de navegación interno).
- Colores de tema declarados en `<meta name="theme-color">` en `layout.tsx`.

---

## Configuracion Tailwind

**Archivo activo:** `tailwind.config.js` (CommonJS, Tailwind v3).
`postcss.config.js` es el config activo de PostCSS (plugins: `tailwindcss` + `autoprefixer`).

> `postcss.config.mjs` y `next.config.ts` son archivos MUERTOS (ver reporte de auditoría).
