-- Migration: Create lotes_insumo table for batch tracking and expiration alerts
CREATE TABLE IF NOT EXISTS public.lotes_insumo (
    id_lote TEXT PRIMARY KEY,
    id_insumo TEXT NOT NULL REFERENCES public.insumos(id_insumo) ON DELETE CASCADE,
    cantidad NUMERIC NOT NULL DEFAULT 0.0,
    fecha_vencimiento DATE NOT NULL,
    creado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and create policy for public demo access
ALTER TABLE public.lotes_insumo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS permitir_todo_demo_lotes_insumo ON public.lotes_insumo;
CREATE POLICY permitir_todo_demo_lotes_insumo ON public.lotes_insumo FOR ALL TO public USING (true) WITH CHECK (true);
