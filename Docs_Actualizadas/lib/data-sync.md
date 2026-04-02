# Sincronizacion de Datos

> Fuente: `app/page.tsx` (updateAndSync), `lib/gdrive.ts`, `lib/tokenStore.ts`.

---

## La Funcion Central: updateAndSync()

Definida en `app/page.tsx`. Es el ÚNICO punto de entrada para mutar el estado `db`.

### Lo que hace
```
updateAndSync(newDb)
    │
    ├─ 1. setDb(newDb)  ← actualiza React state (render instantáneo)
    │
    ├─ 2. localStorage.setItem('mi_compra_cache_db', JSON.stringify(newDb))
    │      ← persiste offline inmediatamente
    │
    └─ 3. gdrive.upload(newDb)  ← intenta subir a Google Drive
           ├─ [sin conexión / sin token] → silencioso, no bloquea UI
           └─ [401 Unauthorized] → refreshAccessToken() → reintenta upload
```

**Debounce:** El upload a Drive tiene debounce de ~1s para evitar condiciones de carrera
en actualizaciones rápidas consecutivas.

### Regla de desarrollo
Ningún componente hijo debe escribir en `localStorage` directamente.
Siempre pasar el nuevo `db` al callback de `page.tsx` y dejar que `updateAndSync` lo gestione.

---

## Google Drive Integration (lib/gdrive.ts)

### Archivos en Drive AppDataFolder
| Archivo | Descripción |
|---|---|
| `mi_compra_data.json` | Estado completo AppDB (gastos, lista, categorías) |
| `mi_compra_precios.csv` | Historial de precios (referencia futura) |
| `[fileId].jpg` | Imágenes de tickets individuales |

### Operaciones principales
- **upload(db):** Sube el JSON de estado completo. Usa multipart upload.
- **download():** Lee el JSON desde Drive. Se llama al inicializar la sesión.
- **uploadImage(base64):** Sube una foto de ticket, devuelve el `fileId`.
- **downloadImage(fileId):** Descarga una foto como base64 para mostrarla en `DetailView`.

### Gestion de Errores 401
Cuando Drive devuelve 401:
1. `lib/gdrive.ts` llama a `lib/tokenStore.ts` → `refreshAccessToken()`.
2. `refreshAccessToken()` llama a `/api/auth/refresh` con el `refresh_token`.
3. Si tiene éxito, actualiza los tokens y regenera los FormData (para poder reintentar).
4. Reintenta la operación original.

> **Nota técnica:** Los FormData se regeneran antes del reintento porque son consumibles (no se pueden reusar).

---

## Token Storage (lib/tokenStore.ts)

| Token | Dónde se guarda | Por qué |
|---|---|---|
| `access_token` | `sessionStorage` | Vida corta, scope de pestaña |
| `refresh_token` | `localStorage` (Base64) | Persistente entre sesiones |

### Funciones expuestas
- `getAccessToken()` → string o null
- `setTokens(access, refresh)` → guarda ambos
- `refreshAccessToken()` → llama `/api/auth/refresh`, actualiza access_token
- `clearTokens()` → logout: borra de ambos storages

---

## Carga Inicial

Al montar `app/page.tsx`:
1. Lee `localStorage` → estado inmediato (sin parpadeo).
2. Si hay `access_token` válido:
   - Descarga desde Google Drive.
   - Si Drive tiene datos con `updatedAt` más reciente → los adopta y actualiza localStorage.
3. Si no hay token: muestra `AuthView`.
