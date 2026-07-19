import { Usuario, Mesa, Insumo, ProductoMenu, RecetaEscandallo, Pedido } from '../types';

export const INITIAL_USUARIOS: Usuario[] = [
  { id_usuario: 1, nombre: 'Super Admin', apellido: '', username: 'superadmin', password: '', rol: 'superadmin' },
  { id_usuario: 2, nombre: 'Administrador', apellido: '', username: 'administrador', password: '', rol: 'administrador' },
  { id_usuario: 3, nombre: 'Mozo', apellido: '', username: 'mozo', password: '', rol: 'mozo' },
  { id_usuario: 4, nombre: 'Enzo', apellido: 'Fernández', username: 'enzo', password: '', rol: 'mozo' },
  { id_usuario: 5, nombre: 'Micaela', apellido: 'Gómez', username: 'micaela', password: '', rol: 'mozo' },
  { id_usuario: 6, nombre: 'Damián', apellido: 'Martínez', username: 'damian', password: '', rol: 'cocina' },
  { id_usuario: 7, nombre: 'Sofía', apellido: 'Alegre', username: 'sofia', password: '', rol: 'administrador' },
  { id_usuario: 8, nombre: 'Nuevo', apellido: 'Usuario', username: 'nuevo', password: '', rol: 'mozo' },
  { id_usuario: 9, nombre: 'Admin', apellido: '', username: 'admin', password: '', rol: 'superadmin' },
];

