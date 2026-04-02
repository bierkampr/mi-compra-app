# Variables de Entorno — Mi Compra App

> Fuente: `lib/config.ts`, `app/api/analyze/route.ts`, `app/api/auth/`.
> Archivo de configuración real: `.env.local` (en raíz, nunca se sube a Git).

---

## Variables Requeridas

### Autenticacion Google (OAuth2)

| Variable | Tipo | Donde se usa |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Publica | `lib/config.ts` → `AuthView.tsx` (GSI client) |
| `GOOGLE_CLIENT_SECRET` | **Secreta (servidor)** | `app/api/auth/token/route.ts`, `app/api/auth/refresh/route.ts` |

### Base de Datos Supabase

| Variable | Tipo | Donde se usa |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Publica | `lib/config.ts` → `lib/supabase.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publica | `lib/config.ts` → `lib/supabase.ts` |

### Pipeline de IA (solo servidor)

El sistema soporta hasta 6 claves por servicio (rotación automática ante rate limits).

| Variable | Descripción |
|---|---|
| `MISTRAL_API_KEY` | Clave primaria Mistral (visión) |
| `MISTRAL_API_KEY_1` … `MISTRAL_API_KEY_5` | Claves de rotación Mistral |
| `GROQ_API_KEY` | Clave primaria Groq (síntesis) |
| `GROQ_API_KEY_1` … `GROQ_API_KEY_5` | Claves de rotación Groq |
| `GEMINI_API_KEY` | Alternativa de visión (secundario) |

> La lógica de rotación está en `app/api/analyze/route.ts` funciones
> `getAllMistralKeys()` y `getAllGroqKeys()`.

---

## Ejemplo de .env.local

```env
# ── GOOGLE AUTH ──────────────────────────────
NEXT_PUBLIC_GOOGLE_CLIENT_ID=948658882219-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# ── SUPABASE ─────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── IA - MISTRAL (Vision) ─────────────────────
MISTRAL_API_KEY=tu_clave_primaria
MISTRAL_API_KEY_1=clave_rotacion_1
MISTRAL_API_KEY_2=clave_rotacion_2

# ── IA - GROQ (Sintesis) ──────────────────────
GROQ_API_KEY=tu_clave_primaria
GROQ_API_KEY_1=clave_rotacion_1

# ── IA - GEMINI (Alternativo) ─────────────────
GEMINI_API_KEY=AIzaSy...
```

---

## Notas de Seguridad

- Las variables `NEXT_PUBLIC_*` son visibles en el bundle del cliente. Solo usarlas para IDs no secretos.
- `GOOGLE_CLIENT_SECRET`, `MISTRAL_API_KEY*`, `GROQ_API_KEY*` son **solo servidor**. Nunca usar `NEXT_PUBLIC_` con estas.
- En Vercel, configurar en **Project Settings → Environment Variables**.
- El `.gitignore` ya excluye `.env.local`.

---

## Constantes de Configuracion (lib/config.ts)

```typescript
CLIENT_ID       // Google OAuth Client ID (público)
FILE_NAME       // "mi_compra_data.json" (nombre en Google Drive)
PRICE_FILE_NAME // "mi_compra_precios.csv" (archivo de precios en Drive)
SUPABASE_URL    // URL del proyecto Supabase
SUPABASE_ANON_KEY // Clave anónima Supabase
```
