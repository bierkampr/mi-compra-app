// ─── SISTEMA DE RULETA MULTI-PLATAFORMA PARA VISION IA ────────────────────────
// Descubre automáticamente todas las API keys de visión configuradas en Vercel,
// selecciona aleatoriamente una para cada imagen, y si falla, blacklistea y
// re-gira la ruleta hasta obtener resultado o agotar opciones.
// Scope: SOLO Paso A (transcripción de imagen → texto). Paso B (síntesis) no se toca.

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface PlatformDef {
  id: string;
  envPrefix: string;
  endpoint: string | (() => string | null);
  model: string;
  format: "openai" | "moondream";
}

interface VisionSlot {
  id: string;        // "MISTRAL:0", "GROQ_VISION:2" — clave de blacklist
  platform: string;
  apiKey: string;
  endpoint: string;
  model: string;
  format: "openai" | "moondream";
}

export interface RouletteMeta {
  platformsUsed: string[];      // plataforma ganadora por imagen (ej: ["GROQ_VISION", "MISTRAL"])
  modelsUsed: string[];         // modelo ganador por imagen
  blacklistedSlots: string[];   // todos los slots que fallaron
  rotationCount: number;        // total de reintentos fallidos
  totalSlots: number;           // slots disponibles al inicio
}

export interface RouletteResult {
  transcriptions: string[];
  meta: RouletteMeta;
}

// ─── REGISTRO DE PLATAFORMAS ──────────────────────────────────────────────────
// Para agregar una plataforma nueva: añadir una entrada aquí y configurar
// las env vars en Vercel con el prefijo correspondiente. La app la detecta sola.

const PLATFORMS: PlatformDef[] = [
  {
    id: "GROQ_VISION",
    envPrefix: "GROQ_VISION",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    format: "openai",
  },
  {
    id: "MISTRAL",
    envPrefix: "MISTRAL",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    model: "pixtral-large-latest",
    format: "openai",
  },
  {
    id: "NVIDIA",
    envPrefix: "NVIDIA",
    endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
    model: "nvidia/nemotron-nano-12b-v2-vl",
    format: "openai",
  },
  {
    id: "SCALEWAY",
    envPrefix: "SCALEWAY",
    endpoint: "https://api.scaleway.ai/v1/chat/completions",
    model: "pixtral-12b-2409",
    format: "openai",
  },
];

// ─── AUTO-DESCUBRIMIENTO DE SLOTS ─────────────────────────────────────────────

function discoverAllSlots(): VisionSlot[] {
  const slots: VisionSlot[] = [];

  for (const platform of PLATFORMS) {
    // Resolver endpoint
    const rawEndpoint =
      typeof platform.endpoint === "function"
        ? platform.endpoint()
        : platform.endpoint;

    if (!rawEndpoint) continue; // Ej: Cloudflare sin ACCOUNT_ID

    // Buscar keys: {PREFIX}_API_KEY, {PREFIX}_API_KEY_1 ... _9
    const keys: string[] = [];
    const base = process.env[`${platform.envPrefix}_API_KEY`];
    if (base) keys.push(base);
    for (let i = 1; i <= 9; i++) {
      const k = process.env[`${platform.envPrefix}_API_KEY_${i}`];
      if (k) keys.push(k);
    }

    for (let i = 0; i < keys.length; i++) {
      slots.push({
        id: `${platform.id}:${i}`,
        platform: platform.id,
        apiKey: keys[i],
        endpoint: rawEndpoint,
        model: platform.model,
        format: platform.format,
      });
    }
  }

  return slots;
}

// ─── CONSTRUCCIÓN DE REQUESTS POR FORMATO ─────────────────────────────────────

