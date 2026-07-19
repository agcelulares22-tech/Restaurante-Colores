import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Mesa, Insumo, ProductoMenu, RecetaEscandallo, Pedido, Merma, EventoLog, Reserva, Usuario } from '../types';
import { 
  INITIAL_USUARIOS,
  INITIAL_MESAS, 
  INITIAL_INSUMOS, 
  INITIAL_PRODUCTOS_MENU, 
  INITIAL_RECETAS_ESCANDALLO, 
  INITIAL_PEDIDOS 
} from '../data/initialData';
import { useToast } from '../components/ToastContainer';
import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { AppView, canAccessView, getAllowedViews } from '../lib/permissions';
import { lotesService } from '../services/lotesService';
import { cajaService } from '../services/cajaService';
import { stockEngine } from '../services/stock/stockEngine';
import type { BackupSnapshotData } from '../services/backupsService';
import { 
  getSupabaseClient,
  resetSupabaseInstance,
  dbFetchMesas,
  dbFetchInsumos,
  dbFetchProductosMenu,
  dbFetchRecetas,
  dbFetchPedidos,
  dbSavePedidoComplex,
  dbUpsertMesas,
  dbUpsertInsumos,
  dbFetchMermas,
  dbUpsertMermas,
  dbRecordMovement,
  dbFetchUsuarios,
  dbUpsertProductosMenu,
  dbUpsertRecetas
} from '../supabase';
import { createClientPedidoId } from '../lib/pedidoIds';

function isSameTable(p1: { id_mesa?: any; numero_mesa?: string }, p2: { id_mesa?: any; numero_mesa?: string }): boolean {
  const isP1Delivery = String(p1.numero_mesa || '').toUpperCase().startsWith('DELIVERY');
  const isP2Delivery = String(p2.numero_mesa || '').toUpperCase().startsWith('DELIVERY');
  
  if (isP1Delivery || isP2Delivery) {
    const norm1 = String(p1.numero_mesa || '').toLowerCase().trim();
    const norm2 = String(p2.numero_mesa || '').toLowerCase().trim();
    return norm1 !== '' && norm1 === norm2;
  }

  if (p1.id_mesa !== undefined && p1.id_mesa !== null && p2.id_mesa !== undefined && p2.id_mesa !== null) {
    if (String(p1.id_mesa) === String(p2.id_mesa)) return true;
  }
  const norm1 = String(p1.numero_mesa || '').toLowerCase().replace(/mesa\s+/gi, '').trim();
  const norm2 = String(p2.numero_mesa || '').toLowerCase().replace(/mesa\s+/gi, '').trim();
  return norm1 !== '' && norm1 === norm2;
}

