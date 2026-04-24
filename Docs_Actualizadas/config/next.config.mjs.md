# Configuración Next.js — next.config.mjs

> Fuente: `next.config.mjs`
> Auditado: 2026-04-24

---

## Resumen

Configuración de Next.js para el proyecto. Define comportamiento de build y headers HTTP.

---

## Configuración Actual

```javascript
const nextConfig = {
  // Ignoramos errores para facilitar el despliegue rápido
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // --- CORRECCIÓN DE SEGURIDAD PARA GOOGLE LOGIN ---
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};
```

---

## Opciones de Build

### eslint: ignoreDuringBuilds
**Propósito:** Ignorar errores de ESLint durante el build en Vercel.
**Nota:** Permite despliegue rápido pero no debe usarse en producción a largo plazo.

### typescript: ignoreBuildErrors
**Propósito:** Ignorar errores de TypeScript durante el build en Vercel.
**Nota:** Permite despliegue rápido pero no debe usarse en producción a largo plazo.

---

## Headers HTTP

### Cross-Origin-Opener-Policy
**Valor:** `same-origin-allow-popups`
**Propósito:** Permitir que el popup de Google OAuth2 funcione correctamente.
**Contexto:** Google Identity Services (GSI) requiere este header para el flujo de autenticación.

---

## Notas

- El archivo usa extensión `.mjs` (ES Module)
- Configuración minimalista para despliegue rápido
- Para producción, considerar habilitar ESLint y TypeScript checks
