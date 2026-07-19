import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(410).json({
    error: 'Endpoint retirado. Los cambios de comandas requieren Supabase Auth y políticas RLS.',
  });
}
