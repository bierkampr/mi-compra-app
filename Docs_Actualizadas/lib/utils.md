# Utilidades — lib/utils.ts

> Fuente: `lib/utils.ts`
> Auditado: 2026-04-24
> Importado en: `app/page.tsx`, `app/components/DashboardView.tsx`

---

## Funciones

### compressImage(base64Str, photoCount): Promise<string>
Comprime imágenes adaptativamente para optimizarlas para visión IA.

**Parámetros:**
- `base64Str: string` - Imagen en Base64
- `photoCount: number` - Número de fotos (por defecto 1)

**Retorna:**
- `Promise<string>` - Imagen comprimida en Base64

**Estrategia:**
1. **Reducción de resolución:** Máximo 1000px en el lado más largo
2. **Reducción de calidad:** Empieza en 0.78, baja de 0.05 en 0.05 hasta 0.35
3. **Límite de tamaño:** Objetivo 110KB máximo
4. **Último recurso:** Si no puede reducir a 110KB, devuelve lo que tenga (con warning)

**Por qué:** Mejora la legibilidad para modelos de visión y reduce el tiempo de upload.

**Limites:**
- `MAX_SIDE_PX`: 1000
- `MAX_SIZE_KB`: 110
- `MIN_QUALITY`: 0.35
- `MIN_SIDE_PX`: 300

**Nota técnica:** Ejecuta en el hilo principal. Candidato para Web Worker en dispositivos de baja gama.

---

### normalizeStoreName(comercio): string
Normaliza nombres de comercios para agrupación en gráficos.

**Parámetros:**
- `comercio: string` - Nombre del comercio

**Retorna:**
- `string` - Nombre normalizado

**Ejemplos:**
- "MERCADONA S.A." → "MERCADONA"
- "LIDL SUPERMERCADOS" → "LIDL"
- "CARREFOUR EXPRESS" → "CARREFOUR"

---

## Integración

**En `app/components/ScannerView.tsx`:**
```typescript
import { compressImage } from '@/lib/utils';

const compressed = await compressImage(capturedImage, tempPhotos.length + 1);
setTempPhotos([...tempPhotos, compressed]);
```

**En `app/page.tsx`:**
```typescript
import { normalizeStoreName } from '@/lib/utils';

const porComercio = currentGastos.reduce((acc: Record<string, number>, g) => { 
  const nombreLimpio = normalizeStoreName(g.comercio);
  acc[nombreLimpio] = (acc[nombreLimpio] || 0) + Number(g.total); 
  return acc; 
}, {});
```

**En `app/components/DashboardView.tsx`:**
```typescript
import { normalizeStoreName } from '@/lib/utils';

// Usado para agrupar gastos por comercio en el gráfico
```
