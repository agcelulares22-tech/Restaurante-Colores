import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEFAULT_SUPABASE_URL = 'https://rasisomlemuaxpxlzqsg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2lzb21sZW11YXhweGx6cXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MTE5ODcsImV4cCI6MjEwNzk4Nzk4N30.ZhCJsDu-SGZxwIOM0pwL2mZotsBjwwJuId0uD8HlG8M';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  return res.status(200).json({
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
  });
}
