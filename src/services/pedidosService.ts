import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { Pedido, PedidoItem } from '../types';
import { sheetsService } from './sheetsService';

type PedidoHeaderRow = Record<string, any>;
type PedidoDetailRow = Record<string, any>;

const parseHeaderItems = (items: unknown): PedidoItem[] => {
  if (!items) return [];

  try {
    const parsed = typeof items === 'string' ? JSON.parse(items) : items;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to parse items fallback JSON:', error);
    return [];
  }
};

export const sanitizePedidoId = (idInput: string | number | undefined | null): number | null => {
  if (idInput === undefined || idInput === null) return null;
  if (typeof idInput === 'number') return Number.isFinite(idInput) && idInput > 0 ? Math.floor(idInput) : null;
  const str = String(idInput).trim();
  if (/^\d+$/.test(str)) {
    const num = Number(str);
    return Number.isFinite(num) && num > 0 ? num : null;
  }
  const digitsOnly = str.replace(/\D+/g, '');
  if (digitsOnly.length > 0) {
    const num = Number(digitsOnly);
    return Number.isFinite(num) && num > 0 ? num : null;
  }
  return null;
};

export const hydratePedido = (
  header: PedidoHeaderRow,
  details: PedidoDetailRow[] = []
): Pedido => {
  const headerItems = parseHeaderItems(header.items);
  const relatedItems: PedidoItem[] = details
    .filter(detail => String(detail.id_pedido) === String(header.id_pedido))
    .sort((a, b) => String(a.id_detalle || '').localeCompare(String(b.id_detalle || '')))
    .map(detail => {
      const matchingHeaderItem = headerItems.find(hi => hi.id_producto === detail.id_producto);
      return {
        id_producto: detail.id_producto || '',
        nombre: detail.nombre,
        readonly: true,
        cantidad: detail.cantidad,
        categoria: detail.categoria,
        precio_unitario: detail.precio_unitario ?? matchingHeaderItem?.precio_unitario ?? undefined
      };
    });

  const isDelivery = (header.id_mesa === null || header.id_mesa === 999) && String(header.numero_mesa || '').toUpperCase().startsWith('DELIVERY');
  const isRetiro = (header.id_mesa === null || header.id_mesa === 998) && String(header.numero_mesa || '').toUpperCase().startsWith('RETIRO');
  const idMesa = isDelivery ? 999 : (isRetiro ? 998 : header.id_mesa);

  return {
    id_pedido: String(header.id_pedido),
    idempotency_key: header.idempotency_key ?? undefined,
    id_mesa: idMesa,
    numero_mesa: header.numero_mesa,
    mozo: header.mozo,
    estado_comanda: header.estado_comanda,
    items: relatedItems.length > 0 ? relatedItems : headerItems,
    observaciones: header.observaciones || undefined,
    fecha_hora: new Date(header.fecha_hora),
    minutos_transcurridos: header.minutos_transcurridos || 0,
    origen: header.origen,
    tiempo_despacho_minutos: header.tiempo_despacho_minutos ?? undefined,
    segundos_en_listo: header.segundos_en_listo ?? undefined,
    stock_descontado: Boolean(header.stock_descontado),
    fecha_descuento_stock: header.fecha_descuento_stock
      ? new Date(header.fecha_descuento_stock)
      : undefined,
    nombre_cliente: header.nombre_cliente ?? undefined,
    telefono_cliente: header.telefono_cliente ?? undefined,
    direccion_cliente: header.direccion_cliente ?? undefined,
    costo_envio: header.costo_envio ?? undefined,
    zona_envio_id: header.zona_envio_id ?? undefined
  };
};

