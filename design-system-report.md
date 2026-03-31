# Design System Report — Mi Compra App

This document outlines the design system extracted from the **Mi Compra App** project. The system is designed for a premium, dark-mode, mobile-first experience with high-contrast accents and fluid typography.

## 1. Framework Detected
- **Framework**: Tailwind CSS v3.4+
- **Platform**: Next.js (App Router)
- **Icons**: Lucide React
- **Animations**: Tailwind Animate (`tailwindcss-animate` plugin)

## 2. Design Tokens

### Colors
| Role | Color Name | Hex | Usage |
| :--- | :--- | :--- | :--- |
| Background | `brand-bg` | `#0D0F1A` | Main page background |
| Surface | `brand-card` | `#161926` | Card backgrounds, modals |
| Primary | `brand-primary`| `#5D2EEF` | Main buttons, primary actions, highlights |
| Secondary | `brand-secondary`| `#2E3145` | Secondary buttons, input backgrounds |
| Accent | `brand-accent` | `#00FAD9` | Icons, secondary highlights, status |
| Success | `brand-success` | `#10B981` | Positive numbers, completed states |
| Danger | `brand-danger` | `#FF4E4E` | Destructive actions, errors |
| Muted | `brand-muted` | `#8E94AF` | Labels, placeholder text, secondary icons |

### Typography
- **Font Family**: Inter (via Google Fonts)
- **Scale**: Fluid (using `clamp`)

| Token | CSS / Tailwind | Visual Style |
| :--- | :--- | :--- |
| `fluid-xs` | `0.65rem` to `0.75rem` | Captions, small labels |
| `fluid-sm` | `0.8rem` to `0.9rem` | Small body text |
| `fluid-base` | `0.9rem` to `1rem` | Standard body text |
| `fluid-lg` | `1.1rem` to `1.3rem` | Subheadings |
| `fluid-xl` | `1.5rem` to `2rem` | Section titles |
| `fluid-2xl` | `2rem` to `3.5rem` | Page hero titles |

### Border Radius
- `2xl`: `1.25rem` (Buttons, Inputs)
- `3xl`: `1.75rem` (Glass Cards)
- `4xl`: `2rem` (Premium Cards)
- `5xl`: `2.5rem` (Navigation, Large containers)

---

## 3. Tailwind Configuration Data
Copy this `extend` block into your `tailwind.config.js` to replicate the design tokens:

```javascript
theme: {
  extend: {
    colors: {
      brand: {
        bg: "#0D0F1A",
        card: "#161926",
        primary: "#5D2EEF",
        secondary: "#2E3145",
        accent: "#00FAD9",
        success: "#10B981",
        danger: "#FF4E4E",
        muted: "#8E94AF",
      },
    },
    borderRadius: {
      '2xl': '1.25rem',
      '3xl': '1.75rem',
      '4xl': '2rem',
      '5xl': '2.5rem',
    },
    fontSize: {
      'fluid-xs': 'clamp(0.65rem, 2vw, 0.75rem)',
      'fluid-sm': 'clamp(0.8rem, 2.5vw, 0.9rem)',
      'fluid-base': 'clamp(0.9rem, 3vw, 1rem)',
      'fluid-lg': 'clamp(1.1rem, 4vw, 1.3rem)',
      'fluid-xl': 'clamp(1.5rem, 6vw, 2rem)',
      'fluid-2xl': 'clamp(2rem, 9vw, 3.5rem)',
    },
    animation: {
      "slide-in-bottom": "slide-in-bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      "fade-in": "fade-in 0.3s ease-in",
      "scale-up": "scale-up 0.2s ease-out",
    },
  },
}
```

---

## 4. Component Usage Guide

### 1. Buttons
Available in three main variants:
- **Primary**: High-impact violet with shadow.
- **Secondary**: Dark gray, subtle borders.
- **Icon**: Square-ish with centered icon.

```html
<!-- Primary Button -->
<button class="btn-primary">Añadir Gasto</button>

<!-- Secondary Button -->
<button class="btn-secondary">Cancelar</button>

<!-- Icon Button -->
<button class="btn-icon">
  <svg>...</svg>
</button>
```

### 2. Cards
- **Premium Card**: Deep surface color, large radius, subtle white border.
- **Glass Card**: Semi-transparent with backdrop blur.

```html
<!-- Premium Card -->
<div class="card-premium">
  <h2 class="heading-2">Resumen</h2>
  <p>Contenido aqui</p>
</div>

<!-- Glass/Clickable Card -->
<div class="card-glass card-clickable">
  <p>Toca para ver detalles</p>
</div>
```

### 3. Typography Helpers
- `.heading-1`: For main totals or page titles. Large, italic, black.
- `.heading-2`: For section headers. Bold and uppercase.
- `.text-small-caps`: For secondary labels. Very small, black, wide tracking.

---

## 5. Replicating in a New Project

1. **Install Dependencies**:
   ```bash
   npm install lucide-react tailwindcss-animate
   ```
2. **Setup Tailwind Config**: Use the `extend` block provided above.
3. **Import Font**: Add Inter from Google Fonts to your CSS:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
   ```
4. **Copy Base Styles**: Include the `.app-layout`, `.btn-*`, and `.card-*` classes from `globals.css` into your main stylesheet.
5. **Layout Rule**: Always use a wrapper with `.app-layout` to ensure consistent horizontal margins and safe area handling.

## 6. Do's and Don'ts

### ✅ Do
- Use **all-caps** for buttons and labels to match the bold aesthetic.
- Use **fluid typography** tokens (`text-fluid-*`) to ensure responsiveness.
- Use **glassmorphism** (`card-glass`) for elements that overlay others.
- Apply **active:scale-[0.95]** to interactive elements to provide tactile feedback.

### ❌ Don't
- Use plain white text on buttons; use `font-black` and extreme tracking for legibility.
- Use standard HTML borders; prefer `border-white/[0.05]` or subtle gradients.
- Hardcode font sizes; always use the fluid scale.
- Overuse colors; stick to the brand palette for a cohesive premium feel.
