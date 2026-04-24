# HelpTooltip.tsx — Diccionario del Componente

> Archivo: `app/components/HelpTooltip.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Tooltip de ayuda contextual inline. Aparece como un pequeño botón circular `?` que al hacer click muestra un popover flotante con título y descripción. Se cierra al hacer click fuera.

---

## Props

```typescript
interface HelpTooltipProps {
  title: string;                       // Título del tooltip (aparece en color accent)
  content: string;                     // Texto descriptivo del tooltip
  align?: 'left' | 'right' | 'center'; // Alineación horizontal del popover (default: 'left')
  direction?: 'down' | 'up';           // Dirección de apertura del popover (default: 'down')
}
```

---

## Valores por defecto

| Prop | Default |
|---|---|
| `align` | `'left'` |
| `direction` | `'down'` |

---

## Estado interno

| Variable | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `isOpen` | `boolean` | `false` | Controla la visibilidad del popover |

---

## Refs

| Ref | Tipo | Uso |
|---|---|---|
| `ref` | `HTMLDivElement` | Referencia al contenedor para detectar clicks fuera |

---

## Efectos (useEffect)

**`[isOpen]`**: Solo activo cuando el tooltip está abierto:
- Añade listener `mousedown` global → si el click es fuera de `ref`, cierra (`setIsOpen(false)`)
- Cleanup: elimina el listener al cerrar o desmontar

---

## Clases de posicionamiento calculadas

### `alignClass` (posición horizontal del popover)
| `align` | Clase aplicada |
|---|---|
| `'left'` | `left-0` |
| `'center'` | `left-1/2 -translate-x-1/2` |
| `'right'` | `right-0` |

### `popoverPositionClass` (posición vertical del popover)
| `direction` | Clase aplicada |
|---|---|
| `'down'` | `top-7` (aparece debajo del botón) |
| `'up'` | `bottom-7` (aparece encima del botón) |

### `arrowClass` (flecha decorativa del popover)
La flecha es un cuadrado de 12×12 rotado 45° que conecta visualmente el popover con el botón:

| `direction` | Posición de la flecha |
|---|---|
| `'down'` | `-top-1.5` (punta hacia arriba, flecha encima del popover) |
| `'up'` | `-bottom-1.5` (punta hacia abajo, flecha debajo del popover) |

La posición horizontal de la flecha coincide con `align` (left-2, center o right-2).

---

## Layout de la UI

### Botón disparador
- Círculo de 20×20 (`w-5 h-5`), `rounded-full`
- Icono `HelpCircle` (size 12)
- Estado normal: `bg-white/5`, `text-brand-muted/40`
- Hover: `text-brand-accent`, `bg-brand-accent/10`
- Abierto: `bg-brand-accent/20`, `text-brand-accent`
- `e.stopPropagation()` para no activar eventos del padre

### Popover
- `z-[800]`, ancho fijo `w-64`
- Animación: `animate-in fade-in zoom-in-95 duration-200`
- `onClick={(e) => e.stopPropagation()}` — evita cerrar al interactuar con el popover
- Estructura interna:
  - Flecha decorativa (div rotado)
  - Card con `card-premium`, borde `border-brand-accent/25`
  - Header: título en `text-brand-accent` + botón `X` para cerrar
  - Cuerpo: texto en `white/70`, `leading-relaxed`

---

## Z-Index

| Elemento | Z-Index |
|---|---|
| Popover | `z-[800]` |

---

## Usos en la app

| Componente | Props | Descripción |
|---|---|---|
| `DashboardView` | `align="left"` | Tooltip junto al título "Registros" |
| `ShoppingListView` | `align="right"`, `direction="up"` | Tooltip junto a las acciones rápidas de la lista |

---

## Iconos (lucide-react)

| Icono | Uso |
|---|---|
| `HelpCircle` | Botón disparador del tooltip |
| `X` | Botón cerrar dentro del popover |

---

## Notas importantes

- El listener de click fuera solo se registra cuando `isOpen === true` (no escucha globalmente cuando está cerrado)
- `e.stopPropagation()` tanto en el botón disparador como en el popover evita que los clicks cierren otros modales o activen acciones del contenedor padre
- La flecha es CSS puro (div rotado 45°) — no requiere librerías externas