export const serializePedidoHeader = (pedido: Pedido): PedidoHeaderRow => {
  const isNonTable = (
    pedido.id_mesa === 999 ||
    pedido.id_mesa === 998 ||
    String(pedido.numero_mesa || '').toUpperCase().startsWith('DELIVERY') ||
    String(pedido.numero_mesa || '').toUpperCase().startsWith('RETIRO')
  );

  const header: PedidoHeaderRow = {
    id_pedido: sanitizePedidoId(pedido.id_pedido) || pedido.id_pedido,
    id_mesa: isNonTable ? null : (pedido.id_mesa || null),
    numero_mesa: pedido.numero_mesa,
    mozo: pedido.mozo || 'Sistema',
    estado_comanda: pedido.estado_comanda,
    observaciones: pedido.observaciones || null,
    fecha_hora: pedido.fecha_hora instanceof Date
      ? pedido.fecha_hora.toISOString()
      : new Date(pedido.fecha_hora).toISOString(),
    minutos_transcurridos: pedido.minutos_transcurridos,
    origen: pedido.origen,
    tiempo_despacho_minutos: pedido.tiempo_despacho_minutos ?? null,
    segundos_en_listo: pedido.segundos_en_listo ?? null,
    stock_descontado: Boolean(pedido.stock_descontado),
    fecha_descuento_stock: pedido.fecha_descuento_stock
      ? new Date(pedido.fecha_descuento_stock).toISOString()
      : null,
    fecha_inicio_cocina: pedido.fecha_inicio_cocina
      ? new Date(pedido.fecha_inicio_cocina).toISOString()
      : null,
    fecha_listo: pedido.fecha_listo
      ? new Date(pedido.fecha_listo).toISOString()
      : null,
    items: JSON.stringify(pedido.items || []),
    nombre_cliente: pedido.nombre_cliente ?? null,
    telefono_cliente: pedido.telefono_cliente ?? null,
    direccion_cliente: pedido.direccion_cliente ?? null
  };

  if (pedido.idempotency_key) {
    header.idempotency_key = pedido.idempotency_key;
  }
  if (pedido.costo_envio !== undefined && pedido.costo_envio !== null) {
    header.costo_envio = pedido.costo_envio;
  }
  if (pedido.zona_envio_id !== undefined && pedido.zona_envio_id !== null) {
    header.zona_envio_id = pedido.zona_envio_id;
  }

  return header;
};

export const serializePedidoDetails = (pedido: Pedido): PedidoDetailRow[] => (pedido.items || []).map((item, index) => ({
  id_detalle: `${pedido.id_pedido}_${String(index).padStart(4, '0')}`,
  id_pedido: sanitizePedidoId(pedido.id_pedido) || pedido.id_pedido,
  id_producto: item.id_producto,
  nombre: item.nombre,
  cantidad: item.cantidad,
  categoria: item.categoria,
  precio_unitario: item.precio_unitario ?? null,
}));

const CACHE_KEY = 'colores_pizzeria_cache_pedidos';

const invalidateCache = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
};

async function safeUpsertHeader(supabase: any, cabeceraObj: Record<string, any>): Promise<{ data: any; error: any }> {
  const payload: Record<string, any> = { ...cabeceraObj };
  if (payload.costo_envio == null) delete payload.costo_envio;
  if (payload.zona_envio_id == null) delete payload.zona_envio_id;
  if (payload.idempotency_key == null) delete payload.idempotency_key;

  let res = await supabase.from('pedidos_cabecera').upsert([payload]).select();

  let attempts = 0;
  while (res.error && attempts < 5) {
    attempts++;
    const errMsg = res.error.message || '';
    const match = errMsg.match(/Could not find the '([^']+)' column/) ||
                  errMsg.match(/column "([^"]+)" of relation/) ||
                  errMsg.match(/column '([^']+)'/);

    if (match && match[1]) {
      const missingCol = match[1];
      console.warn(`[pedidosService] Auto-stripping missing schema column '${missingCol}' from upsert and retrying (attempt ${attempts})...`);
      delete payload[missingCol];
      res = await supabase.from('pedidos_cabecera').upsert([payload]).select();
    } else {
      break;
    }
  }

  return res;
}

