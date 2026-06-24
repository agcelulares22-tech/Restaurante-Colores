-- ============================================================================
-- Migración: Actualizar restricción chk_estado_comanda en pedidos_cabecera
-- Stack: Supabase PostgreSQL
-- ============================================================================

-- 1. Eliminar la restricción de comprobación anterior si existe
ALTER TABLE public.pedidos_cabecera 
    DROP CONSTRAINT IF EXISTS chk_estado_comanda;

-- 2. Volver a crear la restricción para incluir la totalidad de los estados del frontend
ALTER TABLE public.pedidos_cabecera 
    ADD CONSTRAINT chk_estado_comanda 
    CHECK (estado_comanda IN ('abierta', 'pendiente', 'en_cocina', 'listo', 'entregado', 'entregado_cobrado', 'cancelado'));

COMMENT ON CONSTRAINT chk_estado_comanda ON public.pedidos_cabecera 
    IS 'Restricción de los estados válidos para el ciclo de vida de una comanda';
