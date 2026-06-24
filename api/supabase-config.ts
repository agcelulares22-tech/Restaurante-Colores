import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEFAULT_SUPABASE_URL = 'https://sqczmyaoqplrmrgyczjy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxY3pteWFvcXBscm1yZ3ljemp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzQ5NzQsImV4cCI6MjA5Njg1MDk3NH0.R5bPwot9KCMJ9OXWcokL705ZD7_0ujH9fGY_GcqxjYY';

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