export function useAppState() {
  const { toast } = useToast();
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Global Synced States ---
  const [isStreamlitLoggedIn, setIsStreamlitLoggedIn] = useState<boolean>(() => (
    typeof window !== 'undefined' && window.sessionStorage.getItem('colores_pizzeria_session') === 'active'
  ));
  const [showCover, setShowCover] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('admin') === 'true' ? false : true;
    }
    return true;
  });
  const [permitirVentaSinStock, setPermitirVentaSinStock] = useState<boolean>(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>(INITIAL_USUARIOS);
  const [mesas, setMesas] = useState<Mesa[]>(INITIAL_MESAS);
  const [insumos, setInsumos] = useState<Insumo[]>(INITIAL_INSUMOS);
  const [productosMenu, setProductosMenu] = useState<ProductoMenu[]>(INITIAL_PRODUCTOS_MENU);
  const [recetas, setRecetas] = useState<RecetaEscandallo[]>(INITIAL_RECETAS_ESCANDALLO);
  const [pedidos, setPedidos] = useState<Pedido[]>(INITIAL_PEDIDOS);
  const [mermas, setMermas] = useState<Merma[]>([]);

  const [postLoginLoading, setPostLoginLoading] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncQueueSize, setSyncQueueSize] = useState<number>(0);

  const handleTriggerSync = useCallback(async () => {
    try {
      const { syncQueueService } = await import('../services/syncQueueService');
      await syncQueueService.processQueue();
      setSyncQueueSize(syncQueueService.getQueue().length);
      toast.success("Sincronización completada o intentada.");
    } catch (err: any) {
      toast.error(`Error al sincronizar: ${err?.message || err}`);
    }
  }, [toast]);

  useEffect(() => {
    const updateSyncState = () => {
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      import('../services/syncQueueService').then(({ syncQueueService }) => {
        setSyncQueueSize(syncQueueService.getQueue().length);
      });
    };

    updateSyncState();
    window.addEventListener('online', updateSyncState);
    window.addEventListener('offline', updateSyncState);
    window.addEventListener('sync-queue-changed', updateSyncState);

    return () => {
      window.removeEventListener('online', updateSyncState);
      window.removeEventListener('offline', updateSyncState);
      window.removeEventListener('sync-queue-changed', updateSyncState);
    };
  }, []);

  // Mapa O(1) de precio_venta para cálculos de ventas en toda la app
  const precioMap = useMemo(() => {
    const m = new Map<string, number>();
    productosMenu.forEach(p => m.set(p.id_producto, p.precio_venta));
    return m;
  }, [productosMenu]);

  // Helper log registrar
  const [logs, setLogs] = useState<EventoLog[]>([
    {
      id: 'init_log_1',
      tipo: 'sistema',
      mensaje: 'SISTEMA: Conexión establecida de forma segura. SQLite local cargada con éxito.',
      timestamp: new Date(Date.now() - 35 * 60 * 1000)
    },
    {
      id: 'init_log_2',
      tipo: 'sistema',
      mensaje: 'SISTEMA: Inicializando terminales para personal de Mozo, Cocina, Caja y Administrador.',
      timestamp: new Date(Date.now() - 34 * 60 * 1000)
    },
    {
      id: 'init_log_3',
      tipo: 'descuento_stock',
      mensaje: 'ESCANDALLO: Stock de materia prima cargado con 15 insumos controlados.',
      timestamp: new Date(Date.now() - 33 * 60 * 1000)
    }
  ]);

  const addLog = useCallback(
    (
      tipo: 'pedido_creado' | 'descuento_stock' | 'alerta_stock' | 'comanda_estado' | 'merma_registrada' | 'sistema', 
      mensaje: string
    ) => {
      const newLogItem: EventoLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        tipo,
        mensaje,
        timestamp: new Date()
      };
      setLogs(prev => [newLogItem, ...prev]);
    },
    []
  );

  const [supabaseTrigger, setSupabaseTrigger] = useState<number>(0);

  // Listen for Supabase client resets to trigger data re-sync
  useEffect(() => {
    const handleReset = () => {
      setSupabaseTrigger(prev => prev + 1);
    };
    window.addEventListener('supabase-client-reset', handleReset);
    return () => {
      window.removeEventListener('supabase-client-reset', handleReset);
    };
  }, []);

  // 1. Config loading effect (runs once on mount)
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/supabase-config');
        const data = await response.json();
        if (data.SUPABASE_URL && data.SUPABASE_ANON_KEY) {
          const defaultUrl = 'https://msmaksbtetcmoaiyywto.supabase.co';
          const currentUrl = localStorage.getItem('colores_pizzeria_supabase_url');
          const currentKey = localStorage.getItem('colores_pizzeria_supabase_anon_key');
          
          // Only overwrite if the user has no local configuration OR if the API returns a custom (non-default) URL
          if (!currentUrl || data.SUPABASE_URL !== defaultUrl) {
            if (currentUrl !== data.SUPABASE_URL || currentKey !== data.SUPABASE_ANON_KEY) {
              localStorage.removeItem('colores_pizzeria_cache_menu');
              localStorage.removeItem('colores_pizzeria_cache_categorias');
              localStorage.removeItem('colores_pizzeria_cache_proveedores');
              localStorage.removeItem('colores_pizzeria_cache_insumos');
              localStorage.removeItem('colores_pizzeria_cache_recetas');
              localStorage.setItem('colores_pizzeria_supabase_url', data.SUPABASE_URL);
              localStorage.setItem('colores_pizzeria_supabase_anon_key', data.SUPABASE_ANON_KEY);
              resetSupabaseInstance();
            }
          }
        }
      } catch (configErr) {
        console.warn('Could not fetch Supabase config from API:', configErr);
      }
    };
    loadConfig();
  }, []);

  // 2. Data load and Realtime sync effect
  useEffect(() => {
    let active = true;
    let channel: any = null;
    const client = getSupabaseClient();

    const loadData = async () => {
      try {
        const savedUsuarios = await dbFetchUsuarios();
        if (savedUsuarios && savedUsuarios.length > 0 && active) {
          setUsuarios(savedUsuarios);
        }
      } catch (err) {
        console.warn('Usuarios: no se pudo cargar la copia persistida.', err);
      }

      if (!client) return;

      try {
        const dbMesas = await dbFetchMesas();
        let dbInsumos = await dbFetchInsumos();
        let dbProducts = await dbFetchProductosMenu();
        let dbRecipes = await dbFetchRecetas();
        const dbPedidos = await dbFetchPedidos();
        const dbMermas = await dbFetchMermas();

        if (!active) return;

        if (dbProducts && dbProducts.length > 0) {
          const hasCocaCola = dbProducts.some(p => p.id_producto === 'prod_coca_cola_original');
          if (!hasCocaCola) {
            const cocaColaProducts = INITIAL_PRODUCTOS_MENU.filter(p => 
              p.id_producto.startsWith('prod_coca_cola') || 
              p.id_producto.startsWith('prod_sprite') || 
              p.id_producto.startsWith('prod_fanta')
            );
            if (cocaColaProducts.length > 0) {
              await dbUpsertProductosMenu(cocaColaProducts);
              
              const relatedInsumos = INITIAL_INSUMOS.filter(i => 
                i.id_insumo.startsWith('ins_beb_coca_cola') || 
                i.id_insumo.startsWith('ins_beb_sprite') || 
                i.id_insumo.startsWith('ins_beb_fanta')
              );
              if (relatedInsumos.length > 0) {
                await dbUpsertInsumos(relatedInsumos);
              }
              
              const relatedRecipes = INITIAL_RECETAS_ESCANDALLO.filter(r => 
                r.id_producto.startsWith('prod_coca_cola') || 
                r.id_producto.startsWith('prod_sprite') || 
                r.id_producto.startsWith('prod_fanta')
              );
              if (relatedRecipes.length > 0) {
                await dbUpsertRecetas(relatedRecipes);
              }
              
              dbProducts = await dbFetchProductosMenu();
              dbInsumos = await dbFetchInsumos();
              dbRecipes = await dbFetchRecetas();
            }
          }
        }

        if (!active) return;

        if ((dbMesas ?? []).length > 0) {
          setMesas((dbMesas ?? []).map(m => ({
            ...m,
            estado: m.estado || 'libre',
            comensales: m.comensales || undefined
          })));
        }
        if ((dbInsumos ?? []).length > 0) {
          setInsumos(dbInsumos ?? []);
        }
        if ((dbProducts ?? []).length > 0) {
          setProductosMenu(dbProducts ?? []);
        }
        if ((dbRecipes ?? []).length > 0) {
          setRecetas(dbRecipes ?? []);
        }
        if ((dbPedidos ?? []).length > 0) {
          setPedidos(dbPedidos ?? []);
        } else {
          const localPedidos = typeof window !== 'undefined' ? window.localStorage.getItem('colores_pizzeria_pedidos_local') : null;
          if (localPedidos) {
            try {
              const parsed = JSON.parse(localPedidos) as Pedido[];
              if (parsed.length > 0) {
                setPedidos(parsed.map(p => ({
                  ...p,
                  fecha_hora: new Date(p.fecha_hora),
                  fecha_descuento_stock: p.fecha_descuento_stock ? new Date(p.fecha_descuento_stock) : undefined,
                  fecha_inicio_cocina: p.fecha_inicio_cocina ? new Date(p.fecha_inicio_cocina) : undefined,
                  fecha_listo: p.fecha_listo ? new Date(p.fecha_listo) : undefined
                })));
              }
            } catch (err) {
              console.warn('Error parsing local pedidos:', err);
            }
          }
        }
        if ((dbMermas ?? []).length > 0) {
          setMermas(dbMermas ?? []);
        }
        addLog('sistema', 'SUPABASE: Auto-sincronización exitosa con servidor Supabase.');
      } catch (err) {
        console.warn('Supabase: Falló auto-sync en el arranque. Usando datos SQLite locales.', err);
      }
    };

    loadData();

    if (client) {
      channel = client
        .channel('realtime_pedidos_app')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_cabecera' }, async (payload: any) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          console.log('[Realtime] pedidos_cabecera event:', eventType, payload);
          if (!active) return;
          
          if (eventType === 'DELETE') {
            const idToDelete = String(oldRow.id_pedido);
            setPedidos(prev => prev.filter(p => String(p.id_pedido) !== idToDelete));
          } else {
            const idToFetch = String(newRow.id_pedido);
            const { pedidosService } = await import('../services/pedidosService');
            const updatedPedido = await pedidosService.fetchSingle(idToFetch);
            if (updatedPedido && active) {
              setPedidos(prev => {
                const exists = prev.some(p => String(p.id_pedido) === idToFetch);
                if (exists) {
                  return prev.map(p => String(p.id_pedido) === idToFetch ? updatedPedido : p);
                } else {
                  return [updatedPedido, ...prev];
                }
              });
            }
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_detalle' }, async (payload: any) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          console.log('[Realtime] pedido_detalle event:', eventType, payload);
          if (!active) return;
          
          const targetOrderId = String((newRow && newRow.id_pedido) || (oldRow && oldRow.id_pedido));
          if (targetOrderId && targetOrderId !== 'undefined') {
            const { pedidosService } = await import('../services/pedidosService');
            const updatedPedido = await pedidosService.fetchSingle(targetOrderId);
            if (updatedPedido && active) {
              setPedidos(prev => {
                const exists = prev.some(p => String(p.id_pedido) === targetOrderId);
                if (exists) {
                  return prev.map(p => String(p.id_pedido) === targetOrderId ? updatedPedido : p);
                } else {
                  return [updatedPedido, ...prev];
                }
              });
            }
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, (payload: any) => {
          const { eventType, new: newRow } = payload;
          console.log('[Realtime] mesas event:', eventType, payload);
          if (!active) return;
          
          if (eventType !== 'DELETE' && newRow) {
            setMesas(prev => prev.map(m => String(m.id_mesa) === String(newRow.id_mesa) ? {
              ...m,
              estado: newRow.estado || 'libre',
              comensales: newRow.comensales || undefined
            } : m));
          }
        })
        .subscribe();
    }

    return () => {
      active = false;
      if (client && channel) {
        client.removeChannel(channel);
      }
    };
  }, [supabaseTrigger, addLog]);

  // Sync completion callback handed to settings
  const handleSupabaseSync = (newData: {
    mesas?: Mesa[];
    insumos?: Insumo[];
    productosMenu?: ProductoMenu[];
    recetas?: RecetaEscandallo[];
    pedidos?: Pedido[];
    mermas?: Merma[];
  }) => {
    if (newData.mesas) setMesas(newData.mesas);
    if (newData.insumos) setInsumos(newData.insumos);
    if (newData.productosMenu) setProductosMenu(newData.productosMenu);
    if (newData.recetas) setRecetas(newData.recetas);
    if (newData.pedidos) setPedidos(newData.pedidos);
    if (newData.mermas) setMermas(newData.mermas);
  };

  // Terminal active configs & simulation states
  const [activeMozo, setActiveMozo] = useState<string>('Sofía');
  const [activeView, setActiveView] = useState<AppView>('home');
  const activeUser = useMemo(
    () => usuarios.find(usuario => usuario.nombre === activeMozo && usuario.activo !== false)
      || usuarios.find(usuario => usuario.activo !== false)
      || INITIAL_USUARIOS[0],
    [usuarios, activeMozo]
  );

  const allowedViews = useMemo(() => {
    return getAllowedViews(activeUser.rol);
  }, [activeUser.rol]);

  const applyAuthenticatedSession = useCallback((session: {
    user?: { user_metadata?: Record<string, unknown> };
  }) => {
    const metadata = session.user?.user_metadata;
    const requestedName = metadata?.nombre || metadata?.name;
    const operator = (
      typeof requestedName === 'string'
        ? usuarios.find(usuario => (
            usuario.activo !== false
            && usuario.nombre.toLowerCase() === requestedName.trim().toLowerCase()
          ))
        : undefined
    ) || usuarios.find(usuario => usuario.activo !== false && usuario.rol === 'mozo')
      || usuarios.find(usuario => usuario.activo !== false && usuario.rol !== 'administrador')
      || usuarios.find(usuario => usuario.activo !== false);

    if (operator) {
      setActiveMozo(operator.nombre);
      setActiveView('home');
      setIsStreamlitLoggedIn(true);
    }
  }, [usuarios]);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    client.auth.getSession().then(({ data }) => {
      if (data.session) applyAuthenticatedSession(data.session);
    }).catch(err => console.error('Auth session error:', err));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (session) applyAuthenticatedSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, [applyAuthenticatedSession]);

  // Simulation Clock state
  const [minutosGlobal, setMinutosGlobal] = useState<number>(0);
  const [autoTimerRunning, setAutoTimerRunning] = useState<boolean>(false);

  const getSimulatedTimeStr = useCallback(() => {
    const h = String(Math.floor((minutosGlobal + 720) / 60) % 24).padStart(2, '0');
    const m = String((minutosGlobal + 720) % 60).padStart(2, '0');
    return `${h}:${m} hs`;
  }, [minutosGlobal]);

  // --- Handlers for Waiter View ---
  const handleCrearPedido = useCallback(async (newPedidoData: Omit<Pedido, 'id_pedido' | 'fecha_hora' | 'minutos_transcurridos' | 'origen'> & { origen?: 'Mozo' | 'Rappi' | 'PedidosYa'; comensales?: number; idempotency_key?: string }) => {
    const existingByKey = newPedidoData.idempotency_key
      ? pedidos.find(p => p.idempotency_key === newPedidoData.idempotency_key)
      : undefined;
    if (existingByKey) {
      await dbSavePedidoComplex(existingByKey);
      addLog('sistema', `PEDIDOS: Reintento sincronizado por idempotencia (${newPedidoData.idempotency_key}).`);
      return;
    }

    console.log('[DEBUG] handleCrearPedido called with:', newPedidoData);
    const isDelivery = newPedidoData.id_mesa === 999 || String(newPedidoData.numero_mesa || '').toUpperCase().startsWith('DELIVERY');
    const existingActivePedido = isDelivery ? undefined : pedidos.find(p => {
      const match = isSameTable(p, newPedidoData) && 
        p.estado_comanda !== 'entregado_cobrado' && 
        p.estado_comanda !== 'cancelado';
      console.log(`[DEBUG] Comparing order #${p.id_pedido} (mesa: ${p.numero_mesa}, id_mesa: ${p.id_mesa}, estado: ${p.estado_comanda}) with new order. Match: ${match}`);
      return match;
    });

    let itemsDescontados: string[] = [];
    let alarmasBajoStock: string[] = [];
    let stockMovements: any[] = [];
    let updatedInsumos = insumos.map(ins => ({ ...ins }));

    const isAdvancedState = ['en_cocina', 'listo', 'entregado', 'entregado_cobrado'].includes(newPedidoData.estado_comanda || 'pendiente');

    if (isAdvancedState) {
      try {
        const dummyPedido: Pedido = {
          id_pedido: '0',
          ...newPedidoData,
          origen: newPedidoData.origen || 'Mozo',
          items: newPedidoData.items,
          fecha_hora: new Date(),
          minutos_transcurridos: 0,
          estado_comanda: newPedidoData.estado_comanda || 'pendiente'
        };
        const stockResult = stockEngine.deductStockForPedido(
          dummyPedido,
          insumos,
          recetas,
          permitirVentaSinStock
        );
        updatedInsumos = stockResult.updatedInsumos;
        itemsDescontados = stockResult.itemsDescontados;
        alarmasBajoStock = stockResult.alarmasBajoStock;
        stockMovements = stockResult.stockMovements;
      } catch (err: any) {
        toast.error(`Error de stock: ${err.message}`);
        addLog('alerta_stock', `RECHAZADO: Intento de comanda falló por stock insuficiente. ${err.message}`);
        return;
      }
    }

    const stockDescontado = isAdvancedState;

    let finalPedido: Pedido;

    if (existingActivePedido) {
      const updatedItems = [...existingActivePedido.items];
      newPedidoData.items.forEach(newItem => {
        const idx = updatedItems.findIndex(i => i.id_producto === newItem.id_producto);
        if (idx > -1) {
          updatedItems[idx] = {
            ...updatedItems[idx],
            cantidad: updatedItems[idx].cantidad + newItem.cantidad
          };
        } else {
          updatedItems.push({ ...newItem });
        }
      });

      const mergedObs = [existingActivePedido.observaciones, newPedidoData.observaciones]
        .map(o => o?.trim())
        .filter(Boolean)
        .join(' | ');

      finalPedido = {
        ...existingActivePedido,
        items: updatedItems,
        observaciones: mergedObs || undefined,
        estado_comanda: 'pendiente',
        stock_descontado: existingActivePedido.stock_descontado || stockDescontado,
        fecha_descuento_stock: existingActivePedido.fecha_descuento_stock || (stockDescontado ? new Date() : undefined)
      };

      setPedidos(prev => prev.map(p => p.id_pedido === existingActivePedido.id_pedido ? finalPedido : p));
      addLog('pedido_creado', `Mesa ${newPedidoData.numero_mesa} agregó a su pedido #${existingActivePedido.id_pedido} por ${newPedidoData.mozo || activeMozo}. Nuevos items: ${newPedidoData.items.map(i => `${i.nombre} (x${i.cantidad})`).join(', ')}`);
    } else {
      const newId = createClientPedidoId(pedidos.map(p => p.id_pedido));
      finalPedido = {
        ...newPedidoData,
        id_pedido: newId,
        fecha_hora: new Date(),
        minutos_transcurridos: 0,
        origen: newPedidoData.origen || 'Mozo',
        stock_descontado: stockDescontado,
        fecha_descuento_stock: stockDescontado ? new Date() : undefined
      };

      setPedidos(prev => {
        const safeId = prev.some(p => p.id_pedido === finalPedido.id_pedido)
          ? createClientPedidoId(prev.map(p => p.id_pedido))
          : finalPedido.id_pedido;
        return [{ ...finalPedido, id_pedido: safeId }, ...prev];
      });
      addLog('pedido_creado', `Mesa ${newPedidoData.numero_mesa} generó pedido #${finalPedido.id_pedido} por ${finalPedido.mozo}. Items: ${newPedidoData.items.map(i => `${i.nombre} (x${i.cantidad})`).join(', ')}`);
    }

    const updatedMesas = mesas.map(m => String(m.id_mesa) === String(newPedidoData.id_mesa) ? { ...m, estado: 'ocupada' as const, comensales: newPedidoData.comensales || 2 } : m);
    setMesas(updatedMesas);

    setTimeout(() => {
      const currentPedidos = [{ ...finalPedido, id_pedido: finalPedido.id_pedido }, ...(pedidos.filter(p => p.id_pedido !== finalPedido.id_pedido))];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('colores_pizzeria_pedidos_local', JSON.stringify(currentPedidos));
      }
    }, 0);

    if (itemsDescontados.length > 0) {
      setInsumos(updatedInsumos);
      addLog('descuento_stock', `ESCANDALLO (AL MANDAR COMANDA): Pedido #${finalPedido.id_pedido} enviado a cocina. Insumos descontados: ${itemsDescontados.join(', ')}`);
    }

    alarmasBajoStock.forEach(nom => {
      addLog('alerta_stock', `CONTROL REPOSICIÓN: El insumo '${nom}' ha caído por debajo del stock de seguridad.`);
    });

    dbSavePedidoComplex(finalPedido).catch(err => {
      console.warn('Background save for pedido failed:', err);
    });
    dbUpsertMesas(updatedMesas).catch(err => {
      console.warn('Background save for mesas failed:', err);
    });

    if (stockDescontado) {
      stockMovements.forEach(movement => dbRecordMovement(movement).catch(console.error));
      dbUpsertInsumos(updatedInsumos).catch(err => {
        console.warn('Background save for insumos failed:', err);
      });
    }
  }, [pedidos, insumos, recetas, addLog, mesas, permitirVentaSinStock, setMesas, setInsumos, setPedidos, activeMozo]);

  const handleMozoChange = (mozo: string) => {
    const nextUser = usuarios.find(usuario => usuario.nombre === mozo && usuario.activo !== false);
    if (!nextUser) {
      toast.error('El usuario seleccionado no está disponible.');
      return;
    }
    setActiveMozo(mozo);
    if (!allowedViews.includes(activeView)) {
      setActiveView('home');
    }
    addLog('sistema', `SESIÓN: Usuario operativo actualizado a ${mozo} (${nextUser.rol}).`);
  };

  const handleNavigate = (view: AppView) => {
    if (!canAccessView(activeUser.rol, view)) {
      toast.warning(`El rol ${activeUser.rol} no tiene permiso para abrir este módulo.`);
      setActiveView('home');
      return;
    }
    setActiveView(view);
  };

  const handleLoginSuccess = (user: Usuario) => {
    window.sessionStorage.setItem('colores_pizzeria_session', 'active');
    setActiveMozo(user.nombre);
    setActiveView('home');

    setPostLoginLoading(true);

    const chunksToPreload = [
      import('../components/HomeMenuModule'),
    ];

    Promise.allSettled(chunksToPreload).finally(() => {
      setTimeout(() => {
        setPostLoginLoading(false);
        setIsStreamlitLoggedIn(true);
      }, 300);
    });
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem('colores_pizzeria_session');
    getSupabaseClient()?.auth.signOut().catch(() => undefined);
    setIsStreamlitLoggedIn(false);
  };

  const handleCambiarEstadoPedido = async (idPedido: string, nuevoEstado: Pedido['estado_comanda'], extraFields?: Partial<Pedido>) => {
    console.log(`[handleCambiarEstadoPedido] Inicio id=${idPedido}, nuevoEstado=${nuevoEstado}, extraFields:`, extraFields);

    const pObj = pedidos.find(p => p.id_pedido === idPedido);
    console.log(`[handleCambiarEstadoPedido] pObj encontrado:`, pObj ? { id_pedido: pObj.id_pedido, estado: pObj.estado_comanda, mesa: pObj.numero_mesa } : null);

    if (!pObj) {
      console.warn(`[handleCambiarEstadoPedido] Pedido ${idPedido} no encontrado en estado local.`);
      return;
    }

    if (nuevoEstado === 'en_cocina') {
      if (!pObj.items || pObj.items.length === 0) {
        toast.error("Error: No se puede enviar a cocina un pedido vacío (sin productos).");
        addLog('sistema', `RECHAZADO: Intento de enviar a cocina el pedido vacío #${idPedido}`);
        return;
      }
    }

    let itemsDescontados: string[] = [];
    let alarmasBajoStock: string[] = [];
    let updatedInsumos: Insumo[] = [];
    let stockDescontadoResult = pObj.stock_descontado;
    let fechaDescuentoStockResult = pObj.fecha_descuento_stock;

    if (nuevoEstado === 'en_cocina' && !pObj.stock_descontado) {
      try {
        const result = stockEngine.deductStockForPedido(pObj, insumos, recetas, permitirVentaSinStock);
        updatedInsumos = result.updatedInsumos;
        itemsDescontados = result.itemsDescontados;
        alarmasBajoStock = result.alarmasBajoStock;
        stockDescontadoResult = true;
        fechaDescuentoStockResult = new Date();

        result.stockMovements.forEach(m => dbRecordMovement(m).catch(console.error));
        result.stockMovements.forEach(m => {
          lotesService.deductFIFO(m.id_insumo, m.cantidad).catch(err =>
            console.error('FIFO deduction failed:', err)
          );
        });

        setInsumos(updatedInsumos);
      } catch (err: any) {
        toast.error(`No es posible iniciar cocción: ${err.message}`);
        addLog('alerta_stock', `RECHAZADO FUEGO: Pedido #${idPedido} bloqueado por falta de stock. ${err.message}`);
        throw err;
      }
    }

    if (nuevoEstado === 'cancelado' && pObj.stock_descontado) {
      stockDescontadoResult = false;
      fechaDescuentoStockResult = undefined;

      const result = stockEngine.reverseStockForPedido(pObj, insumos, recetas);
      updatedInsumos = result.updatedInsumos;
      const { itemsReversados } = result;

      result.stockMovements.forEach(m => dbRecordMovement(m).catch(console.error));
      result.stockMovements.forEach(m => {
        lotesService.restoreFIFO(m.id_insumo, m.cantidad).catch(err =>
          console.error('FIFO restoration failed:', err)
        );
      });

      setInsumos(updatedInsumos);

      if (itemsReversados.length > 0) {
        addLog('descuento_stock', `REVERSO ESCANDALLO: Pedido #${idPedido} CANCELADO. Reintegro automático de: ${itemsReversados.join(', ')}`);
      }
    }

    const updateFields: Partial<Pedido> = { estado_comanda: nuevoEstado, ...extraFields };
    if (nuevoEstado === 'en_cocina') {
      updateFields.stock_descontado = stockDescontadoResult;
      updateFields.fecha_descuento_stock = fechaDescuentoStockResult;
      updateFields.fecha_inicio_cocina = new Date();
    }
    if (nuevoEstado === 'listo') {
      updateFields.segundos_en_listo = 0;
      updateFields.fecha_listo = new Date();
      if (pObj.fecha_inicio_cocina) {
        const diffMs = new Date().getTime() - new Date(pObj.fecha_inicio_cocina).getTime();
        updateFields.tiempo_despacho_minutos = Math.max(1, Math.round(diffMs / 60000));
      }
    }
    if (nuevoEstado === 'cancelado') {
      updateFields.stock_descontado = false;
      updateFields.fecha_descuento_stock = undefined;
    }

    try {
      const { pedidosService } = await import('../services/pedidosService');
      await pedidosService.update(idPedido, updateFields);
      console.log(`[handleCambiarEstadoPedido] pedidosService.update OK id=${idPedido}`);
    } catch (err: any) {
      console.error(`[handleCambiarEstadoPedido] pedidosService.update FAIL id=${idPedido}:`, err);
      toast.error(`No se pudo guardar el estado en Supabase: ${err?.message || err}`);
      throw err;
    }

    if (nuevoEstado === 'en_cocina' && !pObj.stock_descontado) {
      if (itemsDescontados.length > 0) {
        addLog('descuento_stock', `ESCANDALLO: Pedido #${idPedido} cambió a EN_COCINA. Descuento automático de: ${itemsDescontados.join(', ')}`);
      }
      alarmasBajoStock.forEach(alertStr => {
        addLog('alerta_stock', `CRÍTICO REPOSICIÓN: El insumo '${alertStr}' cayó por debajo del stock mínimo estipulado.`);
      });
      dbUpsertInsumos(updatedInsumos);
    }
    if (nuevoEstado === 'cancelado' && pObj.stock_descontado) {
      dbUpsertInsumos(updatedInsumos);
    }

    setPedidos(prev => {
      const next = prev.map(p => (p.id_pedido === idPedido ? { ...p, ...updateFields } : p));
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('colores_pizzeria_pedidos_local', JSON.stringify(next));
      }
      return next;
    });

    addLog('comanda_estado', `COMANDA #${idPedido}${pObj ? ` para ${pObj.numero_mesa}` : ''}: Estado cambiado a ${nuevoEstado.toUpperCase()}`);

    if ((nuevoEstado === 'entregado_cobrado' || nuevoEstado === 'cancelado') && pObj) {
      const updatedMesas = mesas.map(m => String(m.id_mesa) === String(pObj.id_mesa) ? { ...m, estado: 'libre' as const, comensales: undefined } : m);
      setMesas(updatedMesas);
      dbUpsertMesas(updatedMesas);
    }
  };

  const handleProducirPedidoConEscandallo = (idPedido: string) => {
    handleCambiarEstadoPedido(idPedido, 'listo');
  };

  const handleFacturarMesa = useCallback((idPedido: string, alreadyUpdatedInCaja: boolean = false, itemsRemaining?: Pedido['items']) => {
    const target = pedidos.find(p => p.id_pedido === idPedido);
    if (!target) return;

    const ordersToBill = pedidos.filter(p => 
      isSameTable(p, target) && 
      p.estado_comanda !== 'entregado_cobrado' && 
      p.estado_comanda !== 'cancelado'
    );

    if (itemsRemaining && itemsRemaining.length > 0) {
      setPedidos(prev => prev.map(p => {
        if (!ordersToBill.some(o => o.id_pedido === p.id_pedido)) return p;
        const updatedItems = p.items.map(item => {
          const matchRemaining = itemsRemaining.find(r => r.id_producto === item.id_producto);
          if (matchRemaining) {
            return { ...item, cantidad: matchRemaining.cantidad };
          }
          return null;
        }).filter((item): item is NonNullable<typeof item> => item !== null && item.cantidad > 0);

        if (updatedItems.length === 0) {
          dbSavePedidoComplex({ ...p, estado_comanda: 'entregado_cobrado', items: [] });
          return { ...p, estado_comanda: 'entregado_cobrado', items: [] };
        } else {
          dbSavePedidoComplex({ ...p, items: updatedItems });
          return { ...p, items: updatedItems };
        }
      }));

      addLog('sistema', `CAJA: Cobro parcial de ítems procesado para Mesa ${target.numero_mesa}. Ítems restantes activos: ${itemsRemaining.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}`);
      return;
    }

    const orderIds = ordersToBill.map(o => o.id_pedido);

    setPedidos(prev => prev.map(p => orderIds.includes(p.id_pedido) ? { ...p, estado_comanda: 'entregado_cobrado' } : p));

    const updatedMesas = mesas.map(m => {
      const matchId = (m.id_mesa !== undefined && m.id_mesa !== null && target.id_mesa !== undefined && target.id_mesa !== null && String(m.id_mesa) === String(target.id_mesa));
      const norm1 = String(m.numero_mesa || '').toLowerCase().replace(/mesa\s+/gi, '').trim();
      const norm2 = String(target.numero_mesa || '').toLowerCase().replace(/mesa\s+/gi, '').trim();
      const matchNum = norm1 !== '' && norm1 === norm2;
      return (matchId || matchNum) ? { ...m, estado: 'libre' as const, comensales: undefined } : m;
    });
    setMesas(updatedMesas);

    addLog('sistema', `CAJA: Facturación completa cobrada correctamente de la mesa ${target.numero_mesa} por Pedido(s) #${orderIds.join(', #')}`);

    ordersToBill.forEach(order => {
      dbSavePedidoComplex({ ...order, estado_comanda: 'entregado_cobrado' });
    });
    dbUpsertMesas(updatedMesas);

    if (!alreadyUpdatedInCaja) {
      const totalPedido = ordersToBill.reduce((sum, order) => {
        const orderSum = (order.items || []).reduce((itemSum, item) => {
          const pm = productosMenu.find(pr => pr.id_producto === item.id_producto);
          const price = item.precio_unitario ?? pm?.precio_venta ?? 0;
          return itemSum + (price * item.cantidad);
        }, 0);
        return sum + orderSum;
      }, 0);

      cajaService.updateSales(totalPedido, { efectivo: totalPedido }).catch(err => {
        console.error('Error updating sales in cajaService during direct billing:', err);
      });
    }
  }, [pedidos, mesas, productosMenu, addLog]);

  const handleRegistrarMerma = (idInsumo: string, cantidad: number, motivo: Merma['motivo']) => {
    const insObj = insumos.find(i => i.id_insumo === idInsumo);
    if (!insObj) return;

    const newMerma: Merma = {
      id_merma: `mrm_${Date.now()}`,
      id_insumo: idInsumo,
      nombre_insumo: insObj.nombre,
      cantidad,
      unidad_medida: insObj.unidad_medida,
      motivo,
      fecha: new Date()
    };

    setMermas(prev => [newMerma, ...prev]);

    const updatedInsumos = insumos.map(i => i.id_insumo === idInsumo ? {
      ...i,
      stock_actual: Math.max(0, parseFloat((i.stock_actual - cantidad).toFixed(2)))
    } : i);
    setInsumos(updatedInsumos);

    addLog('merma_registrada', `REGISTRO MERMA: ${cantidad} ${insObj.unidad_medida} de '${insObj.nombre}' registrado por motivo: ${motivo.toUpperCase()}`);

    dbUpsertInsumos(updatedInsumos);
    dbUpsertMermas([newMerma, ...mermas]);
    dbRecordMovement({
      id_insumo: idInsumo,
      tipo_movimiento: 'salida_merma',
      cantidad,
      stock_anterior: insObj.stock_actual,
      stock_nuevo: Math.max(0, parseFloat((insObj.stock_actual - cantidad).toFixed(2)))
    }).catch(console.error);
    lotesService.deductFIFO(idInsumo, cantidad).catch(err =>
      console.error('FIFO deduction failed during merma:', err)
    );
  };

  const handleRestockInsumo = useCallback((idInsumo: string, cantidad: number) => {
    const item = insumos.find(i => i.id_insumo === idInsumo);
    const updatedInsumos = insumos.map(i => i.id_insumo === idInsumo ? {
      ...i,
      stock_actual: parseFloat((i.stock_actual + cantidad).toFixed(2))
    } : i);
    setInsumos(updatedInsumos);

    addLog('sistema', `REPOSICIÓN: Incremetado stock de '${item ? item.nombre : idInsumo}' en +${cantidad}`);

    dbUpsertInsumos(updatedInsumos);
    if (item) {
      dbRecordMovement({
        id_insumo: idInsumo,
        tipo_movimiento: 'entrada',
        cantidad,
        stock_anterior: item.stock_actual,
        stock_nuevo: parseFloat((item.stock_actual + cantidad).toFixed(2))
      }).catch(console.error);
    }
  }, [insumos, addLog]);

  const handleReservaEstadoChange = useCallback((reserva: Reserva, estado: Reserva['estado']) => {
    if (!reserva.id_mesa) return;

    const hasActiveOrder = pedidos.some(pedido => (
      pedido.id_mesa === reserva.id_mesa
      && pedido.estado_comanda !== 'entregado_cobrado'
      && pedido.estado_comanda !== 'cancelado'
    ));

    const updatedMesas = mesas.map(mesa => {
      if (mesa.id_mesa !== reserva.id_mesa) return mesa;
      if (estado === 'confirmada') {
        return { ...mesa, estado: 'reservada' as const, comensales: reserva.pax };
      }
      if (estado === 'sentada') {
        return { ...mesa, estado: 'ocupada' as const, comensales: reserva.pax };
      }
      if (!hasActiveOrder && (estado === 'cancelada' || estado === 'completada' || estado === 'pendiente')) {
        return { ...mesa, estado: 'libre' as const, comensales: undefined };
      }
      return mesa;
    });

    setMesas(updatedMesas);
    dbUpsertMesas(updatedMesas);
    addLog('sistema', `RESERVA: Mesa ${reserva.id_mesa} cambio a estado '${estado}'.`);
  }, [mesas, pedidos, addLog]);

  // Simulation controls
  const handleAdvanceTime = (mins: number) => {
    setMinutosGlobal(prev => prev + mins);

    setPedidos(prev => prev.map(p => {
      if (p.estado_comanda !== 'entregado_cobrado') {
        const updated = {
          ...p,
          minutos_transcurridos: p.minutos_transcurridos + mins
        };
        if (p.estado_comanda === 'listo') {
          updated.segundos_en_listo = (updated.segundos_en_listo || 0) + mins * 60;
        }
        return updated;
      }
      return p;
    }));

    addLog('sistema', `RELOJ: Reloj del restaurante adelantado en +${mins} minutos operacionales.`);
  };

  const handleToggleAutoTimer = () => {
    setAutoTimerRunning(prev => !prev);
    addLog('sistema', `RELOJ: Simulación en tiempo real ${!autoTimerRunning ? 'INICIADA' : 'DETENIDA'}`);
  };

  const handleResetAllData = () => {
    setMesas(INITIAL_MESAS);
    setInsumos(INITIAL_INSUMOS);
    setPedidos(INITIAL_PEDIDOS);
    setMermas([]);
    setMinutosGlobal(0);
    setAutoTimerRunning(false);
    setLogs([
      {
        id: `log_rst_${Date.now()}`,
        tipo: 'sistema',
        mensaje: 'SISTEMA: Demostración reiniciada a valores iniciales por defecto.',
        timestamp: new Date()
      }
    ]);
  };

  const handleRestoreBackupData = (snapshot: BackupSnapshotData) => {
    setUsuarios(snapshot.usuarios);
    setMesas(snapshot.mesas);
    setInsumos(snapshot.insumos);
    setProductosMenu(snapshot.productosMenu);
    setRecetas(snapshot.recetas);
    setPedidos(snapshot.pedidos);
    setMermas(snapshot.mermas);
    setLogs(snapshot.logs);
    setMinutosGlobal(0);
    setAutoTimerRunning(false);
  };

  useEffect(() => {
    if (!usuarios.some(usuario => usuario.nombre === activeMozo && usuario.activo !== false)) {
      setActiveMozo(activeUser.nombre);
    }
  }, [usuarios, activeMozo, activeUser.nombre]);

  useEffect(() => {
    if (!allowedViews.includes(activeView)) {
      setActiveView('home');
    }
  }, [activeUser.rol, activeView, allowedViews]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (autoTimerRunning) {
      interval = setInterval(() => {
        setMinutosGlobal(prev => prev + 1);
        
        setPedidos(prevOrders => prevOrders.map(p => {
          if (p.estado_comanda !== 'entregado_cobrado') {
            const updated = {
              ...p,
              minutos_transcurridos: p.minutos_transcurridos + 1
            };
            if (p.estado_comanda === 'listo') {
              updated.segundos_en_listo = (updated.segundos_en_listo || 0) + 60;
            }
            return updated;
          }
          return p;
        }));
      }, 2000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [autoTimerRunning]);

  return {
    isStreamlitLoggedIn,
    setIsStreamlitLoggedIn,
    showCover,
    setShowCover,
    permitirVentaSinStock,
    setPermitirVentaSinStock,
    usuarios,
    setUsuarios,
    mesas,
    setMesas,
    insumos,
    setInsumos,
    productosMenu,
    setProductosMenu,
    recetas,
    setRecetas,
    pedidos,
    setPedidos,
    mermas,
    setMermas,
    postLoginLoading,
    setPostLoginLoading,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    showDiagnostics,
    setShowDiagnostics,
    isOnline,
    setIsOnline,
    syncQueueSize,
    setSyncQueueSize,
    logs,
    setLogs,
    activeMozo,
    setActiveMozo,
    activeView,
    setActiveView,
    minutosGlobal,
    setMinutosGlobal,
    autoTimerRunning,
    setAutoTimerRunning,
    precioMap,
    activeUser,
    allowedViews,
    addLog,
    handleTriggerSync,
    handleLoginSuccess,
    handleLogout,
    handleCambiarEstadoPedido,
    handleProducirPedidoConEscandallo,
    handleFacturarMesa,
    handleRegistrarMerma,
    handleRestockInsumo,
    handleReservaEstadoChange,
    handleAdvanceTime,
    handleToggleAutoTimer,
    handleResetAllData,
    handleRestoreBackupData,
    handleMozoChange,
    handleNavigate,
    handleCrearPedido,
    getSimulatedTimeStr,
    handleSupabaseSync
  };
}
