import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEFAULT_SUPABASE_URL = 'https://msmaksbtetcmoaiyywto.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbWFrc2J0ZXRjbW9haXl5d3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDA5ODgsImV4cCI6MjA4OTIxNjk4OH0.Qvw26EVpCyyYS631WZ3T6LN3x__4xFliYvfSjZJCmsc';

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
