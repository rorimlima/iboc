import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: As variáveis de ambiente do Supabase não foram encontradas.");
  console.info("Certifique-se de configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu ambiente (ex: Vercel ou arquivo .env).");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
