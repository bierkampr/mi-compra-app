# DashboardView.tsx — Diccionario del Componente

> Archivo: `app/components/DashboardView.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Vista principal post-login. Muestra el resumen de gastos del mes seleccionado, con donut chart por categorías, comparativa mes anterior, barra de presupuesto, filtro de garantías y lista de registros individuales.

---

## Props

```typescript
interface DashboardViewProps {
  stats: {
    total: number;                         // Suma total de gastos del mes visible
    currentGastos: any[];                  // Array de Gasto[] del mes visible
    porComercio: Record<string, number>;   // Gastos agrupados por nombre de comercio
    prevMonthTotal: number;                // Total del mes anterior (para comparativa)
  };
  currentViewDate: Date;                   // Mes/año actualmente visible
  setCurrentViewDate: (date: Date) => void; // Cambiar mes visible
  setSelectedGasto: (gasto: any) => void;  // Abre DetailView con el gasto seleccionado
  setActiveTab: (tab: string) => void;     // Navega a otra pestaña
  db: any;                                 // AppDB completo (se usa para presupuestoMensual)
  updateAndSync: (newDb: any) => void;     // Guarda cambios en db (presupuesto)
  txt: (key: string) => string;            // Función i18n
  lang: string;                            // Idioma activo ('es' | 'en'), para formateo de fechas
}
```

---

## Estado interno

| Variable | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `showBreakdown` | `boolean` | `false` | Alterna entre lista de gastos y gráfico de categorías (mobile) |
| `showWarrantiesOnly` | `boolean` | `false` | Filtra la lista para mostrar solo gastos con `hasWarranty: true` |
| `isEditingBudget` | `boolean` | `false` | Muestra/oculta el formulario inline de presupuesto |
| `budgetInput` | `string` | `""` | Valor del input de presupuesto (string para el `<input type="number">`) |

---

## Funciones

### `changeMonth(offset: number)`
Mueve `currentViewDate` en `offset` meses (−1 = mes anterior, +1 = mes siguiente). El botón de avanzar está deshabilitado si ya se está viendo el mes actual (`isCurrentMonth`).

### `saveBudget()`
Parsea `budgetInput` como float y llama `updateAndSync({ ...db, presupuestoMensual: val })`. Cierra el formulario aunque el valor sea inválido.

### `getCategoryStyles(category: string)`
Devuelve un objeto `{ icon, color, bg, hex, label }` según la categoría:

| Categoría | Icono | Color | Hex |
|---|---|---|---|
| `dining` | `Utensils` | `text-orange-400` | `#FB923C` |
| `health` | `Pill` | `text-emerald-400` | `#34D399` |
| `mini` | `Store` | `text-brand-accent` | `#00FAD9` |
| `super` | `ShoppingCart` | `text-brand-primary` | `#5D2EEF` |
| `others` | `LayoutGrid` | `text-brand-muted` | `#8E94AF` |
| custom | `Tag` | `text-indigo-400` | `#818CF8` |

### `renderDonutChart(sizeClass?)`
Genera un gráfico donut SVG puro (sin librerías). Calcula `strokeDasharray` y `strokeDashoffset` acumulativos para cada categoría. El centro muestra el número de registros. `sizeClass` controla el tamaño (default: `"w-40 h-40 lg:w-56 lg:h-56"`).

---

## Valores calculados (render)

| Variable | Cálculo | Uso |
|---|---|---|
| `diff` | `stats.total - stats.prevMonthTotal` | Diferencia absoluta vs mes anterior |
| `diffPercent` | `(abs(diff) / prevMonthTotal) * 100` | Porcentaje de cambio |
| `isBetter` | `diff <= 0` | `true` si gastó igual o menos que el mes anterior |
| `budget` | `db.presupuestoMensual || 0` | Presupuesto mensual configurado |
| `budgetPercent` | `min((total / budget) * 100, 100)` | Porcentaje de presupuesto consumido |
| `barColor` | `< 75%` verde, `< 90%` naranja, `≥ 90%` rojo | Color dinámico de la barra de presupuesto |
| `isCurrentMonth` | Compara mes+año con `new Date()` | Deshabilita el botón "mes siguiente" |
| `statsPorCategoria` (memo) | Agrupa `currentGastos` por `category`, ordena desc | Datos del donut y leyenda |

