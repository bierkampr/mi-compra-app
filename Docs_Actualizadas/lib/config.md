# Configuración — lib/config.ts

> Fuente: `lib/config.ts`
> Auditado: 2026-04-24
> Importado en: `lib/tokenStore.ts`, `lib/supabase.ts`, `app/api/auth/`, `app/components/AuthView.tsx`

---

## Constantes Exportadas

### CLIENT_ID
```typescript
export const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "948658882219-v40p55m9sc5s0rutmf811lq4kn4817of.apps.googleusercontent.com";
```
**Uso:** Identificador de cliente OAuth2 de Google.
**Tipo:** Pública (NEXT_PUBLIC_)

### FILE_NAME
```typescript
export const FILE_NAME = "mi_compra_data.json";
```
**Uso:** Nombre del archivo JSON guardado en Google Drive AppDataFolder.
**Contenido:** Estado completo AppDB (gastos, lista, categorías).

### PRICE_FILE_NAME
```typescript
export const PRICE_FILE_NAME = "mi_compra_precios.csv";
```
**Uso:** Nombre del archivo CSV de historial de precios en Google Drive.
**Contenido:** nombre_ticket, nombre_base, precio, comercio, fecha.

### SUPABASE_URL
```typescript
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
```
**Uso:** URL del proyecto Supabase.
**Tipo:** Pública (NEXT_PUBLIC_)

### SUPABASE_ANON_KEY
```typescript
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
```
**Uso:** Clave anónima de Supabase.
**Tipo:** Pública (NEXT_PUBLIC_)

---

## Notas de Seguridad

### Claves de IA
Las claves de API de IA **NO** están en este archivo.
Se gestionan exclusivamente en `app/api/analyze/route.ts` usando `process.env` del lado del servidor para máxima protección:
- `MISTRAL_API_KEY*`
- `GROQ_VISION_API_KEY*`
- `NVIDIA_API_KEY*`
- `SCALEWAY_API_KEY*`
- `GROQ_API_KEY*`

### Variables Públicas vs Secretas
- `NEXT_PUBLIC_*` → visibles en el bundle del cliente (IDs no secretos)
- Sin prefijo → solo servidor (secrets)

---

## Integración

**En `lib/supabase.ts`:**
```typescript
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**En `lib/tokenStore.ts` y rutas de auth:**
```typescript
import { CLIENT_ID } from '@/lib/config';
// Usado en el flujo OAuth2
```

**En `lib/gdrive.ts`:**
```typescript
import { FILE_NAME, PRICE_FILE_NAME } from "./config";
// Usado para nombrar archivos en Drive
```
