-- ============================================================================
-- Migración: tabla delivery + delivery_zonas para el KDS de Colores Pizza
-- Stack: Supabase PostgreSQL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla de zonas de envío
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_zonas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  precio_fijo     NUMERIC(12,2) NOT NULL DEFAULT 0,
  color_hex       TEXT DEFAULT '#E8B800',
  descripcion     TEXT,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.delivery_zonas IS 'Zonas de cobertura para delivery con precio fijo';

-- ----------------------------------------------------------------------------
-- 2. Tabla delivery vinculada a pedidos_cabecera
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id           INTEGER NOT NULL REFERENCES public.pedidos_cabecera(id_pedido) ON DELETE CASCADE,
  direccion           TEXT NOT NULL,
  zona_id             UUID REFERENCES public.delivery_zonas(id) ON DELETE SET NULL,
  precio_envio        NUMERIC(12,2) NOT NULL DEFAULT 0,
  telefono_contacto   TEXT,
  notas               TEXT,
  estado              TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente','preparando','en_ruta','entregado','cancelado')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.delivery IS 'Información de envío a domicilio vinculada a cada pedido';

-- Índice para performance al buscar por pedido
CREATE INDEX IF NOT EXISTS idx_delivery_pedido_id ON public.delivery(pedido_id);
CREATE INDEX IF NOT EXISTS idx_delivery_zona_id  ON public.delivery(zona_id);

-- ----------------------------------------------------------------------------
-- 3. Función/trigger para updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delivery_updated_at ON public.delivery;
CREATE TRIGGER trg_delivery_updated_at
  BEFORE UPDATE ON public.delivery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. RLS policies
-- ----------------------------------------------------------------------------
ALTER TABLE public.delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zonas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_select_all" ON public.delivery;
CREATE POLICY "delivery_select_all"
  ON public.delivery FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "delivery_insert_all" ON public.delivery;
CREATE POLICY "delivery_insert_all"
  ON public.delivery FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "delivery_update_all" ON public.delivery;
CREATE POLICY "delivery_update_all"
  ON public.delivery FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "delivery_delete_all" ON public.delivery;
CREATE POLICY "delivery_delete_all"
  ON public.delivery FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "delivery_zonas_select_all" ON public.delivery_zonas;
CREATE POLICY "delivery_zonas_select_all"
  ON public.delivery_zonas FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "delivery_zonas_insert_all" ON public.delivery_zonas;
CREATE POLICY "delivery_zonas_insert_all"
  ON public.delivery_zonas FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "delivery_zonas_update_all" ON public.delivery_zonas;
CREATE POLICY "delivery_zonas_update_all"
  ON public.delivery_zonas FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "delivery_zonas_delete_all" ON public.delivery_zonas;
CREATE POLICY "delivery_zonas_delete_all"
  ON public.delivery_zonas FOR DELETE
  USING (true);

-- ----------------------------------------------------------------------------
-- 5. Datos de ejemplo (opcional - borrar si no se desean)
-- ----------------------------------------------------------------------------
INSERT INTO public.delivery_zonas (nombre, precio_fijo, color_hex, descripcion)
VALUES
  ('Zona Centro',      500,  '#E8B800', 'Centro de Río Cuarto'),
  ('Zona Sur',         800,  '#E85D00', 'Barrio Alberdi, Centro Sur'),
  ('Zona Norte',       900,  '#D42B2B', 'Barrio Ciudadela, Villa Nueva'),
  ('Zona Oeste',       1000, '#2D3436', 'Bº 25 de Mayo, San Martín'),
  ('Zona Este',        1000, '#2D3436', 'Bº Sarmiento, Urca')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. Vista resumida para el KDS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_pedidos_kds AS
SELECT
  pc.id_pedido,
  pc.numero_mesa,
  pc.mozo,
  pc.estado_comanda,
  pc.origen,
  pc.observaciones,
  pc.fecha_hora,
  pc.minutos_transcurridos,
  d.id                AS delivery_id,
  d.direccion         AS delivery_direccion,
  d.telefono_contacto AS delivery_telefono,
  d.notas             AS delivery_notas,
  d.estado            AS delivery_estado,
  COALESCE(dz.precio_fijo, d.precio_envio, 0) AS precio_delivery,
  dz.nombre           AS delivery_zona,
  dz.color_hex        AS delivery_color
FROM public.pedidos_cabecera pc
LEFT JOIN public.delivery d ON d.pedido_id = pc.id_pedido
LEFT JOIN public.delivery_zonas dz ON dz.id = d.zona_id;

COMMENT ON VIEW public.vw_pedidos_kds IS 'Vista unificada de pedidos + delivery para el KDS';
