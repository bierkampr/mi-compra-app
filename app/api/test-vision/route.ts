// ⚠️  ARCHIVO DE TEST — NO SUBIR A GIT / NO USAR EN PRODUCCIÓN
// Contiene API keys hardcodeadas para pruebas reales de plataformas de visión.
// Sistema de ROTACIÓN DE KEYS: si una key falla, prueba la siguiente.
// Acceder en: http://localhost:3000/test-vision

import { NextRequest, NextResponse } from "next/server";

// Serverless timeout extendido para plataformas lentas
export const maxDuration = 60;

// ─── INSTRUCCIÓN JSON (todas las plataformas reciben el mismo prompt) ─────────
const INSTRUCTION = `Eres un experto en lectura de tickets de compra.
Analiza la imagen del ticket y devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:

{
  "comercio": "NOMBRE DEL COMERCIO",
  "fecha": "DD/MM/AAAA",
  "total": 0.00,
  "productos": [
    { "cantidad": 1, "nombre_ticket": "TEXTO LITERAL DEL TICKET", "nombre_base": "nombre limpio del producto", "subtotal": 0.00 }
  ]
}

REGLAS CRÍTICAS:
- "comercio": nombre comercial corto (ej: "MERCADONA", "LIDL"). NO el nombre legal largo.
- "fecha": formato DD/MM/AAAA. Si no se ve, usa "00/00/0000".
- "total": número final pagado (float con 2 decimales).
- "productos": array con TODOS los productos visibles.
- Cada producto: cantidad (número), nombre_ticket (texto literal), nombre_base (nombre limpio), subtotal (precio final de esa línea).
- Responde SOLO con el JSON. Sin texto adicional, sin bloques de código markdown, sin explicaciones.`;

// ─── ERRORES QUE ACTIVAN ROTACIÓN DE KEY ──────────────────────────────────────
const RETRYABLE_STATUS = new Set([401, 402, 429, 500, 502, 503]);

// ─── CONFIGURACIÓN DE PLATAFORMAS CON MÚLTIPLES KEYS ─────────────────────────
// Todas las keys vienen de varaibles.txt — se prueban en orden secuencial.
// Si la primera falla con error retryable, se prueba la siguiente.

interface PlatformConfig {
  name: string;
  endpoint: string;
  model: string;
  apiKeys: string[];
  format: "openai" | "moondream";
}

const PLATFORMS: Record<string, PlatformConfig> = {
  MISTRAL: {
    name: "Mistral AI · Pixtral Large",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    model: "pixtral-large-latest",
    apiKeys: [
      process.env.MISTRAL_API_KEY_1 || "",
      process.env.MISTRAL_API_KEY_2 || "",
    ],
    format: "openai",
  },
  SCALEWAY: {
    name: "Scaleway · Pixtral 12B",
    endpoint: "https://api.scaleway.ai/v1/chat/completions",
    model: "pixtral-12b-2409",
    apiKeys: [
      process.env.SCALEWAY_API_KEY_1 || "",
      process.env.SCALEWAY_API_KEY_2 || "",
    ],
    format: "openai",
  },
  GROQ_VISION: {
    name: "Groq LPU · Llama 4 Scout 17B",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    apiKeys: [
      process.env.GROQ_VISION_API_KEY_1 || "",
      process.env.GROQ_VISION_API_KEY_2 || "",
    ],
    format: "openai",
  },
  NVIDIA: {
    name: "NVIDIA NIM · Nemotron Nano 12B VL",
    endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
    model: "nvidia/nemotron-nano-12b-v2-vl",
    apiKeys: [
      process.env.NVIDIA_API_KEY_1 || "",
      process.env.NVIDIA_API_KEY_2 || "",
    ],
    format: "openai",
  },
};

// ─── HACER UNA LLAMADA A UNA PLATAFORMA CON UNA KEY ESPECÍFICA ───────────────

