# Cliente Supabase — lib/supabase.ts

> Fuente: `lib/supabase.ts`
> Auditado: 2026-04-24
> Importado en: `lib/products.ts`

---

## Resumen

Inicialización del cliente Supabase usando la librería oficial `@supabase/supabase-js`.

---

## Exportación

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Tipo:** Singleton exportado
**Uso:** Importar directamente en cualquier archivo que necesite consultar Supabase

---

## Configuración

**Variables de entorno (desde `lib/config.ts`):**
- `SUPABASE_URL` - URL del proyecto Supabase
- `SUPABASE_ANON_KEY` - Clave anónima para acceso público

**Fallbacks:**
- Si no están configuradas, usa placeholders para no romper el build en desarrollo
- En Vercel, las variables reales se usan automáticamente

---

## Integración

**En `lib/products.ts`:**
```typescript
import { supabase } from "./supabase";

const { data, error } = await supabase.from('productos')
  .select(`id, nombre_base`)
  .or(`nombre_base.ilike.%${upperQuery}%`)
  .limit(30);
```

---

## Notas

- El cliente se inicializa una sola vez (singleton pattern)
- Usa la anon key para acceso público (RLS en Supabase protege los datos)
- No incluye lógica de negocio - solo el cliente crudo
- Las operaciones de negocio están en `lib/products.ts`
