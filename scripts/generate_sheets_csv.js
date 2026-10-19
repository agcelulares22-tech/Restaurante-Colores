const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'csv_sheets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) {
    val = val.join('; ');
  }
  const s = String(val).replace(/"/g, '""');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes(';')) {
    return `"${s}"`;
  }
  return s;
}

function writeCsv(filename, headers, rows) {
  const content = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escapeCsv(r[h])).join(','))
  ].join('\r\n');
  fs.writeFileSync(path.join(outDir, filename), '\ufeff' + content, 'utf8');
  console.log(`Generated: ${filename} (${rows.length} rows)`);
}

// 1. categorias
const categorias = [
  { id: 'cat_1', nombre: 'Bebidas', slug: 'bebidas', orden: 1, activa: true, icono: 'Wine', created_at: '2026-06-12T00:00:00Z' },
  { id: 'cat_2', nombre: 'Calzones y empanadas', slug: 'calzones-y-empanadas', orden: 2, activa: true, icono: 'UtensilsCrossed', created_at: '2026-06-12T00:00:00Z' },
  { id: 'cat_3', nombre: 'Pizzas', slug: 'pizzas', orden: 3, activa: true, icono: 'Pizza', created_at: '2026-06-12T00:00:00Z' },
  { id: 'cat_4', nombre: 'Postres', slug: 'postres', orden: 4, activa: true, icono: 'Coffee', created_at: '2026-06-12T00:00:00Z' },
  { id: 'cat_5', nombre: 'Sandwiches', slug: 'sandwiches', orden: 5, activa: true, icono: 'UtensilsCrossed', created_at: '2026-06-12T00:00:00Z' },
  { id: 'cat_6', nombre: 'Focaccias', slug: 'focaccias', orden: 6, activa: true, icono: 'UtensilsCrossed', created_at: '2026-06-12T00:00:00Z' }
];
writeCsv('2_categorias.csv', ['id', 'nombre', 'slug', 'orden', 'activa', 'icono', 'created_at'], categorias);

// 2. proveedores
const proveedores = [
  { id_proveedor: 'prov_1', nombre: 'Molino Cañuelas', contacto: 'Ventas Cañuelas', telefono: '+54 358 450-1001', categoria: 'Secos', insumo_principal: 'Harinas', correo: 'ventas@molinoccanuelas.com.ar', tiempo_entrega_dias: 2 },
  { id_proveedor: 'prov_2', nombre: 'Distribuidora Altiplano', contacto: 'Carlos Gómez', telefono: '+54 358 450-1002', categoria: 'Secos', insumo_principal: 'Levaduras y Conservas', correo: 'pedidos@altiplano.com.ar', tiempo_entrega_dias: 1 },
  { id_proveedor: 'prov_3', nombre: 'Mercado de Abasto Río Cuarto', contacto: 'Puesto 14', telefono: '+54 358 450-1003', categoria: 'Frescos', insumo_principal: 'Vegetales y Frutas', correo: 'abasto@riocuarto.gov.ar', tiempo_entrega_dias: 1 },
  { id_proveedor: 'prov_4', nombre: 'Lácteos La Bocha', contacto: 'Esteban Bocha', telefono: '+54 358 450-1004', categoria: 'Frescos', insumo_principal: 'Mozzarella y Quesos', correo: 'ventas@labocha.com.ar', tiempo_entrega_dias: 1 },
  { id_proveedor: 'prov_5', nombre: 'Frigorífico El Triunfo', contacto: 'Martín Fierro', telefono: '+54 358 450-1005', categoria: 'Frescos', insumo_principal: 'Jamón y Fiambres', correo: 'triunfo@frigorifico.com.ar', tiempo_entrega_dias: 1 },
  { id_proveedor: 'prov_6', nombre: 'Gourmet Imports', contacto: 'Ana Clara', telefono: '+54 358 450-1006', categoria: 'Especialidades', insumo_principal: 'Aceite de oliva y Chocolate', correo: 'gourmet@imports.com.ar', tiempo_entrega_dias: 3 },
  { id_proveedor: 'prov_7', nombre: 'Distribuidora Río Cuarto', contacto: 'Lucas GIUS', telefono: '+54 358 450-1007', categoria: 'Bebidas', insumo_principal: 'Cervezas GIUS y Gaseosas', correo: 'distribuidora@riocuarto.com', tiempo_entrega_dias: 1 },
  { id_proveedor: 'prov_8', nombre: 'Coca-Cola Andina', contacto: 'Preventista Coca', telefono: '+54 358 450-1008', categoria: 'Bebidas', insumo_principal: 'Gaseosas y Aguas', correo: 'pedidos@andina.com.ar', tiempo_entrega_dias: 2 }
];
writeCsv('5_proveedores.csv', ['id_proveedor', 'nombre', 'contacto', 'telefono', 'categoria', 'insumo_principal', 'correo', 'tiempo_entrega_dias'], proveedores);

