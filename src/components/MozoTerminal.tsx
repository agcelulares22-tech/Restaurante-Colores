import React, { useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Minus, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle, 
  Bookmark, 
  Search, 
  Sparkles, 
  Coffee, 
  Pizza, 
  UtensilsCrossed, 
  Wine, 
  DollarSign, 
  Receipt,
  UserCheck,
  RefreshCw,
  MoreVertical,
  Pencil,
  EyeOff,
  X,
  Printer,
  Download
} from 'lucide-react';
import { Mesa, Insumo, ProductoMenu, RecetaEscandallo, Pedido, PedidoItem, Usuario, EventoLog } from '../types';
import { useMenu, useSalon, useInventario, usePedidos } from '../context/AppContext';
import { useToast, ToastContainer } from './ToastContainer';
import { useMozoTerminal } from '../features/salon/hooks/useMozoTerminal';
import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { useCategories } from '../hooks/useCategories';

interface MozoTerminalProps {
  mesas: Mesa[];
  insumos: Insumo[];
  productosMenu: ProductoMenu[];
  setProductosMenu: (items: ProductoMenu[] | ((prev: ProductoMenu[]) => ProductoMenu[])) => void;
  recetas: RecetaEscandallo[];
  usuarios: Usuario[];
  activeMozo: string;
  onMozoChange: (mozo: string) => void;
  onCrearPedido: (pedido: Omit<Pedido, 'id_pedido' | 'fecha_hora' | 'minutos_transcurridos' | 'origen'> & { origen?: 'Mozo'; idempotency_key?: string }) => void | Promise<void>;
  pedidos: Pedido[];
  onFacturarMesa: (idPedido: number) => void;
  addLog: (tipo: EventoLog['tipo'], mensaje: string) => void;
  permitirVentaSinStock?: boolean;
}

const renderCategoryIcon = (categoriaName: string, categories: any[]) => {
  const cat = categories.find(c => c.nombre.toLowerCase() === categoriaName.toLowerCase());
  const iconName = cat?.icono;
  if (iconName === 'Wine') return <Wine className="w-3.5 h-3.5 text-brand-orange" />;
  if (iconName === 'Coffee') return <Coffee className="w-3.5 h-3.5 text-brand-orange" />;
  if (iconName === 'Pizza') return <Pizza className="w-3.5 h-3.5 text-brand-orange" />;
  return <UtensilsCrossed className="w-3.5 h-3.5 text-brand-orange" />;
};

