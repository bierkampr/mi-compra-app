# Arquitectura del Sistema — Mi Compra App

> Fuente: código auditado el 2026-04-02.
> Para reglas de estilo, ver [ui/design-system.md](./ui/design-system.md).
> Para flujo de datos, ver [lib/data-sync.md](./lib/data-sync.md).

---

## Vision General

Mi Compra App es una SPA (Single-Page Application) construida con **Next.js 15 App Router**.
Su característica principal es ser **Offline-First**: la app funciona sin internet en supermercados con mala cobertura, usando `localStorage` como base de datos primaria y sincronizando a la nube en segundo plano.

## Stack Tecnologico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 |
| Estilos | Tailwind CSS 3.4 + clases custom en `globals.css` |
| Iconos | Lucide React |
| PWA | manifest.json + meta tags en layout.tsx |
| i18n | Sistema propio (`lib/i18n.ts` + `locales/`) |
| DB usuario | Google Drive AppDataFolder (`mi_compra_data.json`) |
| DB catálogo | Supabase (tablas: productos, producto_alias, producto_detalles) |
| IA Visión | Mistral Pixtral (pixtral-12b-2409) |
| IA Síntesis | Groq (llama-3.3-70b-versatile) |
| IA Alternativa | Google Gemini (secundario, via `GEMINI_API_KEY`) |

## Flujo de Datos (3 Capas)

```
Usuario → UI (React)
             │
             ├─ [CAPA 1: PRIMARIA] localStorage (mi_compra_cache_db)
             │   └─ Acceso instantáneo. Sin red requerida.
             │
             ├─ [CAPA 2: RESPALDO PERSONAL] Google Drive AppDataFolder
             │   └─ mi_compra_data.json (privado, oculto al usuario)
             │   └─ Imágenes de tickets referenciadas por fileId
             │
             └─ [CAPA 3: CATÁLOGO GLOBAL] Supabase
                 └─ Búsqueda de productos, aliases, historial de precios
```

## Flujo de Procesamiento de Ticket (IA)

```
Cliente (ScannerView)
  │  captura 1-3 fotos (base64)
  ▼
POST /api/analyze
  │
  ├─ PASO A: Mistral Pixtral (Vision)
  │   ├─ Cada imagen → su propia clave API (rotación)
  │   ├─ Procesa en paralelo (Promise.all)
  │   └─ Resultado: transcripciones literales de texto
  │
  └─ PASO B: Groq Llama 3.3 70B (Síntesis)
      ├─ Recibe todas las transcripciones
      ├─ Unifica partes sin duplicar solapamientos
      └─ Devuelve JSON: { comercio, fecha, total, productos[] }
           │
           ▼
      ReviewModal (usuario revisa y confirma)
           │
           ▼
      updateAndSync() → localStorage + Google Drive
```

## Patron de Estado Global

Todo el estado vive en `app/page.tsx` como `AppDB`:

```typescript
interface AppDB {
  gastos: Gasto[];       // Historial de compras
  lista: ListItem[];     // Lista de la compra actual
  customCategories: string[];
  presupuestoMensual?: number;
}
```

**Regla crítica:** Toda mutación de `db` DEBE pasar por `updateAndSync(newDb)`.
Nunca modificar `localStorage` directamente desde componentes hijos.

## Navegacion de Pantallas

```
AuthView (no logueado)
    │ login con Google
    ▼
DashboardView ←─────────────────────────────┐
    │                                        │
ShoppingListView ←── ScannerView ──── ReviewModal
    │                                        │
    └──────────── DetailView ────────────────┘
                  SettingsView
```
