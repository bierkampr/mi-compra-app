# ShoppingListView.tsx — Diccionario del Componente

> Archivo: `app/components/ShoppingListView.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Lista de compras interactiva. Permite añadir productos (con autocompletado fuzzy desde Supabase), tacharlos como comprados, eliminarlos individualmente, limpiar la lista, y lanzar el escáner de ticket.

---

## Props

```typescript
interface ShoppingListViewProps {
  db: { lista: any[] };                        // Slice del AppDB con la lista actual
  updateAndSync: (newDb: any) => Promise<void>; // Mutación + sincronización de AppDB
  setPurchaseMode: (mode: string | null) => void; // Activa modo escáner ('super', etc.)
  priceCache?: PriceCache;                     // Cache de precios históricos de Google Drive (opcional)
  txt: (key: string) => string;                // Función i18n
}
```

---

## Estado interno

| Variable | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `newItemName` | `string` | `""` | Texto del input de búsqueda/nuevo ítem |
| `suggestions` | `any[]` | `[]` | Resultados de Supabase para el autocompletado |
| `isSearching` | `boolean` | `false` | Spinner mientras se consulta Supabase |
| `confirmConfig` | `object` | `{isOpen: false, ...}` | Configuración del `ConfirmModal` (título, mensaje, callback) |

---

## Refs

| Ref | Tipo | Uso |
|---|---|---|
| `searchRef` | `HTMLDivElement` | Detecta clicks fuera del dropdown para cerrarlo |

---

## Efectos (useEffect)

- **Click fuera del dropdown**: `mousedown` global → si el click no es dentro de `searchRef`, cierra sugerencias (`setSuggestions([])`)

---

## Funciones

### `handleSearch(val: string)`
1. Normaliza `val` con `cleanString()` (mayúsculas, sin acentos excepto Ñ) → guarda en `newItemName`
2. Si `val.length > 1`: llama `searchLocalProducts(upperVal)` (Supabase)
   - Ordena resultados por longitud de nombre (más cortos primero)
   - Deduplica por clave fuzzy (`cleanString(nombre_base)`)
   - Guarda en `suggestions`
3. Si `val.length ≤ 1`: limpia `suggestions`

### `addToList(name?, precio?, comercio?)`
1. Normaliza el nombre con `cleanString()` (usa `name` si se pasa, sino `newItemName`)
2. Crea nuevo ítem: `{ name, checked: false, confirmed: false, ultimo_precio, ultimo_comercio }`
3. Llama `updateAndSync({ ...db, lista: [...db.lista, newItem] })`
4. Limpia `newItemName` y `suggestions`
5. **Sincronización silenciosa con Supabase**: si el nombre tiene < 30 chars y no contiene 3+ dígitos consecutivos, verifica si ya existe en `productos` (por fuzzy match con `cleanString`). Si no existe, lo inserta con `categoria: 'OTROS'`
6. Los errores de Supabase son silenciosos (`console.warn`)

### `toggleCheck(item)`
Invierte `item.checked` y llama `updateAndSync`. Los ítems `checked` se muestran al fondo del pendientes (por el `sort` en `pendingItems`).

### `removeItem(item)`
Filtra el ítem de `db.lista` y llama `updateAndSync`.

### `clearAll()`
Abre `ConfirmModal` (tipo `danger`). Al confirmar: `lista: []`.

### `clearPending()`
Abre `ConfirmModal` (tipo `info`). Al confirmar: elimina todos los ítems con `confirmed: false`, conserva solo los `confirmed: true` (comprados confirmados por ticket).

---

## Datos derivados

| Variable | Cálculo | Descripción |
|---|---|---|
| `pendingItems` | `lista.filter(!confirmed).sort(checked al final)` | Ítems aún no comprados/confirmados. Los tachados van al fondo |
| `boughtItems` | `lista.filter(confirmed)` | Ítems ya confirmados como comprados (vienen de `ReviewModal`) |

---

## Lógica de precios en los ítems

Para cada ítem en `pendingItems`, el precio se resuelve en este orden:
1. `item.ultimo_precio` — guardado directamente en el ítem al añadirlo desde sugerencias
2. `priceCache[item.name]` — cache de precios históricos de Google Drive
3. Si ninguno: no muestra precio

El precio solo se muestra si el ítem **no está tachado** (`!item.checked`).

---

## Secciones de la UI

### Barra de búsqueda unificada
- Input con `cleanString` automático al escribir (todo mayúsculas, sin acentos)
- Icono: `Loader2` animado mientras busca, `Search` en reposo
- Botón `+` (`Plus`) a la derecha del input → llama `addToList()`
- `Enter` también añade el ítem

### Dropdown de sugerencias (`z-[200]`)
- Aparece cuando `suggestions.length > 0`
- Cada sugerencia muestra: nombre base + precio + comercio (si disponibles)
- Click en sugerencia → `addToList(nombre, precio, comercio)`
- Botón de cierre (chevron abajo) al final del dropdown

### Acciones rápidas (visible si `db.lista.length > 0`)
- **Botón Escáner** (`Camera`): `setPurchaseMode('super')` — activa modo compra
- **Botón Limpiar pendientes** (`Eraser`): solo visible si hay `pendingItems`. Abre `ConfirmModal`
- **`HelpTooltip`** + **Botón Eliminar todo** (`Trash2`, color `brand-danger`): `clearAll()`

### Sección "Pendientes"
- Muestra conteo `[N]` en el título
- Cada ítem: checkbox visual (cuadrado redondeado), nombre, precio/comercio opcional, botón `X` para eliminar
- Ítems tachados: `opacity-50`, tachado CSS, fondo violeta suave
- Estado vacío: mensaje `home.no_records`

### Sección "Comprados"
- Solo visible si `boughtItems.length > 0`
- Grid de 2 columnas, fondo verde muy tenue
- Ítems en estado de solo lectura (no interactivos)

---

## Dependencias de componentes

| Componente | Uso |
|---|---|
| `ConfirmModal` | Confirmación de limpiar lista / limpiar pendientes |
| `HelpTooltip` | Tooltip de ayuda en acciones rápidas |

---

## Dependencias de librerías

| Import | Origen | Uso |
|---|---|---|
| `searchLocalProducts` | `lib/products` | Búsqueda fuzzy en Supabase |
| `supabase` | `lib/supabase` | Insertar nuevo producto al catálogo |
| `PriceCache` | `lib/gdrive` | Tipo para el cache de precios |
| `cleanString` | `lib/utils` | Normalizar texto: MAYÚSCULAS + sin acentos (excepto Ñ) |

---

## Iconos (lucide-react)

| Icono | Uso |
|---|---|
| `Plus` | Botón añadir + icono en sugerencias |
| `Camera` | Botón escáner |
| `Trash2` | Botón eliminar todo |
| `CheckCircle2` | Icono sección "Comprados" |
| `X` | Eliminar ítem individual |
| `Check` | Checkmark dentro del checkbox tachado |
| `Search` | Icono buscador |
| `Loader2` | Spinner durante búsqueda |
| `Eraser` | Limpiar pendientes |
| `ChevronDown` | Cerrar dropdown de sugerencias |

---

## Claves i18n usadas

| Clave | Texto en español |
|---|---|
| `list.placeholder` | `BUSCAR O AÑADIR PRODUCTO...` |
| `list.scan_btn` | `ESCANEAR TICKET` |
| `list.pending` | `PENDIENTES` |
| `list.bought` | `COMPRADOS` |
| `home.no_records` | `Sin registros este mes` (reutilizada para lista vacía) |
| `modals.clear_list_title` | `¿LIMPIAR LISTA?` |
| `modals.clear_list_msg` | Mensaje de confirmación |
| `modals.clear_pending_title` | `¿LIMPIAR PENDIENTES?` |
| `modals.clear_pending_msg` | Mensaje de confirmación |
| `modals.accept` | `ACEPTAR` |
| `modals.cancel` | `CANCELAR` |
| `help.tip_list_actions_title` | Título tooltip acciones |
| `help.tip_list_actions` | Contenido tooltip acciones |

---

## Notas importantes

- `cleanString` se aplica tanto al escribir como al añadir, garantizando IDs únicos sin duplicados por acentos
- La sincronización con Supabase al añadir un ítem es **fire-and-forget** (no bloquea UI, errores silenciosos)
- `confirmed: true` lo establece `ReviewModal` cuando el ítem del ticket coincide con uno de la lista — no se puede marcar manualmente
- El sort de `pendingItems` empuja los `checked` al fondo sin reordenar los no-checked entre sí
