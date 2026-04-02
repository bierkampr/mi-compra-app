# Base de Datos y Modelos de Datos

> Fuente: `lib/types.ts`, `lib/supabase.ts`, `lib/products.ts`, `lib/config.ts`.

---

## Modelo Local (AppDB) — Google Drive / localStorage

```typescript
interface AppDB {
  gastos: Gasto[];                // Historial de compras realizadas
  lista: ListItem[];              // Lista de la compra actual
  customCategories: string[];     // Categorías creadas por el usuario
}
```

### Gasto (ticket de compra)
```typescript
interface Gasto {
  id: string;
  comercio: string;           // Nombre del comercio (MAYÚSCULAS)
  fecha: string;              // "DD/MM/AAAA"
  total: number;
  category: string;           // 'super' | 'mini' | 'dining' | custom
  photoIds: string[];         // IDs de archivos en Google Drive
  productos: Producto[];
}

interface Producto {
  cantidad: number;
  nombre_ticket: string;      // Texto literal del ticket
  nombre_base: string;        // Nombre normalizado
  subtotal: number;
}
```

### ListItem (lista de compra)
```typescript
interface ListItem {
  id: string;
  nombre: string;
  cantidad: number;
  checked: boolean;
  categoria?: string;
}
```

### Persistencia Dual
- **localStorage:** clave `mi_compra_cache_db` — acceso instantáneo.
- **Google Drive:** archivo `mi_compra_data.json` en AppDataFolder — respaldo privado.

---

## Supabase — Catalogo Maestro Global

El cliente Supabase se inicializa en `lib/supabase.ts` con `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
Las operaciones de catálogo están en `lib/products.ts`.

### Tabla: productos
```sql
productos (
  id          UUID PRIMARY KEY,
  nombre_base VARCHAR   -- Nombre normalizado, ej: "TOMATE FRITO"
  categoria   VARCHAR   -- Categoría por defecto
)
```

### Tabla: producto_alias
```sql
producto_alias (
  id          UUID PRIMARY KEY,
  producto_id UUID FK → productos.id,
  nombre_ticket VARCHAR  -- Nombre literal del ticket, ej: "TOMATE FRITO HDA"
)
```

### Tabla: producto_detalles
```sql
producto_detalles (
  id                 UUID PRIMARY KEY,
  producto_id        UUID FK → productos.id,
  marca              VARCHAR DEFAULT 'GENERICO',
  tamano             VARCHAR DEFAULT 'UNICO',
  ultimo_precio      DECIMAL,
  ultimo_comercio    VARCHAR,
  fecha_actualizacion TIMESTAMP
)
```

### Estrategia de Aprendizaje
1. **Búsqueda:** El usuario tipea en `ShoppingListView` → búsqueda fuzzy en `productos`.
2. **Alias:** La IA transcribe "HUEVOS L30" → `producto_alias` lo mapea a "HUEVOS".
3. **Aprendizaje:** Si no existe alias, tras confirmación del usuario en `ReviewModal` se crea uno nuevo.
4. **Precios:** Al confirmar un gasto, se actualiza `ultimo_precio` en `producto_detalles`.

### Regla Offline-First
No llamar a Supabase en el render inicial crítico ni en rutas de render síncronas.
Las consultas a Supabase son siempre asíncronas y silenciosas (no bloquean la UI).
