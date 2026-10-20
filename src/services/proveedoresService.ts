import { getActiveSupabaseClient, tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { Proveedor } from '../types';
import { sheetsService } from './sheetsService';

const toDbProveedor = (prov: Partial<Proveedor>) => ({
  ...(prov.id_proveedor !== undefined ? { id_proveedor: prov.id_proveedor } : {}),
  ...(prov.nombre !== undefined ? { nombre: prov.nombre } : {}),
  ...(prov.contacto !== undefined ? { contacto: prov.contacto } : {}),
  ...(prov.telefono !== undefined ? { telefono: prov.telefono } : {}),
  ...(prov.categoria !== undefined ? { categoria: prov.categoria } : {}),
  ...(prov.correo !== undefined ? { correo: prov.correo } : {}),
  ...(prov.tiempo_entrega_dias !== undefined ? { tiempo_entrega_dias: prov.tiempo_entrega_dias } : {})
});

export const proveedoresService = {
  async list(): Promise<Proveedor[]> {
    if (sheetsService.isConfigured()) {
      try {
        const rows = await sheetsService.getRows<Proveedor>('Proveedores');
        if (rows && rows.length > 0) {
          const mapped = rows.map(p => ({
            id_proveedor: p.id_proveedor,
            nombre: p.nombre,
            contacto: p.contacto,
            telefono: p.telefono || '',
            categoria: p.categoria || 'viveres',
            correo: p.correo || '',
            tiempo_entrega_dias: p.tiempo_entrega_dias !== undefined && p.tiempo_entrega_dias !== null ? Number(p.tiempo_entrega_dias) : 2
          }));
          try {
            localStorage.setItem('colores_pizzeria_cache_proveedores', JSON.stringify(mapped));
          } catch {}
          return mapped;
        }
      } catch (err) {
        console.warn('Sheets fetch for Proveedores failed, falling back:', err);
      }
    }

    const cached = localStorage.getItem('colores_pizzeria_cache_proveedores');
    if (cached) {
      setTimeout(async () => {
        try {
          const supabase = getActiveSupabaseClient();
          const { data, error } = await supabase.from('proveedores').select('*').order('nombre', { ascending: true });
          if (!error && data) {
            localStorage.setItem('colores_pizzeria_cache_proveedores', JSON.stringify(data));
          }
        } catch (e) {
          console.warn('Background suppliers cache refresh failed:', e);
        }
      }, 500);

      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => ({
            id_proveedor: p.id_proveedor,
            nombre: p.nombre,
            contacto: p.contacto,
            telefono: p.telefono || '',
            categoria: p.categoria || 'viveres',
            correo: p.correo || '',
            tiempo_entrega_dias: p.tiempo_entrega_dias !== undefined && p.tiempo_entrega_dias !== null ? p.tiempo_entrega_dias : 2
          }));
        }
      } catch (e) {
        console.warn('Failed parsing suppliers cache:', e);
      }
    }

    const supabase = tryGetActiveSupabaseClient();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('proveedores').select('*').order('nombre', { ascending: true });
      if (error) {
        return [];
      }
      const mapped = (data || []).map(p => ({
        id_proveedor: p.id_proveedor,
        nombre: p.nombre,
        contacto: p.contacto,
        telefono: p.telefono || '',
        categoria: p.categoria || 'viveres',
        correo: p.correo || '',
        tiempo_entrega_dias: p.tiempo_entrega_dias !== undefined && p.tiempo_entrega_dias !== null ? p.tiempo_entrega_dias : 2
      }));
      localStorage.setItem('colores_pizzeria_cache_proveedores', JSON.stringify(data || []));
      return mapped;
    } catch {
      return [];
    }
  },

  async create(prov: Proveedor): Promise<Proveedor> {
    localStorage.removeItem('colores_pizzeria_cache_proveedores');
    if (sheetsService.isConfigured()) {
      try {
        await sheetsService.append('Proveedores', [toDbProveedor(prov)]);
      } catch (e) {
        console.warn('Failed syncing new proveedor to Sheets:', e);
      }
    }
    const supabase = tryGetActiveSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('proveedores').insert([toDbProveedor(prov)]).select().single();
        if (!error && data) {
          return { ...prov, ...data };
        }
      } catch (err) {
        console.warn('Supabase create proveedor error:', err);
      }
    }
    return prov;
  },

  async update(id: string, prov: Partial<Proveedor>): Promise<Proveedor> {
    localStorage.removeItem('colores_pizzeria_cache_proveedores');
    const fullProv = { ...prov, id_proveedor: id };
    if (sheetsService.isConfigured()) {
      try {
        await sheetsService.upsert('Proveedores', [toDbProveedor(fullProv)], 'id_proveedor');
      } catch (e) {
        console.warn('Failed syncing updated proveedor to Sheets:', e);
      }
    }
    const supabase = tryGetActiveSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('proveedores').update(toDbProveedor(prov)).eq('id_proveedor', id).select().single();
        if (!error && data) {
          return { ...prov, ...data } as Proveedor;
        }
      } catch (err) {
        console.warn('Supabase update proveedor error:', err);
      }
    }
    return fullProv as Proveedor;
  },

  async upsert(provs: Proveedor[]): Promise<Proveedor[]> {
    localStorage.removeItem('colores_pizzeria_cache_proveedores');
    if (sheetsService.isConfigured()) {
      try {
        await sheetsService.upsert('Proveedores', provs.map(toDbProveedor), 'id_proveedor');
      } catch (e) {
        console.warn('Failed syncing upserted proveedores to Sheets:', e);
      }
    }
    const supabase = tryGetActiveSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('proveedores').upsert(provs.map(toDbProveedor)).select();
        if (!error && data) {
          return (data || []).map((dbProv, idx) => ({
            ...provs[idx],
            ...dbProv
          }));
        }
      } catch (err) {
        console.warn('Supabase upsert proveedores error:', err);
      }
    }
    return provs;
  },

  async remove(id: string): Promise<boolean> {
    try {
      const cached = localStorage.getItem('colores_pizzeria_cache_proveedores');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((p: any) => p.id_proveedor !== id);
          localStorage.setItem('colores_pizzeria_cache_proveedores', JSON.stringify(filtered));
        }
      }
    } catch {}

    if (sheetsService.isConfigured()) {
      try {
        await sheetsService.deleteRow('Proveedores', id, 'id_proveedor');
      } catch (err) {
        console.warn('Failed deleting proveedor from Google Sheets:', err);
      }
    }

    const supabase = tryGetActiveSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('proveedores').delete().eq('id_proveedor', id);
        if (error) {
          console.error('Error deleting proveedor:', error);
          return false;
        }
      } catch (err) {
        console.error('Supabase delete proveedor error:', err);
        return false;
      }
    }
    return true;
  }
};
