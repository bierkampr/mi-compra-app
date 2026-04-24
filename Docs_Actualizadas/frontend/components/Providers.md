# Providers.tsx — Diccionario del Componente

> Archivo: `app/components/Providers.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Wrapper de providers de React para el árbol de componentes. Actualmente envuelve la app con `SessionProvider` de `next-auth/react`.

---

## Props

```typescript
{
  children: React.ReactNode;    // Árbol de componentes hijo
}
```

---

## Estado interno

Ninguno.

---

## Implementación actual

```typescript
"use client";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

---

## Uso en la app

Se usa en `app/layout.tsx` para envolver el árbol completo:

```tsx
<Providers>
  {children}
</Providers>
```

---

## Estado y advertencia

> **ADVERTENCIA**: Este componente importa `SessionProvider` de `next-auth/react`, pero la app **NO usa next-auth** como sistema de autenticación. La autenticación real se gestiona manualmente con Google OAuth2 Authorization Code Flow implementado en:
> - `app/components/AuthView.tsx`
> - `app/api/auth/token/route.ts`
> - `app/api/auth/refresh/route.ts`
> - `lib/tokenStore.ts`
>
> El `SessionProvider` de next-auth probablemente no aporta funcionalidad real a la aplicación actual. Es un **vestigio** de una integración con next-auth que nunca llegó a completarse o fue abandonada.

---

## Dependencias

| Import | Origen | Uso real |
|---|---|---|
| `SessionProvider` | `next-auth/react` | Ninguno funcional — wrapper vacío |

---

## Notas importantes

- Si `next-auth` no está en `package.json` o no está configurado con un handler, este componente podría generar errores silenciosos o warnings en consola
- Candidato a revisión: si `next-auth` no se va a usar, se debería eliminar esta dependencia y simplificar `Providers` a solo `children` o eliminarlo por completo de `layout.tsx`
