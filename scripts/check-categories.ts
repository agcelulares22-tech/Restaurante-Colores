import { createClient } from '@supabase/supabase-js';

const url = 'https://msmaksbtetcmoaiyywto.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbWFrc2J0ZXRjbW9haXl5d3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDA5ODgsImV4cCI6MjA4OTIxNjk4OH0.Qvw26EVpCyyYS631WZ3T6LN3x__4xFliYvfSjZJCmsc';

const supabase = createClient(url, key);

async function check() {
  const { data: products } = await supabase.from('productos_menu').select('*');
  const { data: categories } = await supabase.from('categorias').select('*').eq('activa', true);

  console.log('Categories loaded:', categories?.map(c => ({ nombre: c.nombre, slug: c.slug })));

  const hasSingleBebidasTab = categories?.some(c => c.slug === 'bebidas');
  console.log('hasSingleBebidasTab:', hasSingleBebidasTab);

  const normalizeCategorySlug = (categoria: string): string => {
    const norm = categoria.toLowerCase().trim()
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
    if (norm.includes('con-alcohol') || norm.includes('cerveza') || norm.includes('vino') || norm.includes('bodega')) {
      return hasSingleBebidasTab ? 'bebidas' : 'bebidas-con-alcohol';
    }
    if (norm.includes('sin-alcohol') || norm.includes('bebida') || norm.includes('gaseosa') || norm.includes('agua') || norm.includes('jugo')) {
      return hasSingleBebidasTab ? 'bebidas' : 'bebidas-sin-alcohol';
    }
    if (norm.includes('postre') || norm.includes('dulce') || norm.includes('helado')) {
      return 'postres';
    }
    if (norm.includes('sandwich') || norm.includes('baguette') || norm.includes('lomo')) {
      return 'sandwiches';
    }
    return norm;
  };

  const counts: Record<string, number> = {};
  const mappings: Record<string, string[]> = {};

  products?.forEach(p => {
    if (!p.activo) return;
    const slug = normalizeCategorySlug(p.categoria);
    counts[slug] = (counts[slug] || 0) + 1;
    if (!mappings[slug]) mappings[slug] = [];
    mappings[slug].push(`${p.nombre} (DB category: ${p.categoria})`);
  });

  console.log('Calculated counts per slug:', counts);
  console.log('Mapped to postres:', mappings['postres']);
  console.log('Mapped to calzones-y-empanadas:', mappings['calzones-y-empanadas']);
  console.log('Mapped to pizzas:', mappings['pizzas']);
  console.log('Mapped to sandwiches:', mappings['sandwiches']);
  console.log('Mapped to bebidas:', mappings['bebidas']);
  console.log('Mapped to bebidas-sin-alcohol:', mappings['bebidas-sin-alcohol']);
  console.log('Mapped to bebidas-con-alcohol:', mappings['bebidas-con-alcohol']);
  console.log('Mapped to others:', Object.keys(mappings).filter(k => !['postres', 'calzones-y-empanadas', 'pizzas', 'sandwiches', 'bebidas', 'bebidas-sin-alcohol', 'bebidas-con-alcohol'].includes(k)).map(k => `${k}: ${mappings[k].length} items`));
}

check();
