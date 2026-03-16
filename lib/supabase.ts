import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Si las variables no existen, ponemos strings vacíos para que no rompa el build
// Pero en Vercel funcionará porque las tomará de las "Environment Variables"
const supabaseUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);