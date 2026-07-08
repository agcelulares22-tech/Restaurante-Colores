import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
  AlertTriangle,
  Flame,
  Clock,
  CheckCircle,
  ChefHat,
  Snowflake,
  X,
  Utensils,
  Search,
  Filter,
  RefreshCw,
  Pencil,
  CircleDot,
  BookOpen,
  Bike,
  DollarSign,
  Store,
  MessageSquare
} from 'lucide-react';
import { Pedido, ProductoMenu, RecetaEscandallo, Insumo } from '../types';
import { useKitchenMonitor } from '../features/cocina/hooks/useKitchenMonitor';
import { pedidosDeliveryRapidoService, PedidoDeliveryRapido } from '../services/pedidosDeliveryRapidoService';

interface KitchenMonitorProps {
  pedidos: Pedido[];
  onCambiarEstadoPedido: (idPedido: string, nuevoEstado: Pedido['estado_comanda']) => void;
  onProducirPedidoConEscandallo: (idPedido: string) => void;
  minutosGlobal: number;
  productosMenu: ProductoMenu[];
  recetas: RecetaEscandallo[];
  insumos: Insumo[];
  activeMozo?: string;
  onCrearPedido?: (pedido: Omit<Pedido, 'id_pedido' | 'fecha_hora' | 'minutos_transcurridos' | 'origen'> & { origen?: 'Mozo' | 'Rappi' | 'PedidosYa'; idempotency_key?: string }) => void;
}

