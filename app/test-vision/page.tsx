"use client";

// ⚠️  HERRAMIENTA DE TEST — Solo para desarrollo local
// Acceder en: http://localhost:3000/test-vision

import { useState, useRef, useCallback } from "react";

// ─── COMPRESIÓN DE IMAGEN (copiado de lib/utils.ts) ─────────────────────────

const renderToCanvas = (
  img: HTMLImageElement,
  maxSide: number,
  quality: number
): string => {
  let width = img.width;
  let height = img.height;

  const longest = Math.max(width, height);
  if (longest > maxSide) {
    const scale = maxSide / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return img.src;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Filtro de contraste: oscurece tinta, aclara fondo
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const v = gray < 140 ? gray * 0.6 : Math.min(255, gray * 1.2);
    data[i] = data[i + 1] = data[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/jpeg', quality);
};

const compressImage = (base64Str: string): Promise<string> => {
  const MAX_SIDE_PX = 1000;
  const MAX_SIZE_KB = 110;
  const MIN_QUALITY  = 0.35;
  const QUALITY_STEP = 0.05;
  const MIN_SIDE_PX  = 300;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;

    img.onload = () => {
      let maxSide = MAX_SIDE_PX;
      let quality = 0.78;

      const tryNext = (): void => {
        const result = renderToCanvas(img, maxSide, quality);
        const kb = (result.length * 0.75) / 1024;

        if (kb <= MAX_SIZE_KB) {
          console.log(`[compressImage] OK: ${maxSide}px · q${Math.round(quality * 100)}% · ${Math.round(kb)}KB`);
          resolve(result);
          return;
        }

        if (quality - QUALITY_STEP >= MIN_QUALITY) {
          quality = Math.round((quality - QUALITY_STEP) * 100) / 100;
          tryNext();
          return;
        }

        if (maxSide - 50 >= MIN_SIDE_PX) {
          maxSide -= 50;
          quality = 0.78;
          tryNext();
          return;
        }

        console.warn(`[compressImage] No se pudo reducir a ${MAX_SIZE_KB}KB. Enviando ${Math.round(kb)}KB.`);
        resolve(result);
      };

      tryNext();
    };

    img.onerror = () => resolve(base64Str);
  });
};

// ─── DEFINICIÓN DE PLATAFORMAS (para UI) ──────────────────────────────────────

const PLATFORMS = [
  { id: "MISTRAL",       name: "Mistral AI",       model: "Pixtral Large",          color: "#FF7000" },
  { id: "SCALEWAY",      name: "Scaleway",          model: "Pixtral 12B",            color: "#4D40FF" },
  { id: "GROQ_VISION",   name: "Groq LPU",          model: "Llama 4 Scout 17B",      color: "#F55036" },
  { id: "NVIDIA",        name: "NVIDIA NIM",        model: "Nemotron Nano 12B VL",    color: "#76B900" },
] as const;

type PlatformId = typeof PLATFORMS[number]["id"];

type PlatformResult = {
  status: "idle" | "loading" | "success" | "error";
  result?: string;
  error?: string;
  rawResponse?: string;
  duration?: number;
  chars?: number;
  keyUsed?: string;
  attempts?: string;
};

