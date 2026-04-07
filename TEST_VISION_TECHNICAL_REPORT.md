# 📋 Informe Técnico — Mini App Test Vision Multi-Plataforma

## Resumen Ejecutivo

**Mini aplicación web** para probar **11 plataformas de IA de visión simultáneamente**, enviando la misma imagen de ticket a todas ellas en paralelo y comparando resultados en tiempo real. Genera un reporte TXT descargable con los resultados.

---

## Ubicación de Archivos

```
app/
├── api/
│   └── test-vision/
│       └── route.ts          ← Backend (11 plataformas hardcodeadas)
└── test-vision/
    └── page.tsx              ← Frontend (UI + orquestación)
```

**URL de acceso:** `http://localhost:3000/test-vision`

---

## Flujo de Uso

1. Usuario abre `/test-vision`
2. Carga imagen local (PNG/JPG)
3. Presiona "🚀 Enviar a todas"
4. Frontend dispara 11 requests POST a `/api/test-vision` en paralelo (`Promise.all`)
5. Cada request llega al backend con `{image: base64, platform: "MISTRAL" | "SCALEWAY" | ...}`
6. Backend:
   - Busca configuración en `PLATFORMS[platform]`
   - Construye request diferente según formato (`openai` | `moondream`)
   - Hace fetch con `AbortSignal.timeout(45000)`
   - Retorna `{status, result, duration, error, rawResponse}`
7. Frontend recibe y actualiza card de cada plataforma **en tiempo real** (no espera)
8. Cuando todas terminan, botón "💾 Descargar TXT" se habilita
9. Usuario descarga reporte consolidado

---

## Arquitectura del Backend

### `app/api/test-vision/route.ts` (420 líneas)

#### POST Handler
```typescript
POST /api/test-vision
Body: { image: "data:image/jpeg;base64,...", platform: "MISTRAL" }
Response: {
  platform: string,
  name: string,
  status: "success" | "error",
  result?: string,          // Transcripción
  error?: string,           // Mensaje error
  rawResponse?: string,     // Body de error
  duration: number,         // ms
  model: string,
  chars?: number            // Chars de transcripción
}
```

#### Configuración de Plataformas (Hardcoded en `PLATFORMS` object)

| ID | Nombre | Endpoint | Modelo | API Key | Formato |
|---|---|---|---|---|---|
| MISTRAL | Mistral AI | `api.mistral.ai/v1/chat/completions` | `pixtral-large-latest` | `QQQs0JcDDWfSmdP2efrpEncqPcVqM36K` | openai |
| SCALEWAY | Scaleway | `api.scaleway.ai/v1/chat/completions` | `pixtral-12b-2409` | `aacc9f40-5975-420c-8fd5-b64378bcc25d` | openai |
| GROQ_VISION | Groq LPU | `api.groq.com/openai/v1/chat/completions` | `meta-llama/llama-4-scout-17b-16e-instruct` | `gsk_TOC4FEO2...` | openai |
| CLOUDFLARE | Cloudflare AI | `api.cloudflare.com/.../ai/v1/chat/completions` | `@cf/zai-org/glm-4.7-flash` | `cfut_Hv5UeMJwghjGfRp8...` | openai |
| NVIDIA | NVIDIA NIM | `integrate.api.nvidia.com/v1/chat/completions` | `meta/llama-3.2-90b-vision-instruct` | `nvapi-gyd55sxlsgGO7RSyxN54...` | openai |
| TOGETHERAI | Together AI | `api.together.xyz/v1/chat/completions` | `LiquidAI/LFM2-24B-A2B` | `tgp_v1_sbtPHkXV3jMvuwUjryM0...` | openai |
| MOONDREAM | Moondream Cloud | `api.moondream.ai/v1/query` | `moondream-2b` | JWT token | **moondream** |
| OPENROUTER | OpenRouter | `openrouter.ai/api/v1/chat/completions` | `nvidia/nemotron-nano-12b-v2-vl:free` | `sk-or-v1-4e231bd1ea317f0e...` | openai |
| LLM7 | LLM7.io | `api.llm7.io/v1/chat/completions` | `GLM-4.6V-Flash` | `4rYre7g+zkFwNjgi25hGwgN6...` | openai |
| FIREWORKS | Fireworks AI | `api.fireworks.ai/inference/v1/chat/completions` | `accounts/fireworks/models/glm-4p7` | `fw_EYXDSsV3HZ3gzSyMqkTNoQ` | openai |
| GITHUB_MODELS | GitHub Models | `models.inference.ai.azure.com/chat/completions` | `gpt-4o` | `ghp_[REDACTED]` | openai |

