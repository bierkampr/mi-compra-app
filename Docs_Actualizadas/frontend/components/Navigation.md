# Navigation.tsx — Diccionario del Componente

> Archivo: `app/components/Navigation.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Componente de navegación global. Renderiza **dos elementos independientes**: el header superior (título, estado offline, botones de ayuda y ajustes, avatar) y la barra de navegación flotante inferior con los tabs principales y el botón central de acción.

---

## Props

```typescript
interface NavigationProps {
  user: { name: string };              // Datos del usuario para mostrar la inicial en el avatar
  activeTab: string;                   // Tab activo ('home' | 'list' | 'scanner' | 'settings')
  setActiveTab: (tab: string) => void; // Cambia el tab activo
  onAddClick: () => void;              // Callback del botón central (+) — activa el escáner
  isOffline: boolean;                  // Muestra/oculta el badge de sin conexión
  txt: (key: string) => string;        // Función i18n
  onShowHelp: () => void;              // Abre el HelpModal (tutorial)
}
```

---

## Estado interno

Ninguno — componente completamente controlado por props.

---

## Layout

El componente devuelve un Fragment `<>` con **dos elementos**:

### 1. Header superior (`<header>`)

**Lado izquierdo**:
- Título `nav.title` (clase `heading-1`)
- Badge de offline (solo si `isOffline`): icono `WifiOff` + texto `nav.offline`, fondo `brand-danger/10`
- Subtítulo `nav.subtitle`

**Lado derecho** (flex con gap):
1. **Botón ayuda** (`Info`): abre `onShowHelp()`. Fondo `brand-accent/5`, borde `brand-accent/20`
2. **Botón ajustes** (`Settings`): navega a `setActiveTab('settings')`. Solo visible si `activeTab !== 'settings'`
3. **Avatar**: cuadrado redondeado (`rounded-xl`), gradiente violeta→indigo, muestra `user.name[0].toUpperCase()` o icono `User` si el nombre está vacío

### 2. Barra inferior (`<nav className="nav-bottom">`)

Tres secciones en fila (`flex`):

**Botón Home** (izquierda, `flex-1`):
- Icono `LayoutGrid`
- Label `nav.home`
- Activo si `activeTab === 'home'` o `activeTab === 'analytics'` → color `brand-primary`, `strokeWidth={2.5}`
- Inactivo → `text-brand-muted opacity-40`, `strokeWidth={2}`

**Botón central** (`+`):
- Posición: `-top-5` (flota sobre la barra)
- Cuadrado 14×14 (`w-14 h-14`), fondo `brand-primary`, `rounded-2xl`
- Sombra violeta: `shadow-[0_10px_30px_rgba(93,46,239,0.5)]`
- Click → `onAddClick()`
- Si `activeTab === 'add'`: rotación 45° (se convierte en `×`)

**Botón Lista** (derecha, `flex-1`):
- Icono `History`
- Label `nav.list`
- Activo si `activeTab === 'list'` → color `brand-primary`, `strokeWidth={2.5}`
- Inactivo → `text-brand-muted opacity-40`, `strokeWidth={2}`

---

## Z-Index

| Elemento | Z-Index | Definido en |
|---|---|---|
| `.nav-bottom` | `z-[100]` | `globals.css` (clase `nav-bottom`) |

---

## Comportamiento del botón central

El botón `+` llama `onAddClick()`, que en `page.tsx`:
1. Si `activeTab === 'scanner'`: cancela el modo escáner (`setPurchaseMode(null)`)
2. Si `activeTab !== 'scanner'`: navega a `setActiveTab('scanner')`

La rotación a 45° (modo `×`) ocurre cuando `activeTab === 'add'`, aunque actualmente este tab no se usa explícitamente — el botón funciona como toggle.

---

## Iconos (lucide-react)

| Icono | Uso |
|---|---|
| `LayoutGrid` | Tab Home |
| `Plus` | Botón central (acción principal) |
| `History` | Tab Lista |
| `Settings` | Acceso a ajustes (header) |
| `User` | Fallback en avatar si no hay nombre |
| `WifiOff` | Badge de modo offline |
| `Info` | Botón ayuda/tutorial |

---

## Claves i18n usadas

| Clave | Texto en español |
|---|---|
| `nav.title` | `MI COMPRA` |
| `nav.subtitle` | `GESTOR DE GASTOS` |
| `nav.offline` | `OFFLINE` |
| `nav.home` | `INICIO` |
| `nav.list` | `LISTA` |

---

## Notas importantes

- El componente no tiene tabs para `scanner` ni `settings` en la barra inferior — se accede al escáner vía el botón central y a ajustes vía el icono del header
- El botón `Settings` del header desaparece cuando `activeTab === 'settings'` para evitar redundancia
- La clase `nav-bottom` está definida en `globals.css` con `position: fixed`, `bottom`, `z-[100]` y estilos de fondo con blur — no es una clase de Tailwind inline
