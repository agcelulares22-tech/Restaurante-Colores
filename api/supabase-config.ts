import type { VercelRequest, VercelResponse } from '../server/vercel';
import { getServerSupabaseConfig } from '../server/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const { url, key } = getServerSupabaseConfig();
  if (!url || !key) {
    return res.status(503).json({ error: 'Supabase no está configurado en el servidor.' });
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key });
}
