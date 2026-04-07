# 👁️ Modelos de IA para Visión y Análisis Visual — Guía de Selección

> **Uso:** Este archivo está diseñado para que el agente de IA sepa exactamente qué modelo usar para tareas de visión por computadora — análisis de imágenes, gráficos de mercado, lectura de capturas de pantalla, OCR visual o comprensión de contenido multimedia.
>
> **Método de selección:** Límites medidos en pruebas reales de estrés (Neural Limit Sweeper, Abril 2026).

---

## ¿Cuándo usar cada modelo?

- **Modelos VL nativos** (`vision-instruct`, `VL`, `pixtral`, `moondream`): Para enviar imágenes reales como input (chart trading, capturas de app, escaneo de productos).
- **Modelos de texto con visión extendida** (`gpt-4o`, `glm-4.7-flash`): Para análisis visual con alto contexto textual combinado.
- **RPM alto (≥5):** Para pipelines que procesan múltiples imágenes en paralelo.

---

## Tabla de Límites — Modelos de Visión

| Plataforma | Modelo | ID para API | TPM Medido | RPM Máx | Resp. Estimada | Ctx. Total | Visión Nativa | Notas |
|---|---|---|---|---|---|---|---|---|
| **Together AI** | LFM2-24B Multimodal | `LiquidAI/LFM2-24B-A2B` | ~62,000 | 5 | 3–8s | 32K | ✅ | 🏆 Mejor TPM+RPM visión. Arquitectura nativa multimodal. |
| **Scaleway** | Pixtral 12B | `pixtral-12b-2409` | ~58,500 | 0* | 5–12s | 128K | ✅ | Modelo visión de Mistral AI. Excelente para documentos y gráficos. |
| **Cloudflare** | GLM-4.7 Flash VL | `@cf/zai-org/glm-4.7-flash` | ~80,000 | 5 | 2–6s | 128K | ✅ | 🏆 Mayor TPM medido. Límite diario de neuronas (renovación 24h). |
| **Mistral AI** | Pixtral Large | `pixtral-large-latest` | ~30,900 | 233 | 3–8s | 128K | ✅ | Visión nativa de Mistral. Medido empíricamente, límites no declarados. |
| **Groq LPU** | Llama 4 Scout 17B | `meta-llama/llama-4-scout-17b-16e-instruct` | ~30,000 | 1000 | **<2s** ⚡ | 16K | ✅ | Modelo ultra-rápido en LPU. TPM y RPM declarados en cabeceras. |
| **NVIDIA NIM** | Llama 3.2 90B Vision | `meta/llama-3.2-90b-vision-instruct` | ~32,500 | 5 | 5–15s | 128K | ✅ | Alta capacidad. Excelente para imágenes complejas y gráficos de trading. |
| **Moondream Cloud** | Moondream 3 Preview | `moondream-2b` | ~24,500 | 5 | 1–3s | 2K | ✅ | Especialista en visión. Ultra-rápido. Ideal para OCR y detección de objetos. |
| **OpenRouter** | Nemotron 12B VL (Free) | `nvidia/nemotron-nano-12b-v2-vl:free` | ~8,500 | 0* | 5–15s | 32K | ✅ | Free tier. Visión nativa NVIDIA. Rate limit agresivo en free. |
| **LLM7.io** | GLM-4.6V Flash | `GLM-4.6V-Flash` | ~9,500 | 0* | 2–6s | 8K | ✅ | Vision Language nativo ZhiPu. Compacto y rápido. |
| **Fireworks AI** | GLM-4.7 VL | `accounts/fireworks/models/glm-4p7` | ~0* | 1 | — | 128K | ✅ | RPM medido pero TPM no escalado. Incluir en rotación secundaria. |
| **SambaNova** | DeepSeek-V3.2 | `DeepSeek-V3.2` | ~8,000 | 1 | 5–15s | 128K | ⚠️ Texto | Sin visión nativa. Útil para análisis de texto extraído de imágenes. |
| **GitHub Models** | GPT-4o | `gpt-4o` | ~4,500 | 0* | 5–15s | 128K | ✅ | Visión OpenAI. Free tier muy limitado en RPM. |

> \* RPM=0 indica que el sweeper fue detenido antes de completar la fase de ráfagas, o que el tier libre no permite ráfagas simultáneas.

---

## 🔄 Sistema de Cuotas y Reset por Plataforma

Esta sección documenta el **tipo de límite** de cada plataforma en el plan gratuito: cómo funciona, cuándo se renueva y si el crédito es consumible o se recarga automáticamente.

---

