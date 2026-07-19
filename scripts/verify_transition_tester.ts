import { createClientPedidoId } from '../src/lib/pedidoIds';
import { createScriptSupabaseClient } from './supabase-config';

const { supabase } = createScriptSupabaseClient();

async function runTester() {
  console.log('====================================================');
  console.log('       🍕 TESTER COMPLETO DE TRANSICIÓN DE ESTADOS   ');
  console.log('====================================================');

  // 1. Generar un ID de comanda válido usando la lógica del cliente
  const testOrderId = createClientPedidoId([]);
  console.log(`[INFO] ID de pedido generado para la prueba: ${testOrderId}`);

  try {
    // 2. Crear un pedido de prueba en Mesa 3
    console.log('[PASO 1] Insertando pedido de prueba para Mesa 3...');
    const nowStr = new Date().toISOString();
    const newOrder = {
      id_pedido: testOrderId,
      id_mesa: 3,
      numero_mesa: 'Mesa 3',
      mozo: 'Sofía',
      estado_comanda: 'pendiente',
      fecha_hora: nowStr,
      minutos_transcurridos: 0,
      origen: 'Mozo',
      stock_descontado: false,
      items: JSON.stringify([
        {
          id_producto: 'prod_pizz_napolitana_grande',
          nombre: 'Pizza Napolitana Grande',
          cantidad: 1,
          categoria: 'Pizzas',
          precio_unitario: 15000
        }
      ])
    };

    const { error: insertError } = await supabase
      .from('pedidos_cabecera')
      .insert(newOrder);

    if (insertError) {
      throw new Error(`Fallo al insertar la comanda: ${insertError.message}`);
    }
    console.log('✅ Pedido insertado correctamente en estado: "pendiente".');

    // 3. Verificar estado en base de datos
    console.log('[PASO 2] Verificando estado inicial en base de datos...');
    const { data: fetch1, error: fetch1Err } = await supabase
      .from('pedidos_cabecera')
      .select('estado_comanda')
      .eq('id_pedido', testOrderId)
      .single();

    if (fetch1Err || !fetch1) {
      throw new Error(`Fallo al consultar el estado inicial: ${fetch1Err?.message}`);
    }
    console.log(`✅ Estado inicial verificado en DB: "${fetch1.estado_comanda}"`);
    if (fetch1.estado_comanda !== 'pendiente') {
      throw new Error(`El estado inicial debería ser "pendiente", pero se obtuvo "${fetch1.estado_comanda}"`);
    }

    // 4. Simular transición a "en_cocina" (preparación)
    console.log('[PASO 3] Simulando transición a "en_cocina" (Iniciar Horno)...');
    const { data: update1, error: update1Err } = await supabase
      .from('pedidos_cabecera')
      .update({
        estado_comanda: 'en_cocina',
        fecha_inicio_cocina: new Date().toISOString(),
        stock_descontado: true
      })
      .eq('id_pedido', testOrderId)
      .select();

    if (update1Err || !update1 || update1.length === 0) {
      throw new Error(`Fallo al actualizar a en_cocina: ${update1Err?.message}`);
    }
    console.log('✅ Actualización a "en_cocina" exitosa en Supabase.');

    // 5. Verificar persistencia de "en_cocina"
    console.log('[PASO 4] Verificando persistencia de "en_cocina" en DB...');
    const { data: fetch2, error: fetch2Err } = await supabase
      .from('pedidos_cabecera')
      .select('estado_comanda, stock_descontado')
      .eq('id_pedido', testOrderId)
      .single();

    if (fetch2Err || !fetch2) {
      throw new Error(`Fallo al verificar persistencia: ${fetch2Err?.message}`);
    }
    console.log(`✅ Estado persistido verificado en DB: "${fetch2.estado_comanda}" (Stock Descontado: ${fetch2.stock_descontado})`);
    if (fetch2.estado_comanda !== 'en_cocina') {
      throw new Error(`El estado persistido debería ser "en_cocina", pero se obtuvo "${fetch2.estado_comanda}"`);
    }

    // 6. Simular transición a "listo" (terminado)
    console.log('[PASO 5] Simulando transición a "listo" (Terminado)...');
    const { data: update2, error: update2Err } = await supabase
      .from('pedidos_cabecera')
      .update({
        estado_comanda: 'listo',
        fecha_listo: new Date().toISOString()
      })
      .eq('id_pedido', testOrderId)
      .select();

    if (update2Err || !update2 || update2.length === 0) {
      throw new Error(`Fallo al actualizar a listo: ${update2Err?.message}`);
    }
    console.log('✅ Actualización a "listo" exitosa en Supabase.');

    // 7. Verificar persistencia de "listo"
    const { data: fetch3, error: fetch3Err } = await supabase
      .from('pedidos_cabecera')
      .select('estado_comanda')
      .eq('id_pedido', testOrderId)
      .single();

    if (fetch3Err || !fetch3) {
      throw new Error(`Fallo al verificar el estado listo: ${fetch3Err?.message}`);
    }
    console.log(`✅ Estado final persistido verificado en DB: "${fetch3.estado_comanda}"`);
    if (fetch3.estado_comanda !== 'listo') {
      throw new Error(`El estado final debería ser "listo", pero se obtuvo "${fetch3.estado_comanda}"`);
    }

    // 8. Limpiar datos de prueba
    console.log('[PASO 6] Limpiando datos de prueba...');
    const { error: deleteError } = await supabase
      .from('pedidos_cabecera')
      .delete()
      .eq('id_pedido', testOrderId);

    if (deleteError) {
      console.warn(`[WARN] No se pudo eliminar el pedido de prueba: ${deleteError.message}`);
    } else {
      console.log('✅ Limpieza de datos completada con éxito.');
    }

    console.log('\n====================================================');
    console.log(' 🎉 RESULTADO DEL TEST: ¡EXITOSO!                     ');
    console.log(' Todas las transiciones de estado se persisten      ');
    console.log(' correctamente en Supabase usando identificadores   ');
    console.log(' seguros sin truncamientos ni regresiones.          ');
    console.log('====================================================');

  } catch (error: any) {
    console.error('\n❌ ERROR DURANTE LA EJECUCIÓN DEL TESTER:');
    console.error(error.message || error);
    
    // Intentar limpiar en caso de error
    await supabase.from('pedidos_cabecera').delete().eq('id_pedido', testOrderId);
  }
}

runTester();
