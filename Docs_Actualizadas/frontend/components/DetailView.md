# DetailView.tsx — Diccionario del Componente

> Archivo: `app/components/DetailView.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Vista de detalle de un gasto guardado. Muestra la lista de productos, el total y permite ver las fotos del ticket almacenadas en Google Drive. Incluye lightbox para visualizar las imágenes y botón de eliminación.

---

## Props

```typescript
interface DetailViewProps {
  gasto: any;                       // El objeto Gasto completo a mostrar
  onClose: () => void;              // Vuelve al Dashboard (setSelectedGasto(null))
  onDelete: (g: any) => void;       // Elimina el gasto (abre ConfirmModal en page.tsx)
  token: string;                    // access_token de Google Drive (para descargar fotos)
  txt: (key: string) => string;     // Función i18n
}
```

---

## Estado interno

| Variable | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `loadingImg` | `boolean` | `false` | Muestra spinner de carga mientras se descarga la imagen de Drive |
| `viewerUrl` | `string \| null` | `null` | URL blob de la imagen a mostrar en el lightbox |

---

## Funciones

### `openTicket(id: string)`
1. `setLoadingImg(true)`
2. Llama `getDriveFileBlob(token, id)` — descarga la imagen de Drive como URL blob
3. Si tiene URL: `setViewerUrl(url)` → abre el lightbox
4. En error: `console.error`
5. `finally`: `setLoadingImg(false)`

---

## Layout de la UI

### Header
- Botón `ChevronLeft` → `onClose()`
- Título centrado: nombre del comercio (`gasto.comercio`) en violeta + fecha debajo
- Botón `Trash2` (color `brand-danger`) → `onDelete(gasto)`

### Lista de productos (`flex-1 overflow-y-auto`)
Cada fila muestra:
- `nombre_base` (texto principal, blanco, mayúsculas)
- `nombre_ticket` (texto secundario, muted, opacidad 20% — el original del ticket)
- Subtotal en verde (`brand-success`) alineado a la derecha
- Cantidad `xN` debajo del precio (muted, opacidad 40%)
- Separador `border-b` entre filas, excepto la última (`last:border-none`)

### Footer (altura fija h-20)
Dos secciones en fila (`flex items-stretch gap-2`):

**Total** (`flex-[1.2]`):
- Label `detail.investment` (muted)
- Total numérico grande + símbolo `€` en verde

**Fotos del ticket** (`flex-[2] overflow-x-auto`):
- Si `gasto.photoIds.length > 0`: un botón por cada `fileId`:
  - `ImageIcon` + texto `detail.ticket_label N`
  - Click → `openTicket(id)` → descarga de Drive
- Si no hay fotos: placeholder con `detail.no_photos`

### Lightbox (`viewerUrl`)
- Overlay `modal-overlay` con `z-[2000]` y `backdrop-blur-xl`
- Click en el overlay → cierra (`setViewerUrl(null)`)
- Botón `X` en esquina superior derecha (`z-[600]`)
- Imagen con `max-h-[90vh]`, `object-contain`, bordes redondeados y animación `zoom-in-95`

### Spinner de carga (`loadingImg`)
- `fixed inset-0 z-[2100]` — sobre el lightbox
- `bg-brand-bg/80 backdrop-blur-md`
- `Loader2` animado en el centro

---

## Z-Index

| Elemento | Z-Index | Contexto |
|---|---|---|
| `DetailView` (contenedor `modal-content-full`) | Heredado de `z-[1200]` gestionado en `page.tsx` | Vista completa |
| Lightbox | `z-[2000]` | Sobre la vista de detalle |
| Botón X del lightbox | `z-[600]` | Dentro del lightbox |
| Spinner de carga | `z-[2100]` | Sobre el lightbox |

---

## Dependencias de librerías

| Import | Origen | Uso |
|---|---|---|
| `getDriveFileBlob` | `lib/gdrive` | Descarga una imagen de Drive como URL blob usando el `token` |

---

## Iconos (lucide-react)

| Icono | Uso |
|---|---|
| `ChevronLeft` | Botón volver |
| `Trash2` | Botón eliminar gasto |
| `Store` | (importado pero no usado en render actual) |
| `ImageIcon` | Icono en los botones de foto del ticket |
| `X` | Botón cerrar lightbox |
| `Loader2` | Spinner de carga de imagen |

---

## Claves i18n usadas

| Clave | Texto en español |
|---|---|
| `detail.investment` | `INVERSIÓN` |
| `detail.ticket_label` | `TICKET` |
| `detail.no_photos` | `SIN FOTOS` |

---

## Estructura del `gasto` recibido

```typescript
{
  comercio: string;
  fecha: string;       // "DD/MM/AAAA"
  total: number;
  photoIds?: string[]; // fileIds de Google Drive (pueden ser múltiples)
  productos?: Array<{
    nombre_base: string;
    nombre_ticket: string;
    cantidad: number;
    subtotal: number;
  }>;
  hasWarranty?: boolean; // No mostrado, pero presente en el objeto
  category?: string;     // No mostrado directamente
}
```

---

## Notas importantes

- `Store` está importado pero no se usa en el render — candidato a limpieza
- El lightbox usa URL blob (no base64) para mejor rendimiento al mostrar imágenes grandes
- La descarga de Drive requiere el `token` válido; si expira, la imagen no carga (solo `console.error`)
- El overlay del lightbox cierra al hacer click en cualquier punto del fondo (sin botón explícito de cierre adicional)
- `onDelete` no elimina directamente — delega en `page.tsx` que abre un `ConfirmModal` propio
