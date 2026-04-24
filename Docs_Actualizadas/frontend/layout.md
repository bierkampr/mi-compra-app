# Layout Raíz — app/layout.tsx

> Fuente: `app/layout.tsx`
> Auditado: 2026-04-24
> Tipo: Server Component (Next.js 15 App Router)

---

## Resumen

Layout raíz de la aplicación. Define metadata, HTML structure, meta tags PWA y carga de scripts globales.

---

## Metadata

```typescript
export const metadata: Metadata = {
  title: "Mi Compra App",
  description: "Personal Expense Manager Offline-First",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mi Compra",
  },
};
```

---

## HTML Structure

### html
- `lang="es"` - Idioma por defecto
- `className="h-full bg-slate-950"` - Altura completa, fondo oscuro

### head
**Meta tags críticos:**
- `<meta name="theme-color" content="#0D0F1A">` - Color de tema para navegador
- `<meta name="viewport">` - Configuración viewport con `user-scalable=no`
- `<script>` inline - Bloquea zoom pinch (previene zoom accidental en móvil)

### body
- `className={`${inter.className} h-full antialiased text-slate-200`}` - Fuente Inter, altura completa, suavizado de texto
- `<Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />` - Carga Google Identity Services antes de la hidratación

---

## Scripts Inline

### Bloqueo de Pinch Zoom
```javascript
(function() {
  function blockPinch(e) { if (e.touches.length > 1) e.preventDefault(); }
  document.addEventListener('touchstart', blockPinch, { passive: false });
  document.addEventListener('touchmove',  blockPinch, { passive: false });
})();
```

**Propósito:** Prevenir zoom accidental con dos dedos en móvil.

---

## Google Identity Services

**Script:** `https://accounts.google.com/gsi/client`
**Estrategia:** `beforeInteractive` - Carga antes de que la página sea interactiva.

**Uso:** Habilita el flujo OAuth2 en `AuthView.tsx`.

---

## Fuente

**Inter:** Fuente de Google cargada vía `next/font/google`
```typescript
const inter = Inter({ subsets: ["latin"] });
```

---

## Integración

El layout envuelve todo el contenido de `app/page.tsx`:
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full bg-slate-950">
      <head>...</head>
      <body className={`${inter.className} h-full antialiased text-slate-200`}>
        {children}
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
```
