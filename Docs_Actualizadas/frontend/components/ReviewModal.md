# ReviewModal.tsx — Diccionario del Componente

> Archivo: `app/components/ReviewModal.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Pantalla de revisión crítica donde el usuario verifica, corrige y confirma los datos extraídos por la IA antes de guardarlos. Permite editar comercio, fecha, total, marcar garantía, añadir productos manualmente, normalizar nombres de productos contra el catálogo Supabase y ver comparativa de precios históricos.

---

## Props

```typescript
interface ReviewModalProps {
  pendingGasto: any;                          // Objeto gasto temporal con datos de la IA
  setPendingGasto: (g: any) => void;          // Actualiza el gasto en revisión (controlado por page.tsx)
  onSave: (g: any) => void;                   // Confirma y guarda el gasto
  onCancel: () => void;                       // Descarta y cierra el modal
  loading: boolean;                           // True mientras se guarda (muestra spinner en botón)
  db: { lista: any[], gastos: any[] };        // AppDB para acceder a la lista de compra
  txt: (key: string) => string;               // Función i18n
}
```

---

## Estado interno

| Variable | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `isManualExpanded` | `boolean` | `false` | Muestra/oculta el formulario de añadir producto manual |
| `manualProd` | `object` | `{name:'', qty:1, price:""}` | Datos del formulario de producto manual |
| `expandedIndices` | `number[]` | `[]` | Índices de los productos con panel de normalización abierto |
| `extraSearchTerm` | `string` | `""` | Texto del buscador de alias en Supabase |
| `extraSuggestions` | `any[]` | `[]` | Resultados de la búsqueda de alias |
| `isSearchingExtra` | `boolean` | `false` | Spinner durante búsqueda de alias |
| `showExtraSearchIdx` | `number \| null` | `null` | Índice del producto con el buscador de alias activo |
| `historyPrices` | `Record<string, number \| null>` | `{}` | Cache de precios históricos por `nombre_base` |

---

## Efectos (useEffect)

**`[pendingGasto, setPendingGasto]`**:
Al recibir un nuevo `pendingGasto` con productos no agrupados (`!pendingGasto._isGrouped`):
1. Agrupa productos repetidos con `groupRepeatedProducts()` → actualiza `pendingGasto` (añade flag `_isGrouped: true`)
2. Auto-expande los productos donde `nombre_base === nombre_ticket` (la IA no normalizó el nombre) → el usuario debe revisarlos
3. Llama `loadAllHistory(grouped)` para cargar precios históricos de todos los productos

---

## Funciones

### `loadAllHistory(products)`
Llama `getBatchPriceHistory(names)` con todos los `nombre_base`. Guarda el mapa en `historyPrices`. Silencioso en caso de error.

### `limpiarBusqueda()`
Resetea todos los estados del buscador extra: `showExtraSearchIdx`, `extraSearchTerm`, `extraSuggestions`, `isSearchingExtra`.

### `toggleExpand(idx)`
Abre/cierra el panel de normalización del producto en posición `idx`. Al abrir cualquier panel, limpia la búsqueda extra del panel anterior.

### `handleExtraSearch(val)`
Busca en Supabase con `searchLocalProducts(val.toUpperCase())`. Muestra resultados en `extraSuggestions`. Requiere `val.length > 1`.

### `setAlias(productIndex, cleanName)`
1. Normaliza `cleanName` con `cleanString()`
2. Actualiza `nombre_base` del producto en posición `productIndex`
3. Llama `getLastPrice(upperClean)` → actualiza `historyPrices` para ese nombre
4. Colapsa el panel del producto y limpia la búsqueda

### `addManualItem()`
1. Valida que `manualProd.name` no esté vacío
2. Normaliza el nombre con `cleanString()`
3. Crea `{ nombre_ticket, nombre_base, cantidad, subtotal }`
4. Reagrupa todos los productos con `groupRepeatedProducts()` (incluye el nuevo)
5. Actualiza `pendingGasto` y recarga historial de precios
6. Resetea el formulario y cierra `isManualExpanded`

### `renderPriceComparison(nombreBase, subtotal, cantidad)`
Calcula precio unitario actual (`subtotal / cantidad`) y lo compara con `historyPrices[nombreBase]`:

| Condición | Output |
|---|---|
| Sin historial (`undefined \| null`) | Icono `History` + texto `review.no_history` (opacidad 20%) |
| diff > 0.01 | `TrendingUp` + texto `review.price_up` (color `brand-danger`) |
| diff < -0.01 | `TrendingDown` + texto `review.price_down` (color `brand-success`) |
| diff dentro de ±0.01 | `Minus` + texto `review.price_same` (muted, opacidad 40%) |

---

## Estructura del `pendingGasto`

```typescript
{
  comercio: string;       // Editable en ReviewModal
  fecha: string;          // Formato "DD/MM/AAAA"
  total: number;          // Editable
  hasWarranty?: boolean;  // Toggle de garantía (nuevo campo)
  productos: Array<{
    nombre_ticket: string;  // Texto literal del ticket (readonly)
    nombre_base: string;    // Nombre normalizado (editable vía setAlias)
    cantidad: number;
    subtotal: number;
  }>;
  _isGrouped?: boolean;   // Flag interno para evitar re-agrupación
}
```

---

## Layout de la UI

### Header (fijo, `shrink-0`)
- Título `review.title` + subtítulo fijo
- Botón `X` → `onCancel()`

### Cuerpo con scroll (`flex-1 overflow-y-auto`)

**Sección de datos del ticket** (`grid-cols-12`):
- Campo Comercio (col-12): input + icono `Store`
- Campo Fecha (col-6): input centrado + icono `Calendar`
- Campo Total (col-6): input tipo number + símbolo `€`
- Toggle Garantía (col-12): botón toggle con `ShieldCheck` — activa/desactiva `pendingGasto.hasWarranty`

**Sección de productos**:
- Contador `[N]` de productos
- Botón `+ Añadir` / `Cerrar` → toggle de `isManualExpanded`

**Formulario manual** (`isManualExpanded`):
- Input nombre (autoFocus, uppercase)
- Input precio (number, alineado derecha)
- Botón `review.manual_ok` → `addManualItem()`

**Lista de productos** (por cada producto `p`):

Fila colapsada:
- Cantidad `Nx` (cuadrado, violeta si expandido)
- `nombre_base` (cyan/accent si tiene alias limpio, blanco si iguala al ticket)
- Icono `Sparkles` animado si tiene alias diferente al ticket
- `nombre_ticket` en pequeño (debajo)
- Comparativa de precio: `renderPriceComparison()`
- Subtotal en verde

Panel expandido (`isExpanded`):
- Icono `ListTodo` + texto `review.link_list`
- **Sugerencias de la lista de compra** (calculadas con `calculateMatchScore`):
  - Ordenadas por score de match descendente
  - Las que tienen score > 0 → botón violeta (mejor match)
  - Las demás → botón gris
  - Click → `setAlias(i, item.name)`
- Botón `Buscar otro` (`Search`) → activa `showExtraSearchIdx = i`
  - Al activarse: input de búsqueda libre + resultados de Supabase
  - Si `extraSearchTerm.length > 2`: botón "Registrar como: [texto]" (turquesa) → `setAlias(i, extraSearchTerm)` (crea nuevo)

### Footer (fijo, `shrink-0`, blur)
- Botón **Descartar** (rojo, secundario) → `onCancel()`
- Botón **Guardar** (verde, primario) → `onSave(pendingGasto)`. Durante `loading`: spinner `Loader2`. En reposo: `CheckCircle2` + texto

---

## Dependencias de librerías

| Import | Origen | Uso |
|---|---|---|
| `calculateMatchScore` | `lib/utils` | Puntúa el match entre nombre de ticket y nombre de lista |
| `groupRepeatedProducts` | `lib/utils` | Fusiona productos duplicados en el array |
| `cleanString` | `lib/utils` | Normaliza nombres: MAYÚSCULAS sin acentos (excepto Ñ) |
| `searchLocalProducts` | `lib/products` | Búsqueda fuzzy de alias en Supabase |
| `getBatchPriceHistory` | `lib/products` | Carga precios históricos para todos los productos de una vez |
| `getLastPrice` | `lib/products` | Obtiene el último precio de un producto específico |

---

## Iconos (lucide-react)

| Icono | Uso |
|---|---|
| `Check` | Checkmark en toggle de garantía |
| `X` | Botón cerrar |
| `Store` | Icono del campo Comercio |
| `Search` | Botón "Buscar otro" en alias |
| `Loader2` | Spinner de búsqueda extra + spinner de guardado |
| `Sparkles` | Indicador de producto con alias normalizado |
| `CheckCircle2` | Icono del botón Guardar |
| `PlusCircle` | Botón "Registrar como nuevo" |
| `TrendingUp` | Indicador precio subió |
| `TrendingDown` | Indicador precio bajó |
| `Minus` | Indicador precio igual |
| `History` | Indicador sin historial de precio |
| `Calendar` | Icono del campo Fecha |
| `ListTodo` | Título del panel de vinculación con lista |
| `ShieldCheck` | Toggle de garantía |

---

## Claves i18n usadas

| Clave | Texto en español |
|---|---|
| `review.title` | `REVISAR TICKET` |
| `review.label_shop` | `COMERCIO` |
| `review.label_date` | `FECHA` |
| `review.label_total` | `TOTAL` |
| `review.warranty_label` | `GUARDAR CON GARANTÍA` |
| `review.products_title` | `PRODUCTOS` |
| `review.add_btn` | `AÑADIR` |
| `review.close_btn` | `CERRAR` |
| `review.placeholder_prod` | `NOMBRE DEL PRODUCTO` |
| `review.placeholder_price` | `PRECIO` |
| `review.manual_ok` | `AÑADIR PRODUCTO` |
| `review.link_list` | `VINCULAR CON LISTA DE COMPRA` |
| `review.other_btn` | `OTRO...` |
| `review.search_placeholder` | `BUSCAR PRODUCTO...` |
| `review.no_history` | `SIN HISTORIAL` |
| `review.price_up` | `SUBIÓ` |
| `review.price_down` | `BAJÓ` |
| `review.price_same` | `IGUAL` |
| `review.discard_btn` | `descartar` |
| `review.save_btn` | `GUARDAR` |

---

## Notas importantes

- El flag `_isGrouped` en `pendingGasto` previene que el `useEffect` reagrupe los productos en cada re-render
- Los productos donde `nombre_base === nombre_ticket` (IA no normalizó) se auto-expanden para que el usuario los corrija
- `setAlias` actualiza tanto el producto como el `historyPrices` de ese producto de forma individual (sin recargar todos)
- La comparativa de precios usa un threshold de `±0.01€` para considerar un precio "igual" (evita falsos positivos por redondeos)
- `cleanString` se aplica tanto al normalizar aliases como al añadir productos manuales, garantizando consistencia
