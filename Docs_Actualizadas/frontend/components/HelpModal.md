# HelpModal.tsx — Diccionario del Componente

> Archivo: `app/components/HelpModal.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Modal de tutorial / onboarding. Se muestra al primer uso y también es accesible desde el botón `(i)` del header y desde `SettingsView`. Presenta en formato de secciones colapsadas las funcionalidades clave de la app: Dashboard, Lista, Escáner, Revisión y Ajustes.

---

## Props

```typescript
interface HelpModalProps {
  onClose: () => void;             // Cierra el modal
  txt: (key: string) => string;    // Función i18n
}
```

---

## Estado interno

Ninguno — componente sin estado propio. Todo el contenido es estático generado desde `txt()`.

---

## Tipos internos

```typescript
interface TipItem {
  label: string;   // Título del tip (negrita)
  text: string;    // Descripción del tip
}

interface HelpSection {
  icon: React.ReactNode;   // Icono de la sección
  color: string;           // Clase de fondo del header de la sección
  accent: string;          // Clase de color del icono y el punto decorativo
  title: string;           // Título de la sección
  tips: TipItem[];         // Lista de tips de esa sección
}
```

---

## Secciones generadas

| Sección | Icono | Color accent | Tips |
|---|---|---|---|
| Dashboard | `BarChart3` | `brand-primary` | Tarjeta de gasto mensual, Registros |
| Lista | `CheckCircle2` | `brand-success` | Input de búsqueda, Escanear ticket |
| Escáner | `Camera` | `brand-accent` | Tipos de comercio, Fotos múltiples |
| Revisión | `FileText` | `orange-400` | Cómo usar el ReviewModal |
| Ajustes | `Settings` | `brand-muted` | Exportar datos |

Más un bloque especial al final para el botón `+`:
- Icono: `Plus` (cuadrado violeta)
- Clave `help.tip_nav_plus_title` + `help.tip_nav_plus`

---

## Layout de la UI

### Overlay
- `modal-overlay !p-0 z-[3000]`
- `items-end` (mobile) / `items-center` (sm+)

### Sheet / card
- `rounded-t-[2.5rem]` en mobile, `rounded-[2.5rem]` en sm+
- `max-h-[88vh]` con scroll interno
- Animación: `slide-in-from-bottom duration-400`
- Estructura `flex flex-col`:
  1. Handle + header (`flex-shrink-0`)
  2. Contenido scrollable (`flex-1 overflow-y-auto`)
  3. Footer (`flex-shrink-0`)

### Handle + Header (`flex-shrink-0`)
- Barra decorativa (`w-10 h-1 bg-white/10`)
- Icono `BookOpen` (turquesa) + título `help.onboarding_title`
- Contador de secciones: `N secciones / N sections` (detectado por idioma: `txt('help.next') === 'Siguiente'`)
- Botón `X` → `onClose()`

### Contenido (`space-y-3`)
Por cada `section` en `sections[]`:

- **Card** (`card-glass`, borde `border-white/[0.04]`)
  - Header de sección: fondo `section.color`, icono coloreado + título
  - Lista de tips:
    - Punto decorativo (color del accent de la sección, usando replace `text-` → `bg-`)
    - Título del tip (negrita, blanco)
    - Texto del tip (muted, `leading-relaxed`)

Bloque especial del botón `+`:
- `card-glass` con borde `border-brand-primary/15`, fondo `brand-primary/5`
- Icono `Plus` en cuadrado violeta
- Texto `help.tip_nav_plus_title` + `help.tip_nav_plus`

### Footer (`flex-shrink-0`)
- Botón `btn-primary` con `Star` + `help.finish` → `onClose()`

---

## Z-Index

| Elemento | Z-Index |
|---|---|
| `HelpModal` (overlay) | `z-[3000]` |

---

## Iconos (lucide-react)

| Icono | Sección |
|---|---|
| `X` | Botón cerrar (header) |
| `BarChart3` | Sección Dashboard |
| `Camera` | Sección Escáner |
| `CheckCircle2` | Sección Lista |
| `Settings` | Sección Ajustes |
| `Plus` | Bloque especial botón + |
| `Star` | Botón finalizar (footer) |
| `FileText` | Sección Revisión |
| `BookOpen` | Icono del header del modal |

---

## Claves i18n usadas

| Clave | Descripción |
|---|---|
| `help.onboarding_title` | Título del modal |
| `help.home_title` | Título sección Dashboard |
| `help.list_title` | Título sección Lista |
| `help.scanner_title` | Título sección Escáner |
| `review.title` | Título sección Revisión (reutilizada) |
| `help.settings_title` | Título sección Ajustes |
| `help.tip_spend_card_title` | Título tip tarjeta de gasto |
| `help.tip_spend_card` | Descripción tip tarjeta de gasto |
| `help.tip_records_title` | Título tip registros |
| `help.tip_records` | Descripción tip registros |
| `help.tip_list_input_title` | Título tip input lista |
| `help.tip_list_input` | Descripción tip input lista |
| `help.tip_list_scan_title` | Título tip escanear lista |
| `help.tip_list_scan` | Descripción tip escanear lista |
| `help.tip_scan_type_title` | Título tip tipo de comercio |
| `help.tip_scan_type` | Descripción |
| `help.tip_scan_photos_title` | Título tip fotos múltiples |
| `help.tip_scan_photos` | Descripción |
| `help.tip_review_title` | Título tip revisión |
| `help.tip_review` | Descripción |
| `help.tip_settings_export_title` | Título tip exportar |
| `help.tip_settings_export` | Descripción |
| `help.tip_nav_plus_title` | Título bloque especial botón + |
| `help.tip_nav_plus` | Descripción botón + |
| `help.next` | Texto "Siguiente" (también se usa para detectar idioma) |
| `help.skip` | Texto "Omitir" |
| `help.finish` | Texto del botón finalizar |
| `help.close` | Texto "Cerrar" |

---

## Notas importantes

- La detección del idioma en el contador de secciones (`'secciones' vs 'sections'`) se hace comparando `txt('help.next') === 'Siguiente'` — workaround simple para un texto fijo
- El color del punto decorativo se genera dinámicamente reemplazando `text-` por `bg-` en `section.accent.split(' ')[0]`
- No tiene estado de "paso actual" — es una vista lineal de scroll, no un stepper
