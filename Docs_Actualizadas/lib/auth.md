# Autenticacion — Google OAuth2

> Fuente: `app/api/auth/token/route.ts`, `app/api/auth/refresh/route.ts`,
> `lib/tokenStore.ts`, `app/components/AuthView.tsx`.

---

## Flujo Completo

```
1. Usuario hace clic en "Iniciar sesión con Google"
       │
       ▼
2. AuthView inicializa Google Identity Services (GSI)
   con NEXT_PUBLIC_GOOGLE_CLIENT_ID
       │ Authorization Code Flow
       ▼
3. Google muestra pantalla de consentimiento
   Scopes solicitados:
     - https://www.googleapis.com/auth/drive.appdata  (Drive privado)
     - https://www.googleapis.com/auth/userinfo.profile (nombre del usuario)
       │ código de autorización
       ▼
4. Cliente → POST /api/auth/token { code, redirect_uri }
       │
       ▼
5. Servidor intercambia con Google usando GOOGLE_CLIENT_SECRET
   Google devuelve: { access_token, refresh_token, expires_in }
       │
       ▼
6. Servidor → Cliente: { access_token, refresh_token }
       │
       ▼
7. tokenStore.setTokens(access_token, refresh_token)
   - access_token → sessionStorage
   - refresh_token → localStorage (base64)
       │
       ▼
8. page.tsx inicializa sesión, carga datos desde Drive
```

## Renovacion Automatica de Tokens

```
gdrive.ts hace petición → Google responde 401
       │
       ▼
tokenStore.refreshAccessToken()
       │
       ▼
POST /api/auth/refresh { refresh_token }
       │
       ▼
Servidor → Google: nuevo access_token
       │
       ▼
tokenStore actualiza access_token en sessionStorage
       │
       ▼
gdrive.ts reintenta la operación original (con FormData regenerado)
```

## Scopes y Permisos

| Scope | Para qué se usa |
|---|---|
| `drive.appdata` | Leer/escribir `mi_compra_data.json` en la carpeta oculta de la app en Drive |
| `userinfo.profile` | Mostrar nombre y foto del usuario en la UI |

## Rutas API Involucradas

| Ruta | Propósito |
|---|---|
| `POST /api/auth/token` | Intercambio código → tokens (login inicial) |
| `POST /api/auth/refresh` | Renovar access_token expirado (transparente al usuario) |

## Rutas Protegidas vs Publicas

- **Pública:** `AuthView` — visible antes del login.
- **Protegida (React):** Todo lo demás (`Dashboard`, `Scanner`, etc.) solo se renderiza si `user.loggedIn === true`.
- **API `/api/analyze`:** Internamente protegida por las claves del servidor. No requiere token de usuario.
