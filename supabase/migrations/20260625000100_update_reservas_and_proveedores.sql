-- Update reservas table with missing columns
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS lista_espera BOOLEAN DEFAULT false;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS prioridad_espera INT DEFAULT 0;

-- Update proveedores table with missing columns
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS correo TEXT;
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS tiempo_entrega_dias INT DEFAULT 1;
