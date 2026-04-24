# ScannerView.tsx — Diccionario del Componente

> Archivo: `app/components/ScannerView.tsx`
> Tipo: `"use client"` — React Client Component
> Estructura: Componente principal `ScannerView` + sub-componente estático `ScannerView.Capture`

---

## Propósito

Punto de entrada para el escaneo de tickets. Tiene dos partes bien diferenciadas:

1. **`ScannerView`** — Selección de categoría del comercio (menú de opciones)
2. **`ScannerView.Capture`** — Captura de fotos (cámara WebRTC + galería) y disparo del análisis IA

---

## ScannerView (menú de categorías)

### Props

```typescript
interface ScannerViewProps {
  db: { lista: any[], gastos: any[], customCategories?: string[] };
  updateAndSync: (newDb: any) => Promise<void>;
  setPurchaseMode: (mode: string | null) => void; // Activa modo compra con la categoría elegida
  startAnalysis: (useList: boolean, forceManual?: boolean, images?: string[]) => void;
  txt: (key: string) => string;
}
```

### Estado interno

| Variable | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `showOthers` | `boolean` | `false` | Muestra panel de categorías personalizadas en lugar del menú principal |
| `newCatName` | `string` | `""` | Input para crear una categoría custom |

### Funciones

#### `handleAddCustomCategory()`
1. Normaliza `newCatName` (`.trim().toUpperCase()`)
2. Si la categoría no existe en `customCategories`, la añade vía `updateAndSync`
3. Llama `setPurchaseMode(val)` para activar el modo escáner con esa categoría
4. Limpia `newCatName`

### Layout — Vista principal (`!showOthers`)

- **Botón Super** (full-width): `setPurchaseMode("super")` — grandes superficies
- **Grid 2×2**: Mini, Dining, Health, Otros
  - Mini → `setPurchaseMode("mini")`
  - Dining → `setPurchaseMode("dining")`
  - Health → `setPurchaseMode("health")`
  - Otros → `setShowOthers(true)`
- **Botón Manual** (línea punteada al fondo): `setPurchaseMode("manual")` + `startAnalysis(false, true)` — abre ReviewModal vacío

### Layout — Vista de categorías personalizadas (`showOthers`)

- Botón volver (`ChevronLeft`) → `setShowOthers(false)`
- Input + botón `+` para añadir nueva categoría
- Grid de categorías custom del usuario → click → `setPurchaseMode(cat)`

---

## ScannerView.Capture (sub-componente)

Declarado como `ScannerView.Capture = ({ ... }) => { ... }` — componente de función asignado como propiedad estática del componente principal.

### Props

```typescript
{
  tempPhotos: string[];                                    // Fotos capturadas (base64)
  setTempPhotos: React.Dispatch<React.SetStateAction<any[]>>; // Setter de fotos
  loading: boolean;                                        // True mientras la IA procesa
  startAnalysis: (useList: boolean, forceManual?: boolean, images?: string[]) => void;
  db: { lista: any[] };
  setShowListDialog: (show: boolean) => void;
  showListDialog: boolean;                                 // Controla ConfirmModal de vinculación
  onCancel: () => void;                                    // Cierra el modo captura
  txt: (key: string) => string;
  activeTab: string;                                       // Pestaña activa ('list' | 'scanner')
}
```

### Estado interno

| Variable | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `showCamera` | `boolean` | `false` | Activa/desactiva el viewfinder WebRTC |
| `capturedStream` | `MediaStream \| null` | `null` | Stream activo de la cámara (para detenerlo al cerrar) |
| `previewPhoto` | `string \| null` | `null` | Foto capturada en revisión (antes de confirmar) |
| `showConfirmCancel` | `boolean` | `false` | ConfirmModal al intentar cancelar con fotos tomadas |
| `ocrProgress` | `number` | `0` | Porcentaje de la barra de progreso (0-100) |
| `isOcrRunning` | `boolean` | `false` | Activa estado de procesamiento en el botón |
| `lastImageSent` | `string \| undefined` | `undefined` | Última imagen comprimida (para el diálogo de vinculación) |

### Refs

