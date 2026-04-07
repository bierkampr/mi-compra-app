# Propuesta de Mejora — Pipeline de Visión IA
**Fecha:** Abril 2026  
**Basado en:** 5 tests con 2 tickets distintos y 11 plataformas evaluadas

---

## 1. Plataformas Validadas (Resultado Final)

Tras pruebas exhaustivas, se conservan **4 plataformas** con comportamiento confiable:

| Prioridad | Proveedor | Modelo | Velocidad | Calidad |
|---|---|---|---|---|
| 1ª | **Mistral AI** | `pixtral-large-latest` | ~11s | ⭐⭐⭐⭐⭐ Mejor normalización |
| 2ª | **Groq LPU** | `meta-llama/llama-4-scout-17b-16e-instruct` | ~1.6s | ⭐⭐⭐⭐ Más rápido |
| 3ª | **NVIDIA NIM** | `nvidia/nemotron-nano-12b-v2-vl` | ~7s | ⭐⭐⭐⭐ Datos precisos |
| 4ª | **Scaleway** | `pixtral-12b-2409` | ~7s | ⭐⭐⭐ Fecha a veces errónea |

### Plataformas descartadas y motivo
| Plataforma | Motivo de eliminación |
|---|---|
| Cloudflare AI | Daily free limit (429) |
| Together AI | Credit limit exceeded (402) |
| LLM7.io | Imagen supera 128K chars (402) |
| Fireworks AI | Modelo 404 no disponible |
| Moondream Cloud | No hace OCR real, devuelve plantilla vacía |
| OpenRouter | Timeout permanente en todas las keys (180s+) |
| GitHub GPT-4.1 | Subtotales sistemáticamente incorrectos (desplazados) |

---

## 2. Keys API Disponibles por Plataforma

Todas las keys son de `varaibles.txt`. El sistema debe rotar en orden si falla la primera.

### Mistral AI
```
MISTRAL_API_KEY_1=<ver varaibles.txt>
MISTRAL_API_KEY_2=<ver varaibles.txt>
```
Endpoint: `https://api.mistral.ai/v1/chat/completions`

### Groq LPU
```
GROQ_VISION_API_KEY_1=<ver varaibles.txt>
GROQ_VISION_API_KEY_2=<ver varaibles.txt>
```
Endpoint: `https://api.groq.com/openai/v1/chat/completions`

### NVIDIA NIM
```
NVIDIA_API_KEY_1=<ver varaibles.txt>
NVIDIA_API_KEY_2=<ver varaibles.txt>
```
Endpoint: `https://integrate.api.nvidia.com/v1/chat/completions`
> ⚠️ NOTA: `meta/llama-4-scout` y `llama-4-maverick` aparecen en el catálogo pero devuelven 404 en ambas cuentas (función serverless no activada). Usar exclusivamente `nvidia/nemotron-nano-12b-v2-vl`.

### Scaleway
```
SCALEWAY_API_KEY_1=<ver varaibles.txt>
SCALEWAY_API_KEY_2=<ver varaibles.txt>
```
Endpoint: `https://api.scaleway.ai/v1/chat/completions`

---

## 3. Prompt Recomendado (Mejorado)

