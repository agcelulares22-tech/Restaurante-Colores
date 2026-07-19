-- =============================================================================
-- COLORES PIZZERIA - SCHEMA COMPLETO Y DATOS DE PRODUCCION (SUPABASE)
-- Copiar y pegar todo este script en el "SQL Editor" de Supabase y ejecutarlo.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ELIMINAR CONSTRAINTS PREVIAS RESTRICTIVAS Y LIMPIAR TABLAS
-- ============================================================
DROP TABLE IF EXISTS public.categorias CASCADE;
DROP TABLE IF EXISTS public.recetas_escandallo CASCADE;
DROP TABLE IF EXISTS public.pedido_detalle CASCADE;
DROP TABLE IF EXISTS public.pedidos_cabecera CASCADE;
DROP TABLE IF EXISTS public.mermas CASCADE;
DROP TABLE IF EXISTS public.movimientos_inventario CASCADE;
DROP TABLE IF EXISTS public.historial_costos_insumos CASCADE;
DROP TABLE IF EXISTS public.pagos CASCADE;
DROP TABLE IF EXISTS public.facturas CASCADE;
DROP TABLE IF EXISTS public.cierres_caja CASCADE;
DROP TABLE IF EXISTS public.movimientos_caja_chica CASCADE;
DROP TABLE IF EXISTS public.reservas CASCADE;
DROP TABLE IF EXISTS public.productos_menu CASCADE;
DROP TABLE IF EXISTS public.insumos CASCADE;
DROP TABLE IF EXISTS public.mesas CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.proveedores CASCADE;
DROP TABLE IF EXISTS public.promociones CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.configuracion CASCADE;
DROP TABLE IF EXISTS public.auditoria_eventos CASCADE;
DROP TABLE IF EXISTS public.backups CASCADE;
DROP TABLE IF EXISTS public.registro_asistencia CASCADE;
DROP TABLE IF EXISTS public.lotes_insumo CASCADE;

-- ============================================================
-- 2. CREACIÓN DE TABLAS MAESTRAS
-- ============================================================

-- Tabla de Categorías
CREATE TABLE public.categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    orden INT NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT true,
    icono TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Usuarios
CREATE TABLE public.usuarios (
    id_usuario INT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT,
    username TEXT UNIQUE,
    password TEXT,
    rol TEXT NOT NULL DEFAULT 'mozo',
    activo BOOLEAN NOT NULL DEFAULT true
);

-- Tabla de Mesas
CREATE TABLE public.mesas (
    id_mesa INT PRIMARY KEY,
    numero_mesa TEXT NOT NULL UNIQUE,
    estado TEXT NOT NULL DEFAULT 'libre',
    comensales INT
);

-- Tabla de Insumos / Inventario
CREATE TABLE public.insumos (
    id_insumo TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    stock_actual NUMERIC NOT NULL DEFAULT 0.0,
    stock_minimo NUMERIC NOT NULL DEFAULT 0.0,
    unidad_medida TEXT NOT NULL DEFAULT 'unidades',
    categoria TEXT NOT NULL DEFAULT 'secos',
    subcategoria TEXT,
    proveedor TEXT,
    costo_unitario NUMERIC DEFAULT 0.0,
    es_bebida_directa BOOLEAN NOT NULL DEFAULT false
);

-- Tabla de Control de Lotes e Ingredientes Frescos
CREATE TABLE public.lotes_insumo (
    id_lote TEXT PRIMARY KEY,
    id_insumo TEXT NOT NULL REFERENCES public.insumos(id_insumo) ON DELETE CASCADE,
    cantidad NUMERIC NOT NULL DEFAULT 0.0,
    fecha_vencimiento DATE NOT NULL,
    creado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Productos del Menú (Carta)
CREATE TABLE public.productos_menu (
    id_producto TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    precio_venta NUMERIC NOT NULL DEFAULT 0.0,
    categoria TEXT NOT NULL DEFAULT 'Menu',
    activo BOOLEAN NOT NULL DEFAULT true,
    imagen TEXT,
    descripcion TEXT,
    tipo TEXT NOT NULL DEFAULT 'plato',
    tiempo_preparacion_estimado INT,
    requiere_cocina BOOLEAN NOT NULL DEFAULT true,
    pasos_preparacion TEXT[],
    alergenos TEXT[],
    consejo_emplatado TEXT
);

-- Tabla de Recetas / Escandallo (Relación Insumo-Producto)
CREATE TABLE public.recetas_escandallo (
    id_receta TEXT PRIMARY KEY,
    id_producto TEXT NOT NULL REFERENCES public.productos_menu(id_producto) ON DELETE CASCADE,
    id_insumo TEXT NOT NULL REFERENCES public.insumos(id_insumo) ON DELETE CASCADE,
    cantidad_a_descontar NUMERIC NOT NULL DEFAULT 0.0,
    unidad_medida TEXT
);

-- Tabla de Configuración de Sistema
CREATE TABLE public.configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);

-- Tabla de Registro de Asistencia (Fichajes)
CREATE TABLE public.registro_asistencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario INT,
    nombre_empleado TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitud NUMERIC,
    longitud NUMERIC,
    precision NUMERIC,
    dispositivo TEXT,
    direccion TEXT
);

-- Tabla de Pedidos / Comandas (Cabecera)
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
    items TEXT
);

