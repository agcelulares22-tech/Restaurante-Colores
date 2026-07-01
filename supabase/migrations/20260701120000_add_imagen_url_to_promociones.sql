-- 1. Agregar columna imagen_url y vigencia a la tabla de promociones si no existen
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS vigencia TEXT;

-- 2. Asegurar que exista el bucket público 'promociones' en storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('promociones', 'promociones', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Crear políticas RLS para permitir accesos a la carpeta de promociones
DROP POLICY IF EXISTS "Acceso publico de lectura a promociones" ON storage.objects;
CREATE POLICY "Acceso publico de lectura a promociones"
ON storage.objects FOR SELECT
USING (bucket_id = 'promociones');

DROP POLICY IF EXISTS "Permitir subidas de promociones a todos" ON storage.objects;
CREATE POLICY "Permitir subidas de promociones a todos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'promociones');

DROP POLICY IF EXISTS "Permitir actualizar promociones a todos" ON storage.objects;
CREATE POLICY "Permitir actualizar promociones a todos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'promociones');

DROP POLICY IF EXISTS "Permitir borrar promociones a todos" ON storage.objects;
CREATE POLICY "Permitir borrar promociones a todos"
ON storage.objects FOR DELETE
USING (bucket_id = 'promociones');

-- 4. Sembrar promociones iniciales en la base de datos (con las imágenes de la firma original)
INSERT INTO public.promociones (id_promo, nombre, descripcion, descuento, activa, imagen_url)
VALUES 
(
  'p_1', 
  'Pizza "Mega Colores" Llaxta', 
  'Masa aireada fermentada por 48hs al carbón activo, doble muzzarella fundida, panceta ahumada caramelizada, morrones al fuego y aceitunas seleccionadas.', 
  20, 
  true, 
  '/images/pizza_usuario.jpg'
),
(
  'p_2', 
  'Empanada "Criolla Explosiva"', 
  'Horneada al barro y leña de espinillo. Rellena de lomo cortado a cuchillo, rehogada a mano con cebolla de verdeo dulce y huevo picado.', 
  15, 
  true, 
  '/images/empanadas_usuario.jpg'
),
(
  'p_3', 
  'Calzone "Bastardo"', 
  'Masa rústica artesanal rellena generosamente con jamón cocido seleccionado, muzzarella, hongos salteados al malbec y gratinado de provolone.', 
  25, 
  true, 
  '/images/calzone_usuario.jpg'
)
ON CONFLICT (id_promo) DO NOTHING;