### Problema del prompt actual
El prompt actual pide transcripción literal. Los modelos:
- Incluyen información de peso/precio por kg dentro del `nombre_ticket` (ej: `"BOLLERIA GRANE 0,154 kg 7,50 €/kg"`)
- No normalizan `nombre_base` de forma consistente (Scaleway y NVIDIA devuelven mayúsculas)
- Algunos modelos añaden markdown code fences (\`\`\`json)

### Prompt recomendado

```
Analiza este ticket de compra y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta, sin texto adicional, sin markdown, sin explicaciones:

{
  "comercio": "nombre del comercio en mayúsculas",
  "fecha": "DD/MM/YYYY",
  "total": número_decimal,
  "productos": [
    {
      "cantidad": número_entero,
      "nombre_ticket": "texto EXACTO como aparece en el ticket, solo el nombre del producto sin precios ni pesos",
      "nombre_base": "nombre normalizado en Title Case sin abreviaturas",
      "subtotal": número_decimal
    }
  ]
}

REGLAS ESTRICTAS:
- nombre_ticket: solo el nombre del artículo, NUNCA incluir peso (kg), precio por kilo (€/kg) ni códigos
- nombre_base: interpretar abreviaturas (CC ZERO ZERO 2 → Coca-Cola Zero Zero 2L), usar Title Case
- fecha: formato DD/MM/YYYY obligatorio
- total y subtotal: números decimales sin símbolo €
- No incluir líneas de descuento, IVA ni cambio como productos
- Responder SOLO con el JSON, nada más
```

### Cambios clave respecto al prompt anterior
1. **Prohíbe explícitamente** incluir peso/kg en `nombre_ticket` — resuelve el defecto de Groq
2. **Exige Title Case** en `nombre_base` — corrige MAYÚSCULAS de NVIDIA y Scaleway
3. **Define ejemplos de interpretación** — mejora normalización en todos los modelos
4. **"Responder SOLO con el JSON"** — elimina markdown code fences sin necesidad de strip en backend

---

## 4. Formato de Respuesta Esperado

### Schema JSON completo

```typescript
type TicketJSON = {
  comercio: string;          // "MERCADONA", "LIDL", "CARREFOUR"
  fecha: string;             // "DD/MM/YYYY"
  total: number;             // 32.68
  productos: Array<{
    cantidad: number;        // entero >= 1
    nombre_ticket: string;   // texto exacto del ticket (solo nombre)
    nombre_base: string;     // nombre normalizado Title Case
    subtotal: number;        // precio de esa línea
  }>;
};
```

### Ejemplo de respuesta ideal (basado en Mistral)

```json
{
  "comercio": "MERCADONA",
  "fecha": "31/10/2017",
  "total": 32.68,
  "productos": [
    { "cantidad": 2, "nombre_ticket": "SOJA NATURAL", "nombre_base": "Soja Natural", "subtotal": 2.38 },
    { "cantidad": 1, "nombre_ticket": "PESCADO", "nombre_base": "Pescado", "subtotal": 5.00 },
    { "cantidad": 1, "nombre_ticket": "RIOJA CRIANZAT", "nombre_base": "Rioja Crianza", "subtotal": 5.60 },
    { "cantidad": 1, "nombre_ticket": "CC ZERO ZERO 2", "nombre_base": "Coca-Cola Zero Zero 2L", "subtotal": 1.43 },
    { "cantidad": 1, "nombre_ticket": "BOLLERIA GRANE", "nombre_base": "Bollería Grande", "subtotal": 1.16 }
  ]
}
```

---

## 5. Implementación en la App Original

### Archivos a modificar

#### `lib/vision-roulette.ts`
- **Acción**: Añadir NVIDIA NIM y Groq como proveedores de visión alternativos
- **Modelos actuales**: Mistral Pixtral + Gemini Pro Vision
- **Modelos a añadir**:
  - `nvidia/nemotron-nano-12b-v2-vl` vía NVIDIA NIM
  - `meta-llama/llama-4-scout-17b-16e-instruct` vía Groq
- **Keys**: Añadir al `.env.local` como `NVIDIA_API_KEY_1`, `NVIDIA_API_KEY_2`, `GROQ_VISION_API_KEY_1`, `GROQ_VISION_API_KEY_2`
- **Rotación**: El sistema de roulette ya existe, solo hay que registrar los nuevos proveedores

#### `.env.local`
Añadir las siguientes variables:
```bash
# NVIDIA NIM — Vision
NVIDIA_API_KEY_1=<ver varaibles.txt>
NVIDIA_API_KEY_2=<ver varaibles.txt>

# Groq — Vision (Llama 4 Scout)
GROQ_VISION_API_KEY_1=<ver varaibles.txt>
GROQ_VISION_API_KEY_2=<ver varaibles.txt>

# Mistral — Vision
MISTRAL_API_KEY_1=<ver varaibles.txt>
MISTRAL_API_KEY_2=<ver varaibles.txt>

# Scaleway — Vision
SCALEWAY_API_KEY_1=<ver varaibles.txt>
SCALEWAY_API_KEY_2=<ver varaibles.txt>
```

#### `app/api/analyze/route.ts`
- **Acción**: Actualizar el `systemPrompt` de visión con el prompt mejorado de la Sección 3
- **Acción**: Añadir strip de markdown code fences en el parser de respuesta (por si algún modelo lo añade):
```typescript
const clean = (s: string) => s.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
```

### Estrategia de selección de proveedor recomendada

```
Intento 1: Groq (Llama 4 Scout) — más rápido (~1.6s)
Intento 2: Mistral (Pixtral Large) — más preciso (~11s)
Intento 3: NVIDIA NIM (Nemotron 12B VL) — sólido (~7s)
Intento 4: Scaleway (Pixtral 12B) — fallback (~7s)
```

Groq como primera opción por velocidad. Si falla (rate limit), Mistral como opción más confiable. NVIDIA y Scaleway como fallbacks.

---

## 6. Defectos Conocidos por Plataforma

| Plataforma | Defecto | Impacto | Solución |
|---|---|---|---|
| **Groq** | Incluye peso en `nombre_ticket` de productos variables | Bajo — solo en productos a granel | Nuevo prompt lo resuelve |
| **Scaleway** | Fecha a veces con mes incorrecto | Medio — requiere validación posterior | Prompt más estricto + validar fecha en synthesis |
| **NVIDIA** | `nombre_base` en MAYÚSCULAS sin normalizar | Bajo — el synthesis de Groq puede corregirlo | Nuevo prompt lo resuelve |
| **Todos** | `nombre_base` no reconoce marcas propias de Mercadona | Bajo — mejora con el alias de Supabase | Sistema de alias ya existente cubre esto |

---

## 7. Mejoras Adicionales Recomendadas

1. **Validación post-OCR**: Tras recibir el JSON de visión, verificar que `sum(subtotales) ≈ total` (tolerancia ±0.10€). Si no coincide, marcar como "revisar".

2. **Normalización de fecha en synthesis**: En `app/api/analyze/route.ts`, en el prompt de Groq synthesis, añadir validación de fecha — si el mes es numéricamente imposible o el año parece incorrecto, inferirlo del contexto.

3. **Fallback de imagen**: Si todos los modelos de visión fallan, intentar con calidad de compresión reducida (imagen más pequeña) antes de devolver error al usuario.

4. **Caché de resultado**: Para la misma imagen (mismo hash), cachear el resultado de visión en `localStorage` para evitar re-procesar si el usuario cierra y abre la app sin cambiar la foto.