| Ref | Tipo | Uso |
|---|---|---|
| `videoRef` | `HTMLVideoElement` | Elemento video del viewfinder WebRTC |
| `canvasRef` | `HTMLCanvasElement` | Canvas oculto para capturar fotograma |
| `fileInputRef` | `HTMLInputElement` | Input file oculto para galería |

### Efectos (useEffect)

**Gestión de la cámara** (`[showCamera]`):
- `showCamera = true`: llama `getUserMedia({ facingMode: "environment", 1920×1080 })` → asigna stream al `videoRef`; si falla, muestra alert y `setShowCamera(false)`
- `showCamera = false`: detiene todos los tracks del stream, libera `capturedStream`
- Cleanup al desmontar: también detiene tracks si estaban activos

### Funciones

#### `takePhoto()`
Cálculo de crop preciso basado en el tamaño real del video vs. tamaño CSS visible:
1. Calcula `scale` = `max(cssW/vW, cssH/vH)` (object-cover behavior)
2. Calcula offsets de centrado del video en el contenedor CSS
3. Aplica márgenes de crop: H=40px, V=20px sobre coordenadas CSS
4. Convierte coordenadas CSS → coordenadas nativas del video
5. `ctx.drawImage()` → `canvas.toDataURL("image/jpeg", 0.95)`
6. Guarda en `previewPhoto` para revisión

#### `confirmPhoto(photo: string)`
1. Llama `compressImage(photo, tempPhotos.length + 1)` — el índice `+1` hace la compresión más agresiva en fotos 2 y 3 para evitar rate limits
2. Añade al array `tempPhotos`
3. Limpia `previewPhoto`, cierra cámara, guarda en `lastImageSent`

#### `handleFileUpload(e)`
Lee el archivo seleccionado con `FileReader.readAsDataURL()` → llama `confirmPhoto(result)`.

#### `handleProcessClick()`
1. `setIsOcrRunning(true)`, `setOcrProgress(0)`
2. Salta `ocrProgress` directo a 100 (la barra es visual, no refleja progreso real de la IA)
3. Si `activeTab === "list"` → `startAnalysis(true, false, photos)` (vincula con lista)
4. Si no → `startAnalysis(false, false, photos)` (solo escanea)
5. `finally`: `setIsOcrRunning(false)`

### Layout del Capture

#### Vista de preparación (`!showCamera`)

**Header**: botón X (cierra o muestra ConfirmModal si hay fotos) + título

**Instrucciones**: card informativa con 2 pasos:
1. Ticket pequeño → 1 foto
2. Ticket largo → hasta 3 fotos

**Grid de fotos tomadas**:
- Thumbnail 3:4 con botón eliminar (`Trash2`)
- Máximo 3 fotos. Si `tempPhotos.length < 3`: botón de cámara + botón de galería + `<input type="file" hidden>`

**Botón PROCESAR IA**:
- Deshabilitado si no hay fotos o está procesando
- Estado normal: icono `Zap` + texto `scan.process`
- Estado procesando: fondo `animate-pulse` + barra de progreso + icono `Brain` + texto `"PROCESANDO IA (N%)"`

#### Vista de cámara (`showCamera`)

**Viewfinder** (`<video autoPlay playsInline muted />`):
- Overlay de marco de recorte (`border-x-[40px] border-y-[20px]`)
- Borde punteado con línea horizontal animada
- Badge bouncing con `txt("scan.inst_frame_title")`
- Texto de instrucción `txt("scan.inst_frame_desc")`

**Panel inferior**:
- Botón `ChevronLeft` → `setShowCamera(false)`
- Botón disparador (círculo blanco grande) → `takePhoto()`

**Vista de revisión de foto** (`previewPhoto`):
- Muestra la imagen capturada
- Botón "Reintentar" → `setPreviewPhoto(null)` (vuelve al viewfinder)
- Botón "Confirmar" (verde) → `confirmPhoto(previewPhoto)`

**Canvas oculto**: siempre presente, usado internamente en `takePhoto()`

#### Modales

| Modal | Condición | Propósito |
|---|---|---|
| `ConfirmModal` (vinculación) | `showListDialog` | Pregunta si vincular el análisis con la lista de compra |
| `ConfirmModal` (cancelar) | `showConfirmCancel` | Confirma cancelar si hay fotos capturadas |