### Together AI
- **Tipo de sistema:** Crédito de pago consumible (sin tier gratuito permanente)
- **Free tier:** ❌ No existe tier gratuito perpetuo. Requiere compra mínima de **$5 USD** para activar la API key.
- **Créditos:** No caducan una vez comprados (no tienen fecha de expiración).
- **Rate limits:** Dinámicos — basados en tu historial de uso de la última hora (`dynamic_rate ≈ 2 × past_hour_successful_request_rate`). Rolante por segundo (no hay "reset" diario de RPM/TPM).
- **Nota importante (Enero 2026):** Sistema de "Dynamic Rate Limits" implementado desde el 26 de enero de 2026 para todos los nuevos usuarios.
- **Estrategia:** Sin tarjeta = sin acceso. Con $5+ el acceso es pay-as-you-go sin expiración de saldo.

---

### Scaleway (Generative APIs)
- **Tipo de sistema:** Cuota por organización, renovación por política de uso justo
- **Free tier:** ✅ Existe un Free Tier si la cuenta no tiene método de pago registrado (límites más estrictos automáticamente).
- **Límites Free Tier:** Sin método de pago = límites reducidos aplicados automáticamente a nivel de organización (compartidos entre todos los proyectos).
- **Reset:** Las cuotas son por organización, no tienen un reset diario fijo documentado públicamente — se monitorizan y ajustan dinámicamente según la capacidad disponible.
- **Cómo aumentar límites:** (1) Verificar identidad → aumento automático de cuota. (2) Añadir método de pago → acceso al tier estándar. (3) Contactar ventas para volumen dedicado.
- **Nota:** Solicitudes via Batches API no tienen rate limit y tienen 50% de descuento.

---

### Cloudflare Workers AI
- **Tipo de sistema:** ✅ Reset diario fijo en UTC — sistema de **Neuronas**
- **Free tier:** **10,000 Neuronas/día** gratuitas (tanto en plan Free como en plan Paid Workers)
- **Reset:** Todos los límites se reinician diariamente a las **00:00 UTC** sin excepción.
- **¿Qué son las Neuronas?** Unidad de cómputo GPU propia de Cloudflare. Modelos de visión como GLM-4.7 consumen más neuronas por request que modelos de texto pequeños.
- **Al agotar:** Las requests fallan con error hasta el reset de las 00:00 UTC.
- **Precio si pagas:** $0.011 por cada 1,000 neuronas adicionales (plan Workers Paid).
- **Contexto práctico para visión:** Las imágenes consumen considerablemente más neuronas que el texto puro. El cupo de 10K neuronas/día es muy limitado para procesamiento de imágenes a escala.

---

### NVIDIA NIM
- **Tipo de sistema:** ✅ Crédito gratuito inicial, luego pay-as-you-go
- **Free tier:** Acceso con crédito de evaluación gratuito al registrarse (cantidad variable según promoción activa).
- **Rate limits:** 5 RPM en el tier gratuito. Sin documentación pública de TPD o límite diario de tokens fijo.
- **Reset:** Los rate limits de RPM son ventanas rolantes por minuto. El crédito inicial es consumible y no se renueva.
- **Nota:** Para el modelo Llama 3.2 90B Vision, el tier gratuito es adecuado para pruebas pero no para producción continua.

---

### Moondream Cloud
- **Tipo de sistema:** ⚠️ Documentación limitada — tier de preview con acceso controlado
- **Free tier:** Acceso mediante JWT token en plan Preview. Límites no completamente documentados públicamente.
- **Rate limits observados:** ~5 RPM, respuestas en 1–3s. Contexto limitado a 2K tokens (modelo especializado en visión, no conversación larga).
- **Reset:** No documentado oficialmente. Comportamiento de ventana por minuto (RPM rolante).
- **Nota importante:** Usa su propio endpoint `/v1/query` — **no es compatible con el estándar OpenAI vision**. Requiere su SDK propio o llamadas directas a `api.moondream.ai`.
- **Uso recomendado:** OCR rápido y detección de objetos en imágenes simples. No apto para contexto visual complejo.

---

### OpenRouter
- **Tipo de sistema:** ✅ Cuota diaria de requests en modelos `:free`, con reset diario
- **Free tier (sin saldo):** 20 RPM | **50 requests/día** en modelos `:free`
- **Free tier (con ≥$10 de saldo):** 20 RPM | **1,000 requests/día** en modelos `:free`
- **Reset:** Las cuotas diarias se reinician cada 24 horas (UTC midnight).
- **Nota importante:** Los requests fallidos **sí cuentan** para el cupo diario. Los modelos `:free` de visión (como Nemotron VL) pueden tener disponibilidad variable.
- **BYOK (Bring Your Own Key):** 1M requests/mes gratis si usas tu propia API key. Reset mensual.
- **Sin saldo en cuenta:** Pueden aparecer errores 402 incluso en modelos gratuitos.

