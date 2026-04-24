# Logger de Escaneos IA — lib/scan-logger.ts

> Fuente: `lib/scan-logger.ts`
> Auditado: 2026-04-24
> Usado en: `app/api/analyze/route.ts`

---

## Resumen

Sistema fire-and-forget para registrar métricas de escaneos de IA en Supabase.
Nunca bloquea el pipeline principal - si falla, se ignora silenciosamente.

---

## Tabla Supabase

**Tabla:** `scan_logs`
**SQL:** `supabase/scan_logs.sql`

Ejecutar en Supabase Dashboard → SQL Editor para crear la tabla.

---

## Tipos

### ScanLogEntry
```typescript
interface ScanLogEntry {
  platform_used: string;        // Plataforma que respondió finalmente
  model: string;                // Modelo concreto usado
  rotation_count: number;       // Nº de slots que fallaron antes del éxito
  blacklisted_slots: string[];  // IDs de slots fallidos (ej: ["GROQ_VISION:0"])
  image_count: number;          // Nº de imágenes en el escaneo
  comercio: string | null;      // Comercio detectado
  product_count: number | null; // Nº de productos
  total_amount: number | null;  // Total del ticket
  duration_ms: number;          // Duración total del pipeline (ms)
  success: boolean;             // true = OK, false = error
  error_message: string | null; // Mensaje si falló
}
```

---

## Función Principal

### logScan(entry: ScanLogEntry): Promise<void>

**Parámetros:**
- `entry: ScanLogEntry` - Métricas del escaneo

**Retorna:**
- `Promise<void>` - No devuelve nada (fire-and-forget)

**Flujo:**
1. Verifica que `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén configurados
2. Si no están configurados → log warning y retorna (silencioso)
3. Hace `POST` a `${SUPABASE_URL}/rest/v1/scan_logs`
4. Si el POST falla → log warning (no propaga error)
5. Si el POST tiene éxito → log de confirmación

---

## Configuración

**Variables de entorno (en `lib/config.ts`):**
- `NEXT_PUBLIC_SUPABASE_URL` - URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave anónima

---

## Uso

**En `app/api/analyze/route.ts`:**
```typescript
import { logScan } from "@/lib/scan-logger";

// Éxito
void logScan({
  platform_used: meta.platformsUsed[0] ?? "UNKNOWN",
  model: meta.modelsUsed[0] ?? "UNKNOWN",
  rotation_count: meta.rotationCount,
  blacklisted_slots: meta.blacklistedSlots,
  image_count: images.length,
  comercio: finalResponse.comercio,
  product_count: finalResponse.productos.length,
  total_amount: finalResponse.total,
  duration_ms: durationMs,
  success: true,
  error_message: null,
});

// Error
void logScan({
  platform_used: "UNKNOWN",
  model: "UNKNOWN",
  rotation_count: 0,
  blacklisted_slots: [],
  image_count: 0,
  comercio: null,
  product_count: null,
  total_amount: null,
  duration_ms: 0,
  success: false,
  error_message: error.message,
});
```

---

## Política de Errores

**Nunca propaga errores:**
- Si Supabase no está configurado → silencioso
- Si el POST falla → warning en consola
- Si hay error de red → warning en consola

Esto garantiza que el logger nunca rompa el pipeline principal.
