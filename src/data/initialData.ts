import { Usuario, Mesa, Insumo, ProductoMenu, RecetaEscandallo, Pedido } from '../types';

export const INITIAL_USUARIOS: Usuario[] = [
  { id_usuario: 1, nombre: 'Super Admin', apellido: '', username: 'super@admi.com', password: 'superadmi2026/', rol: 'superadmin' },
  { id_usuario: 2, nombre: 'Administrador', apellido: '', username: 'admi@patron.com', password: 'Elpatron2026/', rol: 'administrador' },
  { id_usuario: 3, nombre: 'Mozo', apellido: '', username: 'mozo@patron.com', password: 'Elpatronmozo2026/', rol: 'mozo' },
  { id_usuario: 4, nombre: 'Enzo', apellido: 'Fernández', username: 'enzo', password: '1234', rol: 'mozo' },
  { id_usuario: 5, nombre: 'Micaela', apellido: 'Gómez', username: 'micaela', password: '1234', rol: 'mozo' },
  { id_usuario: 6, nombre: 'Damián', apellido: 'Martínez', username: 'damian', password: '1234', rol: 'cocina' },
  { id_usuario: 7, nombre: 'Sofía', apellido: 'Alegre', username: 'sofia', password: '1234', rol: 'administrador' },
  { id_usuario: 8, nombre: 'Nuevo', apellido: 'Usuario', username: 'nuevo', password: 'clave', rol: 'mozo' },
  { id_usuario: 9, nombre: 'Admin', apellido: '', username: 'admin', password: '1998', rol: 'superadmin' },
];

export const INITIAL_MESAS: Mesa[] = [
  { id_mesa: 1, numero_mesa: 'Mesa 1', estado: 'libre' },
  { id_mesa: 2, numero_mesa: 'Mesa 2', estado: 'ocupada', comensales: 2 },
  { id_mesa: 3, numero_mesa: 'Mesa 3', estado: 'libre' },
  { id_mesa: 4, numero_mesa: 'Mesa 4', estado: 'ocupada', comensales: 3 },
  { id_mesa: 5, numero_mesa: 'Mesa 5', estado: 'libre' },
  { id_mesa: 6, numero_mesa: 'Mesa 6', estado: 'libre' },
  { id_mesa: 8, numero_mesa: 'Mesa 8', estado: 'ocupada', comensales: 1 },
  { id_mesa: 12, numero_mesa: 'Mesa 12', estado: 'ocupada', comensales: 4 },
  { id_mesa: 101, numero_mesa: 'VIP-1', estado: 'libre' },
  { id_mesa: 102, numero_mesa: 'Terraza-3', estado: 'libre' },
];