---

### LLM7.io
- **Tipo de sistema:** ⚠️ Sin documentación oficial pública de límites o sistema de reset
- **Free tier:** Aparentemente gratuito sin tarjeta, con rate limiting implícito.
- **Reset:** No documentado oficialmente. Comportamiento observado: ventanas por minuto (RPM), sin confirmación de reset diario o mensual.
- **Nota:** Plataforma sin docs formales — tratar como recurso no garantizado. Los límites son inferidos únicamente por pruebas empíricas (Neural Limit Sweeper).

---

### Fireworks AI
- **Tipo de sistema:** Pay-as-you-go con crédito inicial consumible. Sin free tier perpetuo.
- **Free tier:** $1 USD de crédito gratuito al registrarse. Sin tarjeta requerida para comenzar.
- **Sin método de pago:** Rate limit de **10 RPM**. Sin límite de tokens por día, solo se limita por el crédito disponible.
- **Con método de pago (Tier 1+):** Hasta **6,000 RPM**. Rate limits dinámicos que escalan con el uso sostenido.
- **Reset de budget mensual:** Los límites de gasto mensuales se reinician al **inicio de cada mes**.
- **Al agotar crédito:** Las requests se pausan automáticamente.
- **Nota para visión:** El modelo GLM-4.7 VL mostró TPM no escalado en pruebas — usarlo como fallback secundario, no primario.

---

### SambaNova
- **Tipo de sistema:** ✅ Free Tier permanente + $5 de crédito de bienvenida (expira en ~3 meses)
- **Free tier permanente:** ✅ Sí existe después de que se agote el crédito inicial.
- **Crédito inicial:** $5 USD gratuito al registrarse → expira aproximadamente en **3 meses**.
- **Free tier límites (sin pago):** TPD = **200,000 tokens/día** | RPM = 1 para modelos grandes
- **Developer tier (con tarjeta):** TPD = **20M tokens/día** | RPD = 12,000 | RPM = 60 para modelos principales
- **Reset de cuotas:** Las cuotas diarias (RPD, TPD) se reinician cada 24 horas (epoch time en response headers).
- **Nota:** DeepSeek-V3.2 en SambaNova **no tiene visión nativa** — útil solo para análisis de texto extraído de imágenes (OCR previo requerido).

---

### GitHub Models
- **Tipo de sistema:** ✅ Cuota diaria y por minuto, con reset diario. Free tier permanente.
- **Modelo de tiers:** `Low` / `High` / `Embedding` — cada modelo tiene su propio tier asignado.
- **GPT-4o (visión, tier "High"):**
  - RPM: **10** | RPD: **50** | Tokens/request: 8K input / 4K output | Concurrencia: 2
- **Reset:** Los límites se reinician **diariamente** (por día calendario).
- **Nota importante:** Cada modelo tiene su propio pool independiente de RPD — se pueden combinar múltiples modelos.
- **Advertencia:** Bug documentado desde Oct 2025 en el que el reset puede empujar la fecha un mes en lugar de un día. Parcialmente corregido pero aún reportado en marzo 2026.
- **Paid usage:** Disponible desde junio 2025 (pay-as-you-go por token, sin límites de rate).

### Mistral AI
- **Tipo de sistema:** Tier "Experiment" (Gratuito) con límites estrictos.
- **Free tier:** Requiere verificación por SMS. Las peticiones a través de este tier **pueden ser utilizadas para entrenamiento de modelos** (no usar para datos altamente confidenciales).
- **Rate limits:** No devueltos en las cabeceras, pero testeados empíricamente demostrando ráfagas amplias para TPM (30K+) pero fallando en volumen continuado alto.
- **Reset:** Ventanas rolantes cortas para RPM/TPM. Las cuotas mensuales o límites por largo plazo suelen recargarse mensualmente o limitar la cuenta a un cap de uso total. No recomendado para producción continuada.

---

### Groq LPU
- **Tipo de sistema:** Tier gratuito generoso para desarrolladores, con hardware LPU.
- **Free tier:** El Tier Free tiene rate limits aplicados a nivel de organización y **por modelo**. 
- **Límites documentados (Abril 2026):** ~30.0K TPM declarados en cabeceras para Llama 4 Scout. RPM declarados de hasta 1000/minuto. Falla bajo presión en descargas tipo "burst" si se golpea el límite en base al tamaño de la imagen/requerimiento (Hit 429).
- **Reset:** Ventanas rolantes y resets por minuto muy rápidos. Las requests diarias (RPD) se reinician diariamente.
- **Visión Nativa:** Los modelos de Llama en Groq admiten visión con muy baja latencia gracias a su infraestructura LPU especializada.

