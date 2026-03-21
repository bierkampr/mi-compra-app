# Base de Datos y Modelos

## Modelo Local (AppDB)
```typescript
interface AppDB {
  gastos: Gasto[];
  lista: ListItem[];
  customCategories: string[];
}
```
- Todo gasto tiene un `category` (ej: 'super', 'mini', 'dining', etc).
- Los `photoIds` guardan las referencias de los tickets subidos a Google Drive.

## Supabase (Catálogo Maestro)
Supabase no guarda gastos de usuarios, guarda *conocimiento colectivo*:
1. **Tabla `productos`**: `id`, `nombre_base`, `categoria`.
2. **Tabla `producto_alias`**: Mapea nombres raros de tickets (ej. "TOMATE FRITO HDA") al `nombre_base` ("TOMATE FRITO").
3. **Tabla `producto_detalles`**: Guarda el `ultimo_precio` de un producto en un comercio específico.

## Reglas de Modificación
- Nunca consultar Supabase en el renderizado inicial crítico (rompería el offline-first).
- Las llamadas a Supabase son para sincronización "silenciosa" en segundo plano (ej: `syncProductWithSupabase`).
