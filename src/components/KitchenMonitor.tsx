import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
  DollarSign
} from 'lucide-react';
import { Pedido, ProductoMenu, RecetaEscandallo, Insumo } from '../types';
import { useKitchenMonitor } from '../features/cocina/hooks/useKitchenMonitor';
import QuickDeliveryForm from './QuickDeliveryForm';
import { pedidosDeliveryRapidoService, PedidoDeliveryRapido } from '../services/pedidosDeliveryRapidoService';

interface KitchenMonitorProps {
  pedidos: Pedido[];
  onCambiarEstadoPedido: (idPedido: number, nuevoEstado: Pedido['estado_comanda']) => void;
  onProducirPedidoConEscandallo: (idPedido: number) => void;
  minutosGlobal: number;
  productosMenu: ProductoMenu[];
  recetas: RecetaEscandallo[];
  insumos: Insumo[];
  activeMozo?: string;
  onCrearPedido?: (pedido: Omit<Pedido, 'id_pedido' | 'fecha_hora' | 'minutos_transcurridos' | 'origen'> & { origen?: 'Mozo' | 'Rappi' | 'PedidosYa'; idempotency_key?: string }) => void;
}

export default function KitchenMonitor({
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
          id_pedido: o.id + 10000000,
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

  const handleCambiarEstadoPedidoCustom = useCallback(async (idPedido: number, nuevoEstado: Pedido['estado_comanda']) => {
    if (idPedido >= 10000000) {
      const realId = idPedido - 10000000;
      let dbEstado: 'nuevo' | 'horno' | 'delivery' | 'entregado' = 'nuevo';
      if (nuevoEstado === 'en_cocina') dbEstado = 'horno';
      else if (nuevoEstado === 'listo') dbEstado = 'delivery';
      else if (nuevoEstado === 'entregado' || nuevoEstado === 'entregado_cobrado' || nuevoEstado === 'cancelado') dbEstado = 'entregado';

      await pedidosDeliveryRapidoService.updateEstado(realId, dbEstado);
      setQuickOrders(prev => prev.map(o => o.id === realId ? { ...o, estado: dbEstado } : o));
    } else {
      onCambiarEstadoPedido(idPedido, nuevoEstado);
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

  const ordersPendientes = useMemo(() => activeKitchenOrders.filter(p => p.estado_comanda === 'pendiente'), [activeKitchenOrders]);
  const ordersEnCocina = useMemo(() => activeKitchenOrders.filter(p => p.estado_comanda === 'en_cocina'), [activeKitchenOrders]);
  const ordersListo = useMemo(() => activeKitchenOrders.filter(p => p.estado_comanda === 'listo'), [activeKitchenOrders]);
  const renderTicket = (p: Pedido, estado: Pedido['estado_comanda']) => {
    const sem = estado === 'pendiente' || estado === 'en_cocina' ? getSemaforoInfo(p.minutos_transcurridos, p) : null;
    const cold = estado === 'listo' && isColdPlate(p);
    const holdMinutes = estado === 'listo' ? Math.floor((p.segundos_en_listo ?? 0) / 60) : 0;

    const headerTheme = {
      pendiente: 'bg-white text-[#1A1A1A] border-b-2 border-[#E8B800]',
      en_cocina: 'bg-[#FFF5EE] text-[#1A1A1A] border-b-2 border-[#E85D00]',
      listo: 'bg-emerald-50 text-[#1A1A1A] border-b-2 border-emerald-500'
    }[estado];

    const btnTheme = {
      pendiente: 'bg-[#E8B800] hover:bg-[#D4A700] text-[#1A1A1A] border-[#E8B800]',
      en_cocina: 'bg-[#E85D00] hover:bg-[#d14f00] text-white border-[#E85D00]',
      listo: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500'
    }[estado];

    const isDelivery = (p.numero_mesa || '').toUpperCase().startsWith('DELIVERY:');
    const subtotalPlatos = p.items
      .filter(it => it.id_producto !== 'prod_costo_envio_delivery')
      .reduce((sum, it) => sum + (it.precio_unitario ?? 0) * it.cantidad, 0);
    const deliveryItem = p.items.find(it => it.id_producto === 'prod_costo_envio_delivery');
    const costoDelivery = (deliveryItem?.precio_unitario ?? 0) * (deliveryItem?.cantidad ?? 1);
    const totalPedido = subtotalPlatos + costoDelivery;

    const createdAgeMs = Date.now() - new Date(p.fecha_hora).getTime();
    const isRecentlyCreated = createdAgeMs > 0 && createdAgeMs < 20000;

    return (
      <div
        key={p.id_pedido}
        className={`rounded-[20px] border border-[#E8B800]/30 bg-white shadow-md overflow-hidden relative ${sem?.border || ''} border-l-4 transition-all duration-500 ${
          isRecentlyCreated ? 'ring-2 ring-amber-400 animate-pulse shadow-amber-100 shadow-lg' : ''
        }`}
      >
        {cold && (
          <div className="bg-[#D42B2B] text-white text-[9px] uppercase font-black tracking-wider px-4 py-1.5 flex items-center gap-1.5 shadow">
            <Snowflake className="w-3.5 h-3.5 animate-spin" />
            <span>Alerta: Pizza Fría • {holdMinutes}m sin retirar</span>
          </div>
        )}

        {sem?.delayed && (
          <div className="bg-[#D42B2B] text-white text-[9px] uppercase font-black tracking-wider px-4 py-1.5 flex items-center gap-1.5 shadow animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-[#E8B800] animate-bounce" />
            <span>Retraso Crítico en Horno</span>
          </div>
        )}

        <div className={`p-4 flex justify-between items-start ${headerTheme} shadow-sm`}>
          <div className="flex flex-col min-w-0">
            <span className="text-[1.6rem] sm:text-[2rem] font-black leading-none tracking-tight uppercase font-display truncate text-[#1A1A1A]">
              {p.numero_mesa}
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest opacity-60 font-mono mt-1 truncate text-[#2D3436]">
              Orden #{p.id_pedido}
            </span>
          </div>

          <div className="text-right flex flex-col items-end shrink-0 gap-1">
            {isDelivery ? (
              <span className="text-[9px] font-black uppercase text-white bg-[#E85D00] px-2 py-0.5 rounded-full border border-[#E85D00] flex items-center gap-1">
                <Bike className="w-3 h-3" />
                Delivery
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase text-[#2D3436] bg-[#E8B800]/15 px-2 py-0.5 rounded-full border border-[#E8B800]/30">
                {p.origen || 'MOZO'}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs font-mono bg-[#F5F5F5] border border-[#E8B800]/20 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3 text-[#E8B800]" />
              <span className={`text-sm font-black ${sem?.timeText || 'text-[#1A1A1A]'}`}>{p.minutos_transcurridos}m</span>
              {sem && <span className={`w-1.5 h-1.5 rounded-full ${sem.timeDot}`} />}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2">
            {p.items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 py-2.5 border-b border-dashed border-[#E8B800]/30 last:border-0"
              >
                <span className="text-lg font-black text-[#E85D00] font-mono shrink-0">
                  {it.cantidad}x
                </span>
                <span className="flex-1 font-bold text-[#2D3436] text-sm leading-snug truncate">
                  {it.nombre}
                </span>
                {(it.precio_unitario ?? 0) > 0 && (
                  <span className="text-xs font-mono font-black text-[#1A1A1A] bg-[#F5F5F5] px-2 py-0.5 rounded-md border border-[#E8B800]/20 shrink-0">
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
                <span className="text-[9px] uppercase font-black tracking-wider text-brand-black bg-[#E8B800] px-2 py-0.5 rounded-md shrink-0">
                  {isBarItem(it) ? 'BAR' : 'HORNO'}
                </span>
              </div>
            ))}
          </div>

          {(subtotalPlatos > 0 || costoDelivery > 0) && (
            <div className="bg-[#FFF9E6] border border-[#E8B800]/30 rounded-xl p-3 space-y-1.5">
              {subtotalPlatos > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#6B7280] font-semibold">Subtotal platos</span>
                  <span className="font-mono font-black text-[#1A1A1A]">${subtotalPlatos.toLocaleString('es-AR')}</span>
                </div>
              )}
              {costoDelivery > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#6B7280] font-semibold flex items-center gap-1">
                    <Bike className="w-3 h-3 text-[#E85D00]" />
                    Delivery
                  </span>
                  <span className="font-mono font-black text-[#E85D00]">${costoDelivery.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="border-t border-[#E8B800]/30 pt-1.5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A]">Total</span>
                <span className="text-sm font-black font-mono text-[#1A1A1A]">${totalPedido.toLocaleString('es-AR')}</span>
              </div>
            </div>
          )}

          {p.observaciones && (
            <div className="bg-[#F5F5F5] text-[#2D3436] text-xs p-3 rounded-xl border border-[#E8B800]/20 italic font-medium leading-relaxed">
              <strong className="text-[10px] uppercase font-black tracking-wider text-[#E85D00] block mb-0.5">
                ⚠️ Observación:
              </strong>
              "{p.observaciones}"
            </div>
          )}

          {estado === 'pendiente' && (
            <button
              onClick={() => handleOptimisticStatus(p.id_pedido, 'en_cocina')}
              className={`w-full min-h-12 mt-2 py-3 px-3 ${btnTheme} rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md`}
            >
              {optimisticUpdates.get(p.id_pedido)?.estado === 'en_cocina' && optimisticUpdates.get(p.id_pedido)?.updating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Actualizando...</>
              ) : (
                <><Flame className="w-4 h-4" /> Iniciar Horno</>
              )}
            </button>
          )}

          {estado === 'en_cocina' && (
            <button
              onClick={() => handleOptimisticStatus(p.id_pedido, 'listo')}
              className={`w-full min-h-12 mt-2 py-3 px-3 ${btnTheme} rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md`}
            >
              {optimisticUpdates.get(p.id_pedido)?.estado === 'listo' && optimisticUpdates.get(p.id_pedido)?.updating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Actualizando...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Terminado</>
              )}
            </button>
          )}

          {estado === 'listo' && (
            <button
              onClick={() => handleOptimisticStatus(p.id_pedido, 'entregado')}
              className={`w-full min-h-12 mt-2 py-3 px-3 ${btnTheme} rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md`}
            >
              {optimisticUpdates.get(p.id_pedido)?.estado === 'entregado' && optimisticUpdates.get(p.id_pedido)?.updating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Actualizando...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Entregar a Mesa</>
              )}
            </button>
          )}

          <div className="grid grid-cols-2 gap-3 mt-2">
            <button className="min-h-10 py-2 px-3 bg-white hover:bg-[#F5F5F5] text-[#2D3436] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#E8B800]/40">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <button
              onClick={() => setCancelRequest({
                pedido: p,
                title: estado === 'pendiente' ? 'Cancelar comanda pendiente' : 'Cancelar preparación en curso',
                detail: 'La orden saldrá de la cola de cocina y quedará marcada como cancelada.'
              })}
              className="min-h-10 py-2 px-3 bg-white hover:bg-red-50 text-[#D42B2B] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#D42B2B]/30"
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

    return (
      <div className="space-y-4">
        <div className={`flex justify-between items-center p-4 rounded-t-xl border-b-[3px] bg-white text-[#1A1A1A] shadow-sm ${headerClass}`}>
          <h4 className="font-black text-xs sm:text-sm tracking-tight flex items-center gap-2 uppercase font-display text-[#1A1A1A]">
            {icon}
            {title}
          </h4>
          <span className={`text-[11px] font-black font-mono w-6 h-6 rounded-full flex items-center justify-center shadow-sm border ${isEmpty ? 'bg-[#F5F5F5] text-[#6B7280] border-[#E8B800]/30' : 'bg-[#E8B800] text-[#1A1A1A] border-[#E8B800]'}`}>
            {orders.length}
          </span>
        </div>

        <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
          {isEmpty ? (
            <div className="h-40 border-2 border-dashed border-[#E8B800]/40 bg-white rounded-[20px] flex flex-col justify-center items-center text-center p-4 shadow-sm">
              {(() => {
                const { Icon } = emptyMessages[estado];
                return <Icon className="w-12 h-12 text-[#E8B800] mb-3" />;
              })()}
              <p className="text-xs text-[#2D3436] font-semibold uppercase tracking-wide">{emptyMessages[estado].text}</p>
            </div>
          ) : (
            orders.map(p => renderTicket(p, estado))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 bg-[#FAFAFA] p-4 rounded-[24px]" id="kitchen-monitor-container">
      <QuickDeliveryForm activeMozo={activeMozo} onCrearPedido={onCrearPedido || (() => {})} />

      <div className="bg-white rounded-[20px] p-5 border border-[#E8B800]/30 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[#E8B800]/20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#E8B800] text-[#1A1A1A] flex items-center justify-center text-xl shadow-sm border border-[#E8B800]">
              📋
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-lg text-[#E8B800] font-display uppercase tracking-wide">Producción agrupada</h3>
              <p className="text-xs text-[#6B7280] font-semibold">Consolidado de preparaciones activas en fuegos.</p>
            </div>
          </div>
          <span className="bg-[#E8B800]/10 text-[#1A1A1A] border border-[#E8B800]/40 text-xs font-black py-1 px-3 rounded-full shadow-sm w-fit">
            {batchProduction.reduce((sum, item) => sum + item.cantidad, 0)} UNIDADES
          </span>
        </div>

        {batchProduction.length === 0 ? (
          <p className="text-xs text-[#6B7280] italic text-center py-3 bg-[#F5F5F5] rounded-xl">
            No hay comida activa en la línea de fuegos.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {batchProduction.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E8B800]/30 rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm font-black text-[#1A1A1A] shadow-sm hover:border-[#E8B800] transition-colors"
              >
                <span className="bg-[#E8B800] text-[#1A1A1A] text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center border border-[#E8B800]">
                  {item.cantidad}
                </span>
                <span>{item.nombre}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white rounded-[20px] p-4 border border-[#E8B800]/30 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar mesa, mozo o pizza..."
            value={kitchenSearch}
            onChange={e => setKitchenSearch(e.target.value)}
            className="w-full min-h-11 pl-9 pr-3 py-2 bg-white border border-[#E8B800]/50 rounded-xl text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#E8B800]/40 focus:border-[#E8B800]"
          />
        </div>
        <button
          onClick={() => setShowOnlyKitchen(!showOnlyKitchen)}
          className={`min-h-11 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-sm font-black transition-all cursor-pointer border ${
            showOnlyKitchen
              ? 'bg-[#E8B800] text-[#1A1A1A] border-[#E8B800] hover:bg-[#D4A700]'
              : 'bg-white text-[#1A1A1A] border border-[#E8B800]/50 hover:border-[#E8B800]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {showOnlyKitchen ? 'Solo Cocina' : 'Todo'}
        </button>
      </div>

      {/* Columnas */}
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

      {cancelRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-[#f4ecd8] rounded-t-[20px] sm:rounded-[20px] p-6 w-full max-w-md shadow-2xl border border-[#d4b89a]">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-red-50 text-[#c0392b] flex items-center justify-center shrink-0 border border-[#fab1a0]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#4b3621] font-serif">{cancelRequest.title}</h3>
                <p className="text-xs text-[#4b3621]/70 mt-1">{cancelRequest.detail}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelRequest(null)}
                className="flex-1 min-h-11 py-2.5 rounded-xl bg-[#e2dabf] text-[#4b3621] text-sm font-black cursor-pointer hover:bg-[#d4b89a] transition-colors border border-[#d4b89a]"
              >
                Volver
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 min-h-11 py-2.5 rounded-xl bg-[#c0392b] text-[#f4ecd8] text-sm font-black cursor-pointer hover:bg-[#a93226] transition-colors shadow-md"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedRecipeProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#fcfaf7] border border-[#d4b89a] rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col space-y-4 font-sans text-stone-800">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#d4b89a]/30 pb-3">
              <div>
                <span className="text-[9px] uppercase font-black text-[#a0522d] tracking-widest block bg-[#e2dabf]/50 px-2 py-0.5 rounded w-fit">
                  {selectedRecipeProduct.categoria} • {selectedRecipeProduct.tiempo_preparacion_estimado || 15}m prep
                </span>
                <h3 className="font-serif font-black text-xl text-[#4b3621] mt-1">{selectedRecipeProduct.nombre}</h3>
              </div>
              <button
                onClick={() => setSelectedRecipeProduct(null)}
                className="touch-target p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            {selectedRecipeProduct.imagen && (
              <img
                src={selectedRecipeProduct.imagen}
                alt={selectedRecipeProduct.nombre}
                className="w-full h-48 object-cover rounded-2xl border border-[#d4b89a]/45 shadow-sm"
              />
            )}

            {/* Content layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Escandallo & Alérgenos */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-stone-450 uppercase tracking-widest mb-2">
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
                      <p className="text-stone-400 text-xs italic">Sin ingredientes registrados en escandallo.</p>
                    ) : (
                      <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 space-y-1.5">
                        {ingredients.map((ing, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs font-medium text-stone-700">
                            <span>• {ing.nombre}</span>
                            <span className="font-mono text-stone-900 font-bold bg-white px-2 py-0.5 rounded border border-stone-150">
                              {ing.cantidad} {ing.unidad}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-stone-450 uppercase tracking-widest mb-2">
                    ⚠️ Alérgenos Declarados
                  </h4>
                  {selectedRecipeProduct.alergenos && selectedRecipeProduct.alergenos.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRecipeProduct.alergenos.map((al, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-black uppercase px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg shadow-xs"
                        >
                          {al}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-lg shadow-xs inline-block">
                      Libre de alérgenos comunes
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Pasos de Preparación */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-stone-450 uppercase tracking-widest mb-2">
                    🍳 Pasos de Cocción y Preparación
                  </h4>
                  {selectedRecipeProduct.pasos_preparacion && selectedRecipeProduct.pasos_preparacion.length > 0 ? (
                    <ol className="space-y-2.5">
                      {selectedRecipeProduct.pasos_preparacion.map((step, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start text-xs leading-relaxed text-stone-700 font-medium">
                          <span className="w-5 h-5 rounded-full bg-[#E8B800] text-[#1A1A1A] flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-stone-450 text-xs italic bg-stone-50 border border-dashed p-3 rounded-lg">
                      No se han detallado las instrucciones de preparación paso a paso.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Plating Advice Callout */}
            {selectedRecipeProduct.consejo_emplatado && (
              <div className="bg-[#f5f1e9] border border-[#d4b89a] p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-[#4b3621] leading-relaxed">
                <Utensils className="w-4 h-4 text-[#a0522d] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase text-[#a0522d] block mb-0.5">Sugerencia de Emplatado:</span>
                  <p className="font-semibold">"{selectedRecipeProduct.consejo_emplatado}"</p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 border-t border-[#d4b89a]/30 flex justify-end">
              <button
                onClick={() => setSelectedRecipeProduct(null)}
                className="touch-target px-5 py-2 bg-[#E8B800] hover:bg-[#D4A700] text-[#1A1A1A] text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
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
