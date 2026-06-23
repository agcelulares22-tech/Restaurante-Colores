-- ============================================================================
-- Migración: Agregar columnas de plano y diseño a la tabla public.mesas
-- ============================================================================

ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS capacidad INTEGER DEFAULT 4;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS zona TEXT DEFAULT 'salon';
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT 'salon';
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS x NUMERIC;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS y NUMERIC;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS width NUMERIC;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS rx NUMERIC DEFAULT 6;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS forma TEXT DEFAULT 'redonda';
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES public.mesas(id_mesa) ON DELETE SET NULL;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS mesas_unidas INTEGER[] DEFAULT '{}';
