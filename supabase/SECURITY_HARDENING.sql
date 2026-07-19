-- Endurecimiento manual para producción.
-- Requisito: crear primero al menos un usuario en Supabase Auth cuyo email
-- coincida con usuarios.username y cuyo rol en public.usuarios sea superadmin.
-- El bloque aborta toda la transacción si no puede vincular ese superadmin.

BEGIN;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.usuarios AS u
SET auth_user_id = au.id
FROM auth.users AS au
WHERE u.auth_user_id IS NULL
  AND lower(trim(u.username)) = lower(trim(au.email));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE auth_user_id IS NOT NULL
      AND activo IS TRUE
      AND rol = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'No hay un superadmin vinculado con Supabase Auth. No se modificó ninguna política.';
  END IF;
END
$$;

-- Las contraseñas se administran exclusivamente con Supabase Auth.
UPDATE public.usuarios SET password = NULL WHERE password IS NOT NULL;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'contrasena'
  ) THEN
    EXECUTE 'UPDATE public.usuarios SET contrasena = NULL WHERE contrasena IS NOT NULL';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.current_restaurant_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol
  FROM public.usuarios
  WHERE auth_user_id = auth.uid()
    AND activo IS TRUE
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_restaurant_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_restaurant_role() TO authenticated;

DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
  secured_tables TEXT[] := ARRAY[
    'categorias', 'usuarios', 'mesas', 'insumos', 'productos_menu',
    'recetas_escandallo', 'pedidos_cabecera', 'pedido_detalle', 'mermas',
    'cierres_caja', 'movimientos_inventario', 'clientes', 'configuracion',
    'registro_asistencia', 'lotes_insumo', 'auditoria_eventos', 'proveedores',
    'promociones', 'reservas', 'facturas', 'pagos', 'backups',
    'historial_costos_insumos', 'movimientos_caja_chica',
    'pedidos_delivery_rapido', 'delivery', 'delivery_zonas'
  ];
BEGIN
  FOREACH table_name IN ARRAY secured_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    FOR policy_name IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
    END LOOP;

    IF table_name = 'usuarios' THEN
      EXECUTE 'CREATE POLICY usuarios_lectura ON public.usuarios FOR SELECT TO authenticated USING (
        auth_user_id = auth.uid() OR public.current_restaurant_role() IN (''administrador'', ''superadmin'')
      )';
      EXECUTE 'CREATE POLICY usuarios_gestion ON public.usuarios FOR ALL TO authenticated USING (
        public.current_restaurant_role() IN (''administrador'', ''superadmin'')
      ) WITH CHECK (
        public.current_restaurant_role() IN (''administrador'', ''superadmin'')
      )';
    ELSIF table_name IN ('configuracion', 'backups') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (
        public.current_restaurant_role() IN (''administrador'', ''superadmin'')
      ) WITH CHECK (
        public.current_restaurant_role() IN (''administrador'', ''superadmin'')
      )', table_name || '_gestion', table_name);
    ELSIF table_name = 'auditoria_eventos' THEN
      EXECUTE 'CREATE POLICY auditoria_lectura ON public.auditoria_eventos FOR SELECT TO authenticated USING (
        public.current_restaurant_role() IN (''administrador'', ''superadmin'')
      )';
      EXECUTE 'CREATE POLICY auditoria_alta ON public.auditoria_eventos FOR INSERT TO authenticated WITH CHECK (
        public.current_restaurant_role() IS NOT NULL
      )';
    ELSE
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (
        public.current_restaurant_role() IS NOT NULL
      ) WITH CHECK (
        public.current_restaurant_role() IS NOT NULL
      )', table_name || '_autenticados', table_name);
    END IF;
  END LOOP;
END
$$;

-- La carta pública puede consultar catálogo y promociones, pero nunca escribir.
CREATE POLICY categorias_publicas ON public.categorias FOR SELECT TO anon USING (activa IS TRUE);
CREATE POLICY productos_publicos ON public.productos_menu FOR SELECT TO anon USING (activo IS TRUE);
CREATE POLICY promociones_publicas ON public.promociones FOR SELECT TO anon USING (activo IS TRUE);

-- El bucket de promociones queda público para lectura y autenticado para escritura.
DROP POLICY IF EXISTS "Acceso publico de lectura a promociones" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subidas de promociones a todos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizar promociones a todos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrar promociones a todos" ON storage.objects;

CREATE POLICY promociones_storage_lectura
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'promociones');

CREATE POLICY promociones_storage_alta
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'promociones' AND public.current_restaurant_role() IN ('administrador', 'superadmin'));

CREATE POLICY promociones_storage_cambio
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'promociones' AND public.current_restaurant_role() IN ('administrador', 'superadmin'))
WITH CHECK (bucket_id = 'promociones' AND public.current_restaurant_role() IN ('administrador', 'superadmin'));

CREATE POLICY promociones_storage_baja
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'promociones' AND public.current_restaurant_role() IN ('administrador', 'superadmin'));

COMMIT;
