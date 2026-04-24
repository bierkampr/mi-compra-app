# Pipeline de Inteligencia Artificial

> Fuente: `app/api/analyze/route.ts` (auditado 2026-04-24).
> Para la función cliente que llama a este endpoint, ver `lib/ai-client.ts`.
> Para el sistema de ruleta multi-plataforma, ver `lib/vision-roulette.ts`.

---

## Resumen

El pipeline procesa tickets de compra en 2 pasos secuenciales ejecutados en el servidor.
Elimina la necesidad de OCR local, que falla con cámaras de baja calidad y layouts complejos.

---

## Paso A — Vision (Ruleta Multi-Plataforma)

**Implementación:** `lib/vision-roulette.ts` (`transcribeImagesWithRoulette`)
**Arquitectura:** Ruleta de rotación automática entre múltiples proveedores de visión

### Plataformas Soportadas

| Plataforma | Modelo | API Key Prefix |
|---|---|---|
| GROQ_VISION | `meta-llama/llama-4-scout-17b-16e-instruct` | `GROQ_VISION_API_KEY*` |
| MISTRAL | `pixtral-large-latest` | `MISTRAL_API_KEY*` |
| NVIDIA | `nvidia/nemotron-nano-12b-v2-vl` | `NVIDIA_API_KEY*` |
| SCALEWAY | `pixtral-12b-2409` | `SCALEWAY_API_KEY*` |

### Que hace
Recibe 1-3 imágenes en Base64 y las transcribe literalmente.
Cada imagen se procesa en paralelo con `Promise.all`.
El sistema selecciona aleatoriamente un slot (plataforma + key) para cada imagen.

### Estrategia de Rotación
1. **Auto-descubrimiento:** Busca todas las API keys configuradas en Vercel:
   - `{PREFIX}_API_KEY` (base)
   - `{PREFIX}_API_KEY_1` ... `_9` (rotación)
2. **Selección aleatoria:** Cada imagen pick un slot aleatorio de los disponibles
3. **Blacklist automático:** Si un slot falla (429, 500+, timeout), se marca como blacklist y se vuelve a girar
4. **Reintentos:** Sigue girando hasta obtener resultado o agotar todos los slots

### Prompt por Modo
- **Ticket único:** "Analiza este ticket... devuelve JSON con comercio, fecha, total, productos"
- **Ticket en partes:** "Esta es la PARTE X de N de un ticket... extrae productos visibles en esta parte"

### Timeout y Rate Limit
- Timeout por imagen: 30 segundos (configurable)
- Rate limit (429): blacklist inmediato, no reintentos con espera (ruleta rápida)

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
