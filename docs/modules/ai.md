# Módulo de Inteligencia Artificial

## Implementación
El cliente envía imágenes en Base64 a `/api/analyze` mediante `analyzeReceipt()` en `lib/gemini.ts` (Nota: se conservó el nombre gemini.ts por legado, pero usa Mistral/Groq).

## Interfaz de Respuesta Esperada (JSON)
```json
{
  "comercio": "string",
  "fecha": "DD/MM/AAAA",
  "total": number,
  "productos":[
    { "cantidad": number, "nombre_ticket": "string", "nombre_base": "string", "subtotal": number }
  ]
}
```

## Fusión de Tickets Largos
Si un ticket es largo, el cliente envía hasta 3 imágenes. El servidor las procesa en paralelo usando Mistral Vision, concatena el texto, y se lo pasa a Groq con la instrucción estricta de "UNIR en un solo JSON sin duplicar solapamientos".
