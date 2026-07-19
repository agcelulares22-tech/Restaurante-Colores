import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest } from './vercel';

export interface ServerSupabaseConfig {
  url: string;
  key: string;
}

const readEnv = (...names: string[]): string => {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return '';
};

export const getServerSupabaseConfig = (): ServerSupabaseConfig => ({
  url: readEnv('SUPABASE_URL', 'VITE_SUPABASE_URL'),
  key: readEnv('SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY'),
});

export const createRequestSupabaseClient = (req?: VercelRequest): SupabaseClient => {
  const { url, key } = getServerSupabaseConfig();
  if (!url || !key) {
    throw new Error('Supabase configuration missing on process.env');
  }

  const authorization = req?.headers.authorization;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    ...(authorization ? { global: { headers: { Authorization: authorization } } } : {}),
  });
};
