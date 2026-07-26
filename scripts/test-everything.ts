import { createClient } from '@supabase/supabase-js';

const url = 'https://msmaksbtetcmoaiyywto.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbWFrc2J0ZXRjbW9haXl5d3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDA5ODgsImV4cCI6MjA4OTIxNjk4OH0.Qvw26EVpCyyYS631WZ3T6LN3x__4xFliYvfSjZJCmsc';

const supabase = createClient(url, key);

async function runComprehensiveAudit() {
  console.log('====================================================');
  console.log('      AUDITORÍA Y TESTEO COMPLETO DEL SISTEMA      ');
  console.log('====================================================\n');

  // 1. Verificación de Categorías en DB
  const { data: categorias, error: errCat } = await supabase.from('categorias').select('*').order('orden');
  if (errCat) {
    console.error('❌ Error al consultar categorías:', errCat.message);
  } else {
    console.log(`✅ [Categorías DB] Total: ${categorias?.length || 0}`);
    console.table(categorias?.map(c => ({ ID: c.id, Nombre: c.nombre, Slug: c.slug, Orden: c.orden, Activa: c.activa })));
  }

  // 2. Verificación de Productos en DB
  const { data: productos, error: errProd } = await supabase.from('productos_menu').select('*');
  if (errProd) {
    console.error('❌ Error al consultar productos_menu:', errProd.message);
  } else {
    const activos = productos?.filter(p => p.activo !== false) || [];
    console.log(`\n✅ [Productos DB] Total en BD: ${productos?.length || 0} | Activos: ${activos.length}`);
  }

  // 3. Verificación de Insumos en DB
  const { data: insumos, error: errIns } = await supabase.from('insumos').select('*');
  if (errIns) {
    console.error('❌ Error al consultar insumos:', errIns.message);
  } else {
    console.log(`\n✅ [Insumos DB] Total registrado: ${insumos?.length || 0}`);
  }

  // 4. Verificación de Recetas / Escandallos (BOM)
  const { data: recetas, error: errRec } = await supabase.from('recetas_escandallo').select('*');
  if (errRec) {
    console.error('❌ Error al consultar recetas_escandallo:', errRec.message);
  } else {
    console.log(`\n✅ [Escandallos / Recetas DB] Total relaciones BOM: ${recetas?.length || 0}`);
  }

  // 5. Test de Algoritmo de Normalización de Categorías
  console.log('\n----------------------------------------------------');
  console.log('  TEST DE NORMALIZACIÓN DE CATEGORÍAS EN FRONTEND   ');
  console.log('----------------------------------------------------');

  const activeCategories = categorias?.filter(c => c.activa) || [];
  const hasSingleBebidasTab = activeCategories.some(c => c.slug === 'bebidas');

  console.log(`* Pestañas activas detectadas: [${activeCategories.map(c => c.slug).join(', ')}]`);
  console.log(`* ¿Existe pestaña unificada 'bebidas'?: ${hasSingleBebidasTab ? 'SÍ' : 'NO'}`);

  const normalizeCategorySlug = (categoria: string): string => {
    const norm = (categoria || '').toLowerCase().trim()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (norm.includes('calzone') || norm.includes('empanada')) {
      return 'calzones-y-empanadas';
    }
    if (norm.includes('pizza')) {
      return 'pizzas';
    }
    if (norm.includes('con-alcohol') || norm.includes('c-a') || norm.includes('cerveza') || norm.includes('vino') || norm.includes('bodega')) {
      return hasSingleBebidasTab ? 'bebidas' : 'bebidas-con-alcohol';
    }
    if (norm.includes('sin-alcohol') || norm.includes('s-a') || norm.includes('gaseosa') || norm.includes('agua') || norm.includes('jugo')) {
      return hasSingleBebidasTab ? 'bebidas' : 'bebidas-sin-alcohol';
    }
    if (norm.includes('bebida')) {
      return hasSingleBebidasTab ? 'bebidas' : 'bebidas-sin-alcohol';
    }
    if (norm.includes('postre') || norm.includes('dulce') || norm.includes('helado')) {
      return 'postres';
    }
    if (norm.includes('sandwich') || norm.includes('baguette') || norm.includes('lomo') || norm.includes('focaccia') || norm.includes('panuzzo')) {
      return 'sandwiches';
    }
    return norm;
  };

  const conteoPorPestana: Record<string, number> = {};
  const productosSinPestana: string[] = [];

  (productos || []).forEach(p => {
    if (p.activo === false) return;
    const slug = normalizeCategorySlug(p.categoria);
    const tienePestana = activeCategories.some(c => c.slug === slug);

    conteoPorPestana[slug] = (conteoPorPestana[slug] || 0) + 1;
    if (!tienePestana) {
      productosSinPestana.push(`${p.nombre} (Categoría DB: "${p.categoria}" -> Slug: "${slug}")`);
    }
  });

  console.log('\n📊 Conteo de Productos por Slug calculado:');
  console.table(Object.entries(conteoPorPestana).map(([slug, count]) => {
    const pestana = activeCategories.find(c => c.slug === slug);
    return {
      Slug: slug,
      NombrePestana: pestana ? pestana.nombre : '❌ SIN PESTAÑA EN UI',
      CantidadProductos: count,
      VisibleEnUI: pestana ? '✅ SÍ' : '⚠️ Solo en "Todos"'
    };
  }));

  if (productosSinPestana.length > 0) {
    console.log(`\n⚠️ Hay ${productosSinPestana.length} productos cuyas categorías no coinciden con ninguna pestaña específica y se mostrarán únicamente en "Todos":`);
    productosSinPestana.forEach(item => console.log(`   - ${item}`));
  } else {
    console.log('\n✅ Todos los productos coinciden con una pestaña activa en el menú.');
  }

  // 6. Test de Integridad de Bebidas
  console.log('\n----------------------------------------------------');
  console.log('            DETALLE DE PRODUCTOS BEBIDAS            ');
  console.log('----------------------------------------------------');
  const bebidasProds = (productos || []).filter(p => {
    const slug = normalizeCategorySlug(p.categoria);
    return slug === 'bebidas' || slug === 'bebidas-con-alcohol' || slug === 'bebidas-sin-alcohol';
  });
  console.log(`Total Bebidas encontradas en DB: ${bebidasProds.length}`);
  console.table(bebidasProds.map(b => ({
    ID: b.id_producto,
    Nombre: b.nombre,
    CategoriaDB: b.categoria,
    SlugCalculado: normalizeCategorySlug(b.categoria),
    Precio: `$${b.precio_venta}`,
    Activo: b.activo
  })));

  console.log('\n====================================================');
  console.log('         FIN DEL TESTEO COMPLETO Y AUDITORÍA        ');
  console.log('====================================================');
}

runComprehensiveAudit();
