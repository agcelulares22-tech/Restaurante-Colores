const { createClient } = require('@supabase/supabase-js');

const url = 'https://rasisomlemuaxpxlzqsg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2lzb21sZW11YXhweGx6cXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MTE5ODcsImV4cCI6MjEwNzk4Nzk4N30.ZhCJsDu-SGZxwIOM0pwL2mZotsBjwwJuId0uD8HlG8M';

const supabase = createClient(url, key);

const operationalTables = [
  'usuarios',
  'mesas',
  'pedidos_cabecera',
  'pedido_detalle',
  'delivery',
  'delivery_zonas',
  'pedidos_delivery_rapido',
  'zonas_envio',
  'calles_envio',
  'configuracion',
  'movimientos_inventario',
  'mermas'
];

async function check() {
  console.log('Verificando tablas operativas en el nuevo Supabase:\n');
  let ok = 0;
  let missing = 0;

  for (const t of operationalTables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact' }).limit(1);
    if (error) {
      console.log(`❌ ${t.padEnd(25)} -> ${error.message}`);
      missing++;
    } else {
      console.log(`✅ ${t.padEnd(25)} -> Operativa (${count ?? 0} registros)`);
      ok++;
    }
  }

  console.log(`\nResultado: ${ok} operativas / ${missing} faltantes de ${operationalTables.length}`);
}

check();
