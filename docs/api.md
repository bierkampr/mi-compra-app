# Rutas API (Servidor)

## 1. POST `/api/analyze/route.ts`
**Propósito:** Pipeline de IA distribuido para procesar fotos de tickets.
- **Fase A (Visión):** Usa **Mistral** (pixtral-large-latest) para transcribir fotos. Soporta hasta 3 fotos y las une. Tiene sistema de rotación de claves (`MISTRAL_API_KEY_1`, etc.).
- **Fase B (Razonamiento):** Usa **Groq** (llama-3.3-70b-versatile) para transformar la transcripción de Mistral en un JSON estructurado con comercios, totales y lista de productos.

## 2. Autenticación (`/api/auth/token` y `/api/auth/refresh`)
- Permiten ocultar el `GOOGLE_CLIENT_SECRET` en el servidor.
- Intercambian el código OAuth del cliente por `access_token` y `refresh_token` para acceder a Google Drive.
