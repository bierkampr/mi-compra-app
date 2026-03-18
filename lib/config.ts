/* --- ARCHIVO: lib/config.ts --- */

// Client ID de Google para la autenticación
export const CLIENT_ID = "384386855540-b9gs1nuqt7jnd61bnh4881a7bk9ldcp1.apps.googleusercontent.com";

// Cargamos las llaves desde el entorno de ejecución (process.env)
// En Vercel se configuran en el Dashboard. Localmente en .env.local
export const MISTRAL_API_KEY = process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""; 

// Nombre del archivo en Google Drive
export const FILE_NAME = "mi_compra_data.json";

// Configuración de Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";