#### Instrucción Compartida (Same como Paso A del pipeline principal)
```
"Eres un experto en lectura de tickets de compra. Transcribe LITERALMENTE todo el texto de este ticket: 
nombre del comercio, fecha, todos los productos con sus cantidades, precios unitarios, subtotales y el 
TOTAL final. Mantén cada producto en su propia línea con su precio al lado."
```

#### Lógica de Construcción de Request

**Si formato = "openai"** (10/11 plataformas):
```json
{
  "model": "...",
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": INSTRUCTION},
      {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
    ]
  }],
  "temperature": 0,
  "max_tokens": 2000
}
```

**Si formato = "moondream"** (solo Moondream):
```json
{
  "image": "base64_sin_prefijo",
  "question": INSTRUCTION,
  "stream": false
}
```

#### Manejo de Errores
- **HTTP no-2xx**: Parsea `json.error.message` | `json.error` | `json.message`
- **Respuesta no-JSON**: Retorna texto plano truncado (primeros 300 chars)
- **Timeout 45s**: `AbortSignal.timeout(45000)` → lanza AbortError
- **Red**: Catch → error message
- **Respuesta vacía**: Error "Respuesta vacía del modelo"

#### GET Handler
```typescript
GET /api/test-vision
Response: {
  platforms: [
    { id: "MISTRAL", name: "...", model: "...", format: "openai" },
    ...
  ]
}
```

---

## Arquitectura del Frontend

### `app/test-vision/page.tsx` (420 líneas, React "use client")

#### Estado Principal
```typescript
const [image, setImage] = useState<string | null>(null);           // base64
const [results, setResults] = useState<Record<PlatformId, PlatformResult>>(initResults());
const [logs, setLogs] = useState<string[]>([]);
const [sending, setSending] = useState(false);
const [done, setDone] = useState(false);
const [selected, setSelected] = useState<PlatformId | null>(null);  // Plataforma expandida
```

#### Flujo Interactivo

**1. Cargar Imagen**
- Input file → FileReader.readAsDataURL() → guarda en `image`
- Resetea results, logs, done

**2. Enviar a Todas (handleSendAll)**
- Actualiza status a "loading" en todas las 11 plataformas
- `Promise.allSettled()` — no rechaza si una falla
- Cada promise:
  ```typescript
  POST /api/test-vision {image, platform}
  → if success: updateResult(platform, {status: "success", result, duration, chars})
  → if error:   updateResult(platform, {status: "error", error, rawResponse, duration})
  ```
- Log en tiempo real para cada plataforma (timestamp + estado)
- Al final: log de resumen + duración total

**3. UI de Cards (Grid 320px columns)**
- Una card por plataforma
- Color indicator dot (color único por plataforma)
- Barra de progreso visual (0% idle, 65% loading, 100% done)
- Snippet de resultado (primeros 180 chars si success)
- Click en card → expand y mostrar resultado completo
- Status badges: ✓ éxito / ✗ error / ⏳ enviando

