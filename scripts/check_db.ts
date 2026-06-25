import { createClient } from '@supabase/supabase-js';

const url = 'https://msmaksbtetcmoaiyywto.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbWFrc2J0ZXRjbW9haXl5d3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDA5ODgsImV4cCI6MjA4OTIxNjk4OH0.Qvw26EVpCyyYS631WZ3T6LN3x__4xFliYvfSjZJCmsc';

const supabase = createClient(url, key);

async function checkSchema() {
  console.log('--- Probing Database Metadata ---');
  
  // Query column info
  const { data: columnInfo, error: colError } = await supabase
    .rpc('execute_sql_query', { 
      sql_query: `
        SELECT column_name, data_type, udt_name, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name = 'pedidos_cabecera' AND column_name = 'estado_comanda'
      `
    });

  if (colError) {
    // If RPC doesn't exist, we will try another way or try to list constraints/types
    console.log('RPC execute_sql_query not available directly, trying general query...');
  } else {
    console.log('Column metadata:', JSON.stringify(columnInfo, null, 2));
  }

  // Let's run a query to fetch table constraints
  const { data: constraints, error: constError } = await supabase
    .rpc('execute_sql_query', { 
      sql_query: `
        SELECT conname, pg_get_constraintdef(c.oid) 
        FROM pg_constraint c 
        WHERE conrelid = 'pedidos_cabecera'::regclass
      `
    });

  if (!constError) {
    console.log('Table constraints:', JSON.stringify(constraints, null, 2));
  } else {
    console.log('Failed to fetch constraints via RPC:', constError.message);
  }

  // Let's also check if we can query the pg_type for enums
  const { data: enumTypes, error: enumError } = await supabase
    .rpc('execute_sql_query', {
      sql_query: `
        SELECT t.typname, e.enumlabel
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid
        ORDER BY t.typname, e.enumsortorder
      `
    });
    
  if (!enumError) {
    console.log('Enum types in database:', JSON.stringify(enumTypes, null, 2));
  }
}

// Since RPC might not exist, let's write a generic probe that queries via REST API
// Wait, can we fetch the API schema/swagger?
// Yes, PostgREST exposes the OpenAPI definition at the root URL
async function fetchOpenApi() {
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const schema = await res.json();
    console.log('\n--- OpenAPI / PostgREST Schema ---');
    const tableInfo = schema.definitions?.pedidos_cabecera;
    if (tableInfo) {
      console.log('pedidos_cabecera properties:');
      console.log(JSON.stringify(tableInfo.properties?.estado_comanda, null, 2));
    } else {
      console.log('pedidos_cabecera definition not found in OpenAPI doc.');
    }
  } catch (err: any) {
    console.error('Error fetching OpenAPI schema:', err.message);
  }
}

async function run() {
  await checkSchema();
  await fetchOpenApi();
}

run();