// 3. promociones
const promociones = [
  { id_promo: 'p_1', nombre: 'Pizza "Mega Colores" Llaxta', descripcion: 'Masa aireada fermentada por 48hs al carbón activo, doble muzzarella fundida, panceta ahumada caramelizada, morrones al fuego y aceitunas seleccionadas.', descuento: 20.0, fecha_inicio: '2026-06-01', fecha_fin: '2026-12-31', activa: true, imagen_url: '/images/pizza_usuario.jpg', vigencia: 'De Martes a Domingos' },
  { id_promo: 'p_2', nombre: 'Empanada "Criolla Explosiva"', descripcion: 'Horneada al barro y leña de espinillo. Rellena de lomo cortado a cuchillo, rehogada a mano con cebolla de verdeo dulce y huevo picado.', descuento: 15.0, fecha_inicio: '2026-06-01', fecha_fin: '2026-12-31', activa: true, imagen_url: '/images/empanadas_usuario.jpg', vigencia: 'Todos los días' },
  { id_promo: 'p_3', nombre: 'Calzone "Bastardo"', descripcion: 'Masa rústica artesanal rellena generosamente con jamón cocido seleccionado, muzzarella, hongos salteados al malbec y gratinado de provolone.', descuento: 25.0, fecha_inicio: '2026-06-01', fecha_fin: '2026-12-31', activa: true, imagen_url: '/images/calzone_usuario.jpg', vigencia: 'Miércoles y Jueves' }
];
writeCsv('6_promociones.csv', ['id_promo', 'nombre', 'descripcion', 'descuento', 'fecha_inicio', 'fecha_fin', 'activa', 'imagen_url', 'vigencia'], promociones);

// 4. clientes
const clientes = [
  { id_cliente: 'cli_001', dni_cuit: '20-35492817-9', nombre: 'Juan Carlos Perez', email: 'juan.perez@email.com', telefono: '+54 358 555-1234', puntos: 150, fecha_registro: '2026-01-15T12:00:00Z' },
  { id_cliente: 'cli_002', dni_cuit: '27-40283948-4', nombre: 'Maria Laura Rodriguez', email: 'maria.rodriguez@email.com', telefono: '+54 358 444-5678', puntos: 320, fecha_registro: '2026-02-10T14:30:00Z' },
  { id_cliente: 'cli_003', dni_cuit: '30-71649251-4', nombre: 'Colores Pizza S.A.S.', email: 'administracion@pizzeriacolores.com.ar', telefono: '+54 358 412-3456', puntos: 1200, fecha_registro: '2026-03-01T09:00:00Z' }
];
writeCsv('7_clientes.csv', ['id_cliente', 'dni_cuit', 'nombre', 'email', 'telefono', 'puntos', 'fecha_registro'], clientes);

// 5. cierres_caja
const cierres = [
  { id_cierre: 'cie_901', fecha_apertura: '2026-06-11 08:00', fecha_cierre: '2026-06-11 16:00', monto_apertura: 40000, monto_ventas: 185000, monto_real: 225000, diferencia: 0, observaciones: 'Arqueo vespertino cuadrado sin novedades', usuario_cajero: 'Clara Scaglia' },
  { id_cierre: 'cie_902', fecha_apertura: '2026-06-11 16:30', fecha_cierre: '2026-06-11 23:55', monto_apertura: 50000, monto_ventas: 342000, monto_real: 341500, diferencia: -500, observaciones: 'Faltante minimo de caja chica por cambio', usuario_cajero: 'Mariano Closs' }
];
writeCsv('8_cierres_caja.csv', ['id_cierre', 'fecha_apertura', 'fecha_cierre', 'monto_apertura', 'monto_ventas', 'monto_real', 'diferencia', 'observaciones', 'usuario_cajero'], cierres);

// 6. movimientos_caja_chica
const movsCaja = [
  { id_movimiento: 'mov_101', id_cierre: 'cie_901', tipo: 'ingreso', monto: 10000, concepto: 'Fondo de cambio inicial', fecha: '2026-06-11 08:15' },
  { id_movimiento: 'mov_102', id_cierre: 'cie_901', tipo: 'egreso', monto: 3500, concepto: 'Compra de hielo de urgencia', fecha: '2026-06-11 11:30' }
];
writeCsv('9_movimientos_caja_chica.csv', ['id_movimiento', 'id_cierre', 'tipo', 'monto', 'concepto', 'fecha'], movsCaja);

