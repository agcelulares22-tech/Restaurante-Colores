-- =============================================================================
-- COLORES PIZZA - SCHEMA Y DATOS OPERATIVOS PARA EL NUEVO SUPABASE
-- URL: https://rasisomlemuaxpxlzqsg.supabase.co
-- Copiar y pegar todo este script en el "SQL Editor" de Supabase y hacer click en "Run".
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. LIMPIEZA PREVIA SI EXISTIERAN TABLAS
DROP VIEW IF EXISTS public.vw_pedidos_kds CASCADE;
DROP TABLE IF EXISTS public.delivery CASCADE;
DROP TABLE IF EXISTS public.delivery_zonas CASCADE;
DROP TABLE IF EXISTS public.pedidos_delivery_rapido CASCADE;
DROP TABLE IF EXISTS public.pedido_detalle CASCADE;
DROP TABLE IF EXISTS public.pedidos_cabecera CASCADE;
DROP TABLE IF EXISTS public.reservas CASCADE;
DROP TABLE IF EXISTS public.calles_envio CASCADE;
DROP TABLE IF EXISTS public.zonas_envio CASCADE;
DROP TABLE IF EXISTS public.movimientos_inventario CASCADE;
DROP TABLE IF EXISTS public.mermas CASCADE;
DROP TABLE IF EXISTS public.lotes_insumo CASCADE;
DROP TABLE IF EXISTS public.mesas CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.configuracion CASCADE;
DROP TABLE IF EXISTS public.backups CASCADE;

