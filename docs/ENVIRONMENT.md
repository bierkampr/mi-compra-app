# 🌍 Environment Variables

Mi Compra App requires several API keys and configuration values to function correctly. These are divided into **Public** variables (prefixed with `NEXT_PUBLIC_`) and **Secret** variables (server-side only).

## 📋 Required Variables

### Authentication (Google Cloud)
-   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: **Public**. The client ID for your Google OAuth2 application.
-   `GOOGLE_CLIENT_SECRET`: **Secret**. The client secret for your Google OAuth2 application. Used in `app/api/auth/`.

### Database (Supabase)
-   `NEXT_PUBLIC_SUPABASE_URL`: **Public**. Your Supabase project URL.
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: **Public**. Your Supabase anonymous API key.

### AI Pipeline (Vision & Synthesis)
The AI pipeline supports up to 5 keys per service for rotation and high availability.

-   **Mistral AI (Vision)**:
    -   `MISTRAL_API_KEY`: Primary API key.
    -   `MISTRAL_API_KEY_1` to `MISTRAL_API_KEY_5`: Fallback/rotation keys.
-   **Groq (Synthesis)**:
    -   `GROQ_API_KEY`: Primary API key.
    -   `GROQ_API_KEY_1` to `GROQ_API_KEY_5`: Fallback/rotation keys.
-   **Google Gemini (Alternative Vision)**:
    -   `GEMINI_API_KEY`: Required if using `lib/gemini.ts`.

## 📄 `.env.local` Example

```env
# GOOGLE AUTH
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI - MISTRAL (Transcription)
MISTRAL_API_KEY=your_mistral_key_primary
MISTRAL_API_KEY_1=another_mistral_key

# AI - GROQ (Synthesis)
GROQ_API_KEY=your_groq_key_primary
GROQ_API_KEY_1=another_groq_key

# AI - GEMINI (Secondary Vision)
GEMINI_API_KEY=your_gemini_key
```

## 🔐 Security Notes
1.  **Never commit `.env` files**: Ensure `.env.local`, `.env.development`, and `.env.production` are in your `.gitignore`.
2.  **Vercel Deployment**: When deploying to Vercel, add these variables in the "Environment Variables" section of your project settings.
3.  **Rotation Logic**: The app will automatically detect any variable following the `SERVICE_API_KEY_N` pattern and include it in the rotation cycle.
