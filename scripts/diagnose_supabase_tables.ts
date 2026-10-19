import { createClient } from '@supabase/supabase-js';

const url = 'https://rasisomlemuaxpxlzqsg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2lzb21sZW11YXhweGx6cXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MTE5ODcsImV4cCI6MjEwNzk4Nzk4N30.ZhCJsDu-SGZxwIOM0pwL2mZotsBjwwJuId0uD8HlG8M';

const supabase = createClient(url, key);

const tables = [
  'usuarios',
  'mesas',
  'insumos',
  'productos_menu',
  'recetas',
  'pedidos_cabecera',
  'pedido_detalle',
  'cierres_caja',
  'facturas',
  'mermas',
  'auditoria',
  'configuracion',
  'zonas_envio',
  'calles_envio',
  'pedidos_delivery_rapido'
];

async function diagnoseTables() {
  console.log('================================================================');
  console.log('      🔍 DIAGNÓSTICO COMPLETO DE CONECTIVIDAD TABLAS SUPABASE    ');
  console.log('================================================================');
  console.log(`URL de Supabase: ${url}\n`);

  let operationalCount = 0;
  let failedCount = 0;

  for (const table of tables) {
    try {
      // Intentamos hacer un conteo rápido de registros
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        // En caso de que falle, lo reportamos con el error exacto
        console.log(`❌ Table [${table.padEnd(25)}]: ERROR - ${error.message} (Código: ${error.code})`);
        failedCount++;
      } else {
        console.log(`✅ Table [${table.padEnd(25)}]: OPERATIVA - (${count} registros)`);
        operationalCount++;
      }
    } catch (err: any) {
      console.log(`❌ Table [${table.padEnd(25)}]: FALLO CRÍTICO DE CONEXIÓN - ${err.message || err}`);
      failedCount++;
    }
  }

  console.log('\n================================================================');
  console.log('                     📊 RESUMEN DEL DIAGNÓSTICO                 ');
  console.log('================================================================');
  console.log(`Total de Tablas Analizadas : ${tables.length}`);
  console.log(`Tablas Activas/Operativas  : ${operationalCount} / ${tables.length}`);
  console.log(`Tablas con Error           : ${failedCount} / ${tables.length}`);
  
  if (failedCount === 0) {
    console.log('\n 🎉 ¡TODAS LAS TABLAS ESTÁN CONECTADAS Y FUNCIONANDO CORRECTAMENTE! ');
  } else {
    console.log('\n ⚠️ SE DETECTARON ERRORES EN ALGUNAS TABLAS. REVISAR MIGRACIONES O RLS. ');
  }
  console.log('================================================================');
}

diagnoseTables();
