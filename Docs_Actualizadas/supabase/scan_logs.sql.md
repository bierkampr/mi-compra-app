# Tabla scan_logs — Supabase SQL

> Fuente: `supabase/scan_logs.sql`
> Auditado: 2026-04-24
> Ejecutar en: Supabase Dashboard → SQL Editor

---

## Resumen

Tabla para registrar métricas de escaneos de IA. Usada por `lib/scan-logger.ts` para auditoría y monitoreo del pipeline de visión.

---

## Ejecución

1. Ir a Supabase Dashboard del proyecto
2. Navegar a SQL Editor → New query
3. Copiar y pegar el contenido de `supabase/scan_logs.sql`
4. Click en Run

---

## Estructura de la Tabla

```sql
CREATE TABLE IF NOT EXISTS scan_logs (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz   DEFAULT now() NOT NULL,

  -- Qué plataforma respondió finalmente
  platform_used   text,
  model           text,

  -- Métricas de rotación
  rotation_count  int           DEFAULT 0,
  blacklisted_slots text[]      DEFAULT '{}',

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
```

---

## Índices

```sql
CREATE INDEX IF NOT EXISTS scan_logs_created_at_idx ON scan_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS scan_logs_platform_idx   ON scan_logs (platform_used);
CREATE INDEX IF NOT EXISTS scan_logs_success_idx    ON scan_logs (success);
```

**Propósito:** Optimizar consultas frecuentes por fecha, plataforma y éxito/fallo.

---

## RLS (Row Level Security)

```sql
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON scan_logs
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select" ON scan_logs
  FOR SELECT TO anon USING (true);
```

**Propósito:** Permitir inserts y lecturas desde la anon key (usada en el servidor).

---

## Vista de Estadísticas

```sql
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
```

**Propósito:** Vista rápida de métricas diarias para dashboard.
**security_invoker:** La vista respeta los permisos del usuario que la consulta.

---

## Campos Explicados

### platform_used
Plataforma que respondió finalmente (ej: "MISTRAL", "GROQ_VISION").

### model
Modelo concreto usado (ej: "pixtral-large-latest").

### rotation_count
Número de slots que fallaron antes de obtener éxito.

### blacklisted_slots
Array de IDs de slots que fallaron (ej: ["GROQ_VISION:0", "NVIDIA:1"]).

### image_count
Número de imágenes en el escaneo (1-3).

### comercio
Nombre del comercio detectado (ej: "MERCADONA").

### product_count
Número de productos extraídos.

### total_amount
Total del ticket.

### duration_ms
Duración total del pipeline en milisegundos.

### success
true si el escaneo fue exitoso, false si falló.

### error_message
Mensaje de error si falló, null si tuvo éxito.
