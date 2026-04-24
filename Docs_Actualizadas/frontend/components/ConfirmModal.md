# ConfirmModal.tsx — Diccionario del Componente

> Archivo: `app/components/ConfirmModal.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Modal de confirmación reutilizable. Se usa en toda la app para cualquier acción que requiera confirmación del usuario. Tiene dos modos visuales: `danger` (rojo, para acciones destructivas) e `info` (violeta, para confirmaciones estándar).

---

## Props

```typescript
interface ConfirmModalProps {
  isOpen: boolean;            // Controla si el modal es visible
  title: string;              // Título del modal (UPPERCASE en el código)
  message: string;            // Mensaje descriptivo de la acción
  onConfirm: () => void;      // Callback al confirmar
  onCancel: () => void;       // Callback al cancelar (y para cerrar)
  confirmText?: string;       // Texto del botón confirmar (default: "ACEPTAR")
  cancelText?: string;        // Texto del botón cancelar (default: "CANCELAR")
  type?: 'danger' | 'info';   // Tipo visual (default: 'info')
}
```

---

## Valores por defecto

| Prop | Default |
|---|---|
| `confirmText` | `"ACEPTAR"` |
| `cancelText` | `"CANCELAR"` |
| `type` | `'info'` |

---

## Estado interno

Ninguno — componente completamente controlado por props.

---

## Comportamiento

- Si `!isOpen` → devuelve `null` (desmontado del DOM)
- No cierra al hacer click en el overlay (sin handler en el fondo)
- Únicamente se cierra mediante los botones `onConfirm` u `onCancel`

---

## Layout de la UI

### Overlay (`modal-overlay`)
- Clase `modal-overlay` de `globals.css` — cubre toda la pantalla con fondo semitransparente
- Z-index heredado de la clase (ver tabla de z-index)

### Card (`card-premium`)
- Ancho: `w-[92%] max-w-md`
- Animación: `animate-in zoom-in-95 duration-200`
- Glow decorativo de fondo: blob difuminado (`blur-[80px]`) en color rojo (danger) o violeta (info)

### Icono + Título
- Contenedor con icono según `type`:
  - `danger` → `AlertCircle` rojo
  - `info` → `CheckCircle2` violeta
- Título en negrita + subtítulo fijo:
  - `danger` → "Acción Crítica"
  - `info` → "Confirmación"

### Mensaje
- Texto `white/70`, `line-clamp-3` (máximo 3 líneas visibles)

### Botones
Dos botones en fila (`flex gap`):

| Botón | Clase | Tamaño relativo |
|---|---|---|
| Cancelar | `btn-secondary` muted | `flex-1` |
| Confirmar | `btn-primary` (rojo si `danger`) | `flex-[1.4]` |

---

## Z-Index

El modal usa la clase `modal-overlay` definida en `globals.css`. Según el contexto de uso:

| Usado en | Z-Index efectivo |
|---|---|
| `ShoppingListView` (limpiar lista) | Hereda de contexto — generalmente `z-[9999]` |
| `SettingsView` (logout) | `z-[9999]` |
| `ScannerView.Capture` (vinculación, cancelar) | Dentro de `z-[2000]` |

---

## Usos en la app

| Componente | Cuándo se abre | Tipo |
|---|---|---|
| `ShoppingListView` | Limpiar toda la lista | `danger` |
| `ShoppingListView` | Limpiar pendientes | `info` |
| `SettingsView` | Cerrar sesión | `danger` |
| `ScannerView.Capture` | Vincular con lista | `info` |
| `ScannerView.Capture` | Cancelar con fotos tomadas | `danger` |
| `page.tsx` | Eliminar un gasto | `danger` |

---

## Iconos (lucide-react)

| Icono | Condición | Uso |
|---|---|---|
| `AlertCircle` | `type === 'danger'` | Icono de acción destructiva |
| `CheckCircle2` | `type === 'info'` | Icono de confirmación |
| `X` | (importado pero no usado en render) | Candidato a limpieza |

---

## Notas importantes

- `X` está importado pero no se usa — el modal no tiene botón de cerrar, solo los dos botones de acción
- Los textos de los botones tienen `truncate` para evitar desbordamiento con textos largos
- El botón confirmar es `flex-[1.4]` (ligeramente más ancho que el cancelar) para dar énfasis visual a la acción principal