-- Tabla de Detalles de Pedido (Items individuales)
CREATE TABLE public.pedido_detalle (
    id_detalle TEXT PRIMARY KEY,
    id_pedido BIGINT NOT NULL REFERENCES public.pedidos_cabecera(id_pedido) ON DELETE CASCADE,
    id_producto TEXT REFERENCES public.productos_menu(id_producto) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    cantidad INT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'Menu',
    precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Cierres de Caja
CREATE TABLE public.cierres_caja (
    id_cierre TEXT PRIMARY KEY,
    fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    monto_apertura NUMERIC NOT NULL DEFAULT 0.0,
    monto_ventas NUMERIC NOT NULL DEFAULT 0.0,
    monto_real NUMERIC,
    diferencia NUMERIC,
    observaciones TEXT,
    usuario_cajero TEXT NOT NULL DEFAULT 'Cajero'
);

-- Tabla de Facturas Emitidas
CREATE TABLE public.facturas (
    id_factura TEXT PRIMARY KEY,
    id_pedido BIGINT REFERENCES public.pedidos_cabecera(id_pedido) ON DELETE SET NULL,
    numero_factura TEXT NOT NULL,
    total NUMERIC NOT NULL DEFAULT 0.0,
    tipo_comprobante TEXT NOT NULL DEFAULT 'Ticket Interno',
    metodo_pago TEXT NOT NULL DEFAULT 'Efectivo',
    cuit_cliente TEXT,
    fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Pagos
CREATE TABLE public.pagos (
    id_pago TEXT PRIMARY KEY,
    id_factura TEXT REFERENCES public.facturas(id_factura) ON DELETE CASCADE,
    monto NUMERIC NOT NULL DEFAULT 0.0,
    metodo TEXT NOT NULL DEFAULT 'Efectivo',
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Movimientos de Caja Chica
CREATE TABLE public.movimientos_caja_chica (
    id_movimiento TEXT PRIMARY KEY DEFAULT 'mov_' || replace(uuid_generate_v4()::text, '-', ''),
    id_cierre TEXT REFERENCES public.cierres_caja(id_cierre) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    concepto TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Movimientos de Inventario
CREATE TABLE public.movimientos_inventario (
    id_movimiento TEXT PRIMARY KEY,
    id_insumo TEXT REFERENCES public.insumos(id_insumo) ON DELETE CASCADE,
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

-- Tabla de Mermas
CREATE TABLE public.mermas (
    id_merma TEXT PRIMARY KEY,
    id_insumo TEXT NOT NULL REFERENCES public.insumos(id_insumo) ON DELETE CASCADE,
    nombre_insumo TEXT NOT NULL,
    cantidad NUMERIC NOT NULL DEFAULT 0.0,
    unidad_medida TEXT NOT NULL,
    motivo TEXT NOT NULL DEFAULT 'otro',
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    costo_perdida NUMERIC DEFAULT 0.0
);

-- Tabla de Clientes
CREATE TABLE public.clientes (
    id_cliente TEXT PRIMARY KEY DEFAULT 'cli_' || replace(uuid_generate_v4()::text, '-', ''),
    dni_cuit TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    puntos NUMERIC NOT NULL DEFAULT 0,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. INSERTAR DATOS MAESTROS DE PRODUCCIÓN
-- ============================================================

-- Categorías iniciales
INSERT INTO public.categorias (nombre, slug, orden, activa, icono) VALUES
    ('Bebidas', 'bebidas', 1, true, 'Wine'),
    ('Calzones y empanadas', 'calzones-y-empanadas', 2, true, 'UtensilsCrossed'),
    ('Pizzas', 'pizzas', 3, true, 'Pizza'),
    ('Postres', 'postres', 4, true, 'Coffee'),
    ('Sandwiches', 'sandwiches', 5, true, 'UtensilsCrossed')
ON CONFLICT (nombre) DO UPDATE SET slug = EXCLUDED.slug, orden = EXCLUDED.orden, activa = EXCLUDED.activa, icono = EXCLUDED.icono;

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

-- Usuarios iniciales
INSERT INTO public.usuarios (id_usuario, nombre, apellido, username, password, rol, activo) VALUES
    (1, 'Super Admin', '', 'superadmin', NULL, 'superadmin', true),
    (2, 'Administrador', '', 'administrador', NULL, 'administrador', true),
    (3, 'Mozo', '', 'mozo', NULL, 'mozo', true),
    (4, 'Enzo', 'Fernández', 'enzo', NULL, 'mozo', true),
    (5, 'Micaela', 'Gómez', 'micaela', NULL, 'mozo', true),
    (6, 'Damián', 'Martínez', 'damian', NULL, 'cocina', true),
    (7, 'Sofía', 'Alegre', 'sofia', NULL, 'administrador', true),
    (8, 'Nuevo', 'Usuario', 'nuevo', NULL, 'mozo', true),
    (9, 'Admin', '', 'admin', NULL, 'superadmin', true)
ON CONFLICT (id_usuario) DO NOTHING;

-- Mesas iniciales
INSERT INTO public.mesas (id_mesa, numero_mesa, estado, comensales, capacidad, zona, sector, forma, x, y, width, height) VALUES
    (1, 'Mesa 1', 'libre', NULL, 4, 'comedor', 'comedor', 'rectangular', 61, 16, 12, 6),
    (2, 'Mesa 2', 'ocupada', 2, 5, 'comedor', 'comedor', 'rectangular', 22, 16, 12, 6),
    (3, 'Mesa 3', 'libre', NULL, 5, 'comedor', 'comedor', 'rectangular', 22, 27, 12, 6),
    (4, 'Mesa 4', 'ocupada', 3, 4, 'comedor', 'comedor', 'rectangular', 61, 27, 12, 6),
    (5, 'Mesa 5', 'libre', NULL, 4, 'salon', 'salon', 'redonda', 41, 58, 8, 8),
    (6, 'Mesa 6', 'libre', NULL, 4, 'salon', 'salon', 'redonda', 22, 70, 8, 8),
    (8, 'Mesa 8', 'ocupada', 1, 4, 'salon', 'salon', 'redonda', 22, 84, 8, 8),
    (12, 'Mesa 12', 'ocupada', 4, 4, 'salon', 'salon', 'redonda', 61, 70, 8, 8),
    (101, 'VIP-1', 'libre', NULL, 4, 'salon', 'vip', 'redonda', 41, 84, 8, 8),
    (102, 'Terraza-3', 'libre', NULL, 2, 'salon', 'terraza', 'redonda', 61, 84, 8, 8)
ON CONFLICT (id_mesa) DO UPDATE SET
    capacidad = EXCLUDED.capacidad,
    zona = EXCLUDED.zona,
    sector = EXCLUDED.sector,
    forma = EXCLUDED.forma,
    x = EXCLUDED.x,
    y = EXCLUDED.y,
    width = EXCLUDED.width,
    height = EXCLUDED.height;

-- Insumos iniciales
INSERT INTO public.insumos (id_insumo, nombre, stock_actual, stock_minimo, unidad_medida, categoria, subcategoria, proveedor, costo_unitario, es_bebida_directa) VALUES
    ('ins_harina_trigo', 'Harina de Trigo sémola', 40000.0, 10000.0, 'g', 'secos', 'Harinas', 'Molino Cañuelas', 0.8, false),
    ('ins_levadura', 'Levadura seca de cerveza', 5000.0, 1000.0, 'g', 'secos', 'Levaduras', 'Distribuidora Altiplano', 3.5, false),
    ('ins_pure_tomate', 'Puré de Tomate Triturado', 30000.0, 8000.0, 'g', 'secos', 'Conservas', 'Mercado de Abasto', 2.2, false),
    ('ins_aceite_oliva', 'Aceite de oliva extra virgen', 20000.0, 4000.0, 'ml', 'secos', 'Aceites', 'Gourmet Imports', 12.0, false),
    ('ins_mozzarella', 'Queso Mozzarella en Barra', 35000.0, 8000.0, 'g', 'frescos', 'Lácteos', 'Lácteos La Bocha', 8.5, false),
    ('ins_fior_di_latte', 'Mozzarella Fior di Latte artesanal', 40.0, 10.0, 'unidades', 'frescos', 'Lácteos', 'Lácteos La Bocha', 850.0, false),
    ('ins_parmesano', 'Queso Parmesano Rallado', 10000.0, 2000.0, 'g', 'frescos', 'Lácteos', 'Lácteos La Bocha', 11.5, false),
    ('ins_provolone', 'Queso Provolone Hilado de Campo', 12000.0, 3000.0, 'g', 'frescos', 'Lácteos', 'Lácteos La Bocha', 7.5, false),
    ('ins_queso_azul', 'Queso Azul Premium', 5000.0, 1000.0, 'g', 'frescos', 'Lácteos', 'Lácteos La Bocha', 9.8, false),
    ('ins_jamon_cocido', 'Jamón cocido de primera calidad', 15000.0, 4000.0, 'g', 'frescos', 'Fiambrería', 'Frigorífico El Triunfo', 5.5, false),
    ('ins_jamon_crudo', 'Jamón crudo estacionado 12 meses', 8000.0, 2000.0, 'g', 'frescos', 'Fiambrería', 'Frigorífico El Triunfo', 14.5, false),
    ('ins_cantimpalo', 'Salame Cantimpalo / Calabresa', 10000.0, 2000.0, 'g', 'secos', 'Fiambrería', 'Frigorífico El Triunfo', 8.2, false),
    ('ins_panceta', 'Panceta Ahumada Laminada', 12000.0, 3000.0, 'g', 'frescos', 'Fiambrería', 'Frigorífico El Triunfo', 9.0, false),
    ('ins_aceitunas', 'Aceitunas verdes rellenas y descarozadas', 5000.0, 1500.0, 'g', 'secos', 'Conservas', 'Distribuidora Altiplano', 3.8, false),
    ('ins_albahaca', 'Albahaca fresca de huerta', 3000.0, 1000.0, 'g', 'frescos', 'Vegetales', 'Mercado de Abasto', 2.5, false),
    ('ins_morrones', 'Pimientos rojos (Morrón en conserva)', 12000.0, 3000.0, 'g', 'secos', 'Conservas', 'Distribuidora Altiplano', 4.8, false),
    ('ins_cebolla', 'Cebolla blanca seleccionada', 40000.0, 10000.0, 'g', 'frescos', 'Vegetales', 'Mercado de Abasto', 1.2, false),
    ('ins_empanada_relleno', 'Relleno criollo de carne cortado a cuchillo', 15000.0, 4000.0, 'g', 'frescos', 'Rellenos', 'Cocina Central', 6.8, false),
    ('ins_faina_preparacion', 'Harina de Garbanzo base fainá', 10000.0, 2000.0, 'g', 'secos', 'Harinas', 'Molino Cañuelas', 2.5, false),
    ('ins_dulce_leche', 'Dulce de Leche repostero', 16000.0, 4000.0, 'g', 'secos', 'Dulces', 'Lácteos La Bocha', 3.5, false),
    ('ins_chocolate_belga', 'Chocolate amargo belga 70%', 5000.0, 1500.0, 'g', 'secos', 'Especialidades', 'Gourmet Imports', 16.0, false),
    ('ins_helado_crema', 'Helado Cream Americana', 30.0, 5.0, 'unidades', 'frescos', 'Postres', 'Gourmet Imports', 350.0, false),
    ('ins_peras_und', 'Peras frescas premium', 80.0, 15.0, 'unidades', 'frescos', 'Vegetales', 'Mercado de Abasto', 90.0, false),
    ('ins_vin_trumpeter_malbec', 'Trumpeter Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'La Rural Winery', 3200.0, true),
    ('ins_vin_trumpeter_red_blend', 'Trumpeter Red Blend Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'La Rural Winery', 3000.0, true),
    ('ins_vin_trumpeter_chardonnay', 'Trumpeter Chardonnay Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'La Rural Winery', 2900.0, true),
    ('ins_vin_trumpeter_doux', 'Trumpeter Doux Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'La Rural Winery', 2900.0, true),
    ('ins_vin_encuentro_malbec', 'Encuentro Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'La Rural Winery', 4800.0, true),
    ('ins_vin_rutini_malbec', 'GIUS Blonde runner (Blonde Ale) Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'La Rural Winery', 6800.0, true),
    ('ins_vin_rutini_cabernet_sauvignon', 'Rutini Cabernet Sauvignon Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'La Rural Winery', 6800.0, true),
    ('ins_vin_rutini_cabernet_franc', 'Rutini Cabernet Franc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'La Rural Winery', 7200.0, true),
    ('ins_vin_rutini_merlot', 'Rutini Merlot Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'La Rural Winery', 6500.0, true),
    ('ins_vin_escorihuela_gascon_malbec', 'Escorihuela Gascón Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Escorihuela Gascón S.A.', 4200.0, true),
    ('ins_vin_escorihuela_gascon_cabernet_sauvignon', 'Escorihuela Gascón Cabernet Sauvignon Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Escorihuela Gascón S.A.', 4200.0, true),
    ('ins_vin_escorihuela_gascon_pinot_noir', 'Escorihuela Gascón Pinot Noir Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Escorihuela Gascón S.A.', 4500.0, true),
    ('ins_vin_escorihuela_gascon_chardonnay', 'Escorihuela Gascón Chardonnay Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Escorihuela Gascón S.A.', 4100.0, true),
    ('ins_vin_escorihuela_gascon_sauvignon_blanc', 'Escorihuela Gascón Sauvignon Blanc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Escorihuela Gascón S.A.', 4100.0, true),
    ('ins_vin_eg_gran_reserva_malbec', 'E.G Gran Reserva Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Escorihuela Gascón S.A.', 6800.0, true),
    ('ins_vin_pequenas_producciones_malbec', 'Pequeñas Producciones Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Escorihuela Gascón S.A.', 9500.0, true),
    ('ins_vin_pequenas_producciones_cabernet_franc', 'Pequeñas Producciones Cabernet Franc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Escorihuela Gascón S.A.', 9500.0, true),
    ('ins_vin_capitulo_2_malbec', 'Capítulo 2 Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Ruca Malen S.A.', 3800.0, true),
    ('ins_vin_capitulo_2_cabernet_sauvignon', 'Capítulo 2 Cabernet Sauvignon Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Ruca Malen S.A.', 3800.0, true),
    ('ins_vin_alamos_red_blend', 'Alamos Red Blend Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 2400.0, true),
    ('ins_vin_saint_felicien_malbec', 'Saint Felicien Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 5200.0, true),
    ('ins_vin_saint_felicien_cabernet_sauvignon', 'Saint Felicien Cabernet Sauvignon Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 5200.0, true),
    ('ins_vin_saint_felicien_chardonnay', 'Saint Felicien Chardonnay Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Catena Zapata Winery', 4900.0, true),
    ('ins_vin_saint_felicien_sauvignon_blanc', 'Saint Felicien Sauvignon Blanc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Catena Zapata Winery', 4900.0, true),
    ('ins_vin_nicasia_red_blend', 'Nicasia Red Blend Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 4500.0, true),
    ('ins_vin_nicasia_malbec', 'Nicasia Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 4500.0, true),
    ('ins_vin_padrillo_malbec', 'Padrillo Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 3100.0, true),
    ('ins_vin_padrillo_pinot_noir', 'Padrillo Pinot Noir Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 3100.0, true),
    ('ins_vin_dv_catena_malbec', 'DV Catena Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 8900.0, true),
    ('ins_vin_dv_catena_cabernet_sauvignon', 'DV Catena Cabernet Sauvignon Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 8900.0, true),
    ('ins_vin_dv_catena_pinot_noir', 'DV Catena Pinot Noir Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 9200.0, true),
    ('ins_vin_el_enemigo_malbec', 'El Enemigo Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 9800.0, true),
    ('ins_vin_el_enemigo_cabernet_franc', 'El Enemigo Cabernet Franc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 9800.0, true),
    ('ins_vin_tikal_natural_malbec', 'Tikal Natural Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 7500.0, true),
    ('ins_vin_angelica_zapata_malbec', 'Angélica Zapata Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 14500.0, true),
    ('ins_vin_angelica_zapata_merlot', 'Angélica Zapata Merlot Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 14500.0, true),
    ('ins_vin_angelica_zapata_chardonnay', 'Angélica Zapata Chardonnay Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Catena Zapata Winery', 14000.0, true),
    ('ins_vin_catena_zapata_argentino_malbec', 'Catena Zapata Argentino Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 28000.0, true),
    ('ins_vin_luca_malbec', 'Luca Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Catena Zapata Winery', 8200.0, true),
    ('ins_vin_luca_chardonnay', 'Luca Chardonnay Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Catena Zapata Winery', 8200.0, true),
    ('ins_vin_las_perdices_malbec', 'Las Perdices Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 3400.0, true),
    ('ins_vin_las_perdices_cabernet_sauvignon', 'Las Perdices Cabernet Sauvignon Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 3400.0, true),
    ('ins_vin_las_perdices_sauvignon_blanc', 'Las Perdices Sauvignon Blanc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Las Perdices S.A.', 3200.0, true),
    ('ins_vin_las_perdices_torrontes', 'Las Perdices Torrontes Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Las Perdices S.A.', 3200.0, true),
    ('ins_vin_las_perdices_torrontes_dulce', 'Las Perdices Torrontes Dulce Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Las Perdices S.A.', 3300.0, true),
    ('ins_vin_las_perdices_reserva_malbec', 'Las Perdices Reserva Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 4800.0, true),
    ('ins_vin_las_perdices_reserva_cabernet_sauvignon', 'Las Perdices Reserva Cabernet Sauvignon Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 4800.0, true),
    ('ins_vin_las_perdices_reserva_pinot_noir', 'Las Perdices Reserva Pinot Noir Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 5000.0, true),
    ('ins_vin_las_perdices_reserva_chardonnay', 'Las Perdices Reserva Chardonnay Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Las Perdices S.A.', 4600.0, true),
    ('ins_vin_las_perdices_reserva_sauvignon_blanc', 'Las Perdices Reserva Sauvignon Blanc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Las Perdices S.A.', 4600.0, true),
    ('ins_vin_las_perdices_don_juan_malbec', 'Las Perdices Don Juan Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 16000.0, true),
    ('ins_vin_las_perdices_exploracion_las_compuertas', 'Las Perdices Exploración Las Compuertas Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 6500.0, true),
    ('ins_vin_las_perdices_exploracion_chacayes', 'Las Perdices Exploración Chacayes Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 6500.0, true),
    ('ins_vin_las_perdices_exploracion_albarino', 'Las Perdices Exploración Albariño Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Las Perdices S.A.', 5800.0, true),
    ('ins_vin_las_perdices_exploracion_riesling', 'Las Perdices Exploración Riesling Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Las Perdices S.A.', 5800.0, true),
    ('ins_vin_las_perdices_exploracion_gewurztraminer', 'Las Perdices Exploración Gewurztraminer Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Las Perdices S.A.', 5900.0, true),
    ('ins_vin_las_perdices_ala_colorada_ancelotta', 'Las Perdices Ala Colorada Ancelotta Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 7200.0, true),
    ('ins_vin_las_perdices_ala_colorada_cabernet_franc', 'Las Perdices Ala Colorada Cabernet Franc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 7200.0, true),
    ('ins_vin_las_perdices_ala_colorada_tannat', 'Las Perdices Ala Colorada Tannat Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 7200.0, true),
    ('ins_vin_las_perdices_ala_colorada_petit_verdot', 'Las Perdices Ala Colorada Petit Verdot Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 7200.0, true),
    ('ins_vin_las_perdices_alae_malbec', 'Las Perdices Alae Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Las Perdices S.A.', 28000.0, true),
    ('ins_vin_portillo_malbec', 'Portillo Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Salentein S.A.', 2100.0, true),
    ('ins_vin_portillo_sauvignon_blanc', 'Portillo Sauvignon Blanc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Salentein S.A.', 2100.0, true),
    ('ins_vin_salentein_reserva_malbec', 'Salentein Reserva Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Salentein S.A.', 4400.0, true),
    ('ins_vin_salentein_reserva_pinot_noir', 'Salentein Reserva Pinot Noir Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Salentein S.A.', 4600.0, true),
    ('ins_vin_salentein_reserva_chardonnay', 'Salentein Reserva Chardonnay Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Salentein S.A.', 4400.0, true),
    ('ins_vin_salentein_reserva_sauvignon_blanc', 'Salentein Reserva Sauvignon Blanc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Salentein S.A.', 4400.0, true),
    ('ins_vin_pyros_malbec', 'Pyros Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Salentein S.A.', 6900.0, true),
    ('ins_vin_pyros_sauvignon_blanc', 'Pyros Sauvignon Blanc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos blancos', 'Salentein S.A.', 6500.0, true),
    ('ins_vin_salentein_numina_malbec', 'Salentein Numina Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Salentein S.A.', 8100.0, true),
    ('ins_vin_salentein_numina_cabernet_franc', 'Salentein Numina Cabernet Franc Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Salentein S.A.', 8100.0, true),
    ('ins_vin_salentein_numina_pinot_noir', 'Salentein Numina Pinot Noir Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Salentein S.A.', 8400.0, true),
    ('ins_vin_salentein_primus_malbec', 'Salentein Primus Malbec Botella', 20.0, 4.0, 'unidades', 'bodega', 'Vinos tintos', 'Salentein S.A.', 22000.0, true),
    ('ins_champ_baron_b_brut_nature', 'Baron B Brut Nature Botella', 20.0, 4.0, 'unidades', 'bodega', 'Espumantes / Champagne', 'Champagne S.A.', 12000.0, true),
    ('ins_champ_baron_b_extra_brut', 'Baron B Extra Brut Botella', 20.0, 4.0, 'unidades', 'bodega', 'Espumantes / Champagne', 'Champagne S.A.', 12000.0, true),
    ('ins_champ_alyda_extra_brut', 'Alyda Extra Brut Botella', 20.0, 4.0, 'unidades', 'bodega', 'Espumantes / Champagne', 'Champagne S.A.', 8500.0, true),
    ('ins_champ_encuentro_extra_brut', 'Encuentro Extra Brut Botella', 20.0, 4.0, 'unidades', 'bodega', 'Espumantes / Champagne', 'Champagne S.A.', 5800.0, true),
    ('ins_champ_salentein_extra_brut', 'Salentein Extra Brut Botella', 20.0, 4.0, 'unidades', 'bodega', 'Espumantes / Champagne', 'Champagne S.A.', 4600.0, true),
    ('ins_champ_chandon_extra_brut', 'Chandon Extra Brut Botella', 20.0, 4.0, 'unidades', 'bodega', 'Espumantes / Champagne', 'Champagne S.A.', 5400.0, true),
    ('ins_spir_whisky_macallan_12_anos', 'Whisky Macallan 12 Años Botella', 20.0, 4.0, 'unidades', 'bodega', 'Whisky', 'Spirits S.A.', 45000.0, true),
    ('ins_spir_gin_tonic_heraclito', 'Gin Tonic Heráclito Botella', 20.0, 4.0, 'unidades', 'bodega', 'Gin', 'Spirits S.A.', 3500.0, true),
    ('ins_spir_fernet_branca', 'Fernet Branca Botella', 20.0, 4.0, 'unidades', 'bodega', 'Fernet', 'Spirits S.A.', 3800.0, true),
    ('ins_spir_aperol_spritz', 'Aperol Spritz Botella', 20.0, 4.0, 'unidades', 'bodega', 'Aperitivos', 'Spirits S.A.', 2900.0, true),
    ('ins_beb_gaseosa', 'Lata Gaseosa Cola 354ml', 120.0, 30.0, 'unidades', 'bodega', 'Gaseosas', 'Coca-Cola Andina', 650.0, true),
    ('ins_beb_coca_cola_original', 'Lata Coca-Cola Original 354ml', 150.0, 30.0, 'unidades', 'bodega', 'Gaseosas', 'Coca-Cola Andina', 650.0, true),
    ('ins_beb_coca_cola_zero', 'Lata Coca-Cola Sin Azúcar 354ml', 120.0, 30.0, 'unidades', 'bodega', 'Gaseosas', 'Coca-Cola Andina', 650.0, true),
    ('ins_beb_sprite', 'Lata Sprite Limón 354ml', 100.0, 20.0, 'unidades', 'bodega', 'Gaseosas', 'Coca-Cola Andina', 650.0, true),
    ('ins_beb_sprite_zero', 'Lata Sprite Sin Azúcar 354ml', 80.0, 20.0, 'unidades', 'bodega', 'Gaseosas', 'Coca-Cola Andina', 650.0, true),
    ('ins_beb_fanta', 'Lata Fanta Naranja 354ml', 90.0, 20.0, 'unidades', 'bodega', 'Gaseosas', 'Coca-Cola Andina', 650.0, true),
    ('ins_beb_agua', 'Botella Agua de Manantial 500ml', 150.0, 40.0, 'unidades', 'bodega', 'Agua', 'Cervecería Quilmes', 450.0, true),
    ('ins_cafe_grano', 'Café de especialidad grano tostado', 10000.0, 2000.0, 'g', 'secos', 'Cafetería', 'Caffé Zatti', 15.0, false),
    ('ins_beb_gius_blonde_runner_blonde_ale', 'GIUS Blonde runner (Blonde Ale) ', 120.0, 30.0, 'unidades', 'bodega', 'Cervezas', 'Distribuidora Río Cuarto', 1530.0, true),
    ('ins_beb_gius_indomable_dry_stout', 'GIUS Indomable (Dry Stout)', 120.0, 30.0, 'unidades', 'bodega', 'Cervezas', 'Distribuidora Río Cuarto', 1665.0, true),
    ('ins_beb_gius_ojo_loco_irish_red_ale', 'GIUS Ojo Loco (Irish Red Ale)', 120.0, 30.0, 'unidades', 'bodega', 'Cervezas', 'Distribuidora Río Cuarto', 1575.0, true),
    ('ins_beb_gius_anda_pa_alla_honey_ale', 'GIUS Anda pa alla (Honey Ale)', 120.0, 30.0, 'unidades', 'bodega', 'Cervezas', 'Distribuidora Río Cuarto', 1552.5, true),
    ('ins_beb_coca_cola_500cc', 'Coca Cola 500cc', 120.0, 30.0, 'unidades', 'bodega', 'Gaseosas', 'Distribuidora Río Cuarto', 1125.0, true),
    ('ins_beb_bonaqua_500cc', 'Bonaqua 500cc', 120.0, 30.0, 'unidades', 'bodega', 'Gaseosas', 'Distribuidora Río Cuarto', 1125.0, true),
    ('ins_beb_gius_gente_despierta_light_lager', 'GIUS Gente despierta (Light Lager)', 120.0, 30.0, 'unidades', 'bodega', 'Cervezas', 'Distribuidora Río Cuarto', 1530.0, true),
    ('ins_beb_sprite_500cc', 'Sprite 500cc', 120.0, 30.0, 'unidades', 'bodega', 'Gaseosas', 'Distribuidora Río Cuarto', 1125.0, true),
    ('ins_beb_coca_cola_zero_500cc', 'Coca Cola Zero 500cc', 120.0, 30.0, 'unidades', 'bodega', 'Gaseosas', 'Distribuidora Río Cuarto', 1125.0, true),
    ('ins_beb_fanta_500cc', 'Fanta 500cc', 120.0, 30.0, 'unidades', 'bodega', 'Gaseosas', 'Distribuidora Río Cuarto', 1125.0, true)
ON CONFLICT (id_insumo) DO NOTHING;

-- Productos del Menú y Recetas reales
INSERT INTO public.productos_menu (id_producto, nombre, precio_venta, categoria, activo, imagen, descripcion, tipo, tiempo_preparacion_estimado, requiere_cocina, pasos_preparacion, alergenos, consejo_emplatado) VALUES
    ('prod_calz_empa_saltena', 'Empa Salteña', 2300.0, 'Calzones y empanadas', true, 'https:', 'Carne a cuchillo', 'plato', 15, true, ARRAY['Disponer Empa Salteña en una bandeja para horno.', 'Hornear a leña a alta temperatura hasta que la masa quede inflada y dorada.', 'Retirar y dejar reposar 1 minuto antes de servir.'], ARRAY['Gluten'], 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_calz_empa_criolla', 'Empa Criolla', 2000.0, 'Calzones y empanadas', true, 'https:', 'Carne picada', 'plato', 15, true, ARRAY['Disponer Empa Criolla en una bandeja para horno.', 'Hornear a leña a alta temperatura hasta que la masa quede inflada y dorada.', 'Retirar y dejar reposar 1 minuto antes de servir.'], ARRAY['Gluten'], 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_calz_media_docena_de_saltenas', 'Media Docena De Salteñas', 12000.0, 'Calzones y empanadas', true, 'https:', 'Salteñas', 'plato', 15, true, ARRAY['Disponer Media Docena De Salteñas en una bandeja para horno.', 'Hornear a leña a alta temperatura hasta que la masa quede inflada y dorada.', 'Retirar y dejar reposar 1 minuto antes de servir.'], ARRAY['Gluten'], 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_calz_calzonne_napolitano', 'Calzonne Napolitano', 20000.0, 'Calzones y empanadas', true, 'https:', 'Salsa Napo + muzarella + jamón cocido + provenzal + reggianito + cherrys', 'plato', 15, true, ARRAY['Disponer Calzonne Napolitano en una bandeja para horno.', 'Hornear a leña a alta temperatura hasta que la masa quede inflada y dorada.', 'Retirar y dejar reposar 1 minuto antes de servir.'], ARRAY['Gluten'], 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_calz_calzonne_de_la_reina', 'Calzonne de la reina', 22000.0, 'Calzones y empanadas', true, 'https:', 'Salsa de hongos', 'plato', 15, true, ARRAY['Disponer Calzonne de la reina en una bandeja para horno.', 'Hornear a leña a alta temperatura hasta que la masa quede inflada y dorada.', 'Retirar y dejar reposar 1 minuto antes de servir.'], ARRAY['Gluten'], 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_calz_media_docena_de_criollas', 'Media Docena De Criollas', 10000.0, 'Calzones y empanadas', true, 'https:', 'Criollas', 'plato', 15, true, ARRAY['Disponer Media Docena De Criollas en una bandeja para horno.', 'Hornear a leña a alta temperatura hasta que la masa quede inflada y dorada.', 'Retirar y dejar reposar 1 minuto antes de servir.'], ARRAY['Gluten'], 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_pizz_arma_tu_pizza_individual', 'Arma Tu Pizza Individual', 11000.0, 'Pizzas', true, 'https:', 'Elegi 4 Toppings', 'plato', 15, true, ARRAY['Preparar los ingredientes para Arma Tu Pizza Individual.', 'Cocinar siguiendo la receta tradicional de la casa.', 'Controlar la temperatura y calidad antes de servir.'], NULL, 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_pizz_arma_tu_pizza_grande', 'Arma Tu Pizza Grande', 22000.0, 'Pizzas', true, 'https:', 'Elegi 4 Toppings ', 'plato', 15, true, ARRAY['Preparar los ingredientes para Arma Tu Pizza Grande.', 'Cocinar siguiendo la receta tradicional de la casa.', 'Controlar la temperatura y calidad antes de servir.'], NULL, 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_bebi_gius_blonde_runner_blonde_ale', 'GIUS Blonde runner (Blonde Ale) ', 3400.0, 'Bebidas', true, 'https:', 'Cuerpo ligero-medio', 'bebida', 3, false, NULL, NULL, NULL),
    ('prod_bebi_gius_indomable_dry_stout', 'GIUS Indomable (Dry Stout)', 3700.0, 'Bebidas', true, 'https:', 'Cerveza negra irlandesa', 'bebida', 3, false, NULL, NULL, NULL),
    ('prod_bebi_gius_ojo_loco_irish_red_ale', 'GIUS Ojo Loco (Irish Red Ale)', 3500.0, 'Bebidas', true, 'https:', 'Cerveza roja Irlandesa', 'bebida', 3, false, NULL, NULL, NULL),
    ('prod_bebi_gius_anda_pa_alla_honey_ale', 'GIUS Anda pa alla (Honey Ale)', 3450.0, 'Bebidas', true, 'https:', 'Caracterizada por la adicion de miel.', 'bebida', 3, false, NULL, NULL, NULL),
    ('prod_bebi_coca_cola_500cc', 'Coca Cola 500cc', 2500.0, 'Bebidas', true, 'https:', '', 'bebida', 3, false, NULL, NULL, NULL),
    ('prod_bebi_bonaqua_500cc', 'Bonaqua 500cc', 2500.0, 'Bebidas', true, 'https:', '', 'bebida', 3, false, NULL, NULL, NULL),
    ('prod_bebi_gius_gente_despierta_light_lager', 'GIUS Gente despierta (Light Lager)', 3400.0, 'Bebidas', true, 'https:', 'Rubia', 'bebida', 3, false, NULL, NULL, NULL),
    ('prod_bebi_sprite_500cc', 'Sprite 500cc', 2500.0, 'Bebidas', true, 'https:', '', 'bebida', 3, false, NULL, NULL, NULL),
    ('prod_bebi_coca_cola_zero_500cc', 'Coca Cola Zero 500cc', 2500.0, 'Bebidas', true, 'https:', '', 'bebida', 3, false, NULL, NULL, NULL),
    ('prod_bebi_fanta_500cc', 'Fanta 500cc', 2500.0, 'Bebidas', true, 'https:', '', 'bebida', 3, false, NULL, NULL, NULL),
    ('prod_post_tiramisu', 'Tiramisú', 9000.0, 'Postres', true, 'https:', 'Clasico postre italiano a base de mascarpone', 'postre', 15, true, ARRAY['Preparar la base del postre Tiramisú.', 'Ensamblar las capas o porciones según la receta artesanal de Colores Pizzería.', 'Decorar y refrigerar/hornear según corresponda.'], NULL, 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_post_bombas_de_crema_chantilly', 'Bombas de Crema Chantilly', 6000.0, 'Postres', true, 'https:', '8 Unidades', 'postre', 15, true, ARRAY['Preparar la base del postre Bombas de Crema Chantilly.', 'Ensamblar las capas o porciones según la receta artesanal de Colores Pizzería.', 'Decorar y refrigerar/hornear según corresponda.'], NULL, 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_post_tarta_de_ricotta', 'Tarta de Ricotta', 6000.0, 'Postres', true, 'https:', '', 'postre', 15, true, ARRAY['Preparar la base del postre Tarta de Ricotta.', 'Ensamblar las capas o porciones según la receta artesanal de Colores Pizzería.', 'Decorar y refrigerar/hornear según corresponda.'], NULL, 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_sand_baguette_lomo', 'Baguette Lomo', 10000.0, 'Sandwiches', true, 'https:', 'Carne de ternera en tiras', 'plato', 15, true, ARRAY['Preparar los ingredientes para Baguette Lomo.', 'Cocinar siguiendo la receta tradicional de la casa.', 'Controlar la temperatura y calidad antes de servir.'], ARRAY['Gluten'], 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_pizz_especial_grande_2_pintas_gius_ipa', 'Especial Grande + 2 Pintas GIUS IPA', 29000.0, 'Pizzas', true, 'https:', '', 'plato', 15, true, ARRAY['Preparar los ingredientes para Especial Grande + 2 Pintas GIUS IPA.', 'Cocinar siguiendo la receta tradicional de la casa.', 'Controlar la temperatura y calidad antes de servir.'], NULL, 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_pizz_pizza_comun', 'Pizza Común', 19000.0, 'Pizzas', true, 'https:', 'Salsa de tomate natural sobre una masa aireada fermentada hasta por 96 horas', 'plato', 15, true, ARRAY['Preparar los ingredientes para Pizza Común.', 'Cocinar siguiendo la receta tradicional de la casa.', 'Controlar la temperatura y calidad antes de servir.'], NULL, 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_pizz_3x2_de_la_casa', '3x2 De La Casa', 25000.0, 'Pizzas', true, 'https:', 'Pepperoni individual', 'plato', 15, true, ARRAY['Preparar los ingredientes para 3x2 De La Casa.', 'Cocinar siguiendo la receta tradicional de la casa.', 'Controlar la temperatura y calidad antes de servir.'], NULL, 'Presentar recién elaborado sobre vajilla/tabla rústica de la casa.'),
    ('prod_pizza_5_quesos_grande', 'Pizza 5 Quesos Grande', 23000.0, 'Pizzas', true, 'https:', 'Azul', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (grande).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Azul', 'provolone', 'morbier', 'fynbo', 'reggianito.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_5_quesos_individual', 'Pizza 5 Quesos Individual', 11500.0, 'Pizzas', true, 'https:', 'Azul', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (individual).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Azul', 'provolone', 'morbier', 'fynbo', 'reggianito.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_pepperoni_individual', 'Pizza Pepperoni Individual', 11000.0, 'Pizzas', true, 'https:', 'Salame Español', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (individual).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Salame Español.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_pepperoni_grande', 'Pizza Pepperoni Grande', 22000.0, 'Pizzas', true, 'https:', 'Salame Español', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (grande).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Salame Español.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_tai_pizza_grande', 'Pizza Tai Pizza Grande', 25000.0, 'Pizzas', true, 'https:', 'Langostinos', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (grande).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Langostinos', 'curry', 'cebolla de verdeo.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_tai_pizza_individual', 'Pizza Tai Pizza Individual', 12500.0, 'Pizzas', true, 'https:', 'Langostinos', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (individual).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Langostinos', 'curry', 'cebolla de verdeo.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_colores_especial_individual', 'Pizza Colores Especial Individual', 11000.0, 'Pizzas', true, 'https:', 'Jamón horneado artesanal y pesto de morron', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (individual).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Jamón horneado artesanal y pesto de morron.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_colores_especial_grande', 'Pizza Colores Especial Grande', 22000.0, 'Pizzas', true, 'https:', 'Jamón horneado artesanal y pesto de morron', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (grande).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Jamón horneado artesanal y pesto de morron.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_hongos_y_cerdo_individual', 'Pizza Hongos y Cerdo Individual', 11500.0, 'Pizzas', true, 'https:', 'Girgolas', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (individual).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Girgolas', 'Jamon horneado artesanal..', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_hongos_y_cerdo_grande', 'Pizza Hongos y Cerdo Grande', 24000.0, 'Pizzas', true, 'https:', 'Girgolas', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (grande).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Girgolas', 'Jamon horneado artesanal..', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_fresca_grande', 'Pizza Fresca Grande', 22000.0, 'Pizzas', true, 'https:', 'Rúcula', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (grande).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Rúcula', 'tomates secos', 'olivas', 'provolone', 'ralladura de limón.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_fresca_individual', 'Pizza Fresca Individual', 11000.0, 'Pizzas', true, 'https:', 'Rúcula', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (individual).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Rúcula', 'tomates secos', 'olivas', 'provolone', 'ralladura de limón.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_comun_grande', 'Pizza Común Grande', 19000.0, 'Pizzas', true, 'https:', 'Salsa tomate', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (grande).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Salsa tomate', 'Muzzarella.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_comun_individual', 'Pizza Común Individual', 10000.0, 'Pizzas', true, 'https:', 'Salsa tomate', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (individual).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Salsa tomate', 'Muzzarella.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_funghi_individual', 'Pizza Funghi Individual', 11500.0, 'Pizzas', true, 'https:', 'Salsa de hongos', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (individual).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Salsa de hongos', 'jamon cocido', 'portobellos', 'fugazza', 'reggianito.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_funghi_grande', 'Pizza Funghi Grande', 24000.0, 'Pizzas', true, 'https:', 'Salsa de hongos', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (grande).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Salsa de hongos', 'jamon cocido', 'portobellos', 'fugazza', 'reggianito.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_anchovy_individual', 'Pizza Anchovy Individual', 11500.0, 'Pizzas', true, 'https:', 'Anchoas', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (individual).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Anchoas', 'salsa cesar', 'reggianito..', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_anchovy_grande', 'Pizza Anchovy Grande', 23000.0, 'Pizzas', true, 'https:', 'Anchoas', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (grande).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Anchoas', 'salsa cesar', 'reggianito..', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_napolitana_individual', 'Pizza Napolitana Individual', 11000.0, 'Pizzas', true, 'https:', 'Rodajas de tomate', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (individual).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Rodajas de tomate', 'ajo rallado', 'provenzal.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.'),
    ('prod_pizza_napolitana_grande', 'Pizza Napolitana Grande', 21500.0, 'Pizzas', true, 'https:', 'Rodajas de tomate', 'plato', 12, true, ARRAY['Estirar el bollo de masa de pizza estilo napolitano (grande).', 'Esparcir la salsa de tomate natural sobre la base.', 'Distribuir los ingredientes: Rodajas de tomate', 'ajo rallado', 'provenzal.', 'Hornear a leña a alta temperatura hasta fundir el queso y dorar el cornicione.', 'Retirar', 'decorar y terminar con un hilo de aceite de oliva virgen.'], ARRAY['Gluten', 'Lácteos'], 'Servir en tabla de madera para pizza de mesa. Cortar en 8 porciones si es Grande, o servir entera si es Individual.')
ON CONFLICT (id_producto) DO NOTHING;

-- Escandallos y relación de recetas
INSERT INTO public.recetas_escandallo (id_receta, id_producto, id_insumo, cantidad_a_descontar, unidad_medida) VALUES
    ('esc_gius_blond', 'prod_bebi_gius_blonde_runner_blonde_ale', 'ins_beb_gius_blonde_runner_blonde_ale', 1.0, 'unidades'),
    ('esc_gius_indom', 'prod_bebi_gius_indomable_dry_stout', 'ins_beb_gius_indomable_dry_stout', 1.0, 'unidades'),
    ('esc_gius_ojo_l', 'prod_bebi_gius_ojo_loco_irish_red_ale', 'ins_beb_gius_ojo_loco_irish_red_ale', 1.0, 'unidades'),
    ('esc_gius_anda', 'prod_bebi_gius_anda_pa_alla_honey_ale', 'ins_beb_gius_anda_pa_alla_honey_ale', 1.0, 'unidades'),
    ('esc_coca_cola', 'prod_bebi_coca_cola_500cc', 'ins_beb_coca_cola_500cc', 1.0, 'unidades'),
    ('esc_bonaqua_50', 'prod_bebi_bonaqua_500cc', 'ins_beb_bonaqua_500cc', 1.0, 'unidades'),
    ('esc_gius_gente', 'prod_bebi_gius_gente_despierta_light_lager', 'ins_beb_gius_gente_despierta_light_lager', 1.0, 'unidades'),
    ('esc_sprite_500', 'prod_bebi_sprite_500cc', 'ins_beb_sprite_500cc', 1.0, 'unidades'),
    ('esc_coca_cola', 'prod_bebi_coca_cola_zero_500cc', 'ins_beb_coca_cola_zero_500cc', 1.0, 'unidades'),
    ('esc_fanta_500c', 'prod_bebi_fanta_500cc', 'ins_beb_fanta_500cc', 1.0, 'unidades'),
    ('esc_pizza_5_quesos_gran', 'prod_pizza_5_quesos_grande', 'ins_mozzarella', 280.0, 'g'),
    ('esc_pizza_m_5_quesos_gran', 'prod_pizza_5_quesos_grande', 'ins_harina_trigo', 250.0, 'g'),
    ('esc_pizza_5_quesos_indi', 'prod_pizza_5_quesos_individual', 'ins_mozzarella', 140.0, 'g'),
    ('esc_pizza_m_5_quesos_indi', 'prod_pizza_5_quesos_individual', 'ins_harina_trigo', 125.0, 'g'),
    ('esc_pizza_pepperon_indi', 'prod_pizza_pepperoni_individual', 'ins_mozzarella', 140.0, 'g'),
    ('esc_pizza_m_pepperon_indi', 'prod_pizza_pepperoni_individual', 'ins_harina_trigo', 125.0, 'g'),
    ('esc_pizza_pepperon_gran', 'prod_pizza_pepperoni_grande', 'ins_mozzarella', 280.0, 'g'),
    ('esc_pizza_m_pepperon_gran', 'prod_pizza_pepperoni_grande', 'ins_harina_trigo', 250.0, 'g'),
    ('esc_pizza_tai_pizz_gran', 'prod_pizza_tai_pizza_grande', 'ins_mozzarella', 280.0, 'g'),
    ('esc_pizza_m_tai_pizz_gran', 'prod_pizza_tai_pizza_grande', 'ins_harina_trigo', 250.0, 'g'),
    ('esc_pizza_tai_pizz_indi', 'prod_pizza_tai_pizza_individual', 'ins_mozzarella', 140.0, 'g'),
    ('esc_pizza_m_tai_pizz_indi', 'prod_pizza_tai_pizza_individual', 'ins_harina_trigo', 125.0, 'g'),
    ('esc_pizza_colores_indi', 'prod_pizza_colores_especial_individual', 'ins_mozzarella', 140.0, 'g'),
    ('esc_pizza_m_colores_indi', 'prod_pizza_colores_especial_individual', 'ins_harina_trigo', 125.0, 'g'),
    ('esc_pizza_colores_gran', 'prod_pizza_colores_especial_grande', 'ins_mozzarella', 280.0, 'g'),
    ('esc_pizza_m_colores_gran', 'prod_pizza_colores_especial_grande', 'ins_harina_trigo', 250.0, 'g'),
    ('esc_pizza_hongos_y_indi', 'prod_pizza_hongos_y_cerdo_individual', 'ins_mozzarella', 140.0, 'g'),
    ('esc_pizza_m_hongos_y_indi', 'prod_pizza_hongos_y_cerdo_individual', 'ins_harina_trigo', 125.0, 'g'),
    ('esc_pizza_hongos_y_gran', 'prod_pizza_hongos_y_cerdo_grande', 'ins_mozzarella', 280.0, 'g'),
    ('esc_pizza_m_hongos_y_gran', 'prod_pizza_hongos_y_cerdo_grande', 'ins_harina_trigo', 250.0, 'g'),
    ('esc_pizza_fresca_gran', 'prod_pizza_fresca_grande', 'ins_mozzarella', 280.0, 'g'),
    ('esc_pizza_m_fresca_gran', 'prod_pizza_fresca_grande', 'ins_harina_trigo', 250.0, 'g'),
    ('esc_pizza_fresca_indi', 'prod_pizza_fresca_individual', 'ins_mozzarella', 140.0, 'g'),
    ('esc_pizza_m_fresca_indi', 'prod_pizza_fresca_individual', 'ins_harina_trigo', 125.0, 'g'),
    ('esc_pizza_comun_gran', 'prod_pizza_comun_grande', 'ins_mozzarella', 280.0, 'g'),
    ('esc_pizza_m_comun_gran', 'prod_pizza_comun_grande', 'ins_harina_trigo', 250.0, 'g'),
    ('esc_pizza_comun_indi', 'prod_pizza_comun_individual', 'ins_mozzarella', 140.0, 'g'),
    ('esc_pizza_m_comun_indi', 'prod_pizza_comun_individual', 'ins_harina_trigo', 125.0, 'g'),
    ('esc_pizza_funghi_indi', 'prod_pizza_funghi_individual', 'ins_mozzarella', 140.0, 'g'),
    ('esc_pizza_m_funghi_indi', 'prod_pizza_funghi_individual', 'ins_harina_trigo', 125.0, 'g'),
    ('esc_pizza_funghi_gran', 'prod_pizza_funghi_grande', 'ins_mozzarella', 280.0, 'g'),
    ('esc_pizza_m_funghi_gran', 'prod_pizza_funghi_grande', 'ins_harina_trigo', 250.0, 'g'),
    ('esc_pizza_anchovy_indi', 'prod_pizza_anchovy_individual', 'ins_mozzarella', 140.0, 'g'),
    ('esc_pizza_m_anchovy_indi', 'prod_pizza_anchovy_individual', 'ins_harina_trigo', 125.0, 'g'),
    ('esc_pizza_anchovy_gran', 'prod_pizza_anchovy_grande', 'ins_mozzarella', 280.0, 'g'),
    ('esc_pizza_m_anchovy_gran', 'prod_pizza_anchovy_grande', 'ins_harina_trigo', 250.0, 'g'),
    ('esc_pizza_napolita_indi', 'prod_pizza_napolitana_individual', 'ins_mozzarella', 140.0, 'g'),
    ('esc_pizza_m_napolita_indi', 'prod_pizza_napolitana_individual', 'ins_harina_trigo', 125.0, 'g'),
    ('esc_pizza_napolita_gran', 'prod_pizza_napolitana_grande', 'ins_mozzarella', 280.0, 'g'),
    ('esc_pizza_m_napolita_gran', 'prod_pizza_napolitana_grande', 'ins_harina_trigo', 250.0, 'g')
ON CONFLICT (id_receta) DO NOTHING;

-- ============================================================
-- 4. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas_escandallo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_cabecera ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mermas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cierres_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_insumo ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'categorias', 'usuarios', 'mesas', 'insumos', 'productos_menu', 'recetas_escandallo', 
    'pedidos_cabecera', 'pedido_detalle', 'mermas', 'cierres_caja', 
    'movimientos_inventario', 'clientes', 'configuracion', 'registro_asistencia', 'lotes_insumo'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'permitir_todo_demo_' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO public USING (true) WITH CHECK (true)', 'permitir_todo_demo_' || t, t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

-- Update reservas table with missing columns
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS lista_espera BOOLEAN DEFAULT false;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS prioridad_espera INT DEFAULT 0;

-- Update proveedores table with missing columns
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS correo TEXT;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS tiempo_entrega_dias INT DEFAULT 1;
