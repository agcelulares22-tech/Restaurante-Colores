import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
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
  RefreshCw,
  MoreVertical,
  Pencil,
  EyeOff,
  X,
  Printer,
  Download,
  Bike,
  Phone,
  MapPin,
  Settings,
  User,
  ArrowRightLeft
} from 'lucide-react';
import { Mesa, Insumo, ProductoMenu, RecetaEscandallo, Pedido, PedidoItem, Usuario, EventoLog } from '../types';
import { useMenu, useSalon, useInventario, usePedidos } from '../context/AppContext';
import { useToast, ToastContainer } from './ToastContainer';
import { useMozoTerminal } from '../features/salon/hooks/useMozoTerminal';
import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { useCategories } from '../hooks/useCategories';
import { fetchZonasEnvio, fetchCallesEnvio, resolverZonaEnvio } from '../services/zonasEnvioService';
import { mesasService } from '../services/mesasService';
import { pedidosService } from '../services/pedidosService';

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
  onFacturarMesa: (idPedido: string) => void;
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

function MozoTerminal({
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
    isProductStockCritical,
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
    isSameTable,
    nombreCliente,
    setNombreCliente,
    telefonoCliente,
    setTelefonoCliente,
    direccionCliente,
    setDireccionCliente,
    costoEnvio,
    setCostoEnvio,
    zonaEnvioId,
    setZonaEnvioId,
    distanciaKm,
    setDistanciaKm
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

  const [viewMode, setViewMode] = React.useState<'lista' | 'plano'>('lista');
  const [zonasEnvio, setZonasEnvio] = React.useState<any[]>([]);
  const [callesEnvio, setCallesEnvio] = React.useState<any[]>([]);
  const [zonaResultado, setZonaResultado] = React.useState<any>(null);

  React.useEffect(() => {
    Promise.all([fetchZonasEnvio(), fetchCallesEnvio()]).then(([z, c]) => {
      setZonasEnvio(z);
      setCallesEnvio(c);
    });
  }, []);

  // Delivery Origin and Tariff local configuration state
  const [origenDireccion, setOrigenDireccionLocal] = React.useState<string>(() => {
    const saved = localStorage.getItem('deliv_origen_direccion');
    if (!saved || saved === 'Alvear 1362, Río Cuarto') {
      localStorage.setItem('deliv_origen_direccion', 'Alvear 1362, X5800 Río Cuarto, Córdoba');
      return 'Alvear 1362, X5800 Río Cuarto, Córdoba';
    }
    return saved;
  });
  const [origenLat, setOrigenLatLocal] = React.useState<number>(() => {
    const saved = localStorage.getItem('deliv_origen_lat');
    return saved ? parseFloat(saved) : -33.1263;
  });
  const [origenLng, setOrigenLngLocal] = React.useState<number>(() => {
    const saved = localStorage.getItem('deliv_origen_lng');
    return saved ? parseFloat(saved) : -64.3498;
  });
  const [tarifaBaseLocal, setTarifaBaseLocal] = React.useState<number>(() => {
    const saved = localStorage.getItem('deliv_tarifa_base');
    return saved ? parseFloat(saved) : 1000;
  });
  const [costoPorKmLocal, setCostoPorKmLocal] = React.useState<number>(() => {
    const saved = localStorage.getItem('deliv_costo_por_km');
    return saved ? parseFloat(saved) : 500;
  });
  const [isUpdatingOrigenLocal, setIsUpdatingOrigenLocal] = React.useState(false);
  const [showEnvioConfig, setShowEnvioConfig] = React.useState(false);

  const handleUpdateOrigenDireccionLocal = async (direccion: string) => {
    setOrigenDireccionLocal(direccion);
    localStorage.setItem('deliv_origen_direccion', direccion);
    
    if (direccion.trim().length < 4) return;
    
    setIsUpdatingOrigenLocal(true);
    try {
      const searchAddr = (direccion.toLowerCase().includes('rio cuarto') || direccion.toLowerCase().includes('río cuarto'))
        ? direccion
        : `${direccion}, Río Cuarto, Córdoba, Argentina`;
        
      const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddr)}&format=json&limit=1`);
      const geoData = await geoResp.json();
      
      if (geoData && geoData.length > 0) {
        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);
        setOrigenLatLocal(lat);
        setOrigenLngLocal(lng);
        localStorage.setItem('deliv_origen_lat', String(lat));
        localStorage.setItem('deliv_origen_lng', String(lng));
      }
    } catch (err) {
      console.error('Error geocoding origin in MozoTerminal:', err);
    } finally {
      setIsUpdatingOrigenLocal(false);
    }
  };

  const [isCalculatingRoute, setIsCalculatingRoute] = React.useState(false);

  const handleTransferTable = async (targetMesaId: number) => {
    if (!activePedidoDeMesa) return;
    const targetMesa = dynamicMesas.find(m => m.id_mesa === targetMesaId);
    if (!targetMesa) return;

    if (targetMesa.estado !== 'libre') {
      toast.error('La mesa de destino debe estar libre.');
      return;
    }

    try {
      const sourceMesa = selectedMesa;
      if (!sourceMesa) return;

      const updatedPedido = {
        ...activePedidoDeMesa,
        id_mesa: targetMesa.id_mesa,
        numero_mesa: targetMesa.numero_mesa
      };

      ctxSalon.setMesas((prev: Mesa[]) => 
        prev.map(m => {
          if (m.id_mesa === sourceMesa.id_mesa) {
            return { ...m, estado: 'libre' as const, comensales: undefined };
          }
          if (m.id_mesa === targetMesa.id_mesa) {
            return { ...m, estado: 'ocupada' as const, comensales: sourceMesa.comensales || 2 };
          }
          return m;
        })
      );

      ctxPedidos.setPedidos((prev: Pedido[]) => 
        prev.map(p => p.id_pedido === activePedidoDeMesa.id_pedido ? updatedPedido : p)
      );

      await Promise.all([
        mesasService.update(sourceMesa.id_mesa, { ...sourceMesa, estado: 'libre', comensales: undefined }),
        mesasService.update(targetMesa.id_mesa, { ...targetMesa, estado: 'ocupada', comensales: sourceMesa.comensales || 2 }),
        pedidosService.update(activePedidoDeMesa.id_pedido, updatedPedido)
      ]);

      addLog('sistema', `MESAS: Transferido pedido #${activePedidoDeMesa.id_pedido} de mesa ${sourceMesa.numero_mesa} a mesa ${targetMesa.numero_mesa}`);
      toast.success(`Pedido transferido con éxito a mesa ${targetMesa.numero_mesa}.`);
      
      handleSelectMesa({ ...targetMesa, estado: 'ocupada', comensales: sourceMesa.comensales });
      setShowTransferModal(false);
    } catch (err: any) {
      toast.error('Error al transferir la mesa: ' + err.message);
    }
  };

  React.useEffect(() => {
    if (selectedMesaId !== 999) {
      setZonaResultado(null);
      setDistanciaKm(null);
      return;
    }

    if (!direccionCliente.trim() || direccionCliente.trim().length < 4) {
      setCostoEnvio(0);
      setZonaEnvioId(null);
      setZonaResultado(null);
      setDistanciaKm(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsCalculatingRoute(true);
      try {
        const tarifaBase = tarifaBaseLocal;
        const costoPorKm = costoPorKmLocal;

        const searchAddr = (direccionCliente.toLowerCase().includes('rio cuarto') || direccionCliente.toLowerCase().includes('río cuarto'))
          ? direccionCliente
          : `${direccionCliente}, Río Cuarto, Córdoba, Argentina`;
          
        const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddr)}&format=json&limit=1`);
        const geoData = await geoResp.json();

        if (geoData && geoData.length > 0) {
          const destLat = parseFloat(geoData[0].lat);
          const destLng = parseFloat(geoData[0].lon);
          const originLat = origenLat;
          const originLng = origenLng;

          const routeResp = await fetch(`https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`);
          const routeData = await routeResp.json();

          if (routeData.routes && routeData.routes.length > 0) {
            const route = routeData.routes[0];
            const distKm = parseFloat((route.distance / 1000).toFixed(2));
            const costoCalculado = Math.round(tarifaBase + (distKm * costoPorKm));
            
            setDistanciaKm(distKm);
            setCostoEnvio(costoCalculado);

            const result = resolverZonaEnvio(direccionCliente, zonasEnvio, callesEnvio);
            if (result.status === 'success') {
              setZonaResultado(result);
              const matchedZona = zonasEnvio.find(z => z.nombre_zona === result.zona);
              if (matchedZona) {
                setZonaEnvioId(matchedZona.id);
              }
            } else {
              setZonaResultado({ status: 'success', zona: 'Distancia Terrestre', costo_envio: costoCalculado });
            }
            return;
          }
        }
        
        const result = resolverZonaEnvio(direccionCliente, zonasEnvio, callesEnvio);
        if (result.status === 'success' && result.costo_envio != null) {
          setZonaResultado(result);
          setCostoEnvio(result.costo_envio);
          const matchedZona = zonasEnvio.find(z => z.nombre_zona === result.zona);
          if (matchedZona) {
            setZonaEnvioId(matchedZona.id);
          }
        } else {
          setCostoEnvio(tarifaBaseLocal);
          setZonaEnvioId(null);
          setZonaResultado({
            status: 'success',
            zona: 'Envío General (Río Cuarto)',
            costo_envio: tarifaBaseLocal,
            mensaje: 'Dirección fuera de cobertura de zonas fijas - Se aplica Tarifa Base.'
          });
        }
      } catch (err) {
        console.warn('Error in automatic route calculation:', err);
        const result = resolverZonaEnvio(direccionCliente, zonasEnvio, callesEnvio);
        if (result.status === 'success' && result.costo_envio != null) {
          setZonaResultado(result);
          setCostoEnvio(result.costo_envio);
          const matchedZona = zonasEnvio.find(z => z.nombre_zona === result.zona);
          if (matchedZona) {
            setZonaEnvioId(matchedZona.id);
          }
        } else {
          setCostoEnvio(tarifaBaseLocal);
          setZonaEnvioId(null);
          setZonaResultado({
            status: 'success',
            zona: 'Envío General (Río Cuarto)',
            costo_envio: tarifaBaseLocal,
            mensaje: 'Dirección fuera de cobertura de zonas fijas - Se aplica Tarifa Base.'
          });
        }
      } finally {
        setIsCalculatingRoute(false);
      }
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [direccionCliente, zonasEnvio, callesEnvio, selectedMesaId, setCostoEnvio, setZonaEnvioId, setDistanciaKm, tarifaBaseLocal, costoPorKmLocal, origenLat, origenLng]);

  const [showHalfHalfModal, setShowHalfHalfModal] = React.useState(false);
  const [halfPizzaA, setHalfPizzaA] = React.useState<string>('');
  const [halfPizzaB, setHalfPizzaB] = React.useState<string>('');

  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const [transferTargetTableId, setTransferTargetTableId] = React.useState<number | null>(null);

  const [showToppingsModal, setShowToppingsModal] = React.useState(false);
  const [toppingsBaseProduct, setToppingsBaseProduct] = React.useState<any>(null);
  const [selectedToppings, setSelectedToppings] = React.useState<string[]>([]);

  const pizzaProducts = useMemo(() => {
    return productosMenu.filter(p => p.activo && p.categoria.toLowerCase().includes('pizza') && !p.id_producto.startsWith('half_') && !p.id_producto.includes('_with_'));
  }, [productosMenu]);

  const criticalCartItems = useMemo(() => {
    return Object.keys(cart)
      .map(prodId => productosMenu.find(p => p.id_producto === prodId))
      .filter((p): p is ProductoMenu => !!p && isProductStockCritical(p.id_producto));
  }, [cart, productosMenu, isProductStockCritical]);

  return (
    <>
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6" id="mozo-terminal-container">
      <div className="min-w-0 space-y-4 lg:col-span-4 lg:space-y-6 order-1">
        
        {/* Mesas Selector Grid */}
        <div className="glass-panel-light dark:glass-panel rounded-2xl p-4 sm:p-5 shadow-sm text-slate-800 dark:text-slate-100">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 font-sans">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4.5 h-4.5 text-slate-555 dark:text-slate-400 shrink-0" />
              <h3 className="font-bold text-sm md:text-base text-slate-850 dark:text-slate-200 tracking-tight">
                Distribución de Mesas
              </h3>
              <span className="text-[10px] font-mono bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 font-bold shrink-0">
                {dynamicMesas.filter(m => m.estado === 'ocupada' && m.id_mesa !== 999).length} Ocupadas
              </span>
            </div>
          </div>

          <button
            onClick={() => handleSelectMesa({ id_mesa: 999, numero_mesa: 'DELIVERY', estado: 'libre' })}
            className={`w-full mb-4 min-h-[56px] p-3 sm:p-4 rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer border font-black text-sm uppercase tracking-wider ${
              selectedMesaId === 999
                ? 'bg-brand-yellow text-brand-black border-brand-yellow shadow-md scale-[1.01] ring-4 ring-brand-yellow/20'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
            }`}
          >
            <Bike className="w-5 h-5 text-brand-orange" />
            Tomar Pedido Delivery
          </button>

          {viewMode === 'lista' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {dynamicMesas.filter(m => m.id_mesa !== 999).map(m => {
                const isSelected = m.id_mesa === selectedMesaId;
                const isOcupada = m.estado === 'ocupada';
                const isInCuenta = m.estado === 'esperando_cuenta';
                const isReservada = m.estado === 'reservada';

                // Determine visual theme according to exact state specs
                let stateClasses = "glass-panel-light dark:glass-panel border-stone-200/50 hover:bg-stone-100/50 dark:hover:bg-white/5 text-stone-700 dark:text-zinc-300 hover:scale-[1.02]";
                let labelText = "Libre";
                let textClass = "text-stone-700 dark:text-zinc-300";

                if (isSelected) {
                  stateClasses = "bg-brand-yellow text-brand-black border-brand-yellow shadow-md scale-[1.03] glow-yellow ring-4 ring-brand-yellow/20 font-black";
                  labelText = isOcupada ? "Ocupada (Sel)" : isInCuenta ? "En Cuenta" : isReservada ? "Reservada" : "Libre";
                  textClass = "text-brand-black";
                } else if (isReservada) {
                  stateClasses = "border-purple-500/50 bg-purple-500/10 text-purple-650 dark:text-purple-300 hover:bg-purple-500/15 shadow-[0_0_10px_rgba(168,85,247,0.15)]";
                  labelText = "Reservada";
                  textClass = "text-purple-600 dark:text-purple-300";
                } else if (isInCuenta) {
                  stateClasses = "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-350 hover:bg-amber-500/15 glow-yellow shadow-[0_0_10px_rgba(245,158,11,0.2)]";
                  labelText = "En Cuenta";
                  textClass = "text-amber-600 dark:text-amber-355";
                } else if (isOcupada) {
                  stateClasses = "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/15 shadow-[0_0_10px_rgba(59,130,246,0.2)]";
                  labelText = "Ocupada";
                  textClass = "text-blue-600 dark:text-blue-350";
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
                    <span className={`text-xs sm:text-sm font-black font-sans ${textClass}`}>{m.numero_mesa}</span>
                    {isOcupada ? (
                      <div className="flex flex-col items-center gap-0.5 mt-1">
                        <div className="flex items-center gap-0.5">
                          <Users className={`w-3 h-3 ${isSelected ? 'text-brand-black' : 'text-blue-550 dark:text-blue-300'}`} />
                          <span className={`text-[10px] sm:text-xs font-bold ${textClass}`}>{m.comensales || 0}</span>
                        </div>
                        {elapsedMin > 0 && (
                          <span className={`text-[8px] font-mono font-bold ${isSelected ? 'text-brand-black/80' : 'text-blue-550 dark:text-blue-300 bg-blue-500/10 px-1 rounded'}`}>
                            ⏱️ {elapsedMin}m
                          </span>
                        )}
                      </div>
                    ) : isInCuenta ? (
                      <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400 text-center leading-tight">Saldar</span>
                    ) : (
                      <span className={`text-[8px] sm:text-[10px] uppercase tracking-wider font-semibold opacity-80 text-center leading-tight ${textClass}`}>{labelText}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Plano 2D View */
            <div className="relative w-full h-[520px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center bg-[radial-gradient(#384152_1.2px,transparent_1.2px)] [background-size:20px_20px]">
              {dynamicMesas.filter(m => m.id_mesa !== 999).map(m => {
                const isSelected = m.id_mesa === selectedMesaId;
                const isOcupada = m.estado === 'ocupada';
                const isInCuenta = m.estado === 'esperando_cuenta';
                const isReservada = m.estado === 'reservada';

                // Determine visual theme according to state
                let stateBg = "bg-[#1E293B] border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-650";
                let dotColor = "bg-emerald-500";
                let label = "Libre";

                if (isReservada) {
                  stateBg = "bg-[#6d3f9e]/10 border-[#6d3f9e] text-purple-300 hover:bg-[#6d3f9e]/20";
                  dotColor = "bg-purple-500";
                  label = "Reservada";
                } else if (isInCuenta) {
                  stateBg = "bg-[#c47f1a]/10 border-[#c47f1a] text-[#c47f1a] hover:bg-[#c47f1a]/20";
                  dotColor = "bg-amber-500";
                  label = "En Cuenta";
                } else if (isOcupada) {
                  stateBg = "bg-[#2563a0]/15 border-[#2563a0] text-[#2563a0] hover:bg-[#2563a0]/25";
                  dotColor = "bg-blue-500 animate-pulse";
                  label = "Ocupada";
                }

                if (isSelected) {
                  stateBg = "bg-brand-yellow text-brand-black border-brand-yellow ring-4 ring-brand-yellow/30 shadow-md scale-105 z-10";
                }

                const isRound = m.forma === 'redonda';
                const shapeClass = isRound ? 'rounded-full' : 'rounded-2xl';

                const w = m.width || (m.forma === 'rectangular' ? 12 : 8);
                const h = m.height || (m.forma === 'rectangular' ? 6 : 8);

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
                    id={`plano-mesa-btn-${m.id_mesa}`}
                    onClick={() => handleSelectMesa(m)}
                    style={{
                      left: `${m.x ?? 50}%`,
                      top: `${m.y ?? 50}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${w * 10}px`,
                      height: `${h * 10}px`,
                    }}
                    className={`absolute select-none cursor-pointer p-2.5 text-center flex flex-col justify-center items-center shadow-lg border transition-all active:scale-95 ${stateBg} ${shapeClass}`}
                  >
                    <strong className="text-xs font-black tracking-tight">{m.numero_mesa}</strong>
                    {isOcupada ? (
                      <div className="flex flex-col items-center gap-0.5 mt-0.5">
                        <span className="text-[10px] font-bold">
                          👤{m.comensales || 0}
                        </span>
                        {elapsedMin > 0 && (
                          <span className="text-[8px] font-mono font-bold opacity-80">
                            ⏱️{elapsedMin}m
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[8px] uppercase tracking-wider font-semibold opacity-75">{label}</span>
                    )}
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColor} absolute top-1 right-1 border border-white shadow-xs`} />
                  </button>
                );
              })}
            </div>
          )}

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
                          ${(it.precio_unitario ?? productosMenu.find(p => p.id_producto === it.id_producto)?.precio_venta ?? 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 mb-3">
                    <span className="text-xs font-bold text-slate-600">Total acumulado</span>
                    <span className="text-sm font-black font-mono text-slate-800">
                      ${activePedidoDeMesa.items.reduce((sum, it) => sum + (it.cantidad * (it.precio_unitario ?? productosMenu.find(p => p.id_producto === it.id_producto)?.precio_venta ?? 0)), 0).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSplittingPedidoId(activePedidoDeMesa.id_pedido)}
                      className="flex-1 py-1 px-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Receipt className="w-3 h-3 text-slate-500" />
                      Dividir
                    </button>
                    <button
                      onClick={() => {
                        setTransferTargetTableId(null);
                        setShowTransferModal(true);
                      }}
                      className="flex-1 py-1 px-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                      Traspasar
                    </button>
                    <button
                      onClick={() => onFacturarMesa(activePedidoDeMesa.id_pedido)}
                      className="flex-1 py-1.5 px-2 bg-slate-900 border border-transparent hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer"
                    >
                      Cobrar
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
        <div className="glass-panel-light dark:glass-panel rounded-2xl p-3 sm:p-4 shadow-sm space-y-3 text-slate-800 dark:text-slate-100">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <h3 className="font-extrabold text-sm md:text-base text-slate-850 dark:text-[#E8B800] tracking-wider uppercase">Categorías</h3>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar pizza o bebida..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-11 pl-9 pr-3 py-2 bg-stone-100/50 dark:bg-zinc-950/60 border border-stone-200 dark:border-white/10 rounded-xl text-sm text-stone-700 dark:text-zinc-200 placeholder-stone-400 dark:placeholder-zinc-550 focus:outline-none focus:ring-1 focus:ring-brand-yellow/30"
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
          <div className="flex gap-2 w-full overflow-x-auto py-1.5 scrollbar-thin scroll-smooth border-t border-stone-150 dark:border-white/5 pt-3 pb-2">
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

                      if (norm.includes('calzone') || norm.includes('empanada')) {
                        return 'calzones-y-empanadas';
                      }
                      if (norm.includes('pizza')) {
                        return 'pizzas';
                      }
                      if (norm.includes('bebida') || norm.includes('bodega') || norm.includes('vino') || norm.includes('cerveza') || norm.includes('gaseosa')) {
                        return 'bebidas';
                      }
                      if (norm.includes('postre') || norm.includes('dulce') || norm.includes('helado')) {
                        return 'postres';
                      }
                      if (norm.includes('sandwich') || norm.includes('baguette') || norm.includes('lomo')) {
                        return 'sandwiches';
                      }
                      return norm;
                    };
                    return normalizeCategorySlug(p.categoria) === cat.id;
                  }).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoria(cat.id)}
                  className="relative py-1.5 px-3 text-xs font-extrabold rounded-lg whitespace-nowrap transition-colors duration-200 cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 z-10"
                >
                  {selectedCategoria === cat.id && (
                    <motion.span
                      layoutId="activeCategoryBg"
                      className="absolute inset-0 bg-brand-yellow rounded-lg z-[-1]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={selectedCategoria === cat.id ? 'text-brand-black' : 'text-stone-600 dark:text-stone-300'}>
                    {cat.label}
                  </span>
                  <span className={`text-[9px] font-bold ml-0.5 ${selectedCategoria === cat.id ? 'text-brand-black/75' : 'text-stone-400 dark:text-stone-500'}`}>
                    ({count})
                  </span>
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
                className={`group cursor-pointer rounded-2xl glass-panel-light dark:glass-panel border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 relative ${
                  isOutOfStock 
                    ? 'opacity-50 border-rose-950/20 pointer-events-none' 
                    : currentInCart > 0 
                      ? 'border-brand-yellow dark:border-brand-yellow bg-brand-yellow/5 ring-1 ring-brand-yellow/20 scale-[1.01] glow-yellow' 
                      : 'border-stone-200/50 dark:border-white/5 hover:-translate-y-1 hover:border-[#E8B800]/50'
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

                  {isProductStockCritical(p.id_producto) && !isOutOfStock && (
                    <div className="absolute top-2 right-2 animate-pulse z-10">
                      <span className="bg-red-600 border border-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow flex items-center gap-1">
                        ⚠️ Insumo Crítico
                      </span>
                    </div>
                  )}
 
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
                <div className="p-3">
                  <h4 className="font-extrabold text-stone-850 dark:text-zinc-200 text-sm font-sans line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-brand-orange transition-colors">
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
                        <span className="text-stone-900 dark:text-zinc-150 font-mono text-sm font-black truncate">
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
        <div className="glass-panel-light dark:glass-panel rounded-2xl p-4 sm:p-5 shadow-md flex flex-col min-h-[320px] sm:min-h-[400px] lg:h-[520px] lg:sticky lg:top-6 text-slate-800 dark:text-zinc-150">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="font-bold text-zinc-150 text-sm md:text-base font-sans flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-zinc-400" />
              Nueva Comanda
            </h3>
            {selectedMesa && (
              <span className="bg-brand-yellow text-brand-black font-sans text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shadow-md glow-yellow">
                {selectedMesa.numero_mesa}
              </span>
            )}
          </div>

          {!selectedMesaId ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
              <div className="w-12 h-12 bg-zinc-950/60 text-zinc-500 rounded-full flex items-center justify-center mb-3 border border-white/5">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-300 text-sm">Seleccione Mesa</h4>
              <p className="text-zinc-500 text-xs mt-1 max-w-[180px]">
                Marque una mesa disponible en el plano izquierdo para iniciar la comanda.
              </p>
            </div>
          ) : (
            <>
              {selectedMesaId === 999 && (
                <div className="p-3 border border-white/5 bg-zinc-950/60 rounded-xl space-y-2.5 mb-2.5">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                    Datos del Cliente (Envío)
                  </span>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Nombre y Apellido</label>
                    <input
                      type="text"
                      placeholder="Ej: Juan Pérez"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      className="w-full p-2.5 text-xs bg-zinc-950/80 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-yellow/35 focus:border-brand-yellow/35 text-zinc-100 placeholder-zinc-650"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase">Teléfono</label>
                      <input
                        type="text"
                        placeholder="Ej: 3584-123456"
                        value={telefonoCliente}
                        onChange={(e) => setTelefonoCliente(e.target.value)}
                        className="w-full p-2.5 text-xs bg-zinc-950/80 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-yellow/35 focus:border-brand-yellow/35 text-zinc-100 placeholder-zinc-650"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase">Dirección</label>
                      <input
                        type="text"
                        placeholder="Ej: Alvear 1362"
                        value={direccionCliente}
                        onChange={(e) => setDireccionCliente(e.target.value)}
                        className="w-full p-2.5 text-xs bg-zinc-950/80 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-yellow/35 focus:border-brand-yellow/35 text-zinc-100 placeholder-zinc-650"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowEnvioConfig(!showEnvioConfig)}
                      className="text-[10px] text-zinc-450 hover:text-zinc-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Settings className="w-3 h-3 text-zinc-500" />
                      {showEnvioConfig ? 'Ocultar Configuración' : 'Configurar Origen/Tarifas'}
                    </button>
                  </div>

                  {showEnvioConfig && (
                    <div className="p-2.5 bg-zinc-950 border border-white/5 rounded-xl space-y-2 text-left">
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase block">Dirección del Local</label>
                        <input
                          type="text"
                          value={origenDireccion}
                          placeholder="Ej: Alvear 1362, Río Cuarto"
                          onChange={(e) => handleUpdateOrigenDireccionLocal(e.target.value)}
                          className="w-full p-2 text-xs bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:border-brand-orange text-zinc-100 font-medium"
                        />
                        <span className="text-[8px] font-mono text-zinc-500 block">
                          {isUpdatingOrigenLocal ? 'Buscando coordenadas...' : `Coordenadas: ${origenLat.toFixed(4)}, ${origenLng.toFixed(4)}`}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase block">Tarifa Base ($)</label>
                          <input
                            type="number"
                            value={tarifaBaseLocal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setTarifaBaseLocal(val);
                              localStorage.setItem('deliv_tarifa_base', String(val));
                            }}
                            className="w-full p-2 text-xs bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:border-brand-orange text-zinc-100 font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase block">Costo por Km ($)</label>
                          <input
                            type="number"
                            value={costoPorKmLocal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setCostoPorKmLocal(val);
                              localStorage.setItem('deliv_costo_por_km', String(val));
                            }}
                            className="w-full p-2 text-xs bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:border-brand-orange text-zinc-100 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {direccionCliente.trim() && (isCalculatingRoute || distanciaKm !== null || zonaResultado) && (
                    <div className={`p-2.5 rounded-xl text-[11px] font-medium border ${
                      isCalculatingRoute 
                        ? 'bg-amber-950/20 text-amber-400 border-amber-500/20 animate-pulse' 
                        : 'bg-emerald-950/20 text-emerald-450 border-emerald-500/20'
                    }`}>
                      {isCalculatingRoute ? (
                        <div className="flex items-center gap-1.5 justify-center">
                          <RefreshCw className="w-3 h-3.5 animate-spin text-amber-500" />
                          <span>Calculando distancia en Río Cuarto...</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {distanciaKm !== null ? (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-400 font-bold flex items-center gap-1">
                                  <Bike className="w-3.5 h-3.5 text-brand-orange" />
                                  Distancia estimada:
                                </span>
                                <span className="font-mono font-black text-zinc-200">{distanciaKm} km</span>
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                                <span className="text-zinc-400 font-bold">Costo de Envío:</span>
                                <span className="font-mono font-black text-emerald-450 text-xs">${costoEnvio}</span>
                              </div>
                            </>
                          ) : zonaResultado?.status === 'success' ? (
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-400 font-bold">{zonaResultado.zona}</span>
                              <span className="font-mono font-bold text-emerald-450">Envío: ${zonaResultado.costo_envio}</span>
                            </div>
                          ) : (
                            <span className="text-rose-455">{zonaResultado?.mensaje || 'No se pudo estimar la ruta'}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {Object.keys(cart).length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                  <div className="w-12 h-12 bg-emerald-950/20 text-emerald-400 rounded-full flex items-center justify-center mb-3 border border-emerald-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-zinc-300 text-sm">Comanda Vacía</h4>
                  <p className="text-zinc-500 text-xs mt-1 max-w-[180px]">
                    Toque los platos de la carta central para cargarlos a la mesa de forma interactiva.
                  </p>
                </div>
              ) : (
                <>
                  {criticalCartItems.length > 0 && (
                    <div className="bg-red-950/20 border border-red-500/25 rounded-xl p-3 mb-2.5 animate-pulse mx-1 mt-1">
                      <div className="flex gap-2 text-red-400 text-xs font-bold items-start">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-red-200">⚠️ Insumo Crítico</p>
                          <p className="text-[10px] text-red-400 mt-0.5 leading-tight">
                            Este pedido contiene platos con ingredientes bajo stock mínimo:
                          </p>
                          <ul className="list-disc list-inside text-[9px] text-red-300 mt-1 font-semibold">
                            {criticalCartItems.map(item => (
                              <li key={item.id_producto}>{item.nombre}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CART ITEMS LIST */}
                  <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 scrollbar-thin">
                    {Object.entries(cart).map(([prodId, qty]) => {
                      const p = productosMenu.find(item => item.id_producto === prodId)!;
                      return (
                        <div key={prodId} className="flex justify-between items-center text-xs bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex-1 pr-1 font-sans">
                            <span className="font-bold text-zinc-200 line-clamp-1">{p.nombre}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">${(p.precio_venta).toLocaleString('es-AR')} u.</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleRemoveFromCart(prodId)}
                              className="touch-target w-8 h-8 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-white/5 flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-sm font-bold w-5 text-center text-zinc-100">{qty}</span>
                            <button
                              onClick={() => handleAddToCart(prodId)}
                              className="touch-target w-8 h-8 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-white/5 flex items-center justify-center transition-colors"
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
                    <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider flex items-center gap-1">
                      <Bookmark className="w-3 h-3 text-zinc-500" />
                      Observaciones de Comanda
                    </label>
                    <textarea
                      placeholder="Ej: Bife bien cocido, papas sin sal, agua a temperatura ambiente..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="w-full min-h-11 text-base text-zinc-200 p-2.5 bg-zinc-950/60 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-yellow/35 focus:border-brand-yellow/35 resize-none h-16"
                    />
                  </div>

                  {/* Cart count badge */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium pb-1">
                    <span>{Object.keys(cart).length} productos distintos</span>
                    <button
                      onClick={handleClearCart}
                      className="touch-target text-red-400 hover:text-red-300 font-bold uppercase tracking-wider cursor-pointer text-xs"
                    >
                      Vaciar Carrito
                    </button>
                  </div>

                  {/* FOOTER TOTAL & INJECT BTN */}
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-sm font-sans font-medium text-zinc-400">
                      <span>Monto Total:</span>
                      <span className="font-mono font-extrabold text-brand-yellow text-base">
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
                        <><Sparkles className="w-3.5 h-3.5 text-amber-350" /> Enviar a Cocina 🚀</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>

      {/* BILL SPLITTING MODAL (MODO DIVISION DE CUENTAS) */}
      {splittingPedidoId !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto text-zinc-150">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-extrabold text-base text-zinc-100 font-sans tracking-tight flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-brand-yellow" />
                  Divisor de Cuentas Gastronómico
                </h3>
                <p className="text-xs text-zinc-400 font-sans mt-0.5">
                  Mesa {pedidos.find(p => p.id_pedido === splittingPedidoId)?.numero_mesa} • Orden #{splittingPedidoId}
                </p>
              </div>
              <button
                onClick={() => {
                  setSplittingPedidoId(null);
                  setSplitItemsChecked({});
                }}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const p = pedidos.find(o => o.id_pedido === splittingPedidoId);
              if (!p) return null;

              const orderTotal = p.items.reduce((sum, item) => {
                const prod = productosMenu.find(pr => pr.id_producto === item.id_producto);
                return sum + ((item.precio_unitario ?? prod?.precio_venta ?? 0) * item.cantidad);
              }, 0);

              // Expand items list by their quantity for itemized selection
              const expandedItemsList: { item: PedidoItem; index: number; singlePrice: number }[] = [];
              let curIdx = 0;
              p.items.forEach(it => {
                const prod = productosMenu.find(pr => pr.id_producto === it.id_producto);
                const sPrice = it.precio_unitario ?? (prod ? prod.precio_venta : 0);
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
                  <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      A. División Equitativa (Por Comensales)
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl p-1 gap-2">
                        <button 
                          onClick={() => setSplitCount(c => Math.max(2, c - 1))}
                          className="touch-target w-8 h-8 rounded bg-zinc-900 border border-white/5 flex items-center justify-center font-bold text-sm text-zinc-450 hover:bg-zinc-800 hover:text-zinc-200 active:scale-90"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold font-mono w-5 text-center text-zinc-100">{splitCount}</span>
                        <button 
                          onClick={() => setSplitCount(c => c + 1)}
                          className="touch-target w-8 h-8 rounded bg-zinc-900 border border-white/5 flex items-center justify-center font-bold text-sm text-zinc-455 hover:bg-zinc-800 hover:text-zinc-200 active:scale-90"
                        >
                          +
                        </button>
                        <span className="text-[10px] text-zinc-500 mr-1">personas</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 font-medium">Equivale a:</p>
                        <p className="text-sm font-extrabold font-mono text-brand-yellow">
                          ${(orderTotal / splitCount).toLocaleString('es-AR', { maximumFractionDigits: 1 })} c/u
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option B: Split by Select/Chair consumption */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-zinc-400" />
                      B. Desglose Específico (Silla / Consumo Unitario)
                    </h4>
                    
                    <p className="text-[10px] text-zinc-500 italic">
                      Tilde los platos que pagará este comensal de manera individual:
                    </p>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-white/5 rounded-xl p-2 bg-zinc-950/60 scrollbar-thin">
                      {expandedItemsList.map(({ item, index, singlePrice }) => (
                        <label 
                          key={index}
                          className="flex items-center justify-between text-xs p-2 bg-zinc-900/60 border border-white/5 rounded-xl hover:bg-zinc-850 hover:border-white/10 cursor-pointer transition-all"
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
                              className="rounded border-white/10 text-brand-yellow focus:ring-brand-yellow/30 bg-zinc-950 w-4 h-4"
                            />
                            <span className="font-medium text-zinc-200">{item.nombre}</span>
                          </div>
                          <span className="font-mono text-[11px] text-zinc-300 font-bold">${singlePrice.toLocaleString('es-AR')}</span>
                        </label>
                      ))}
                    </div>

                    {itemizedTotal > 0 && (
                      <div className="flex justify-between items-center bg-zinc-950 border border-white/10 text-zinc-100 rounded-xl p-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Pago Seleccionado</span>
                          <h4 className="font-mono font-extrabold text-sm text-brand-yellow">${itemizedTotal.toLocaleString('es-AR')}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Sobrante Total</span>
                          <p className="font-mono text-[11px] font-semibold text-zinc-400">${(orderTotal - itemizedTotal).toLocaleString('es-AR')}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Facturar Botonera */}
                  <div className="pt-3 border-t border-white/5 flex gap-2">
                    <button
                      onClick={() => {
                        setSplittingPedidoId(null);
                        setSplitItemsChecked({});
                      }}
                      className="flex-1 py-2 text-xs bg-zinc-900 border border-white/5 hover:bg-zinc-800 rounded-xl text-zinc-300 font-bold active:scale-95 transition-all"
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
                      className="flex-1 py-2 text-xs bg-brand-yellow text-brand-black font-extrabold rounded-xl shadow-lg glow-yellow active:scale-95 transition-all flex items-center justify-center gap-1.5"
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

      {/* MODAL TRASPASO DE MESA */}
      {showTransferModal && activePedidoDeMesa && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-zinc-150 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-extrabold text-zinc-100 text-base uppercase tracking-wider flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-brand-yellow shrink-0" />
                Traspasar Mesa {selectedMesa?.numero_mesa}
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-zinc-400 hover:text-zinc-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Seleccioná la mesa libre de destino a la cual transferir la orden activa **#{activePedidoDeMesa.id_pedido}** (Total: ${activePedidoDeMesa.items.reduce((sum, it) => sum + (it.cantidad * (it.precio_unitario ?? productosMenu.find(p => p.id_producto === it.id_producto)?.precio_venta ?? 0)), 0).toLocaleString('es-AR')}).
              </p>
              
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Mesa Libre de Destino:</label>
                <select
                  value={transferTargetTableId || ''}
                  onChange={(e) => setTransferTargetTableId(parseInt(e.target.value) || null)}
                  className="w-full min-h-11 px-3 bg-zinc-950 border border-white/10 rounded-xl text-sm font-semibold text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-yellow/35 focus:border-brand-yellow/35 cursor-pointer"
                >
                  <option value="" disabled className="text-zinc-500">-- Seleccionar Mesa Libre --</option>
                  {dynamicMesas
                    .filter(m => m.estado === 'libre' && m.id_mesa !== 999)
                    .map(m => (
                      <option key={m.id_mesa} value={m.id_mesa} className="bg-zinc-950 text-zinc-200">
                        {m.numero_mesa} ({m.sector?.toUpperCase() || 'Salón'} - Capacidad: {m.capacidad || 4} pax)
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/5 mt-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="flex-1 min-h-11 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!transferTargetTableId}
                onClick={() => transferTargetTableId && handleTransferTable(transferTargetTableId)}
                className={`flex-1 min-h-11 text-zinc-950 text-xs font-black rounded-xl transition-all ${
                  transferTargetTableId 
                    ? 'bg-brand-yellow hover:bg-[#D4A700] cursor-pointer shadow-md' 
                    : 'bg-zinc-750 text-zinc-500 cursor-not-allowed opacity-50'
                }`}
              >
                Confirmar Traspaso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MITAD Y MITAD */}
      {showHalfHalfModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-zinc-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-extrabold text-zinc-100 text-base uppercase tracking-wider flex items-center gap-2">
                🍕 Armar Pizza Mitad y Mitad
              </h3>
              <button onClick={() => setShowHalfHalfModal(false)} className="text-zinc-400 hover:text-zinc-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Primera Mitad:</label>
                <select
                  value={halfPizzaA}
                  onChange={(e) => setHalfPizzaA(e.target.value)}
                  className="w-full min-h-11 px-3 bg-zinc-950 border border-white/10 rounded-xl text-sm font-semibold text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-yellow/35 focus:border-brand-yellow/35"
                >
                  {pizzaProducts.map(p => (
                    <option key={p.id_producto} value={p.id_producto} className="bg-zinc-950 text-zinc-200">
                      {p.nombre} (${p.precio_venta.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Segunda Mitad:</label>
                <select
                  value={halfPizzaB}
                  onChange={(e) => setHalfPizzaB(e.target.value)}
                  className="w-full min-h-11 px-3 bg-zinc-950 border border-white/10 rounded-xl text-sm font-semibold text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-yellow/35 focus:border-brand-yellow/35"
                >
                  {pizzaProducts.map(p => (
                    <option key={p.id_producto} value={p.id_producto} className="bg-zinc-950 text-zinc-200">
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
                  <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-amber-400 uppercase block">Precio Proporcional Estimado:</span>
                    <span className="font-mono text-lg font-black text-brand-yellow">${avgPrice.toLocaleString('es-AR')}</span>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowHalfHalfModal(false)}
                className="flex-1 min-h-11 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400 rounded-xl text-sm cursor-pointer transition-colors border border-white/5 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleCreateHalfHalfPizza(halfPizzaA, halfPizzaB);
                  setShowHalfHalfModal(false);
                  toast.success('Pizza Mitad y Mitad agregada a la bolsa.');
                }}
                className="flex-1 min-h-11 bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black rounded-xl text-sm cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg glow-yellow"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-zinc-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-extrabold text-zinc-100 text-base uppercase tracking-wider flex items-center gap-2">
                🍕 Adicionales: {toppingsBaseProduct.nombre}
              </h3>
              <button onClick={() => setShowToppingsModal(false)} className="text-zinc-400 hover:text-zinc-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-450 font-medium">Seleccioná los ingredientes adicionales que querés sumar a la pizza:</p>
              
              <div className="space-y-2">
                {AVAILABLE_TOPPINGS.map(topping => {
                  const isChecked = selectedToppings.includes(topping.id);
                  return (
                    <label
                      key={topping.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-brand-yellow bg-brand-yellow/10 text-zinc-100 font-bold' 
                          : 'border-white/5 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-950/80 hover:text-zinc-300'
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
                          className="w-4 h-4 rounded text-brand-yellow focus:ring-brand-yellow/30 bg-zinc-950"
                        />
                        <span className="text-sm">{topping.nombre}</span>
                      </div>
                      <span className="font-mono text-xs text-brand-yellow font-black">+${topping.precio}</span>
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
                  <div className="bg-zinc-950 text-white rounded-xl p-3 flex justify-between items-center mt-2 border border-white/5">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">Total con Adicionales:</span>
                      <span className="font-mono text-base font-black text-brand-yellow">${finalPrice.toLocaleString('es-AR')}</span>
                    </div>
                    <span className="text-[10px] text-zinc-450 font-bold">Base: ${toppingsBaseProduct.precio_venta.toLocaleString('es-AR')}</span>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowToppingsModal(false)}
                className="flex-1 min-h-11 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400 rounded-xl text-sm cursor-pointer transition-colors border border-white/5 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleCreatePizzaWithToppings(toppingsBaseProduct.id_producto, selectedToppings);
                  setShowToppingsModal(false);
                  toast.success('Pizza con adicionales agregada.');
                }}
                className="flex-1 min-h-11 bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black rounded-xl text-sm cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg glow-yellow"
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

export default React.memo(MozoTerminal);
