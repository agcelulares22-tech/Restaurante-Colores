import { createScriptSupabaseClient } from './supabase-config';

const { supabase } = createScriptSupabaseClient();

const csvData = `ID_INSUMO,Insumo,Categoría,Unidad base
I-001,Salsa tomate,Salsas,gr
I-002,Muzza / Mozzarella,Quesos,gr
I-003,Salame español,Fiambres,gr
I-004,Pesto de albahaca,Salsas,gr
I-005,Jamón cocido al natural,Fiambres,gr
I-006,Pesto de morrón ahumado,Salsas,gr
I-007,Queso azul,Quesos,gr
I-008,Provolone,Quesos,gr
I-009,Queso morbier,Quesos,gr
I-010,Queso fynbo,Quesos,gr
I-011,Reggianito,Quesos,gr
I-012,Anchoas,Pescados,gr
I-013,Salsa cesar,Salsas,gr
I-014,Langostinos,Mariscos,gr
I-015,Curry,Especias,gr
I-016,Verdeo,Verduras,gr
I-017,Rúcula,Verduras,gr
I-018,Tomates secos,Verduras,gr
I-019,Olivas/Aceitunas,Conservas,gr
I-020,Ralladura de limón,Aromáticos,gr
I-021,Langostinos rebozados,Mariscos,gr
I-022,Fugazza,Preparados,gr
I-023,Guacamole,Salsas,gr
I-024,Hongos,Verduras,gr
I-025,Jamón cocido,Fiambres,gr
I-026,Portobellos,Verduras,gr
I-027,Masa pizza,Masas,unid
I-028,Masa focaccia,Masas,unid
I-029,Masa baguette,Masas,unid
I-030,Masa calzone,Masas,unid
I-031,Disco empanada,Masas,unid
I-032,Jamón cocido (focaccia),Fiambres,gr
I-033,Lechuga,Verduras,gr
I-034,Tomate,Verduras,gr
I-035,Mayonesa,Salsas,gr
I-036,Milanesa de pollo,Carnes,unid
I-037,Cheddar,Quesos,gr
I-038,Cebolla caramelizada,Verduras,gr
I-039,Mayo artesanal,Salsas,gr
I-040,Mortadela,Fiambres,gr
I-041,Aceite oliva LAUR,Aceites,ml
I-042,Milanesa,Carnes,unid
I-043,Huevo frito,Huevos,unid
I-044,Queso fresco,Quesos,gr
I-045,Albahaca,Aromáticos,gr
I-046,Pimienta negra,Especias,gr
I-047,Jamón crudo,Fiambres,gr
I-048,Provenzal,Aromáticos,gr
I-049,Mayo de aceitunas,Salsas,gr
I-050,Puerro,Verduras,gr
I-051,Albóndigas,Carnes,gr
I-052,Lomito horneado,Carnes,gr
I-053,Lechuga fresca,Verduras,gr
I-054,Salsa de hongos,Salsas,gr
I-055,Lomo de cerdo,Carnes,gr
I-056,Salsa Napo,Salsas,gr
I-057,Tomates cherry,Verduras,gr
I-058,Carne a cuchillo,Carnes,gr
I-059,Cebolla,Verduras,gr
I-060,Aceituna,Conservas,gr
I-061,Papa,Verduras,gr
I-062,Huevo,Huevos,unid
I-063,Carne picada,Carnes,gr
I-064,Queso (genérico),Quesos,gr
I-065,Pico de gallo,Preparados,gr
I-066,Coleslaw,Preparados,gr
I-067,Gaseosa 500cc,Bebidas,unid
I-068,Salama milan,Fiambres,gr
I-069,Pepperoni,Fiambres,gr
I-070,Aceite de provenzal,Aceites,gr
I-071,Pollo,Carnes,gr
I-072,Mostaza,Salsas,gr
I-073,Escarola,Verduras,gr
I-074,Pechuga apanada,Carnes,gr
I-075,Cebolla morada,Verduras,gr
I-076,Aceitunas,Conservas,gr
I-077,Pesto,Salsas,gr
I-078,Mayo de palta,Salsas,gr`;

const mappingInsumos: Record<string, string> = {
  'I-001': 'ins_pure_tomate',
  'I-002': 'ins_mozzarella',
  'I-003': 'ins_cantimpalo',
  'I-004': 'ins_pesto_albahaca',
  'I-005': 'ins_jamon_cocido',
  'I-006': 'ins_morrones',
  'I-007': 'ins_queso_azul',
  'I-008': 'ins_provolone',
  'I-011': 'ins_parmesano',
  'I-016': 'ins_verdeo',
  'I-018': 'ins_tomates_confit',
  'I-019': 'ins_aceitunas',
  'I-024': 'ins_hongos_pino',
  'I-025': 'ins_jamon_cocido',
  'I-032': 'ins_jamon_cocido',
  'I-037': 'ins_cheddar_fetas',
  'I-041': 'ins_aceite_oliva',
  'I-043': 'ins_huevo_fresco',
  'I-045': 'ins_albahaca',
  'I-047': 'ins_jamon_crudo',
  'I-052': 'ins_lomo_carne',
  'I-058': 'ins_empanada_relleno',
  'I-059': 'ins_cebolla',
  'I-060': 'ins_aceitunas',
  'I-061': 'ins_papas_rusticas',
  'I-062': 'ins_huevo_fresco',
  'I-067': 'ins_beb_coca_cola_500cc',
  'I-071': 'ins_pollo_desmechado',
  'I-076': 'ins_aceitunas',
  'I-077': 'ins_pesto_albahaca',
};

