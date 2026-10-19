-- =============================================================================
-- COLORES PIZZA - CREACIÓN DE TABLA Y STORAGE DE PROMOCIONES EN SUPABASE
-- URL: https://rasisomlemuaxpxlzqsg.supabase.co
-- =============================================================================

-- 1. TABLA PUBLIC.PROMOCIONES
CREATE TABLE IF NOT EXISTS public.promociones (
    id_promo TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descuento NUMERIC(5,2) DEFAULT 0.0,
    descuento_porcentaje NUMERIC(5,2) DEFAULT 0.0,
    tipo TEXT NOT NULL DEFAULT 'descuento_directo',
    vigencia TEXT DEFAULT 'Todos los días',
    dias_vigentes TEXT DEFAULT 'Todos los días',
    activa BOOLEAN NOT NULL DEFAULT true,
    activo BOOLEAN NOT NULL DEFAULT true,
    descripcion TEXT,
    fecha_vencimiento TEXT,
    imagen_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SEGURIDAD Y PERMISOS RLS
ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS permitir_todo_promociones ON public.promociones;
CREATE POLICY permitir_todo_promociones ON public.promociones 
FOR ALL TO public 
USING (true) 
WITH CHECK (true);

-- 3. HABILITAR TIEMPO REAL (REALTIME)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'promociones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.promociones;
  END IF;
END $$;

-- 4. INSERTAR PROMOCIONES INICIALES CON IMÁGENES
INSERT INTO public.promociones (id_promo, nombre, descuento, descuento_porcentaje, tipo, vigencia, dias_vigentes, activa, activo, descripcion, fecha_vencimiento, imagen_url) VALUES
  ('p_1', 'Happy Hour 2x1 Tragos & Cervezas', 50, 50, 'happy_hour', 'Lun a Vie - 18 a 21hs', 'Lun a Vie - 18 a 21hs', true, true, 'Aplica a vinos seleccionados y bebidas de línea comercial', '2026-07-10', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80'),
  ('p_2', 'Combo Ejecutivo Colores Pizza', 20, 20, 'combo', 'Lun a Sab - Almuerzo', 'Lun a Sab - Almuerzo', true, true, 'Pizza grande de la casa + bebida sin alcohol con descuento integrado', '2026-07-25', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80'),
  ('p_3', '15% Off Pago Efectivo / Arqueo', 15, 15, 'descuento_directo', 'Todos los días - Completo', 'Todos los días - Completo', true, true, 'Descuento directo que aplica el cajero al cobrar en mostrador', NULL, 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&q=80'),
  ('p_4', '25% Especial Cumpleañeros', 25, 25, 'descuento_directo', 'Todos los días', 'Todos los días', false, false, 'Presentando documentación al mesero encargado', '2026-06-25', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500&q=80')
ON CONFLICT (id_promo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descuento = EXCLUDED.descuento,
  descuento_porcentaje = EXCLUDED.descuento_porcentaje,
  tipo = EXCLUDED.tipo,
  vigencia = EXCLUDED.vigencia,
  dias_vigentes = EXCLUDED.dias_vigentes,
  activa = EXCLUDED.activa,
  activo = EXCLUDED.activo,
  descripcion = EXCLUDED.descripcion,
  fecha_vencimiento = EXCLUDED.fecha_vencimiento,
  imagen_url = EXCLUDED.imagen_url;

-- 5. BUCKET DE SUPABASE STORAGE PARA IMÁGENES DE PROMOCIONES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promociones',
  'promociones',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Políticas de Storage para subir y ver imágenes públicamente
DROP POLICY IF EXISTS "Publico puede ver imagenes promociones" ON storage.objects;
CREATE POLICY "Publico puede ver imagenes promociones"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'promociones');

DROP POLICY IF EXISTS "Publico puede subir imagenes promociones" ON storage.objects;
CREATE POLICY "Publico puede subir imagenes promociones"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'promociones');

DROP POLICY IF EXISTS "Publico puede actualizar imagenes promociones" ON storage.objects;
CREATE POLICY "Publico puede actualizar imagenes promociones"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'promociones');

DROP POLICY IF EXISTS "Publico puede eliminar imagenes promociones" ON storage.objects;
CREATE POLICY "Publico puede eliminar imagenes promociones"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'promociones');

NOTIFY pgrst, 'reload schema';
