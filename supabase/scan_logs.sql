-- ─── TABLA DE LOGS DE ESCANEO IA ─────────────────────────────────────────────
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- URL del proyecto: https://eserohfqmzidsoafdnss.supabase.co

CREATE TABLE IF NOT EXISTS scan_logs (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz   DEFAULT now() NOT NULL,

  -- Qué plataforma respondió finalmente
  platform_used   text,
  model           text,

  -- Métricas de rotación
  rotation_count  int           DEFAULT 0,     -- veces que rotó antes de éxito
  blacklisted_slots text[]      DEFAULT '{}',  -- slots que fallaron (ej: ["GROQ_VISION:0", "NVIDIA:1"])

  -- Contexto del ticket
  image_count     int           DEFAULT 1,
  comercio        text,
  product_count   int,
  total_amount    numeric(10,2),

  -- Resultado
  duration_ms     int,
  success         boolean       DEFAULT true,
  error_message   text
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS scan_logs_created_at_idx ON scan_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS scan_logs_platform_idx   ON scan_logs (platform_used);
CREATE INDEX IF NOT EXISTS scan_logs_success_idx    ON scan_logs (success);

-- RLS: permitir inserts y lectura desde la anon key (usada en el servidor)
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON scan_logs
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select" ON scan_logs
  FOR SELECT TO anon USING (true);

-- ─── VISTA RÁPIDA DE ESTADO (opcional, útil en el dashboard) ─────────────────
-- SECURITY INVOKER: la vista respeta los permisos del usuario que la consulta (no del creador)
CREATE OR REPLACE VIEW scan_stats WITH (security_invoker = true) AS
SELECT
  date_trunc('day', created_at) AS dia,
  COUNT(*)                       AS total_scans,
  COUNT(*) FILTER (WHERE success)        AS exitosos,
  COUNT(*) FILTER (WHERE NOT success)    AS fallidos,
  ROUND(AVG(duration_ms))                AS duracion_media_ms,
  ROUND(AVG(rotation_count), 2)          AS rotaciones_media,
  MODE() WITHIN GROUP (ORDER BY platform_used) AS plataforma_mas_usada
FROM scan_logs
GROUP BY 1
ORDER BY 1 DESC;