async function callPlatform(
  config: PlatformConfig,
  apiKey: string,
  image: string,
): Promise<{
  ok: boolean;
  retryable: boolean;
  status?: number;
  result?: string;
  error?: string;
  rawResponse?: string;
  chars?: number;
}> {
  const imageUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;

  let fetchRes: Response;

  if (config.format === "moondream") {
    const rawBase64 = image.startsWith("data:") ? image.split(",")[1] : image;
    fetchRes = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        image: rawBase64,
        question: INSTRUCTION,
        stream: false,
      }),
      signal: AbortSignal.timeout(45000),
    });
  } else {
    fetchRes = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: INSTRUCTION },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        }],
        temperature: 0,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(45000),
    });
  }

  const responseText = await fetchRes.text();

  // Parsear respuesta
  let json: any;
  try {
    json = JSON.parse(responseText);
  } catch {
    return {
      ok: false,
      retryable: RETRYABLE_STATUS.has(fetchRes.status),
      status: fetchRes.status,
      error: `HTTP ${fetchRes.status} — Respuesta no-JSON: ${responseText.slice(0, 300)}`,
      rawResponse: responseText.slice(0, 800),
    };
  }

  // Error HTTP
  if (!fetchRes.ok) {
    const errMsg =
      json?.error?.message ||
      (typeof json?.error === "string" ? json.error : null) ||
      json?.message ||
      json?.detail ||
      JSON.stringify(json).slice(0, 300);
    return {
      ok: false,
      retryable: RETRYABLE_STATUS.has(fetchRes.status),
      status: fetchRes.status,
      error: `HTTP ${fetchRes.status} — ${errMsg}`,
      rawResponse: JSON.stringify(json, null, 2).slice(0, 800),
    };
  }

  // Extraer texto según formato
  let result: string;
  if (config.format === "moondream") {
    result = json.answer || json.result || JSON.stringify(json);
  } else {
    result = json.choices?.[0]?.message?.content || JSON.stringify(json);
  }

  if (!result || result.trim().length === 0) {
    return {
      ok: false,
      retryable: true,
      error: "Respuesta vacía del modelo",
      rawResponse: JSON.stringify(json, null, 2).slice(0, 800),
    };
  }

  // Limpiar markdown code fences si el modelo las añade (```json ... ```)
  const stripped = result.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const finalResult = stripped.length > 0 ? stripped : result;

  return { ok: true, retryable: false, result: finalResult, chars: finalResult.length };
}

// ─── HANDLER CON ROTACIÓN DE KEYS ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { image, platform } = await req.json();

  if (!platform || !PLATFORMS[platform]) {
    return NextResponse.json({ error: "Plataforma desconocida" }, { status: 400 });
  }
  if (!image) {
    return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });
  }

  const config = PLATFORMS[platform];
  const totalKeys = config.apiKeys.length;
  const start = Date.now();

  const attempts: string[] = [];
  let lastError: any = null;

  // Probar cada key en orden
  for (let i = 0; i < totalKeys; i++) {
    const apiKey = config.apiKeys[i];
    const keyLabel = `key${i + 1}/${totalKeys}`;

    try {
      const res = await callPlatform(config, apiKey, image);

      if (res.ok) {
        const duration = Date.now() - start;
        attempts.push(`✓ ${keyLabel} OK`);
        return NextResponse.json({
          platform,
          name: config.name,
          status: "success",
          result: res.result,
          duration,
          model: config.model,
          chars: res.chars,
          keyUsed: keyLabel,
          attempts: attempts.join(" → "),
        });
      }

      // Error no-retryable (ej: 400 bad request, 404 model not found) → no rotar
      if (!res.retryable) {
        const duration = Date.now() - start;
        attempts.push(`✗ ${keyLabel} HTTP ${res.status} (no retryable)`);
        return NextResponse.json({
          platform,
          name: config.name,
          status: "error",
          error: res.error,
          duration,
          rawResponse: res.rawResponse,
          keyUsed: keyLabel,
          attempts: attempts.join(" → "),
        });
      }

      // Error retryable → intentar siguiente key
      attempts.push(`✗ ${keyLabel} HTTP ${res.status}`);
      lastError = res;

    } catch (err: any) {
      const isTimeout = err.name === "AbortError" || err.name === "TimeoutError";
      attempts.push(`✗ ${keyLabel} ${isTimeout ? "TIMEOUT" : err.message?.slice(0, 50)}`);
      lastError = {
        error: isTimeout
          ? `TIMEOUT después de ${Date.now() - start}ms (límite: 45s)`
          : (err.message || "Error desconocido"),
      };
      // Timeout → intentar siguiente key
    }
  }

  // Todas las keys fallaron
  const duration = Date.now() - start;
  return NextResponse.json({
    platform,
    name: config.name,
    status: "error",
    error: `Todas las ${totalKeys} keys fallaron. Último: ${lastError?.error || "Error desconocido"}`,
    duration,
    rawResponse: lastError?.rawResponse,
    attempts: attempts.join(" → "),
  });
}

// Exponer lista de plataformas disponibles
export async function GET() {
  return NextResponse.json({
    platforms: Object.entries(PLATFORMS).map(([id, cfg]) => ({
      id,
      name: cfg.name,
      model: cfg.model,
      format: cfg.format,
      keys: cfg.apiKeys.length,
    })),
  });
}
