-- Migration: Subdivisión de categoría Bebidas a con/sin Alcohol
-- Date: 2026-06-27

-- 1. Insertar las nuevas categorías si no existen
INSERT INTO categorias (id, nombre, slug, orden, activa, icono)
VALUES 
  ('cat_bebidas_alcohol', 'Bebidas con Alcohol', 'bebidas-con-alcohol', 1, true, 'Wine'),
  ('cat_bebidas_sin_alcohol', 'Bebidas sin Alcohol', 'bebidas-sin-alcohol', 2, true, 'Coffee')
ON CONFLICT (id) DO UPDATE 
SET nombre = EXCLUDED.nombre,
    slug = EXCLUDED.slug,
    icono = EXCLUDED.icono;

-- 2. Desactivar o eliminar la antigua categoría "Bebidas"
UPDATE categorias SET activa = false WHERE slug = 'bebidas';

-- 3. Reordenar las demás categorías para mantener un orden consistente
UPDATE categorias SET orden = 3 WHERE slug = 'calzones-y-empanadas';
UPDATE categorias SET orden = 4 WHERE slug = 'pizzas';
UPDATE categorias SET orden = 5 WHERE slug = 'postres';
UPDATE categorias SET orden = 6 WHERE slug = 'sandwiches';

-- 4. Actualizar la categoría de los productos de menú existentes
-- Primero: Bebidas con Alcohol (cervezas artesanal GIUS, etc.)
UPDATE productos_menu 
SET categoria = 'Bebidas con Alcohol'
WHERE categoria = 'Bebidas' 
  AND (
    LOWER(nombre) LIKE '%gius%' 
    OR LOWER(nombre) LIKE '%cerveza%' 
    OR LOWER(nombre) LIKE '%vino%' 
    OR LOWER(nombre) LIKE '%ale%' 
    OR LOWER(nombre) LIKE '%stout%' 
    OR LOWER(nombre) LIKE '%lager%'
  );

-- Segundo: Bebidas sin Alcohol (gaseosas, agua, etc.)
UPDATE productos_menu 
SET categoria = 'Bebidas sin Alcohol'
WHERE categoria = 'Bebidas' 
  AND (
    LOWER(nombre) LIKE '%coca%' 
    OR LOWER(nombre) LIKE '%sprite%' 
    OR LOWER(nombre) LIKE '%fanta%' 
    OR LOWER(nombre) LIKE '%bonaqua%' 
    OR LOWER(nombre) LIKE '%agua%' 
    OR LOWER(nombre) LIKE '%gaseosa%'
  );

-- Tercero: Cualquier bebida remanente que haya quedado como "Bebidas"
UPDATE productos_menu 
SET categoria = 'Bebidas sin Alcohol'
WHERE categoria = 'Bebidas';
