# SettingsView.tsx — Diccionario del Componente

> Archivo: `app/components/SettingsView.tsx`
> Tipo: `"use client"` — React Client Component

---

## Propósito

Pantalla de ajustes de la aplicación. Muestra el perfil del usuario, permite reinstalar la PWA, exportar datos en CSV, ver el estado de sincronización, relanzar el tutorial y cerrar sesión.

---

## Props

```typescript
interface SettingsViewProps {
  user: { name: string };            // Datos del usuario autenticado
  db: { gastos: any[] };             // AppDB para exportar datos
  setActiveTab: (tab: string) => void; // Navegar a otra pestaña
  txt: (key: string) => string;      // Función i18n
  onShowHelp: () => void;            // Activa el HelpModal (tutorial)
}
```

---

## Estado interno

| Variable | Tipo | Valor inicial | Descripción |
|---|---|---|---|
| `showLogoutConfirm` | `boolean` | `false` | Abre el `ConfirmModal` de confirmación de cierre de sesión |
| `showInstallHint` | `boolean` | `false` | Muestra instrucciones manuales de instalación para iOS/Firefox |

---

## Hook externo

```typescript
const { canInstall, isIOS, isFirefox, isInstalled, handleInstall } = usePWAInstall();
```

| Valor | Tipo | Descripción |
|---|---|---|
| `canInstall` | `boolean` | True si la app puede instalarse (Chrome nativo, iOS, Firefox) |
| `isIOS` | `boolean` | True si el dispositivo es iPhone/iPad |
| `isFirefox` | `boolean` | True si el navegador es Firefox |
| `isInstalled` | `boolean` | True si la PWA ya está instalada |
| `handleInstall` | `function` | Dispara el prompt nativo de instalación (Chrome/Edge) |

---

## Funciones

### `handleLogout()`
1. `localStorage.clear()` — borra todos los datos locales (tokens, db, nombre, idioma)
2. `window.location.reload()` — recarga la app → sin token → muestra `AuthView`

---

## Layout de la UI

### Header
- Botón `ChevronLeft` → `setActiveTab('home')`
- Título `settings.title`

### Card de perfil
- Avatar cuadrado con inicial del nombre del usuario (`user.name[0].toUpperCase()`, fallback `'U'`)
- Nombre completo en grande
- Badge de verificación: `ShieldCheck` + `settings.verified`
- Icono `User` decorativo de fondo (opacidad 2%)

### Sección "Gestión de datos"

**1. Botón Tutorial** (siempre visible):
- Icono `Sparkles`, fondo `brand-primary/5`
- Click → `onShowHelp()`

**2. Botón Instalar PWA** (solo si `canInstall && !isInstalled`):
- Icono `Smartphone`
- Comportamiento según plataforma:
  - iOS o Firefox: `setShowInstallHint(h => !h)` → toggle del hint inline
  - Chrome/Edge: `handleInstall()` → prompt nativo
- Subtexto dinámico: `pwa.ios_hint` / `pwa.firefox_hint` / `pwa.banner_desc` según plataforma
- Bloque `showInstallHint` (solo iOS/Firefox): card con instrucciones en texto plano

**3. Botón Exportar CSV**:
- Icono `Download`, fondo `brand-accent/10`
- Click → `exportToCSV(db.gastos)` — genera y descarga un archivo `.csv`

**4. Estado de Sincronización** (solo visual, no interactivo):
- Icono `Database`, opacidad 50%
- Indicador de punto verde (`bg-brand-success animate-pulse`) — siempre verde (sin lógica real de estado)
- Textos `settings.sync_title` + `settings.sync_desc`

### Botón Cerrar sesión
- `btn-secondary` con color `brand-danger`
- Click → `setShowLogoutConfirm(true)`
- Al confirmar en el modal → `handleLogout()`

### ConfirmModal (logout)
- `type: 'danger'`
- Textos fijos: `confirmText="SALIR"`, `cancelText="CANCELAR"`

### Footer versión
- `settings.version` (texto pequeño, opacidad 30%)

---

## Dependencias de componentes y hooks

| Import | Origen | Uso |
|---|---|---|
| `usePWAInstall` | `app/hooks/usePWAInstall` | Detectar si se puede instalar y gestionar el prompt |
| `ConfirmModal` | `./ConfirmModal` | Confirmación del logout |

---

## Dependencias de librerías

| Import | Origen | Uso |
|---|---|---|
| `exportToCSV` | `lib/utils` | Genera y descarga CSV de gastos |

---

## Iconos (lucide-react)

| Icono | Uso |
|---|---|
| `LogOut` | Botón cerrar sesión (con animación `translate-x-1` al hacer active) |
| `Download` | Botón exportar CSV |
| `ChevronLeft` | Volver al home (header) + flecha decorativa en botones (rotada 180°) |
| `User` | Decoración de fondo en la card de perfil |
| `ShieldCheck` | Badge "verificado" en la card de perfil |
| `Database` | Estado de sincronización |
| `Sparkles` | Botón de tutorial |
| `Smartphone` | Botón instalar PWA |

---

## Claves i18n usadas

| Clave | Texto en español |
|---|---|
| `settings.title` | `AJUSTES` |
| `settings.verified` | `CUENTA VERIFICADA` |
| `settings.data_mgmt` | `GESTIÓN DE DATOS` |
| `settings.restart_tour` | `VER TUTORIAL` |
| `settings.export_title` | `EXPORTAR DATOS` |
| `settings.export_desc` | `Descarga tu historial como CSV` |
| `settings.sync_title` | `SINCRONIZACIÓN` |
| `settings.sync_desc` | `Google Drive activo` |
| `settings.logout` | `CERRAR SESIÓN` |
| `settings.version` | `MI COMPRA APP · v3.x` |
| `pwa.banner_title` | `INSTALAR APP` |
| `pwa.banner_desc` | Descripción para Chrome |
| `pwa.ios_hint` | Descripción para iOS |
| `pwa.firefox_hint` | Descripción para Firefox |
| `pwa.ios_step1_desc` | Instrucción paso 1 iOS |
| `pwa.ios_step3_desc` | Instrucción paso 3 iOS |
| `pwa.firefox_step1` | Instrucción paso 1 Firefox |
| `pwa.firefox_step2` | Instrucción paso 2 Firefox |
| `modals.logout_confirm` | Mensaje de confirmación de cierre de sesión |

---

## Notas importantes

- El indicador de sincronización está siempre en verde — no refleja el estado real de la conexión ni del último upload a Drive
- `handleLogout()` borra **todo** el `localStorage`, incluyendo preferencia de idioma, datos de db, tokens y nombre de usuario
- El botón de instalar PWA solo aparece si `canInstall && !isInstalled` — no se muestra si ya está instalada como PWA
- La inicial del avatar tiene fallback `'U'` si `user.name` es vacío o undefined
