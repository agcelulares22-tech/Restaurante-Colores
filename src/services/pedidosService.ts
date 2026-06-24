import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { Pedido, PedidoItem } from '../types';

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

  const isDelivery = header.id_mesa === null && String(header.numero_mesa || '').toUpperCase().startsWith('DELIVERY');
  const idMesa = isDelivery ? 999 : header.id_mesa;

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

export const serializePedidoHeader = (pedido: Pedido) => ({
  id_pedido: pedido.id_pedido,
  idempotency_key: pedido.idempotency_key ?? null,
  id_mesa: (pedido.id_mesa === 999 || String(pedido.numero_mesa || '').toUpperCase().startsWith('DELIVERY')) ? null : (pedido.id_mesa || null),
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
  items: JSON.stringify(pedido.items),
  nombre_cliente: pedido.nombre_cliente ?? null,
  telefono_cliente: pedido.telefono_cliente ?? null,
  direccion_cliente: pedido.direccion_cliente ?? null,
  costo_envio: pedido.costo_envio ?? null,
  zona_envio_id: pedido.zona_envio_id ?? null
});

export const serializePedidoDetails = (pedido: Pedido) => pedido.items.map((item, index) => ({
  id_detalle: `${pedido.id_pedido}_${String(index).padStart(4, '0')}`,
  id_pedido: pedido.id_pedido,
  id_producto: item.id_producto,
  nombre: item.nombre,
  cantidad: item.cantidad,
  categoria: item.categoria,
  precio_unitario: item.precio_unitario ?? null,
}));

