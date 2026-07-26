import { createClient } from '@supabase/supabase-js';

const url = 'https://msmaksbtetcmoaiyywto.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbWFrc2J0ZXRjbW9haXl5d3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDA5ODgsImV4cCI6MjA4OTIxNjk4OH0.Qvw26EVpCyyYS631WZ3T6LN3x__4xFliYvfSjZJCmsc';

const supabase = createClient(url, key);

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
I-027,Masa,Masas,gr
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
I-078,Mayo de palta,Salsas,gr
I-079,Nalga,Carnes,gr
I-080,Queso mantecoso,Quesos,gr
I-081,Hummus,Preparados,gr
I-082,Mascarpone,Lácteos,gr
I-083,Crema de leche,Lácteos,gr
I-084,Yema,Huevos,unid
I-085,Azúcar,Almacén,gr
I-086,Vainillas,Almacén,gr
I-087,Café listo,Bebidas,ml
I-088,Amaretto,Bebidas,ml
I-089,Harina 0000,Almacén,gr
I-090,Manteca,Lácteos,gr
I-091,Ricota,Lácteos,gr
I-092,Ralladura de naranja,Aromáticos,gr
I-093,Esencia de vainilla,Almacén,ml
I-094,Sal,Almacén,gr
I-095,Comino,Especias,gr
I-096,Pimienta,Especias,gr
I-097,Laurel,Aromáticos,unid
I-098,Romero,Aromáticos,gr
I-099,Ajo,Verduras,gr
I-100,Ají molido,Especias,gr
I-101,Pimentón,Especias,gr
I-102,Palta,Verduras,gr
I-103,Leche,Lácteos,ml
I-104,Limón,Verduras,gr`;

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
  'I-027': 'ins_masa_pizza',
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
  'I-079': 'ins_nalga',
  'I-080': 'ins_queso_mantecoso',
  'I-081': 'ins_hummus',
  'I-082': 'ins_mascarpone',
  'I-083': 'ins_crema_leche',
  'I-084': 'ins_yema',
  'I-085': 'ins_azucar',
  'I-086': 'ins_vainillas',
  'I-087': 'ins_cafe',
  'I-088': 'ins_amaretto',
  'I-089': 'ins_harina',
  'I-090': 'ins_manteca',
  'I-091': 'ins_ricota',
  'I-092': 'ins_ralladura_naranja',
  'I-093': 'ins_esencia_vainilla',
  'I-094': 'ins_sal',
  'I-095': 'ins_comino',
  'I-096': 'ins_pimienta',
  'I-097': 'ins_laurel',
  'I-098': 'ins_romero',
  'I-099': 'ins_ajo',
  'I-100': 'ins_aji_molido',
  'I-101': 'ins_pimenton',
  'I-102': 'ins_palta',
  'I-103': 'ins_leche',
  'I-104': 'ins_limon',
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
    descripcion: 'Prosciutto de Parma de larga maduración, pimientos confitados y oliva.',
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
    descripcion: 'Blend de 5 quesos seleccionados y toque de higos dulces.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_fresca_grande',
    nombre: 'Pizza Jade Rúcula Selvática & Bresaola Grande',
    precio_venta: 22000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Rúcula fresca, bresaola feteada e hilos de oliva.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_funghi_grande',
    nombre: 'Pizza Siena Funghi Porcini & Trufa Blanca Grande',
    precio_venta: 24000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Portobellos salteados, salsa de hongos y aceite perfumado de trufa.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 14,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_pizza_guacamole_grande',
    nombre: 'Guacamole Pizza',
    precio_venta: 24000,
    categoria: 'Pizzas',
    activo: true,
    descripcion: 'Masa artesanal con langostinos, cebolla fugazza y crema de guacamole.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 15,
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
    id_producto: 'prod_foc_milanesa_completa',
    nombre: 'Focaccia de Milanesa Completa',
    precio_venta: 14500,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Milanesa tierna, jamón cocido, muzzarella, papas rústicas, lechuga, tomate y mayonesa.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 12,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_clasica',
    nombre: 'Focaccia Clásica de Jamón & Provolone',
    precio_venta: 11000,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Jamón cocido natural, queso provolone fundido, rodajas de tomate y lechuga fresca.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 7,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_mortadela',
    nombre: 'Focaccia de Mortadela & Queso Mantecoso',
    precio_venta: 12000,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Mortadela feteada fina, queso mantecoso fundido, rúcula fresca y pesto.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 8,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_lomo',
    nombre: 'Focaccia de Lomo & Provolone',
    precio_venta: 13500,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Nalga tiernizada, provolone derretido, jamón cocido y mayonesa clásica.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 10,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_milan',
    nombre: 'Focaccia Milán & Milanesa',
    precio_venta: 12500,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Milanesa con queso provolone, provenzal y mayonesa.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 9,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_cruda',
    nombre: 'Focaccia Cruda & Fynbo',
    precio_venta: 13000,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Jamón crudo premium, queso fynbo, rúcula fresca, oliva y pesto.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 8,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_foc_garbanzo',
    nombre: 'Focaccia de Garbanzo & Hummus',
    precio_venta: 11500,
    categoria: 'Focaccias',
    activo: true,
    descripcion: 'Hummus untuoso de garbanzos, tomates secos, rúcula fresca y huevo.',
    tipo: 'plato',
    tiempo_preparacion_estimado: 8,
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

  // Postres
  {
    id_producto: 'prod_post_tiramisu',
    nombre: 'Tiramisú',
    precio_venta: 9000,
    categoria: 'Postres',
    activo: true,
    descripcion: 'Clásico postre italiano a base de mascarpone, café y vainillas.',
    tipo: 'postre',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  },
  {
    id_producto: 'prod_post_tarta_de_ricotta',
    nombre: 'Tarta de Ricotta',
    precio_venta: 6000,
    categoria: 'Postres',
    activo: true,
    descripcion: 'Clásica tarta de ricota con ralladura de naranja y esencia de vainilla.',
    tipo: 'postre',
    tiempo_preparacion_estimado: 15,
    requiere_cocina: true
  }
];

const ingredientesBOM = [
  // Muzzarella (Grande) -> prod_pizza_comun_grande
  { id_producto: 'prod_pizza_comun_grande', id_insumo: 'I-027', cantidad_a_descontar: 440.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_comun_grande', id_insumo: 'I-001', cantidad_a_descontar: 130.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_comun_grande', id_insumo: 'I-002', cantidad_a_descontar: 200.0, unidad_medida: 'gr' },

  // Muzzarella (Individual) -> prod_pizza_comun_individual
  { id_producto: 'prod_pizza_comun_individual', id_insumo: 'I-027', cantidad_a_descontar: 230.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_comun_individual', id_insumo: 'I-001', cantidad_a_descontar: 90.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_comun_individual', id_insumo: 'I-002', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },

  // Margarita (Grande) -> prod_pizza_napolitana_grande
  { id_producto: 'prod_pizza_napolitana_grande', id_insumo: 'I-027', cantidad_a_descontar: 440.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_grande', id_insumo: 'I-001', cantidad_a_descontar: 130.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_grande', id_insumo: 'I-002', cantidad_a_descontar: 200.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_grande', id_insumo: 'I-004', cantidad_a_descontar: 35.0, unidad_medida: 'gr' },

  // Margarita (Individual) -> prod_pizza_napolitana_individual
  { id_producto: 'prod_pizza_napolitana_individual', id_insumo: 'I-027', cantidad_a_descontar: 230.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_individual', id_insumo: 'I-001', cantidad_a_descontar: 90.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_individual', id_insumo: 'I-002', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_napolitana_individual', id_insumo: 'I-004', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // Especial (Grande) -> prod_pizza_colores_especial_grande
  { id_producto: 'prod_pizza_colores_especial_grande', id_insumo: 'I-027', cantidad_a_descontar: 440.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_grande', id_insumo: 'I-001', cantidad_a_descontar: 130.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_grande', id_insumo: 'I-002', cantidad_a_descontar: 200.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_grande', id_insumo: 'I-006', cantidad_a_descontar: 90.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_colores_especial_grande', id_insumo: 'I-005', cantidad_a_descontar: 85.0, unidad_medida: 'gr' },

  // Pepperoni (Grande) -> prod_pizza_pepperoni_grande
  { id_producto: 'prod_pizza_pepperoni_grande', id_insumo: 'I-027', cantidad_a_descontar: 440.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_grande', id_insumo: 'I-001', cantidad_a_descontar: 130.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_grande', id_insumo: 'I-002', cantidad_a_descontar: 200.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_grande', id_insumo: 'I-069', cantidad_a_descontar: 65.0, unidad_medida: 'gr' },

  // Pepperoni (Individual) -> prod_pizza_pepperoni_individual
  { id_producto: 'prod_pizza_pepperoni_individual', id_insumo: 'I-027', cantidad_a_descontar: 230.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_individual', id_insumo: 'I-001', cantidad_a_descontar: 90.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_individual', id_insumo: 'I-002', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_pepperoni_individual', id_insumo: 'I-069', cantidad_a_descontar: 35.0, unidad_medida: 'gr' },

  // Funghi (Grande) -> prod_pizza_funghi_grande
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-027', cantidad_a_descontar: 440.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-054', cantidad_a_descontar: 220.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-005', cantidad_a_descontar: 80.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-026', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-075', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_grande', id_insumo: 'I-011', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },

  // Funghi (Individual) -> prod_pizza_funghi_individual
  { id_producto: 'prod_pizza_funghi_individual', id_insumo: 'I-027', cantidad_a_descontar: 230.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_individual', id_insumo: 'I-054', cantidad_a_descontar: 90.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_individual', id_insumo: 'I-026', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_individual', id_insumo: 'I-075', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_funghi_individual', id_insumo: 'I-011', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },

  // Cinco Quesos -> prod_pizza_5_quesos_grande
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-027', cantidad_a_descontar: 440.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-002', cantidad_a_descontar: 200.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-007', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-008', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-010', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-011', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_5_quesos_grande', id_insumo: 'I-004', cantidad_a_descontar: 4.0, unidad_medida: 'gr' },

  // Fresca -> prod_pizza_fresca_grande
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-027', cantidad_a_descontar: 440.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-001', cantidad_a_descontar: 130.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-002', cantidad_a_descontar: 200.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-018', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-019', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-011', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_fresca_grande', id_insumo: 'I-017', cantidad_a_descontar: 150.0, unidad_medida: 'gr' },

  // Guacamole Pizza -> prod_pizza_guacamole_grande
  { id_producto: 'prod_pizza_guacamole_grande', id_insumo: 'I-027', cantidad_a_descontar: 440.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_guacamole_grande', id_insumo: 'I-001', cantidad_a_descontar: 130.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_guacamole_grande', id_insumo: 'I-002', cantidad_a_descontar: 200.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_guacamole_grande', id_insumo: 'I-014', cantidad_a_descontar: 150.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_guacamole_grande', id_insumo: 'I-022', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_guacamole_grande', id_insumo: 'I-102', cantidad_a_descontar: 26.67, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_guacamole_grande', id_insumo: 'I-103', cantidad_a_descontar: 13.33, unidad_medida: 'gr' },
  { id_producto: 'prod_pizza_guacamole_grande', id_insumo: 'I-104', cantidad_a_descontar: 5.0, unidad_medida: 'gr' },

  // Focaccia Milanesa Completa -> prod_foc_milanesa_completa
  { id_producto: 'prod_foc_milanesa_completa', id_insumo: 'I-027', cantidad_a_descontar: 300.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milanesa_completa', id_insumo: 'I-042', cantidad_a_descontar: 170.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milanesa_completa', id_insumo: 'I-005', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milanesa_completa', id_insumo: 'I-002', cantidad_a_descontar: 70.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milanesa_completa', id_insumo: 'I-061', cantidad_a_descontar: 130.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milanesa_completa', id_insumo: 'I-034', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milanesa_completa', id_insumo: 'I-033', cantidad_a_descontar: 10.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milanesa_completa', id_insumo: 'I-035', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milanesa_completa', id_insumo: 'I-062', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },

  // Focaccia Clásica -> prod_foc_clasica
  { id_producto: 'prod_foc_clasica', id_insumo: 'I-027', cantidad_a_descontar: 300.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_clasica', id_insumo: 'I-035', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_clasica', id_insumo: 'I-034', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_clasica', id_insumo: 'I-025', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_clasica', id_insumo: 'I-008', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_clasica', id_insumo: 'I-033', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },

  // Focaccia Mortadela -> prod_foc_mortadela
  { id_producto: 'prod_foc_mortadela', id_insumo: 'I-027', cantidad_a_descontar: 300.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_mortadela', id_insumo: 'I-035', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_mortadela', id_insumo: 'I-040', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_mortadela', id_insumo: 'I-080', cantidad_a_descontar: 140.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_mortadela', id_insumo: 'I-017', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_mortadela', id_insumo: 'I-004', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },

  // Focaccia Lomo -> prod_foc_lomo
  { id_producto: 'prod_foc_lomo', id_insumo: 'I-027', cantidad_a_descontar: 300.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_lomo', id_insumo: 'I-079', cantidad_a_descontar: 200.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_lomo', id_insumo: 'I-008', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_lomo', id_insumo: 'I-035', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_lomo', id_insumo: 'I-025', cantidad_a_descontar: 20.0, unidad_medida: 'gr' },

  // Focaccia Milán -> prod_foc_milan
  { id_producto: 'prod_foc_milan', id_insumo: 'I-027', cantidad_a_descontar: 300.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milan', id_insumo: 'I-042', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milan', id_insumo: 'I-008', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milan', id_insumo: 'I-035', cantidad_a_descontar: 40.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_milan', id_insumo: 'I-056', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // Focaccia Cruda -> prod_foc_cruda
  { id_producto: 'prod_foc_cruda', id_insumo: 'I-027', cantidad_a_descontar: 300.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_cruda', id_insumo: 'I-047', cantidad_a_descontar: 120.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_cruda', id_insumo: 'I-010', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_cruda', id_insumo: 'I-017', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_cruda', id_insumo: 'I-041', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_cruda', id_insumo: 'I-004', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },

  // Focaccia Garbanzo -> prod_foc_garbanzo
  { id_producto: 'prod_foc_garbanzo', id_insumo: 'I-027', cantidad_a_descontar: 300.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_garbanzo', id_insumo: 'I-081', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_garbanzo', id_insumo: 'I-018', cantidad_a_descontar: 60.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_garbanzo', id_insumo: 'I-017', cantidad_a_descontar: 30.0, unidad_medida: 'gr' },
  { id_producto: 'prod_foc_garbanzo', id_insumo: 'I-062', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },

  // Empanada Criolla -> prod_calz_empa_criolla
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-031', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-063', cantidad_a_descontar: 31.4, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-059', cantidad_a_descontar: 31.4, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-090', cantidad_a_descontar: 1.05, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-094', cantidad_a_descontar: 0.76, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-095', cantidad_a_descontar: 0.25, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-096', cantidad_a_descontar: 0.12, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_criolla', id_insumo: 'I-062', cantidad_a_descontar: 0.135, unidad_medida: 'unid' },

  // Empanada Salteña -> prod_calz_empa_saltena
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-031', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-058', cantidad_a_descontar: 25.64, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-059', cantidad_a_descontar: 25.64, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-094', cantidad_a_descontar: 1.06, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-097', cantidad_a_descontar: 0.026, unidad_medida: 'unid' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-098', cantidad_a_descontar: 0.026, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-099', cantidad_a_descontar: 0.16, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-100', cantidad_a_descontar: 0.128, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-101', cantidad_a_descontar: 0.192, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-096', cantidad_a_descontar: 0.064, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-061', cantidad_a_descontar: 4.74, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-060', cantidad_a_descontar: 4.03, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-016', cantidad_a_descontar: 3.08, unidad_medida: 'gr' },
  { id_producto: 'prod_calz_empa_saltena', id_insumo: 'I-062', cantidad_a_descontar: 0.095, unidad_medida: 'unid' },

  // Tiramisú -> prod_post_tiramisu
  { id_producto: 'prod_post_tiramisu', id_insumo: 'I-082', cantidad_a_descontar: 66.67, unidad_medida: 'gr' },
  { id_producto: 'prod_post_tiramisu', id_insumo: 'I-083', cantidad_a_descontar: 88.33, unidad_medida: 'gr' },
  { id_producto: 'prod_post_tiramisu', id_insumo: 'I-084', cantidad_a_descontar: 1.0, unidad_medida: 'unid' },
  { id_producto: 'prod_post_tiramisu', id_insumo: 'I-085', cantidad_a_descontar: 13.33, unidad_medida: 'gr' },
  { id_producto: 'prod_post_tiramisu', id_insumo: 'I-086', cantidad_a_descontar: 111.0, unidad_medida: 'gr' },
  { id_producto: 'prod_post_tiramisu', id_insumo: 'I-087', cantidad_a_descontar: 91.67, unidad_medida: 'ml' },
  { id_producto: 'prod_post_tiramisu', id_insumo: 'I-088', cantidad_a_descontar: 2.5, unidad_medida: 'ml' },

  // Tarta de Ricota -> prod_post_tarta_de_ricotta
  { id_producto: 'prod_post_tarta_de_ricotta', id_insumo: 'I-089', cantidad_a_descontar: 50.0, unidad_medida: 'gr' },
  { id_producto: 'prod_post_tarta_de_ricotta', id_insumo: 'I-085', cantidad_a_descontar: 46.67, unidad_medida: 'gr' },
  { id_producto: 'prod_post_tarta_de_ricotta', id_insumo: 'I-090', cantidad_a_descontar: 33.33, unidad_medida: 'gr' },
  { id_producto: 'prod_post_tarta_de_ricotta', id_insumo: 'I-062', cantidad_a_descontar: 0.83, unidad_medida: 'unid' },
  { id_producto: 'prod_post_tarta_de_ricotta', id_insumo: 'I-091', cantidad_a_descontar: 100.0, unidad_medida: 'gr' },
  { id_producto: 'prod_post_tarta_de_ricotta', id_insumo: 'I-083', cantidad_a_descontar: 16.67, unidad_medida: 'gr' },
  { id_producto: 'prod_post_tarta_de_ricotta', id_insumo: 'I-092', cantidad_a_descontar: 1.0, unidad_medida: 'gr' },
  { id_producto: 'prod_post_tarta_de_ricotta', id_insumo: 'I-093', cantidad_a_descontar: 1.0, unidad_medida: 'ml' }
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