**4. Resultado Expandido**
- Pre con monospace
- Color verde (#bbf7d0) si éxito → transcripción completa
- Color rojo (#fecaca) si error → mensaje + rawResponse

**5. Log de Ejecución**
- 11 líneas (una por plataforma)
- Colorizado: verde ✓, rojo ✗, azul separadores, gris normal
- Auto-scroll al bottom
- Ejemplo:
  ```
  [12:34:56] ══════ Iniciando prueba — 11 plataformas ══════
  [12:34:56] Imagen: ticket.jpg (120.5 KB)
  [12:34:56] → [Mistral AI] Enviando...
  [12:34:59] ✓ [Mistral AI] OK — 2847ms — 1280 chars
  [12:34:56] → [Scaleway] Enviando...
  [12:35:01] ✓ [Scaleway] OK — 4521ms — 1350 chars
  [12:35:03] ✗ [Moondream Cloud] ERROR — HTTP 429...
  [12:35:06] ══════ Prueba completada en 10.2s ══════
  ```

**6. Descargar TXT (handleDownload)**
- Genera reporte en memoria
- Formato:
  ```
  ════════════════════════════════════════════════════════════
    REPORTE DE PRUEBA — VISIÓN IA MULTI-PLATAFORMA
    Fecha: 6 de abril de 2026, 15:32:45
    Imagen: ticket.jpg (120.5 KB)
    Resultado: 10 éxitos / 1 error / 11 total
  ════════════════════════════════════════════════════════════

  ┌── Mistral AI — Pixtral Large
  │  Estado  : ✓ ÉXITO
  │  Duración: 2847ms
  │  Chars   : 1280
  │
  │  ── TRANSCRIPCIÓN ──
  │  MERCADONA
  │  Fecha: 06/04/2026
  │  ...
  └────────────────────────────────────────────────────────────

  [repeat para todas las plataformas]

  ════════════════════════════════════════════════════════════
    LOG DE EJECUCIÓN
  ════════════════════════════════════════════════════════════
  [12:34:56] ══════ Iniciando prueba...
  ...
  ```
- Descarga como `vision-test-2026-04-06T15-32-45.txt`

---

## Detalles Técnicos Importantes

### Timeout
- **45 segundos por request** (AbortSignal.timeout(45000))
- Plataformas lentas (NVIDIA, Cloudflare) pueden tomar 15-20s
- Si timeout: lleva a error con mensaje "TIMEOUT después de Xms"

### Request Paralelo
- `Promise.allSettled()` — no deja que un error derrumbe los demás
- Los 11 requests salen simultáneamente (no secuencial)
- Frontend actualiza cards conforme llegan respuestas

### Formato de Imagen
- Input: cualquier formato (PNG, JPG, GIF, WEBP, etc.)
- Converti a Base64 via FileReader
- Algunas plataformas (Moondream) requieren base64 puro, otras aceptan data:image/...
- Backend maneja ambos casos automáticamente

### Datos Sensibles
- ⚠️ **API keys hardcodeadas en `/api/test-vision/route.ts`**
- Solo para desarrollo local
- **NUNCA subir a Git o push a Vercel con keys reales**
- En producción, estas deberían venir de env vars o tokens de Vercel

### Límites Conocidos
- **Imagen máxima**: generalmente 20MB (depende plataforma)
- **Timeout**: 45s (algunas plataformas pueden ser más lentas)
- **Plataformas con rate limit**: 
  - OpenRouter: muy limitado si no hay saldo
  - Cloudflare: 10K neuronas/día (aprox 5-8 imágenes)
  - Moondream: RPM=5 (max 5 requests/minuto)

---

## Para Continuar (Next Steps)

1. **Agregar más plataformas** → Editar `PLATFORMS` en `route.ts`
2. **Cambiar API keys** → Actualizar valores en `PLATFORMS` object
3. **Mejorar UI** → Cambiar estilos inline en `page.tsx`
4. **Añadir síntesis JSON** → Copiar lógica de `app/api/analyze/route.ts` (paso B con Groq)
5. **Generar reporte comparativo** → Parsear transcripciones y generar tabla de similitudes
6. **Guardar resultados en BD** → Agregar Supabase para histórico

---

## Cómo Usar

```bash
npm run dev
# Abre http://localhost:3000/test-vision
# Carga una imagen
# Presiona "🚀 Enviar a todas"
# Espera resultados
# Descarga TXT con "💾 Descargar TXT"
```

---

**Creado:** 2026-04-07  
**Status:** Funcional, listo para testing  
**Warning:** Contiene API keys hardcodeadas — Dev only, no Git push