export const INITIAL_MESAS: Mesa[] = [
  { id_mesa: 1, numero_mesa: 'Mesa 1', estado: 'libre', capacidad: 4, zona: 'comedor', sector: 'comedor', forma: 'rectangular', x: 61, y: 16, width: 12, height: 6 },
  { id_mesa: 2, numero_mesa: 'Mesa 2', estado: 'ocupada', comensales: 2, capacidad: 5, zona: 'comedor', sector: 'comedor', forma: 'rectangular', x: 22, y: 16, width: 12, height: 6 },
  { id_mesa: 3, numero_mesa: 'Mesa 3', estado: 'libre', capacidad: 5, zona: 'comedor', sector: 'comedor', forma: 'rectangular', x: 22, y: 27, width: 12, height: 6 },
  { id_mesa: 4, numero_mesa: 'Mesa 4', estado: 'ocupada', comensales: 3, capacidad: 4, zona: 'comedor', sector: 'comedor', forma: 'rectangular', x: 61, y: 27, width: 12, height: 6 },
  { id_mesa: 5, numero_mesa: 'Mesa 5', estado: 'libre', capacidad: 4, zona: 'salon', sector: 'salon', forma: 'redonda', x: 41, y: 58, width: 8, height: 8 },
  { id_mesa: 6, numero_mesa: 'Mesa 6', estado: 'libre', capacidad: 4, zona: 'salon', sector: 'salon', forma: 'redonda', x: 22, y: 70, width: 8, height: 8 },
  { id_mesa: 8, numero_mesa: 'Mesa 8', estado: 'ocupada', comensales: 1, capacidad: 4, zona: 'salon', sector: 'salon', forma: 'redonda', x: 22, y: 84, width: 8, height: 8 },
  { id_mesa: 12, numero_mesa: 'Mesa 12', estado: 'ocupada', comensales: 4, capacidad: 4, zona: 'salon', sector: 'salon', forma: 'redonda', x: 61, y: 70, width: 8, height: 8 },
  { id_mesa: 101, numero_mesa: 'VIP-1', estado: 'libre', capacidad: 4, zona: 'salon', sector: 'vip', forma: 'redonda', x: 41, y: 84, width: 8, height: 8 },
  { id_mesa: 102, numero_mesa: 'Terraza-3', estado: 'libre', capacidad: 2, zona: 'salon', sector: 'terraza', forma: 'redonda', x: 61, y: 84, width: 8, height: 8 },
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
  { id_insumo: "ins_vin_rutini_malbec", nombre: "GIUS Blonde runner (Blonde Ale) Botella", stock_actual: 20.0, stock_minimo: 4.0, unidad_medida: "unidades", categoria: "bodega", subcategoria: "Vinos tintos", proveedor: "La Rural Winery", costo_unitario: 6800.0, es_bebida_directa: true },
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
  {
    id_insumo: 'ins_beb_gius_blonde_runner_blonde_ale',
    nombre: 'GIUS Blonde runner (Blonde Ale) ',
    stock_actual: 120.0,
    stock_minimo: 30.0,
    unidad_medida: 'unidades',
    categoria: 'bodega',
    subcategoria: 'Cervezas',
    proveedor: 'Distribuidora Río Cuarto',
    costo_unitario: 1530.0,
    es_bebida_directa: true
  },
  {
    id_insumo: 'ins_beb_gius_indomable_dry_stout',
    nombre: 'GIUS Indomable (Dry Stout)',
    stock_actual: 120.0,
    stock_minimo: 30.0,
    unidad_medida: 'unidades',
    categoria: 'bodega',
    subcategoria: 'Cervezas',
    proveedor: 'Distribuidora Río Cuarto',
    costo_unitario: 1665.0,
    es_bebida_directa: true
  },
  {
    id_insumo: 'ins_beb_gius_ojo_loco_irish_red_ale',
    nombre: 'GIUS Ojo Loco (Irish Red Ale)',
    stock_actual: 120.0,
    stock_minimo: 30.0,
    unidad_medida: 'unidades',
    categoria: 'bodega',
    subcategoria: 'Cervezas',
    proveedor: 'Distribuidora Río Cuarto',
    costo_unitario: 1575.0,
    es_bebida_directa: true
  },
  {
    id_insumo: 'ins_beb_gius_anda_pa_alla_honey_ale',
    nombre: 'GIUS Anda pa alla (Honey Ale)',
    stock_actual: 120.0,
    stock_minimo: 30.0,
    unidad_medida: 'unidades',
    categoria: 'bodega',
    subcategoria: 'Cervezas',
    proveedor: 'Distribuidora Río Cuarto',
    costo_unitario: 1552.5,
    es_bebida_directa: true
  },
  {
    id_insumo: 'ins_beb_coca_cola_500cc',
    nombre: 'Coca Cola 500cc',
    stock_actual: 120.0,
    stock_minimo: 30.0,
    unidad_medida: 'unidades',
    categoria: 'bodega',
    subcategoria: 'Gaseosas',
    proveedor: 'Distribuidora Río Cuarto',
    costo_unitario: 1125.0,
    es_bebida_directa: true
  },
  {
    id_insumo: 'ins_beb_bonaqua_500cc',
    nombre: 'Bonaqua 500cc',
    stock_actual: 120.0,
    stock_minimo: 30.0,
    unidad_medida: 'unidades',
    categoria: 'bodega',
    subcategoria: 'Gaseosas',
    proveedor: 'Distribuidora Río Cuarto',
    costo_unitario: 1125.0,
    es_bebida_directa: true
  },
  {
    id_insumo: 'ins_beb_gius_gente_despierta_light_lager',
    nombre: 'GIUS Gente despierta (Light Lager)',
    stock_actual: 120.0,
    stock_minimo: 30.0,
    unidad_medida: 'unidades',
    categoria: 'bodega',
    subcategoria: 'Cervezas',
    proveedor: 'Distribuidora Río Cuarto',
    costo_unitario: 1530.0,
    es_bebida_directa: true
  },
  {
    id_insumo: 'ins_beb_sprite_500cc',
    nombre: 'Sprite 500cc',
    stock_actual: 120.0,
    stock_minimo: 30.0,
    unidad_medida: 'unidades',
    categoria: 'bodega',
    subcategoria: 'Gaseosas',
    proveedor: 'Distribuidora Río Cuarto',
    costo_unitario: 1125.0,
    es_bebida_directa: true
  },
  {
    id_insumo: 'ins_beb_coca_cola_zero_500cc',
    nombre: 'Coca Cola Zero 500cc',
    stock_actual: 120.0,
    stock_minimo: 30.0,
    unidad_medida: 'unidades',
    categoria: 'bodega',
    subcategoria: 'Gaseosas',
    proveedor: 'Distribuidora Río Cuarto',
    costo_unitario: 1125.0,
    es_bebida_directa: true
  },
  {
    id_insumo: 'ins_beb_fanta_500cc',
    nombre: 'Fanta 500cc',
    stock_actual: 120.0,
    stock_minimo: 30.0,
    unidad_medida: 'unidades',
    categoria: 'bodega',
    subcategoria: 'Gaseosas',
    proveedor: 'Distribuidora Río Cuarto',
    costo_unitario: 1125.0,
    es_bebida_directa: true
  }];

