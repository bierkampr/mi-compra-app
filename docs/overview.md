# Visión General: Mi Compra App

## Propósito
Gestor de gastos personales e inventario de lista de compras offline-first. Utiliza Inteligencia Artificial para extraer información de tickets de compra (fotos) de forma automática.

## Stack Tecnológico
- **Framework:** Next.js 15 (App Router) + React 19.
- **Estilos:** Tailwind CSS (con clases base premium personalizadas en `globals.css`).
- **PWA:** Funciona como aplicación instalable (`manifest.json`).
- **Iconografía:** `lucide-react`.
- **Internacionalización:** Sistema propio (`lib/i18n.ts`).

## Filosofía de Desarrollo
- **Offline-First:** La app debe funcionar sin internet leyendo de `localStorage`.
- **UI Premium:** Uso de `card-premium`, `btn-primary`, y esquemas ultra-oscuros (`#0D0F1A`).
- **Seguridad:** Las API Keys de IA NUNCA van al cliente. Todo el procesamiento de IA ocurre en rutas API (`/api/analyze`).
