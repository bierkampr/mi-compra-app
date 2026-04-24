# AuthView.tsx — Diccionario del Componente

> Archivo: `app/components/AuthView.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Pantalla de bienvenida y login. Es la única vista visible cuando no hay sesión activa (`!user.loggedIn`). Implementa el flujo OAuth2 completo con Google usando el Authorization Code Flow con popup.

---

## Props

```typescript
interface AuthViewProps {
  CLIENT_ID: string;          // Google OAuth Client ID (NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  txt: (key: string) => string; // Función i18n para textos
}
```

---

## Estado interno

| Variable | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `isLoggingIn` | `boolean` | `false` | Bloquea el botón y muestra spinner durante el flujo OAuth |

---

## Funciones

### `handleLogin()`

Inicia el flujo OAuth2 completo. Pasos:

1. Activa `isLoggingIn = true`
2. Verifica que `window.google` (GSI SDK) esté cargado; si no, muestra `alert` y aborta
3. Inicia timer de seguridad de **40 segundos** → libera el botón si no hay respuesta
4. Crea el cliente OAuth con `window.google.accounts.oauth2.initCodeClient()`
   - `ux_mode: 'popup'` — abre ventana flotante de Google
   - `select_account: true` — fuerza el selector de cuentas aunque haya sesión activa
   - `scope`: `drive.appdata` + `userinfo.profile`
5. Llama `client.requestCode()` para abrir el popup

**Callback de éxito** (`response.code` recibido):
1. Cancela el timer de seguridad
2. `POST /api/auth/token` con el `code` → recibe `access_token` + `refresh_token`
3. Guarda en `localStorage`:
   - `gdrive_token` ← `access_token`
   - `gdrive_refresh_token` ← `refresh_token` (si existe)
4. Llama a `https://www.googleapis.com/oauth2/v3/userinfo` con el `access_token`
5. Guarda `info.name` en `localStorage` como `user_name` (fallback: `"Usuario"`)
6. Llama `window.location.reload()` para reiniciar la app con sesión activa

**Callbacks de error:**
- `error_callback` (GSI) → cancela timer, `isLoggingIn = false`
- `catch` en `requestCode()` → cancela timer, `isLoggingIn = false`
- Error en fetch → `alert("Error al validar la sesión")`, `isLoggingIn = false`

---

## Scopes OAuth solicitados

| Scope | Para qué |
|---|---|
| `https://www.googleapis.com/auth/drive.appdata` | Leer/escribir `mi_compra_data.json` en la carpeta oculta de la app |
| `https://www.googleapis.com/auth/userinfo.profile` | Obtener nombre del usuario para la UI |

---

## Dependencias externas

| Dependencia | Origen | Uso |
|---|---|---|
| `window.google` | Script GSI cargado en `app/layout.tsx` | Crear cliente OAuth y abrir popup |
| `POST /api/auth/token` | Ruta interna Next.js | Intercambiar código → tokens (usa `GOOGLE_CLIENT_SECRET` en servidor) |
| `googleapis.com/oauth2/v3/userinfo` | Google REST API | Obtener nombre del usuario |

---

## localStorage escrito por este componente

| Clave | Valor |
|---|---|
| `gdrive_token` | `access_token` de Google |
| `gdrive_refresh_token` | `refresh_token` de Google |
| `user_name` | Nombre del usuario (o `"Usuario"` como fallback) |

---

## UI / Render

- Fondo: blob difuminado animado (`animate-pulse`, `blur-[120px]`, color `brand-primary/10`)
- Icono: `ShoppingCart` (lucide) en tarjeta con rotación 12°, sombra violeta
- Título: `txt('auth.title')` + `txt('auth.app')`
- Subtítulo: `txt('auth.subtitle')`
- Botón: blanco con logo SVG de Google inline (4 paths con colores oficiales). Mientras `isLoggingIn`, muestra `Loader2` animado en lugar del texto
- Footer: `txt('auth.footer')` — nota de privacidad

---

## Claves i18n usadas

| Clave | Texto en español |
|---|---|
| `auth.title` | `MI COMPRA` |
| `auth.app` | `APP` |
| `auth.subtitle` | `Inteligencia Artificial para tus gastos` |
| `auth.login_btn` | `Entrar con Google` |
| `auth.footer` | `Tus datos se guardan de forma privada en tu propia cuenta de Google Drive` |

---

## Iconos (lucide-react)

| Icono | Uso |
|---|---|
| `ShoppingCart` | Logo de la app (size 48) |
| `Loader2` | Spinner durante el login (size 24, `animate-spin`) |

---

## Notas de seguridad

- `GOOGLE_CLIENT_SECRET` **nunca** llega al cliente — el intercambio de código sucede en `/api/auth/token` (servidor)
- Timer de 40s como seguridad ante popups cerrados por el usuario sin respuesta
- `select_account: true` evita logins automáticos silenciosos sin consentimiento explícito