export const INITIAL_PRODUCTOS_MENU: ProductoMenu[] = [
  {
    id_producto: 'prod_calz_empa_saltena',
    nombre: 'Empa Salteña',
    descripcion: 'Carne a cuchillo, cebolla, verdeo, aceituna, papa, huevo',
    precio_venta: 2300.0,
    categoria: 'Calzones y empanadas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_calz_empa_criolla',
    nombre: 'Empa Criolla',
    descripcion: 'Carne picada, cebolla, huevo.',
    precio_venta: 2000.0,
    categoria: 'Calzones y empanadas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_calz_media_docena_de_saltenas',
    nombre: 'Media Docena De Salteñas',
    descripcion: 'Salteñas',
    precio_venta: 12000.0,
    categoria: 'Calzones y empanadas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_calz_calzonne_napolitano',
    nombre: 'Calzonne Napolitano',
    descripcion: 'Salsa Napo + muzarella + jamón cocido + provenzal + reggianito + cherrys',
    precio_venta: 20000.0,
    categoria: 'Calzones y empanadas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_calz_calzonne_de_la_reina',
    nombre: 'Calzonne de la reina',
    descripcion: 'Salsa de hongos, jamon cocido, muzarella, cebolla caramelizada.',
    precio_venta: 22000.0,
    categoria: 'Calzones y empanadas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_calz_media_docena_de_criollas',
    nombre: 'Media Docena De Criollas',
    descripcion: 'Criollas',
    precio_venta: 10000.0,
    categoria: 'Calzones y empanadas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizz_arma_tu_pizza_individual',
    nombre: 'Arma Tu Pizza Individual',
    descripcion: 'Elegi 4 Toppings',
    precio_venta: 11000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizz_arma_tu_pizza_grande',
    nombre: 'Arma Tu Pizza Grande',
    descripcion: 'Elegi 4 Toppings ',
    precio_venta: 22000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_bebi_gius_blonde_runner_blonde_ale',
    nombre: 'GIUS Blonde runner (Blonde Ale) ',
    descripcion: 'Cuerpo ligero-medio, amargor bajo.',
    precio_venta: 3400.0,
    categoria: 'Bebidas con Alcohol',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/8oyRnVpvVAiojRs3CTmFKP_HzANo6j2k_wsoCkl5qYRE3k0_iuwGGzmMZ0IRp35wVzTvmbBmbFpLOrk2qcijfXp-n2XsGMB8o6oxcw',
    tipo: 'bebida',
    tiempo_preparacion_estimado: 3,
    requiere_cocina: false
  },
  {
    id_producto: 'prod_bebi_gius_indomable_dry_stout',
    nombre: 'GIUS Indomable (Dry Stout)',
    descripcion: 'Cerveza negra irlandesa',
    precio_venta: 3700.0,
    categoria: 'Bebidas con Alcohol',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/tA_R5pFH1tmHkHK3JC71oZ8XhZR-4A77ugWOYmw6NCt8kNxOtGjB8iqLp4Zq5Pjkg7Vd_bg73ftBn5inqwLOzkwJEQSHEPd3ym7_',
    tipo: 'bebida',
    tiempo_preparacion_estimado: 3,
    requiere_cocina: false
  },
  {
    id_producto: 'prod_bebi_gius_ojo_loco_irish_red_ale',
    nombre: 'GIUS Ojo Loco (Irish Red Ale)',
    descripcion: 'Cerveza roja Irlandesa',
    precio_venta: 3500.0,
    categoria: 'Bebidas con Alcohol',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/g88zpwMW8qf9cX8k7S73sfJ74jkvkPNdHiLnQUHahLxv-XLQI1MFLjO2zJD-a_0IQEvXguP-NtVTGKCN9Zpt47dRyEKsFQUkjoToYK8',
    tipo: 'bebida',
    tiempo_preparacion_estimado: 3,
    requiere_cocina: false
  },
  {
    id_producto: 'prod_bebi_gius_anda_pa_alla_honey_ale',
    nombre: 'GIUS Anda pa alla (Honey Ale)',
    descripcion: 'Caracterizada por la adicion de miel.',
    precio_venta: 3450.0,
    categoria: 'Bebidas con Alcohol',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/iTR9ydpk3TxcNkP5-7jifTb5z1VOULhsvh2r4X_LA9Xu9zvt20zCJUcUJqZ6pbJ4AWhj3jHPOMBCet_C_Jkbgn5xXUDEnh-qF9WGFw',
    tipo: 'bebida',
    tiempo_preparacion_estimado: 3,
    requiere_cocina: false
  },
  {
    id_producto: 'prod_bebi_coca_cola_500cc',
    nombre: 'Coca Cola 500cc',
    descripcion: '',
    precio_venta: 2500.0,
    categoria: 'Bebidas sin Alcohol',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/Mo5OtvBFHCFIuM8cSfozJATpN7Q0jmtCTt_L-QsmOHustLSGJNOjCLEwQa1Fd2qiC1DfUEHukkEci4q9HOPTLQhneJucSP8bIMcOCw',
    tipo: 'bebida',
    tiempo_preparacion_estimado: 3,
    requiere_cocina: false
  },
  {
    id_producto: 'prod_bebi_bonaqua_500cc',
    nombre: 'Bonaqua 500cc',
    descripcion: '',
    precio_venta: 2500.0,
    categoria: 'Bebidas sin Alcohol',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/XZRwwEkSjXp7fZ-F7wtgxPT3GGhPtxc9xlmCCBb0EX6pFonU_2lzA-O8tP2FgzT0hPL9NMXUaOA7Djy5wPPwbWCJ0dTYJ1cx7xx8Gg',
    tipo: 'bebida',
    tiempo_preparacion_estimado: 3,
    requiere_cocina: false
  },
  {
    id_producto: 'prod_bebi_gius_gente_despierta_light_lager',
    nombre: 'GIUS Gente despierta (Light Lager)',
    descripcion: 'Rubia, ligera y referescante.',
    precio_venta: 3400.0,
    categoria: 'Bebidas con Alcohol',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/XAQi604TF_JLNPwnD082_OaePFvKBsoVajtRJ4k-GqbiIws6ww90dRvUnVvykTP27V8iw26bUhrijsKeS0WY45W_SeunAZq6zP4bSQ',
    tipo: 'bebida',
    tiempo_preparacion_estimado: 3,
    requiere_cocina: false
  },
  {
    id_producto: 'prod_bebi_sprite_500cc',
    nombre: 'Sprite 500cc',
    descripcion: '',
    precio_venta: 2500.0,
    categoria: 'Bebidas sin Alcohol',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/ppKTHcrAb9w6Z_ma01mkc3fUPgt5NOrNnULBQFs-BFRpb8kkfqLD3y-jMlLGqt9xEtN0dAEMPeGf8AOFjBFY056M0W0FVCvPfZkh',
    tipo: 'bebida',
    tiempo_preparacion_estimado: 3,
    requiere_cocina: false
  },
  {
    id_producto: 'prod_bebi_coca_cola_zero_500cc',
    nombre: 'Coca Cola Zero 500cc',
    descripcion: '',
    precio_venta: 2500.0,
    categoria: 'Bebidas sin Alcohol',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/ZyO5iYSdFntSmqI17FvSsuDn8YbTCN6LtQFv0Bv5o8t65VdNbjVo1z-7lemtig6BKl1tW0LbrmbM7cvb80ow4GV93tHd2Ql7sOq7HA',
    tipo: 'bebida',
    tiempo_preparacion_estimado: 3,
    requiere_cocina: false
  },
  {
    id_producto: 'prod_bebi_fanta_500cc',
    nombre: 'Fanta 500cc',
    descripcion: '',
    precio_venta: 2500.0,
    categoria: 'Bebidas sin Alcohol',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/jcw8Z_52tb6mj_uGL_8Qk2us3PUmQGJw-uJDy4NYkMP6WHGhN7cGqMiZRvMvJnv2KU3gfsf0uhsBsMU4N2lNH0jQg8qxow9mB1ak',
    tipo: 'bebida',
    tiempo_preparacion_estimado: 3,
    requiere_cocina: false
  },
  {
    id_producto: 'prod_post_tiramisu',
    nombre: 'Tiramisú',
    descripcion: 'Clasico postre italiano a base de mascarpone, cafe y vainillas',
    precio_venta: 9000.0,
    categoria: 'Postres',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/uIjG724abXQHUMlirhnmd3MRs2naji9r72sd0jvC5JaG_S_fcsJ7YzArvDy55gFyBZSgdJIzj4X2UZPE6X8ZPDiiOcPJxh1MU8ojxw',
    tipo: 'postre',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_post_bombas_de_crema_chantilly',
    nombre: 'Bombas de Crema Chantilly',
    descripcion: '8 Unidades',
    precio_venta: 6000.0,
    categoria: 'Postres',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80',
    tipo: 'postre',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_post_tarta_de_ricotta',
    nombre: 'Tarta de Ricotta',
    descripcion: '',
    precio_venta: 6000.0,
    categoria: 'Postres',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/xlHujpdjb-GI0G0D9Xh2WUzh4xl_iOU8d9opQnO3YYfXb3ZeVM6mUIouPDhvwU8_dGOU4ZELw0oncplOQG6oYg6SuEDHT6L3-akxew',
    tipo: 'postre',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_sand_baguette_lomo',
    nombre: 'Baguette Lomo',
    descripcion: 'Carne de ternera en tiras, jamon cocido, muzarella, mayo casera con papas.',
    precio_venta: 10000.0,
    categoria: 'Sandwiches',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/cLCFuyE14D_c4jhLvgn--aCDvXGzWOkS-b_930suXSVQCCCXTZa4rdsbF7Rm7UQfv-ogoKCQw5SyHM7TORGdS2D6WUJeegoq0M6k_A',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizz_especial_grande_2_pintas_gius_ipa',
    nombre: 'Especial Grande + 2 Pintas GIUS IPA',
    descripcion: '',
    precio_venta: 29000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/Elsa8nk3wjF5UAAREcvJ2JzfqzYAY1-LcIetYKz07RunpKIS-xhzjLdZYuVG5ge3sZPwff8q8xBu0jhc2VxpAv-v327cjmrxdTn2DA',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizz_pizza_comun',
    nombre: 'Pizza Común',
    descripcion: 'Salsa de tomate natural sobre una masa aireada fermentada hasta por 96 horas',
    precio_venta: 19000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/Gfb13YeP1igGDideYATi26z_Kjb380yldPtb2SzfhQZcfDy4omzF3I72mU_O2MK0JgUQ67mU68JdYtCFt8M7cJeHIK06RPV4h3_lQQ',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizz_3x2_de_la_casa',
    nombre: '3x2 De La Casa',
    descripcion: 'Pepperoni individual, Especial Individual, 5 Quesos  Individual.',
    precio_venta: 25000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_5_quesos_grande',
    nombre: 'Pizza 5 Quesos Grande',
    descripcion: 'Azul, provolone, morbier, fynbo, reggianito',
    precio_venta: 23000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/uKvNeoO6OjsLpV8AUYnjoj_uHDjnm39q3fA7BuvqpG8H60EYwA-gezgPKAkMdq7yxMYeZEGgfZGiZTQ5WL3iJkNydy2-lkErV0OdUg',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_5_quesos_individual',
    nombre: 'Pizza 5 Quesos Individual',
    descripcion: 'Azul, provolone, morbier, fynbo, reggianito',
    precio_venta: 11500.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/uKvNeoO6OjsLpV8AUYnjoj_uHDjnm39q3fA7BuvqpG8H60EYwA-gezgPKAkMdq7yxMYeZEGgfZGiZTQ5WL3iJkNydy2-lkErV0OdUg',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_pepperoni_individual',
    nombre: 'Pizza Pepperoni Individual',
    descripcion: 'Salame Español',
    precio_venta: 11000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/3ry2JTqTgIoP_t583K64-qXnJH0fCOhgAUu217Cgf4olw-9AUlEmDDbKWqL5WCGhczK_m8a_buMmNmJngwSLS527J1Ywm0oEl7nB',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_pepperoni_grande',
    nombre: 'Pizza Pepperoni Grande',
    descripcion: 'Salame Español',
    precio_venta: 22000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/3ry2JTqTgIoP_t583K64-qXnJH0fCOhgAUu217Cgf4olw-9AUlEmDDbKWqL5WCGhczK_m8a_buMmNmJngwSLS527J1Ywm0oEl7nB',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_tai_pizza_grande',
    nombre: 'Pizza Tai Pizza Grande',
    descripcion: 'Langostinos, curry, cebolla de verdeo',
    precio_venta: 25000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/molPTKzBMySDaSlYgHwJQTuDqIhQ8EZRNr4CuHy3W6Nk59znSpHpVXrIvAe0ClMAbR_8JGkt2fdi4MFpRjKqtX06LNcSjTwGN8RGUA',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_tai_pizza_individual',
    nombre: 'Pizza Tai Pizza Individual',
    descripcion: 'Langostinos, curry, cebolla de verdeo',
    precio_venta: 12500.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/molPTKzBMySDaSlYgHwJQTuDqIhQ8EZRNr4CuHy3W6Nk59znSpHpVXrIvAe0ClMAbR_8JGkt2fdi4MFpRjKqtX06LNcSjTwGN8RGUA',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_colores_especial_individual',
    nombre: 'Pizza Colores Especial Individual',
    descripcion: 'Jamón horneado artesanal y pesto de morron',
    precio_venta: 11000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/Elsa8nk3wjF5UAAREcvJ2JzfqzYAY1-LcIetYKz07RunpKIS-xhzjLdZYuVG5ge3sZPwff8q8xBu0jhc2VxpAv-v327cjmrxdTn2DA',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_colores_especial_grande',
    nombre: 'Pizza Colores Especial Grande',
    descripcion: 'Jamón horneado artesanal y pesto de morron',
    precio_venta: 22000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/Elsa8nk3wjF5UAAREcvJ2JzfqzYAY1-LcIetYKz07RunpKIS-xhzjLdZYuVG5ge3sZPwff8q8xBu0jhc2VxpAv-v327cjmrxdTn2DA',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_hongos_y_cerdo_individual',
    nombre: 'Pizza Hongos y Cerdo Individual',
    descripcion: 'Girgolas, Jamon horneado artesanal.',
    precio_venta: 11500.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_hongos_y_cerdo_grande',
    nombre: 'Pizza Hongos y Cerdo Grande',
    descripcion: 'Girgolas, Jamon horneado artesanal.',
    precio_venta: 24000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_fresca_grande',
    nombre: 'Pizza Fresca Grande',
    descripcion: 'Rúcula, tomates secos, olivas, provolone, ralladura de limón',
    precio_venta: 22000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/FUeMzvSzgRQ61FsliWtqep3gPNFHv9otJwz3F8qqhOi7_Y74btbZlj4HvAlih8wdijTGjlsLHE3dKCunm8MhZIRkpVcknLW9vSEV5g',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_fresca_individual',
    nombre: 'Pizza Fresca Individual',
    descripcion: 'Rúcula, tomates secos, olivas, provolone, ralladura de limón',
    precio_venta: 11000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/FUeMzvSzgRQ61FsliWtqep3gPNFHv9otJwz3F8qqhOi7_Y74btbZlj4HvAlih8wdijTGjlsLHE3dKCunm8MhZIRkpVcknLW9vSEV5g',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_comun_grande',
    nombre: 'Pizza Común Grande',
    descripcion: 'Salsa tomate, Muzzarella',
    precio_venta: 19000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/Gfb13YeP1igGDideYATi26z_Kjb380yldPtb2SzfhQZcfDy4omzF3I72mU_O2MK0JgUQ67mU68JdYtCFt8M7cJeHIK06RPV4h3_lQQ',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_comun_individual',
    nombre: 'Pizza Común Individual',
    descripcion: 'Salsa tomate, Muzzarella',
    precio_venta: 10000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/Gfb13YeP1igGDideYATi26z_Kjb380yldPtb2SzfhQZcfDy4omzF3I72mU_O2MK0JgUQ67mU68JdYtCFt8M7cJeHIK06RPV4h3_lQQ',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_funghi_individual',
    nombre: 'Pizza Funghi Individual',
    descripcion: 'Salsa de hongos, jamon cocido, portobellos, fugazza, reggianito',
    precio_venta: 11500.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/wAo_y-_X_ongyG_9D9yhNYawk0pWHwxhupiOXubcFAyRjJ7p4sAvR7pKIDWH8oiLIHwpKWFP9psgBEwMeJuXmWvu4czUnVMBxeOFlg',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_funghi_grande',
    nombre: 'Pizza Funghi Grande',
    descripcion: 'Salsa de hongos, jamon cocido, portobellos, fugazza, reggianito',
    precio_venta: 24000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/wAo_y-_X_ongyG_9D9yhNYawk0pWHwxhupiOXubcFAyRjJ7p4sAvR7pKIDWH8oiLIHwpKWFP9psgBEwMeJuXmWvu4czUnVMBxeOFlg',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_anchovy_individual',
    nombre: 'Pizza Anchovy Individual',
    descripcion: 'Anchoas, salsa cesar, reggianito.',
    precio_venta: 11500.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/pZxTefehninSEjMSyoAgRmeG8voIQG09E4LOwLMj58iCpL5ZNW5b7jAAEUTVva-mCTsg-F4TZXNn9UJHz584c4UI6Y6rFChHxQJ3oA',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_anchovy_grande',
    nombre: 'Pizza Anchovy Grande',
    descripcion: 'Anchoas, salsa cesar, reggianito.',
    precio_venta: 23000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://lh3.googleusercontent.com/pZxTefehninSEjMSyoAgRmeG8voIQG09E4LOwLMj58iCpL5ZNW5b7jAAEUTVva-mCTsg-F4TZXNn9UJHz584c4UI6Y6rFChHxQJ3oA',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_napolitana_individual',
    nombre: 'Pizza Napolitana Individual',
    descripcion: 'Rodajas de tomate, ajo rallado, provenzal',
    precio_venta: 11000.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_napolitana_grande',
    nombre: 'Pizza Napolitana Grande',
    descripcion: 'Rodajas de tomate, ajo rallado, provenzal',
    precio_venta: 21500.0,
    categoria: 'Pizzas',
    activo: true,
    imagen: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  }
];

