# 🔌 API Reference

Mi Compra App's internal API is designed for specialized server-side operations that require secrets or complex logic.

## 🤖 AI Analysis API

### `POST /api/analyze`
Processes one or more receipt images and returns a structured JSON object.

-   **Auth Required**: No (handled internally via environment variables).
-   **Parameters**:
    -   `images`: `string[]` (Array of Base64-encoded image strings).
    -   `prompt`: `string` (Custom instructions for the AI).
    -   `mode`: `"manual" | "super"` (Analysis mode).
-   **Response**:
    ```json
    {
      "comercio": "string",
      "fecha": "DD/MM/AAAA",
      "total": number,
      "productos": [
        {
          "cantidad": number,
          "nombre_ticket": "string",
          "nombre_base": "string",
          "subtotal": number
        }
      ]
    }
    ```
-   **Error Codes**:
    -   `400`: Invalid input (no images, too many images).
    -   `500`: AI service failure or configuration missing.

## 🔑 Authentication API

### `POST /api/auth/token`
Exchanges a Google OAuth2 authorization code for access and refresh tokens.

-   **Parameters**:
    -   `code`: `string` (Authorization code from Google).
-   **Response**: Standard Google OAuth2 token response (Access Token, Refresh Token, Expires In).

### `POST /api/auth/refresh`
Uses a refresh token to obtain a new access token.

-   **Parameters**:
    -   `refresh_token`: `string`.
-   **Response**: Standard Google OAuth2 refresh response (Access Token, Expires In).

## ⚠️ Error Handling

The API generally returns errors in the following format:
```json
{
  "error": "Descriptive error message"
}
```
If an AI rate limit is hit, the server-side logic automatically manages reattempts with a fallback strategy before returning an error.
