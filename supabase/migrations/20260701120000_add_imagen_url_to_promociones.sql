-- 1. Agregar columna imagen_url a la tabla de promociones
ALTER TABLE public.promociones ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- 2. Asegurar que exista el bucket 'promociones' en storage
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
