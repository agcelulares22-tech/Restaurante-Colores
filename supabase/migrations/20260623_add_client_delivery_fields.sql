-- ============================================================================
-- Migración: Agregar columnas de datos de cliente a pedidos_cabecera
-- Stack: Supabase PostgreSQL
-- ============================================================================

ALTER TABLE public.pedidos_cabecera ADD COLUMN IF NOT EXISTS nombre_cliente TEXT;
ALTER TABLE public.pedidos_cabecera ADD COLUMN IF NOT EXISTS telefono_cliente TEXT;
ALTER TABLE public.pedidos_cabecera ADD COLUMN IF NOT EXISTS direccion_cliente TEXT;
ALTER TABLE public.pedidos_cabecera ADD COLUMN IF NOT EXISTS costo_envio NUMERIC;
ALTER TABLE public.pedidos_cabecera ADD COLUMN IF NOT EXISTS zona_envio_id BIGINT;

COMMENT ON COLUMN public.pedidos_cabecera.nombre_cliente IS 'Nombre y apellido del cliente de delivery';
COMMENT ON COLUMN public.pedidos_cabecera.telefono_cliente IS 'Número de teléfono de contacto para el delivery';
COMMENT ON COLUMN public.pedidos_cabecera.direccion_cliente IS 'Dirección exacta del domicilio en Río Cuarto, Córdoba';
COMMENT ON COLUMN public.pedidos_cabecera.costo_envio IS 'Costo calculado o asignado para el envío a domicilio';
COMMENT ON COLUMN public.pedidos_cabecera.zona_envio_id IS 'ID de la zona de envío asociada en la tabla zonas_envio';
