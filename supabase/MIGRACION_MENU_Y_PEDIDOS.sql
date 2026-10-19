-- =============================================================================
-- COLORES PIZZA - MIGRACIÓN: CATEGORIAS Y PRODUCTOS A SUPABASE
-- URL: https://rasisomlemuaxpxlzqsg.supabase.co
-- =============================================================================

-- 1. ELIMINAR TABLAS DE PEDIDOS EN SUPABASE (Pasan a gestionarse en Google Sheets)
DROP VIEW IF EXISTS public.vw_pedidos_kds CASCADE;
ALTER TABLE IF EXISTS public.delivery DROP CONSTRAINT IF EXISTS delivery_pedido_id_fkey;
DROP TABLE IF EXISTS public.pedido_detalle CASCADE;
DROP TABLE IF EXISTS public.pedidos_cabecera CASCADE;

-- 2. CREACIÓN DE TABLA CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categorias (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    slug TEXT NOT NULL,
    orden INT DEFAULT 1,
    activa BOOLEAN DEFAULT true,
    icono TEXT DEFAULT 'UtensilsCrossed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREACIÓN DE TABLA PRODUCTOS_MENU
CREATE TABLE IF NOT EXISTS public.productos_menu (
    id_producto TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    precio_venta NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    categoria TEXT NOT NULL,
    subcategoria TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    imagen TEXT,
    descripcion TEXT,
    tipo TEXT NOT NULL DEFAULT 'plato',
    tiempo_preparacion_estimado INT,
    requiere_cocina BOOLEAN DEFAULT true,
    pasos_preparacion TEXT[],
    alergenos TEXT[],
    consejo_emplatado TEXT
);

-- 4. INSERTAR CATEGORIAS
INSERT INTO public.categorias (id, nombre, slug, orden, activa, icono) VALUES
  ('cat_1', 'Bebidas', 'bebidas', 1, true, 'Wine'),
  ('cat_2', 'Calzones y empanadas', 'calzones-y-empanadas', 2, true, 'UtensilsCrossed'),
  ('cat_3', 'Pizzas', 'pizzas', 3, true, 'Pizza'),
  ('cat_4', 'Postres', 'postres', 4, true, 'Coffee'),
  ('cat_5', 'Sandwiches', 'sandwiches', 5, true, 'UtensilsCrossed'),
  ('cat_6', 'Focaccias', 'focaccias', 6, true, 'UtensilsCrossed')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  slug = EXCLUDED.slug,
  orden = EXCLUDED.orden,
  activa = EXCLUDED.activa,
  icono = EXCLUDED.icono;

-- 5. INSERTAR PRODUCTOS DEL MENÚ
INSERT INTO public.productos_menu (id_producto, nombre, precio_venta, categoria, activo, imagen, descripcion, tipo, tiempo_preparacion_estimado, requiere_cocina) VALUES
  ('prod_pizza_comun_grande', 'Pizza Rosso Clásica Grande', 19000, 'Pizzas', true, 'https://lh3.googleusercontent.com/Gfb13YeP1igGDideYATi26z_Kjb380yldPtb2SzfhQZcfDy4omzF3I72mU_O2MK0JgUQ67mU68JdYtCFt8M7cJeHIK06RPV4h3_lQQ', 'Pizza clásica de salsa de tomate de la casa, oliva y orégano.', 'plato', 10, true),
  ('prod_pizza_pepperoni_grande', 'Pizza Rubí Pepperoni & Miel Sriracha Grande', 22000, 'Pizzas', true, 'https://lh3.googleusercontent.com/3ry2JTqTgIoP_t583K64-qXnJH0fCOhgAUu217Cgf4olw-9AUlEmDDbKWqL5WCGhczK_m8a_buMmNmJngwSLS527J1Ywm0oEl7nB', 'Pepperoni premium con hilos de miel picante artesanal.', 'plato', 12, true),
  ('prod_pizza_napolitana_grande', 'Pizza Esmeralda Margarita & Pesto Trapanese Grande', 21500, 'Pizzas', true, 'https://lh3.googleusercontent.com/Elsa8nk3wjF5UAAREcvJ2JzfqzYAY1-LcIetYKz07RunpKIS-xhzjLdZYuVG5ge3sZPwff8q8xBu0jhc2VxpAv-v327cjmrxdTn2DA', 'Cherries confitados, pesto de pistacho y stracciatella.', 'plato', 15, true),
  ('prod_pizza_colores_especial_grande', 'Pizza Ámbar Prosciutto & Pimientos Dulces Grande', 22000, 'Pizzas', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', 'Prosciutto de Parma de larga maduración, pimientos confitados y oliva.', 'plato', 14, true),
  ('prod_pizza_5_quesos_grande', 'Pizza Cromática 5 Quesos & Higos al Malamado Grande', 23000, 'Pizzas', true, 'https://lh3.googleusercontent.com/uKvNeoO6OjsLpV8AUYnjoj_uHDjnm39q3fA7BuvqpG8H60EYwA-gezgPKAkMdq7yxMYeZEGgfZGiZTQ5WL3iJkNydy2-lkErV0OdUg', 'Blend de 5 quesos seleccionados y toque de higos dulces.', 'plato', 15, true),
  ('prod_pizza_fresca_grande', 'Pizza Jade Rúcula Selvática & Bresaola Grande', 22000, 'Pizzas', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', 'Rúcula fresca, bresaola feteada e hilos de oliva.', 'plato', 12, true),
  ('prod_pizza_funghi_grande', 'Pizza Siena Funghi Porcini & Trufa Blanca Grande', 24000, 'Pizzas', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', 'Portobellos salteados, salsa de hongos y aceite perfumado de trufa.', 'plato', 14, true),
  ('prod_pizza_guacamole_grande', 'Guacamole Pizza', 24000, 'Pizzas', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', 'Masa artesanal con langostinos, cebolla fugazza y crema de guacamole.', 'plato', 15, true),
  ('prod_pizza_comun_individual', 'Pizza Rosso Clásica Individual', 10000, 'Pizzas', true, 'https://lh3.googleusercontent.com/Gfb13YeP1igGDideYATi26z_Kjb380yldPtb2SzfhQZcfDy4omzF3I72mU_O2MK0JgUQ67mU68JdYtCFt8M7cJeHIK06RPV4h3_lQQ', 'Versión individual de nuestra clásica de salsa de tomate, oliva y orégano.', 'plato', 7, true),
  ('prod_pizza_pepperoni_individual', 'Pizza Rubí Pepperoni & Miel Sriracha Individual', 11000, 'Pizzas', true, 'https://lh3.googleusercontent.com/3ry2JTqTgIoP_t583K64-qXnJH0fCOhgAUu217Cgf4olw-9AUlEmDDbKWqL5WCGhczK_m8a_buMmNmJngwSLS527J1Ywm0oEl7nB', 'Pepperoni premium individual con miel de sriracha.', 'plato', 8, true),
  ('prod_pizza_napolitana_individual', 'Pizza Esmeralda Margarita & Pesto Trapanese Individual', 11000, 'Pizzas', true, 'https://lh3.googleusercontent.com/Elsa8nk3wjF5UAAREcvJ2JzfqzYAY1-LcIetYKz07RunpKIS-xhzjLdZYuVG5ge3sZPwff8q8xBu0jhc2VxpAv-v327cjmrxdTn2DA', 'Versión individual de cherries, pesto de pistacho y stracciatella.', 'plato', 10, true),
  ('prod_pizza_funghi_individual', 'Pizza Siena Funghi & Trufa Individual', 11500, 'Pizzas', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', 'Variedad de hongos con aceite de trufa individual.', 'plato', 9, true),
  ('prod_foc_milanesa_completa', 'Focaccia de Milanesa Completa', 14500, 'Focaccias', true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', 'Milanesa tierna, jamón cocido, muzzarella, papas rústicas, lechuga, tomate y mayonesa.', 'plato', 12, true),
  ('prod_foc_clasica', 'Focaccia Clásica de Jamón & Provolone', 11000, 'Focaccias', true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', 'Jamón cocido natural, queso provolone fundido, rodajas de tomate y lechuga fresca.', 'plato', 7, true),
  ('prod_foc_mortadela', 'Focaccia de Mortadela & Queso Mantecoso', 12000, 'Focaccias', true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', 'Mortadela feteada fina, queso mantecoso fundido, rúcula fresca y pesto.', 'plato', 8, true),
  ('prod_foc_lomo', 'Focaccia de Lomo & Provolone', 13500, 'Focaccias', true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', 'Nalga tiernizada, provolone derretido, jamón cocido y mayonesa clásica.', 'plato', 10, true),
  ('prod_foc_milan', 'Focaccia Milán & Milanesa', 12500, 'Focaccias', true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', 'Milanesa con queso provolone, provenzal y mayonesa.', 'plato', 9, true),
  ('prod_foc_cruda', 'Focaccia Cruda & Fynbo', 13000, 'Focaccias', true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', 'Jamón crudo premium, queso fynbo, rúcula fresca, oliva y pesto.', 'plato', 8, true),
  ('prod_foc_garbanzo', 'Focaccia de Garbanzo & Hummus', 11500, 'Focaccias', true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', 'Hummus untuoso de garbanzos, tomates secos, rúcula fresca y huevo.', 'plato', 8, true),
  ('prod_calz_empa_saltena', 'Empanada Salteña Cortada a Cuchillo & Papa', 2300, 'Calzones y empanadas', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', 'Carne cortada a cuchillo, papa, verdeo, aceituna y huevo duro.', 'plato', 5, true),
  ('prod_calz_empa_criolla', 'Empanada Criolla Tradicional Ahumada', 2000, 'Calzones y empanadas', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', 'Carne molida especial, cebolla caramelizada, huevo y pimentón.', 'plato', 5, true),
  ('prod_post_tiramisu', 'Tiramisú', 9000, 'Postres', true, 'https://lh3.googleusercontent.com/uIjG724abXQHUMlirhnmd3MRs2naji9r72sd0jvC5JaG_S_fcsJ7YzArvDy55gFyBZSgdJIzj4X2UZPE6X8ZPDiiOcPJxh1MU8ojxw', 'Clásico postre italiano a base de mascarpone, café y vainillas.', 'postre', 15, true),
  ('prod_post_tarta_de_ricotta', 'Tarta de Ricotta', 6000, 'Postres', true, 'https://lh3.googleusercontent.com/xlHujpdjb-GI0G0D9Xh2WUzh4xl_iOU8d9opQnO3YYfXb3ZeVM6mUIouPDhvwU8_dGOU4ZELw0oncplOQG6oYg6SuEDHT6L3-akxew', 'Clásica tarta de ricota con ralladura de naranja y esencia de vainilla.', 'postre', 15, true)
ON CONFLICT (id_producto) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  precio_venta = EXCLUDED.precio_venta,
  categoria = EXCLUDED.categoria,
  activo = EXCLUDED.activo,
  imagen = EXCLUDED.imagen,
  descripcion = EXCLUDED.descripcion,
  tipo = EXCLUDED.tipo,
  tiempo_preparacion_estimado = EXCLUDED.tiempo_preparacion_estimado,
  requiere_cocina = EXCLUDED.requiere_cocina;

-- 6. SEGURIDAD RLS Y PERMISOS PÚBLICOS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS permitir_todo_categorias ON public.categorias;
CREATE POLICY permitir_todo_categorias ON public.categorias FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS permitir_todo_productos_menu ON public.productos_menu;
CREATE POLICY permitir_todo_productos_menu ON public.productos_menu FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. HABILITAR PUBLICACIÓN REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'productos_menu'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.productos_menu;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'categorias'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categorias;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