---

## Z-Index

| Elemento | Z-Index |
|---|---|
| `ScannerView.Capture` (contenedor) | `z-[2000]` |

---

## Dependencias de componentes

| Componente | Uso |
|---|---|
| `ConfirmModal` | Diálogo de vinculación con lista + diálogo de confirmación de cancelar |

---

## Dependencias de librerías

| Import | Origen | Uso |
|---|---|---|
| `compressImage` | `lib/utils` | Comprime cada foto antes de enviarla a la IA |

---

## Iconos (lucide-react)

| Icono | Uso |
|---|---|
| `Camera` | Botón tomar foto |
| `ShoppingCart` | Categoría super |
| `Store` | Categoría mini |
| `Utensils` | Categoría dining |
| `Pill` | Categoría health |
| `LayoutGrid` | Categoría others |
| `Edit3` | Botón modo manual |
| `X` | Cerrar Capture |
| `Loader2` | (importado, no usado en render actual) |
| `AlertTriangle` | (importado, no usado en render actual) |
| `Image (ImageIcon)` | Botón galería |
| `Sparkles` | Badge del viewfinder |
| `CheckCircle2` | (importado, no usado en render actual) |
| `Plus` | Botón añadir categoría custom |
| `Tag` | Icono de categoría custom |
| `ChevronRight` | Flecha en lista de categorías custom |
| `ChevronLeft` | Volver en panel custom + volver desde cámara |
| `Info` | Card de instrucciones |
| `Trash2` | Eliminar foto capturada |
| `Zap` | Botón procesar IA (estado normal) |
| `Brain` | Botón procesar IA (estado procesando) |

---

## Claves i18n usadas

| Clave | Texto en español |
|---|---|
| `scan.title` | `ESCANEAR TICKET` |
| `scan.subtitle` | Subtítulo de la vista |
| `scan.super` | `SUPERMERCADO` |
| `scan.mini` | `TIENDA` |
| `scan.dining` | `RESTAURANTE` |
| `scan.health` | `SALUD` |
| `scan.others` | `OTROS` |
| `scan.manual` | `INTRODUCCIÓN MANUAL` |
| `scan.preparation_title` | `PREPARAR TICKET` |
| `scan.preparation_subtitle` | Subtítulo |
| `scan.instructions_title` | `CONSEJOS PARA MEJOR RESULTADO` |
| `scan.inst_small_title` | `TICKET PEQUEÑO` |
| `scan.inst_small_desc` | Descripción |
| `scan.inst_large_title` | `TICKET LARGO` |
| `scan.inst_large_desc` | Descripción |
| `scan.take_photo` | `FOTO` |
| `scan.gallery` | `GALERÍA` |
| `scan.process` | `ANALIZAR CON IA` |
| `scan.inst_frame_title` | `ENCUADRA EL TICKET` |
| `scan.inst_frame_desc` | Instrucción del viewfinder |
| `scan.quality_check` | `¿SE LEE BIEN?` |
| `scan.retry_photo` | `REINTENTAR` |
| `scan.confirm_photo` | `USAR FOTO` |
| `scan.camera_error` | Mensaje de error de cámara |
| `modals.link_list_title` | `¿VINCULAR CON LISTA?` |
| `modals.link_list_desc` | Descripción |
| `modals.yes_link` | `SÍ, VINCULAR` |
| `modals.no_link` | `NO, SOLO SCAN` |

---

## Notas importantes

- `compressImage` recibe el índice de la foto para aplicar compresión más agresiva en fotos 2 y 3, evitando rate limits en Mistral al enviar imágenes grandes
- La barra de progreso es puramente visual (salta de 0 a 100% al instante) — el progreso real de la IA no es reportado
- El `canvas` de captura es siempre `hidden` en el DOM
- El stream de la cámara se detiene tanto en `useEffect` cleanup como al cambiar `showCamera` a `false` (doble seguridad para evitar fuga de recursos)
- Los íconos `Loader2`, `AlertTriangle`, `CheckCircle2` están importados pero no se usan en el render actual — son candidatos a limpieza