const initResults = (): Record<PlatformId, PlatformResult> =>
  Object.fromEntries(PLATFORMS.map(p => [p.id, { status: "idle" }])) as Record<PlatformId, PlatformResult>;

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export default function TestVisionPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [imageSize, setImageSize] = useState<string>("");
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<string>("");
  const [compressing, setCompressing] = useState(false);
  const [results, setResults] = useState<Record<PlatformId, PlatformResult>>(initResults());
  const [logs, setLogs] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<PlatformId | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString("es-ES", { hour12: false });
    setLogs(prev => {
      const next = [...prev, `[${ts}] ${msg}`];
      setTimeout(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
      }, 30);
      return next;
    });
  }, []);

  const updateResult = useCallback((id: PlatformId, data: PlatformResult) => {
    setResults(prev => ({ ...prev, [id]: data }));
  }, []);

  // ── Cargar imagen ─────────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      setImage(raw);
      setImageName(file.name);
      setImageSize(`${(file.size / 1024).toFixed(1)} KB`);
      setDone(false);
      setSelected(null);
      setLogs([]);
      setResults(initResults());

      // Comprimir imagen automáticamente
      setCompressing(true);
      try {
        const compressed = await compressImage(raw);
        setCompressedImage(compressed);
        const compKB = (compressed.length * 0.75) / 1024;
        setCompressedSize(`${compKB.toFixed(1)} KB`);
      } catch {
        setCompressedImage(raw);
        setCompressedSize("(sin comprimir)");
      }
      setCompressing(false);
    };
    reader.readAsDataURL(file);
  };

  // ── Enviar a todas ────────────────────────────────────────────────────────────

  const handleSendAll = async () => {
    const imageToSend = compressedImage || image;
    if (!imageToSend) return;
    setSending(true);
    setDone(false);
    setSelected(null);
    setResults(Object.fromEntries(PLATFORMS.map(p => [p.id, { status: "loading" }])) as Record<PlatformId, PlatformResult>);

    const startAll = Date.now();
    addLog(`══════ Iniciando prueba — ${PLATFORMS.length} plataformas ══════`);
    addLog(`Imagen: ${imageName} (original: ${imageSize} → comprimida: ${compressedSize})`);

    const promises = PLATFORMS.map(async (platform) => {
      addLog(`→ [${platform.name}] Enviando...`);

      try {
        const res = await fetch("/api/test-vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageToSend, platform: platform.id }),
        });

        const data = await res.json();

        if (data.status === "success") {
          updateResult(platform.id, {
            status: "success",
            result: data.result,
            duration: data.duration,
            chars: data.chars,
            keyUsed: data.keyUsed,
            attempts: data.attempts,
          });
          addLog(`✓ [${platform.name}] OK — ${data.duration}ms — ${data.chars} chars — ${data.keyUsed}${data.attempts ? ` (${data.attempts})` : ""}`);
        } else {
          updateResult(platform.id, {
            status: "error",
            error: data.error,
            rawResponse: data.rawResponse,
            duration: data.duration,
            keyUsed: data.keyUsed,
            attempts: data.attempts,
          });
          addLog(`✗ [${platform.name}] ERROR — ${data.error}${data.attempts ? ` [${data.attempts}]` : ""}`);
        }
      } catch (err: any) {
        updateResult(platform.id, { status: "error", error: err.message });
        addLog(`✗ [${platform.name}] EXCEPCIÓN — ${err.message}`);
      }
    });

    await Promise.allSettled(promises);

    const totalMs = Date.now() - startAll;
    addLog(`══════ Prueba completada en ${(totalMs / 1000).toFixed(1)}s ══════`);
    setSending(false);
    setDone(true);
  };

  // ── Descargar TXT ─────────────────────────────────────────────────────────────

  const handleDownload = () => {
    const divider = "═".repeat(60);
    const subDivider = "─".repeat(60);
    const successCount = PLATFORMS.filter(p => results[p.id]?.status === "success").length;
    const errorCount = PLATFORMS.filter(p => results[p.id]?.status === "error").length;

    const lines: string[] = [
      divider,
      "  REPORTE DE PRUEBA — VISIÓN IA MULTI-PLATAFORMA",
      `  Fecha: ${new Date().toLocaleString("es-ES")}`,
      `  Imagen: ${imageName} (original: ${imageSize} → comprimida: ${compressedSize})`,
      `  Resultado: ${successCount} éxitos / ${errorCount} errores / ${PLATFORMS.length} total`,
      divider,
      "",
    ];

    for (const p of PLATFORMS) {
      const r = results[p.id];
      lines.push(`┌── ${p.name} — ${p.model}`);

      if (r.status === "success") {
        lines.push(`│  Estado  : ✓ ÉXITO`);
        lines.push(`│  Duración: ${r.duration}ms`);
        lines.push(`│  Chars   : ${r.chars}`);
        if (r.keyUsed) lines.push(`│  Key     : ${r.keyUsed}`);
        if (r.attempts) lines.push(`│  Rotación: ${r.attempts}`);
        lines.push(`│`);
        lines.push(`│  ── TRANSCRIPCIÓN ──`);
        (r.result || "").split("\n").forEach(line => lines.push(`│  ${line}`));
      } else if (r.status === "error") {
        lines.push(`│  Estado  : ✗ ERROR`);
        lines.push(`│  Duración: ${r.duration ?? "—"}ms`);
        lines.push(`│  Error   : ${r.error}`);
        if (r.attempts) lines.push(`│  Rotación: ${r.attempts}`);
        if (r.rawResponse) {
          lines.push(`│`);
          lines.push(`│  ── RESPUESTA RAW ──`);
          r.rawResponse.split("\n").forEach(line => lines.push(`│  ${line}`));
        }
      } else {
        lines.push(`│  Estado  : — No ejecutado`);
      }

      lines.push(`└${subDivider}`);
      lines.push("");
    }

    lines.push(divider);
    lines.push("  LOG DE EJECUCIÓN");
    lines.push(divider);
    logs.forEach(l => lines.push(l));

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vision-test-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Métricas ──────────────────────────────────────────────────────────────────

  const successCount = PLATFORMS.filter(p => results[p.id]?.status === "success").length;
  const errorCount = PLATFORMS.filter(p => results[p.id]?.status === "error").length;
  const loadingCount = PLATFORMS.filter(p => results[p.id]?.status === "loading").length;
  const doneCount = successCount + errorCount;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      background: "#080c10",
      minHeight: "100vh",
      color: "#d1d5db",
      padding: "28px 24px",
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "28px", borderBottom: "1px solid #1f2937", paddingBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#f9fafb", margin: 0 }}>
            🔬 Vision AI — Test Multi-Plataforma
          </h1>
          <span style={{ fontSize: "11px", background: "#1a2e1a", color: "#4ade80", padding: "2px 8px", borderRadius: "4px", border: "1px solid #166534" }}>
            DEV ONLY
          </span>
        </div>
        <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "6px", margin: "6px 0 0" }}>
          Envía una imagen a las {PLATFORMS.length} plataformas simultáneamente · Compara resultados · Descarga reporte
        </p>
      </div>

      {/* ── Controles ── */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />

        <button
          onClick={() => fileRef.current?.click()}
          style={{
            padding: "9px 18px",
            background: "#111827",
            border: "1px solid #374151",
            borderRadius: "7px",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: "inherit",
          }}
        >
          📂 Cargar imagen
        </button>

        {imageName && (
          <span style={{ fontSize: "12px", color: "#6b7280" }}>
            {imageName} <span style={{ color: "#374151" }}>({imageSize})</span>
            {compressing && <span style={{ color: "#fbbf24", marginLeft: "8px" }}>⏳ Comprimiendo...</span>}
            {compressedSize && !compressing && (
              <span style={{ color: "#4ade80", marginLeft: "8px" }}>→ {compressedSize}</span>
            )}
          </span>
        )}

        <button
          onClick={handleSendAll}
          disabled={!image || sending || compressing}
          style={{
            padding: "9px 22px",
            background: image && !sending && !compressing ? "#1d4ed8" : "#111827",
            border: "none",
            borderRadius: "7px",
            color: image && !sending && !compressing ? "#fff" : "#4b5563",
            cursor: image && !sending && !compressing ? "pointer" : "not-allowed",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "inherit",
            letterSpacing: "0.02em",
          }}
        >
          {sending
            ? `⏳ Procesando (${doneCount}/${PLATFORMS.length})...`
            : "🚀 Enviar a todas"}
        </button>

        {done && (
          <>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>
              <span style={{ color: "#4ade80" }}>✓ {successCount}</span>
              {" · "}
              <span style={{ color: "#f87171" }}>✗ {errorCount}</span>
            </span>
            <button
              onClick={handleDownload}
              style={{
                padding: "9px 18px",
                background: "#064e3b",
                border: "1px solid #065f46",
                borderRadius: "7px",
                color: "#6ee7b7",
                cursor: "pointer",
                fontSize: "13px",
                fontFamily: "inherit",
              }}
            >
              💾 Descargar TXT
            </button>
          </>
        )}
      </div>

      {/* ── Preview imagen ── */}
      {(compressedImage || image) && (
        <div style={{ marginBottom: "20px" }}>
          <img
            src={compressedImage || image || undefined}
            alt="Preview ticket (comprimida)"
            style={{
              maxHeight: "180px",
              maxWidth: "280px",
              borderRadius: "8px",
              border: "1px solid #1f2937",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      {/* ── Grid de plataformas ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "10px",
        marginBottom: "20px",
      }}>
        {PLATFORMS.map(p => {
          const r = results[p.id];
          const isClickable = r.status === "success" || r.status === "error";
          const isSelected = selected === p.id;

          return (
            <div
              key={p.id}
              onClick={() => isClickable && setSelected(isSelected ? null : p.id)}
              style={{
                background: "#0d1117",
                border: `1px solid ${isSelected ? "#3b82f6" : "#1f2937"}`,
                borderRadius: "10px",
                padding: "14px",
                cursor: isClickable ? "pointer" : "default",
                transition: "border-color 0.15s",
                userSelect: "none",
              }}
            >
              {/* Nombre + estado */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#f3f4f6", display: "flex", alignItems: "center", gap: "7px" }}>
                    <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                    {p.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px", paddingLeft: "14px" }}>
                    {p.model}
                  </div>
                </div>
                <div style={{ fontSize: "11px", textAlign: "right", flexShrink: 0 }}>
                  {r.status === "idle"    && <span style={{ color: "#4b5563" }}>— idle</span>}
                  {r.status === "loading" && <span style={{ color: "#fbbf24" }}>⏳ enviando...</span>}
                  {r.status === "success" && (
                    <div>
                      <span style={{ color: "#4ade80" }}>✓ OK</span>
                      <div style={{ color: "#6b7280", fontSize: "10px" }}>{r.duration}ms · {r.chars} chars</div>
                    </div>
                  )}
                  {r.status === "error"   && <span style={{ color: "#f87171" }}>✗ error</span>}
                </div>
              </div>

              {/* Barra de progreso */}
              <div style={{ height: "2px", background: "#1f2937", borderRadius: "1px", overflow: "hidden", marginBottom: "8px" }}>
                <div style={{
                  height: "100%",
                  width: r.status === "success" ? "100%"
                       : r.status === "error"   ? "100%"
                       : r.status === "loading" ? "65%"
                       : "0%",
                  background: r.status === "success" ? "#4ade80"
                             : r.status === "error"   ? "#f87171"
                             : r.status === "loading" ? "#fbbf24"
                             : "#1f2937",
                  transition: "width 0.8s ease, background 0.3s",
                }} />
              </div>

              {/* Snippet de resultado */}
              {r.status === "success" && (
                <div style={{ fontSize: "11px", color: "#9ca3af", lineHeight: "1.5", maxHeight: "52px", overflow: "hidden" }}>
                  {r.result?.slice(0, 180)}{(r.result?.length ?? 0) > 180 ? "…" : ""}
                </div>
              )}
              {r.status === "error" && (
                <div style={{ fontSize: "11px", color: "#f87171", lineHeight: "1.4" }}>
                  {r.error?.slice(0, 150)}
                </div>
              )}

              {isClickable && (
                <div style={{ fontSize: "10px", color: "#374151", marginTop: "6px", textAlign: "right" }}>
                  {isSelected ? "▲ cerrar" : "▼ ver completo"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Resultado completo de plataforma seleccionada ── */}
      {selected && (
        <div style={{ marginBottom: "20px" }}>
          {(() => {
            const r = results[selected];
            const p = PLATFORMS.find(x => x.id === selected)!;
            return (
              <>
                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: p.color }} />
                  {p.name} — {p.model}
                  {r.status === "success" && (
                    <span style={{ color: "#4ade80" }}>{r.duration}ms · {r.chars} chars</span>
                  )}
                </div>
                <pre style={{
                  background: "#0d1117",
                  border: "1px solid #1f2937",
                  borderRadius: "8px",
                  padding: "16px",
                  fontSize: "12px",
                  lineHeight: "1.7",
                  color: r.status === "success" ? "#bbf7d0" : "#fecaca",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "420px",
                  overflow: "auto",
                  margin: 0,
                }}>
                  {r.status === "success" ? r.result : `ERROR:\n${r.error}${r.rawResponse ? `\n\nRESPUESTA RAW:\n${r.rawResponse}` : ""}`}
                </pre>
              </>
            );
          })()}
        </div>
      )}

      {/* ── Log ── */}
      <div>
        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
          Log de ejecución
          {logs.length > 0 && <span style={{ color: "#374151" }}> ({logs.length} entradas)</span>}
        </div>
        <div
          ref={logRef}
          style={{
            background: "#0d1117",
            border: "1px solid #1f2937",
            borderRadius: "8px",
            padding: "12px 14px",
            height: "220px",
            overflowY: "auto",
            fontSize: "11px",
            lineHeight: "1.9",
          }}
        >
          {logs.length === 0 ? (
            <span style={{ color: "#374151" }}>El log aparecerá aquí cuando inicies la prueba...</span>
          ) : (
            logs.map((line, i) => {
              const color =
                line.includes("✓") ? "#4ade80"
                : line.includes("✗") ? "#f87171"
                : line.includes("══") ? "#60a5fa"
                : line.includes("→") ? "#d1d5db"
                : "#6b7280";
              return <div key={i} style={{ color }}>{line}</div>;
            })
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: "20px", fontSize: "10px", color: "#374151", textAlign: "center" }}>
        ⚠️ Herramienta de desarrollo — API keys hardcodeadas — No exponer en producción
      </div>
    </div>
  );
}
