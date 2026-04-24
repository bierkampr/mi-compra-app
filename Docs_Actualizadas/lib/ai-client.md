# Cliente IA — lib/ai-client.ts

> Fuente: `lib/ai-client.ts`
> Auditado: 2026-04-24
> Importado en: `app/page.tsx`

---

## Resumen

Cliente fetch que envía imágenes al pipeline de IA distribuido del servidor.
No hace procesamiento local de IA - solo envía y recibe.

---

## Función Principal

### analyzeReceipt(images, mode, customPrompt): Promise<any>

**Parámetros:**
- `images: string[]` - Array de imágenes en Base64
- `mode: string` - Modo de escaneo ('super', 'mini', 'dining', 'manual', etc.)
- `customPrompt: string` - Prompt personalizado (categoría del comercio)

**Retorna:**
```typescript
{
  comercio: string;
  fecha: string;
  total: number;
  productos: Array<{
    cantidad: number;
    nombre_ticket: string;
    nombre_base: string;
    subtotal: number;
  }>;
}
```

---

## Flujo

### Modo Manual
Si `mode === 'manual'`, devuelve estructura vacía sin llamar a la API:
```javascript
{
  comercio: "INGRESO MANUAL",
  fecha: new Date().toLocaleDateString("es-ES"),
  total: 0,
  productos: []
}
```

### Modo IA
1. Valida que `images` sea un array no vacío
2. Hace `POST /api/analyze` con:
   - `images`: array de base64
   - `prompt`: customPrompt
   - `mode`: mode
3. Si el servidor responde con error, lanza excepción
4. Aplica normalización de seguridad al resultado

---

## Normalización de Seguridad

Antes de devolver el resultado:
- `comercio`: `.toUpperCase().trim()`, fallback "DESCONOCIDO"
- `fecha`: fallback fecha de hoy
- `total`: `Number()`, fallback 0
- `productos[].cantidad`: fallback 1
- `productos[].nombre_ticket`: fallback "PRODUCTO"
- `productos[].nombre_base`: fallback nombre_ticket o "PRODUCTO"
- `productos[].subtotal`: fallback 0

---

## Integración

**En `app/page.tsx`:**
```typescript
import { analyzeReceipt } from '@/lib/ai-client';

const res = await analyzeReceipt(images, purchaseMode || 'super', promptFinal);
setPendingGasto({ ...res, tempImages: tempPhotos, usedList: useList });
```

---

## Error Handling

- Si no hay imágenes válidas → lanza error descriptivo
- Si el servidor responde con error → lanza error con mensaje del servidor
- Si hay error de red → lanza error genérico

Todos los errores se capturan en `page.tsx` y se muestran como `alert()`.
