# Ruleta Multi-Plataforma para Visión IA

> Fuente: `lib/vision-roulette.ts`
> Auditado: 2026-04-24
> Usado en: `app/api/analyze/route.ts` (Paso A del pipeline de IA)

---

## Resumen

Sistema de rotación automática de API keys para modelos de visión (OCR).
Permite configurar múltiples proveedores (GROQ_VISION, MISTRAL, NVIDIA, SCALEWAY) con múltiples claves cada uno.
Si una clave falla (rate limit, timeout, error), se blacklistea y se re-gira la ruleta automáticamente.

**Scope:** Solo Paso A (transcripción de imagen → texto). Paso B (síntesis con Groq) no se toca.

---

## Plataformas Soportadas

| ID | Modelo | Endpoint | Formato |
|---|---|---|---|
| GROQ_VISION | `meta-llama/llama-4-scout-17b-16e-instruct` | `https://api.groq.com/openai/v1/chat/completions` | OpenAI |
| MISTRAL | `pixtral-large-latest` | `https://api.mistral.ai/v1/chat/completions` | OpenAI |
| NVIDIA | `nvidia/nemotron-nano-12b-v2-vl` | `https://integrate.api.nvidia.com/v1/chat/completions` | OpenAI |
| SCALEWAY | `pixtral-12b-2409` | `https://api.scaleway.ai/v1/chat/completions` | OpenAI |

---

## Tipos

### VisionSlot
Representa un slot individual (plataforma + key específica):
```typescript
interface VisionSlot {
  id: string;        // "MISTRAL:0", "GROQ_VISION:2" — clave de blacklist
  platform: string;  // "MISTRAL", "GROQ_VISION", etc.
  apiKey: string;
  endpoint: string;
  model: string;
  format: "openai" | "moondream";
}
```

### RouletteMeta
Metadatos del resultado de la ruleta:
```typescript
interface RouletteMeta {
  platformsUsed: string[];      // plataforma ganadora por imagen
  modelsUsed: string[];         // modelo ganador por imagen
  blacklistedSlots: string[];   // todos los slots que fallaron
  rotationCount: number;        // total de reintentos fallidos
  totalSlots: number;           // slots disponibles al inicio
}
```

### RouletteResult
Resultado completo:
```typescript
interface RouletteResult {
  transcriptions: string[];  // transcripciones de cada imagen
  meta: RouletteMeta;
}
```

---

## Funciones Principales

### discoverAllSlots(): VisionSlot[]
Auto-descubre todos los slots disponibles en `process.env`:
- Busca `{PREFIX}_API_KEY` (base)
- Busca `{PREFIX}_API_KEY_1` ... `_9` (rotación)
- Construye objetos `VisionSlot` para cada key encontrada

### transcribeImagesWithRoulette(images: string[]): Promise<RouletteResult>
Entry point principal.

**Flujo:**
1. Llama `discoverAllSlots()` → lista de slots
2. Si no hay slots → lanza error
3. Para cada imagen en paralelo (`Promise.all`):
   - Llama `transcribeImageViaRoulette()`
   - Usa blacklist compartido entre todas las imágenes
4. Devuelve transcripciones + meta

### transcribeImageViaRoulette(params): Promise<{ text, platform, model }>
Transcribe una sola imagen con ruleta.

**Flujo:**
1. Filtra slots disponibles (no blacklisteados)
2. Pick aleatorio
3. Construye request según formato (OpenAI o Moondream)
4. Fetch con timeout (30s por defecto)
5. Si 429 o 500+ → blacklist y re-gira
6. Si respuesta vacía → blacklist y re-gira
7. Si éxito → devuelve texto + plataforma + modelo

---

## Estrategia de Blacklist

- Blacklist es compartido entre todas las imágenes paralelas
- Si un slot falla, se marca como blacklist y nunca se vuelve a intentar en el mismo batch
- Blacklist persiste solo durante la llamada (no se guarda en disco)

---

## Prompt de Transcripción

El prompt es dinámico según el número de imágenes:
- **1 imagen:** "Analiza este ticket... devuelve JSON..."
- **Múltiples imágenes:** "Esta es la PARTE X de N de un ticket... extrae productos visibles en esta parte..."

El prompt solicita JSON con:
- `comercio`: nombre corto conocido
- `fecha`: DD/MM/AAAA
- `total`: número final
- `productos[]`: array con cantidad, nombre_ticket, nombre_base, subtotal

---

## Variables de Entorno

Para cada plataforma, configurar en Vercel:
- `{PREFIX}_API_KEY` (opcional, base)
- `{PREFIX}_API_KEY_1` ... `_9` (rotación opcional)

Ejemplos:
- `GROQ_VISION_API_KEY`, `GROQ_VISION_API_KEY_1`
- `MISTRAL_API_KEY`, `MISTRAL_API_KEY_1`
- `NVIDIA_API_KEY`
- `SCALEWAY_API_KEY`

---

## Integración

**Usado en:** `app/api/analyze/route.ts`
```typescript
import { transcribeImagesWithRoulette } from "@/lib/vision-roulette";

const { transcriptions, meta } = await transcribeImagesWithRoulette(images);
console.log(`Plataformas: ${meta.platformsUsed.join(", ")}`);
```

**Logging:** Los metadatos de `RouletteMeta` se envían a `lib/scan-logger.ts` para auditoría en Supabase.
