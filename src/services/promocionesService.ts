import { getActiveSupabaseClient } from '../lib/supabaseClient';

export interface Promocion {
  id_promo: string;
  nombre: string;
  descuento_porcentaje: number;
  tipo: 'happy_hour' | 'combo' | 'descuento_directo';
  dias_vigentes: string;
  activo: boolean;
  descripcion: string;
  fecha_vencimiento?: string;
  imagen_url?: string;
}

const CACHE_KEY = 'colores_pizzeria_cache_promociones';

const mapRowToPromo = (p: any): Promocion => {
  const localVencimientos = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('local_promos_vencimientos') || '{}')
    : {};

  return {
    id_promo: String(p.id_promo),
    nombre: p.nombre || '',
    descuento_porcentaje: p.descuento_porcentaje ?? p.descuento ?? 0,
    tipo: p.tipo || 'descuento_directo',
    dias_vigentes: (p.dias_vigentes !== null && p.dias_vigentes !== undefined && p.dias_vigentes !== '')
      ? p.dias_vigentes
      : ((p.vigencia !== null && p.vigencia !== undefined && p.vigencia !== '') ? p.vigencia : 'Todos los días'),
    activo: p.activo !== undefined ? Boolean(p.activo) : (p.activa !== undefined ? Boolean(p.activa) : true),
    descripcion: p.descripcion || '',
    fecha_vencimiento: p.fecha_vencimiento || p.vencimiento || localVencimientos[p.id_promo] || undefined,
    imagen_url: p.imagen_url || ''
  };
};

