import { getActiveSupabaseClient } from '../lib/supabaseClient';

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
  estado: 'emitido' | 'nota_credito' | 'rechazado';
  tipo?: 'ticket' | 'A' | 'B' | 'C' | 'X';
  afip_cae?: string;
  afip_vto?: string;
  afip_qr?: string;
  afip_resultado?: 'A' | 'O' | 'R';
  fecha_emision?: string;
  persistencia?: 'remota' | 'pendiente_sync';
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

const mapTipoComprobanteToDb = (factura: Factura): string => {
  if (factura.estado === 'nota_credito') return 'Nota Credito';
  const tipo = factura.tipo || factura.nro_ticket.split('-')[0];
  if (tipo === 'A') return 'Factura A';
  if (tipo === 'C') return 'Factura C';
  if (tipo === 'X') return 'Comprobante X';
  if (tipo === 'ticket' || tipo === 'T') return 'Ticket Factura B';
  return 'Factura B';
};

const mapTipoComprobanteFromDb = (tipoComprobante: string): Factura['tipo'] => {
  const normalized = tipoComprobante.toLowerCase();
  if (normalized.includes('comprobante x')) return 'X';
  if (normalized.includes('factura a')) return 'A';
  if (normalized.includes('factura c')) return 'C';
  if (normalized.includes('ticket')) return 'ticket';
  return 'B';
};

const LOCAL_FACTURAS_KEY = 'colores_pizzeria_facturas_pendientes';

const MAX_LOCAL_FACTURAS = 500;
const readLocalFacturas = (): Factura[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_FACTURAS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('No se pudo leer el respaldo fiscal local.', error);
    return [];
  }
};

const writeLocalFacturas = (facturas: Factura[]): boolean => {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(LOCAL_FACTURAS_KEY, JSON.stringify(facturas.slice(0, MAX_LOCAL_FACTURAS)));
    return true;
  } catch (error) {
    console.error('No se pudo escribir el respaldo fiscal local.', error);
    return false;
  }
};

export const mergeFacturas = (remote: Factura[], local: Factura[]): Factura[] => {
  const merged = new Map<string, Factura>();
  local.forEach(factura => merged.set(factura.id_factura, factura));
  remote.forEach(factura => merged.set(factura.id_factura, factura));
  return Array.from(merged.values()).sort((a, b) => b.id_factura.localeCompare(a.id_factura));
};

const cacheFactura = (factura: Factura): boolean => {
  return writeLocalFacturas(mergeFacturas([factura], readLocalFacturas()));
};

export const toFacturaDbPayload = (factura: Factura) => ({
  id_factura: factura.id_factura,
  id_pedido: factura.id_pedido || null,
  numero_factura: factura.nro_ticket,
  total: factura.total,
  tipo_comprobante: mapTipoComprobanteToDb(factura),
  metodo_pago: mapMetodoPagoToDb(factura.medio_pago),
  cuit_cliente: factura.cuit,
  fecha_emision: factura.fecha_emision || new Date().toISOString(),
  afip_cae: factura.afip_cae,
  afip_vto: factura.afip_vto,
  afip_qr: factura.afip_qr,
  afip_resultado: factura.afip_resultado
});

const enqueueFactura = async (factura: Factura): Promise<boolean> => {
  try {
    const { syncQueueService } = await import('./syncQueueService');
    syncQueueService.enqueue('upsert_factura', factura);
    return true;
  } catch (error) {
    console.error('No se pudo agregar el comprobante a la cola de sincronizacion.', error);
    return false;
  }
};

export const facturacionService = {
  async list(): Promise<Factura[]> {
    const local = readLocalFacturas();
    try {
      const supabase = getActiveSupabaseClient();
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
          estado: f.afip_resultado === 'R'
            ? 'rechazado' as const
            : tipoComprobante.toLowerCase().includes('nota')
              ? 'nota_credito' as const
              : 'emitido' as const,
          tipo: mapTipoComprobanteFromDb(tipoComprobante),
          afip_cae: f.afip_cae,
          afip_vto: f.afip_vto,
          afip_qr: f.afip_qr,
          afip_resultado: f.afip_resultado,
          fecha_emision: f.fecha_emision,
          persistencia: 'remota' as const
        };
      });

      return mergeFacturas(remote, local);
    } catch (error) {
      console.warn('No se pudo leer facturas remotas; usando respaldo local.', error);
      return local;
    }
  },

  async create(factura: Factura, fromSyncQueue: boolean = false): Promise<Factura> {
    const pendingFactura: Factura = { ...factura, persistencia: 'pendiente_sync' };
    const locallyBackedUp = cacheFactura(pendingFactura);
    const dbPayload = toFacturaDbPayload(factura);

    try {
      const supabase = getActiveSupabaseClient();
      const { data, error } = await supabase
        .from('facturas')
        .upsert([dbPayload], { onConflict: 'id_factura' })
        .select()
        .single();
      if (error) {
        console.error('Error creating invoice:', error);
        throw error;
      }
      const persisted: Factura = {
        ...factura,
        id_factura: data.id_factura,
        persistencia: 'remota'
      };
      cacheFactura(persisted);
      return persisted;
    } catch (err) {
      console.warn('facturacionService.create failed remote push, enqueued for sync:', err);
      if (fromSyncQueue) throw err;

      const queued = await enqueueFactura(pendingFactura);
      if (!locallyBackedUp && !queued) {
        throw new Error('El comprobante fiscal fue autorizado, pero no pudo guardarse localmente ni en Supabase. No lo emita nuevamente; verifique ARCA y contacte soporte.');
      }
      return pendingFactura;
    }
  },

  async upsert(facturas: Factura[], fromSyncQueue: boolean = false): Promise<void> {
    const pendingFacturas = facturas.map(f => ({ ...f, persistencia: 'pendiente_sync' as const }));
    const locallyBackedUp = writeLocalFacturas(mergeFacturas(pendingFacturas, readLocalFacturas()));
    const dbPayloads = facturas.map(toFacturaDbPayload);

    try {
      const supabase = getActiveSupabaseClient();
      const { error } = await supabase.from('facturas').upsert(dbPayloads, { onConflict: 'id_factura' });
      if (error) {
        console.error('Error upserting invoices:', error);
        throw error;
      }
      const persisted = facturas.map(f => ({ ...f, persistencia: 'remota' as const }));
      writeLocalFacturas(mergeFacturas(persisted, readLocalFacturas()));
    } catch (err) {
      console.warn('facturacionService.upsert failed remote push, enqueued for sync:', err);
      if (fromSyncQueue) throw err;
      const queueResults = await Promise.all(pendingFacturas.map(enqueueFactura));
      if (!locallyBackedUp && !queueResults.some(Boolean)) {
        throw new Error('No se pudieron conservar los comprobantes para sincronizarlos.');
      }
    }
  },

  async markNotaCredito(id: string): Promise<void> {
    writeLocalFacturas(readLocalFacturas().map(factura => (
      factura.id_factura === id ? { ...factura, estado: 'nota_credito' } : factura
    )));
    const supabase = getActiveSupabaseClient();
    const { error } = await supabase
      .from('facturas')
      .update({ tipo_comprobante: 'Nota Credito' })
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