function buildOpenAIRequest(
  slot: VisionSlot,
  imageUrl: string,
  instruction: string
): { url: string; init: RequestInit } {
  return {
    url: slot.endpoint,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${slot.apiKey}`,
      },
      body: JSON.stringify({
        model: slot.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 2000,
      }),
    },
  };
}

function buildMoondreamRequest(
  slot: VisionSlot,
  imageBase64: string,
  instruction: string
): { url: string; init: RequestInit } {
  // Moondream espera base64 puro sin el prefijo data:image/...
  const rawBase64 = imageBase64.startsWith("data:")
    ? imageBase64.split(",")[1]
    : imageBase64;

  return {
    url: slot.endpoint,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${slot.apiKey}`,
      },
      body: JSON.stringify({
        image: rawBase64,
        question: instruction,
        stream: false,
      }),
    },
  };
}

function extractTextFromResponse(
  format: "openai" | "moondream",
  json: any
): string | null {
  let raw: string | null = null;

  if (format === "moondream") {
    const text = json.answer || json.result || null;
    raw = typeof text === "string" && text.trim().length > 0 ? text.trim() : null;
  } else {
    // OpenAI-compatible
    const content = json.choices?.[0]?.message?.content;
    raw = typeof content === "string" && content.trim().length > 0 ? content.trim() : null;
  }

  if (!raw) return null;

  // Eliminar markdown code fences si el modelo las añade (```json ... ``` o ``` ... ```)
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return stripped.length > 0 ? stripped : raw;
}

// ─── INSTRUCCIÓN DE TRANSCRIPCIÓN ─────────────────────────────────────────────

function buildInstruction(imageIndex: number, totalImages: number): string {
  const partNote = totalImages > 1
    ? `Esta es la PARTE ${imageIndex + 1} de ${totalImages} de un ticket fotografiado en secciones. Extrae todos los productos visibles en esta parte e incluye el TOTAL si aparece.\n\n`
    : "";

  return `${partNote}Analiza este ticket de compra y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta, sin texto adicional, sin markdown, sin explicaciones:

{
  "comercio": "NOMBRE DEL COMERCIO EN MAYÚSCULAS",
  "fecha": "DD/MM/AAAA",
  "total": 0.00,
  "productos": [
    { "cantidad": 1, "nombre_ticket": "TEXTO LITERAL DEL TICKET", "nombre_base": "Nombre En Title Case", "subtotal": 0.00 }
  ]
}

REGLAS ESTRICTAS:
- comercio: nombre corto conocido ("MERCADONA", "LIDL"). Nunca el nombre legal largo.
- fecha: formato DD/MM/AAAA. Si no se ve claramente, usa "00/00/0000".
- total: número final pagado, sin símbolo €.
- nombre_ticket: SOLO el nombre del artículo tal como aparece. NUNCA incluir peso (kg), precio por kilo (€/kg), ni códigos de barras.
- nombre_base: nombre normalizado en Title Case, interpretando abreviaturas (CC ZERO ZERO 2 → Coca-Cola Zero Zero 2L).
- subtotal: precio de esa línea de producto, sin símbolo €.
- No incluir líneas de IVA, descuentos, cambio ni total como productos.
- Responder SOLO con el JSON. Nada más.`;
}

// ─── RULETA: TRANSCRIBIR UNA IMAGEN ───────────────────────────────────────────