const productos = [
  // Pizzas Grandes
  {
    id_producto: 'prod_pizza_comun_grande',
    nombre: 'Pizza Rosso Clásica Grande',
    precio_venta: 19000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Pizza clásica de salsa de tomate de la casa, oliva y orégano.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 10,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_pepperoni_grande',
    nombre: 'Pizza Rubí Pepperoni & Miel Sriracha Grande',
    precio_venta: 22000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Pepperoni premium con hilos de miel picante artesanal.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_napolitana_grande',
    nombre: 'Pizza Esmeralda Margarita & Pesto Trapanese Grande',
    precio_venta: 21500,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Cherries confitados, pesto de pistacho y stracciatella.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_colores_especial_grande',
    nombre: 'Pizza Ámbar Prosciutto & Pimientos Dulces Grande',
    precio_venta: 22000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Prosciutto de Parma estacionado, morrón asado y aceite de albahaca.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 14,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_5_quesos_grande',
    nombre: 'Pizza Cromática 5 Quesos & Higos al Malamado Grande',
    precio_venta: 23000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Blend de 5 quesos premium balanceado con higos dulces.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_anchovy_grande',
    nombre: 'Pizza Cobalto Anchoas Cantábricas & Alcaparras Grande',
    precio_venta: 23000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Anchoas del Cantábrico, tomates secos y alcaparras.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_tai_pizza_grande',
    nombre: 'Pizza Índigo Langostinos al Curry Rojo & Coco Grande',
    precio_venta: 25000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Langostinos salteados en curry rojo tailandés y coco.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 18,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_fresca_grande',
    nombre: 'Pizza Jade Rúcula Selvática & Bresaola Grande',
    precio_venta: 22000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Bresaola, rúcula selvática y lascas de Parmigiano.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizz_arma_tu_pizza_grande',
    nombre: 'Pizza Esmeralda Langostinos & Crema de Aguacate Grande',
    precio_venta: 22000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Langostinos al limón, guacamole rústico y pico de gallo.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 16,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_funghi_grande',
    nombre: 'Pizza Siena Funghi Porcini & Trufa Blanca Grande',
    precio_venta: 24000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Portobellos, champiñones, crema de porcini y aceite de trufa.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 14,
    requiere_cocina: true
  },

  // Pizzas Individuales
  {
    id_producto: 'prod_pizza_comun_individual',
    nombre: 'Pizza Rosso Clásica Individual',
    precio_venta: 10000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Versión individual de nuestra clásica de salsa de tomate, oliva y orégano.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 7,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_pepperoni_individual',
    nombre: 'Pizza Rubí Pepperoni & Miel Sriracha Individual',
    precio_venta: 11000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Pepperoni premium individual con miel de sriracha.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 8,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_napolitana_individual',
    nombre: 'Pizza Esmeralda Margarita & Pesto Trapanese Individual',
    precio_venta: 11000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Versión individual de cherries, pesto de pistacho y stracciatella.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 10,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_colores_especial_individual',
    nombre: 'Pizza Ámbar Prosciutto & Pimientos Dulces Individual',
    precio_venta: 11000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Versión individual de prosciutto de Parma, morrón asado y aceite de albahaca.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 9,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_5_quesos_individual',
    nombre: 'Pizza Cromática 5 Quesos & Higos al Malamado Individual',
    precio_venta: 11500,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Versión individual con selección de 5 quesos e higos al oporto.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 10,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_anchovy_individual',
    nombre: 'Pizza Cobalto Anchoas Cantábricas & Alcaparras Individual',
    precio_venta: 11500,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Anchoas seleccionadas y alcaparras en tamaño individual.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 8,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_tai_pizza_individual',
    nombre: 'Pizza Índigo Langostinos al Curry Rojo & Coco Individual',
    precio_venta: 12500,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Langostinos al curry tailandés en versión individual.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_fresca_individual',
    nombre: 'Pizza Jade Rúcula & Bresaola Individual',
    precio_venta: 11000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Rúcula fresca, bresaola y parmesano individual.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 8,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizz_arma_tu_pizza_individual',
    nombre: 'Pizza Esmeralda Langostinos & Crema de Aguacate Individual',
    precio_venta: 11000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Versión individual con langostinos, palta y pico de gallo.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 11,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_funghi_individual',
    nombre: 'Pizza Siena Funghi & Trufa Individual',
    precio_venta: 11500,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Variedad de hongos con aceite de trufa individual.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 9,
    requiere_cocina: true
  },

  // Focaccias
  {
    id_producto: 'prod_foc_toscana',
    nombre: 'Focaccia Toscana de Mortadela & Pistachos',
    precio_venta: 12000,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Focaccia de masa madre con mortadela, provolone y pistachos.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 8,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_dorada',
    nombre: 'Focaccia Dorada de Pollo Crispy & Cheddar',
    precio_venta: 12500,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Pollo crujiente al panko, cheddar inglés y cebolla caramelizada.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_bologna',
    nombre: 'Focaccia Bologna de Mortadela & Stracciatella',
    precio_venta: 13000,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Mortadela bologna con stracciatella fresca y pesto verde.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 6,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_milano',
    nombre: 'Focaccia Milano Milanesa Suprema & Huevo Frito',
    precio_venta: 14500,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Milanesa de ternera con prosciutto crudo y huevo campero.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_palermo',
    nombre: 'Focaccia Palermo de Atún, Burrata & Alcaparras',
    precio_venta: 14000,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Atún en lomo, burrata entera, tomates secos y alcaparras.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 8,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_parma',
    nombre: 'Focaccia Parma Jamón Crudo & Higos Asados',
    precio_venta: 13500,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Jamón crudo, queso fynbo maduro, higos y aceto balsámico.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 10,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_bresaola',
    nombre: 'Focaccia de Bresaola & Rúcula',
    precio_venta: 14000,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Focaccia artesanal con bresaola, provolone y rúcula selvática.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 7,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_pollo_desmechado',
    nombre: 'Focaccia Pollo Desmechado al Verdeo & Queso',
    precio_venta: 12000,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Pollo desmechado salteado al verdeo con muzzarella fundida.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 11,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_espanola',
    nombre: 'Focaccia Española de Jamón Serrano & Tomates Cherry',
    precio_venta: 13000,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Jamón crudo feteado fino, tomates cherry confitados y provolone.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 8,
    requiere_cocina: true
  },

  // Baguettes
  {
    id_producto: 'prod_bag_serrano',
    nombre: 'Baguette Serrano, Morbier & Rúcula',
    precio_venta: 11000,
    categoria: 'Baguettes',
    activo: true,
    descripcion: 'Baguette rústica con jamón serrano, queso morbier y rúcula.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 6,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_bag_clasica',
    nombre: 'Baguette Clásica Jamón Natural & Cheddar',
    precio_venta: 10000,
    categoria: 'Baguettes',
    activo: true,
    descripcion: 'Jamón cocido natural, cheddar maduro y rodajas de tomate.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 5,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_bag_bologna',
    nombre: 'Baguette Mortadela Bologna, Reggianito & Crema Olivas',
    precio_venta: 10500,
    categoria: 'Baguettes',
    activo: true,
    descripcion: 'Mortadela con pistachos, lascas de queso reggianito y olivas.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 6,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_bag_albondiguette',
    nombre: 'Baguette Albondiguette de Ternera & Provolone',
    precio_venta: 11500,
    categoria: 'Baguettes',
    activo: true,
    descripcion: 'Albóndigas estofadas al pomodoro y provolone fundido.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 10,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_bag_lomo_premium',
    nombre: 'Baguette Lomo Premium, Morbier & Encurtidos',
    precio_venta: 12000,
    categoria: 'Baguettes',
    activo: true,
    descripcion: 'Lomito ahumado, morbier, lechuga y cebolla encurtida morada.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 7,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_bag_milan_queso',
    nombre: 'Baguette Milán y Queso',
    precio_venta: 9500,
    categoria: 'Baguettes',
    activo: true,
    descripcion: 'Salame milán feteado fino con provolone y mayonesa artesanal.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 6,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_bag_cruda_queso',
    nombre: 'Baguette Cruda y Queso',
    precio_venta: 11000,
    categoria: 'Baguettes',
    activo: true,
    descripcion: 'Jamón crudo, queso fynbo, rúcula y mayonesa artesanal.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 6,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_bag_lomo_queso',
    nombre: 'Baguette Lomo y Queso',
    precio_venta: 11500,
    categoria: 'Baguettes',
    activo: true,
    descripcion: 'Lomito ahumado, queso morbier fundido y mayonesa clásica.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 6,
    requiere_cocina: true
  },

  // Extras
  {
    id_producto: 'prod_ext_promo_baguette',
    nombre: 'Promo Baguette + Gaseosa',
    precio_venta: 1500,
    categoria: 'Bebidas/Extras',
    activo: true,
    descripcion: 'Combo promocional de baguette rústica con gaseosa de 500cc.',
    tipo: 'bebida',
    tiempo_preparacion_estimado: 1,
    requiere_cocina: false
  },

  // Calzones
  {
    id_producto: 'prod_calz_calzonne_de_la_reina',
    nombre: 'Calzone Regina de Porchetta, Funghi & Provolone',
    precio_venta: 22000,
    categoria: 'Calzones y empanadas',
    activo: true,
    descripcion: 'Porchetta, portobellos asados, provolone y pomodoro.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_calz_calzonne_napolitano',
    nombre: 'Calzone Vesubio de Prosciutto & Cherries',
    precio_venta: 20000,
    categoria: 'Calzones y empanadas',
    activo: true,
    descripcion: 'Jamón crudo, cherries confitados, mozzarella y salsa napolitana.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 10,
    requiere_cocina: true
  },

  // Empanadas
  {
    id_producto: 'prod_calz_empa_saltena',
    nombre: 'Empanada Salteña Cortada a Cuchillo & Papa',
    precio_venta: 2300,
    categoria: 'Calzones y empanadas',
    activo: true,
    descripcion: 'Carne cortada a cuchillo, papa, verdeo, aceituna y huevo duro.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 5,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_calz_empa_criolla',
    nombre: 'Empanada Criolla Tradicional Ahumada',
    precio_venta: 2000,
    categoria: 'Calzones y empanadas',
    activo: true,
    descripcion: 'Carne molida especial, cebolla caramelizada, huevo y pimentón.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 5,
    requiere_cocina: true
  },

  // Panuzzo
  {
    id_producto: 'prod_pan_capri',
    nombre: 'Panuzzo Capri de Langostinos & Palta',
    precio_venta: 18000,
    categoria: 'Panuzzo',
    activo: true,
    descripcion: 'Pan de pizza horneado con langostinos, palta y coleslaw dulce.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 14,
    requiere_cocina: true
  }
];