export const promocionesService = {
  async list(): Promise<Promocion[]> {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
    const supabase = getActiveSupabaseClient();

    if (cached) {
      if (supabase) {
        setTimeout(async () => {
          try {
            const { data, error } = await supabase.from('promociones').select('*').order('nombre', { ascending: true });
            if (!error && data && data.length > 0) {
              localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            }
          } catch (e) {
            console.warn('Background promociones cache refresh failed:', e);
          }
        }, 500);
      }

      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(mapRowToPromo);
        }
      } catch (e) {
        console.warn('Failed parsing promociones cache:', e);
      }
    }

    if (!supabase) return [];

    const { data, error } = await supabase.from('promociones').select('*').order('nombre', { ascending: true });
    if (error) {
      console.error('Error fetching promociones:', error);
      throw error;
    }

    if (typeof localStorage !== 'undefined' && data) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {}
    }

    return (data || []).map(mapRowToPromo);
  },

  async create(promo: Promocion): Promise<Promocion> {
    const supabase = getActiveSupabaseClient();
    const dbPayload: any = {
      id_promo: promo.id_promo,
      nombre: promo.nombre,
      descuento: promo.descuento_porcentaje,
      descuento_porcentaje: promo.descuento_porcentaje,
      tipo: promo.tipo || 'descuento_directo',
      activa: promo.activo,
      activo: promo.activo,
      descripcion: promo.descripcion,
      imagen_url: promo.imagen_url || null,
      vigencia: promo.dias_vigentes,
      dias_vigentes: promo.dias_vigentes
    };
    if (promo.fecha_vencimiento) {
      dbPayload.fecha_vencimiento = promo.fecha_vencimiento;
    }

    try {
      const { data, error } = await supabase.from('promociones').insert([dbPayload]).select().single();
      if (error) throw error;
      if (typeof localStorage !== 'undefined') localStorage.removeItem(CACHE_KEY);
      return mapRowToPromo(data);
    } catch (err) {
      console.warn("Failed inserting with fecha_vencimiento, retrying without it:", err);
      delete dbPayload.fecha_vencimiento;
      const { data, error } = await supabase.from('promociones').insert([dbPayload]).select().single();
      if (error) throw error;
      
      const localVencimientos = JSON.parse(localStorage.getItem('local_promos_vencimientos') || '{}');
      localVencimientos[promo.id_promo] = promo.fecha_vencimiento;
      localStorage.setItem('local_promos_vencimientos', JSON.stringify(localVencimientos));
      if (typeof localStorage !== 'undefined') localStorage.removeItem(CACHE_KEY);

      return mapRowToPromo({ ...data, fecha_vencimiento: promo.fecha_vencimiento });
    }
  },

  async update(id: string, fields: Partial<Promocion>): Promise<void> {
    const supabase = getActiveSupabaseClient();
    const dbPayload: any = {};
    if (fields.nombre !== undefined) dbPayload.nombre = fields.nombre;
    if (fields.descuento_porcentaje !== undefined) {
      dbPayload.descuento = fields.descuento_porcentaje;
      dbPayload.descuento_porcentaje = fields.descuento_porcentaje;
    }
    if (fields.tipo !== undefined) dbPayload.tipo = fields.tipo;
    if (fields.activo !== undefined) {
      dbPayload.activa = fields.activo;
      dbPayload.activo = fields.activo;
    }
    if (fields.descripcion !== undefined) dbPayload.descripcion = fields.descripcion;
    if (fields.imagen_url !== undefined) dbPayload.imagen_url = fields.imagen_url;
    if (fields.dias_vigentes !== undefined) {
      dbPayload.vigencia = fields.dias_vigentes;
      dbPayload.dias_vigentes = fields.dias_vigentes;
    }
    if (fields.fecha_vencimiento !== undefined) {
      dbPayload.fecha_vencimiento = fields.fecha_vencimiento;
      const localVencimientos = JSON.parse(localStorage.getItem('local_promos_vencimientos') || '{}');
      localVencimientos[id] = fields.fecha_vencimiento;
      localStorage.setItem('local_promos_vencimientos', JSON.stringify(localVencimientos));
    }

    if (typeof localStorage !== 'undefined') localStorage.removeItem(CACHE_KEY);

    try {
      const { error } = await supabase.from('promociones').update(dbPayload).eq('id_promo', id);
      if (error) throw error;
    } catch (err) {
      console.warn("Failed updating with fecha_vencimiento, retrying without it:", err);
      delete dbPayload.fecha_vencimiento;
      const { error } = await supabase.from('promociones').update(dbPayload).eq('id_promo', id);
      if (error) throw error;
    }
  },

  async upsert(promos: Promocion[]): Promise<void> {
    const supabase = getActiveSupabaseClient();
    const localVencimientos = JSON.parse(localStorage.getItem('local_promos_vencimientos') || '{}');
    promos.forEach(p => {
      if (p.fecha_vencimiento) {
        localVencimientos[p.id_promo] = p.fecha_vencimiento;
      }
    });
    localStorage.setItem('local_promos_vencimientos', JSON.stringify(localVencimientos));
    if (typeof localStorage !== 'undefined') localStorage.removeItem(CACHE_KEY);

    const dbPayloads = promos.map(p => {
      const payload: any = {
        id_promo: p.id_promo,
        nombre: p.nombre,
        descuento: p.descuento_porcentaje,
        descuento_porcentaje: p.descuento_porcentaje,
        tipo: p.tipo || 'descuento_directo',
        activa: p.activo,
        activo: p.activo,
        descripcion: p.descripcion,
        imagen_url: p.imagen_url || null,
        vigencia: p.dias_vigentes,
        dias_vigentes: p.dias_vigentes
      };
      if (p.fecha_vencimiento) {
        payload.fecha_vencimiento = p.fecha_vencimiento;
      }
      return payload;
    });

    try {
      const { error } = await supabase.from('promociones').upsert(dbPayloads);
      if (error) throw error;
    } catch (err) {
      console.warn("Failed upserting with fecha_vencimiento, retrying without it:", err);
      const cleanPayloads = dbPayloads.map(p => {
        const copy = { ...p };
        delete copy.fecha_vencimiento;
        return copy;
      });
      const { error } = await supabase.from('promociones').upsert(cleanPayloads);
      if (error) throw error;
    }
  },

  async remove(id: string): Promise<boolean> {
    const supabase = getActiveSupabaseClient();
    if (typeof localStorage !== 'undefined') localStorage.removeItem(CACHE_KEY);
    const { error } = await supabase.from('promociones').delete().eq('id_promo', id);
    if (error) {
      console.error('Error deleting promocion:', error);
      throw error;
    }
    return true;
  }
};
