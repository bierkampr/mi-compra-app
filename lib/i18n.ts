/* --- ARCHIVO: lib/i18n.ts --- */
import es from '../locales/es.json';
import en from '../locales/en.json';

/**
 * Diccionario de traducciones que importa los archivos JSON externos.
 * Esto permite que el código sea agnóstico al contenido de los textos.
 */
const translations: any = { es, en };

/**
 * Detecta el idioma preferido del sistema o navegador.
 * @returns 'es' o 'en' dependiendo de la configuración del usuario.
 */
export const getSystemLanguage = (): string => {
  if (typeof window === 'undefined') return 'es';
  
  // navigator.language suele devolver algo como "es-ES" o "en-US"
  // Dividimos por el guion para quedarnos solo con el código de idioma ("es" o "en")
  const lang = navigator.language.split('-')[0];
  
  // Si el idioma detectado existe en nuestro diccionario, lo devolvemos;
  // de lo contrario, devolvemos 'es' por defecto.
  return translations[lang] ? lang : 'es';
};

/**
 * Función principal de traducción (Translate).
 * @param path Cadena con puntos que indica la ruta en el JSON (ej: 'auth.title')
 * @param lang El idioma actual seleccionado en la aplicación ('es' o 'en')
 * @returns El texto traducido o la ruta en mayúsculas si no se encuentra.
 */
export const t = (path: string, lang: string): string => {
  if (!path) return "";
  
  const keys = path.split('.');
  
  // Seleccionamos el objeto de traducción correspondiente al idioma, 
  // cayendo siempre en español como idioma de respaldo (fallback).
  let result = translations[lang] || translations['es'];

  // Navegamos recursivamente por el objeto usando las llaves del path
  for (const key of keys) {
    if (result && result[key] !== undefined) {
      result = result[key];
    } else {
      // Si en algún punto la llave no existe, registramos el error en consola
      // y devolvemos la ruta solicitada para identificar el error visualmente.
      console.warn(`[i18n] Error: No se encontró la llave "${path}" para el idioma "${lang}"`);
      return path.toUpperCase(); 
    }
  }

  return result;
};