export const INITIAL_RECETAS_ESCANDALLO: RecetaEscandallo[] = [
  {
    id_receta: 'esc_gius_blond',
    id_producto: 'prod_bebi_gius_blonde_runner_blonde_ale',
    id_insumo: 'ins_beb_gius_blonde_runner_blonde_ale',
    cantidad_a_descontar: 1.0,
    unidad_medida: 'unidades'
  },
  {
    id_receta: 'esc_gius_indom',
    id_producto: 'prod_bebi_gius_indomable_dry_stout',
    id_insumo: 'ins_beb_gius_indomable_dry_stout',
    cantidad_a_descontar: 1.0,
    unidad_medida: 'unidades'
  },
  {
    id_receta: 'esc_gius_ojo_l',
    id_producto: 'prod_bebi_gius_ojo_loco_irish_red_ale',
    id_insumo: 'ins_beb_gius_ojo_loco_irish_red_ale',
    cantidad_a_descontar: 1.0,
    unidad_medida: 'unidades'
  },
  {
    id_receta: 'esc_gius_anda',
    id_producto: 'prod_bebi_gius_anda_pa_alla_honey_ale',
    id_insumo: 'ins_beb_gius_anda_pa_alla_honey_ale',
    cantidad_a_descontar: 1.0,
    unidad_medida: 'unidades'
  },
  {
    id_receta: 'esc_coca_cola',
    id_producto: 'prod_bebi_coca_cola_500cc',
    id_insumo: 'ins_beb_coca_cola_500cc',
    cantidad_a_descontar: 1.0,
    unidad_medida: 'unidades'
  },
  {
    id_receta: 'esc_bonaqua_50',
    id_producto: 'prod_bebi_bonaqua_500cc',
    id_insumo: 'ins_beb_bonaqua_500cc',
    cantidad_a_descontar: 1.0,
    unidad_medida: 'unidades'
  },
  {
    id_receta: 'esc_gius_gente',
    id_producto: 'prod_bebi_gius_gente_despierta_light_lager',
    id_insumo: 'ins_beb_gius_gente_despierta_light_lager',
    cantidad_a_descontar: 1.0,
    unidad_medida: 'unidades'
  },
  {
    id_receta: 'esc_sprite_500',
    id_producto: 'prod_bebi_sprite_500cc',
    id_insumo: 'ins_beb_sprite_500cc',
    cantidad_a_descontar: 1.0,
    unidad_medida: 'unidades'
  },
  {
    id_receta: 'esc_coca_cola',
    id_producto: 'prod_bebi_coca_cola_zero_500cc',
    id_insumo: 'ins_beb_coca_cola_zero_500cc',
    cantidad_a_descontar: 1.0,
    unidad_medida: 'unidades'
  },
  {
    id_receta: 'esc_fanta_500c',
    id_producto: 'prod_bebi_fanta_500cc',
    id_insumo: 'ins_beb_fanta_500cc',
    cantidad_a_descontar: 1.0,
    unidad_medida: 'unidades'
  },
  {
    id_receta: 'esc_pizza_5_quesos_gran',
    id_producto: 'prod_pizza_5_quesos_grande',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 280.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_5_quesos_gran',
    id_producto: 'prod_pizza_5_quesos_grande',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 250.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_5_quesos_indi',
    id_producto: 'prod_pizza_5_quesos_individual',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 140.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_5_quesos_indi',
    id_producto: 'prod_pizza_5_quesos_individual',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 125.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_pepperon_indi',
    id_producto: 'prod_pizza_pepperoni_individual',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 140.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_pepperon_indi',
    id_producto: 'prod_pizza_pepperoni_individual',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 125.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_pepperon_gran',
    id_producto: 'prod_pizza_pepperoni_grande',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 280.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_pepperon_gran',
    id_producto: 'prod_pizza_pepperoni_grande',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 250.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_tai_pizz_gran',
    id_producto: 'prod_pizza_tai_pizza_grande',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 280.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_tai_pizz_gran',
    id_producto: 'prod_pizza_tai_pizza_grande',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 250.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_tai_pizz_indi',
    id_producto: 'prod_pizza_tai_pizza_individual',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 140.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_tai_pizz_indi',
    id_producto: 'prod_pizza_tai_pizza_individual',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 125.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_colores_indi',
    id_producto: 'prod_pizza_colores_especial_individual',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 140.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_colores_indi',
    id_producto: 'prod_pizza_colores_especial_individual',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 125.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_colores_gran',
    id_producto: 'prod_pizza_colores_especial_grande',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 280.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_colores_gran',
    id_producto: 'prod_pizza_colores_especial_grande',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 250.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_hongos_y_indi',
    id_producto: 'prod_pizza_hongos_y_cerdo_individual',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 140.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_hongos_y_indi',
    id_producto: 'prod_pizza_hongos_y_cerdo_individual',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 125.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_hongos_y_gran',
    id_producto: 'prod_pizza_hongos_y_cerdo_grande',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 280.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_hongos_y_gran',
    id_producto: 'prod_pizza_hongos_y_cerdo_grande',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 250.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_fresca_gran',
    id_producto: 'prod_pizza_fresca_grande',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 280.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_fresca_gran',
    id_producto: 'prod_pizza_fresca_grande',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 250.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_fresca_indi',
    id_producto: 'prod_pizza_fresca_individual',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 140.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_fresca_indi',
    id_producto: 'prod_pizza_fresca_individual',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 125.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_comun_gran',
    id_producto: 'prod_pizza_comun_grande',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 280.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_comun_gran',
    id_producto: 'prod_pizza_comun_grande',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 250.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_comun_indi',
    id_producto: 'prod_pizza_comun_individual',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 140.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_comun_indi',
    id_producto: 'prod_pizza_comun_individual',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 125.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_funghi_indi',
    id_producto: 'prod_pizza_funghi_individual',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 140.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_funghi_indi',
    id_producto: 'prod_pizza_funghi_individual',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 125.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_funghi_gran',
    id_producto: 'prod_pizza_funghi_grande',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 280.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_funghi_gran',
    id_producto: 'prod_pizza_funghi_grande',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 250.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_anchovy_indi',
    id_producto: 'prod_pizza_anchovy_individual',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 140.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_anchovy_indi',
    id_producto: 'prod_pizza_anchovy_individual',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 125.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_anchovy_gran',
    id_producto: 'prod_pizza_anchovy_grande',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 280.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_anchovy_gran',
    id_producto: 'prod_pizza_anchovy_grande',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 250.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_napolita_indi',
    id_producto: 'prod_pizza_napolitana_individual',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 140.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_napolita_indi',
    id_producto: 'prod_pizza_napolitana_individual',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 125.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_napolita_gran',
    id_producto: 'prod_pizza_napolitana_grande',
    id_insumo: 'ins_mozzarella',
    cantidad_a_descontar: 280.0,
    unidad_medida: 'g'
  },
  {
    id_receta: 'esc_pizza_m_napolita_gran',
    id_producto: 'prod_pizza_napolitana_grande',
    id_insumo: 'ins_harina_trigo',
    cantidad_a_descontar: 250.0,
    unidad_medida: 'g'
  }
];

