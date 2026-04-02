# Scripts de Desarrollo

> Todos los scripts viven en `scripts/`. Se ejecutan con `node scripts/...`.
> NO son parte del build de producción. Son herramientas de desarrollo y automatización.

---

## scripts/dev-tools/

### generate-context.js (antes: aud.js)
**Propósito:** Genera `PROYECTO_COMPLETO.txt` — un dump de todo el código fuente en un solo archivo de texto.
**Uso:** Para subir el contexto completo del proyecto a una IA (Claude, GPT-4, etc.) de una sola vez.
**Output:** `PROYECTO_COMPLETO.txt` en la raíz (excluido de Git por `.gitignore`).

```bash
node scripts/dev-tools/generate-context.js
```

### generate-digest.js (antes: auditor.js)
**Propósito:** Genera `project_digest.xml` — similar a generate-context pero en formato XML estructurado.
**Uso:** Alternativa al .txt para IAs que prefieren XML con metadata de estructura del proyecto.
**Output:** `project_digest.xml` en la raíz (excluido de Git por `.gitignore`).

```bash
node scripts/dev-tools/generate-digest.js
```

### generate-docs.js (antes: generar_memoria.js)
**Propósito:** Genera el directorio `docs/` con documentación básica en Markdown y actualiza `.clinerules`.
**Estado:** OBSOLETO — la documentación ahora vive en `Docs_Actualizadas/` (este directorio).
**Nota:** Si se ejecuta, sobreescribirá la carpeta `docs/` (no `Docs_Actualizadas/`).

```bash
node scripts/dev-tools/generate-docs.js
```

---

## scripts/git/

### push.js (antes: subir.js)
**Propósito:** Automatiza el ciclo completo de git: verifica `.gitignore`, limpia archivos sensibles del índice, hace commit automático con fecha y hace push.
**Seguridad:** Bloquea automáticamente `.env.local`, `PROYECTO_COMPLETO.txt`, etc. en `.gitignore` si no están ya.
**Commit message:** `Auto-Update: {fecha} ({N} archivos)`

```bash
node scripts/git/push.js
```

### ia-sync.js (antes: ia_sync.js)
**Propósito:** Añade una entrada al log de `IA_INSTRUCTIONS.md` y luego ejecuta `push.js`.
**Estado:** OBSOLETO — `IA_INSTRUCTIONS.md` fue eliminado en la auditoría v3.0. El log de cambios ahora vive en `Docs_Actualizadas/CHANGELOG.md`.

```bash
node scripts/git/ia-sync.js "Mensaje de cambio"
```

---

## scripts/design/

Contiene los archivos HTML de previsualización del sistema de diseño:

- `design-preview.html` — Previsualización interactiva de componentes UI.
- `design-framework.html` — Framework de diseño de referencia.
- `design-system-report.md` — Reporte del sistema de diseño (versión anterior).

Estos son archivos de referencia visual, no parte del build.

---

## Artefactos Generados (NO subir a Git)

Los siguientes archivos son output de los scripts y están en `.gitignore`:

| Archivo | Generado por |
|---|---|
| `PROYECTO_COMPLETO.txt` | `generate-context.js` |
| `project_digest.xml` | `generate-digest.js` |
