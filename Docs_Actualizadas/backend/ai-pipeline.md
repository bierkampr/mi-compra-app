# Pipeline de Inteligencia Artificial

> Fuente: `app/api/analyze/route.ts` (auditado 2026-04-02).
> Para la función cliente que llama a este endpoint, ver `lib/ai-client.ts`.

---

## Resumen

El pipeline procesa tickets de compra en 2 pasos secuenciales ejecutados en el servidor.
Elimina la necesidad de OCR local, que falla con cámaras de baja calidad y layouts complejos.

---

## Paso A — Vision (Mistral Pixtral)

**Modelo:** `pixtral-12b-2409`
**API:** `https://api.mistral.ai/v1/chat/completions`

### Que hace
Recibe una imagen en Base64 y la transcribe literalmente.
Si el ticket es largo (hasta 3 partes), cada imagen se procesa en paralelo con `Promise.all`.

### Estrategia de Rotacion de Claves
- Imagen 0 → `MISTRAL_API_KEY` (o `MISTRAL_API_KEY_1`)
- Imagen 1 → `MISTRAL_API_KEY_1` (o siguiente disponible)
- Imagen 2 → `MISTRAL_API_KEY_2` (o siguiente disponible)
- Si una clave falla, automáticamente intenta con las demás.

### Rate Limit (429)
- Reintento automático: espera 5s en el primer intento, 12s en el segundo.
- Máximo 3 reintentos por imagen.

### Prompt por Modo
- **Ticket único:** "Transcribe LITERALMENTE todo el texto, nombre del comercio, fecha, productos, totales."
- **Ticket en partes:** "Esta es la PARTE X de N. Transcribe LITERALMENTE..." (instrucción de continuidad).

---

## Paso B — Sintesis JSON (Groq)

**Modelo:** `llama-3.3-70b-versatile`
**API:** `https://api.groq.com/openai/v1/chat/completions`
**Response format:** `{ type: "json_object" }` (forzado por Groq)

### Que hace
Recibe todas las transcripciones de Mistral (ya sea 1 o 3 partes) y las unifica en un único JSON estructurado.

### Reglas criticas del prompt de sistema
- Usar `comercio` como nombre comercial conocido (ej: "MERCADONA"), no el nombre legal.
- `fecha`: formato "DD/MM/AAAA". Si no aparece, usar fecha de hoy.
- `total`: buscar el TOTAL FINAL, no sumar parciales de partes.
- `productos`: sin duplicar items que aparezcan en solapamientos entre partes.
- Responder SOLO con JSON. Sin texto adicional.

### Fallback de Claves
Si la clave primaria de Groq falla, itera por todas las claves `GROQ_API_KEY_1` a `_5`.
Si todas fallan, lanza error 500.

---

## Normalizacion Defensiva de la Respuesta

Antes de devolver al cliente, el endpoint normaliza:
- `comercio`: si es objeto (bug de Groq), extrae el primer string. Siempre `.toUpperCase().trim()`.
- `total`: fuerza conversión a número con `Number()`, fallback a 0.
- `productos[].cantidad`: fallback a 1.
- `productos[].nombre_ticket` y `nombre_base`: fallback a "PRODUCTO".
- `productos[].subtotal`: fallback a 0.

---

## Cliente (lib/ai-client.ts)

La función `analyzeReceipt(images, mode, customPrompt)` en `lib/ai-client.ts`:
1. Si `mode === 'manual'` → devuelve estructura vacía sin llamar a la API.
2. Valida que `images` sea un array no vacío.
3. Hace `POST /api/analyze` con el payload.
4. Aplica normalización de seguridad adicional en el cliente.
5. Lanza error si el servidor responde con error.

**Importado en:** `app/page.tsx` via `import { analyzeReceipt } from '@/lib/ai-client'`.