-- ============================================================
-- 2. TABLA DE USUARIOS Y ROLES (Para autenticación y permisos)
-- ============================================================
CREATE TABLE public.usuarios (
    id_usuario INT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT,
    username TEXT UNIQUE,
    password TEXT,
    rol TEXT NOT NULL DEFAULT 'mozo',
    activo BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- 3. TABLA DE MESAS (Salón, Comedor, VIP, Retiro y Delivery)
-- ============================================================
CREATE TABLE public.mesas (
    id_mesa INT PRIMARY KEY,
    numero_mesa TEXT NOT NULL UNIQUE,
    estado TEXT NOT NULL DEFAULT 'libre',
    comensales INT,
    capacidad INT DEFAULT 4,
    zona TEXT DEFAULT 'salon',
    sector TEXT DEFAULT 'salon',
    x NUMERIC,
    y NUMERIC,
    width NUMERIC,
    height NUMERIC,
    rx NUMERIC DEFAULT 6,
    forma TEXT DEFAULT 'redonda',
    parent_id INT REFERENCES public.mesas(id_mesa) ON DELETE SET NULL,
    mesas_unidas INT[] DEFAULT '{}'
);

-- ============================================================
-- 4. TABLAS DE PEDIDOS Y COMANDAS EN TIEMPO REAL (KDS / Mozo / Caja)
-- ============================================================
CREATE TABLE public.pedidos_cabecera (
    id_pedido BIGINT PRIMARY KEY,
    id_mesa INT REFERENCES public.mesas(id_mesa) ON DELETE SET NULL,
    numero_mesa TEXT NOT NULL,
    mozo TEXT NOT NULL,
    estado_comanda TEXT NOT NULL DEFAULT 'pendiente',
    observaciones TEXT,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    minutos_transcurridos INT NOT NULL DEFAULT 0,
    origen TEXT NOT NULL DEFAULT 'Mozo',
    tiempo_despacho_minutos INT,
    segundos_en_listo INT DEFAULT 0,
    stock_descontado BOOLEAN NOT NULL DEFAULT false,
    fecha_descuento_stock TIMESTAMPTZ,
    fecha_inicio_cocina TIMESTAMPTZ,
    fecha_listo TIMESTAMPTZ,
    items TEXT,
    cliente_nombre TEXT,
    cliente_telefono TEXT,
    cliente_direccion TEXT
);

CREATE TABLE public.pedido_detalle (
    id_detalle TEXT PRIMARY KEY,
    id_pedido BIGINT NOT NULL REFERENCES public.pedidos_cabecera(id_pedido) ON DELETE CASCADE,
    id_producto TEXT,
    nombre TEXT NOT NULL,
    cantidad INT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'Menu',
    precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. MÓDULO DE LOGÍSTICA Y DELIVERY
-- ============================================================
CREATE TABLE public.delivery_zonas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    precio_fijo NUMERIC(12,2) NOT NULL DEFAULT 0,
    color_hex TEXT DEFAULT '#E8B800',
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id BIGINT NOT NULL REFERENCES public.pedidos_cabecera(id_pedido) ON DELETE CASCADE,
    direccion TEXT NOT NULL,
    zona_id UUID REFERENCES public.delivery_zonas(id) ON DELETE SET NULL,
    precio_envio NUMERIC(12,2) NOT NULL DEFAULT 0,
    telefono_contacto TEXT,
    notas TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','preparando','en_ruta','entregado','cancelado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.pedidos_delivery_rapido (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_cliente TEXT NOT NULL,
    pedido TEXT NOT NULL,
    direccion TEXT NOT NULL,
    telefono TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'horno', 'delivery', 'entregado')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.zonas_envio (
    id SERIAL PRIMARY KEY,
    nombre_zona TEXT NOT NULL,
    costo_envio NUMERIC NOT NULL DEFAULT 0,
    color_hex TEXT DEFAULT '#3B82F6',
    tiempo_estimado_min INT DEFAULT 30,
    minimo_pedido NUMERIC DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.calles_envio (
    id SERIAL PRIMARY KEY,
    nombre_calle TEXT NOT NULL,
    altura_desde INT,
    altura_hasta INT,
    zona_id INT REFERENCES public.zonas_envio(id) ON DELETE SET NULL,
    activo BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- 6. RESERVAS DE MESAS
-- ============================================================
CREATE TABLE public.reservas (
    id_reserva TEXT PRIMARY KEY,
    cliente TEXT NOT NULL,
    personas INT NOT NULL DEFAULT 1,
    fecha DATE NOT NULL,
    hora TEXT NOT NULL,
    id_mesa INT REFERENCES public.mesas(id_mesa) ON DELETE SET NULL,
    estado TEXT NOT NULL CHECK (estado IN ('confirmada', 'cancelada', 'pendiente')),
    telefono TEXT,
    email TEXT,
    observaciones TEXT,
    lista_espera BOOLEAN DEFAULT false,
    prioridad_espera INT DEFAULT 0
);

-- ============================================================
-- 7. CONFIGURACIÓN DEL LOCAL Y FISCAL
-- ============================================================
CREATE TABLE public.configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);

-- ============================================================
-- 8. INVENTARIO OPERATIVO (Kardex, Lotes y Mermas)
-- ============================================================
CREATE TABLE public.movimientos_inventario (
    id_movimiento TEXT PRIMARY KEY,
    id_insumo TEXT,
    tipo_movimiento TEXT NOT NULL DEFAULT 'ajuste',
    cantidad NUMERIC NOT NULL DEFAULT 0.0,
    stock_anterior NUMERIC NOT NULL DEFAULT 0.0,
    stock_nuevo NUMERIC NOT NULL DEFAULT 0.0,
    id_pedido BIGINT REFERENCES public.pedidos_cabecera(id_pedido) ON DELETE SET NULL,
    id_producto TEXT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    motivo TEXT,
    observacion TEXT
);

CREATE TABLE public.lotes_insumo (
    id_lote TEXT PRIMARY KEY,
    id_insumo TEXT NOT NULL,
    cantidad NUMERIC NOT NULL DEFAULT 0.0,
    fecha_vencimiento DATE NOT NULL,
    creado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.mermas (
    id_merma TEXT PRIMARY KEY,
    id_insumo TEXT NOT NULL,
    nombre_insumo TEXT NOT NULL,
    cantidad NUMERIC NOT NULL DEFAULT 0.0,
    unidad_medida TEXT NOT NULL,
    motivo TEXT NOT NULL DEFAULT 'otro',
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    costo_perdida NUMERIC DEFAULT 0.0
);

CREATE TABLE public.backups (
    id_backup TEXT PRIMARY KEY,
    nombre_archivo TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tamano TEXT NOT NULL,
    tablas TEXT NOT NULL,
    contenido TEXT NOT NULL
);

-- ============================================================
-- 9. CARGA DE DATOS INICIALES OPERATIVOS
-- ============================================================

-- Configuración del Restaurante
INSERT INTO public.configuracion (clave, valor) VALUES
    ('nombre_comercial', 'Colores Pizza'),
    ('razon_social', 'Colores Pizza S.A.S.'),
    ('cuit', '30-71702931-4'),
    ('direccion', 'Alvear 1362, Río Cuarto, Córdoba'),
    ('telefono', '+54 9 3584 024822'),
    ('email', 'colores.pizzeria@gmail.com'),
    ('condicion_iva', 'Responsable Inscripto'),
    ('mensaje_pie', 'Le ponemos color a la mejor Pizza.')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;

-- Usuarios del Personal
INSERT INTO public.usuarios (id_usuario, nombre, apellido, username, password, rol, activo) VALUES
    (1, 'Super Admin', '', 'super@admi.com', 'superadmi2026/', 'superadmin', true),
    (2, 'Administrador', '', 'admin@colores.com', 'Pizzeriacolores2026/', 'administrador', true),
    (3, 'Mozo', '', 'mozo@colores.com', 'Pizzeriacoloresmozo2026/', 'mozo', true),
    (4, 'Enzo', 'Fernández', 'enzo', '1234', 'mozo', true),
    (5, 'Micaela', 'Gómez', 'micaela', '1234', 'mozo', true),
    (6, 'Damián', 'Martínez', 'damian', '1234', 'cocina', true),
    (7, 'Sofía', 'Alegre', 'sofia', '1234', 'administrador', true),
    (8, 'Nuevo', 'Usuario', 'nuevo', 'clave', 'mozo', true),
    (9, 'Admin', '', 'admin', '1998', 'superadmin', true),
    (10, 'Nicolás', 'Torres', 'nicolas.torres@colorespizzeria.com', '1234', 'mozo', true),
    (11, 'Pablo', 'Funes', 'pablo.funes@colorespizzeria.com', '1234', 'mozo', true),
    (12, 'Manu', 'Acrich', 'manu.acrich@colorespizzeria.com', '1234', 'mozo', true),
    (13, 'Agustín', 'Gilardi', 'agustin.gilardi@colorespizzeria.com', '1234', 'administrador', true),
    (14, 'Karina', 'Gilardi', 'karina.gilardi@colorespizzeria.com', '1234', 'administrador', true)
ON CONFLICT (id_usuario) DO NOTHING;

-- Mesas del Salón + Mesas Especiales (Retiro y Delivery)
INSERT INTO public.mesas (id_mesa, numero_mesa, estado, comensales, capacidad, zona, sector, forma, x, y, width, height) VALUES
    (1, 'Mesa 1', 'libre', NULL, 4, 'comedor', 'comedor', 'rectangular', 61, 16, 12, 6),
    (2, 'Mesa 2', 'libre', NULL, 5, 'comedor', 'comedor', 'rectangular', 22, 16, 12, 6),
    (3, 'Mesa 3', 'libre', NULL, 5, 'comedor', 'comedor', 'rectangular', 22, 27, 12, 6),
    (4, 'Mesa 4', 'libre', NULL, 4, 'comedor', 'comedor', 'rectangular', 61, 27, 12, 6),
    (5, 'Mesa 5', 'libre', NULL, 4, 'salon', 'salon', 'redonda', 41, 58, 8, 8),
    (6, 'Mesa 6', 'libre', NULL, 4, 'salon', 'salon', 'redonda', 22, 70, 8, 8),
    (8, 'Mesa 8', 'libre', NULL, 4, 'salon', 'salon', 'redonda', 22, 84, 8, 8),
    (12, 'Mesa 12', 'libre', NULL, 4, 'salon', 'salon', 'redonda', 61, 70, 8, 8),
    (101, 'VIP-1', 'libre', NULL, 4, 'salon', 'vip', 'redonda', 41, 84, 8, 8),
    (102, 'Terraza-3', 'libre', NULL, 2, 'salon', 'terraza', 'redonda', 61, 84, 8, 8),
    (998, 'Retiro en Local', 'libre', NULL, 1, 'delivery', 'retiro', 'rectangular', 10, 10, 10, 5),
    (999, 'Delivery', 'libre', NULL, 1, 'delivery', 'delivery', 'rectangular', 10, 20, 10, 5)
ON CONFLICT (id_mesa) DO UPDATE SET
    capacidad = EXCLUDED.capacidad,
    zona = EXCLUDED.zona,
    sector = EXCLUDED.sector,
    forma = EXCLUDED.forma,
    x = EXCLUDED.x,
    y = EXCLUDED.y,
    width = EXCLUDED.width,
    height = EXCLUDED.height;

-- Zonas de Delivery de Río Cuarto
INSERT INTO public.delivery_zonas (nombre, precio_fijo, color_hex, descripcion) VALUES
    ('Zona Centro', 500, '#E8B800', 'Centro de Río Cuarto'),
    ('Zona Sur', 800, '#E85D00', 'Barrio Alberdi, Centro Sur'),
    ('Zona Norte', 900, '#D42B2B', 'Barrio Ciudadela, Villa Nueva'),
    ('Zona Oeste', 1000, '#2D3436', 'Bº 25 de Mayo, San Martín'),
    ('Zona Este', 1000, '#2D3436', 'Bº Sarmiento, Urca')
ON CONFLICT DO NOTHING;

-- Vista unificada de pedidos + delivery para el Monitor KDS
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

-- ============================================================
-- 10. SEGURIDAD (Row Level Security - RLS)
-- ============================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_cabecera ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_delivery_rapido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calles_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_insumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mermas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'usuarios', 'mesas', 'pedidos_cabecera', 'pedido_detalle', 'delivery', 
    'delivery_zonas', 'pedidos_delivery_rapido', 'zonas_envio', 'calles_envio', 
    'reservas', 'configuracion', 'movimientos_inventario', 'lotes_insumo', 
    'mermas', 'backups'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'permitir_todo_' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO public USING (true) WITH CHECK (true)', 'permitir_todo_' || t, t);
  END LOOP;
END $$;

-- ============================================================
-- 11. HABILITAR PUBLICACIÓN REALTIME PARA MONITORES Y MOZOS
-- ============================================================
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

NOTIFY pgrst, 'reload schema';