function KitchenMonitor({
  pedidos,
  onCambiarEstadoPedido,
  onProducirPedidoConEscandallo,
  minutosGlobal,
  productosMenu,
  recetas,
  insumos,
  activeMozo = 'Sistema',
  onCrearPedido
}: KitchenMonitorProps) {
  const [quickOrders, setQuickOrders] = useState<PedidoDeliveryRapido[]>([]);
  const [showMiseEnPlace, setShowMiseEnPlace] = useState(false);

  useEffect(() => {
    // Cargar pedidos rápidos iniciales
    pedidosDeliveryRapidoService.list().then(setQuickOrders);

    // Suscribirse a cambios en tiempo real en la tabla pedidos_delivery_rapido
    const channel = pedidosDeliveryRapidoService.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setQuickOrders(prev => {
          if (prev.some(o => o.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      } else if (payload.eventType === 'UPDATE') {
        setQuickOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
      } else if (payload.eventType === 'DELETE') {
        setQuickOrders(prev => prev.filter(o => o.id !== payload.old.id));
      }
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  const combinedPedidos = useMemo(() => {
    const mapped = quickOrders
      .filter(o => o.estado !== 'entregado')
      .map(o => {
        let estado_comanda: Pedido['estado_comanda'] = 'pendiente';
        if (o.estado === 'horno') estado_comanda = 'en_cocina';
        else if (o.estado === 'delivery') estado_comanda = 'listo';

        const minutes = Math.max(0, Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000));

        return {
          id_pedido: String(o.id + 10000000),
          idempotency_key: `quick_deliv_db_${o.id}`,
          id_mesa: 999,
          numero_mesa: `DELIVERY: ${o.nombre_cliente.toUpperCase()} - ${o.direccion.toUpperCase()}`,
          mozo: 'Sistema',
          estado_comanda,
          items: [
            {
              id_producto: `delivery_manual_${o.id}`,
              nombre: o.pedido,
              cantidad: 1,
              categoria: 'Delivery',
              precio_unitario: 0
            }
          ],
          observaciones: `Tel: ${o.telefono} | Dir: ${o.direccion}`,
          fecha_hora: new Date(o.created_at),
          minutos_transcurridos: minutes,
          origen: 'Mozo' as const,
          stock_descontado: false
        };
      });

    return [...pedidos, ...mapped];
  }, [pedidos, quickOrders]);

  const handleCambiarEstadoPedidoCustom = useCallback(async (idPedido: string, nuevoEstado: Pedido['estado_comanda']) => {
    const numericId = Number(idPedido);
    console.log(`[KitchenMonitor.handleCambiarEstadoPedidoCustom] Inicio id=${numericId}, nuevoEstado=${nuevoEstado}`);
    // Los IDs de delivery rápido son id_real + 10000000 (rango controlado < 1e9).
    // Los IDs de pedidos normales son timestamps enormes (~1e15) y deben ir por la rama normal.
    if (!isNaN(numericId) && numericId >= 10000000 && numericId < 1000000000) {
      const realId = numericId - 10000000;
      let dbEstado: 'nuevo' | 'horno' | 'delivery' | 'entregado' = 'nuevo';
      if (nuevoEstado === 'en_cocina') dbEstado = 'horno';
      else if (nuevoEstado === 'listo') dbEstado = 'delivery';
      else if (nuevoEstado === 'entregado' || nuevoEstado === 'entregado_cobrado' || nuevoEstado === 'cancelado') dbEstado = 'entregado';

      await pedidosDeliveryRapidoService.updateEstado(realId, dbEstado);
      setQuickOrders(prev => prev.map(o => o.id === realId ? { ...o, estado: dbEstado } : o));
    } else {
      console.log(`[KitchenMonitor.handleCambiarEstadoPedidoCustom] Llamando onCambiarEstadoPedido (App.tsx) id=${idPedido}, estado=${nuevoEstado}`);
      try {
        await onCambiarEstadoPedido(idPedido, nuevoEstado);
        console.log(`[KitchenMonitor.handleCambiarEstadoPedidoCustom] onCambiarEstadoPedido completado`);
      } catch (err) {
        console.error(`[KitchenMonitor.handleCambiarEstadoPedidoCustom] Error en onCambiarEstadoPedido:`, err);
      }
    }
  }, [onCambiarEstadoPedido]);

  const {
    cancelRequest,
    setCancelRequest,
    kitchenSearch,
    setKitchenSearch,
    showOnlyKitchen,
    setShowOnlyKitchen,
    optimisticUpdates,
    selectedRecipeProduct,
    setSelectedRecipeProduct,
    activeKitchenOrders,
    batchProduction,
    getSemaforoInfo,
    isColdPlate,
    handleOptimisticStatus,
    confirmCancel,
    isBarItem
  } = useKitchenMonitor({
    pedidos: combinedPedidos,
    onCambiarEstadoPedido: handleCambiarEstadoPedidoCustom,
    productosMenu,
    recetas,
    insumos
  });

  const audioUnlockedRef = React.useRef(false);

  React.useEffect(() => {
    const unlock = () => {
      if (audioUnlockedRef.current) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
          audioUnlockedRef.current = true;
          window.removeEventListener('click', unlock);
          window.removeEventListener('touchstart', unlock);
        }
      } catch (e) {
        console.warn('Unlock audio context failed:', e);
      }
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  const prevPendingIdsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    const pending = activeKitchenOrders.filter(p => p.estado_comanda === 'pendiente');
    const pendingIds = pending.map(p => String(p.id_pedido));
    const hasNew = pendingIds.some(id => !prevPendingIdsRef.current.includes(id));
    
    if (hasNew && prevPendingIdsRef.current.length > 0) {
      try {
        const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
        if (AudioCtx) {
          const ctx = new AudioCtx();
          
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
          gain1.gain.setValueAtTime(0.08, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.15);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start();
          osc1.stop(ctx.currentTime + 0.15);
          
          setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
            gain2.gain.setValueAtTime(0.08, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.25);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.25);
          }, 110);
        }
      } catch (e) {
        console.warn('Audio feedback failed:', e);
      }
    }
    prevPendingIdsRef.current = pendingIds;
  }, [activeKitchenOrders]);

  const ingredientsConsolidated = useMemo(() => {
    const list: { [name: string]: { qty: number; unit: string; available: number } } = {};
    activeKitchenOrders.forEach(p => {
      if (p.estado_comanda === 'pendiente' || p.estado_comanda === 'en_cocina') {
        p.items.forEach(item => {
          const matchingRecetas = recetas.filter(r => r.id_producto === item.id_producto);
          matchingRecetas.forEach(rec => {
            const insumo = insumos.find(i => i.id_insumo === rec.id_insumo);
            if (insumo) {
              const name = insumo.nombre;
              const requiredAmt = rec.cantidad_a_descontar * item.cantidad;
              if (!list[name]) {
                list[name] = { qty: 0, unit: insumo.unidad_medida, available: insumo.stock_actual };
              }
              list[name].qty += requiredAmt;
            }
          });
        });
      }
    });
    return Object.entries(list).map(([name, data]) => ({
      name,
      qty: parseFloat(data.qty.toFixed(2)),
      unit: data.unit,
      available: data.available
    })).filter(i => i.qty > 0);
  }, [activeKitchenOrders, recetas, insumos]);

  const handleDragStart = (e: React.DragEvent, idPedido: string) => {
    e.dataTransfer.setData('text/plain', idPedido);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetEstado: Pedido['estado_comanda']) => {
    e.preventDefault();
    const idPedido = e.dataTransfer.getData('text/plain');
    if (!idPedido) return;

    const p = combinedPedidos.find(x => x.id_pedido === idPedido);
    if (!p) return;

    if (p.estado_comanda === 'pendiente' && targetEstado === 'en_cocina') {
      await handleOptimisticStatus(idPedido, 'en_cocina');
    } else if (p.estado_comanda === 'en_cocina' && targetEstado === 'listo') {
      await handleOptimisticStatus(idPedido, 'listo');
    } else if (p.estado_comanda === 'listo' && targetEstado === 'entregado') {
      await handleOptimisticStatus(idPedido, 'entregado');
    }
  };

  // Alerta sonora para nuevos pedidos
  const activeOrderIds = useMemo(() => {
    const active = activeKitchenOrders.filter(p => p.estado_comanda === 'pendiente' || p.estado_comanda === 'en_cocina');
    return new Set(active.map(p => String(p.id_pedido)));
  }, [activeKitchenOrders]);

  const [prevActiveIds, setPrevActiveIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (prevActiveIds.size > 0) {
      let hasNewOrder = false;
      for (const id of activeOrderIds) {
        if (!prevActiveIds.has(id)) {
          hasNewOrder = true;
          break;
        }
      }
      if (hasNewOrder) {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const now = ctx.currentTime;
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now); // D5
            gain1.gain.setValueAtTime(0.15, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880.00, now + 0.12); // A5
            gain2.gain.setValueAtTime(0.15, now + 0.12);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            
            osc1.start(now);
            osc1.stop(now + 0.6);
            osc2.start(now + 0.12);
            osc2.stop(now + 0.8);
          }
        } catch (err) {
          console.warn('Audio chime blocked or failed:', err);
        }
      }
    }
    setPrevActiveIds(activeOrderIds);
  }, [activeOrderIds]);


  const [nowTime, setNowTime] = useState(Date.now());
  const playedAlarmsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getOrderPrepTime = useCallback((pedido: Pedido) => {
    let maxTime = 12; // 12 minutes default
    pedido.items.forEach(item => {
      const prod = productosMenu.find(p => p.id_producto === item.id_producto);
      if (prod?.tiempo_preparacion_estimado && prod.tiempo_preparacion_estimado > 0) {
        if (prod.tiempo_preparacion_estimado > maxTime) {
          maxTime = prod.tiempo_preparacion_estimado;
        }
      }
    });
    return maxTime;
  }, [productosMenu]);

  const playOvenAlarm = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Tone 1: G5 (783.99 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Tone 2: C6 (1046.50 Hz) a bit delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, now + 0.15);
      gain2.gain.setValueAtTime(0.15, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.4);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch (err) {
      console.warn('Audio alarm blocked or failed:', err);
    }
  }, []);

  const ordersPendientes = useMemo(() => activeKitchenOrders.filter(p => p.estado_comanda === 'pendiente'), [activeKitchenOrders]);
  const ordersEnCocinaRaw = useMemo(() => activeKitchenOrders.filter(p => p.estado_comanda === 'en_cocina'), [activeKitchenOrders]);

  const ordersEnCocinaSorted = useMemo(() => {
    return [...ordersEnCocinaRaw].sort((a, b) => {
      const tA = a.fecha_inicio_cocina ? new Date(a.fecha_inicio_cocina).getTime() : new Date(a.fecha_hora).getTime();
      const tB = b.fecha_inicio_cocina ? new Date(b.fecha_inicio_cocina).getTime() : new Date(b.fecha_hora).getTime();
      return tA - tB;
    });
  }, [ordersEnCocinaRaw]);
  const ovenActive = useMemo(() => ordersEnCocinaSorted.slice(0, 6), [ordersEnCocinaSorted]);
  const ovenQueue = useMemo(() => ordersEnCocinaSorted.slice(6), [ordersEnCocinaSorted]);
  const ordersListo = useMemo(() => activeKitchenOrders.filter(p => p.estado_comanda === 'listo'), [activeKitchenOrders]);
  const ordersEnCocina = ordersEnCocinaSorted;
  // Alerta sonora cuando llega a cero
  useEffect(() => {
    ovenActive.forEach(p => {
      const durationSeconds = getOrderPrepTime(p) * 60;
      const startTime = p.fecha_inicio_cocina ? new Date(p.fecha_inicio_cocina).getTime() : new Date(p.fecha_hora).getTime();
      const elapsedSeconds = Math.floor((nowTime - startTime) / 1000);
      const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

      if (remainingSeconds === 0) {
        if (!playedAlarmsRef.current.has(p.id_pedido)) {
          playedAlarmsRef.current.add(p.id_pedido);
          playOvenAlarm();
        }
      }
    });
  }, [nowTime, ovenActive, getOrderPrepTime, playOvenAlarm]);

  // Limpiar alarmas sonadas de pedidos que ya salieron de la cola activa
  useEffect(() => {
    const activeIds = new Set(ovenActive.map(o => o.id_pedido));
    const played = playedAlarmsRef.current;
    played.forEach(id => {
      if (!activeIds.has(id)) {
        played.delete(id);
      }
    });
  }, [ovenActive]);

  const renderCircularTimer = (p: Pedido) => {
    const durationMinutes = getOrderPrepTime(p);
    const durationSeconds = durationMinutes * 60;
    const startTime = p.fecha_inicio_cocina ? new Date(p.fecha_inicio_cocina).getTime() : new Date(p.fecha_hora).getTime();
    const elapsedSeconds = Math.floor((nowTime - startTime) / 1000);
    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

    const min = Math.floor(remainingSeconds / 60);
    const sec = remainingSeconds % 60;
    const timeString = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

    // SVG Circular Progress
    const radius = 16;
    const strokeWidth = 3.5;
    const circumference = 2 * Math.PI * radius; // ~100.5
    const progressPercent = Math.min(1, remainingSeconds / durationSeconds);
    const strokeDashoffset = progressPercent * circumference;

    const isAlarm = remainingSeconds === 0;

    return (
      <div className="flex items-center gap-2.5 bg-[#FFF9E6] border border-[#E8B800]/30 p-2.5 rounded-xl mt-2">
        <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r={radius}
              className="stroke-[#E8B800]/15 fill-none"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="18"
              cy="18"
              r={radius}
              className={`${isAlarm ? 'stroke-red-500 animate-pulse' : 'stroke-[#E85D00]'} fill-none`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute text-[9px] font-mono font-black ${isAlarm ? 'text-red-600 animate-ping' : 'text-[#2D3436]'}`}>
            {isAlarm ? '⏰' : timeString}
          </span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Cuenta Regresiva</span>
          <span className={`text-[11px] font-black mt-0.5 ${isAlarm ? 'text-red-600 animate-pulse' : 'text-stone-700'}`}>
            {isAlarm ? '¡RETIRAR DEL HORNO!' : `${min}m ${sec}s restantes`}
          </span>
        </div>
      </div>
    );
  };  const renderTicket = (p: Pedido, estado: Pedido['estado_comanda'], isActiveInOven?: boolean) => {
    const sem = estado === 'pendiente' || estado === 'en_cocina' ? getSemaforoInfo(p.minutos_transcurridos, p) : null;
    const cold = estado === 'listo' && isColdPlate(p);
    const holdMinutes = estado === 'listo' ? Math.floor((p.segundos_en_listo ?? 0) / 60) : 0;

    const headerTheme = {
      pendiente: 'bg-slate-50/80 dark:bg-zinc-900/40 text-zinc-100 border-b border-slate-100 dark:border-white/5',
      en_cocina: 'bg-[#E85D00]/5 dark:bg-[#E85D00]/10 text-zinc-100 border-b border-slate-100 dark:border-white/5',
      listo: 'bg-emerald-500/5 dark:bg-emerald-500/10 text-zinc-100 border-b border-slate-100 dark:border-white/5'
    }[estado];

    const btnTheme = {
      pendiente: 'bg-[#E8B800] hover:bg-[#D4A700] text-black border-[#E8B800]',
      en_cocina: 'bg-[#E85D00] hover:bg-[#d14f00] text-white border-[#E85D00]',
      listo: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500'
    }[estado];

    const isDelivery = (p.numero_mesa || '').toUpperCase().startsWith('DELIVERY:');
    const isRetiro = (p.numero_mesa || '').toUpperCase().startsWith('RETIRO:');
    const subtotalPlatos = p.items
      .filter(it => it.id_producto !== 'prod_costo_envio_delivery')
      .reduce((sum, it) => sum + (it.precio_unitario ?? 0) * it.cantidad, 0);
    const deliveryItem = p.items.find(it => it.id_producto === 'prod_costo_envio_delivery');
    const costoDelivery = (deliveryItem?.precio_unitario ?? 0) * (deliveryItem?.cantidad ?? 1);
    const totalPedido = subtotalPlatos + costoDelivery;

    const createdAgeMs = Date.now() - new Date(p.fecha_hora).getTime();
    const isRecentlyCreated = createdAgeMs > 0 && createdAgeMs < 20000;

    const isDelayCritical = (estado === 'pendiente' || estado === 'en_cocina') && (p.minutos_transcurridos > 20);

    return (
      <div
        key={p.id_pedido}
        draggable
        onDragStart={(e) => handleDragStart(e, p.id_pedido)}
        className={`rounded-[20px] border bg-white dark:bg-zinc-950 shadow-md overflow-hidden relative ${sem?.border || 'border-slate-200 dark:border-zinc-700'} border-l-4 transition-all duration-300 hover:border-slate-350 dark:hover:border-zinc-600 cursor-grab active:cursor-grabbing ${
          isRecentlyCreated ? 'ring-2 ring-amber-400 animate-pulse shadow-amber-500/20 shadow-lg' : ''
        } ${
          isDelayCritical ? 'border-rose-600 ring-2 ring-rose-500/40 animate-pulse shadow-rose-900/30 shadow-lg' : ''
        }`}
      >
        {cold && (
          <div className="bg-[#D42B2B] text-white text-[9px] uppercase font-black tracking-wider px-4 py-1.5 flex items-center gap-1.5 shadow">
            <Snowflake className="w-3.5 h-3.5 animate-spin" />
            <span>Alerta: Pizza Fría • {holdMinutes}m sin retirar</span>
          </div>
        )}

        {isDelayCritical ? (
          <div className="bg-[#E63946] text-white text-[9px] uppercase font-black tracking-wider px-4 py-1.5 flex items-center gap-1.5 shadow animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
            <span>Demora Crítica: +20m de espera!</span>
          </div>
        ) : sem?.delayed ? (
          <div className="bg-[#D42B2B] text-white text-[9px] uppercase font-black tracking-wider px-4 py-1.5 flex items-center gap-1.5 shadow animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-[#E8B800] animate-bounce" />
            <span>Retraso Crítico en Horno</span>
          </div>
        ) : null}

        <div className={`p-4 flex justify-between items-start ${headerTheme} shadow-sm`}>
          <div className="flex flex-col min-w-0">
            <span className="text-[1.6rem] sm:text-[2rem] font-black leading-none tracking-tight uppercase font-display truncate text-zinc-800 dark:text-zinc-150">
              {p.numero_mesa}
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest opacity-60 font-mono mt-1 truncate text-zinc-500 dark:text-zinc-400">
              Orden #{p.id_pedido}
            </span>
          </div>

          <div className="text-right flex flex-col items-end shrink-0 gap-1">
            {isDelivery ? (
              <span className="text-[9px] font-black uppercase text-white bg-[#E85D00] px-2 py-0.5 rounded-full border border-[#E85D00] flex items-center gap-1">
                <Bike className="w-3 h-3" />
                Delivery
              </span>
            ) : isRetiro ? (
              <span className="text-[9px] font-black uppercase text-white bg-[#198754] px-2 py-0.5 rounded-full border border-[#198754] flex items-center gap-1">
                <Store className="w-3 h-3" />
                Retiro
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase text-[#E8B800] bg-[#E8B800]/10 px-2 py-0.5 rounded-full border border-[#E8B800]/30">
                {p.origen || 'MOZO'}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3 text-[#E8B800]" />
              <span className={`text-sm font-black ${sem?.timeText || 'text-zinc-700 dark:text-zinc-200'}`}>{p.minutos_transcurridos}m</span>
              {sem && <span className={`w-1.5 h-1.5 rounded-full ${sem.timeDot}`} />}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2">
            {p.items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 py-2.5 border-b border-dashed border-slate-200 dark:border-zinc-750 last:border-0"
              >
                <span className="text-lg font-black text-[#E8B800] font-mono shrink-0">
                  {it.cantidad}x
                </span>
                <span className="flex-1 font-semibold text-zinc-700 dark:text-zinc-200 text-sm leading-snug truncate">
                  {it.nombre}
                </span>
                {(it.precio_unitario ?? 0) > 0 && (
                  <span className="text-xs font-mono font-black text-zinc-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700 shrink-0">
                    ${(it.precio_unitario! * it.cantidad).toLocaleString('es-AR')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const prod = productosMenu.find(pm => pm.id_producto === it.id_producto);
                    if (prod) {
                      setSelectedRecipeProduct(prod);
                    }
                  }}
                  className="touch-target p-1 text-[#E85D00] hover:text-[#E8B800] hover:bg-[#E8B800]/10 rounded transition-colors shrink-0"
                  title="Ver Receta y Emplatado"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] uppercase font-black tracking-wider text-black bg-[#E8B800] px-2 py-0.5 rounded-md shrink-0">
                  {isBarItem(it) ? 'BAR' : 'HORNO'}
                </span>
              </div>
            ))}
          </div>

          {(subtotalPlatos > 0 || costoDelivery > 0) && (
            <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 space-y-1.5">
              {subtotalPlatos > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Subtotal platos</span>
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-200">${subtotalPlatos.toLocaleString('es-AR')}</span>
                </div>
              )}
              {costoDelivery > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1">
                    <Bike className="w-3 h-3 text-[#E85D00]" />
                    Delivery
                  </span>
                  <span className="font-mono font-bold text-[#E85D00]">${costoDelivery.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-zinc-700 pt-1.5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-300">Total</span>
                <span className="text-sm font-black font-mono text-[#E8B800]">${totalPedido.toLocaleString('es-AR')}</span>
              </div>
            </div>
          )}

          {estado === 'en_cocina' && (
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-700">
              {isActiveInOven ? (
                renderCircularTimer(p)
              ) : (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-2 rounded-xl text-zinc-450 dark:text-zinc-400">
                  <Clock className="w-4.5 h-4.5 text-zinc-450 dark:text-zinc-500 animate-pulse" />
                  <div className="flex flex-col leading-none">
                    <span className="text-[9px] font-black uppercase text-zinc-550 dark:text-zinc-500">Cola de Espera</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-400">En fila (Horno lleno)...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {p.observaciones && (
            <div className="bg-amber-500/10 text-amber-200 text-xs p-3 rounded-xl border border-amber-500/20 italic font-semibold leading-relaxed">
              <strong className="text-[10px] uppercase font-black tracking-wider text-amber-400 block mb-0.5">
                ⚠️ Observación:
              </strong>
              "{p.observaciones}"
            </div>
          )}

          {estado === 'pendiente' && (
            <button
              onClick={() => handleOptimisticStatus(p.id_pedido, 'en_cocina')}
              className={`w-full min-h-12 mt-2 py-3 px-3 ${btnTheme} btn-premium rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md`}
            >
              {optimisticUpdates.get(p.id_pedido)?.estado === 'en_cocina' && optimisticUpdates.get(p.id_pedido)?.updating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Actualizando...</>
              ) : (
                <>
                  <Flame className="w-4 h-4" />
                  {ordersEnCocinaRaw.length >= 6 ? 'Iniciar (Encolar en Horno)' : 'Iniciar Horno'}
                </>
              )}
            </button>
          )}
          {estado === 'en_cocina' && (
            <button
              onClick={() => handleOptimisticStatus(p.id_pedido, 'listo')}
              className={`w-full min-h-12 mt-2 py-3 px-3 ${btnTheme} btn-premium rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md`}
            >
              {optimisticUpdates.get(p.id_pedido)?.estado === 'listo' && optimisticUpdates.get(p.id_pedido)?.updating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Actualizando...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Terminado</>
              )}
            </button>
          )}

          {estado === 'listo' && (
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => handleOptimisticStatus(p.id_pedido, 'entregado')}
                className={`w-full min-h-12 py-3 px-3 ${btnTheme} btn-premium rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md`}
              >
                {optimisticUpdates.get(p.id_pedido)?.estado === 'entregado' && optimisticUpdates.get(p.id_pedido)?.updating ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Actualizando...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> {isDelivery ? 'Despachar Delivery' : isRetiro ? 'Entregar Pedido' : 'Entregar a Mesa'}</>
                )}
              </button>

              {(isDelivery || isRetiro) && p.telefono_cliente && (
                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = p.telefono_cliente!.replace(/\D/g, '');
                    let formattedPhone = cleanPhone;
                    if (!formattedPhone.startsWith('54')) {
                      if (formattedPhone.length === 10) {
                        formattedPhone = '549' + formattedPhone;
                      } else {
                        formattedPhone = '54' + formattedPhone;
                      }
                    }
                    const clientName = p.nombre_cliente || 'Cliente';
                    const msgText = isRetiro
                      ? `Hola *${clientName}*, tu pedido en *Pizzería Colores* ya está listo para retirar! 🍕 ¡Te esperamos!`
                      : `Hola *${clientName}*, tu pedido en *Pizzería Colores* ya está listo y va en camino! 🛵`;
                    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msgText)}`;
                    window.open(url, '_blank');
                  }}
                  className="w-full min-h-12 py-3 px-3 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border border-[#25D366]/20"
                >
                  <MessageSquare className="w-4 h-4" /> Notificar WhatsApp 💬
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-2">
            <button className="min-h-10 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-zinc-700 btn-premium">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <button
              onClick={() => setCancelRequest({
                pedido: p,
                title: estado === 'pendiente' ? 'Cancelar comanda pendiente' : 'Cancelar preparación en curso',
                detail: 'La orden saldrá de la cola de cocina y quedará marcada como cancelada.'
              })}
              className="min-h-10 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-red-500/20 btn-danger"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderColumn = (estado: Pedido['estado_comanda'], title: string, icon: React.ReactNode, headerClass: string, orders: Pedido[]) => {
    const isEmpty = orders.length === 0;
    const emptyMessages = {
      pendiente: { text: 'Sin pizzas pendientes', Icon: ChefHat },
      en_cocina: { text: 'Sin pizzas en el Horno', Icon: Flame },
      listo: { text: 'Sin pizzas listas para servir', Icon: Utensils }
    };

    if (estado === 'en_cocina') {
      const activeCount = ovenActive.length;
      return (
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, estado)}
          className="space-y-4 h-full min-h-[500px]"
        >
          <div className={`flex justify-between items-center p-4 rounded-t-xl border-b-[3px] glass-card text-zinc-100 shadow-sm ${headerClass}`}>
            <h4 className="font-black text-xs sm:text-sm tracking-tight flex items-center gap-2 uppercase font-display text-zinc-150">
              {icon}
              {title}
            </h4>
            <span className={`text-[11px] font-black font-mono px-3 py-1 rounded-full flex items-center justify-center shadow-sm border ${activeCount === 0 ? 'bg-white/5 text-zinc-400 border-white/5' : 'bg-[#E85D00] text-white border-[#E85D00]'}`}>
              {activeCount}/6 Horno
            </span>
          </div>

          <div className="space-y-5 max-h-[700px] overflow-y-auto pr-1">
            {/* Activas en Horno */}
            <div className="space-y-3">
              <div className="text-[10px] font-black uppercase text-[#E85D00] tracking-widest flex items-center gap-1.5 px-1">
                <Flame className="w-3.5 h-3.5 text-[#E85D00] animate-pulse" />
                En Horno Activas ({activeCount})
              </div>
              {ovenActive.length === 0 ? (
                <div className="h-24 border-2 border-dashed border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 rounded-[20px] flex flex-col justify-center items-center text-center p-4 shadow-xs transition-colors duration-300">
                  <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider">Horno Vacío</p>
                </div>
              ) : (
                ovenActive.map(p => (
                  <motion.div layout layoutId={p.id_pedido} key={p.id_pedido} className="origin-center">
                    {renderTicket(p, estado, true)}
                  </motion.div>
                ))
              )}
            </div>

            {/* Cola de Espera */}
            {ovenQueue.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-zinc-700">
                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-1.5 px-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Cola de Espera ({ovenQueue.length})
                </div>
                {ovenQueue.map(p => (
                  <motion.div layout layoutId={p.id_pedido} key={p.id_pedido} className="origin-center">
                    {renderTicket(p, estado, false)}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, estado)}
        className="space-y-4 h-full min-h-[500px]"
      >
        <div className={`flex justify-between items-center p-4 rounded-t-xl border-b-[3px] glass-card text-zinc-100 shadow-sm ${headerClass}`}>
          <h4 className="font-black text-xs sm:text-sm tracking-tight flex items-center gap-2 uppercase font-display text-zinc-150">
            {icon}
            {title}
          </h4>
          <span className={`text-[11px] font-black font-mono w-6 h-6 rounded-full flex items-center justify-center shadow-sm border transition-colors duration-300 ${isEmpty ? 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700' : 'bg-[#E8B800] text-black border-[#E8B800]'}`}>
            {orders.length}
          </span>
        </div>

        <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
          {isEmpty ? (
            <div className="h-40 border-2 border-dashed border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 rounded-[20px] flex flex-col justify-center items-center text-center p-4 shadow-xs transition-colors duration-300">
              {(() => {
                const { Icon } = emptyMessages[estado];
                return <Icon className="w-12 h-12 text-[#E8B800] mb-3 animate-pulse-soft" />;
              })()}
              <p className="text-xs text-slate-700 dark:text-zinc-300 font-bold uppercase tracking-wide transition-colors duration-300">{emptyMessages[estado].text}</p>
            </div>
          ) : (
            orders.map(p => (
              <motion.div layout layoutId={p.id_pedido} key={p.id_pedido} className="origin-center">
                {renderTicket(p, estado)}
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-5" id="kitchen-monitor-container">

      <div className="glass-card rounded-[20px] p-5 glow-yellow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#E8B800] text-black flex items-center justify-center text-xl shadow-sm border border-[#E8B800]">
              📋
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-lg text-[#E8B800] font-display uppercase tracking-wide">Producción agrupada</h3>
              <p className="text-xs text-zinc-400 font-semibold">Consolidado de preparaciones activas en fuegos.</p>
            </div>
          </div>
          <span className="bg-[#E8B800]/10 text-[#E8B800] border border-[#E8B800]/30 text-xs font-black py-1 px-3 rounded-full shadow-sm w-fit">
            {batchProduction.reduce((sum, item) => sum + item.cantidad, 0)} UNIDADES
          </span>
        </div>

        {batchProduction.length === 0 ? (
          <p className="text-xs text-zinc-400 italic text-center py-3 bg-white/5 rounded-xl border border-white/5">
            No hay comida activa en la línea de fuegos.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {batchProduction.map((item, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm font-bold text-zinc-100 shadow-sm hover:border-[#E8B800] transition-all hover:bg-white/10"
              >
                <span className="bg-[#E8B800] text-black text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center border border-[#E8B800]">
                  {item.cantidad}
                </span>
                <span>{item.nombre}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between glass-card rounded-[20px] p-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar mesa, mozo o pizza..."
            value={kitchenSearch}
            onChange={e => setKitchenSearch(e.target.value)}
            className="w-full min-h-11 pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-150 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E8B800]/40 focus:border-[#E8B800] transition-colors"
          />
        </div>
        <button
          onClick={() => setShowOnlyKitchen(!showOnlyKitchen)}
          className={`min-h-11 btn-premium flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-sm font-black transition-all cursor-pointer border ${
            showOnlyKitchen
              ? 'bg-[#E8B800] text-black border-[#E8B800] hover:bg-[#D4A700]'
              : 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {showOnlyKitchen ? 'Solo Cocina' : 'Todo'}
        </button>
        <button
          onClick={() => setShowMiseEnPlace(!showMiseEnPlace)}
          className={`min-h-11 btn-premium flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-sm font-black transition-all cursor-pointer border ${
            showMiseEnPlace
              ? 'bg-[#E85D00] text-white border-[#E85D00] hover:bg-[#d14f00]'
              : 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          {showMiseEnPlace ? 'Ocultar Prep' : 'Mise en Place'}
        </button>
      </div>

      {/* Panel de Mise en Place */}
      {showMiseEnPlace && (
        <div className="mb-6 bg-zinc-950 border border-zinc-800 rounded-[20px] p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <ChefHat className="w-5 h-5 text-[#E85D00] animate-pulse" />
            <h3 className="text-[#E8B800] font-black text-sm uppercase tracking-wider font-display">Mise en Place Consolidado (Ingredientes Activos)</h3>
          </div>
          {ingredientsConsolidated.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">No hay ingredientes requeridos en las comandas activas.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ingredientsConsolidated.map((ing, idx) => {
                const isUnderStock = ing.available < ing.qty;
                return (
                  <div key={idx} className={`p-3 rounded-xl border ${
                    isUnderStock 
                      ? 'bg-red-500/10 border-red-500/30 text-red-200' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  } flex flex-col justify-between`}>
                    <span className="text-xs font-bold truncate" title={ing.name}>{ing.name}</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-sm font-mono font-black text-[#E8B800]">
                        {ing.qty} <span className="text-[10px] opacity-75">{ing.unit}</span>
                      </span>
                      <span className="text-[9px] opacity-60">
                        Disp: {ing.available}{ing.unit}
                      </span>
                    </div>
                    {isUnderStock && (
                      <span className="text-[8px] font-black uppercase text-red-400 mt-1">⚠️ STOCK INSUFICIENTE</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Columnas */}
      <LayoutGroup>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderColumn(
            'pendiente',
            'Pendientes (Ingresos)',
            <CircleDot className="w-4 h-4 text-[#E8B800]" />,
            'border-[#E8B800]',
            ordersPendientes
          )}
          {renderColumn(
            'en_cocina',
            'En Preparación (Horno)',
            <Flame className="w-4 h-4 text-[#E85D00]" />,
            'border-[#E85D00]',
            ordersEnCocina
          )}
          {renderColumn(
            'listo',
            'Delivery',
            <CheckCircle className="w-4 h-4 text-emerald-500" />,
            'border-emerald-500',
            ordersListo
          )}
        </div>
      </LayoutGroup>

      {cancelRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="glass-card rounded-t-[20px] sm:rounded-[20px] p-6 w-full max-w-md shadow-2xl border border-white/10">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-zinc-100 font-sans">{cancelRequest.title}</h3>
                <p className="text-xs text-zinc-400 mt-1">{cancelRequest.detail}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelRequest(null)}
                className="flex-1 min-h-11 py-2.5 rounded-xl bg-white/5 text-zinc-300 text-sm font-black cursor-pointer hover:bg-white/10 transition-colors border border-white/10 btn-premium"
              >
                Volver
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 min-h-11 py-2.5 rounded-xl bg-red-650 text-white text-sm font-black cursor-pointer hover:bg-red-700 transition-colors shadow-md btn-premium"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedRecipeProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card border border-slate-200 dark:border-white/15 rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col space-y-4 font-sans text-zinc-700 dark:text-zinc-200">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <span className="text-[9px] uppercase font-black text-amber-700 dark:text-amber-400 tracking-widest block bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded w-fit">
                  {selectedRecipeProduct.categoria} • {selectedRecipeProduct.tiempo_preparacion_estimado || 15}m prep
                </span>
                <h3 className="font-sans font-black text-xl text-zinc-900 dark:text-white mt-1">{selectedRecipeProduct.nombre}</h3>
              </div>
              <button
                onClick={() => setSelectedRecipeProduct(null)}
                className="touch-target p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            {selectedRecipeProduct.imagen && (
              <img
                src={selectedRecipeProduct.imagen}
                alt={selectedRecipeProduct.nombre}
                className="w-full h-48 object-cover rounded-2xl border border-white/10 shadow-sm"
              />
            )}

            {/* Content layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Escandallo & Alérgenos */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                    ⚖️ Escandallo (Ingredientes de Receta)
                  </h4>
                  {(() => {
                    const ingredients = recetas
                      .filter(r => r.id_producto === selectedRecipeProduct.id_producto)
                      .map(r => {
                        const insumo = insumos.find(i => i.id_insumo === r.id_insumo);
                        return {
                          nombre: insumo ? insumo.nombre : r.id_insumo,
                          cantidad: r.cantidad_a_descontar,
                          unidad: r.unidad_medida || insumo?.unidad_medida || 'u'
                        };
                      });

                    return ingredients.length === 0 ? (
                      <p className="text-zinc-500 text-xs italic">Sin ingredientes registrados en escandallo.</p>
                    ) : (
                      <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-white/5 rounded-xl p-3 space-y-1.5">
                        {ingredients.map((ing, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            <span>• {ing.nombre}</span>
                            <span className="font-mono text-zinc-800 dark:text-zinc-100 font-bold bg-slate-200/60 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-slate-350/30 dark:border-white/5">
                              {ing.cantidad} {ing.unidad}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                    ⚠️ Alérgenos Declarados
                  </h4>
                  {selectedRecipeProduct.alergenos && selectedRecipeProduct.alergenos.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRecipeProduct.alergenos.map((al, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-black uppercase px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-355 border border-amber-500/20 rounded-lg shadow-xs"
                        >
                          {al}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-355 border border-emerald-500/25 rounded-lg shadow-xs inline-block">
                      Libre de alérgenos comunes
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Pasos de Preparación */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                    🍳 Pasos de Cocción y Preparación
                  </h4>
                  {selectedRecipeProduct.pasos_preparacion && selectedRecipeProduct.pasos_preparacion.length > 0 ? (
                    <ol className="space-y-2.5">
                      {selectedRecipeProduct.pasos_preparacion.map((step, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
                          <span className="w-5 h-5 rounded-full bg-[#E8B800] text-black flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-zinc-500 text-xs italic bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/5 p-3 rounded-lg">
                      No se han detallado las instrucciones de preparación paso a paso.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Plating Advice Callout */}
            {selectedRecipeProduct.consejo_emplatado && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-250 leading-relaxed">
                <Utensils className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 block mb-0.5">Sugerencia de Emplatado:</span>
                  <p className="font-semibold">"{selectedRecipeProduct.consejo_emplatado}"</p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedRecipeProduct(null)}
                className="touch-target px-5 py-2 bg-[#E8B800] hover:bg-[#D4A700] text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 btn-premium"
              >
                Cerrar Recetario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(KitchenMonitor);