export default function MozoTerminal({
  mesas: propMesas,
  insumos: propInsumos,
  productosMenu: propProductosMenu,
  setProductosMenu: propSetProductosMenu,
  recetas: propRecetas,
  usuarios: propUsuarios = [],
  activeMozo: propActiveMozo,
  onMozoChange: propOnMozoChange,
  onCrearPedido: propOnCrearPedido,
  pedidos: propPedidos,
  onFacturarMesa: propOnFacturarMesa,
  addLog: propAddLog,
  permitirVentaSinStock = false
}: MozoTerminalProps) {
  // Use context as primary source, fall back to props for backward compat
  const ctxMenu = useMenu();
  const ctxSalon = useSalon();
  const ctxInventario = useInventario();
  const ctxPedidos = usePedidos();

  const productosMenu = propProductosMenu ?? ctxMenu.productosMenu;
  const setProductosMenu = propSetProductosMenu ?? ctxMenu.setProductosMenu;
  const recetas = propRecetas ?? ctxMenu.recetas;
  const insumos = propInsumos ?? ctxInventario.insumos;
  const pedidos = propPedidos ?? ctxPedidos.pedidos;
  const mesas = propMesas ?? ctxSalon.mesas;
  const usuarios = propUsuarios;
  const activeMozo = propActiveMozo ?? ctxSalon.activeMozo;
  const onMozoChange = propOnMozoChange ?? ctxSalon.setActiveMozo;
  const onCrearPedido = propOnCrearPedido ?? ctxPedidos.handleCrearPedido;
  const onFacturarMesa = propOnFacturarMesa ?? ctxPedidos.handleFacturarMesa;
  const addLog = propAddLog ?? (() => {});
  const { toast, toasts, removeToast } = useToast();
  const { categories } = useCategories();

  const isOnline = Boolean(tryGetActiveSupabaseClient());

  const {
    AVAILABLE_TOPPINGS,
    handleCreateHalfHalfPizza,
    handleCreatePizzaWithToppings,
    selectedMesaId,
    comensales,
    setComensales,
    searchQuery,
    setSearchQuery,
    selectedCategoria,
    setSelectedCategoria,
    cart,
    observaciones,
    setObservaciones,
    checkoutStatus,
    adminMenuProduct,
    setAdminMenuProduct,
    editingPriceProduct,
    setEditingPriceProduct,
    editingPriceValue,
    setEditingPriceValue,
    splittingPedidoId,
    setSplittingPedidoId,
    splitCount,
    setSplitCount,
    splitItemsChecked,
    setSplitItemsChecked,
    isAdmin,
    selectedMesa,
    activePedidoDeMesa,
    filteredProducts,
    totalCartValue,
    handleSelectMesa,
    getSimulatedStockRemaining,
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    checkoutCart,
    handleDownloadPreTicket,
    handlePrintSplitTicket,
    handleUpdatePrice,
    handleToggleAvailability,
    dynamicMesas,
    isSameTable
  } = useMozoTerminal({
    mesas,
    insumos,
    productosMenu,
    setProductosMenu,
    recetas,
    usuarios,
    activeMozo,
    onMozoChange,
    onCrearPedido,
    pedidos,
    onFacturarMesa,
    addLog,
    permitirVentaSinStock,
    toast
  });

  const [showHalfHalfModal, setShowHalfHalfModal] = React.useState(false);
  const [halfPizzaA, setHalfPizzaA] = React.useState<string>('');
  const [halfPizzaB, setHalfPizzaB] = React.useState<string>('');

  const [showToppingsModal, setShowToppingsModal] = React.useState(false);
  const [toppingsBaseProduct, setToppingsBaseProduct] = React.useState<any>(null);
  const [selectedToppings, setSelectedToppings] = React.useState<string[]>([]);

  const pizzaProducts = useMemo(() => {
    return productosMenu.filter(p => p.activo && p.categoria.toLowerCase().includes('pizza') && !p.id_producto.startsWith('half_') && !p.id_producto.includes('_with_'));
  }, [productosMenu]);

  return (
    <>
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6" id="mozo-terminal-container">
      <div className="min-w-0 space-y-4 lg:col-span-4 lg:space-y-6 order-1">
        
        {/* Active Waiter Picker */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 flex justify-between items-center min-w-0">
              <div>
                <p className="text-xs text-slate-400 font-medium font-sans">Mozo en Turno Activo</p>
                <h3 className="font-bold text-slate-800 font-sans tracking-tight">Terminal Registrada</h3>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border shrink-0 ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                  : 'bg-amber-50 text-amber-700 border-amber-200/50'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                {isOnline ? 'Online (Nube)' : 'Offline (Local)'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {usuarios.filter(usuario => usuario.activo !== false && usuario.rol !== 'cocina').map(usuario => (
              <button
                key={usuario.id_usuario}
                onClick={() => onMozoChange(usuario.nombre)}
                className={`min-h-11 py-2 px-3 rounded-lg text-sm font-extrabold transition-all cursor-pointer ${
                  activeMozo === usuario.nombre
                    ? 'bg-brand-yellow text-brand-black shadow-sm scale-[1.02] border border-brand-yellow' 
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-zinc-100'
                }`}
              >
                {usuario.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Mesas Selector Grid */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm md:text-base text-slate-800 font-sans tracking-tight flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-slate-500" />
              Distribución de Mesas
            </h3>
            <span className="text-[11px] font-mono bg-slate-50 text-slate-500 px-2 py-0.5 rounded">
              {dynamicMesas.filter(m => m.estado === 'ocupada').length} Ocupadas
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {dynamicMesas.map(m => {
              const isSelected = m.id_mesa === selectedMesaId;
              const isOcupada = m.estado === 'ocupada';
              const isInCuenta = m.estado === 'esperando_cuenta';
              const isReservada = m.estado === 'reservada';

              // Determine visual theme according to exact state specs
              let stateClasses = "border-stone-200 bg-white hover:bg-stone-50 text-stone-700";
              let labelText = "Libre";

              if (isSelected) {
                stateClasses = "bg-brand-yellow text-brand-black border-brand-yellow shadow-md scale-[1.03] ring-4 ring-brand-yellow/20";
                labelText = isOcupada ? "Ocupada (Sel)" : isInCuenta ? "En Cuenta" : isReservada ? "Reservada" : "Libre";
              } else if (isReservada) {
                stateClasses = "border-[#6d3f9e] bg-[#6d3f9e]/5 text-[#6d3f9e] hover:bg-[#6d3f9e]/10";
                labelText = "Reservada";
              } else if (isInCuenta) {
                stateClasses = "border-[#c47f1a] bg-[#c47f1a]/5 text-[#c47f1a] hover:bg-[#c47f1a]/10";
                labelText = "En Cuenta";
              } else if (isOcupada) {
                stateClasses = "border-[#2563a0] bg-[#2563a0]/5 text-[#2563a0] hover:bg-[#2563a0]/10";
                labelText = "Ocupada";
              }

              const activePedido = isOcupada ? pedidos.find(p => 
                isSameTable(m, p) && 
                ['abierta', 'pendiente', 'en_cocina', 'listo', 'entregado'].includes(p.estado_comanda)
              ) : null;

              const elapsedMin = activePedido 
                ? Math.max(0, Math.floor((Date.now() - new Date(activePedido.fecha_hora).getTime()) / 60000))
                : 0;

              return (
                <button
                  key={m.id_mesa}
                  id={`mesa-btn-${m.id_mesa}`}
                  onClick={() => handleSelectMesa(m)}
                  className={`min-h-[72px] p-2.5 rounded-xl flex flex-col justify-between items-center transition-all aspect-square sm:aspect-auto sm:h-24 border cursor-pointer ${stateClasses}`}
                >
                  <span className="text-xs sm:text-sm font-black font-sans">{m.numero_mesa}</span>
                  {isOcupada ? (
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                      <div className="flex items-center gap-0.5">
                        <Users className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-[#2563a0]'}`} />
                        <span className="text-[10px] sm:text-xs font-bold">{m.comensales || 0}</span>
                      </div>
                      {elapsedMin > 0 && (
                        <span className={`text-[8px] font-mono font-bold ${isSelected ? 'text-white/80' : 'text-[#2563a0]/80 bg-[#2563a0]/5 px-1 rounded'}`}>
                          ⏱️ {elapsedMin}m
                        </span>
                      )}
                    </div>
                  ) : isInCuenta ? (
                    <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-extrabold text-[#c47f1a] text-center leading-tight">Saldar</span>
                  ) : (
                    <span className={`text-[8px] sm:text-[10px] uppercase tracking-wider font-semibold opacity-80 text-center leading-tight ${isSelected ? 'text-white/60' : ''}`}>{labelText}</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedMesa && (
            <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{selectedMesa.numero_mesa}</h4>
                  <p className="text-xs text-slate-400">
                    Estado: <span className={selectedMesa.estado === 'ocupada' ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
                      {selectedMesa.estado === 'ocupada' ? 'Ocupada / Con Pedido' : 'Libre para comandar'}
                    </span>
                  </p>
                </div>
                {selectedMesa.estado === 'libre' && (
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-1 gap-2">
                    <button 
                      onClick={() => setComensales(c => Math.max(1, c - 1))}
                      className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold px-1">{comensales}</span>
                    <button 
                      onClick={() => setComensales(c => c + 1)}
                      className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      +
                    </button>
                    <span className="text-[10px] text-slate-400 mr-1">pax</span>
                  </div>
                )}
              </div>

              {/* ACTIVE ORDER CONTROLS (IF TABLE OCCUPIED) */}
              {activePedidoDeMesa ? (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Orden Activa #{activePedidoDeMesa.id_pedido}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      activePedidoDeMesa.estado_comanda === 'listo' 
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : activePedidoDeMesa.estado_comanda === 'en_cocina'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {activePedidoDeMesa.estado_comanda === 'en_cocina' ? 'En Fuego 🔥' : activePedidoDeMesa.estado_comanda}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
                    {activePedidoDeMesa.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-600">
                        <span>{it.cantidad}x {it.nombre}</span>
                        <span className="font-mono text-slate-400 font-medium">
                          ${(productosMenu.find(p => p.id_producto === it.id_producto)?.precio_venta || 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 mb-3">
                    <span className="text-xs font-bold text-slate-600">Total acumulado</span>
                    <span className="text-sm font-black font-mono text-slate-800">
                      ${activePedidoDeMesa.items.reduce((sum, it) => sum + (it.cantidad * (productosMenu.find(p => p.id_producto === it.id_producto)?.precio_venta || 0)), 0).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSplittingPedidoId(activePedidoDeMesa.id_pedido)}
                      className="flex-1 py-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      Dividir Cuenta
                    </button>
                    <button
                      onClick={() => onFacturarMesa(activePedidoDeMesa.id_pedido)}
                      className="flex-1 py-1.5 px-2.5 bg-slate-900 border border-transparent hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer"
                    >
                      Cobrar Mesa
                    </button>
                  </div>
                  <button
                    onClick={() => handleDownloadPreTicket(activePedidoDeMesa)}
                    className="w-full mt-2 py-2 px-3 bg-zinc-100 hover:bg-brand-yellow hover:text-brand-black text-zinc-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-zinc-200 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Descargar / Imprimir Pre-Ticket
                  </button>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handlePrintSplitTicket(activePedidoDeMesa, 'cocina')}
                      className="flex-1 py-1.5 px-2 bg-stone-100 hover:bg-brand-yellow hover:text-brand-black text-stone-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors border border-stone-200 cursor-pointer"
                    >
                      🍳 Comanda Cocina
                    </button>
                    <button
                      onClick={() => handlePrintSplitTicket(activePedidoDeMesa, 'barra')}
                      className="flex-1 py-1.5 px-2 bg-stone-100 hover:bg-brand-yellow hover:text-brand-black text-stone-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors border border-stone-200 cursor-pointer"
                    >
                      🍷 Comanda Barra
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-amber-50/50 border border-amber-100/30 p-2 text-center rounded-lg">
                  🍳 Mesa lista para recibir comandas. Agrega ítems a la canasta de la derecha.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CENTRAL COLUMN: Product Catalog */}
      <div className="min-w-0 lg:col-span-5 space-y-4 order-3 lg:order-2">
         {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-105 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <h3 className="font-extrabold text-sm md:text-base text-[#624A3E] tracking-wider uppercase">Filtro de Categorías Premium</h3>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar pizza o bebida..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-11 pl-9 pr-3 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#624A3E] focus:border-[#624A3E] transition-all"
                />
              </div>
              <button
                onClick={() => {
                  if (pizzaProducts.length > 0) {
                    setHalfPizzaA(pizzaProducts[0].id_producto);
                    setHalfPizzaB(pizzaProducts.length > 1 ? pizzaProducts[1].id_producto : pizzaProducts[0].id_producto);
                    setShowHalfHalfModal(true);
                  } else {
                    toast.error('No hay pizzas suficientes disponibles para armar Mitad y Mitad.');
                  }
                }}
                className="min-h-11 py-2 px-4 rounded-xl text-xs font-black bg-brand-orange text-white hover:bg-brand-orange/95 cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm border border-brand-orange/20"
                title="Armar pizza Mitad y Mitad"
              >
                <Pizza className="w-3.5 h-3.5" />
                Mitad y Mitad
              </button>
            </div>
          </div>

          <div className="flex gap-1.5 w-full overflow-x-auto py-1.5 scrollbar-thin scroll-smooth border-t border-stone-100 pt-3 pb-2">
            {[
              { id: 'todo', label: 'Todos' },
              ...categories.map(c => ({ id: c.slug, label: c.nombre }))
            ].map(cat => {
              const count = cat.id === 'todo' 
                ? productosMenu.filter(p => p.activo).length 
                : productosMenu.filter(p => {
                    if (!p.activo) return false;
                    const normalizeCategorySlug = (categoria: string): string => {
                      const norm = categoria.toLowerCase().trim()
                        .normalize('NFD')
                        .replace(/[̀-ͯ]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)+/g, '');

                      if (norm === 'calzone-y-empanadas' || norm === 'calzones-y-empanadas') {
                        return 'calzones-y-empanadas';
                      }
                      if (norm === 'pizzas-tradicionales' || norm === 'pizzas-gourmet' || norm === 'pizzas') {
                        return 'pizzas';
                      }
                      if (norm === 'bebidas' || norm === 'bodega') {
                        return 'bebidas';
                      }
                      return norm;
                    };
                    return normalizeCategorySlug(p.categoria) === cat.id;
                  }).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoria(cat.id)}
                  className={`py-1.5 px-3 text-xs font-extrabold rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 ${
                    selectedCategoria === cat.id 
                      ? 'bg-brand-yellow text-brand-black shadow-sm ring-1 ring-brand-yellow/10' 
                      : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-zinc-100 hover:text-stone-900'
                  }`}
                >
                  {cat.label}
                  <span className={`text-[9px] font-bold ml-0.5 ${selectedCategoria === cat.id ? 'text-brand-black/75' : 'text-stone-400'}`}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
 
        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-2 gap-3 lg:max-h-[550px] lg:overflow-y-auto lg:pr-1">
          {filteredProducts.map(p => {
            const stockRemaining = getSimulatedStockRemaining(p);
            const isOutOfStock = stockRemaining <= 0;
            const isLowStock = stockRemaining > 0 && stockRemaining <= 3;
            const currentInCart = cart[p.id_producto] || 0;
 
            return (
              <div
                key={p.id_producto}
                onClick={() => !isOutOfStock && handleAddToCart(p.id_producto)}
                className={`group cursor-pointer rounded-2xl bg-white border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 relative ${
                  isOutOfStock 
                    ? 'opacity-60 border-rose-100 pointer-events-none bg-stone-50' 
                    : currentInCart > 0 
                      ? 'border-brand-yellow bg-zinc-50 ring-1 ring-brand-yellow/25' 
                      : 'border-stone-200/80 hover:-translate-y-1'
                }`}
                style={{ contentVisibility: 'auto' }}
              >
                {/* Product Image */}
                <div className="h-24 sm:h-28 w-full bg-stone-50 relative overflow-hidden">
                  <img
                    src={p.imagen}
                    alt={p.nombre}
                    loading="lazy" decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Category icon badge */}
                  <div className="absolute top-2 left-2 p-1.5 rounded-lg backdrop-blur-md bg-white/90 shadow-sm border border-stone-100">
                    {renderCategoryIcon(p.categoria, categories)}
                  </div>
 
                  {/* Stock Tag Alert */}
                  {isOutOfStock ? (
                    <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center text-center p-2">
                      <span className="bg-[#EF4444] text-white text-[10px] uppercase font-extrabold tracking-wider px-2 py-1 rounded-md shadow flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-white" />
                        Sin Stock (Fórmulas 0)
                      </span>
                    </div>
                  ) : isLowStock ? (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-[#F97316] text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow">
                        Bajo stock: {stockRemaining}u
                      </span>
                    </div>
                  ) : (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-[#22C55E] text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow">
                        Disp: {stockRemaining}u
                      </span>
                    </div>
                  )}
                </div>
 
                {/* Content: stacked layout - name full width, price+actions below */}
                <div className="p-3 bg-white">
                  <h4 className="font-extrabold text-stone-800 text-sm font-sans line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-brand-orange transition-colors">
                    {p.nombre}
                  </h4>
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      {editingPriceProduct === p.id_producto ? (
                        <div className="flex items-center gap-1">
                          <input type="number" value={editingPriceValue} step={100}
                            onChange={e => setEditingPriceValue(Number(e.target.value))}
                            className="w-24 text-xs font-black font-mono p-1 border border-brand-yellow rounded bg-zinc-50 focus:outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleUpdatePrice(p.id_producto, editingPriceValue)}
                            className="text-[10px] bg-brand-yellow text-brand-black px-1.5 py-1 rounded font-bold cursor-pointer">OK</button>
                          <button onClick={() => setEditingPriceProduct(null)}
                            className="text-[10px] bg-stone-200 px-1.5 py-1 rounded font-bold cursor-pointer">
                            <X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <span className="text-stone-900 font-mono text-sm font-black truncate">
                          ${p.precio_venta.toLocaleString('es-AR')}
                        </span>
                      )}
                      {currentInCart > 0 && (
                        <span className="bg-brand-yellow text-brand-black rounded-full px-1.5 py-0.1 text-[9px] font-black font-mono shrink-0">
                          {currentInCart} en bolsa
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {p.categoria.toLowerCase().includes('pizza') && !p.id_producto.includes('_with_') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setToppingsBaseProduct(p);
                            setSelectedToppings([]);
                            setShowToppingsModal(true);
                          }}
                          className="touch-target px-2 h-8 sm:h-9 rounded-lg bg-brand-yellow text-brand-black hover:bg-[#D4A700] border border-brand-yellow active:scale-90 transition-all text-[10px] font-black cursor-pointer flex items-center justify-center gap-1 mr-1 shadow-sm"
                          title="Adicionales de pizza"
                        >
                          🍕 +Extras
                        </button>
                      )}
                      {[1, 2, 3].map(n => (
                        <button
                          key={n}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) handleAddToCart(p.id_producto, n);
                          }}
                          className="touch-target w-10 h-8 sm:w-11 sm:h-9 rounded-lg bg-brand-yellow/10 text-brand-orange hover:bg-brand-yellow hover:text-brand-black active:scale-90 transition-all text-xs font-extrabold cursor-pointer flex items-center justify-center"
                          title={`Agregar ${n}`}
                        >
                          +{n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Admin gear menu - floating on image */}
                {isAdmin && (
                  <div className="absolute top-2 right-2">
                    <button onClick={(e) => { e.stopPropagation(); setAdminMenuProduct(adminMenuProduct === p.id_producto ? null : p.id_producto); }}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm border border-stone-200 text-stone-500 hover:text-stone-700 transition-all cursor-pointer backdrop-blur-sm">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {adminMenuProduct === p.id_producto && (
                      <div className="absolute top-9 right-0 z-50 bg-white border border-stone-200 rounded-xl shadow-xl py-1 w-44"
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setEditingPriceProduct(p.id_producto); setEditingPriceValue(p.precio_venta); setAdminMenuProduct(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-stone-700 hover:bg-amber-50 transition-colors cursor-pointer">
                          <Pencil className="w-3.5 h-3.5 text-amber-600" /> Editar Precio
                        </button>
                        <button onClick={() => handleToggleAvailability(p.id_producto)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                          <EyeOff className="w-3.5 h-3.5" /> {p.activo ? 'Ocultar / Dar de Baja' : 'Restaurar'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Comanda Cart Summary */}
      <div className="min-w-0 lg:col-span-3 order-2">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col min-h-[320px] sm:min-h-[400px] lg:h-[520px] lg:sticky lg:top-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm md:text-base font-sans flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              Nueva Comanda
            </h3>
            {selectedMesa && (
              <span className="bg-slate-900 text-white font-sans text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded">
                {selectedMesa.numero_mesa}
              </span>
            )}
          </div>

          {!selectedMesaId ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm">Seleccione Mesa</h4>
              <p className="text-slate-400 text-xs mt-1 max-w-[180px]">
                Marque una mesa disponible en el plano izquierdo para iniciar la comanda.
              </p>
            </div>
          ) : Object.keys(cart).length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm">Comanda Vacía</h4>
              <p className="text-slate-400 text-xs mt-1 max-w-[180px]">
                Toque los platos de la carta central para cargarlos a la mesa de forma interactiva.
              </p>
            </div>
          ) : (
            <>
              {/* CART ITEMS LIST */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
                {Object.entries(cart).map(([prodId, qty]) => {
                  const p = productosMenu.find(item => item.id_producto === prodId)!;
                  return (
                    <div key={prodId} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex-1 pr-1 font-sans">
                        <span className="font-bold text-slate-800 line-clamp-1">{p.nombre}</span>
                  <span className="text-[10px] text-slate-400 font-mono">${(p.precio_venta).toLocaleString('es-AR')} u.</span>
                       </div>

                       <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRemoveFromCart(prodId)}
                          className="touch-target w-8 h-8 bg-white hover:bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-sm font-bold w-5 text-center">{qty}</span>
                        <button
                          onClick={() => handleAddToCart(prodId)}
                          className="touch-target w-8 h-8 bg-white hover:bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* OBSERVATIONS INPUT */}
              <div className="mt-2 space-y-1.5 pb-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-slate-400" />
                  Observaciones de Comanda
                </label>
                <textarea
                  placeholder="Ej: Bife bien cocido, papas sin sal, agua a temperatura ambiente..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full min-h-11 text-base text-slate-700 p-2.5 border border-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-950 resize-none h-16"
                />
              </div>

              {/* Cart count badge */}
              <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium pb-1">
                <span>{Object.keys(cart).length} productos distintos</span>
                <button
                  onClick={handleClearCart}
                  className="touch-target text-rose-500 hover:text-rose-700 font-bold uppercase tracking-wider cursor-pointer text-xs"
                >
                  Vaciar Carrito
                </button>
              </div>

              {/* FOOTER TOTAL & INJECT BTN */}
              <div className="pt-3 border-t border-slate-150 space-y-3">
                <div className="flex justify-between items-center text-sm font-sans font-medium text-slate-700">
                  <span>Monto Total:</span>
                  <span className="font-mono font-extrabold text-slate-900 text-base">
                    ${totalCartValue.toLocaleString('es-AR')}
                  </span>
                </div>

                <button
                  onClick={checkoutCart}
                  disabled={checkoutStatus === 'sending'}
                  className={`w-full min-h-11 py-3 px-4 rounded-xl text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-md transition-all duration-100 cursor-pointer border ${
                    checkoutStatus === 'done'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                      : checkoutStatus === 'sending'
                      ? 'bg-amber-500 text-white border-amber-400 animate-pulse'
                      : 'bg-[#624A3E] hover:bg-[#503C32] active:scale-95 text-white border-amber-950/10 shadow-[#624A3E]/20'
                  }`}
                >
                  {checkoutStatus === 'done' ? (
                    <><CheckCircle className="w-3.5 h-3.5" /> Pedido Enviado ✓</>
                  ) : checkoutStatus === 'sending' ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 text-amber-300" /> Enviar a Cocina 🚀</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BILL SPLITTING MODAL (MODO DIVISION DE CUENTAS) */}
      {splittingPedidoId !== null && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl max-w-md w-full max-h-[92vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 font-sans tracking-tight flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Divisor de Cuentas Gastronómico
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Mesa {pedidos.find(p => p.id_pedido === splittingPedidoId)?.numero_mesa} • Orden #{splittingPedidoId}
                </p>
              </div>
              <button
                onClick={() => {
                  setSplittingPedidoId(null);
                  setSplitItemsChecked({});
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {(() => {
              const p = pedidos.find(o => o.id_pedido === splittingPedidoId);
              if (!p) return null;

              const orderTotal = p.items.reduce((sum, item) => {
                const prod = productosMenu.find(pr => pr.id_producto === item.id_producto);
                return sum + (prod ? prod.precio_venta * item.cantidad : 0);
              }, 0);

              // Expand items list by their quantity for itemized selection
              const expandedItemsList: { item: PedidoItem; index: number; singlePrice: number }[] = [];
              let curIdx = 0;
              p.items.forEach(it => {
                const prod = productosMenu.find(pr => pr.id_producto === it.id_producto);
                const sPrice = prod ? prod.precio_venta : 0;
                for (let i = 0; i < it.cantidad; i++) {
                  expandedItemsList.push({ item: it, index: curIdx++, singlePrice: sPrice });
                }
              });

              // Selected items total
              const itemizedTotal = Object.entries(splitItemsChecked).reduce((total, [idxStr, checked]) => {
                if (!checked) return total;
                const idx = parseInt(idxStr);
                return total + (expandedItemsList[idx]?.singlePrice || 0);
              }, 0);

              return (
                <div className="space-y-4">
                  {/* Option A: Equitative Split */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      A. División Equitativa (Por Comensales)
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1.5 gap-2.5">
                        <button 
                          onClick={() => setSplitCount(c => Math.max(2, c - 1))}
                          className="touch-target w-8 h-8 rounded bg-slate-50 flex items-center justify-center font-bold text-sm active:scale-90"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold font-mono w-5 text-center">{splitCount}</span>
                        <button 
                          onClick={() => setSplitCount(c => c + 1)}
                          className="touch-target w-8 h-8 rounded bg-slate-50 flex items-center justify-center font-bold text-sm active:scale-90"
                        >
                          +
                        </button>
                        <span className="text-[10px] text-slate-400">personas</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-medium">Equivale a:</p>
                        <p className="text-sm font-extrabold font-mono text-emerald-700">
                          ${(orderTotal / splitCount).toLocaleString('es-AR', { maximumFractionDigits: 1 })} c/u
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option B: Split by Select/Chair consumption */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      B. Desglose Específico (Silla / Consumo Unitario)
                    </h4>
                    
                    <p className="text-[10px] text-slate-400 italic">
                      Tilde los platos que pagará este comensal de manera individual:
                    </p>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50">
                      {expandedItemsList.map(({ item, index, singlePrice }) => (
                        <label 
                          key={index}
                          className="flex items-center justify-between text-xs p-1.5 bg-white border border-slate-100 rounded hover:bg-slate-50 hover:border-slate-200 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!splitItemsChecked[index]}
                              onChange={(e) => {
                                setSplitItemsChecked(prev => ({
                                  ...prev,
                                  [index]: e.target.checked
                                }));
                              }}
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-950 w-3.5 h-3.5"
                            />
                            <span className="font-medium text-slate-700">{item.nombre}</span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-600 font-bold">${singlePrice.toLocaleString('es-AR')}</span>
                        </label>
                      ))}
                    </div>

                    {itemizedTotal > 0 && (
                      <div className="flex justify-between items-center bg-slate-900 text-white rounded-xl p-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Pago Seleccionado</span>
                          <h4 className="font-mono font-extrabold text-sm">${itemizedTotal.toLocaleString('es-AR')}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Sobrante Total</span>
                          <p className="font-mono text-[11px] font-semibold">${(orderTotal - itemizedTotal).toLocaleString('es-AR')}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Facturar Botonera */}
                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => {
                        setSplittingPedidoId(null);
                        setSplitItemsChecked({});
                      }}
                      className="flex-1 py-2 text-xs bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 font-medium"
                    >
                      Volver
                    </button>
                    <button
                      onClick={() => {
                        const amntToPay = itemizedTotal > 0 ? itemizedTotal : orderTotal;
                        toast.success(`Se procesó el cobro de ${amntToPay.toLocaleString('es-AR')} para ${p.numero_mesa}.`);
                        
                        // If fully paid or equal split, complete it
                        if (itemizedTotal === 0 || itemizedTotal === orderTotal) {
                          onFacturarMesa(p.id_pedido);
                        } else {
                          // partial pay, we log it
                          addLog('sistema', `Mesa ${p.numero_mesa}: Cobro parcial de $${itemizedTotal.toLocaleString('es-AR')} recibido.`);
                                  toast.warning(`Cobro parcial registrado. Saldo pendiente: $${(orderTotal - itemizedTotal).toLocaleString('es-AR')}. La mesa sigue abierta.`);
                        }
                        setSplittingPedidoId(null);
                        setSplitItemsChecked({});
                      }}
                      className="flex-1 py-2 text-xs bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl shadow flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Cobrar ${ (itemizedTotal > 0 ? itemizedTotal : orderTotal).toLocaleString('es-AR') }
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>

      {/* MODAL MITAD Y MITAD */}
      {showHalfHalfModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-stone-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-800 text-base uppercase tracking-wider flex items-center gap-2">
                🍕 Armar Pizza Mitad y Mitad
              </h3>
              <button onClick={() => setShowHalfHalfModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Primera Mitad:</label>
                <select
                  value={halfPizzaA}
                  onChange={(e) => setHalfPizzaA(e.target.value)}
                  className="w-full min-h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-700 focus:outline-none"
                >
                  {pizzaProducts.map(p => (
                    <option key={p.id_producto} value={p.id_producto}>
                      {p.nombre} (${p.precio_venta.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Segunda Mitad:</label>
                <select
                  value={halfPizzaB}
                  onChange={(e) => setHalfPizzaB(e.target.value)}
                  className="w-full min-h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-700 focus:outline-none"
                >
                  {pizzaProducts.map(p => (
                    <option key={p.id_producto} value={p.id_producto}>
                      {p.nombre} (${p.precio_venta.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const prodA = pizzaProducts.find(p => p.id_producto === halfPizzaA);
                const prodB = pizzaProducts.find(p => p.id_producto === halfPizzaB);
                if (!prodA || !prodB) return null;
                const avgPrice = Math.round((prodA.precio_venta + prodB.precio_venta) / 2);
                return (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Precio Proporcional Estimado:</span>
                    <span className="font-mono text-lg font-black text-amber-900">${avgPrice.toLocaleString('es-AR')}</span>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowHalfHalfModal(false)}
                className="flex-1 min-h-11 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-sm cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleCreateHalfHalfPizza(halfPizzaA, halfPizzaB);
                  setShowHalfHalfModal(false);
                  toast.success('Pizza Mitad y Mitad agregada a la bolsa.');
                }}
                className="flex-1 min-h-11 bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black rounded-xl text-sm cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                Agregar Pizza
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TOPPINGS / EXTRAS */}
      {showToppingsModal && toppingsBaseProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-stone-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-800 text-base uppercase tracking-wider flex items-center gap-2">
                🍕 Adicionales: {toppingsBaseProduct.nombre}
              </h3>
              <button onClick={() => setShowToppingsModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-stone-400 font-medium">Seleccioná los ingredientes adicionales que querés sumar a la pizza:</p>
              
              <div className="space-y-2">
                {AVAILABLE_TOPPINGS.map(topping => {
                  const isChecked = selectedToppings.includes(topping.id);
                  return (
                    <label
                      key={topping.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-brand-yellow bg-amber-50/20 text-stone-900 font-bold' 
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedToppings(prev => prev.filter(id => id !== topping.id));
                            } else {
                              setSelectedToppings(prev => [...prev, topping.id]);
                            }
                          }}
                          className="w-4 h-4 rounded text-brand-yellow focus:ring-brand-yellow"
                        />
                        <span className="text-sm">{topping.nombre}</span>
                      </div>
                      <span className="font-mono text-xs text-stone-500 font-black">+${topping.precio}</span>
                    </label>
                  );
                })}
              </div>

              {(() => {
                const toppingsTotal = AVAILABLE_TOPPINGS
                  .filter(t => selectedToppings.includes(t.id))
                  .reduce((sum, t) => sum + t.precio, 0);
                const finalPrice = toppingsBaseProduct.precio_venta + toppingsTotal;
                return (
                  <div className="bg-zinc-950 text-white rounded-xl p-3 flex justify-between items-center mt-2">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase block">Total con Adicionales:</span>
                      <span className="font-mono text-base font-black text-brand-yellow">${finalPrice.toLocaleString('es-AR')}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold">Base: ${toppingsBaseProduct.precio_venta.toLocaleString('es-AR')}</span>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowToppingsModal(false)}
                className="flex-1 min-h-11 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-sm cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleCreatePizzaWithToppings(toppingsBaseProduct.id_producto, selectedToppings);
                  setShowToppingsModal(false);
                  toast.success('Pizza con adicionales agregada.');
                }}
                className="flex-1 min-h-11 bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black rounded-xl text-sm cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}
