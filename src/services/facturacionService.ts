import { getActiveSupabaseClient } from '../lib/supabaseClient';
import { sheetsService } from './sheetsService';

export interface Factura {
  id_factura: string;
  id_pedido?: string;
  nro_ticket: string;
  cliente: string;
  cuit: string;
  total: number;
  iva_veintiuno: number;
  medio_pago: 'efectivo' | 'debito' | 'tarjeta' | 'transferencia' | 'mp_qr' | 'mixto';
  fecha: string;
  estado: 'emitido' | 'nota_credito';
  afip_cae?: string;
  afip_vto?: string;
  afip_qr?: string;
  afip_resultado?: 'A' | 'O' | 'R';
  fecha_emision?: string;
}

const mapMetodoPagoToDb = (medioPago: Factura['medio_pago']) => {
  if (medioPago === 'debito') return 'Tarjeta Debito';
  if (medioPago === 'tarjeta') return 'Tarjeta Credito';
  if (medioPago === 'transferencia') return 'Transferencia';
  if (medioPago === 'mp_qr') return 'MercadoPago';
  if (medioPago === 'mixto') return 'Mixto';
  return 'Efectivo';
};

const mapMetodoPagoFromDb = (medioPago?: string): Factura['medio_pago'] => {
  if (medioPago === 'Tarjeta Debito') return 'debito';
  if (medioPago === 'Tarjeta Credito') return 'tarjeta';
  if (medioPago === 'Transferencia') return 'transferencia';
  if (medioPago === 'MercadoPago') return 'mp_qr';
  if (medioPago === 'Mixto') return 'mixto';
  return 'efectivo';
};

const LOCAL_FACTURAS_KEY = 'colores_pizzeria_facturas_pendientes';

const readLocalFacturas = (): Factura[] => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_FACTURAS_KEY);
    } catch {}
  }
  return [];
};

const writeLocalFacturas = (facturas: Factura[]) => {
  // No-op to prevent saturating browser localStorage
};

export const mergeFacturas = (remote: Factura[], local: Factura[]): Factura[] => {
  const merged = new Map<string, Factura>();
  local.forEach(factura => merged.set(factura.id_factura, factura));
  remote.forEach(factura => merged.set(factura.id_factura, factura));
  return Array.from(merged.values()).sort((a, b) => b.id_factura.localeCompare(a.id_factura));
};

const cacheFactura = (factura: Factura) => {
  // No-op to prevent saturating browser localStorage
};

