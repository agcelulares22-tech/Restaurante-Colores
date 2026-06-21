import React, { useMemo } from 'react';
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
  BookOpen
} from 'lucide-react';
import { Pedido, ProductoMenu, RecetaEscandallo, Insumo } from '../types';
import { useKitchenMonitor } from '../features/cocina/hooks/useKitchenMonitor';

interface KitchenMonitorProps {
  pedidos: Pedido[];
  onCambiarEstadoPedido: (idPedido: number, nuevoEstado: Pedido['estado_comanda']) => void;
  onProducirPedidoConEscandallo: (idPedido: number) => void;
  minutosGlobal: number;
  productosMenu: ProductoMenu[];
  recetas: RecetaEscandallo[];
  insumos: Insumo[];
}

export default function KitchenMonitor({
  pedidos,
  onCambiarEstadoPedido,
  onProducirPedidoConEscandallo,
  minutosGlobal,
  productosMenu,
  recetas,
  insumos
}: KitchenMonitorProps) {
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
    pedidos,
    onCambiarEstadoPedido,
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
      pendiente: 'bg-zinc-950 text-white',
      en_cocina: 'bg-brand-orange text-white',
      listo: 'bg-emerald-600 text-white'
    }[estado];

    const btnTheme = {
      pendiente: 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900',
      en_cocina: 'bg-brand-orange hover:bg-brand-orange/95 text-white border-brand-orange',
      listo: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
    }[estado];

    return (
      <div
        key={p.id_pedido}
        className={`rounded-[20px] border border-zinc-800 bg-zinc-950 shadow-md overflow-hidden relative ${sem?.border || ''} border-l-4`}
      >
        {cold && (
          <div className="bg-red-600 text-white text-[9px] uppercase font-black tracking-wider px-4 py-1.5 flex items-center gap-1.5 shadow">
            <Snowflake className="w-3.5 h-3.5 animate-spin" />
            <span>Alerta: Pizza Fría • {holdMinutes}m sin retirar</span>
          </div>
        )}

        {sem?.delayed && (
          <div className="bg-red-600 text-white text-[9px] uppercase font-black tracking-wider px-4 py-1.5 flex items-center gap-1.5 shadow animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
            <span>Retraso Crítico en Horno</span>
          </div>
        )}

        <div className={`p-4 flex justify-between items-start ${headerTheme} shadow-inner`}>
          <div className="flex flex-col min-w-0">
            <span className="text-[1.6rem] sm:text-[2rem] font-black leading-none tracking-tight uppercase font-display truncate">
              {p.numero_mesa}
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest opacity-70 font-mono mt-1 truncate">
              Orden #{p.id_pedido}
            </span>
          </div>

          <div className="text-right flex flex-col items-end shrink-0 gap-1">
            <span className="text-[9px] font-black uppercase text-zinc-350 bg-black/30 px-2 py-0.5 rounded-full">
              {p.origen || 'MOZO'}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono bg-black/20 border border-black/10 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span className={`text-sm font-black ${sem?.timeText || 'text-white'}`}>{p.minutos_transcurridos}m</span>
              {sem && <span className={`w-1.5 h-1.5 rounded-full ${sem.timeDot}`} />}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2">
            {p.items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 py-2.5 border-b border-dashed border-zinc-800 last:border-0"
              >
                <span className="text-lg font-black text-brand-yellow font-mono shrink-0">
                  {it.cantidad}x
                </span>
                <span className="flex-1 font-bold text-zinc-300 text-sm leading-snug truncate">
                  {it.nombre}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const prod = productosMenu.find(pm => pm.id_producto === it.id_producto);
                    if (prod) {
                      setSelectedRecipeProduct(prod);
                    }
                  }}
                  className="touch-target p-1 text-brand-orange hover:text-brand-yellow hover:bg-zinc-900 rounded transition-colors shrink-0"
                  title="Ver Receta y Emplatado"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] uppercase font-black tracking-wider text-brand-black bg-brand-yellow px-2 py-0.5 rounded-md shrink-0">
                  {isBarItem(it) ? 'BAR' : 'HORNO'}
                </span>
              </div>
            ))}
          </div>

          {p.observaciones && (
            <div className="bg-zinc-900 text-zinc-300 text-xs p-3 rounded-xl border border-zinc-800 italic font-medium leading-relaxed">
              <strong className="text-[10px] uppercase font-black tracking-wider text-brand-orange block mb-0.5">
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
            <button className="min-h-10 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-zinc-800">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <button
              onClick={() => setCancelRequest({
                pedido: p,
                title: estado === 'pendiente' ? 'Cancelar comanda pendiente' : 'Cancelar preparación en curso',
                detail: 'La orden saldrá de la cola de cocina y quedará marcada como cancelada.'
              })}
              className="min-h-10 py-2 px-3 bg-transparent hover:bg-red-950/20 text-red-500 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-red-950/45"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderColumn = (estado: Pedido['estado_comanda'], title: string, icon: React.ReactNode, headerClass: string, orders: Pedido[]) => {
    const emptyMessages = {
      pendiente: { text: 'Sin pizzas pendientes', icon: <ChefHat className="w-8 h-8 text-zinc-650 mb-2" /> },
      en_cocina: { text: 'Sin pizzas en el Horno', icon: <Flame className="w-8 h-8 text-zinc-650 mb-2" /> },
      listo: { text: 'Sin pizzas listas para servir', icon: <Utensils className="w-8 h-8 text-zinc-650 mb-2" /> }
    };

    return (
      <div className="space-y-4">
        <div className={`flex justify-between items-center p-4 rounded-t-xl border-b-[3px] ${headerClass}`}>
          <h4 className="font-black text-xs sm:text-sm tracking-tight flex items-center gap-2 uppercase font-display text-white">
            {icon}
            {title}
          </h4>
          <span className="bg-zinc-900 text-brand-yellow text-[11px] font-black font-mono w-6 h-6 rounded-full flex items-center justify-center shadow-sm border border-zinc-800">
            {orders.length}
          </span>
        </div>

        <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
          {orders.length === 0 ? (
            <div className="h-36 border border-zinc-800 rounded-[20px] flex flex-col justify-center items-center text-center p-4 bg-zinc-950">
              {emptyMessages[estado].icon}
              <p className="text-[11px] text-zinc-400 font-semibold">{emptyMessages[estado].text}</p>
            </div>
          ) : (
            orders.map(p => renderTicket(p, estado))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5" id="kitchen-monitor-container">
      <div className="bg-zinc-950 rounded-[20px] p-5 border border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-zinc-850">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-brand-yellow flex items-center justify-center text-xl shadow-sm border border-zinc-800">
              📋
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-lg text-white font-display uppercase tracking-wide">Producción agrupada</h3>
              <p className="text-xs text-zinc-400 font-semibold">Consolidado de preparaciones activas en fuegos.</p>
            </div>
          </div>
          <span className="bg-zinc-900 text-brand-yellow border border-zinc-800 text-xs font-black py-1 px-3 rounded-full shadow-sm w-fit">
            {batchProduction.reduce((sum, item) => sum + item.cantidad, 0)} UNIDADES
          </span>
        </div>

        {batchProduction.length === 0 ? (
          <p className="text-xs text-zinc-500 italic text-center py-3 bg-zinc-900/40 rounded-xl">
            No hay comida activa en la línea de fuegos.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {batchProduction.map((item, idx) => (
              <div
                key={idx}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm font-black text-white shadow-sm hover:border-brand-orange transition-colors"
              >
                <span className="bg-zinc-950 text-brand-yellow text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center border border-zinc-850">
                  {item.cantidad}
                </span>
                <span>{item.nombre}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-zinc-950 rounded-[20px] p-4 border border-zinc-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-550 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar mesa, mozo o pizza..."
            value={kitchenSearch}
            onChange={e => setKitchenSearch(e.target.value)}
            className="w-full min-h-11 pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
          />
        </div>
        <button
          onClick={() => setShowOnlyKitchen(!showOnlyKitchen)}
          className={`min-h-11 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-sm font-black transition-all cursor-pointer border ${
            showOnlyKitchen
              ? 'bg-brand-orange text-white border-brand-orange'
              : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-850'
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
          <CircleDot className="w-4 h-4 text-brand-orange" />,
          'bg-zinc-900 border-zinc-850',
          ordersPendientes
        )}
        {renderColumn(
          'en_cocina',
          'En Preparación (Horno)',
          <Flame className="w-4 h-4 text-brand-orange" />,
          'bg-brand-orange/15 border-brand-orange/30',
          ordersEnCocina
        )}
        {renderColumn(
          'listo',
          'Listos (A Servir)',
          <CheckCircle className="w-4 h-4 text-emerald-500" />,
          'bg-emerald-950/20 border-emerald-900/30',
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
                          <span className="w-5 h-5 rounded-full bg-[#624A3E] text-white flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
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
                className="touch-target px-5 py-2 bg-[#624A3E] hover:bg-[#503C32] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
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