export const INITIAL_PEDIDOS: Pedido[] = [
  {
    id_pedido: '1021',
    id_mesa: 2,
    numero_mesa: 'Mesa 2',
    mozo: 'Enzo',
    estado_comanda: 'listo',
    items: [
      { id_producto: 'prod_calz_empa_criolla', nombre: 'Empa Criolla', cantidad: 1, categoria: 'Empanadas' },
      { id_producto: 'prod_pizza_comun_grande', nombre: 'Pizza Común Grande', cantidad: 1, categoria: 'Pizzas Tradicionales' },
      { id_producto: 'prod_bebi_bonaqua_500cc', nombre: 'Bonaqua 500cc', cantidad: 2, categoria: 'Bebidas' }
    ],
    observaciones: 'El agua sin gas, por favor.',
    fecha_hora: new Date(Date.now() - 30 * 60 * 1000), // Hace 30 min
    minutos_transcurridos: 30,
    segundos_en_listo: 360,
    origen: 'Mozo',
    tiempo_despacho_minutos: 15
  },
  {
    id_pedido: '1022',
    id_mesa: 12,
    numero_mesa: 'Mesa 12',
    mozo: 'Enzo',
    estado_comanda: 'en_cocina',
    items: [
      { id_producto: 'prod_pizza_funghi_grande', nombre: 'Pizza Funghi Grande', cantidad: 1, categoria: 'Pizzas Tradicionales' },
      { id_producto: 'prod_calz_empa_saltena', nombre: 'Empa Salteña', cantidad: 2, categoria: 'Fainá' }
    ],
    observaciones: 'Fugazzeta con cebolla bien dorada.',
    fecha_hora: new Date(Date.now() - 12 * 60 * 1000),
    minutos_transcurridos: 12,
    origen: 'Mozo'
  },
  {
    id_pedido: '1023',
    id_mesa: 4,
    numero_mesa: 'Mesa 4',
    mozo: 'Micaela',
    estado_comanda: 'pendiente',
    items: [
      { id_producto: 'prod_pizza_fresca_grande', nombre: 'Pizza Fresca Grande', cantidad: 1, categoria: 'Pizzas Gourmet' },
      { id_producto: 'prod_bebi_gius_blonde_runner_blonde_ale', nombre: 'GIUS Blonde runner (Blonde Ale)', cantidad: 1, categoria: 'Bodega' }
    ],
    observaciones: 'Margherita con abundante albahaca.',
    fecha_hora: new Date(Date.now() - 2 * 60 * 1000),
    minutos_transcurridos: 2,
    origen: 'Mozo'
  }
];
