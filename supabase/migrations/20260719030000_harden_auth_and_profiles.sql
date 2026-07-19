-- Seguridad de producción: la autenticación pertenece a Supabase Auth.
-- Los perfiles operativos no deben conservar contraseñas recuperables.
UPDATE public.usuarios SET password = NULL WHERE password IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'contrasena'
  ) THEN
    EXECUTE 'UPDATE public.usuarios SET contrasena = NULL WHERE contrasena IS NOT NULL';
  END IF;
END $$;

-- Sustituye las políticas demo de acceso total para anon por sesiones reales.
DO $$
DECLARE
  table_name text;
  policy_record record;
  protected_tables text[] := ARRAY[
    'categorias','usuarios','mesas','insumos','productos_menu','recetas_escandallo',
    'pedidos_cabecera','pedido_detalle','mermas','auditoria_eventos','proveedores',
    'promociones','reservas','facturas','pagos','cierres_caja','movimientos_inventario',
    'backups','configuracion','registro_asistencia','lotes_insumo','clientes',
    'historial_costos_insumos','movimientos_caja_chica','pedidos_delivery_rapido','zonas_envio'
  ];
BEGIN
  FOREACH table_name IN ARRAY protected_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    FOR policy_record IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, table_name);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      'authenticated_access_' || table_name,
      table_name
    );

    IF table_name = ANY (ARRAY['categorias','productos_menu','promociones']) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (true)',
        'public_read_' || table_name,
        table_name
      );
    END IF;
  END LOOP;
END $$;

-- Las imágenes promocionales siguen siendo públicas para lectura, pero solo
-- una sesión autenticada puede subir, modificar o borrar objetos del bucket.
DROP POLICY IF EXISTS "Permitir subidas de promociones a todos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizar promociones a todos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrar promociones a todos" ON storage.objects;
DROP POLICY IF EXISTS "Promociones: subir autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Promociones: actualizar autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Promociones: borrar autenticado" ON storage.objects;

CREATE POLICY "Promociones: subir autenticado"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'promociones');
CREATE POLICY "Promociones: actualizar autenticado"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'promociones') WITH CHECK (bucket_id = 'promociones');
CREATE POLICY "Promociones: borrar autenticado"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'promociones');
