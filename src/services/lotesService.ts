import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { LoteInsumo } from '../types';

const LOCAL_STORAGE_KEY = 'el_patron_lotes_insumo';

export const lotesService = {
  async list(): Promise<LoteInsumo[]> {
    const client = tryGetActiveSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('lotes_insumo')
          .select('*')
          .order('fecha_vencimiento', { ascending: true });
        if (!error && data) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.warn('Supabase fetch for lotes_insumo failed, falling back to localStorage:', e);
      }
    }
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  },

  async saveAll(lotes: LoteInsumo[]): Promise<void> {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lotes));
    const client = tryGetActiveSupabaseClient();
    if (client) {
      try {
        await client.from('lotes_insumo').upsert(lotes);
      } catch (e) {
        console.warn('Supabase upsert for lotes_insumo failed:', e);
      }
    }
  },

  async create(lote: LoteInsumo): Promise<LoteInsumo> {
    const list = await this.list();
    list.push(lote);
    await this.saveAll(list);
    return lote;
  },

  async update(id_lote: string, partial: Partial<LoteInsumo>): Promise<void> {
    const list = await this.list();
    const idx = list.findIndex(l => l.id_lote === id_lote);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial };
      await this.saveAll(list);
    }
  },

  async remove(id_lote: string): Promise<void> {
    const list = await this.list();
    const filtered = list.filter(l => l.id_lote !== id_lote);
    await this.saveAll(filtered);
    const client = tryGetActiveSupabaseClient();
    if (client) {
      try {
        await client.from('lotes_insumo').delete().eq('id_lote', id_lote);
      } catch (e) {
        console.warn('Supabase delete for lotes_insumo failed:', e);
      }
    }
  },

  async deductFIFO(id_insumo: string, cantidad: number): Promise<void> {
    if (cantidad <= 0) return;
    const list = await this.list();
    // Filtramos lotes activos del insumo especificado
    const insumoLots = list.filter(l => l.id_insumo === id_insumo && l.cantidad > 0);
    // Ordenamos por fecha de vencimiento ascendente (FIFO)
    insumoLots.sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime());

    let remaining = cantidad;
    for (const lot of insumoLots) {
      if (remaining <= 0) break;
      const originalIdx = list.findIndex(l => l.id_lote === lot.id_lote);
      if (originalIdx !== -1) {
        if (list[originalIdx].cantidad >= remaining) {
          list[originalIdx].cantidad = parseFloat((list[originalIdx].cantidad - remaining).toFixed(2));
          remaining = 0;
        } else {
          remaining = parseFloat((remaining - list[originalIdx].cantidad).toFixed(2));
          list[originalIdx].cantidad = 0;
        }
      }
    }
    await this.saveAll(list);
  },

  async restoreFIFO(id_insumo: string, cantidad: number): Promise<void> {
    if (cantidad <= 0) return;
    const list = await this.list();
    const insumoLots = list.filter(l => l.id_insumo === id_insumo);
    if (insumoLots.length > 0) {
      insumoLots.sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime());
      const targetLot = insumoLots[0];
      const originalIdx = list.findIndex(l => l.id_lote === targetLot.id_lote);
      if (originalIdx !== -1) {
        list[originalIdx].cantidad = parseFloat((list[originalIdx].cantidad + cantidad).toFixed(2));
      }
    } else {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7);
      const newLot: LoteInsumo = {
        id_lote: `lot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        id_insumo,
        cantidad,
        fecha_vencimiento: defaultExpiry.toISOString().split('T')[0],
        creado_at: new Date().toISOString()
      };
      list.push(newLot);
    }
    await this.saveAll(list);
  }
};
