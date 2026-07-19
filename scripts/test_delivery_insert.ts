import { createScriptSupabaseClient } from './supabase-config';

const { supabase } = createScriptSupabaseClient();

async function testInsert() {
  console.log('--- Testing Delivery Insertion with correct "items" column ---');
  
  // 1. Try inserting with id_mesa = 999
  const orderId = Date.now() + Math.floor(Math.random() * 100);
  const testOrderWith999 = {
    id_pedido: orderId,
    id_mesa: 999, // Virtual delivery table ID
    numero_mesa: 'DELIVERY: TEST 999',
    mozo: 'Super Admin',
    estado_comanda: 'pendiente',
    origen: 'Mozo',
    minutos_transcurridos: 0,
    stock_descontado: false,
    items: JSON.stringify([{ id_producto: 'prod_1', nombre: 'Test Pizza', cantidad: 1 }])
  };
  
  console.log(`Inserting with id_mesa = 999...`);
  const { error: err999 } = await supabase
    .from('pedidos_cabecera')
    .insert(testOrderWith999);
    
  if (err999) {
    console.log(`❌ Failed with 999: ${err999.message} (Code: ${err999.code})`);
  } else {
    console.log(`✅ Success with 999! (Mesa 999 exists in DB?)`);
    // Cleanup
    await supabase.from('pedidos_cabecera').delete().eq('id_pedido', orderId);
  }
  
  // 2. Try inserting with id_mesa = null
  const orderIdNull = orderId + 1;
  const testOrderWithNull = {
    id_pedido: orderIdNull,
    id_mesa: null, // No mesa ID (since it's a delivery)
    numero_mesa: 'DELIVERY: TEST NULL',
    mozo: 'Super Admin',
    estado_comanda: 'pendiente',
    origen: 'Mozo',
    minutos_transcurridos: 0,
    stock_descontado: false,
    items: JSON.stringify([{ id_producto: 'prod_1', nombre: 'Test Pizza', cantidad: 1 }])
  };
  
  console.log(`\nInserting with id_mesa = null...`);
  const { error: errNull } = await supabase
    .from('pedidos_cabecera')
    .insert(testOrderWithNull);
    
  if (errNull) {
    console.log(`❌ Failed with null: ${errNull.message} (Code: ${errNull.code})`);
  } else {
    console.log(`✅ Success with null!`);
    // Cleanup
    await supabase.from('pedidos_cabecera').delete().eq('id_pedido', orderIdNull);
  }
}

testInsert();
