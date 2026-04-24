# Configuración Tailwind CSS — tailwind.config.js

> Fuente: `tailwind.config.js`
> Auditado: 2026-04-24
> Tipo: CommonJS (Tailwind v3)

---

## Resumen

Configuración de Tailwind CSS extendida con colores custom, tipografía fluida y animaciones personalizadas.

---

## Content Paths

```javascript
content: [
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
  "./lib/**/*.{js,ts,jsx,tsx,mdx}",
],
```

**Propósito:** Escanea todos los archivos en `app/`, `components/` y `lib/` para detectar clases Tailwind.

---

## Colores Custom

### brand.* Palette
```javascript
colors: {
  brand: {
    bg: "#0D0F1A",        // Fondo ultra oscuro
    card: "#161926",      // Tarjetas
    primary: "#5D2EEF",   // Violeta principal
    secondary: "#2E3145", // Botones secundarios
    accent: "#00FAD9",    // Turquesa acento
    success: "#10B981",   // Verde totales
    danger: "#FF4E4E",    // Rojo borrar
    muted: "#8E94AF",     // Texto secundario
  },
}
```

**Uso:** `bg-brand-bg`, `text-brand-primary`, `border-brand-accent`, etc.

---

## Border Radius

```javascript
borderRadius: {
  '2xl': '1.25rem',
  '3xl': '1.75rem',
  '4xl': '2rem',
  '5xl': '2.5rem',
}
```

**Propósito:** Extiende los valores por defecto de Tailwind para bordes más redondeados.

---

## Tipografía Fluida

Usa `clamp()` para tipografía responsive:

```javascript
fontSize: {
  'fluid-xs': 'clamp(0.65rem, 2vw, 0.75rem)',
  'fluid-sm': 'clamp(0.8rem, 2.5vw, 0.9rem)',
  'fluid-base': 'clamp(0.9rem, 3vw, 1rem)',
  'fluid-lg': 'clamp(1.1rem, 4vw, 1.3rem)',
  'fluid-xl': 'clamp(1.5rem, 6vw, 2rem)',
  'fluid-2xl': 'clamp(2rem, 9vw, 3.5rem)',
}
```

**Propósito:** Escala automáticamente entre mínimo y máximo según el ancho de viewport.
**Uso:** `text-fluid-lg`, `text-fluid-2xl` (definidos como clases en `globals.css`).

---

## Animaciones

### slide-in-bottom
```javascript
"slide-in-bottom": "slide-in-bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
```
**Uso:** Modales que aparecen desde abajo.

### fade-in
```javascript
"fade-in": "fade-in 0.3s ease-in"
```
**Uso:** Elementos que aparecen con fade.

### scale-up
```javascript
"scale-up": "scale-up 0.2s ease-out"
```
**Uso:** Elementos que crecen al aparecer.

---

## Plugins

```javascript
plugins: [require("tailwindcss-animate")]
```

**Propósito:** Extiende Tailwind con animaciones personalizadas (usado con `tailwindcss-animate`).

---

## Notas

- **Archivo activo:** `tailwind.config.js` (CommonJS)
- **PostCSS config activo:** `postcss.config.js` (plugins: `tailwindcss` + `autoprefixer`)
- **Archivos MUERTOS:** `postcss.config.mjs` y `next.config.ts` (ver reporte de auditoría)
