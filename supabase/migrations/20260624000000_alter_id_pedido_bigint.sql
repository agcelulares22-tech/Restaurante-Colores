-- Migration: Convertir id_pedido y pedido_id de INTEGER a BIGINT
-- Fecha: 2026-06-24
-- Motivo: Los IDs generados localmente usan timestamp+random (ej: 1782312364953733),
--         que exceden el rango de PostgreSQL INTEGER (±2.147.483.647).

-- 1) Tablas dependientes: quitar claves foráneas para poder alterar los tipos
ALTER TABLE IF EXISTS pedido_detalle
  DROP CONSTRAINT IF EXISTS pedido_detalle_id_pedido_fkey;

ALTER TABLE IF EXISTS facturas
  DROP CONSTRAINT IF EXISTS facturas_id_pedido_fkey;

ALTER TABLE IF EXISTS movimientos_inventario
  DROP CONSTRAINT IF EXISTS movimientos_inventario_id_pedido_fkey;

-- 2) Cambiar la columna fuente a BIGINT
ALTER TABLE pedidos_cabecera
  ALTER COLUMN id_pedido TYPE BIGINT;

-- 3) Cambiar columnas foráneas a BIGINT
ALTER TABLE pedido_detalle
  ALTER COLUMN id_pedido TYPE BIGINT;

ALTER TABLE facturas
  ALTER COLUMN id_pedido TYPE BIGINT;

ALTER TABLE movimientos_inventario
  ALTER COLUMN id_pedido TYPE BIGINT;

-- 4) Recrear claves foráneas
ALTER TABLE pedido_detalle
  ADD CONSTRAINT pedido_detalle_id_pedido_fkey
  FOREIGN KEY (id_pedido) REFERENCES public.pedidos_cabecera(id_pedido) ON DELETE CASCADE;

ALTER TABLE facturas
  ADD CONSTRAINT facturas_id_pedido_fkey
  FOREIGN KEY (id_pedido) REFERENCES public.pedidos_cabecera(id_pedido) ON DELETE SET NULL;

ALTER TABLE movimientos_inventario
  ADD CONSTRAINT movimientos_inventario_id_pedido_fkey
  FOREIGN KEY (id_pedido) REFERENCES public.pedidos_cabecera(id_pedido) ON DELETE SET NULL;

-- 5) Recrear índices por si el DROP CONSTRAINT los eliminó
CREATE INDEX IF NOT EXISTS idx_pedido_detalle_pedido ON pedido_detalle(id_pedido);
CREATE INDEX IF NOT EXISTS idx_mov_inventario_pedido ON movimientos_inventario(id_pedido);
CREATE INDEX IF NOT EXISTS idx_facturas_pedido ON facturas(id_pedido);