export const pedidosService = {
  async list(): Promise<Pedido[]> {
    const supabase = tryGetActiveSupabaseClient();
    if (!supabase) return [];
    
    // 1. Fetch headers
    const { data: headers, error: hError } = await supabase
      .from('pedidos_cabecera')
      .select('*')
      .order('fecha_hora', { ascending: false });
      
    if (hError) {
      console.error('Error fetching pedidos headers:', hError);
      throw hError;
    }
    
    if (!headers || headers.length === 0) return [];

    // 2. Fetch details filtered by header IDs only
    const headerIds = headers.map(h => h.id_pedido);
    const { data: details, error: dError } = await supabase
      .from('pedido_detalle')
      .select('*')
      .in('id_pedido', headerIds);
      
    if (dError) {
      console.error('Error fetching pedido details:', dError);
      throw dError;
    }

    return headers.map(header => hydratePedido(header, details || []));
  },

  async getById(id: string): Promise<Pedido | null> {
    const list = await this.list();
    return list.find(p => String(p.id_pedido) === String(id)) || null;
  },

  async create(pedido: Pedido): Promise<Pedido> {
    try {
      await this.upsert([pedido]);
    } catch (err) {
      console.warn('pedidosService.create failed remote push:', err);
    }
    return pedido;
  },

  async update(id: string, fields: Partial<Pedido>, fromSyncQueue: boolean = false): Promise<void> {
    const supabase = tryGetActiveSupabaseClient();
    if (!supabase) {
      if (!fromSyncQueue) {
        console.warn(`[pedidosService.update] Supabase no disponible. Encolando actualización offline para pedido ${id}`);
        const { syncQueueService } = await import('./syncQueueService');
        syncQueueService.enqueue('update_pedido_estado', { id, fields });
      } else {
        throw new Error('Supabase client not available during sync queue processing');
      }
      return;
    }
    
    console.log(`[pedidosService.update] Inicio id=${id}, campos:`, JSON.stringify(fields, (k, v) => v instanceof Date ? v.toISOString() : v));

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

    try {
      if (Object.keys(headerFields).length > 0) {
        console.log(`[pedidosService.update] Enviando a pedidos_cabecera:`, headerFields);
        let { error, data } = await supabase
          .from('pedidos_cabecera')
          .update(headerFields)
          .eq('id_pedido', id.toString())
          .select();
        
        console.log(`[pedidosService.update] Respuesta update id=${id}:`, { error, data });

        // Dynamic schema fallback: if idempotency_key is missing, strip and retry
        if (error && error.message?.includes('idempotency_key')) {
          console.warn('idempotency_key column missing in update, retrying without it...');
          const fallbackFields = { ...headerFields };
          delete fallbackFields.idempotency_key;
          const res = await supabase.from('pedidos_cabecera').update(fallbackFields).eq('id_pedido', id.toString()).select();
          error = res.error;
          console.log(`[pedidosService.update] Respuesta retry sin idempotency_key id=${id}:`, { error: res.error, data: res.data });
        }

        if (error) {
          console.error(`Error updating header for pedido ${id}:`, error);
          throw error;
        }
      }

      if (fields.items !== undefined) {
        // Re-upsert details
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

        // Delete existing details
        const { error: deleteError } = await supabase
          .from('pedido_detalle')
          .delete()
          .eq('id_pedido', id);
        if (deleteError) {
          console.error('Error deleting previous order details:', deleteError);
          throw deleteError;
        }

        if (details.length > 0) {
          let { error: detError } = await supabase.from('pedido_detalle').insert(details);
          
          // Dynamic schema fallback: if precio_unitario is missing, strip and retry
          if (detError && detError.message?.includes('precio_unitario')) {
            console.warn('precio_unitario column missing in update details insert, retrying without it...');
            const fallbackDetails = details.map(d => {
              const copy = { ...d };
              delete copy.precio_unitario;
              return copy;
            });
            const res = await supabase.from('pedido_detalle').insert(fallbackDetails);
            detError = res.error;
          }

          if (detError) {
            console.error('Error inserting details in update:', detError);
            throw detError;
          }
        }
      }

      if (fields.estado_comanda === 'entregado' || fields.estado_comanda === 'entregado_cobrado') {
        const { insumosService } = await import('./insumosService');
        insumosService.descontarStockPorPedido(id).catch(err =>
          console.error('Error in deferred stock deduction:', err)
        );
      }
    } catch (error) {
      console.warn(`Error in remote update for pedido ${id}. Enqueueing action to SyncQueue.`, error);
      if (!fromSyncQueue) {
        const { syncQueueService } = await import('./syncQueueService');
        syncQueueService.enqueue('update_pedido_estado', { id, fields });
      }
      throw error;
    }
  },

  async upsert(pedidos: Pedido[], fromSyncQueue: boolean = false): Promise<void> {
    const supabase = tryGetActiveSupabaseClient();
    if (!supabase) {
      if (fromSyncQueue) {
        throw new Error('Supabase client not available during sync queue processing');
      }
      console.warn('Supabase is not configured or offline. Skipping database upsert.');
      return;
    }
    
    for (const ped of pedidos) {
      try {
        console.log(`[pedidosService.upsert] Procesando pedido id=${ped.id_pedido}, estado=${ped.estado_comanda}, mesa=${ped.numero_mesa}`);
        let activeId: string | null = null;
        let isExisting = false;

        // 1. Verificar si esta comanda específica ya existe en la base de datos por ID
        console.log(`[pedidosService.upsert] Buscando id=${ped.id_pedido} en pedidos_cabecera`);
        const { data: existingHeader, error: checkError } = await supabase
          .from('pedidos_cabecera')
          .select('id_pedido')
          .eq('id_pedido', ped.id_pedido)
          .maybeSingle();

        console.log(`[pedidosService.upsert] Resultado búsqueda id=${ped.id_pedido}:`, { existingHeader, checkError });

        if (existingHeader) {
          isExisting = true;
          activeId = existingHeader.id_pedido;
        } else if (
          ped.estado_comanda !== 'entregado_cobrado' &&
          ped.estado_comanda !== 'cancelado' &&
          ped.id_mesa !== 999 &&
          !String(ped.numero_mesa || '').toUpperCase().startsWith('DELIVERY')
        ) {
          // 2. Si no existe y es una comanda activa nueva, buscar si la mesa tiene otra activa
          const { data: activeHeaders, error: findError } = await supabase
            .from('pedidos_cabecera')
            .select('id_pedido')
            .eq('id_mesa', ped.id_mesa)
            .in('estado_comanda', ['abierta', 'pendiente', 'en_cocina', 'listo', 'entregado']);

          if (findError) {
            console.error('Error searching active comanda for table:', findError);
            throw findError;
          }

          if (activeHeaders && activeHeaders.length > 0) {
            isExisting = true;
            activeId = activeHeaders[0].id_pedido;
          }
        }

        if (isExisting && activeId !== null) {
          // Evitar que colas de sincronización offline (SyncQueue) reviertan comandas ya cobradas o canceladas
          const { data: dbHeader } = await supabase
            .from('pedidos_cabecera')
            .select('estado_comanda')
            .eq('id_pedido', activeId)
            .maybeSingle();

          if (dbHeader && ['entregado_cobrado', 'cancelado'].includes(dbHeader.estado_comanda)) {
            console.log(`[upsert] Pedido #${activeId} ya está cobrado/cancelado (${dbHeader.estado_comanda}). Omitiendo para evitar reversiones.`);
            continue;
          }

          // A. Ya existe una comanda activa -> Se actualiza la cabecera completa y se sincronizan los detalles
          const cabeceraUpdate = serializePedidoHeader(ped);
          // Importante: no borrar id_mesa ni id_pedido para que Supabase pueda filtrar/relacionar correctamente
          delete (cabeceraUpdate as any).idempotency_key;

          console.log(`[pedidosService.upsert] Actualizando cabecera id=${activeId}:`, cabeceraUpdate);

          const { data: updateData, error: hError } = await supabase
            .from('pedidos_cabecera')
            .update(cabeceraUpdate)
            .eq('id_pedido', activeId)
            .select();

          console.log(`[pedidosService.upsert] Respuesta update cabecera id=${activeId}:`, { updateData, hError });

          if (hError) {
            console.error('Error updating active order header in upsert:', hError);
            throw hError;
          }

          // Sincronizar todos los detalles (borrar viejos e insertar los actuales)
          const { error: deleteError } = await supabase
            .from('pedido_detalle')
            .delete()
            .eq('id_pedido', activeId);

          if (deleteError) {
            console.error('Error deleting previous order details in upsert:', deleteError);
            throw deleteError;
          }

          if (ped.items && ped.items.length > 0) {
            const details = serializePedidoDetails({ ...ped, id_pedido: activeId });
            let { error: dError } = await supabase.from('pedido_detalle').insert(details);
            
            if (dError && dError.message?.includes('precio_unitario')) {
              const fallbackDetails = details.map(d => {
                const copy = { ...d };
                delete copy.precio_unitario;
                return copy;
              });
              const res = await supabase.from('pedido_detalle').insert(fallbackDetails);
              dError = res.error;
            }

            if (dError) {
              console.error('Error inserting details in upsert update:', dError);
              throw dError;
            }
          }

        } else {
          // B. No existe comanda activa -> Crear cabecera y luego insertar detalles
          const cabecera = serializePedidoHeader(ped);
          console.log(`[pedidosService.upsert] Insertando nueva cabecera id=${ped.id_pedido}:`, cabecera);
          let { data: insertData, error: hError } = await supabase.from('pedidos_cabecera').upsert(cabecera).select();
          
          console.log(`[pedidosService.upsert] Respuesta insert cabecera id=${ped.id_pedido}:`, { insertData, hError });
          if (hError && hError.message?.includes('idempotency_key')) {
            const fallbackCabecera = { ...cabecera };
            delete fallbackCabecera.idempotency_key;
            const res = await supabase.from('pedidos_cabecera').upsert(fallbackCabecera);
            hError = res.error;
          }

          if (hError) {
            console.error('Error creating order header:', hError);
            throw hError;
          }

          if (ped.items && ped.items.length > 0) {
            const details = serializePedidoDetails(ped);
            let { error: dError } = await supabase.from('pedido_detalle').insert(details);
            
            if (dError && dError.message?.includes('precio_unitario')) {
              const fallbackDetails = details.map(d => {
                const copy = { ...d };
                delete copy.precio_unitario;
                return copy;
              });
              const res = await supabase.from('pedido_detalle').insert(fallbackDetails);
              dError = res.error;
            }

            if (dError) {
              console.error('Error inserting order details:', dError);
              throw dError;
            }
          }
        }
      } catch (err) {
        console.warn(`Error in remote upsert for order ${ped.id_pedido}. Enqueueing to SyncQueue.`, err);
        if (!fromSyncQueue) {
          const { syncQueueService } = await import('./syncQueueService');
          syncQueueService.enqueue('upsert_pedido', ped);
        }
        throw err;
      }
    }
  },

  async agregarItemsAComandaExistente(idPedido: string, nuevosItems: PedidoItem[], fromSyncQueue: boolean = false): Promise<void> {
    const supabase = tryGetActiveSupabaseClient();
    if (!supabase) {
      if (!fromSyncQueue) {
        const { syncQueueService } = await import('./syncQueueService');
        syncQueueService.enqueue('upsert_pedido', {
          id_pedido: idPedido,
          items: nuevosItems,
          is_accumulation: true
        });
      } else {
        throw new Error('Supabase client not available during sync queue processing');
      }
      return;
    }

    // Insert each item as detail row
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

    const { error: insertError } = await supabase
      .from('pedido_detalle')
      .insert(rows);

    if (insertError) {
      console.error('Error inserting details in accumulation:', insertError);
      throw insertError;
    }

    // Update items list in cabecera (JSON fallback)
    const { data: todosLosDetalles, error: selectError } = await supabase
      .from('pedido_detalle')
      .select('*')
      .eq('id_pedido', idPedido);

    if (selectError) {
      console.error('Error fetching all details to synchronize header items:', selectError);
      throw selectError;
    }

    const updatedItems = (todosLosDetalles || []).map(d => ({
      id_producto: d.id_producto || '',
      nombre: d.nombre,
      readonly: true,
      cantidad: d.cantidad,
      categoria: d.categoria,
      precio_unitario: d.precio_unitario ?? undefined
    }));

    const { error: updateError } = await supabase
      .from('pedidos_cabecera')
      .update({ items: JSON.stringify(updatedItems) })
      .eq('id_pedido', idPedido);

    if (updateError) {
      console.error('Error updating items JSON in header:', updateError);
      throw updateError;
    }
  },

  async remove(id: string): Promise<boolean> {
    const supabase = tryGetActiveSupabaseClient();
    if (!supabase) return false;
    
    try {
      const { error } = await supabase.from('pedidos_cabecera').delete().eq('id_pedido', id.toString());
      if (error) {
        console.error('Error deleting order:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Failed to delete remote order:', err);
      return false;
    }
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
