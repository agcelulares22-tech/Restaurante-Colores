import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Endpoint legado deshabilitado: recibía certificado y clave privada desde el
 * navegador. La integración vigente y autenticada vive en /api/arca.
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({ error: 'Endpoint deshabilitado. Utilice /api/arca.' });
}
