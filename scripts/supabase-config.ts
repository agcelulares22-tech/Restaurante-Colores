import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';

export const createScriptSupabaseClient = () => {
  const env = loadEnv('development', process.cwd(), '');
  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim();
  const key = (
    env.SUPABASE_PUBLISHABLE_KEY
    || env.SUPABASE_ANON_KEY
    || env.VITE_SUPABASE_PUBLISHABLE_KEY
    || env.VITE_SUPABASE_ANON_KEY
    || ''
  ).trim();

  if (!url || !key) {
    throw new Error('Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local.');
  }

  return { url, key, supabase: createClient(url, key) };
};