export const INITIAL_INSUMOS: Insumo[] = [
  // 1. Materias primas de Cocina - Masas y Salsas
  { id_insumo: 'ins_harina_trigo', nombre: 'Harina de Trigo sémola', stock_actual: 40000.0, stock_minimo: 10000.0, unidad_medida: 'g', categoria: 'secos', subcategoria: 'Harinas', proveedor: 'Molino Cañuelas', costo_unitario: 0.8, es_bebida_directa: false },
  { id_insumo: 'ins_levadura', nombre: 'Levadura seca de cerveza', stock_actual: 5000.0, stock_minimo: 1000.0, unidad_medida: 'g', categoria: 'secos', subcategoria: 'Levaduras', proveedor: 'Distribuidora Altiplano', costo_unitario: 3.5, es_bebida_directa: false },
  { id_insumo: 'ins_pure_tomate', nombre: 'Puré de Tomate Triturado', stock_actual: 30000.0, stock_minimo: 8000.0, unidad_medida: 'g', categoria: 'secos', subcategoria: 'Conservas', proveedor: 'Mercado de Abasto', costo_unitario: 2.2, es_bebida_directa: false },
  { id_insumo: 'ins_aceite_oliva', nombre: 'Aceite de oliva extra virgen', stock_actual: 20000.0, stock_minimo: 4000.0, unidad_medida: 'ml', categoria: 'secos', subcategoria: 'Aceites', proveedor: 'Gourmet Imports', costo_unitario: 12.0, es_bebida_directa: false },
  
  // 2. Lácteos y Quesos
  { id_insumo: 'ins_mozzarella', nombre: 'Queso Mozzarella en Barra', stock_actual: 35000.0, stock_minimo: 8000.0, unidad_medida: 'g', categoria: 'frescos', subcategoria: 'Lácteos', proveedor: 'Lácteos La Bocha', costo_unitario: 8.5, es_bebida_directa: false },
  { id_insumo: 'ins_fior_di_latte', nombre: 'Mozzarella Fior di Latte artesanal', stock_actual: 40.0, stock_minimo: 10.0, unidad_medida: 'unidades', categoria: 'frescos', subcategoria: 'Lácteos', proveedor: 'Lácteos La Bocha', costo_unitario: 850.0, es_bebida_directa: false },
  { id_insumo: 'ins_parmesano', nombre: 'Queso Parmesano Rallado', stock_actual: 10000.0, stock_minimo: 2000.0, unidad_medida: 'g', categoria: 'frescos', subcategoria: 'Lácteos', proveedor: 'Lácteos La Bocha', costo_unitario: 11.5, es_bebida_directa: false },
  { id_insumo: 'ins_provolone', nombre: 'Queso Provolone Hilado de Campo', stock_actual: 12000.0, stock_minimo: 3000.0, unidad_medida: 'g', categoria: 'frescos', subcategoria: 'Lácteos', proveedor: 'Lácteos La Bocha', costo_unitario: 7.5, es_bebida_directa: false },
  { id_insumo: 'ins_queso_azul', nombre: 'Queso Azul Premium', stock_actual: 5000.0, stock_minimo: 1000.0, unidad_medida: 'g', categoria: 'frescos', subcategoria: 'Lácteos', proveedor: 'Lácteos La Bocha', costo_unitario: 9.8, es_bebida_directa: false },

  // 3. Toppings y Fiambres
  { id_insumo: 'ins_jamon_cocido', nombre: 'Jamón cocido de primera calidad', stock_actual: 15000.0, stock_minimo: 4000.0, unidad_medida: 'g', categoria: 'frescos', subcategoria: 'Fiambrería', proveedor: 'Frigorífico El Triunfo', costo_unitario: 5.5, es_bebida_directa: false },
  { id_insumo: 'ins_jamon_crudo', nombre: 'Jamón crudo estacionado 12 meses', stock_actual: 8000.0, stock_minimo: 2000.0, unidad_medida: 'g', categoria: 'frescos', subcategoria: 'Fiambrería', proveedor: 'Frigorífico El Triunfo', costo_unitario: 14.5, es_bebida_directa: false },
  { id_insumo: 'ins_cantimpalo', nombre: 'Salame Cantimpalo / Calabresa', stock_actual: 10000.0, stock_minimo: 2000.0, unidad_medida: 'g', categoria: 'secos', subcategoria: 'Fiambrería', proveedor: 'Frigorífico El Triunfo', costo_unitario: 8.2, es_bebida_directa: false },
  { id_insumo: 'ins_panceta', nombre: 'Panceta Ahumada Laminada', stock_actual: 12000.0, stock_minimo: 3000.0, unidad_medida: 'g', categoria: 'frescos', subcategoria: 'Fiambrería', proveedor: 'Frigorífico El Triunfo', costo_unitario: 9.0, es_bebida_directa: false },
  { id_insumo: 'ins_aceitunas', nombre: 'Aceitunas verdes rellenas y descarozadas', stock_actual: 5000.0, stock_minimo: 1500.0, unidad_medida: 'g', categoria: 'secos', subcategoria: 'Conservas', proveedor: 'Distribuidora Altiplano', costo_unitario: 3.8, es_bebida_directa: false },
  { id_insumo: 'ins_albahaca', nombre: 'Albahaca fresca de huerta', stock_actual: 3000.0, stock_minimo: 1000.0, unidad_medida: 'g', categoria: 'frescos', subcategoria: 'Vegetales', proveedor: 'Mercado de Abasto', costo_unitario: 2.5, es_bebida_directa: false },
  { id_insumo: 'ins_morrones', nombre: 'Pimientos rojos (Morrón en conserva)', stock_actual: 12000.0, stock_minimo: 3000.0, unidad_medida: 'g', categoria: 'secos', subcategoria: 'Conservas', proveedor: 'Distribuidora Altiplano', costo_unitario: 4.8, es_bebida_directa: false },
  { id_insumo: 'ins_cebolla', nombre: 'Cebolla blanca seleccionada', stock_actual: 40000.0, stock_minimo: 10000.0, unidad_medida: 'g', categoria: 'frescos', subcategoria: 'Vegetales', proveedor: 'Mercado de Abasto', costo_unitario: 1.2, es_bebida_directa: false },

  // 4. Empanadas y Fainá
  { id_insumo: 'ins_empanada_relleno', nombre: 'Relleno criollo de carne cortado a cuchillo', stock_actual: 15000.0, stock_minimo: 4000.0, unidad_medida: 'g', categoria: 'frescos', subcategoria: 'Rellenos', proveedor: 'Cocina Central', costo_unitario: 6.8, es_bebida_directa: false },
  { id_insumo: 'ins_faina_preparacion', nombre: 'Harina de Garbanzo base fainá', stock_actual: 10000.0, stock_minimo: 2000.0, unidad_medida: 'g', categoria: 'secos', subcategoria: 'Harinas', proveedor: 'Molino Cañuelas', costo_unitario: 2.5, es_bebida_directa: false },

  // 5. Postres
  { id_insumo: 'ins_dulce_leche', nombre: 'Dulce de Leche repostero', stock_actual: 16000.0, stock_minimo: 4000.0, unidad_medida: 'g', categoria: 'secos', subcategoria: 'Dulces', proveedor: 'Lácteos La Bocha', costo_unitario: 3.5, es_bebida_directa: false },
  { id_insumo: 'ins_chocolate_belga', nombre: 'Chocolate amargo belga 70%', stock_actual: 5000.0, stock_minimo: 1500.0, unidad_medida: 'g', categoria: 'secos', subcategoria: 'Especialidades', proveedor: 'Gourmet Imports', costo_unitario: 16.0, es_bebida_directa: false },
  { id_insumo: 'ins_helado_crema', nombre: 'Helado Cream Americana', stock_actual: 30.0, stock_minimo: 5.0, unidad_medida: 'unidades', categoria: 'frescos', subcategoria: 'Postres', proveedor: 'Gourmet Imports', costo_unitario: 350.0, es_bebida_directa: false },
  { id_insumo: 'ins_peras_und', nombre: 'Peras frescas premium', stock_actual: 80.0, stock_minimo: 15.0, unidad_medida: 'unidades', categoria: 'frescos', subcategoria: 'Vegetales', proveedor: 'Mercado de Abasto', costo_unitario: 90.0, es_bebida_directa: false },

  // 6. Insumos de Bodega (Vinos de Excel / Directos)
  // La Rural
  { id_insumo: "ins_vin_trumpeter_malbec", nombre: "Trumpeter Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "La Rural Winery", costo_unitario: 3200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_trumpeter_red_blend", nombre: "Trumpeter Red Blend Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "La Rural Winery", costo_unitario: 3000.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_trumpeter_chardonnay", nombre: "Trumpeter Chardonnay Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "La Rural Winery", costo_unitario: 2900.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_trumpeter_doux", nombre: "Trumpeter Doux Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "La Rural Winery", costo_unitario: 2900.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_encuentro_malbec", nombre: "Encuentro Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "La Rural Winery", costo_unitario: 4800.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_rutini_malbec", nombre: "Rutini Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "La Rural Winery", costo_unitario: 6800.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_rutini_cabernet_sauvignon", nombre: "Rutini Cabernet Sauvignon Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "La Rural Winery", costo_unitario: 6800.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_rutini_cabernet_franc", nombre: "Rutini Cabernet Franc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "La Rural Winery", costo_unitario: 7200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_rutini_merlot", nombre: "Rutini Merlot Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "La Rural Winery", costo_unitario: 6500.0, es_bebida_directa: true },
  // Escorihuela Gascón
  { id_insumo: "ins_vin_escorihuela_gascon_malbec", nombre: "Escorihuela Gascón Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Escorihuela Gascón S.A.", costo_unitario: 4200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_escorihuela_gascon_cabernet_sauvignon", nombre: "Escorihuela Gascón Cabernet Sauvignon Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Escorihuela Gascón S.A.", costo_unitario: 4200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_escorihuela_gascon_pinot_noir", nombre: "Escorihuela Gascón Pinot Noir Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Escorihuela Gascón S.A.", costo_unitario: 4500.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_escorihuela_gascon_chardonnay", nombre: "Escorihuela Gascón Chardonnay Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Escorihuela Gascón S.A.", costo_unitario: 4100.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_escorihuela_gascon_sauvignon_blanc", nombre: "Escorihuela Gascón Sauvignon Blanc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Escorihuela Gascón S.A.", costo_unitario: 4100.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_eg_gran_reserva_malbec", nombre: "E.G Gran Reserva Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Escorihuela Gascón S.A.", costo_unitario: 6800.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_pequenas_producciones_malbec", nombre: "Pequeñas Producciones Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Escorihuela Gascón S.A.", costo_unitario: 9500.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_pequenas_producciones_cabernet_franc", nombre: "Pequeñas Producciones Cabernet Franc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Escorihuela Gascón S.A.", costo_unitario: 9500.0, es_bebida_directa: true },
  // Ruca Malen
  { id_insumo: "ins_vin_capitulo_2_malbec", nombre: "Capítulo 2 Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Ruca Malen S.A.", costo_unitario: 3800.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_capitulo_2_cabernet_sauvignon", nombre: "Capítulo 2 Cabernet Sauvignon Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Ruca Malen S.A.", costo_unitario: 3800.0, es_bebida_directa: true },
  // Catena Zapata
  { id_insumo: "ins_vin_alamos_red_blend", nombre: "Alamos Red Blend Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 2400.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_saint_felicien_malbec", nombre: "Saint Felicien Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 5200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_saint_felicien_cabernet_sauvignon", nombre: "Saint Felicien Cabernet Sauvignon Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 5200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_saint_felicien_chardonnay", nombre: "Saint Felicien Chardonnay Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Catena Zapata Winery", costo_unitario: 4900.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_saint_felicien_sauvignon_blanc", nombre: "Saint Felicien Sauvignon Blanc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Catena Zapata Winery", costo_unitario: 4900.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_nicasia_red_blend", nombre: "Nicasia Red Blend Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 4500.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_nicasia_malbec", nombre: "Nicasia Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 4500.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_padrillo_malbec", nombre: "Padrillo Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 3100.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_padrillo_pinot_noir", nombre: "Padrillo Pinot Noir Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 3100.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_dv_catena_malbec", nombre: "DV Catena Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 8900.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_dv_catena_cabernet_sauvignon", nombre: "DV Catena Cabernet Sauvignon Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 8900.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_dv_catena_pinot_noir", nombre: "DV Catena Pinot Noir Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 9200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_el_enemigo_malbec", nombre: "El Enemigo Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 9800.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_el_enemigo_cabernet_franc", nombre: "El Enemigo Cabernet Franc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 9800.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_tikal_natural_malbec", nombre: "Tikal Natural Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 7500.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_angelica_zapata_malbec", nombre: "Angélica Zapata Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 14500.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_angelica_zapata_merlot", nombre: "Angélica Zapata Merlot Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 14500.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_angelica_zapata_chardonnay", nombre: "Angélica Zapata Chardonnay Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Catena Zapata Winery", costo_unitario: 14000.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_catena_zapata_argentino_malbec", nombre: "Catena Zapata Argentino Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 28000.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_luca_malbec", nombre: "Luca Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Catena Zapata Winery", costo_unitario: 8200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_luca_chardonnay", nombre: "Luca Chardonnay Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Catena Zapata Winery", costo_unitario: 8200.0, es_bebida_directa: true },
  // Las Perdices
  { id_insumo: "ins_vin_las_perdices_malbec", nombre: "Las Perdices Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 3400.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_cabernet_sauvignon", nombre: "Las Perdices Cabernet Sauvignon Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 3400.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_sauvignon_blanc", nombre: "Las Perdices Sauvignon Blanc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Las Perdices S.A.", costo_unitario: 3200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_torrontes", nombre: "Las Perdices Torrontes Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Las Perdices S.A.", costo_unitario: 3200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_torrontes_dulce", nombre: "Las Perdices Torrontes Dulce Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Las Perdices S.A.", costo_unitario: 3300.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_reserva_malbec", nombre: "Las Perdices Reserva Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 4800.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_reserva_cabernet_sauvignon", nombre: "Las Perdices Reserva Cabernet Sauvignon Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 4800.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_reserva_pinot_noir", nombre: "Las Perdices Reserva Pinot Noir Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 5000.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_reserva_chardonnay", nombre: "Las Perdices Reserva Chardonnay Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Las Perdices S.A.", costo_unitario: 4600.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_reserva_sauvignon_blanc", nombre: "Las Perdices Reserva Sauvignon Blanc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Las Perdices S.A.", costo_unitario: 4600.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_don_juan_malbec", nombre: "Las Perdices Don Juan Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 16000.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_exploracion_las_compuertas", nombre: "Las Perdices Exploración Las Compuertas Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 6500.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_exploracion_chacayes", nombre: "Las Perdices Exploración Chacayes Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 6500.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_exploracion_albarino", nombre: "Las Perdices Exploración Albariño Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Las Perdices S.A.", costo_unitario: 5800.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_exploracion_riesling", nombre: "Las Perdices Exploración Riesling Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Las Perdices S.A.", costo_unitario: 5800.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_exploracion_gewurztraminer", nombre: "Las Perdices Exploración Gewurztraminer Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Las Perdices S.A.", costo_unitario: 5900.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_ala_colorada_ancelotta", nombre: "Las Perdices Ala Colorada Ancelotta Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 7200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_ala_colorada_cabernet_franc", nombre: "Las Perdices Ala Colorada Cabernet Franc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 7200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_ala_colorada_tannat", nombre: "Las Perdices Ala Colorada Tannat Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 7200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_ala_colorada_petit_verdot", nombre: "Las Perdices Ala Colorada Petit Verdot Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 7200.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_las_perdices_alae_malbec", nombre: "Las Perdices Alae Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Las Perdices S.A.", costo_unitario: 28000.0, es_bebida_directa: true },
  // Salentein
  { id_insumo: "ins_vin_portillo_malbec", nombre: "Portillo Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Salentein S.A.", costo_unitario: 2100.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_portillo_sauvignon_blanc", nombre: "Portillo Sauvignon Blanc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Salentein S.A.", costo_unitario: 2100.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_salentein_reserva_malbec", nombre: "Salentein Reserva Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Salentein S.A.", costo_unitario: 4400.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_salentein_reserva_pinot_noir", nombre: "Salentein Reserva Pinot Noir Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Salentein S.A.", costo_unitario: 4600.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_salentein_reserva_chardonnay", nombre: "Salentein Reserva Chardonnay Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Salentein S.A.", costo_unitario: 4400.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_salentein_reserva_sauvignon_blanc", nombre: "Salentein Reserva Sauvignon Blanc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Salentein S.A.", costo_unitario: 4400.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_pyros_malbec", nombre: "Pyros Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Salentein S.A.", costo_unitario: 6900.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_pyros_sauvignon_blanc", nombre: "Pyros Sauvignon Blanc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos blancos", proveedor: "Salentein S.A.", costo_unitario: 6500.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_salentein_numina_malbec", nombre: "Salentein Numina Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Salentein S.A.", costo_unitario: 8100.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_salentein_numina_cabernet_franc", nombre: "Salentein Numina Cabernet Franc Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Salentein S.A.", costo_unitario: 8100.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_salentein_numina_pinot_noir", nombre: "Salentein Numina Pinot Noir Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Salentein S.A.", costo_unitario: 8400.0, es_bebida_directa: true },
  { id_insumo: "ins_vin_salentein_primus_malbec", nombre: "Salentein Primus Malbec Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "Salentein S.A.", costo_unitario: 22000.0, es_bebida_directa: true },
  // Champagne
  { id_insumo: "ins_champ_baron_b_brut_nature", nombre: "Baron B Brut Nature Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Espumantes / Champagne", proveedor: "Champagne S.A.", costo_unitario: 12000.0, es_bebida_directa: true },
  { id_insumo: "ins_champ_baron_b_extra_brut", nombre: "Baron B Extra Brut Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Espumantes / Champagne", proveedor: "Champagne S.A.", costo_unitario: 12000.0, es_bebida_directa: true },
  { id_insumo: "ins_champ_alyda_extra_brut", nombre: "Alyda Extra Brut Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Espumantes / Champagne", proveedor: "Champagne S.A.", costo_unitario: 8500.0, es_bebida_directa: true },
  { id_insumo: "ins_champ_encuentro_extra_brut", nombre: "Encuentro Extra Brut Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Espumantes / Champagne", proveedor: "Champagne S.A.", costo_unitario: 5800.0, es_bebida_directa: true },
  { id_insumo: "ins_champ_salentein_extra_brut", nombre: "Salentein Extra Brut Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Espumantes / Champagne", proveedor: "Champagne S.A.", costo_unitario: 4600.0, es_bebida_directa: true },
  { id_insumo: "ins_champ_chandon_extra_brut", nombre: "Chandon Extra Brut Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Espumantes / Champagne", proveedor: "Champagne S.A.", costo_unitario: 5400.0, es_bebida_directa: true },
  // Spirits
  { id_insumo: "ins_spir_whisky_macallan_12_anos", nombre: "Whisky Macallan 12 Años Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Whisky", proveedor: "Spirits S.A.", costo_unitario: 45000.0, es_bebida_directa: true },
  { id_insumo: "ins_spir_gin_tonic_heraclito", nombre: "Gin Tonic Heráclito Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Gin", proveedor: "Spirits S.A.", costo_unitario: 3500.0, es_bebida_directa: true },
  { id_insumo: "ins_spir_fernet_branca", nombre: "Fernet Branca Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Fernet", proveedor: "Spirits S.A.", costo_unitario: 3800.0, es_bebida_directa: true },
  { id_insumo: "ins_spir_aperol_spritz", nombre: "Aperol Spritz Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Aperitivos", proveedor: "Spirits S.A.", costo_unitario: 2900.0, es_bebida_directa: true },

  // Soft drinks & basics
  { id_insumo: "ins_beb_gaseosa", nombre: "Lata Gaseosa Cola 354ml", stock_actual: 120.0, stock_minimo: 30.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Gaseosas", proveedor: "Coca-Cola Andina", costo_unitario: 650.0, es_bebida_directa: true },
  { id_insumo: "ins_beb_coca_cola_original", nombre: "Lata Coca-Cola Original 354ml", stock_actual: 150.0, stock_minimo: 30.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Gaseosas", proveedor: "Coca-Cola Andina", costo_unitario: 650.0, es_bebida_directa: true },
  { id_insumo: "ins_beb_coca_cola_zero", nombre: "Lata Coca-Cola Sin Azúcar 354ml", stock_actual: 120.0, stock_minimo: 30.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Gaseosas", proveedor: "Coca-Cola Andina", costo_unitario: 650.0, es_bebida_directa: true },
  { id_insumo: "ins_beb_sprite", nombre: "Lata Sprite Limón 354ml", stock_actual: 100.0, stock_minimo: 20.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Gaseosas", proveedor: "Coca-Cola Andina", costo_unitario: 650.0, es_bebida_directa: true },
  { id_insumo: "ins_beb_sprite_zero", nombre: "Lata Sprite Sin Azúcar 354ml", stock_actual: 80.0, stock_minimo: 20.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Gaseosas", proveedor: "Coca-Cola Andina", costo_unitario: 650.0, es_bebida_directa: true },
  { id_insumo: "ins_beb_fanta", nombre: "Lata Fanta Naranja 354ml", stock_actual: 90.0, stock_minimo: 20.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Gaseosas", proveedor: "Coca-Cola Andina", costo_unitario: 650.0, es_bebida_directa: true },
  { id_insumo: "ins_beb_agua", nombre: "Botella Agua de Manantial 500ml", stock_actual: 150.0, stock_minimo: 40.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Agua", proveedor: "Cervecería Quilmes", costo_unitario: 450.0, es_bebida_directa: true },
  { id_insumo: "ins_cafe_grano", nombre: "Café de especialidad grano tostado", stock_actual: 10000.0, stock_minimo: 2000.0, unidad_medida: "g", categoria: "secos", subcategoria: "Cafetería", proveedor: "Caffé Zatti", costo_unitario: 15.0, es_bebida_directa: false },
];

export const INITIAL_PRODUCTOS_MENU: ProductoMenu[] = [
  // ================= 1. ENTRADAS & ACOMPAÑAMIENTOS =================
  {
    id_producto: 'prod_ent_provoleta',
    nombre: 'Provoleta al Horno de Barro',
    descripcion: 'Queso provolone fundido con orégano fresco, tomates confitados y un toque de oliva.',
    precio_venta: 4900.00,
    categoria: 'Entradas',
    activo: true,
    imagen: '/images/provoleta.jpg',
    tipo: 'plato',
    tiempo_preparacion_estimado: 10,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_ent_empanadas',
    nombre: 'Empanadas de Carne a la Leña',
    descripcion: 'Tradicionales empanadas criollas horneadas a alta temperatura (porción de 2 unidades).',
    precio_venta: 3200.00,
    categoria: 'Empanadas',
    activo: true,
    imagen: '/images/empanadas.jpg',
    tipo: 'plato',
    tiempo_preparacion_estimado: 8,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_ent_faina_simple',
    nombre: 'Fainá Simple Dorada',
    descripcion: 'Porción clásica de fainá crujiente de garbanzos cocida al molde de piedra.',
    precio_venta: 1800.00,
    categoria: 'Fainá',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&q=80&auto=format&fit=crop',
    tipo: 'plato',
    tiempo_preparacion_estimado: 5,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_ent_faina_verdeo',
    nombre: 'Fainá con Cebolla de Verdeo',
    descripcion: 'Nuestra fainá clásica con cebolla de verdeo salteada y parmesano gratinado.',
    precio_venta: 2200.00,
    categoria: 'Fainá',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&q=80&auto=format&fit=crop',
    tipo: 'plato',
    tiempo_preparacion_estimado: 6,
    requiere_cocina: true
  },

  // ================= 2. PIZZAS TRADICIONALES =================
  {
    id_producto: 'prod_pas_muzarela',
    nombre: 'Pizza Muzzarella Tradicional',
    descripcion: 'Salsa de tomate casera, abundante muzzarella, aceitunas y orégano.',
    precio_venta: 7500.00,
    categoria: 'Pizzas Tradicionales',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pas_especial',
    nombre: 'Pizza Especial de Jamón y Morrones',
    descripcion: 'Salsa de tomate casera, muzzarella, jamón cocido y pimientos morrones en tiras.',
    precio_venta: 9200.00,
    categoria: 'Pizzas Tradicionales',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 14,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pas_calabresa',
    nombre: 'Pizza Calabresa',
    descripcion: 'Muzzarella, rodajas finas de longaniza calabresa, orégano y aceitunas negras.',
    precio_venta: 9800.00,
    categoria: 'Pizzas Tradicionales',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pas_fugazzeta',
    nombre: 'Pizza Fugazzeta con Queso',
    descripcion: 'Abundante cebolla en pluma, muzzarella, aceite de oliva, orégano y aceitunas.',
    precio_venta: 8500.00,
    categoria: 'Pizzas Tradicionales',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },

  // ================= 3. PIZZAS GOURMET =================
  {
    id_producto: 'prod_car_margherita_premium',
    nombre: 'Pizza Margherita Premium',
    descripcion: 'Salsa de tomates italianos, mozzarella Fior di Latte fresca, albahaca y aceite de oliva virgen.',
    precio_venta: 11000.00,
    categoria: 'Pizzas Gourmet',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_car_cuatro_quesos',
    nombre: 'Pizza Cuatro Quesos de la Casa',
    descripcion: 'Muzzarella, provolone hilado, queso azul premium y lluvia de parmesano rallado.',
    precio_venta: 12500.00,
    categoria: 'Pizzas Gourmet',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 14,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_car_rucula_crudo',
    nombre: 'Pizza de Rúcula y Jamón Crudo',
    descripcion: 'Muzzarella, hojas de rúcula fresca, jamón crudo estacionado y lascas de parmesano.',
    precio_venta: 13500.00,
    categoria: 'Pizzas Gourmet',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1574126154517-d1e0d89ef734?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 13,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_car_panceta_verdeo',
    nombre: 'Pizza de Panceta y Verdeo',
    descripcion: 'Muzzarella, panceta ahumada crujiente, cebolla de verdeo al horno y oliva.',
    precio_venta: 12000.00,
    categoria: 'Pizzas Gourmet',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 14,
    requiere_cocina: true
  },

  // ================= 4. POSTRES =================
  {
    id_producto: 'prod_pos_flan',
    nombre: 'Flan Casero con Dulce de Leche y Crema',
    descripcion: 'El clásico flan de huevo sedoso con dulce de leche familiar y crema batida.',
    precio_venta: 3500.00,
    categoria: 'Postres',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=500&q=80&auto=format&fit=crop',
    tipo: 'postre',
    tiempo_preparacion_estimado: 5,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pos_volcan',
    nombre: 'Volcán de Chocolate con Helado',
    descripcion: 'Con centro de chocolate líquido caliente, acompañado de helado de crema americana.',
    precio_venta: 4800.00,
    categoria: 'Postres',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80&auto=format&fit=crop',
    tipo: 'postre',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pos_tiramisu',
    nombre: 'Tiramisú de Mascarpone y Café',
    descripcion: 'Vainillas humedecidas en expreso italiano, crema de mascarpone y cacao amargo.',
    precio_venta: 4200.00,
    categoria: 'Postres',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80&auto=format&fit=crop',
    tipo: 'postre',
    tiempo_preparacion_estimado: 4,
    requiere_cocina: true
  },

  // ================= 5. BODEGA & BEBIDAS GENERALES =================
  // La Rural
  {
    id_producto: "prod_vin_trumpeter_malbec",
    nombre: "Trumpeter Malbec",
    descripcion: "Bodega La Rural. Excelente maridaje para nuestras pizzas gourmet.",
    precio_venta: 9500.00,
    categoria: "Bodega",
    subcategoria: "Vinos tintos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1553184118-d20774c4c1db?w=500&q=80",
    tipo: "vino",
    requiere_cocina: false
  },
  {
    id_producto: "prod_vin_trumpeter_red_blend",
    nombre: "Trumpeter Red Blend",
    descripcion: "Bodega La Rural. Delicado blend de uvas seleccionadas.",
    precio_venta: 9000.00,
    categoria: "Bodega",
    subcategoria: "Vinos tintos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1553184118-d20774c4c1db?w=500&q=80",
    tipo: "vino",
    requiere_cocina: false
  },
  {
    id_producto: "prod_vin_trumpeter_chardonnay",
    nombre: "Trumpeter Chardonnay",
    descripcion: "Bodega La Rural. Vino blanco fresco y afrutado.",
    precio_venta: 8500.00,
    categoria: "Bodega",
    subcategoria: "Vinos blancos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1585553616435-2dc0a54e2319?w=500&q=80",
    tipo: "vino",
    requiere_cocina: false
  },
  {
    id_producto: "prod_vin_rutini_malbec",
    nombre: "Rutini Malbec",
    descripcion: "Crianza distinguida en roble. Alta gama.",
    precio_venta: 18000.00,
    categoria: "Bodega",
    subcategoria: "Vinos tintos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1553184118-d20774c4c1db?w=500&q=80",
    tipo: "vino",
    requiere_cocina: false
  },

  // Spirits
  {
    id_producto: "prod_spir_fernet_branca",
    nombre: "Fernet Branca con Cola",
    descripcion: "Trago clásico argentino preparado con hielo y Coca-Cola.",
    precio_venta: 4200.00,
    categoria: "Bebidas",
    subcategoria: "Fernet",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&q=80",
    tipo: "bebida",
    requiere_cocina: false
  },
  {
    id_producto: "prod_spir_aperol_spritz",
    nombre: "Aperol Spritz",
    descripcion: "Aperol, espumante, soda y rodaja de naranja fresca.",
    precio_venta: 4500.00,
    categoria: "Bebidas",
    subcategoria: "Aperitivos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80",
    tipo: "bebida",
    requiere_cocina: false
  },

  // Gaseosas y Básicos
  {
    id_producto: 'prod_gaseosa',
    nombre: 'Gaseosa Cola Común (Lata)',
    descripcion: 'Lata de Coca-Cola sabor original de 354ml bien helada.',
    precio_venta: 2200.00,
    categoria: 'Bebidas',
    subcategoria: 'Gaseosas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80&auto=format&fit=crop',
    tipo: 'bebida',
    requiere_cocina: false
  },
  {
    id_producto: 'prod_coca_cola_original',
    nombre: 'Coca-Cola Sabor Original (Lata)',
    descripcion: 'Lata de Coca-Cola original de 354ml.',
    precio_venta: 2200.00,
    categoria: 'Bebidas',
    subcategoria: 'Gaseosas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80&auto=format&fit=crop',
    tipo: 'bebida',
    requiere_cocina: false
  },
  {
    id_producto: 'prod_coca_cola_zero',
    nombre: 'Coca-Cola Sin Azúcar (Lata)',
    descripcion: 'Lata de Coca-Cola Zero azúcar de 354ml.',
    precio_venta: 2200.00,
    categoria: 'Bebidas',
    subcategoria: 'Gaseosas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&q=80&auto=format&fit=crop',
    tipo: 'bebida',
    requiere_cocina: false
  },
  {
    id_producto: 'prod_sprite',
    nombre: 'Sprite Sabor Original (Lata)',
    descripcion: 'Lata de Sprite de 354ml bien fría.',
    precio_venta: 2200.00,
    categoria: 'Bebidas',
    subcategoria: 'Gaseosas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1625772291928-9d9300f73f61?w=500&q=80',
    tipo: 'bebida',
    requiere_cocina: false
  },
  {
    id_producto: 'prod_sprite_zero',
    nombre: 'Sprite Sin Azúcar (Lata)',
    descripcion: 'Lata de Sprite Sin Azúcar de 354ml.',
    precio_venta: 2200.00,
    categoria: 'Bebidas',
    subcategoria: 'Gaseosas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1625772291928-9d9300f73f61?w=500&q=80',
    tipo: 'bebida',
    requiere_cocina: false
  },
  {
    id_producto: 'prod_fanta',
    nombre: 'Fanta Naranja (Lata)',
    descripcion: 'Lata de Fanta Naranja de 354ml.',
    precio_venta: 2200.00,
    categoria: 'Bebidas',
    subcategoria: 'Gaseosas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1624515699009-471206137d3c?w=500&q=80',
    tipo: 'bebida',
    requiere_cocina: false
  },
  {
    id_producto: 'prod_agua',
    nombre: 'Agua de Manantial con/sin Gas 500ml',
    descripcion: 'Frescura mineral pura embotellada.',
    precio_venta: 1500.00,
    categoria: 'Bebidas',
    subcategoria: 'Agua',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1608885898957-a599fb1b467a?w=400&q=80',
    tipo: 'bebida',
    requiere_cocina: false
  },
  {
    id_producto: 'prod_cafe_espresso',
    nombre: 'Café Espresso Doble',
    descripcion: 'Café expreso concentrado de grano italiano.',
    precio_venta: 1800.00,
    categoria: 'Bebidas',
    subcategoria: 'Cafetería',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
    tipo: 'bebida',
    requiere_cocina: false
  }
];

export const INITIAL_RECETAS_ESCANDALLO: RecetaEscandallo[] = [
  // Provoleta
  { id_receta: 'esc_provo_base', id_producto: 'prod_ent_provoleta', id_insumo: 'ins_provolone', cantidad_a_descontar: 180.00, unidad_medida: 'g' },

  // Empanadas
  { id_receta: 'esc_empa_patron', id_producto: 'prod_ent_empanadas', id_insumo: 'ins_empanada_relleno', cantidad_a_descontar: 160.00, unidad_medida: 'g' },
  { id_receta: 'esc_empa_masa', id_producto: 'prod_ent_empanadas', id_insumo: 'ins_harina_trigo', cantidad_a_descontar: 60.00, unidad_medida: 'g' },

  // Fainá Simple
  { id_receta: 'esc_faina_s_garbanzo', id_producto: 'prod_ent_faina_simple', id_insumo: 'ins_faina_preparacion', cantidad_a_descontar: 100.00, unidad_medida: 'g' },
  
  // Fainá Verdeo
  { id_receta: 'esc_faina_v_garbanzo', id_producto: 'prod_ent_faina_verdeo', id_insumo: 'ins_faina_preparacion', cantidad_a_descontar: 100.00, unidad_medida: 'g' },
  { id_receta: 'esc_faina_v_cebolla', id_producto: 'prod_ent_faina_verdeo', id_insumo: 'ins_cebolla', cantidad_a_descontar: 20.00, unidad_medida: 'g' },

  // Pizza Muzzarella
  { id_receta: 'esc_muz_harina', id_producto: 'prod_pas_muzarela', id_insumo: 'ins_harina_trigo', cantidad_a_descontar: 250.00, unidad_medida: 'g' },
  { id_receta: 'esc_muz_levadura', id_producto: 'prod_pas_muzarela', id_insumo: 'ins_levadura', cantidad_a_descontar: 5.00, unidad_medida: 'g' },
  { id_receta: 'esc_muz_tomate', id_producto: 'prod_pas_muzarela', id_insumo: 'ins_pure_tomate', cantidad_a_descontar: 120.00, unidad_medida: 'g' },
  { id_receta: 'esc_muz_queso', id_producto: 'prod_pas_muzarela', id_insumo: 'ins_mozzarella', cantidad_a_descontar: 280.00, unidad_medida: 'g' },
  { id_receta: 'esc_muz_oliva', id_producto: 'prod_pas_muzarela', id_insumo: 'ins_aceite_oliva', cantidad_a_descontar: 10.00, unidad_medida: 'ml' },
  { id_receta: 'esc_muz_aceituna', id_producto: 'prod_pas_muzarela', id_insumo: 'ins_aceitunas', cantidad_a_descontar: 30.00, unidad_medida: 'g' },

  // Pizza Especial
  { id_receta: 'esc_esp_harina', id_producto: 'prod_pas_especial', id_insumo: 'ins_harina_trigo', cantidad_a_descontar: 250.00, unidad_medida: 'g' },
  { id_receta: 'esc_esp_tomate', id_producto: 'prod_pas_especial', id_insumo: 'ins_pure_tomate', cantidad_a_descontar: 120.00, unidad_medida: 'g' },
  { id_receta: 'esc_esp_queso', id_producto: 'prod_pas_especial', id_insumo: 'ins_mozzarella', cantidad_a_descontar: 250.00, unidad_medida: 'g' },
  { id_receta: 'esc_esp_jamon', id_producto: 'prod_pas_especial', id_insumo: 'ins_jamon_cocido', cantidad_a_descontar: 120.00, unidad_medida: 'g' },
  { id_receta: 'esc_esp_morron', id_producto: 'prod_pas_especial', id_insumo: 'ins_morrones', cantidad_a_descontar: 60.00, unidad_medida: 'g' },

  // Pizza Calabresa
  { id_receta: 'esc_cal_harina', id_producto: 'prod_pas_calabresa', id_insumo: 'ins_harina_trigo', cantidad_a_descontar: 250.00, unidad_medida: 'g' },
  { id_receta: 'esc_cal_tomate', id_producto: 'prod_pas_calabresa', id_insumo: 'ins_pure_tomate', cantidad_a_descontar: 120.00, unidad_medida: 'g' },
  { id_receta: 'esc_cal_queso', id_producto: 'prod_pas_calabresa', id_insumo: 'ins_mozzarella', cantidad_a_descontar: 250.00, unidad_medida: 'g' },
  { id_receta: 'esc_cal_cantimpalo', id_producto: 'prod_pas_calabresa', id_insumo: 'ins_cantimpalo', cantidad_a_descontar: 80.00, unidad_medida: 'g' },

  // Pizza Fugazzeta
  { id_receta: 'esc_fug_harina', id_producto: 'prod_pas_fugazzeta', id_insumo: 'ins_harina_trigo', cantidad_a_descontar: 250.00, unidad_medida: 'g' },
  { id_receta: 'esc_fug_queso', id_producto: 'prod_pas_fugazzeta', id_insumo: 'ins_mozzarella', cantidad_a_descontar: 280.00, unidad_medida: 'g' },
  { id_receta: 'esc_fug_cebolla', id_producto: 'prod_pas_fugazzeta', id_insumo: 'ins_cebolla', cantidad_a_descontar: 180.00, unidad_medida: 'g' },

  // Pizza Margherita Premium
  { id_receta: 'esc_mar_harina', id_producto: 'prod_car_margherita_premium', id_insumo: 'ins_harina_trigo', cantidad_a_descontar: 250.00, unidad_medida: 'g' },
  { id_receta: 'esc_mar_tomate', id_producto: 'prod_car_margherita_premium', id_insumo: 'ins_pure_tomate', cantidad_a_descontar: 140.00, unidad_medida: 'g' },
  { id_receta: 'esc_mar_fior', id_producto: 'prod_car_margherita_premium', id_insumo: 'ins_fior_di_latte', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_mar_albahaca', id_producto: 'prod_car_margherita_premium', id_insumo: 'ins_albahaca', cantidad_a_descontar: 15.00, unidad_medida: 'g' },

  // Pizza Cuatro Quesos
  { id_receta: 'esc_cuat_harina', id_producto: 'prod_car_cuatro_quesos', id_insumo: 'ins_harina_trigo', cantidad_a_descontar: 250.00, unidad_medida: 'g' },
  { id_receta: 'esc_cuat_muz', id_producto: 'prod_car_cuatro_quesos', id_insumo: 'ins_mozzarella', cantidad_a_descontar: 150.00, unidad_medida: 'g' },
  { id_receta: 'esc_cuat_prov', id_producto: 'prod_car_cuatro_quesos', id_insumo: 'ins_provolone', cantidad_a_descontar: 50.00, unidad_medida: 'g' },
  { id_receta: 'esc_cuat_azul', id_producto: 'prod_car_cuatro_quesos', id_insumo: 'ins_queso_azul', cantidad_a_descontar: 50.00, unidad_medida: 'g' },
  { id_receta: 'esc_cuat_parm', id_producto: 'prod_car_cuatro_quesos', id_insumo: 'ins_parmesano', cantidad_a_descontar: 30.00, unidad_medida: 'g' },

  // Pizza Rúcula y Crudo
  { id_receta: 'esc_ruc_harina', id_producto: 'prod_car_rucula_crudo', id_insumo: 'ins_harina_trigo', cantidad_a_descontar: 250.00, unidad_medida: 'g' },
  { id_receta: 'esc_ruc_tomate', id_producto: 'prod_car_rucula_crudo', id_insumo: 'ins_pure_tomate', cantidad_a_descontar: 100.00, unidad_medida: 'g' },
  { id_receta: 'esc_ruc_muz', id_producto: 'prod_car_rucula_crudo', id_insumo: 'ins_mozzarella', cantidad_a_descontar: 200.00, unidad_medida: 'g' },
  { id_receta: 'esc_ruc_crudo', id_producto: 'prod_car_rucula_crudo', id_insumo: 'ins_jamon_crudo', cantidad_a_descontar: 100.00, unidad_medida: 'g' },

  // Pizza Panceta y Verdeo
  { id_receta: 'esc_pan_harina', id_producto: 'prod_car_panceta_verdeo', id_insumo: 'ins_harina_trigo', cantidad_a_descontar: 250.00, unidad_medida: 'g' },
  { id_receta: 'esc_pan_muz', id_producto: 'prod_car_panceta_verdeo', id_insumo: 'ins_mozzarella', cantidad_a_descontar: 220.00, unidad_medida: 'g' },
  { id_receta: 'esc_pan_panceta', id_producto: 'prod_car_panceta_verdeo', id_insumo: 'ins_panceta', cantidad_a_descontar: 90.00, unidad_medida: 'g' },
  { id_receta: 'esc_pan_cebolla', id_producto: 'prod_car_panceta_verdeo', id_insumo: 'ins_cebolla', cantidad_a_descontar: 30.00, unidad_medida: 'g' },

  // Postres
  { id_receta: 'esc_pos_flan_dl', id_producto: 'prod_pos_flan', id_insumo: 'ins_dulce_leche', cantidad_a_descontar: 40.00, unidad_medida: 'g' },
  { id_receta: 'esc_pos_vol_choc', id_producto: 'prod_pos_volcan', id_insumo: 'ins_chocolate_belga', cantidad_a_descontar: 60.00, unidad_medida: 'g' },
  { id_receta: 'esc_pos_vol_ice', id_producto: 'prod_pos_volcan', id_insumo: 'ins_helado_crema', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_pos_tir_choc', id_producto: 'prod_pos_tiramisu', id_insumo: 'ins_chocolate_belga', cantidad_a_descontar: 15.00, unidad_medida: 'g' },

  // Bebidas directas
  // La Rural
  { id_receta: 'esc_trumpeter_malbec', id_producto: 'prod_vin_trumpeter_malbec', id_insumo: 'ins_vin_trumpeter_malbec', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_trumpeter_red_blend', id_producto: 'prod_vin_trumpeter_red_blend', id_insumo: 'ins_vin_trumpeter_red_blend', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_trumpeter_chardonnay', id_producto: 'prod_vin_trumpeter_chardonnay', id_insumo: 'ins_vin_trumpeter_chardonnay', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_rutini_malbec', id_producto: 'prod_vin_rutini_malbec', id_insumo: 'ins_vin_rutini_malbec', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },

  // Spirits
  { id_receta: 'esc_fernet_branca', id_producto: 'prod_spir_fernet_branca', id_insumo: 'ins_spir_fernet_branca', cantidad_a_descontar: 0.08, unidad_medida: 'unidades' },
  { id_receta: 'esc_aperol_spritz', id_producto: 'prod_spir_aperol_spritz', id_insumo: 'ins_spir_aperol_spritz', cantidad_a_descontar: 0.10, unidad_medida: 'unidades' },

  // Soft drinks & basics
  { id_receta: 'esc_gaseosa_lata', id_producto: 'prod_gaseosa', id_insumo: 'ins_beb_gaseosa', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_coca_original', id_producto: 'prod_coca_cola_original', id_insumo: 'ins_beb_coca_cola_original', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_coca_zero', id_producto: 'prod_coca_cola_zero', id_insumo: 'ins_beb_coca_cola_zero', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_sprite', id_producto: 'prod_sprite', id_insumo: 'ins_beb_sprite', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_sprite_zero', id_producto: 'prod_sprite_zero', id_insumo: 'ins_beb_sprite_zero', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_fanta', id_producto: 'prod_fanta', id_insumo: 'ins_beb_fanta', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_agua_botella', id_producto: 'prod_agua', id_insumo: 'ins_beb_agua', cantidad_a_descontar: 1.00, unidad_medida: 'unidades' },
  { id_receta: 'esc_cafe_espresso_rec', id_producto: 'prod_cafe_espresso', id_insumo: 'ins_cafe_grano', cantidad_a_descontar: 18.00, unidad_medida: 'g' }
];

export const INITIAL_PEDIDOS: Pedido[] = [
  {
    id_pedido: 1021,
    id_mesa: 2,
    numero_mesa: 'Mesa 2',
    mozo: 'Enzo',
    estado_comanda: 'listo',
    items: [
      { id_producto: 'prod_ent_empanadas', nombre: 'Empanadas de Carne a la Leña', cantidad: 1, categoria: 'Empanadas' },
      { id_producto: 'prod_pas_muzarela', nombre: 'Pizza Muzzarella Tradicional', cantidad: 1, categoria: 'Pizzas Tradicionales' },
      { id_producto: 'prod_agua', nombre: 'Agua de Manantial con/sin Gas 500ml', cantidad: 2, categoria: 'Bebidas' }
    ],
    observaciones: 'El agua sin gas, por favor.',
    fecha_hora: new Date(Date.now() - 30 * 60 * 1000), // Hace 30 min
    minutos_transcurridos: 30,
    segundos_en_listo: 360,
    origen: 'Mozo',
    tiempo_despacho_minutos: 15
  },
  {
    id_pedido: 1022,
    id_mesa: 12,
    numero_mesa: 'Mesa 12',
    mozo: 'Enzo',
    estado_comanda: 'en_cocina',
    items: [
      { id_producto: 'prod_pas_fugazzeta', nombre: 'Pizza Fugazzeta con Queso', cantidad: 1, categoria: 'Pizzas Tradicionales' },
      { id_producto: 'prod_ent_faina_simple', nombre: 'Fainá Simple Dorada', cantidad: 2, categoria: 'Fainá' }
    ],
    observaciones: 'Fugazzeta con cebolla bien dorada.',
    fecha_hora: new Date(Date.now() - 12 * 60 * 1000),
    minutos_transcurridos: 12,
    origen: 'Mozo'
  },
  {
    id_pedido: 1023,
    id_mesa: 4,
    numero_mesa: 'Mesa 4',
    mozo: 'Micaela',
    estado_comanda: 'pendiente',
    items: [
      { id_producto: 'prod_car_margherita_premium', nombre: 'Pizza Margherita Premium', cantidad: 1, categoria: 'Pizzas Gourmet' },
      { id_producto: 'prod_vin_rutini_malbec', nombre: 'Rutini Malbec', cantidad: 1, categoria: 'Bodega' }
    ],
    observaciones: 'Margherita con abundante albahaca.',
    fecha_hora: new Date(Date.now() - 2 * 60 * 1000),
    minutos_transcurridos: 2,
    origen: 'Mozo'
  }
];