---

## Layout

El componente usa un grid responsive:
- **Mobile**: columna única, `space-y-6`
- **Desktop (lg+)**: `grid-cols-12` con columna izquierda (`col-span-5`) y derecha (`col-span-7`)

**Columna izquierda:**
1. Navegador de mes (ChevronLeft / ChevronRight)
2. Tarjeta principal del total mensual (gradiente violeta) con:
   - Total grande en euros
   - Píldora comparativa vs mes anterior (solo si `prevMonthTotal > 0`)
   - Barra de presupuesto + botón "Editar" / formulario inline
   - Al hacer click, alterna `showBreakdown`
3. Donut chart + leyenda de categorías (solo en desktop `hidden lg:block`)

**Columna derecha:**
1. Header "Registros" + `HelpTooltip` + botón filtro de garantías (`ShieldAlert`)
2. Si `showBreakdown`: donut chart mobile + tabla de categorías
3. Si `!showBreakdown`: lista de `currentGastos` (filtrada si `showWarrantiesOnly`) → cada item es un botón que llama `setSelectedGasto(g)`
4. Si lista vacía: estado vacío con mensaje `home.no_records`

---

## Dependencias de componentes

| Componente | Uso |
|---|---|
| `HelpTooltip` | Tooltip informativo junto al título "Registros" |

---

## Iconos (lucide-react)

| Icono | Uso |
|---|---|
| `ChevronLeft/Right` | Navegación entre meses |
| `TrendingUp` | Icono decorativo en tarjeta + indicador de gasto creciente |
| `TrendingDown` | Indicador de gasto decreciente (ahorro) |
| `Store` | Categoría mini |
| `ShoppingCart` | Categoría super |
| `Utensils` | Categoría dining |
| `Pill` | Categoría health |
| `LayoutGrid` | Categoría others |
| `ArrowUpRight` | Flecha decorativa en cada fila de gasto |
| `Tag` | Categorías custom |
| `PieChart` (PieIcon) | Importado pero no usado directamente en render visible |
| `ShieldAlert` | Botón de filtro de garantías |
| `Plus` | Botón "Establecer presupuesto" cuando no hay presupuesto |

---

## Claves i18n usadas

| Clave | Texto en español |
|---|---|
| `home.monthly_spend` | `GASTO MENSUAL` |
| `home.records` | `REGISTROS` |
| `home.no_records` | `Sin registros este mes` |
| `home.chart_title` | `POR CATEGORÍA` |
| `home.cat_dining` | `RESTAURANTES` |
| `home.cat_health` | `SALUD` |
| `home.cat_mini` | `TIENDA` |
| `home.cat_super` | `SUPERMERCADO` |
| `home.cat_others` | `OTROS` |
| `home.vs_last_month` | `VS MES ANTERIOR` |
| `home.set_budget` | `ESTABLECER PRESUPUESTO` |
| `home.budget_label` | `PRESUPUESTO` |
| `home.warranties` | `GARANTÍAS` |
| `help.tip_records_title` | Título del tooltip de ayuda |
| `help.tip_records` | Contenido del tooltip de ayuda |

---

## Notas importantes

- El `PieIcon` está importado pero no se usa directamente en el render actual
- `setActiveTab` está declarado en props pero no se usa internamente — se pasa por si algún subcomponente futuro necesita navegar
- `e.stopPropagation()` se usa en los botones de presupuesto para evitar que el click en el botón active el toggle de `showBreakdown` (la tarjeta envolvente es el botón)
- El formulario de presupuesto tiene `autoFocus` en el input
- La barra de presupuesto tiene `Math.min(..., 100)` para no desbordarse visualmente aunque el gasto supere el presupuesto
