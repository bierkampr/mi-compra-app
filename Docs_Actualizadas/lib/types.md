# Tipos TypeScript — Mi Compra App

> Fuente: `lib/types.ts`
> Auditado: 2026-04-24
> Importado en: `app/page.tsx`, `lib/gdrive.ts`, componentes

---

## Interfaces

### Product
Representa un producto individual dentro de un gasto.

```typescript
interface Product {
  cantidad: number;        // Cantidad comprada
  nombre_ticket: string;  // Texto literal del ticket
  nombre_base: string;    // Nombre normalizado (Title Case)
  subtotal: number;       // Precio total de la línea
}
```

### Gasto
Representa un ticket de compra completo.

```typescript
interface Gasto {
  comercio: string;        // Nombre del comercio (MAYÚSCULAS)
  fecha: string;          // Formato "DD/MM/YYYY"
  total: number;          // Total pagado
  category: string;       // Categoría ('super', 'mini', 'dining', custom)
  photoIds: string[];     // IDs de archivos en Google Drive
  productos: Product[];   // Lista de productos
  usedList?: boolean;     // Si se usó la lista de compras
}
```

### ListItem
Item de la lista de compras.

```typescript
interface ListItem {
  name: string;           // Nombre del producto
  checked: boolean;      // Si está marcado como comprado
  confirmed: boolean;     // Si fue confirmado en un gasto
}
```

### AppDB
Estado completo de la aplicación (guardado en localStorage y Google Drive).

```typescript
interface AppDB {
  gastos: Gasto[];                // Historial de compras
  lista: ListItem[];              // Lista de la compra actual
  customCategories: string[];     // Categorías creadas por el usuario
}
```

### UserState
Estado de autenticación del usuario.

```typescript
interface UserState {
  name: string;          // Nombre del usuario (desde Google)
  loggedIn: boolean;     // Si está autenticado
  token: string;         // Access token de Google
}
```

---

## Uso

**Importación:**
```typescript
import { AppDB, Gasto, Product, ListItem, UserState } from '@/lib/types';
```

**En `app/page.tsx`:**
- Estado `db` es de tipo `AppDB`
- Estado `user` es de tipo `UserState`

**En `lib/gdrive.ts`:**
- `getDriveFile()` devuelve `{ id: string | null; data: AppDB }`
- `saveDriveFile()` recibe `content: AppDB`

**En componentes:**
- `ReviewModal` recibe `pendingGasto: any` (estructura similar a Gasto pero con `tempImages`)
- `DetailView` recibe `gasto: Gasto`

---

## Persistencia

- **localStorage:** Clave `mi_compra_cache_db` → JSON de `AppDB`
- **Google Drive:** Archivo `mi_compra_data.json` en AppDataFolder → JSON de `AppDB`

Ambas capas usan la misma estructura de tipos.
