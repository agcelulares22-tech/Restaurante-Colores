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

export const promocionesService = {
  async list(): Promise<Promocion[]> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('promociones').select('*').order('nombre', { ascending: true });
    if (error) {
      console.error('Error fetching promociones:', error);
      throw error;
    }
    const localVencimientos = JSON.parse(localStorage.getItem('local_promos_vencimientos') || '{}');
    return (data || []).map(p => ({
      id_promo: p.id_promo,
      nombre: p.nombre,
      descuento_porcentaje: p.descuento || p.descuento_porcentaje || 0,
      tipo: p.tipo || 'descuento_directo',
      dias_vigentes: p.dias_vigentes || p.días_vigentes || 'Todos los días',
      activo: p.activa !== undefined ? p.activa : (p.activo !== undefined ? p.activo : true),
      descripcion: p.descripcion || '',
      fecha_vencimiento: p.fecha_vencimiento || p.vencimiento || localVencimientos[p.id_promo] || undefined,
      imagen_url: p.imagen_url || ''
    }));
  },

  async create(promo: Promocion): Promise<Promocion> {
    const supabase = getActiveSupabaseClient();
    const dbPayload: any = {
      id_promo: promo.id_promo,
      nombre: promo.nombre,
      descuento: promo.descuento_porcentaje,
      activa: promo.activo,
      descripcion: promo.descripcion,
      imagen_url: promo.imagen_url
    };
    if (promo.fecha_vencimiento) {
      dbPayload.fecha_vencimiento = promo.fecha_vencimiento;
    }

    try {
      const { data, error } = await supabase.from('promociones').insert([dbPayload]).select().single();
      if (error) throw error;
      return {
        id_promo: data.id_promo,
        nombre: data.nombre,
        descuento_porcentaje: data.descuento,
        tipo: 'descuento_directo',
        dias_vigentes: 'Todos los dias',
        activo: data.activa,
        descripcion: data.descripcion,
        fecha_vencimiento: data.fecha_vencimiento,
        imagen_url: data.imagen_url || ''
      };
    } catch (err) {
      console.warn("Failed inserting with fecha_vencimiento, retrying without it:", err);
      delete dbPayload.fecha_vencimiento;
      const { data, error } = await supabase.from('promociones').insert([dbPayload]).select().single();
      if (error) throw error;
      
      const localVencimientos = JSON.parse(localStorage.getItem('local_promos_vencimientos') || '{}');
      localVencimientos[promo.id_promo] = promo.fecha_vencimiento;
      localStorage.setItem('local_promos_vencimientos', JSON.stringify(localVencimientos));

      return {
        id_promo: data.id_promo,
        nombre: data.nombre,
        descuento_porcentaje: data.descuento,
        tipo: 'descuento_directo',
        dias_vigentes: 'Todos los dias',
        activo: data.activa,
        descripcion: data.descripcion,
        fecha_vencimiento: promo.fecha_vencimiento,
        imagen_url: data.imagen_url || ''
      };
    }
  },

  async update(id: string, fields: Partial<Promocion>): Promise<void> {
    const supabase = getActiveSupabaseClient();
    const dbPayload: any = {};
    if (fields.nombre !== undefined) dbPayload.nombre = fields.nombre;
    if (fields.descuento_porcentaje !== undefined) dbPayload.descuento = fields.descuento_porcentaje;
    if (fields.activo !== undefined) dbPayload.activa = fields.activo;
    if (fields.descripcion !== undefined) dbPayload.descripcion = fields.descripcion;
    if (fields.imagen_url !== undefined) dbPayload.imagen_url = fields.imagen_url;
    if (fields.fecha_vencimiento !== undefined) {
      dbPayload.fecha_vencimiento = fields.fecha_vencimiento;
      const localVencimientos = JSON.parse(localStorage.getItem('local_promos_vencimientos') || '{}');
      localVencimientos[id] = fields.fecha_vencimiento;
      localStorage.setItem('local_promos_vencimientos', JSON.stringify(localVencimientos));
    }

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

    const dbPayloads = promos.map(p => {
      const payload: any = {
        id_promo: p.id_promo,
        nombre: p.nombre,
        descuento: p.descuento_porcentaje,
        activa: p.activo,
        descripcion: p.descripcion,
        imagen_url: p.imagen_url
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
    const { error } = await supabase.from('promociones').delete().eq('id_promo', id);
    if (error) {
      console.error('Error deleting promocion:', error);
      throw error;
    }
    return true;
  }
};
