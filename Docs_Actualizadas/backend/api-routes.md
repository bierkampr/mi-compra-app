# Rutas API — Mi Compra App

> Fuente: `app/api/`. Todas son rutas de servidor Next.js (App Router).
> Para el pipeline de IA en detalle, ver [ai-pipeline.md](./ai-pipeline.md).
> Para el flujo de autenticación, ver [lib/auth.md](../lib/auth.md).

---

## 1. POST /api/analyze

**Archivo:** `app/api/analyze/route.ts`
**Proposito:** Pipeline de IA distribuido para procesar fotos de tickets de compra.

### Request
```typescript
{
  images: string[];   // Array de 1-3 imágenes en Base64
  prompt: string;     // Prompt personalizado (categoría del comercio)
  mode: 'super' | 'mini' | 'dining' | 'manual' | string;
}
```

### Response (éxito)
```typescript
{
  comercio: string;   // Nombre del comercio en mayúsculas
  fecha: string;      // Formato "DD/MM/AAAA"
  total: number;
  productos: Array<{
    cantidad: number;
    nombre_ticket: string;  // Texto literal del ticket
    nombre_base: string;    // Nombre normalizado
    subtotal: number;
  }>;
}
```

### Modo Manual
Si `mode === "manual"`, devuelve directamente una estructura vacía sin llamar a ninguna IA:
```json
{ "comercio": "INGRESO MANUAL", "fecha": "hoy", "total": 0, "productos": [] }
```

### Errores
- `400` — No se recibieron imágenes o se enviaron más de 3.
- `500` — Sin claves de API configuradas o fallo de todas las claves disponibles.

### Seguridad
Las claves de API (`MISTRAL_API_KEY*`, `GROQ_API_KEY*`) están **solo en el servidor**.
Nunca se exponen al cliente. Ver [environment.md](../environment.md).

---

## 2. POST /api/auth/token

**Archivo:** `app/api/auth/token/route.ts`
**Proposito:** Intercambia el código OAuth2 de Google por `access_token` y `refresh_token`.

### Flujo
1. El cliente (AuthView + GSI) obtiene un `code` de Google.
2. Llama a este endpoint con el `code`.
3. El servidor hace la petición a Google con `GOOGLE_CLIENT_SECRET` (nunca expuesta al cliente).
4. Devuelve los tokens al cliente.

### Request
```typescript
{ code: string; redirect_uri: string; }
```

### Response
```typescript
{ access_token: string; refresh_token: string; expires_in: number; }
```

---

## 3. POST /api/auth/refresh

**Archivo:** `app/api/auth/refresh/route.ts`
**Proposito:** Renueva un `access_token` expirado usando el `refresh_token` guardado.

### Flujo
1. `lib/gdrive.ts` detecta error 401 en cualquier llamada a Drive.
2. Llama automáticamente a este endpoint con el `refresh_token`.
3. El servidor solicita nuevo `access_token` a Google.
4. El cliente actualiza `tokenStore` y reintenta la operación original.

### Request
```typescript
{ refresh_token: string; }
```

### Response
```typescript
{ access_token: string; expires_in: number; }
```