// 7. facturas
const facturas = [
  { id_factura: 'fac_1001', id_pedido: '1021', numero_factura: 'B-00001-00000042', total: 19360.00, tipo_comprobante: 'Factura B', metodo_pago: 'Efectivo', cuit_cliente: '99-99999999-9', fecha_emision: '2026-07-27T13:00:00Z', afip_cae: '74012345678901', afip_vto: '2026-08-06', afip_qr: '', afip_resultado: 'A' }
];
writeCsv('10_facturas.csv', ['id_factura', 'id_pedido', 'numero_factura', 'total', 'tipo_comprobante', 'metodo_pago', 'cuit_cliente', 'fecha_emision', 'afip_cae', 'afip_vto', 'afip_qr', 'afip_resultado'], facturas);

// 8. pagos
const pagos = [
  { id_pago: 'pag_2001', id_factura: 'fac_1001', monto: 19360.00, metodo: 'Efectivo', fecha: '2026-07-27T13:00:00Z' }
];
writeCsv('11_pagos.csv', ['id_pago', 'id_factura', 'monto', 'metodo', 'fecha'], pagos);

// 9. registro_asistencia
const asistencias = [
  { id: 'asist_1', id_usuario: 4, nombre_empleado: 'Enzo Fernández', tipo: 'ingreso', fecha_hora: '2026-10-16 11:45:00', latitud: -33.1234, longitud: -64.3456, precision: 12, dispositivo: 'Android Mobile', direccion: 'Alvear 1362, Río Cuarto' },
  { id: 'asist_2', id_usuario: 5, nombre_empleado: 'Micaela Gómez', tipo: 'ingreso', fecha_hora: '2026-10-16 11:50:00', latitud: -33.1234, longitud: -64.3456, precision: 10, dispositivo: 'iOS Mobile', direccion: 'Alvear 1362, Río Cuarto' }
];
writeCsv('12_registro_asistencia.csv', ['id', 'id_usuario', 'nombre_empleado', 'tipo', 'fecha_hora', 'latitud', 'longitud', 'precision', 'dispositivo', 'direccion'], asistencias);

// 10. auditoria_eventos
const auditoria = [
  { id: 'log_1', tipo: 'sistema', mensaje: 'Inicio de jornada y sincronización de base de datos', timestamp: '2026-10-16T12:00:00Z' },
  { id: 'log_2', tipo: 'pedido_creado', mensaje: 'Comanda #1021 generada para Mesa 2', timestamp: '2026-10-16T12:15:00Z' }
];
writeCsv('13_auditoria_eventos.csv', ['id', 'tipo', 'mensaje', 'timestamp'], auditoria);

// Now load insumos, productos_menu, and recetas_escandallo from initialData.ts
const initialDataPath = path.join(__dirname, '..', 'src', 'data', 'initialData.ts');
const rawTs = fs.readFileSync(initialDataPath, 'utf8');

// Parse INITIAL_INSUMOS
const insumosMatch = rawTs.match(/export const INITIAL_INSUMOS: Insumo\[\] = (\[[\s\S]*?\]);/);
if (insumosMatch) {
  try {
    const insumos = JSON.parse(insumosMatch[1]);
    writeCsv('3_insumos.csv', ['id_insumo', 'nombre', 'stock_actual', 'stock_minimo', 'unidad_medida', 'categoria', 'subcategoria', 'proveedor', 'costo_unitario', 'es_bebida_directa'], insumos);
  } catch (e) {
    console.error('Error parsing insumos:', e);
  }
}

// Parse INITIAL_PRODUCTOS_MENU
const prodMatch = rawTs.match(/export const INITIAL_PRODUCTOS_MENU: ProductoMenu\[\] = (\[[\s\S]*?\]);/);
if (prodMatch) {
  try {
    const prods = JSON.parse(prodMatch[1]);
    writeCsv('1_productos_menu.csv', ['id_producto', 'nombre', 'precio_venta', 'categoria', 'activo', 'imagen', 'descripcion', 'tipo', 'tiempo_preparacion_estimado', 'requiere_cocina', 'pasos_preparacion', 'alergenos', 'consejo_emplatado'], prods);
  } catch (e) {
    console.error('Error parsing prods:', e);
  }
}

// Parse INITIAL_RECETAS_ESCANDALLO
const escMatch = rawTs.match(/export const INITIAL_RECETAS_ESCANDALLO: RecetaEscandallo\[\] = (\[[\s\S]*?\]);/);
if (escMatch) {
  try {
    const esc = JSON.parse(escMatch[1]);
    writeCsv('4_recetas_escandallo.csv', ['id_receta', 'id_producto', 'id_insumo', 'cantidad_a_descontar', 'unidad_medida', 'rendimiento'], esc);
  } catch (e) {
    console.error('Error parsing recetas:', e);
  }
}

console.log('✅ ALL CSVs GENERATED SUCCESSFULLY IN csv_sheets/');