async function transcribeImageViaRoulette(params: {
  imageBase64: string;
  imageIndex: number;
  totalImages: number;
  blacklist: Set<string>;
  allSlots: VisionSlot[];
  timeoutMs?: number;
}): Promise<{ text: string; platform: string; model: string }> {
  const {
    imageBase64,
    imageIndex,
    totalImages,
    blacklist,
    allSlots,
    timeoutMs = 30000,
  } = params;

  const instruction = buildInstruction(imageIndex, totalImages);
  const imageUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  while (true) {
    // Filtrar slots disponibles (no blacklisteados)
    const available = allSlots.filter((s) => !blacklist.has(s.id));

    if (available.length === 0) {
      throw new Error(
        `[Ruleta] Todas las API keys de visión agotadas para imagen ${imageIndex + 1}. ` +
          `${blacklist.size} keys blacklisteadas.`
      );
    }

    // Pick aleatorio
    const slot = available[Math.floor(Math.random() * available.length)];

    try {
      console.log(
        `[Ruleta] Imagen ${imageIndex + 1}/${totalImages} → ${slot.platform} (${slot.id}) | ` +
          `Disponibles: ${available.length}/${allSlots.length}`
      );

      // Construir request según formato
      const req =
        slot.format === "moondream"
          ? buildMoondreamRequest(slot, imageBase64, instruction)
          : buildOpenAIRequest(slot, imageUrl, instruction);

      // Fetch con timeout
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(req.url, {
          ...req.init,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      // Rate limit o error de servidor → blacklist y retry
      if (response.status === 429 || response.status >= 500) {
        const errBody = await response.text().catch(() => "");
        console.warn(
          `[Ruleta] ${slot.platform} (${slot.id}) → HTTP ${response.status}. Blacklisteando. ${errBody.slice(0, 100)}`
        );
        blacklist.add(slot.id);
        continue;
      }

      // Otro error HTTP (401, 403, etc.) → blacklist
      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        console.warn(
          `[Ruleta] ${slot.platform} (${slot.id}) → HTTP ${response.status}. Blacklisteando. ${errBody.slice(0, 100)}`
        );
        blacklist.add(slot.id);
        continue;
      }

      // Parsear respuesta
      const json = await response.json();
      const text = extractTextFromResponse(slot.format, json);

      if (!text) {
        console.warn(
          `[Ruleta] ${slot.platform} (${slot.id}) → Respuesta vacía. Blacklisteando.`
        );
        blacklist.add(slot.id);
        continue;
      }

      console.log(
        `[Ruleta] ✓ Imagen ${imageIndex + 1} transcrita por ${slot.platform} (${text.length} chars)`
      );
      return { text, platform: slot.platform, model: slot.model };

    } catch (err: any) {
      // Timeout, error de red, JSON inválido, etc.
      const reason =
        err.name === "AbortError" ? "TIMEOUT" : err.message || "Error desconocido";
      console.warn(
        `[Ruleta] ${slot.platform} (${slot.id}) → ${reason}. Blacklisteando.`
      );
      blacklist.add(slot.id);
      continue;
    }
  }
}

// ─── ENTRY POINT EXPORTADO ────────────────────────────────────────────────────

export async function transcribeImagesWithRoulette(
  images: string[]
): Promise<RouletteResult> {
  const allSlots = discoverAllSlots();

  if (allSlots.length === 0) {
    throw new Error(
      "No hay plataformas de visión configuradas. " +
        "Configura al menos una API key de visión en Vercel " +
        "(ej: MISTRAL_API_KEY, GROQ_VISION_API_KEY, NVIDIA_API_KEY, etc.)"
    );
  }

  // Log de plataformas descubiertas
  const platformCounts: Record<string, number> = {};
  for (const s of allSlots) {
    platformCounts[s.platform] = (platformCounts[s.platform] || 0) + 1;
  }
  console.log(
    `[Ruleta] Plataformas descubiertas: ${Object.entries(platformCounts)
      .map(([p, n]) => `${p}(${n})`)
      .join(", ")} | Total: ${allSlots.length} slots`
  );

  // Blacklist compartido entre todas las imágenes paralelas
  const blacklist = new Set<string>();
  const blacklistBefore = blacklist.size;

  const results = await Promise.all(
    images.map((img, idx) =>
      transcribeImageViaRoulette({
        imageBase64: img,
        imageIndex: idx,
        totalImages: images.length,
        blacklist,
        allSlots,
      })
    )
  );

  const meta: RouletteMeta = {
    platformsUsed: results.map((r) => r.platform),
    modelsUsed:    results.map((r) => r.model),
    blacklistedSlots: Array.from(blacklist),
    rotationCount: blacklist.size - blacklistBefore,
    totalSlots: allSlots.length,
  };

  return {
    transcriptions: results.map((r) => r.text),
    meta,
  };
}
