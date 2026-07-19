import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(410).json({
    error: 'Endpoint retirado. Las comandas se sincronizan mediante Supabase Auth y RLS desde la aplicación.',
  });
}
