import { createClient } from '@supabase/supabase-js';

const url = 'https://msmaksbtetcmoaiyywto.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbWFrc2J0ZXRjbW9haXl5d3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDA5ODgsImV4cCI6MjA4OTIxNjk4OH0.Qvw26EVpCyyYS631WZ3T6LN3x__4xFliYvfSjZJCmsc';

const supabase = createClient(url, key);

async function run() {
  console.log('--- Insertando Categorías en Supabase con UUIDs válidos ---');

  const nuevasCategorias = [
    { id: '11111111-1111-4111-8111-111111111111', nombre: 'Bebidas c/a', slug: 'bebidas-con-alcohol', orden: 1, activa: true, icono: 'Wine' },
    { id: '22222222-2222-4222-8222-222222222222', nombre: 'Bebidas s/a', slug: 'bebidas-sin-alcohol', orden: 2, activa: true, icono: 'Coffee' },
    { id: '98f5653e-b2a4-4ed3-b3f0-cc22e4202280', nombre: 'Calzones y empanadas', slug: 'calzones-y-empanadas', orden: 3, activa: true, icono: 'UtensilsCrossed' },
    { id: 'ff769e31-34fb-4cd8-9919-19cdbd5207f4', nombre: 'Pizzas', slug: 'pizzas', orden: 4, activa: true, icono: 'Pizza' },
    { id: '8570ee6b-4535-4e46-af4f-17de08bde47b', nombre: 'Postres', slug: 'postres', orden: 5, activa: true, icono: 'Coffee' },
    { id: 'd9ff4750-2e14-42fb-ae0f-8e37f59c5865', nombre: 'Sandwiches', slug: 'sandwiches', orden: 6, activa: true, icono: 'UtensilsCrossed' }
  ];

  const { error } = await supabase.from('categorias').upsert(nuevasCategorias);
  if (error) {
    console.error('❌ Error al upsertar categorías:', error.message);
  } else {
    console.log('✅ Categorías guardadas correctamente.');
  }

  const { data: catsFinal } = await supabase.from('categorias').select('*').order('orden');
  console.log('\nCategorías finales en Supabase:');
  console.table(catsFinal);
}

run();
