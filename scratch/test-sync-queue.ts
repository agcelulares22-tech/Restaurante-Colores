import { createClient } from '@supabase/supabase-js';

const url = 'https://msmaksbtetcmoaiyywto.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbWFrc2J0ZXRjbW9haXl5d3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDA5ODgsImV4cCI6MjA4OTIxNjk4OH0.Qvw26EVpCyyYS631WZ3T6LN3x__4xFliYvfSjZJCmsc';

const supabase = createClient(url, key);

async function main() {
  const numericId = Date.now(); // e.g. 1785111200000
  console.log('Testing numeric ID for id_pedido:', numericId);

  const { data, error } = await supabase
    .from('pedidos_cabecera')
    .upsert([{
      id_pedido: numericId,
      numero_mesa: 'Mesa 3',
      mozo: 'Mozo',
      estado_comanda: 'entregado_cobrado',
      items: '[]',
      fecha_hora: new Date().toISOString()
    }])
    .select();

  console.log('Numeric id_pedido upsert result:', { data, error });

  if (data && data.length > 0) {
    const { error: delErr } = await supabase.from('pedidos_cabecera').delete().eq('id_pedido', numericId);
    console.log('Clean test numeric row:', delErr);
  }
}

main();