async function safeUpdateHeader(supabase: any, id_pedido: string | number, headerFields: Record<string, any>): Promise<{ data: any; error: any }> {
  const payload: Record<string, any> = { ...headerFields };
  if (payload.costo_envio == null) delete payload.costo_envio;
  if (payload.zona_envio_id == null) delete payload.zona_envio_id;
  if (payload.idempotency_key == null) delete payload.idempotency_key;

  const numId = Number(id_pedido);
  const idFilter = !isNaN(numId) && numId > 0 ? numId : id_pedido;

  let res = await supabase.from('pedidos_cabecera').update(payload).eq('id_pedido', idFilter).select();

  let attempts = 0;
  while (res.error && attempts < 5) {
    attempts++;
    const errMsg = res.error.message || '';
    const match = errMsg.match(/Could not find the '([^']+)' column/) ||
                  errMsg.match(/column "([^"]+)" of relation/) ||
                  errMsg.match(/column '([^']+)'/);

    if (match && match[1]) {
      const missingCol = match[1];
      console.warn(`[pedidosService] Auto-stripping missing schema column '${missingCol}' from update and retrying (attempt ${attempts})...`);
      delete payload[missingCol];
      res = await supabase.from('pedidos_cabecera').update(payload).eq('id_pedido', idFilter).select();
    } else {
      break;
    }
  }

  return res;
}

async function fetchAndAssemblePedidosColores(client: any): Promise<Pedido[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: headers, error: hError } = await client
    .from('pedidos_cabecera')
    .select('*')
    .or(`fecha_hora.gte.${thirtyDaysAgo.toISOString()},estado_comanda.not.in.("entregado_cobrado","cancelado")`)
    .order('fecha_hora', { ascending: false });
    
  if (hError) {
    console.error('Error fetching pedidos headers from Supabase:', hError);
    throw hError;
  }
  
  if (!headers || headers.length === 0) return [];

  const headerIds = headers.map(h => h.id_pedido);
  let details: any[] = [];
  try {
    const { data: dData, error: dError } = await client
      .from('pedido_detalle')
      .select('*')
      .in('id_pedido', headerIds);
    if (!dError && dData) {
      details = dData;
    }
  } catch (dErr) {
    console.warn('[pedidosService] pedido_detalle no disponible en Supabase, usando items de cabecera');
  }

  return headers.map(header => hydratePedido(header, details));
}

async function fetchAndAssemblePedidosFromSheets(): Promise<Pedido[]> {
  try {
    const [headers, details] = await Promise.all([
      sheetsService.getRows('pedidos_cabecera'),
      sheetsService.getRows('pedido_detalle')
    ]);
    if (!headers || !Array.isArray(headers) || headers.length === 0) return [];
    return headers.map(header => hydratePedido(header, details || []));
  } catch (err) {
    console.warn('[pedidosService] Error fetching pedidos from Google Sheets:', err);
    return [];
  }
}

