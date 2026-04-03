---
title: Postmortem — Intento de IA Descentralizada (BYOI con Google OAuth)
date: 2026-04-03
status: CANCELADO — Inviable técnicamente
---

# Postmortem: Intento de Migración a IA Descentralizada (BYOI)

## Objetivo Original

Migrar el pipeline de IA desde un modelo centralizado (API Keys propias de Mistral/Groq en el servidor) a un modelo **"Bring Your Own Identity" (BYOI)** donde:

- Cada usuario usaría su propia cuota gratuita de Google AI (Gemini)
- El desarrollador no pagaría nada, sin importar cuántos usuarios haya
- El proceso sería 100% automático — el usuario solo hace login con Google y ya

```
Usuario → Login Google OAuth2
       → Access Token del usuario
       → Backend usa ese token para llamar a Gemini
       → Gemini consume cuota personal del usuario
       → El desarrollador no paga nada
```

**Motivación:** Las API Keys propias de Mistral/Groq tienen cuota limitada. Para un lanzamiento público con muchos usuarios, una sola key no es viable sin pagar.

---

## Por Qué Falló — Explicación Técnica Definitiva

### El problema central

Google tiene **dos productos Gemini distintos con arquitecturas de autenticación incompatibles**:

| Producto | Endpoint | Autenticación |
|---|---|---|
| **Google AI Studio** (gratuito) | `generativelanguage.googleapis.com` | **Solo API Keys** |
| **Vertex AI** (enterprise) | `aiplatform.googleapis.com` | OAuth2 + Service Accounts |

La app usaba el endpoint de **Google AI Studio** (gratuito), que **no acepta tokens OAuth de usuario**.

### Los scopes que intentamos y por qué fallaron

#### Intento 1: `generative-language`
```
https://www.googleapis.com/auth/generative-language
```
**Error:** `Error 400: invalid_scope`  
**Por qué:** El scope no estaba declarado en el OAuth Consent Screen. Al agregarlo al Consent Screen, aparecía como **scope restringido** — requiere verificación formal de Google (proceso que tarda semanas y requiere revisión de la app).

#### Intento 2: `generative-language.peruserquota`
```
https://www.googleapis.com/auth/generative-language.peruserquota
```
**Error:** Login OK, pero Gemini devuelve `403 AI_PERMISSION_DENIED`  
**Por qué:** Este scope existe para **atribución de cuota** interna de Google, no para autenticar llamadas al API. Tener este scope en el token no autoriza a llamar a `generativelanguage.googleapis.com`.

#### Intento 3: Scopes de la documentación oficial
Según la doc de Google AI, los scopes válidos para Gemini son:
- `https://www.googleapis.com/auth/cloud-platform` → Scope extremadamente amplio (acceso a toda la nube de Google). Restringido, requiere verificación.
- `https://www.googleapis.com/auth/generative-language.retriever` → Solo para la API de Semantic Retrieval, no para generación de contenido.

**Conclusión:** No existe ningún scope OAuth2 estándar que permita a una web app pública llamar al endpoint gratuito de Gemini con el token del usuario.

### Por qué Vertex AI tampoco sirve

Vertex AI sí acepta OAuth2 de usuario, pero:
- Requiere activar **billing** en Google Cloud (tarjeta de crédito obligatoria)
- Los costos son por token, no hay free tier para generación de contenido
- La arquitectura es mucho más compleja

---

## Cronología de Errores

```
1. Se implementó BYOI completo con scope generative-language
   → Error 400: invalid_scope (scope no en Consent Screen)

2. Se removió el scope (solución incorrecta)
   → La app funcionó pero sin IA (AI_PERMISSION_DENIED al escanear)

3. Se agregó generative-language.peruserquota al Consent Screen
   → Login OK, Gemini devuelve 403

4. Se investigó la documentación oficial de Google AI
   → Confirmado: generativelanguage.googleapis.com no acepta OAuth de usuario

5. Se revirtió todo al pipeline original Mistral + Groq
```

---

## Lecciones Aprendidas

### 1. Verificar autenticación ANTES de diseñar la arquitectura
Antes de planificar cualquier integración con una API externa, verificar explícitamente en la documentación oficial:
- ¿Qué métodos de autenticación acepta el endpoint específico?
- ¿API Key? ¿OAuth? ¿Service Account?
- ¿Qué scopes son necesarios y están disponibles para apps web públicas?

### 2. Google AI Studio ≠ Vertex AI
Son productos distintos con autenticación distinta. El endpoint gratuito (`generativelanguage.googleapis.com`) solo acepta API Keys. El endpoint OAuth es el de Vertex AI y tiene costo.

### 3. Los scopes OAuth de Google Cloud son "restringidos" para apps públicas
Los scopes de Google Cloud Platform (incluyendo Gemini) están clasificados como **Restricted** y requieren:
- App verificada por Google
- Proceso de revisión de seguridad
- Solo aplicable a Workspace/enterprise en muchos casos

Para apps de consumidor (usuarios externos), estos scopes no están disponibles sin verificación.

### 4. "Gratis per-usuario automático" no existe para LLMs
No existe ningún servicio de IA que ofrezca quota per-usuario gratuita de forma completamente automática sin que el usuario configure nada. Las opciones reales son:
- **Un API Key del desarrollador** compartida (con limite de cuota total)
- **API Key del usuario** (el usuario la configura una vez)
- **Pagar** (modelos de suscripción o pay-per-use)

---

## Estado Actual

La app volvió al pipeline original:

```
Imagen → Mistral Pixtral (visión/OCR) → Groq LLaMA (síntesis JSON)
```

Variables necesarias en `.env.local` y Vercel:
```
MISTRAL_API_KEY=...
GROQ_API_KEY=...
```

Soporte para múltiples keys rotadas:
```
MISTRAL_API_KEY_1=...
MISTRAL_API_KEY_2=...
GROQ_API_KEY_1=...
GROQ_API_KEY_2=...
```

---

## Opciones Futuras para Escalar (si se necesita)

Si en el futuro se necesita escalar más allá del free tier de Mistral/Groq:

| Opción | Complejidad | Costo para el dev | Experiencia usuario |
|---|---|---|---|
| Rotar múltiples keys (cuentas distintas) | Baja | $0 | Transparente |
| Usuario pega su Gemini API Key (1 vez) | Media | $0 | 30 seg setup |
| Modelo Freemium (X scans/mes gratis) | Alta | Bajo | Profesional |
| Vertex AI con billing | Alta | Variable | Transparente |

La opción más recomendada para un lanzamiento real es **múltiples keys rotadas** o **modelo freemium**.
