import { createScriptSupabaseClient } from './supabase-config';

const { supabase } = createScriptSupabaseClient();

async function verify() {
  console.log('--- Verifying Update Persistence ---');
  
  // 1. Fetch one order to test
  const { data: orders, error: fetchErr } = await supabase
    .from('pedidos_cabecera')
    .select('id_pedido, estado_comanda')
    .limit(1);
    
  if (fetchErr || !orders || orders.length === 0) {
    console.error('Error fetching order:', fetchErr);
    return;
  }
  
  const order = orders[0];
  const originalState = order.estado_comanda;
  console.log(`Order ID: ${order.id_pedido}, Current State in DB: "${originalState}"`);
  
  const statesToTest = ['pendiente', 'en_cocina', 'en preparacion', 'listo', 'entregado', 'entregado_cobrado', 'cancelado'];
  
  for (const testState of statesToTest) {
    console.log(`\nAttempting update to: "${testState}"...`);
    const { error, status } = await supabase
      .from('pedidos_cabecera')
      .update({ estado_comanda: testState })
      .eq('id_pedido', order.id_pedido);
      
    if (error) {
      console.error(`❌ Failed for "${testState}": ${error.message} (Code: ${error.code})`);
    } else {
      console.log(`✅ Success for "${testState}" (Status: ${status})`);
    }
  }
  
  // Restore original
  console.log(`\nRestoring original state: "${originalState}"...`);
  await supabase
    .from('pedidos_cabecera')
    .update({ estado_comanda: originalState })
    .eq('id_pedido', order.id_pedido);
}

verify();