---

## Ranking Recomendado para App de Visión

```
1. Moondream Cloud / Moondream 3    → OCR rápido, detección objetos, imágenes simples (<3s)
2. Groq LPU / Llama 4 Scout         → Muy alto RPM (1000) e interfaces visuales de extrema latencia baja.
3. Together AI / LFM2-24B           → Imágenes complejas con alto RPM paralelo — requiere $5 mínimo
4. Cloudflare / GLM-4.7 Flash VL    → Mayor TPM disponible (80K), reset diario 00:00 UTC
5. Mistral AI / Pixtral Large       → Documentos, PDFs, visuales con texto (128K contexto, buen fallback)
```

---

## Formato de Request para Visión (Base64)

Para enviar imágenes, todos estos modelos usan el estándar OpenAI vision:

```json
{
  "model": "meta/llama-3.2-90b-vision-instruct",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,{BASE64_STRING}"
          }
        },
        {
          "type": "text",
          "text": "Analiza este gráfico de precios y describe la tendencia."
        }
      ]
    }
  ],
  "max_tokens": 1024
}
```

> **Excepción:** Moondream Cloud usa su propio SDK/endpoint `/v1/query` — consultar docs en `api.moondream.ai`.

---

## Notas de Integración

| Plataforma | Endpoint Base | Auth Header | Formato |
|---|---|---|---|
| Together AI | `https://api.together.xyz/v1` | `Bearer {key}` | OpenAI-compatible |
| Scaleway | `https://api.scaleway.ai/v1` | `Bearer {secret_key}` | OpenAI-compatible |
| Cloudflare | `https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1` | `Bearer {key}` | OpenAI-compatible |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | `Bearer {key}` | OpenAI-compatible |
| Mistral AI | `https://api.mistral.ai/v1` | `Bearer {key}` | OpenAI-compatible |
| Groq | `https://api.groq.com/openai/v1` | `Bearer {key}` | OpenAI-compatible |
| Moondream | `https://api.moondream.ai/v1` | `Bearer {jwt_token}` | SDK propio |
| OpenRouter | `https://openrouter.ai/api/v1` | `Bearer {key}` | OpenAI-compatible |
| LLM7.io | `https://api.llm7.io/v1` | `Bearer {key}` | OpenAI-compatible |
| Fireworks AI | `https://api.fireworks.ai/inference/v1` | `Bearer {key}` | OpenAI-compatible |
| SambaNova | `https://api.sambanova.ai/v1` | `Bearer {key}` | OpenAI-compatible |
| GitHub Models | `https://models.inference.ai.azure.com` | `Bearer {key}` | OpenAI-compatible |

---

## ⚠️ Errores de Conexión Conocidos y Cómo Evitarlos

> Esta sección documenta **fallos reales** encontrados durante el desarrollo del Neural Limit Sweeper. El objetivo es que cualquier agente IA pueda conectarse a la primera sin repetir estos errores.

---

### 🔴 Error Universal: CORS (Failed to fetch)
**Síntoma:** Todos los `fetch()` desde el navegador fallan con `TypeError: Failed to fetch`.

**Causa:** Los navegadores bloquean peticiones cross-origin desde `file://` o `localhost` hacia APIs externas.

**Solución obligatoria:** Usar el proxy CORS local (`cors-proxy.js`) corriendo en `http://localhost:3000`.
```bash
node cors-proxy.js  # Debe estar corriendo antes de abrir cualquier HTML
```
**En cada fetch:**
```javascript
fetch('http://localhost:3000', {
    method: 'POST',
    headers: {
        'x-proxy-target': 'https://api.destino.com/v1/chat/completions',  // URL real
        'Authorization': 'Bearer {key}',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
});
```
> **Crítico:** La cabecera debe llamarse exactamente `x-proxy-target`. El proxy CORS no reconoce otras variantes como `x-target-url`.

---

### 🔴 Cloudflare: Endpoint de catálogo y formato diferente
**Síntoma:** 0 modelos encontrados. El endpoint `/v1/models` devuelve 404.

**Causa:** Cloudflare no sigue la convención OpenAI para listar modelos. Usa un endpoint propio y estructura diferente.