const ingredientesBOM = [
  // PZ-001 (Pizza Rosso Clásica Grande) -> prod_pizza_comun_grande
  { id_producto: 'prod_pizza_comun_grande', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_comun_grande', id_insumo: 'I-001', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_comun_grande', id_insumo: 'I-002', cantidad_a_descontar: 250.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_comun_grande', id_insumo: 'I-041', cantidad_a_descontar: 10.0, unidad_medida: 'ml' },
  { id_producto: 'prod_pizza_comun_grande', id_insumo: 'I-045', cantidad_a_descontar: 5.0, unidad_medida: 'gr' },

  // PZ-001 Ind -> prod_pizza_comun_individual
  { id_producto: 'prod_pizza_comun_individual', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_comun_individual', id_insumo: 'I-001', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_comun_individual', id_insumo: 'I-002', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_comun_individual', id_insumo: 'I-041', cantidad_a_descontar: 5.0, unidad_medida: 'ml' },
  { id_producto: 'prod_pizza_comun_individual', id_insumo: 'I-045', cantidad_a_descontar: 3.0, unidad_medida: 'gr' },

  // PZ-002 (Pizza Rubí Pepperoni Grande) -> prod_pizza_pepperoni_grande
  { id_producto: 'prod_pizza_pepperoni_grande', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_pepperoni_grande', id_insumo: 'I-001', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_grande', id_insumo: 'I-002', cantidad_a_descontar: 250.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_grande', id_insumo: 'I-069', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_grande', id_insumo: 'I-041', cantidad_a_descontar: 10.0, unidad_medida: 'ml' },
  { id_producto: 'prod_pizza_pepperoni_grande', id_insumo: 'I-045', cantidad_a_descontar: 5.0, unidad_medida: 'gr' },

  // PZ-002 Ind -> prod_pizza_pepperoni_individual
  { id_producto: 'prod_pizza_pepperoni_individual', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_pepperoni_individual', id_insumo: 'I-001', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_individual', id_insumo: 'I-002', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_individual', id_insumo: 'I-069', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_individual', id_insumo: 'I-041', cantidad_a_descontar: 5.0, unidad_medida: 'ml' },
  { id_producto: 'prod_pizza_pepperoni_individual', id_insumo: 'I-045', cantidad_a_descontar: 3.0, unidad_medida: 'gr' },

  // PZ-003 (Pizza Esmeralda Margarita Grande) -> prod_pizza_napolitana_grande
  { id_producto: 'prod_pizza_napolitana_grande', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_napolitana_grande', id_insumo: 'I-001', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_grande', id_insumo: 'I-002', cantidad_a_descontar: 250.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_grande', id_insumo: 'I-057', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_grande', id_insumo: 'I-077', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_grande', id_insumo: 'I-045', cantidad_a_descontar: 5.0, unidad_medida: 'gr' },

  // PZ-003 Ind -> prod_pizza_napolitana_individual
  { id_producto: 'prod_pizza_napolitana_individual', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_napolitana_individual', id_insumo: 'I-001', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_individual', id_insumo: 'I-002', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_individual', id_insumo: 'I-057', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_individual', id_insumo: 'I-077', cantidad_a_descontar: 25.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_individual', id_insumo: 'I-045', cantidad_a_descontar: 3.0, unidad_medida: 'gr' },

  // PZ-004 (Pizza Ámbar Prosciutto Grande) -> prod_pizza_colores_especial_grande
  { id_producto: 'prod_pizza_colores_especial_grande', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_colores_especial_grande', id_insumo: 'I-001', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_grande', id_insumo: 'I-002', cantidad_a_descontar: 250.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_grande', id_insumo: 'I-047', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_grande', id_insumo: 'I-057', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_grande', id_insumo: 'I-048', cantidad_a_descontar: 10.0, unidad_medida: 'gr' },

  // PZ-004 Ind -> prod_pizza_colores_especial_individual
  { id_producto: 'prod_pizza_colores_especial_individual', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_colores_especial_individual', id_insumo: 'I-001', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_individual', id_insumo: 'I-002', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_individual', id_insumo: 'I-047', cantidad_a_descontar: 45.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_individual', id_insumo: 'I-057', cantidad_a_descontar: 45.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_individual', id_insumo: 'I-048', cantidad_a_descontar: 5.0, unidad_medida: 'gr' },

  // PZ-005 (Pizza Cromática 5 Quesos Grande) -> prod_pizza_5_quesos_grande
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-001', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-002', cantidad_a_descontar: 250.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-007', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-008', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-009', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-010', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-011', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-018', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },

  // PZ-005 Ind -> prod_pizza_5_quesos_individual
  { id_producto: 'prod_pizza_5_quesos_individual', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_5_quesos_individual', id_insumo: 'I-001', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_individual', id_insumo: 'I-002', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_individual', id_insumo: 'I-007', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_individual', id_insumo: 'I-008', cantidad_a_descontar: 35.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_individual', id_insumo: 'I-009', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_individual', id_insumo: 'I-010', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_individual', id_insumo: 'I-011', cantidad_a_descontar: 18.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_individual', id_insumo: 'I-018', cantidad_a_descontar: 35.0, unidad_medida: 'gr' },

  // PZ-006 (Pizza Cobalto Anchoas Grande) -> prod_pizza_anchovy_grande
  { id_producto: 'prod_pizza_anchovy_grande', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_anchovy_grande', id_insumo: 'I-001', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_anchovy_grande', id_insumo: 'I-002', cantidad_a_descontar: 250.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_anchovy_grande', id_insumo: 'I-012', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_anchovy_grande', id_insumo: 'I-076', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_anchovy_grande', id_insumo: 'I-018', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },

  // PZ-006 Ind -> prod_pizza_anchovy_individual
  { id_producto: 'prod_pizza_anchovy_individual', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_anchovy_individual', id_insumo: 'I-001', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_anchovy_individual', id_insumo: 'I-002', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_anchovy_individual', id_insumo: 'I-012', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_anchovy_individual', id_insumo: 'I-076', cantidad_a_descontar: 12.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_anchovy_individual', id_insumo: 'I-018', cantidad_a_descontar: 25.0, unidad_medida: 'gr' },

  // PZ-007 (Pizza Índigo Langostinos Grande) -> prod_pizza_tai_pizza_grande
  { id_producto: 'prod_pizza_tai_pizza_grande', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_tai_pizza_grande', id_insumo: 'I-001', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_tai_pizza_grande', id_insumo: 'I-002', cantidad_a_descontar: 250.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_tai_pizza_grande', id_insumo: 'I-014', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_tai_pizza_grande', id_insumo: 'I-015', cantidad_a_descontar: 10.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_tai_pizza_grande', id_insumo: 'I-016', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },

  // PZ-007 Ind -> prod_pizza_tai_pizza_individual
  { id_producto: 'prod_pizza_tai_pizza_individual', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_tai_pizza_individual', id_insumo: 'I-001', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_tai_pizza_individual', id_insumo: 'I-002', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_tai_pizza_individual', id_insumo: 'I-014', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_tai_pizza_individual', id_insumo: 'I-015', cantidad_a_descontar: 8.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_tai_pizza_individual', id_insumo: 'I-016', cantidad_a_descontar: 10.0, unidad_medida: 'gr' },

  // PZ-008 (Pizza Jade Rúcula Grande) -> prod_pizza_fresca_grande
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-001', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-002', cantidad_a_descontar: 250.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-047', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-017', cantidad_a_descontar: 45.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-018', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-011', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // PZ-008 Ind -> prod_pizza_fresca_individual
  { id_producto: 'prod_pizza_fresca_individual', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_fresca_individual', id_insumo: 'I-001', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_individual', id_insumo: 'I-002', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_individual', id_insumo: 'I-047', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_individual', id_insumo: 'I-017', cantidad_a_descontar: 25.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_individual', id_insumo: 'I-018', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_individual', id_insumo: 'I-011', cantidad_a_descontar: 18.0, unidad_medida: 'gr' },

  // PZ-009 (Pizza Esmeralda Langostinos Grande) -> prod_pizz_arma_tu_pizza_grande
  { id_producto: 'prod_pizz_arma_tu_pizza_grande', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizz_arma_tu_pizza_grande', id_insumo: 'I-001', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizz_arma_tu_pizza_grande', id_insumo: 'I-002', cantidad_a_descontar: 250.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizz_arma_tu_pizza_grande', id_insumo: 'I-014', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizz_arma_tu_pizza_grande', id_insumo: 'I-023', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizz_arma_tu_pizza_grande', id_insumo: 'I-065', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },

  // PZ-009 Ind -> prod_pizz_arma_tu_pizza_individual
  { id_producto: 'prod_pizz_arma_tu_pizza_individual', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizz_arma_tu_pizza_individual', id_insumo: 'I-001', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizz_arma_tu_pizza_individual', id_insumo: 'I-002', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizz_arma_tu_pizza_individual', id_insumo: 'I-014', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizz_arma_tu_pizza_individual', id_insumo: 'I-023', cantidad_a_descontar: 45.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizz_arma_tu_pizza_individual', id_insumo: 'I-065', cantidad_a_descontar: 35.0, unidad_medida: 'gr' },

  // PZ-010 (Pizza Siena Funghi Grande) -> prod_pizza_funghi_grande
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-001', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-002', cantidad_a_descontar: 250.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-026', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-024', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-011', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // PZ-010 Ind -> prod_pizza_funghi_individual
  { id_producto: 'prod_pizza_funghi_individual', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pizza_funghi_individual', id_insumo: 'I-001', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_individual', id_insumo: 'I-002', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_individual', id_insumo: 'I-026', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_individual', id_insumo: 'I-024', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_individual', id_insumo: 'I-011', cantidad_a_descontar: 18.0, unidad_medida: 'gr' },

  // FC-001
  { id_producto: 'prod_foc_toscana', id_insumo: 'I-028', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_foc_toscana', id_insumo: 'I-040', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_toscana', id_insumo: 'I-008', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_toscana', id_insumo: 'I-017', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_toscana', id_insumo: 'I-035', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // FC-002
  { id_producto: 'prod_foc_dorada', id_insumo: 'I-028', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_foc_dorada', id_insumo: 'I-074', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_dorada', id_insumo: 'I-037', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_dorada', id_insumo: 'I-038', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_dorada', id_insumo: 'I-039', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // FC-003
  { id_producto: 'prod_foc_bologna', id_insumo: 'I-028', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_foc_bologna', id_insumo: 'I-040', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_bologna', id_insumo: 'I-002', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_bologna', id_insumo: 'I-077', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_bologna', id_insumo: 'I-041', cantidad_a_descontar: 10.0, unidad_medida: 'ml' },

  // FC-004
  { id_producto: 'prod_foc_milano', id_insumo: 'I-028', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_foc_milano', id_insumo: 'I-042', cantidad_a_descontar: 150.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milano', id_insumo: 'I-002', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milano', id_insumo: 'I-005', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milano', id_insumo: 'I-043', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_foc_milano', id_insumo: 'I-034', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },

  // FC-005
  { id_producto: 'prod_foc_palermo', id_insumo: 'I-028', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_foc_palermo', id_insumo: 'I-064', cantidad_a_descontar: 90.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_palermo', id_insumo: 'I-044', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_palermo', id_insumo: 'I-018', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_palermo', id_insumo: 'I-076', cantidad_a_descontar: 15.0, unidad_medida: 'gr' },

  // FC-006
  { id_producto: 'prod_foc_parma', id_insumo: 'I-028', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_foc_parma', id_insumo: 'I-047', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_parma', id_insumo: 'I-010', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_parma', id_insumo: 'I-017', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_parma', id_insumo: 'I-039', cantidad_a_descontar: 15.0, unidad_medida: 'gr' },

  // FC-007
  { id_producto: 'prod_foc_bresaola', id_insumo: 'I-028', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_foc_bresaola', id_insumo: 'I-047', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_bresaola', id_insumo: 'I-008', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_bresaola', id_insumo: 'I-017', cantidad_a_descontar: 25.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_bresaola', id_insumo: 'I-039', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // FC-008
  { id_producto: 'prod_foc_pollo_desmechado', id_insumo: 'I-028', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_foc_pollo_desmechado', id_insumo: 'I-071', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_pollo_desmechado', id_insumo: 'I-016', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_pollo_desmechado', id_insumo: 'I-002', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_pollo_desmechado', id_insumo: 'I-039', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },

  // FC-009
  { id_producto: 'prod_foc_espanola', id_insumo: 'I-028', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_foc_espanola', id_insumo: 'I-047', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_espanola', id_insumo: 'I-057', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_espanola', id_insumo: 'I-008', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_espanola', id_insumo: 'I-039', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },

  // BG-001
  { id_producto: 'prod_bag_serrano', id_insumo: 'I-029', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_bag_serrano', id_insumo: 'I-047', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_serrano', id_insumo: 'I-009', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_serrano', id_insumo: 'I-017', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_serrano', id_insumo: 'I-039', cantidad_a_descontar: 25.0, unidad_medida: 'gr' },

  // BG-002
  { id_producto: 'prod_bag_clasica', id_insumo: 'I-029', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_bag_clasica', id_insumo: 'I-005', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_clasica', id_insumo: 'I-037', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_clasica', id_insumo: 'I-034', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_clasica', id_insumo: 'I-070', cantidad_a_descontar: 10.0, unidad_medida: 'gr' },

  // BG-003
  { id_producto: 'prod_bag_bologna', id_insumo: 'I-029', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_bag_bologna', id_insumo: 'I-040', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_bologna', id_insumo: 'I-011', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_bologna', id_insumo: 'I-049', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_bologna', id_insumo: 'I-017', cantidad_a_descontar: 15.0, unidad_medida: 'gr' },

  // BG-004
  { id_producto: 'prod_bag_albondiguette', id_insumo: 'I-029', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_bag_albondiguette', id_insumo: 'I-051', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_albondiguette', id_insumo: 'I-001', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_albondiguette', id_insumo: 'I-002', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_albondiguette', id_insumo: 'I-048', cantidad_a_descontar: 10.0, unidad_medida: 'gr' },

  // BG-005
  { id_producto: 'prod_bag_lomo_premium', id_insumo: 'I-029', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_bag_lomo_premium', id_insumo: 'I-052', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_lomo_premium', id_insumo: 'I-009', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_lomo_premium', id_insumo: 'I-033', cantidad_a_descontar: 25.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_lomo_premium', id_insumo: 'I-075', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // BG-006
  { id_producto: 'prod_bag_milan_queso', id_insumo: 'I-029', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_bag_milan_queso', id_insumo: 'I-068', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_milan_queso', id_insumo: 'I-008', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_milan_queso', id_insumo: 'I-039', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // BG-007
  { id_producto: 'prod_bag_cruda_queso', id_insumo: 'I-029', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_bag_cruda_queso', id_insumo: 'I-047', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_cruda_queso', id_insumo: 'I-010', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_cruda_queso', id_insumo: 'I-039', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // BG-008
  { id_producto: 'prod_bag_lomo_queso', id_insumo: 'I-029', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_bag_lomo_queso', id_insumo: 'I-052', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_lomo_queso', id_insumo: 'I-009', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_bag_lomo_queso', id_insumo: 'I-035', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // EX-001
  { id_producto: 'prod_ext_promo_baguette', id_insumo: 'I-067', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },

  // CZ-001
  { id_producto: 'prod_calz_calzonne_de_la_reina', id_insumo: 'I-030', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_calz_calzonne_de_la_reina', id_insumo: 'I-054', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_calzonne_de_la_reina', id_insumo: 'I-025', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_calzonne_de_la_reina', id_insumo: 'I-002', cantidad_a_descontar: 150.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_calzonne_de_la_reina', id_insumo: 'I-055', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_calzonne_de_la_reina', id_insumo: 'I-008', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },

  // CZ-002
  { id_producto: 'prod_calz_calzonne_napolitano', id_insumo: 'I-030', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_calz_calzonne_napolitano', id_insumo: 'I-056', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_calzonne_napolitano', id_insumo: 'I-002', cantidad_a_descontar: 150.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_calzonne_napolitano', id_insumo: 'I-025', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_calzonne_napolitano', id_insumo: 'I-011', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_calzonne_napolitano', id_insumo: 'I-057', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },

  // EM-001
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-031', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-058', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-061', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-016', cantidad_a_descontar: 10.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-060', cantidad_a_descontar: 10.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-062', cantidad_a_descontar: 10.0, unidad_medida: 'gr' },

  // EM-002
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-031', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-063', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-059', cantidad_a_descontar: 25.0, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-062', cantidad_a_descontar: 10.0, unidad_medida: 'gr' },

  // PN-001
  { id_producto: 'prod_pan_capri', id_insumo: 'I-027', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_pan_capri', id_insumo: 'I-002', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pan_capri', id_insumo: 'I-014', cantidad_a_descontar: 90.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pan_capri', id_insumo: 'I-065', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pan_capri', id_insumo: 'I-066', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pan_capri', id_insumo: 'I-023', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pan_capri', id_insumo: 'I-078', cantidad_a_descontar: 25.0, unidad_medida: 'gr' }
];

async function run() {
  console.log('Iniciando carga de la renovación de la carta a Supabase...');

  // 1. Parsear el CSV de insumos de Excel para obtener detalles de cada uno
  const excelInsumosMap: Record<string, { nombre: string, categoria: string, unidad: string }> = {};
  const csvLines = csvData.split('\n');
  for (const line of csvLines) {
    if (!line.trim() || line.startsWith('ID_INSUMO')) continue;
    const parts = line.split(',');
    if (parts.length >= 4) {
      excelInsumosMap[parts[0].trim()] = {
        nombre: parts[1].trim(),
        categoria: parts[2].trim(),
        unidad: parts[3].trim()
      };
    }
  }

  // 2. Consultar todos los id_insumo ya existentes en Supabase
  console.log('Consultando insumos existentes en la base de datos...');
  const { data: dbInsumos, error: dbInsumosError } = await supabase
    .from('insumos')
    .select('id_insumo');

  if (dbInsumosError) {
    console.error('Error al obtener insumos de la base de datos:', dbInsumosError.message);
    process.exit(1);
  }

  const existingInsumosSet = new Set<string>((dbInsumos || []).map(i => i.id_insumo));

  // 3. Identificar qué insumos son requeridos por las recetas y agregarlos si no existen
  console.log('Verificando insumos requeridos en recetas...');
  const insumosToUpsert: any[] = [];
  
  for (const row of ingredientesBOM) {
    // Determinar qué ID_INSUMO real se usará en la base de datos
    const targetInsumoId = mappingInsumos[row.id_insumo] || row.id_insumo;

    // Si no está registrado en la base de datos, lo preparamos para subirlo
    if (!existingInsumosSet.has(targetInsumoId)) {
      // Buscar detalles de Excel (usando el ID original excelId)
      const excelId = row.id_insumo;
      const details = excelInsumosMap[excelId] || { nombre: `Insumo ${excelId}`, categoria: 'Otros', unidad: row.unidad_medida };
      
      console.log(`Insumo faltante detectado en DB: ${targetInsumoId} (${details.nombre}). Registrándolo...`);
      insumosToUpsert.push({
        id_insumo: targetInsumoId,
        nombre: details.nombre,
        unidad_medida: details.unidad || row.unidad_medida,
        categoria: details.categoria || 'Otros',
        stock_actual: 10000.0,
        stock_minimo: 2000.0,
        costo_unitario: 1.0,
        es_bebida_directa: false
      });

      // Añadimos al Set temporal para no duplicar en la cola de subida
      existingInsumosSet.add(targetInsumoId);
    }
  }

  if (insumosToUpsert.length > 0) {
    console.log(`Subiendo ${insumosToUpsert.length} insumos nuevos a Supabase...`);
    const { error: upsertInsumosError } = await supabase
      .from('insumos')
      .upsert(insumosToUpsert);

    if (upsertInsumosError) {
      console.error('Error al dar de alta insumos nuevos en la DB:', upsertInsumosError.message);
      process.exit(1);
    }
    console.log('✅ Insumos nuevos dados de alta con éxito.');
  } else {
    console.log('✅ Todos los insumos de las recetas ya existen en la DB.');
  }

  // 4. Insertar / Actualizar productos en productos_menu
  for (const prod of productos) {
    console.log(`Upserting producto: ${prod.nombre} (${prod.id_producto})`);
    const { error } = await supabase
      .from('productos_menu')
      .upsert(prod);
    
    if (error) {
      console.error(`Error al subir producto ${prod.nombre}:`, error.message);
      process.exit(1);
    }
  }
  console.log('✅ Todos los productos actualizados correctamente en productos_menu.');

  // 5. Limpiar recetas_escandallo antiguas de los productos modificados
  const productIds = productos.map(p => p.id_producto);
  console.log('Limpiando recetas_escandallo anteriores...');
  const { error: deleteError } = await supabase
    .from('recetas_escandallo')
    .delete()
    .in('id_producto', productIds);

  if (deleteError) {
    console.error('Error al limpiar recetas_escandallo:', deleteError.message);
    process.exit(1);
  }

  // 6. Insertar las nuevas recetas en recetas_escandallo con mapeo correcto de insumos
  console.log('Subiendo nuevas relaciones recetas_escandallo...');
  const dbRows = ingredientesBOM.map((row, idx) => {
    const realInsumoId = mappingInsumos[row.id_insumo] || row.id_insumo;
    return {
      id_receta: `esc_renov_${idx}_${row.id_producto.substring(5, 12)}_${realInsumoId.substring(0, 8)}`,
      id_producto: row.id_producto,
      id_insumo: realInsumoId,
      cantidad_a_descontar: row.cantidad_a_descontar,
      unidad_medida: row.unidad_medida
    };
  });

  // Hacemos la inserción fila por fila para identificar cuál falla
  console.log(`Intentando insertar ${dbRows.length} filas en recetas_escandallo una por una...`);
  for (const row of dbRows) {
    const { error: rowError } = await supabase
      .from('recetas_escandallo')
      .upsert(row);

    if (rowError) {
      console.error(`❌ ERROR en fila:`, JSON.stringify(row, null, 2));
      console.error(`Mensaje de error:`, rowError.message);
      process.exit(1);
    }
  }

  console.log('🎉 ¡RENOVACIÓN TOTAL COMPLETADA CON ÉXITO EN SUPABASE!');
}

run();
