-- Migración: Creación de tabla pedidos_delivery_rapido y habilitación de publicación Realtime
-- Fecha: 2026-06-27

-- 1. Crear tabla pedidos_delivery_rapido si no existe
CREATE TABLE IF NOT EXISTS public.pedidos_delivery_rapido (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_cliente TEXT NOT NULL,
    pedido TEXT NOT NULL,
    direccion TEXT NOT NULL,
    telefono TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'horno', 'delivery', 'entregado')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Habilitar RLS y políticas públicas para pedidos_delivery_rapido
ALTER TABLE public.pedidos_delivery_rapido ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS permitir_todo_demo_delivery_rapido ON public.pedidos_delivery_rapido;
CREATE POLICY permitir_todo_demo_delivery_rapido ON public.pedidos_delivery_rapido FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. Habilitar la publicación en tiempo real (Realtime) para las tablas transaccionales de sincronización simultánea
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pedidos_cabecera'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos_cabecera;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pedido_detalle'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedido_detalle;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mesas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mesas;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pedidos_delivery_rapido'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos_delivery_rapido;
  END IF;
END $$;