export const pedidosService = {
  async list(forceFresh: boolean = false): Promise<Pedido[]> {
    const cached = (!forceFresh && typeof localStorage !== 'undefined') ? localStorage.getItem(CACHE_KEY) : null;
    const client = tryGetActiveSupabaseClient();

    // Stale-While-Revalidate: si hay datos en caché, devolver de inmediato y refrescar
    if (cached && !forceFresh) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          if (client) {
            setTimeout(async () => {
              try {
                const assembled = await fetchAndAssemblePedidosColores(client);
                if (assembled.length > 0 && typeof localStorage !== 'undefined') {
                  localStorage.setItem(CACHE_KEY, JSON.stringify(assembled));
                }
              } catch (e) {
                console.warn('Background Supabase pedidos cache refresh failed:', e);
              }
            }, 500);
          }

          return parsed.map(p => ({
            ...p,
            fecha_hora: new Date(p.fecha_hora),
            fecha_descuento_stock: p.fecha_descuento_stock ? new Date(p.fecha_descuento_stock) : undefined,
            fecha_inicio_cocina: p.fecha_inicio_cocina ? new Date(p.fecha_inicio_cocina) : undefined,
            fecha_listo: p.fecha_listo ? new Date(p.fecha_listo) : undefined
          }));
        }
      } catch (e) {
        console.warn('Failed parsing pedidos cache:', e);
      }
    }

    // 1. Supabase como almacenamiento prioritario para pedidos_cabecera
    if (client) {
      try {
        const assembled = await fetchAndAssemblePedidosColores(client);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(assembled));
          } catch {}
        }
        return assembled;
      } catch (supaErr) {
        console.warn('[pedidosService.list] Error en Supabase pedidos_cabecera, recurriendo a Sheets:', supaErr);
      }
    }

    // 2. Google Sheets como respaldo si Supabase no está configurado o falla
    if (sheetsService.isConfigured()) {
      try {
        const assembled = await fetchAndAssemblePedidosFromSheets();
        if (assembled.length > 0) {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(CACHE_KEY, JSON.stringify(assembled));
          }
          return assembled;
        }
      } catch (err) {
        console.warn('Sheets fetch for pedidos failed:', err);
      }
    }

    return [];
  },

  async fetchSingle(id: string): Promise<Pedido | null> {
    const client = tryGetActiveSupabaseClient();
    if (client) {
      try {
        const { data: header, error: hError } = await client
          .from('pedidos_cabecera')
          .select('*')
          .eq('id_pedido', id)
          .maybeSingle();

        if (!hError && header) {
          let details: any[] = [];
          try {
            const { data: dData } = await client
              .from('pedido_detalle')
              .select('*')
              .eq('id_pedido', id);
            if (dData) details = dData;
          } catch {}

          return hydratePedido(header, details);
        }
      } catch (err) {
        console.warn(`[pedidosService.fetchSingle] Error consultando Supabase #${id}:`, err);
      }
    }

    if (sheetsService.isConfigured()) {
      const list = await this.list();
      return list.find(p => String(p.id_pedido) === String(id)) || null;
    }

    return null;
  },

  async getById(id: string): Promise<Pedido | null> {
    const list = await this.list();
    return list.find(p => String(p.id_pedido) === String(id)) || null;
  },

  async create(pedido: Pedido): Promise<Pedido> {
    const { stockEngine } = await import('./stock/stockEngine');
    pedido.items.forEach(item => stockEngine.validatePedidoItem(item));
    try {
      await this.upsert([pedido]);
    } catch (err) {
      console.warn('pedidosService.create failed remote push:', err);
    }
    return pedido;
  },

  async update(id: string, fields: Partial<Pedido>, fromSyncQueue: boolean = false): Promise<void> {
    invalidateCache();
    const cleanNumericId = sanitizePedidoId(id);
    if (!cleanNumericId) {
      console.warn(`[pedidosService.update] ID no numérico o inválido descartado: ${id}`);
      if (fromSyncQueue) return;
      return;
    }
    const cleanId = String(cleanNumericId);

    // Map fields to header columns
    const headerFields: any = {};
    if (fields.estado_comanda !== undefined) headerFields.estado_comanda = fields.estado_comanda;
    if (fields.observaciones !== undefined) headerFields.observaciones = fields.observaciones;
    if (fields.minutos_transcurridos !== undefined) headerFields.minutos_transcurridos = fields.minutos_transcurridos;
    if (fields.tiempo_despacho_minutos !== undefined) headerFields.tiempo_despacho_minutos = fields.tiempo_despacho_minutos;
    if (fields.segundos_en_listo !== undefined) headerFields.segundos_en_listo = fields.segundos_en_listo;
    // NUNCA actualizar id_mesa/numero_mesa desde un update parcial para evitar mover/combinar comandas por error
    if (fields.items !== undefined) headerFields.items = JSON.stringify(fields.items);
    if (fields.fecha_inicio_cocina !== undefined) {
      headerFields.fecha_inicio_cocina = fields.fecha_inicio_cocina
        ? new Date(fields.fecha_inicio_cocina).toISOString()
        : null;
    }
    if (fields.fecha_listo !== undefined) {
      headerFields.fecha_listo = fields.fecha_listo
        ? new Date(fields.fecha_listo).toISOString()
        : null;
    }
    if (fields.stock_descontado !== undefined) headerFields.stock_descontado = fields.stock_descontado;
    if (fields.fecha_descuento_stock !== undefined) {
      headerFields.fecha_descuento_stock = fields.fecha_descuento_stock
        ? new Date(fields.fecha_descuento_stock).toISOString()
        : null;
    }
    if (fields.nombre_cliente !== undefined) headerFields.nombre_cliente = fields.nombre_cliente;
    if (fields.telefono_cliente !== undefined) headerFields.telefono_cliente = fields.telefono_cliente;
    if (fields.direccion_cliente !== undefined) headerFields.direccion_cliente = fields.direccion_cliente;
    if (fields.costo_envio !== undefined) headerFields.costo_envio = fields.costo_envio;
    if (fields.zona_envio_id !== undefined) headerFields.zona_envio_id = fields.zona_envio_id;

    console.log(`[pedidosService.update] Inicio id=${cleanId}, campos:`, Object.keys(headerFields));

    let savedToSupabase = false;

    // 1. Supabase como almacenamiento prioritario para pedidos_cabecera
    const supabase = tryGetActiveSupabaseClient();
    if (supabase) {
      try {
        if (Object.keys(headerFields).length > 0) {
          let { error, data } = await safeUpdateHeader(supabase, cleanId, headerFields);
          if (!error && (!data || data.length === 0)) {
            const headerObj = {
              id_pedido: cleanId,
              numero_mesa: fields.numero_mesa || 'Mesa',
              mozo: fields.mozo || 'Mozo',
              estado_comanda: fields.estado_comanda || 'pendiente',
              items: fields.items ? (typeof fields.items === 'string' ? fields.items : JSON.stringify(fields.items)) : '[]',
              fecha_hora: fields.fecha_hora ? new Date(fields.fecha_hora).toISOString() : new Date().toISOString(),
              ...headerFields
            };
            await safeUpsertHeader(supabase, headerObj);
          }
          savedToSupabase = true;
        }

        if (fields.items !== undefined) {
          try {
            const details = serializePedidoDetails({
              ...fields,
              id_pedido: id,
              id_mesa: fields.id_mesa ?? 0,
              numero_mesa: fields.numero_mesa ?? '',
              mozo: fields.mozo ?? '',
              estado_comanda: fields.estado_comanda ?? 'pendiente',
              items: fields.items,
              fecha_hora: fields.fecha_hora ?? new Date(),
              minutos_transcurridos: fields.minutos_transcurridos ?? 0,
              origen: fields.origen ?? 'Mozo'
            });

            await supabase.from('pedido_detalle').delete().eq('id_pedido', id);
            if (details.length > 0) {
              let { error: detError } = await supabase.from('pedido_detalle').insert(details);
              if (detError && detError.message?.includes('precio_unitario')) {
                const fallbackDetails = details.map(d => {
                  const copy = { ...d };
                  delete copy.precio_unitario;
                  return copy;
                });
                await supabase.from('pedido_detalle').insert(fallbackDetails);
              }
            }
          } catch {}
        }
      } catch (supaErr) {
        console.warn('[pedidosService.update] Error actualizando en Supabase:', supaErr);
      }
    }

    // 2. Google Sheets como respaldo / espejo secundario
    let savedToSheets = false;
    if (sheetsService.isConfigured()) {
      try {
        const sheetHeader: any = { id_pedido: cleanId, ...headerFields };
        if (fields.items !== undefined) {
          sheetHeader.items = JSON.stringify(fields.items);
        }
        await sheetsService.upsert('pedidos_cabecera', sheetHeader, 'id_pedido');

        if (fields.items !== undefined && Array.isArray(fields.items) && fields.items.length > 0) {
          const details = serializePedidoDetails({
            ...fields,
            id_pedido: cleanId,
            id_mesa: fields.id_mesa ?? 0,
            numero_mesa: fields.numero_mesa ?? '',
            mozo: fields.mozo ?? '',
            estado_comanda: fields.estado_comanda ?? 'pendiente',
            items: fields.items,
            fecha_hora: fields.fecha_hora ?? new Date(),
            minutos_transcurridos: fields.minutos_transcurridos ?? 0,
            origen: fields.origen ?? 'Mozo'
          } as Pedido);
          await sheetsService.upsert('pedido_detalle', details, 'id_detalle');
        }
        savedToSheets = true;
      } catch (sheetsErr) {
        console.warn('[pedidosService.update] Error guardando respaldo en Google Sheets:', sheetsErr);
      }
    }

    if (!savedToSupabase && !savedToSheets && !fromSyncQueue) {
      const { syncQueueService } = await import('./syncQueueService');
      syncQueueService.enqueue('update_pedido_estado', { id: cleanId, fields });
    }

    if (fields.estado_comanda === 'entregado' || fields.estado_comanda === 'entregado_cobrado') {
      const { insumosService } = await import('./insumosService');
      insumosService.descontarStockPorPedido(id).catch(err =>
        console.error('Error in deferred stock deduction:', err)
      );
    }
  },

  async upsert(pedidos: Pedido[], fromSyncQueue: boolean = false): Promise<void> {
    const { stockEngine } = await import('./stock/stockEngine');
    for (const ped of pedidos) {
      ped.items.forEach(item => stockEngine.validatePedidoItem(item));
    }
    invalidateCache();

    // 1. Supabase como almacenamiento prioritario para pedidos_cabecera
    const supabase = tryGetActiveSupabaseClient();
    if (supabase) {
      for (const ped of pedidos) {
        try {
          let activeId: string | null = null;
          let isExisting = false;

          const { data: existingHeader } = await supabase
            .from('pedidos_cabecera')
            .select('id_pedido')
            .eq('id_pedido', ped.id_pedido)
            .maybeSingle();

          if (existingHeader) {
            isExisting = true;
            activeId = existingHeader.id_pedido;
          } else if (
            ped.estado_comanda !== 'entregado_cobrado' &&
            ped.estado_comanda !== 'cancelado' &&
            ped.id_mesa !== 999 &&
            ped.id_mesa !== 998 &&
            !String(ped.numero_mesa || '').toUpperCase().startsWith('DELIVERY') &&
            !String(ped.numero_mesa || '').toUpperCase().startsWith('RETIRO')
          ) {
            const { data: activeHeaders } = await supabase
              .from('pedidos_cabecera')
              .select('id_pedido')
              .eq('id_mesa', ped.id_mesa)
              .in('estado_comanda', ['abierta', 'pendiente', 'en_cocina', 'listo', 'entregado']);

            if (activeHeaders && activeHeaders.length > 0) {
              isExisting = true;
              activeId = activeHeaders[0].id_pedido;
            }
          }

          if (isExisting && activeId !== null) {
            const { data: dbHeader } = await supabase
              .from('pedidos_cabecera')
              .select('estado_comanda')
              .eq('id_pedido', activeId)
              .maybeSingle();

            if (dbHeader && ['entregado_cobrado', 'cancelado'].includes(dbHeader.estado_comanda)) {
              continue;
            }

            const cabeceraUpdate = serializePedidoHeader(ped);
            delete (cabeceraUpdate as any).idempotency_key;

            await safeUpdateHeader(supabase, activeId, cabeceraUpdate);

            try {
              await supabase.from('pedido_detalle').delete().eq('id_pedido', activeId);

              if (ped.items && ped.items.length > 0) {
                const details = serializePedidoDetails({ ...ped, id_pedido: activeId });
                let { error: dError } = await supabase.from('pedido_detalle').insert(details);
                if (dError && dError.message?.includes('precio_unitario')) {
                  const fallbackDetails = details.map(d => {
                    const copy = { ...d };
                    delete copy.precio_unitario;
                    return copy;
                  });
                  await supabase.from('pedido_detalle').insert(fallbackDetails);
                }
              }
            } catch {}
          } else {
            const cabecera = serializePedidoHeader(ped);
            await safeUpsertHeader(supabase, cabecera);

            try {
              if (ped.items && ped.items.length > 0) {
                const details = serializePedidoDetails(ped);
                let { error: dError } = await supabase.from('pedido_detalle').insert(details);
                if (dError && dError.message?.includes('precio_unitario')) {
                  const fallbackDetails = details.map(d => {
                    const copy = { ...d };
                    delete copy.precio_unitario;
                    return copy;
                  });
                  await supabase.from('pedido_detalle').insert(fallbackDetails);
                }
              }
            } catch {}
          }
        } catch (err) {
          console.warn(`[pedidosService.upsert] Supabase upsert error para pedido ${ped.id_pedido}:`, err);
        }
      }
    }

    // 2. Google Sheets como respaldo / espejo secundario
    if (sheetsService.isConfigured()) {
      try {
        const headers = pedidos.map(serializePedidoHeader);
        const details = pedidos.flatMap(serializePedidoDetails);
        await sheetsService.upsert('pedidos_cabecera', headers, 'id_pedido');
        if (details.length > 0) {
          await sheetsService.upsert('pedido_detalle', details, 'id_detalle');
        }
      } catch (sheetErr) {
        console.warn('[pedidosService.upsert] Error guardando respaldo en Google Sheets:', sheetErr);
      }
    }
  },

  async agregarItemsAComandaExistente(idPedido: string, nuevosItems: PedidoItem[], fromSyncQueue: boolean = false): Promise<void> {
    invalidateCache();

    // 1. Supabase como almacenamiento prioritario
    const supabase = tryGetActiveSupabaseClient();
    if (supabase) {
      try {
        const { data: dbHeader } = await supabase
          .from('pedidos_cabecera')
          .select('items')
          .eq('id_pedido', idPedido)
          .maybeSingle();

        let currentItems: PedidoItem[] = [];
        if (dbHeader && dbHeader.items) {
          try {
            currentItems = typeof dbHeader.items === 'string' ? JSON.parse(dbHeader.items) : dbHeader.items;
            if (!Array.isArray(currentItems)) currentItems = [];
          } catch {}
        }

        const combinedItems = [...currentItems, ...nuevosItems];
        await supabase
          .from('pedidos_cabecera')
          .update({ items: JSON.stringify(combinedItems) })
          .eq('id_pedido', idPedido);

        try {
          const rows = nuevosItems.map((item, index) => ({
            id_detalle: `${idPedido}_${item.id_producto}_${Date.now()}_${index}`,
            id_pedido: idPedido,
            id_producto: item.id_producto,
            nombre: item.nombre,
            cantidad: item.cantidad,
            categoria: item.categoria,
            precio_unitario: item.precio_unitario ?? 0,
            estado: 'pendiente'
          }));
          await supabase.from('pedido_detalle').insert(rows);
        } catch {}
      } catch (err) {
        console.warn('[pedidosService.agregarItems] Supabase warning:', err);
      }
    }

    // 2. Google Sheets como respaldo / espejo secundario
    if (sheetsService.isConfigured()) {
      try {
        const rows = nuevosItems.map((item, index) => ({
          id_detalle: `${idPedido}_${item.id_producto}_${Date.now()}_${index}`,
          id_pedido: idPedido,
          id_producto: item.id_producto,
          nombre: item.nombre,
          cantidad: item.cantidad,
          categoria: item.categoria,
          precio_unitario: item.precio_unitario ?? 0,
          estado: 'pendiente'
        }));
        await sheetsService.upsert('pedido_detalle', rows, 'id_detalle');

        const currentList = await this.list();
        const existing = currentList.find(p => String(p.id_pedido) === String(idPedido));
        if (existing) {
          const combinedItems = [...existing.items, ...nuevosItems];
          await sheetsService.upsert('pedidos_cabecera', {
            id_pedido: String(idPedido),
            items: JSON.stringify(combinedItems)
          }, 'id_pedido');
        }
      } catch (e) {
        console.warn('[pedidosService] Sheets agregarItems warning:', e);
      }
    }
  },

  async remove(id: string): Promise<boolean> {
    invalidateCache();
    let handled = false;

    // 1. Supabase como almacenamiento prioritario
    const supabase = tryGetActiveSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('pedidos_cabecera').delete().eq('id_pedido', id.toString());
        handled = true;
      } catch (err) {
        console.warn('[pedidosService.remove] Supabase delete warning:', err);
      }
    }

    // 2. Google Sheets como respaldo
    if (sheetsService.isConfigured()) {
      try {
        await sheetsService.upsert('pedidos_cabecera', {
          id_pedido: String(id),
          estado_comanda: 'cancelado'
        }, 'id_pedido');
        handled = true;
      } catch (e) {
        console.warn('[pedidosService.remove] Sheets cancel warning:', e);
      }
    }

    return handled;
  },

  subscribe(callback: (payload: any) => void) {
    const supabase = tryGetActiveSupabaseClient();
    if (!supabase) return null;
    
    try {
      const channel = supabase
        .channel('realtime:pedidos_cabecera')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_cabecera' }, callback)
        .subscribe();
      return channel;
    } catch (err) {
      console.warn('Failed to create realtime subscription channel:', err);
      return null;
    }
  }
};
