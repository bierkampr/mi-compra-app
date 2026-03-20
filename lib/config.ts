/* --- ARCHIVO: lib/config.ts --- */

/**
 * Identificador de cliente para la autenticación con Google.
 * Este ID es público por naturaleza en el flujo OAuth2.
 */
export const CLIENT_ID = "384386855540-b9gs1nuqt7jnd61bnh4881a7bk9ldcp1.apps.googleusercontent.com";

/**
 * Nombre del archivo JSON que se guarda de forma privada
 * en el espacio AppData del Google Drive del usuario.
 */
export const FILE_NAME = "mi_compra_data.json";

/**
 * Configuración de Supabase (Catálogo Global y Precios).
 * Se leen de variables de entorno para evitar exposición en el código fuente.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * NOTA DE SEGURIDAD:
 * Las claves de API de IA se gestionan exclusivamente en \'app/api/analyze/route.ts\'
 * utilizando process.env del lado del servidor para máxima protección (ej: MISTRAL_API_KEY).
 */
