import { getActiveSupabaseClient } from '../lib/supabaseClient';
import { PagoDb } from '../types';
import { sheetsService } from './sheetsService';

export const pagosService = {
  async list(idFactura?: string): Promise<PagoDb[]> {
    if (sheetsService.isConfigured()) {
      try {
        const rows = await sheetsService.getRows<any>('pagos');
        if (rows && Array.isArray(rows) && rows.length > 0) {
          const mapped: PagoDb[] = rows.map(p => ({
            id_pago: p.id_pago || `pago_${Date.now()}`,
            id_factura: p.id_factura || undefined,
            monto: parseFloat(p.monto) || 0,
            metodo: p.metodo || 'Efectivo',
            fecha: p.fecha || new Date().toISOString()
          }));
          if (idFactura) {
            return mapped.filter(p => p.id_factura === idFactura);
          }
          return mapped;
        }
      } catch (err) {
        console.warn('Sheets fetch pagos failed, falling back:', err);
      }
    }

    const supabase = getActiveSupabaseClient();
    try {
      if (supabase) {
        let query = supabase.from('pagos').select('*');
        if (idFactura) {
          query = query.eq('id_factura', idFactura);
        }
        const { data, error } = await query;
        if (!error && data) {
          return (data || []).map(p => ({
            id_pago: p.id_pago,
            id_factura: p.id_factura,
            monto: parseFloat(p.monto),
            metodo: p.metodo,
            fecha: p.fecha
          }));
        }
      }
    } catch {}

    // Local fallback for client-side storage
    const raw = localStorage.getItem('colores_pizzeria_pagos');
    const all: PagoDb[] = raw ? JSON.parse(raw) : [];
    if (idFactura) {
      return all.filter(p => p.id_factura === idFactura);
    }
    return all;
  },

  async create(pago: PagoDb): Promise<PagoDb> {
    const supabase = getActiveSupabaseClient();
    try {
      if (supabase) {
        await supabase.from('pagos').insert([{
          id_pago: pago.id_pago,
          id_factura: pago.id_factura,
          monto: pago.monto,
          metodo: pago.metodo,
          fecha: pago.fecha
        }]);
      }
    } catch (err) {
      console.warn('DB payments persistence offline, using local storage cache:', err);
    }

    if (sheetsService.isConfigured()) {
      sheetsService.append('pagos', pago).catch(() => {});
    }

    // Always cache locally as backup
    const raw = localStorage.getItem('colores_pizzeria_pagos');
    const all: PagoDb[] = raw ? JSON.parse(raw) : [];
    all.push(pago);
    localStorage.setItem('colores_pizzeria_pagos', JSON.stringify(all));

    return pago;
  },

  async bulkCreate(pagos: PagoDb[]): Promise<void> {
    const supabase = getActiveSupabaseClient();
    try {
      if (supabase) {
        const dbPayloads = pagos.map(p => ({
          id_pago: p.id_pago,
          id_factura: p.id_factura,
          monto: p.monto,
          metodo: p.metodo,
          fecha: p.fecha
        }));
        await supabase.from('pagos').insert(dbPayloads);
      }
    } catch (err) {
      console.warn('DB payments persistence bulk offline:', err);
    }

    if (sheetsService.isConfigured()) {
      sheetsService.append('pagos', pagos).catch(() => {});
    }

    // Always cache locally
    const raw = localStorage.getItem('colores_pizzeria_pagos');
    const all: PagoDb[] = raw ? JSON.parse(raw) : [];
    all.push(...pagos);
    localStorage.setItem('colores_pizzeria_pagos', JSON.stringify(all));
  }
};
