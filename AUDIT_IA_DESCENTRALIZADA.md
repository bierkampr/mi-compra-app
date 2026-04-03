# 🔍 AUDITORÍA: Migración a IA Descentralizada
**Fecha:** 2026-04-03  
**Estado:** ⚠️ INCOMPLETO — Fallo en edición JSX de `ScannerView.tsx`  
**Sesión:** `5a74a5f8-576c-4af0-9ff5-44d4cd21c636`

---

## 1. OBJETIVO DE LA MIGRACIÓN

Migrar el procesamiento de IA de la app desde un modelo centralizado (API Key propia de Mistral/Groq) a un modelo **"Bring Your Own Identity"** (BYOI) usando **Google OAuth2**.

### Motivación
- **Costo cero:** No se necesita API Key propia; cada usuario usa su cuota gratuita de Google AI Studio.
- **Escalabilidad infinita:** Sin límites del servidor; el límite es per-usuario de Google.
- **Privacidad:** Los datos del usuario nunca pasan por un intermediario de IA de terceros.

### Modelo Técnico
```
Usuario → Login Google OAuth2 (con scope generative-language)
       → Access Token con permiso de IA
       → App envía token al backend
       → Backend usa token como Bearer para llamar a Gemini API directamente
       → Gemini procesa bajo la cuota personal del usuario
```

---

## 2. CAMBIOS REALIZADOS (COMPLETADOS ✅)

### 2.1 Backend: `app/api/analyze/route.ts`
- **Antes:** Usaba API Keys de Mistral/Groq almacenadas en `.env.local`.
- **Después:** Reescrito completamente para usar **Gemini 2.0 Flash** (`generativelanguage.googleapis.com`).
- Acepta `Authorization: Bearer {user_token}` del frontend.
- Manejo de errores específicos:
  - `403` → Permiso de IA denegado → Devuelve `AI_PERMISSION_DENIED`
  - `429` → Límite de cuota → Devuelve `RATE_LIMITED`
  - `401` → Token expirado → Devuelve `TOKEN_EXPIRED`

### 2.2 Cliente IA: `lib/ai-client.ts`
- **Antes:** Enviaba request sin token de usuario.
- **Después:** `analyzeReceipt()` ahora acepta `userToken` como parámetro y lo inyecta como `Authorization: Bearer`.
- Validación: Si no hay token, lanza error antes de hacer la petición.

### 2.3 Token Store: `lib/tokenStore.ts`
- **Añadido:** Estado de permiso de IA en `localStorage`:
  - `setAiPermission(granted: boolean)` → Guarda en `mi_compra_ai_granted`
  - `isAiPermissionGranted()` → Lee de `mi_compra_ai_granted`
- **Modificado:** `clearTokens()` ahora también limpia el estado de IA.

### 2.4 Auth View: `app/components/AuthView.tsx`
- **Añadido:** Scope `https://www.googleapis.com/auth/generative-language` al flujo de OAuth.
- **Fix:** Race condition corregida — se usa `import` estático de tokenStore y se guarda el estado de IA de forma síncrona antes del `window.location.reload()`.
- **Flujo:** Si el usuario otorga el scope de IA durante el login, se guarda `mi_compra_ai_granted = true`.

### 2.5 Página Principal: `app/page.tsx`
- `startAnalysis()` ahora pasa `tokenStore.getToken()` a `analyzeReceipt()`.
- Manejo reactivo: Si la API devuelve `AI_PERMISSION_DENIED`, actualiza `tokenStore.setAiPermission(false)`.
- **Añadido:** `clientId={CLIENT_ID}` como prop a `ScannerView.Capture`.

### 2.6 Consola Google Cloud
- **Scopes habilitados:** Solo 3 esenciales:
  1. `drive.appdata` — Almacenamiento de datos en Drive.
  2. `userinfo.profile` — Perfil del usuario.
  3. `generative-language` — IA de Google (Gemini).
- **Limpiados:** Se eliminaron scopes innecesarios (Drive full, Docs, Sheets).
- **API habilitada:** Gemini API activada en la consola.

---

## 3. CAMBIOS EN PROGRESO (⚠️ CON FALLO)

### 3.1 ScannerView.tsx — Panel de Bloqueo de IA

**Objetivo:** Cuando el usuario NO tiene permiso de IA (`mi_compra_ai_granted = false`), el escáner debe mostrar un panel de bloqueo en lugar de los controles de cámara, con un botón "ACTIVAR IA DE GOOGLE" que ejecute autorización incremental OAuth.

**Lo que se intentó:**
1. Añadir `clientId` como prop al componente `ScannerView.Capture`.
2. Añadir estados `isAiGranted` y `isRequestingAi`.
3. Añadir `useEffect` que verifica `tokenStore.isAiPermissionGranted()` al montar.
4. Añadir función `requestAiPermission()` que usa `google.accounts.oauth2.initCodeClient` para pedir solo el scope de IA faltante.
5. Renderizar condicionalmente: si `!isAiGranted`, mostrar panel de bloqueo premium; si no, mostrar la vista normal de captura.