**Endpoint correcto:**
```
GET https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/models/search
```
**Parse correcto** (`result`, no `data`):
```javascript
const models = (data.result || []).map(m => m.name).filter(Boolean);
```
**Límite de neuronas:**  Solo **10,000 neuronas/día** gratuitas. Los modelos de visión como GLM-4.7 consumen muchas más neuronas por request que modelos de texto. Al agotarse devuelven `RATE_LIMIT_QUOTA_INICIAL` hasta las 00:00 UTC.

---

### 🔴 OpenRouter: CORS preflight bloqueado por cabeceras extra
**Síntoma:** `Failed to fetch` al intentar enviar `HTTP-Referer` o `X-Title` en las cabeceras.

**Causa:** El proxy tiene `Access-Control-Allow-Headers` restringido. Las cabeceras no estándar (como `HTTP-Referer`, `X-Title`) hacen que el browser bloquee el preflight CORS **antes de que la petición llegue al proxy**.

**Solución:**
- ❌ NO enviar `HTTP-Referer` ni `X-Title` desde el navegador.
- ✅ Solo `Authorization: Bearer {key}` es necesario para modelos `:free`.
- ✅ Filtrar solo modelos con sufijo `:free` del catálogo.

---

### 🔴 GitHub Models: GET /models devuelve HTTP 400
**Síntoma:** El catálogo de modelos falla con 400 (no es error de autenticación).

**Causa:** Azure AI no expone el endpoint `/models` durante la beta de GitHub Models. El 400 es intencional — el catálogo no está disponible vía API.

**Solución:** Lista hardcodeada de los modelos de visión confirmados:
```javascript
const githubVisionModels = [
    'gpt-4o',              // Visión OpenAI
    'gpt-4o-mini',         // Visión OpenAI  
    'Meta-Llama-3.1-405B-Instruct',
    'Meta-Llama-3.1-8B-Instruct'
];
// Endpoint de inferencia:
// POST https://models.inference.ai.azure.com/chat/completions (sin /v1/)
```

---

### 🔴 Moondream Cloud: No compatible con estilo OpenAI Vision
**Síntoma:** Las peticiones con `content: [{type:'image_url',...}]` fallan.

**Causa:** Moondream Cloud usa su propio sistema de API, no el estándar OpenAI de visión por bloques de contenido.

**Solución:** Usar su endpoint propio:
```javascript
// Endpoint correcto de Moondream:
POST https://api.moondream.ai/v1/query
// Body:
{ image: '{base64}', question: 'Describe this image', stream: false }
// NO usar /chat/completions
```
**Para ping binario:** Moondream acepta `/v1/chat/completions` con formato estándar **solo para texto** (sin imagen en el ping). Para inferencia visual real cambiar al endpoint propio.

---

### 🔴 LLM7.io: HTTP 405 Method Not Allowed con el endpoint token
**Síntoma:** El endpoint `token.llm7.io/v1/chat/completions` devuelve 405 para modelos de visión.

**Causa:** El subdominio `token.llm7.io` tiene un routing diferente que no acepta POST a `/chat/completions` para GLM-4.6V-Flash y otros modelos VL.

**Solución:**
```
✅ https://api.llm7.io/v1/chat/completions     ← Correcto
❌ https://token.llm7.io/v1/chat/completions   ← 405 para modelos VL
```

---

### 🔴 El Proxy se apaga silenciosamente tras horas de uso
**Síntoma:** Funciona bien por 2–3 horas, luego todos los fetch fallan con `Failed to fetch`.

**Solución:** Verificar el estado del proxy antes de iniciar cualquier operación:
```javascript
const r = await fetch('http://localhost:3000');
const text = await r.text();
// Debe decir: "CORS Proxy Server is Active."
// Si falla: node cors-proxy.js en nueva terminal
```

---

### 🟡 SambaNova + Fireworks: Parámetros de thinking en modelos reasoning
**Síntoma:** Algunos modelos R1/QwQ tardan minutos en responder aunque se pida solo 1 token.

**Causa:** Los modelos de razonamiento como DeepSeek-R1 generan cadena de pensamiento interna antes de dar la primera respuesta. Con `max_tokens: 1` el output final es 1 token, pero el razonamiento interno puede generar miles.

**Solución para Fireworks/Together (sí soportan el parámetro):**
```javascript
body.thinking = { type: "disabled" };  // Desactiva chain-of-thought
```
**Solución para NVIDIA (NO soporta el parámetro — usar timeout largo):**
```javascript
// Solo aumentar el timeout a 120s, request limpio sin parámetros extra:
const controller = new AbortController();
setTimeout(() => controller.abort(), 120000); // 120s
```

---

*Generado: Abril 2026 — Neural Limit Sweeper v2 + Research de documentación oficial*
