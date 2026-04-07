// ─── LOGGER DE ESCANEOS IA → SUPABASE ─────────────────────────────────────────
// Fire-and-forget: nunca bloquea el pipeline principal.
// Tabla: scan_logs (ver supabase/scan_logs.sql para crearla)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export interface ScanLogEntry {
  platform_used: string;        // plataforma que respondió finalmente
  model: string;                // modelo concreto usado
  rotation_count: number;       // nº de slots que fallaron antes del éxito
  blacklisted_slots: string[];  // ids de slots fallidos (ej: ["GROQ_VISION:0"])
  image_count: number;          // nº de imágenes en el escaneo
  comercio: string | null;      // comercio detectado
  product_count: number | null; // nº de productos
  total_amount: number | null;  // total del ticket
  duration_ms: number;          // duración total del pipeline (ms)
  success: boolean;             // true = OK, false = error
  error_message: string | null; // mensaje si falló
}

export async function logScan(entry: ScanLogEntry): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[ScanLogger] Supabase no configurado, log omitido.");
    return;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/scan_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(entry),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[ScanLogger] Error HTTP ${res.status}: ${body.slice(0, 120)}`);
    } else {
      console.log(
        `[ScanLogger] ✓ Log guardado — ${entry.platform_used} | ` +
        `rotaciones: ${entry.rotation_count} | ` +
        `éxito: ${entry.success} | ${entry.duration_ms}ms`
      );
    }
  } catch (err: any) {
    // Nunca propagamos errores del logger — no debe romper la app
    console.warn(`[ScanLogger] Fallo silencioso: ${err.message}`);
  }
}