export const facturacionService = {
  async list(): Promise<Factura[]> {
    const local = readLocalFacturas();

    // 1. Google Sheets si está configurado
    if (sheetsService.isConfigured()) {
      try {
        const rows = await sheetsService.getRows<any>('facturas');
        if (rows && Array.isArray(rows) && rows.length > 0) {
          const remote: Factura[] = rows.map(f => {
            const tipoComprobante = String(f.tipo_comprobante || f.estado || '');
            return {
              id_factura: String(f.id_factura || `fac_${Date.now()}`),
              id_pedido: f.id_pedido ? String(f.id_pedido) : undefined,
              nro_ticket: String(f.numero_factura || f.nro_ticket || 'T-0001'),
              cliente: f.cuit_cliente ? `Clien_CUIT_${f.cuit_cliente}` : (f.cliente || 'Consumidor Final'),
              cuit: String(f.cuit_cliente || f.cuit || '99-99999999-9'),
              total: parseFloat(f.total) || 0,
              iva_veintiuno: parseFloat((Number(f.total || 0) * 0.21).toFixed(2)),
              medio_pago: mapMetodoPagoFromDb(f.metodo_pago || f.medio_pago),
              fecha: f.fecha_emision ? new Date(f.fecha_emision).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs' : (f.fecha || ''),
              estado: tipoComprobante.toLowerCase().includes('nota') ? 'nota_credito' as const : 'emitido' as const,
              afip_cae: f.afip_cae,
              afip_vto: f.afip_vto,
              afip_qr: f.afip_qr,
              afip_resultado: f.afip_resultado,
              fecha_emision: f.fecha_emision
            };
          });
          return mergeFacturas(remote, local);
        }
      } catch (err) {
        console.warn('Sheets fetch facturas failed, falling back:', err);
      }
    }

    try {
      const supabase = getActiveSupabaseClient();
      if (!supabase) return local;

      const { data, error } = await supabase.from('facturas').select('*').order('fecha_emision', { ascending: false });
      if (error) throw error;

      const remote = (data || []).map(f => {
        const tipoComprobante = String(f.tipo_comprobante || '');

        return {
          id_factura: f.id_factura,
          id_pedido: f.id_pedido || undefined,
          nro_ticket: f.numero_factura,
          cliente: f.cuit_cliente ? `Clien_CUIT_${f.cuit_cliente}` : 'Consumidor Final',
          cuit: f.cuit_cliente || '99-99999999-9',
          total: parseFloat(f.total),
          iva_veintiuno: parseFloat((f.total * 0.21).toFixed(2)),
          medio_pago: mapMetodoPagoFromDb(f.metodo_pago),
          fecha: new Date(f.fecha_emision).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs',
          estado: tipoComprobante.toLowerCase().includes('nota') ? 'nota_credito' as const : 'emitido' as const,
          afip_cae: f.afip_cae,
          afip_vto: f.afip_vto,
          afip_qr: f.afip_qr,
          afip_resultado: f.afip_resultado,
          fecha_emision: f.fecha_emision
        };
      });

      return mergeFacturas(remote, local);
    } catch (error) {
      console.warn('No se pudo leer facturas remotas; usando respaldo local.', error);
      return local;
    }
  },

  async create(factura: Factura, fromSyncQueue: boolean = false): Promise<Factura> {
    cacheFactura(factura);
    const dbPayload = {
      id_factura: factura.id_factura,
      id_pedido: factura.id_pedido || null,
      numero_factura: factura.nro_ticket,
      total: factura.total,
      tipo_comprobante: factura.estado === 'nota_credito' ? 'Nota Credito' : 'Factura B',
      metodo_pago: mapMetodoPagoToDb(factura.medio_pago),
      cuit_cliente: factura.cuit,
      fecha_emision: factura.fecha_emision || new Date().toISOString(),
      afip_cae: factura.afip_cae,
      afip_vto: factura.afip_vto,
      afip_qr: factura.afip_qr,
      afip_resultado: factura.afip_resultado
    };
    
    let saved = false;

    // 1. Google Sheets como almacenamiento principal
    if (sheetsService.isConfigured()) {
      try {
        await sheetsService.upsert('facturas', dbPayload, 'id_factura');
        saved = true;
      } catch (sheetsErr) {
        console.warn('facturacionService.create Sheets upsert error:', sheetsErr);
      }
    }

    // 2. Supabase como almacenamiento secundario si existe la tabla
    try {
      const supabase = getActiveSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('facturas').insert([dbPayload]).select().maybeSingle();
        if (!error && data) {
          saved = true;
          return {
            ...factura,
            id_factura: data.id_factura
          };
        }
      }
    } catch (err) {
      // Ignorar si la tabla no está en Supabase
    }

    if (!saved && !fromSyncQueue) {
      const { syncQueueService } = await import('./syncQueueService');
      syncQueueService.enqueue('upsert_factura', factura);
    }

    return factura;
  },

  async upsert(facturas: Factura[], fromSyncQueue: boolean = false): Promise<void> {
    writeLocalFacturas(mergeFacturas([], [...facturas, ...readLocalFacturas()]));
    const dbPayloads = facturas.map(f => {
      return {
        id_factura: f.id_factura,
        id_pedido: f.id_pedido || null,
        numero_factura: f.nro_ticket,
        total: f.total,
        tipo_comprobante: f.estado === 'nota_credito' ? 'Nota Credito' : 'Factura B',
        metodo_pago: mapMetodoPagoToDb(f.medio_pago),
        cuit_cliente: f.cuit,
        fecha_emision: f.fecha_emision || new Date().toISOString(),
        afip_cae: f.afip_cae,
        afip_vto: f.afip_vto,
        afip_qr: f.afip_qr,
        afip_resultado: f.afip_resultado
      };
    });

    let saved = false;

    // 1. Guardar en Google Sheets
    if (sheetsService.isConfigured()) {
      try {
        await sheetsService.upsert('facturas', dbPayloads, 'id_factura');
        saved = true;
      } catch (sheetsErr) {
        console.warn('facturacionService.upsert Sheets error:', sheetsErr);
      }
    }

    // 2. Supabase si existiera la tabla
    try {
      const supabase = getActiveSupabaseClient();
      if (supabase) {
        await supabase.from('facturas').upsert(dbPayloads);
        saved = true;
      }
    } catch (err) {
      // Ignorado si la tabla no existe en Supabase
    }

    if (!saved && !fromSyncQueue) {
      const { syncQueueService } = await import('./syncQueueService');
      facturas.forEach(f => syncQueueService.enqueue('upsert_factura', f));
    }
  },

  async markNotaCredito(
    id: string,
    afipDetails?: {
      cae: string;
      vto: string;
      qr: string;
      resultado: 'A' | 'O' | 'R';
      nro_ticket: string;
    }
  ): Promise<void> {
    writeLocalFacturas(readLocalFacturas().map(factura => (
      factura.id_factura === id
        ? {
            ...factura,
            estado: 'nota_credito',
            ...(afipDetails ? {
              afip_cae: afipDetails.cae,
              afip_vto: afipDetails.vto,
              afip_qr: afipDetails.qr,
              afip_resultado: afipDetails.resultado,
              nro_ticket: afipDetails.nro_ticket
            } : {})
          }
        : factura
    )));
    const supabase = getActiveSupabaseClient();
    const updateData: Record<string, any> = {
      tipo_comprobante: 'Nota Credito'
    };
    if (afipDetails) {
      updateData.afip_cae = afipDetails.cae;
      updateData.afip_vto = afipDetails.vto;
      updateData.afip_qr = afipDetails.qr;
      updateData.afip_resultado = afipDetails.resultado;
      updateData.numero_factura = afipDetails.nro_ticket;
    }

    const { error } = await supabase
      .from('facturas')
      .update(updateData)
      .eq('id_factura', id);
    if (error) {
      console.error('Error marking invoice as credit note:', error);
      throw error;
    }
  },

  async remove(id: string): Promise<boolean> {
    writeLocalFacturas(readLocalFacturas().filter(factura => factura.id_factura !== id));
    const supabase = getActiveSupabaseClient();
    const { error } = await supabase.from('facturas').delete().eq('id_factura', id);
    if (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
    return true;
  }
};