**⚠️ FALLO:**
Las ediciones incrementales al JSX del `ScannerView.tsx` corrompieron la estructura del árbol JSX. Múltiples intentos de corrección parcial no lograron restaurar la estructura correcta.

**Errores Actuales en el Archivo:**
```
- JSX element 'div' has no corresponding closing tag (línea 309)
- '}' expected (línea 522)
- Unexpected token (línea 523)
- '</' expected (línea 525)
- Module has no default export (en page.tsx línea 18)
```

**Causa Raíz:**
El componente tiene una estructura JSX profundamente anidada (~400+ líneas). Las ediciones parciales con `replace_file_content` en bloques no contiguos generaron desbalanceo de tags al:
1. Insertar un bloque ternario `{!isAiGranted ? (...) : (<>...</>)}` dentro de la vista de preparación.
2. Perder la referencia del cierre de `</div>` del contenedor padre.
3. Añadir/quitar tags de forma inconsistente en intentos de corrección.

---

## 4. ESTADO DEL ARCHIVO `ScannerView.tsx`

### Estructura JSX Actual (Rota):
```
return (
  <div>                          // L309 — root (OK)
    {!showCamera && (            // L312 — condicional (OK)
      <div>                      // L313 — preparation wrapper (⚠️ NO CERRADO CORRECTAMENTE)
        <div>header</div>        // L314-326 (OK)
        {!isAiGranted ? (        // L328 — ternario
          <div>bloqueo IA</div>  // L329-366 (OK)
        ) : (
          <>                     // L368 — fragment
            <div>instrucciones</div>  // L369-386 (OK)
            <div>fotos</div>     // L388-422 (OK)
            <div>botón procesar</div> // L424-444 (OK)
          </>                    // L445
        )}                       // L446
      </div>                     // L447 — AÑADIDO, cerrando L313
    )}                           // L448 — AÑADIDO, cerrando L312
    
    {showCamera && (...)}        // L449+ — Vista de cámara (OK)
    <ConfirmModal ... />         // Modales (OK)
    <ConfirmModal ... />         // Modales (OK)
  </div>                         // L521 — cierre root (OK)
);
```

### Lo que Falta Verificar:
La última edición (líneas 444-448) **debería** haber corregido la estructura, pero no se pudo verificar porque el `tsc --noEmit` fue cancelado por el usuario.

---

## 5. ARCHIVOS MODIFICADOS EN ESTA SESIÓN

| Archivo | Estado | Cambios |
|---------|--------|---------|
| `app/api/analyze/route.ts` | ✅ Completo | Reescrito para Gemini 2.0 Flash con Bearer token |
| `lib/ai-client.ts` | ✅ Completo | Acepta y pasa token de usuario |
| `lib/tokenStore.ts` | ✅ Completo | Estado de permiso de IA en localStorage |
| `app/components/AuthView.tsx` | ✅ Completo | Scope de IA + fix race condition |
| `app/page.tsx` | ✅ Completo | Pasa token y clientId como props |
| `app/components/ScannerView.tsx` | ⚠️ **ROTO** | JSX corrompido por edits incrementales |

---

## 6. PLAN DE CORRECCIÓN

### Opción 1: Reescribir ScannerView.Capture completo (RECOMENDADO)
Tomar todo el componente `ScannerView.Capture` (líneas 106-523) y reescribirlo de una sola vez con la lógica correcta, garantizando que el árbol JSX esté balanceado.

### Opción 2: Corrección quirúrgica
Verificar que la última edición (L447-448 añadidos) resolvió el balanceo y ejecutar `npx tsc --noEmit` para confirmar.

---

## 7. CONFIGURACIÓN DEL ENTORNO

```env
# .env.local (variables relevantes)
GOOGLE_CLIENT_ID=<ID de cliente OAuth>
GOOGLE_CLIENT_SECRET=<secreto de cliente>
```

### Scopes OAuth activos:
- `https://www.googleapis.com/auth/drive.appdata`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/generative-language`

### API de Google habilitada:
- Gemini API (generativelanguage.googleapis.com)

---

## 8. DECISIONES DE DISEÑO IMPORTANTES

1. **Sin API Keys propias:** La app es 100% gratuita para el desarrollador. No hay costos de IA.
2. **Autorización incremental:** Si el usuario no otorga el permiso de IA en el login, puede hacerlo después cuando intente escanear (bloqueo del escáner con botón de activación).
3. **initCodeClient vs initTokenClient:** Se usa `initCodeClient` (authorization code flow) para que el servidor pueda intercambiar el código por un refresh token que persista el scope.
4. **Gemini 2.0 Flash:** Modelo elegido por velocidad y cuota gratuita generosa.

---

*Este documento es temporal y debe eliminarse una vez verificado que todos los cambios están correctos.*
