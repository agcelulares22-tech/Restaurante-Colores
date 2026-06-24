import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Smartphone, 
  ChefHat, 
  DollarSign, 
  UtensilsCrossed, 
  Scale, 
  Users, 
  Calendar, 
  Receipt, 
  Sliders, 
  Database,
  Clock,
  RefreshCw,
  User,
  Cloud,
  CloudOff,
  ChevronRight,
  Bell,
  CheckCircle,
  AlertTriangle,
  Truck,
  Percent,
  ExternalLink
} from 'lucide-react';
import { Mesa, Pedido, Insumo, ProductoMenu, Usuario } from '../types';
import { AppView } from '../lib/permissions';
import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import ElPatronLogo from './ElPatronLogo';

interface HomeMenuModuleProps {
  activeRol: Usuario['rol'];
  mesas: Mesa[];
  pedidos: Pedido[];
  insumos: Insumo[];
  productosMenu: ProductoMenu[];
  usuarios: Usuario[];
  allowedViews: AppView[];
  canChangeUser: boolean;
  activeMozo: string;
  onMozoChange: (mozo: string) => void;
  onNavigate: (view: any) => void;
  getSimulatedTimeStr: () => string;
  autoTimerRunning: boolean;
  onToggleAutoTimer: () => void;
  onAdvanceTime: (mins: number) => void;
}

export default function HomeMenuModule({
  activeRol,
  mesas,
  pedidos,
  insumos,
  productosMenu,
  usuarios,
  allowedViews,
  canChangeUser,
  activeMozo,
  onMozoChange,
  onNavigate,
  getSimulatedTimeStr,
  autoTimerRunning,
  onToggleAutoTimer,
  onAdvanceTime
}: HomeMenuModuleProps) {
  
  // Mapa O(1) de precio_venta por id_producto
  const precioMap = useMemo(() => {
    const m = new Map<string, number>();
    productosMenu.forEach(p => m.set(p.id_producto, p.precio_venta));
    return m;
  }, [productosMenu]);

  // Facturación real desde pedidos cobrados
  const totalSales = useMemo(() => {
    return pedidos
      .filter(p => p.estado_comanda === 'entregado_cobrado')
      .reduce((acc, p) => {
        const subtotal = p.items.reduce((s, item) => {
          const precio = item.precio_unitario ?? precioMap.get(item.id_producto) ?? 0;
          return s + precio * item.cantidad;
        }, 0);
        return acc + subtotal;
      }, 0);
  }, [pedidos, precioMap]);

  const occupiedTables = mesas.filter(m => m.estado === 'ocupada').length;
  const pendingCooking = pedidos.filter(p => p.estado_comanda === 'pendiente' || p.estado_comanda === 'en_cocina').length;
  const lowStockCount = insumos.filter(i => i.stock_actual <= i.stock_minimo).length;

  // Supabase connection client state check
  const hasSupabase = !!tryGetActiveSupabaseClient();

  // Ticket Promedio
  const ticketCount = pedidos.filter(p => p.estado_comanda === 'entregado_cobrado').length;
  const averageTicket = ticketCount > 0 ? Math.round(totalSales / ticketCount) : 0;

  // Operational Shift detection
  const shiftInfo = useMemo(() => {
    const timeStr = getSimulatedTimeStr();
    const match = timeStr.match(/(\d{2}):(\d{2})/);
    const hour = match ? parseInt(match[1]) : 12;

    if (hour >= 12 && hour < 16) {
      return { label: 'Servicio de Almuerzo ☀️', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else if (hour >= 19 && hour <= 23) {
      return { label: 'Servicio de Cena 🌙', color: 'bg-brand-yellow/15 text-brand-yellow border-brand-yellow/30' };
    } else {
      return { label: 'Preparación de Turno ☕', color: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  }, [getSimulatedTimeStr]);

  // Live Alerts scanning
  const activeAlerts = useMemo(() => {
    const alerts: { text: string; action: any; type: 'warning' | 'info' | 'danger' }[] = [];
    
    // 1. Low stock ingredients
    const criticalInsumos = insumos.filter(i => i.stock_actual <= i.stock_minimo);
    if (criticalInsumos.length > 0) {
      alerts.push({
        text: `${criticalInsumos.length} insumos críticos bajo stock mínimo.`,
        action: 'inventario',
        type: 'danger'
      });
    }

    // 2. Tables waiting for bill
    const waitingTables = mesas.filter(m => m.estado === 'esperando_cuenta');
    if (waitingTables.length > 0) {
      alerts.push({
        text: `${waitingTables.length} mesas solicitando la cuenta.`,
        action: 'caja',
        type: 'warning'
      });
    }

    // 3. Cooking delays
    const delayedCookings = pedidos.filter(p => (p.estado_comanda === 'pendiente' || p.estado_comanda === 'en_cocina') && p.minutos_transcurridos > 15);
    if (delayedCookings.length > 0) {
      alerts.push({
        text: `${delayedCookings.length} comandas demoradas en cocina (> 15m).`,
        action: 'cocina',
        type: 'danger'
      });
    }

    return alerts;
  }, [insumos, mesas, pedidos]);

  // Menu items list
  const menuItems = [
    {
      id: 'panel',
      title: 'Panel General',
      description: 'Supervisión en vivo de comandas, auditoría de logs y consolidador de métricas.',
      icon: TrendingUp,
      color: 'from-amber-500/10 to-amber-600/5 hover:border-amber-400',
      iconColor: 'text-amber-700',
      badge: {
        text: `$${totalSales.toLocaleString('es-AR')}`,
        type: 'emerald'
      }
    },
    {
      id: 'mozo',
      title: 'Mozo / Salón',
      description: 'Tomar pedidos en mesas, enviar comandas a cocina y gestionar consumos parciales.',
      icon: Smartphone,
      color: 'from-amber-600/10 to-amber-700/5 hover:border-amber-500',
      iconColor: 'text-brand-orange',
      badge: {
        text: 'Terminal Táctil',
        type: 'neutral'
      }
    },
    {
      id: 'cocina',
      title: 'Horno y Elaboración',
      description: 'Monitor de preparación de pizzas en tiempo real y descuento de insumos en masa y toppings.',
      icon: ChefHat,
      color: 'from-orange-500/10 to-orange-600/5 hover:border-orange-400',
      iconColor: 'text-orange-700',
      badge: {
        text: pendingCooking > 0 ? `${pendingCooking} en preparación` : 'Sin pedidos',
        type: pendingCooking > 0 ? 'amber' : 'neutral'
      }
    },
    {
      id: 'caja',
      title: 'Caja',
      description: 'Control de cobros de mesas, división de cuentas de comensales y cierres de turno.',
      icon: DollarSign,
      color: 'from-emerald-500/10 to-emerald-600/5 hover:border-emerald-400',
      iconColor: 'text-emerald-700',
      badge: {
        text: 'Facturación Abierta',
        type: 'emerald'
      }
    },
    {
      id: 'menu',
      title: 'Menú',
      description: 'Crear y modificar la oferta culinaria, configurar precios públicos y categorías.',
      icon: UtensilsCrossed,
      color: 'from-stone-500/10 to-stone-600/5 hover:border-stone-400',
      iconColor: 'text-stone-700',
      badge: {
        text: `${productosMenu.filter(p => p.activo).length} activos`,
        type: 'neutral'
      }
    },
    {
      id: 'reportes',
      title: 'Reportes / BI',
      description: 'Análisis de ventas, rentabilidad por plato, matriz BCG y consola de auditoría.',
      icon: TrendingUp,
      color: 'from-sky-500/10 to-sky-600/5 hover:border-sky-400',
      iconColor: 'text-sky-700',
      badge: {
        text: 'Business Intelligence',
        type: 'neutral'
      }
    },
    {
      id: 'usuarios',
      title: 'Usuarios',
      description: 'Administración de perfiles operativos: mozos, cocina y administradores.',
      icon: Users,
      color: 'from-teal-500/10 to-teal-600/5 hover:border-teal-400',
      iconColor: 'text-teal-700',
      badge: {
        text: `${usuarios.length} registrados`,
        type: 'neutral'
      }
    },
    {
      id: 'recetas',
      title: 'Recetas / Escandallos',
      description: 'Vinculación de platos con insumos para descuento automático de stock por producción.',
      icon: Scale,
      color: 'from-cyan-500/10 to-cyan-600/5 hover:border-cyan-400',
      iconColor: 'text-cyan-700',
      badge: {
        text: 'Escandallo',
        type: 'neutral'
      }
    },
    {
      id: 'inventario',
      title: 'Inventario',
      description: 'Gestión de materias primas por porción/gramaje, mermas físicas y reabastecimiento.',
      icon: Scale,
      color: 'from-rose-500/10 to-rose-600/5 hover:border-rose-400',
      iconColor: 'text-rose-700',
      badge: {
        text: lowStockCount > 1 ? `${lowStockCount} alertas stock` : 'Nivel óptimo',
        type: lowStockCount > 1 ? 'rose' : 'emerald'
      }
    },
    {
      id: 'mesas',
      title: 'Mesas',
      description: 'Distribución física del salón comedor, ocupación de mesas y control de capacidad.',
      icon: Users,
      color: 'from-zinc-500/10 to-zinc-650/5 hover:border-zinc-400',
      iconColor: 'text-zinc-650',
      badge: {
        text: `${occupiedTables} ocupadas`,
        type: occupiedTables > 0 ? 'amber' : 'neutral'
      }
    },
    {
      id: 'proveedores',
      title: 'Proveedores',
      description: 'Gestión de distribuidores, órdenes de compra y plazos de entrega.',
      icon: Truck,
      color: 'from-lime-500/10 to-lime-600/5 hover:border-lime-400',
      iconColor: 'text-lime-700',
      badge: {
        text: 'Suministros',
        type: 'neutral'
      }
    },
    {
      id: 'promociones',
      title: 'Promociones',
      description: 'Configuración de ofertas: descuentos porcentuales, montos fijos y 2x1.',
      icon: Percent,
      color: 'from-pink-500/10 to-pink-600/5 hover:border-pink-400',
      iconColor: 'text-pink-700',
      badge: {
        text: 'Marketing',
        type: 'neutral'
      }
    },
    {
      id: 'reservas',
      title: 'Reservas',
      description: 'Calendario de visitas planificadas, bloqueos preventivos de mesas y eventos.',
      icon: Calendar,
      color: 'from-amber-600/10 to-amber-700/5 hover:border-amber-500',
      iconColor: 'text-amber-800',
      badge: {
        text: 'Agenda de hoy',
        type: 'amber'
      }
    },
    {
      id: 'facturacion',
      title: 'Facturación',
      description: 'Historial fiscal de facturas y tickets emitidos, con cálculo automático de IVA.',
      icon: Receipt,
      color: 'from-stone-500/10 to-stone-600/5 hover:border-stone-400',
      iconColor: 'text-stone-700',
      badge: {
        text: 'Control fiscal',
        type: 'neutral'
      }
    },
    {
      id: 'sistema',
      title: 'Sistema / Configuración',
      description: 'Estado del motor secundario PostgreSQL, pings de red, adaptador local y logs.',
      icon: Sliders,
      color: 'from-indigo-500/10 to-indigo-600/5 hover:border-indigo-400',
      iconColor: 'text-indigo-700',
      badge: {
        text: 'PostgreSQL OK',
        type: 'emerald'
      }
    },
    {
      id: 'backups',
      title: 'Backups',
      description: 'Generación de copias de seguridad (.JSON), restauración de checkpoints y borrados.',
      icon: Database,
      color: 'from-violet-500/10 to-violet-600/5 hover:border-violet-400',
      iconColor: 'text-violet-700',
      badge: {
        text: 'Historial',
        type: 'neutral'
      }
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn bg-zinc-950/20 backdrop-blur-md rounded-3xl p-4 sm:p-6" id="home-operational-menu">
      
      {/* 1. Impact Brand Header Block */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-3xl p-8 md:p-10 text-zinc-100 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-6 border border-zinc-700 border-b-4 border-b-brand-yellow glow-yellow">
        {/* Subtle decorative logo outline in the background of the banner */}
        <div className="absolute right-[-25px] bottom-[-25px] opacity-10 rotate-12 scale-110 pointer-events-none">
          <ElPatronLogo className="w-64 h-64" variant="icon" color="#E8B800" />
        </div>
        
        {/* Prominent circular badge logo on the banner with object-contain */}
        <div className="w-24 h-24 md:w-28 md:h-28 bg-zinc-950 rounded-full flex items-center justify-center p-1.5 shadow-md border border-zinc-700 shrink-0 relative z-10">
          <ElPatronLogo className="w-full h-full object-contain rounded-full" variant="badge" color="#E8B800" />
        </div>
 
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Shift info badge */}
          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border shadow-xs ${
            shiftInfo.color.includes('bg-amber-155') || shiftInfo.color.includes('bg-amber-100')
              ? 'bg-amber-500/15 text-brand-orange border-amber-500/20'
              : shiftInfo.color.includes('brand-yellow')
                ? 'bg-brand-yellow/15 text-brand-yellow border-brand-yellow/20 glow-yellow'
                : 'bg-zinc-950 text-zinc-300 border-zinc-700'
          }`}>
            {shiftInfo.label}
          </span>
          <span className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Servicio Activo
          </span>
        </div>
 
        <div className="flex-1 space-y-2.5 relative z-10 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-50 font-display uppercase tracking-wider">
            Bienvenido a Pizzería Colores
          </h2>
          <p className="text-base md:text-lg text-zinc-300 font-medium leading-relaxed max-w-xl">
            Sistema de gestión gastronómica diseñado para el control operativo absoluto en cocina, salón, caja, facturación e inventario.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
            <span className="bg-zinc-950 text-brand-yellow text-[11px] px-3 py-1 rounded-full font-bold border border-zinc-700 font-mono shadow-xs">
              Estación Principal Terminal POS
            </span>
            <span className="bg-zinc-950 text-zinc-300 text-[11px] px-3 py-1 rounded-full font-bold border border-zinc-700 font-sans">
              Mesa de Enlace Local
            </span>
          </div>
        </div>
      </div>
 
      {/* Live Action Center - Notifications bell */}
      {activeAlerts.length > 0 && (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 max-w-7xl mx-auto space-y-3 shadow-2xl">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
            <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
            Centro de Mensajes y Alertas en Vivo
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeAlerts.map((alert, idx) => (
              <div 
                key={idx} 
                onClick={() => onNavigate(alert.action)}
                className={`p-3 rounded-xl border flex justify-between items-center text-xs font-medium cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md ${
                  alert.type === 'danger' 
                    ? 'border-red-500/20 hover:border-red-500/40 text-red-200 bg-red-950/15' 
                    : 'border-amber-500/20 hover:border-amber-500/40 text-amber-200 bg-amber-950/15'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.type === 'danger' ? 'text-red-400' : 'text-amber-450 text-amber-400'}`} />
                  <span className="text-zinc-200 leading-snug">{alert.text}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* 2. Top-Level Operational Context Row (Live stats + quick action info) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-900/30 p-5 md:p-6 rounded-3xl border border-white/5 shadow-lg backdrop-blur-md max-w-7xl mx-auto">
        
        {/* Salon Capacity & Shift Widget */}
        <div className="space-y-2 md:border-r border-white/5 md:pr-4 last:border-0">
          <span className="text-xs font-bold text-zinc-450 text-zinc-400 uppercase tracking-widest block mb-2">Estado del Salón</span>
          <div className="flex items-center gap-2">
            <div className="bg-zinc-950/60 border border-white/10 px-3 py-1.5 rounded-xl text-zinc-100 text-sm font-bold flex items-center gap-2 w-full">
              <span className={`h-2 w-2 rounded-full ${occupiedTables > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>Ocupación: {Math.round((occupiedTables / (mesas.length || 1)) * 100)}%</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400">{occupiedTables} mesas ocupadas de {mesas.length} totales.</p>
        </div>
 
        {/* Active operator / logged user */}
        <div className="space-y-2 md:border-r border-white/5 md:px-4 last:border-0">
          <span className="text-xs font-bold text-zinc-450 text-zinc-400 uppercase tracking-widest block mb-2">Usuario Activo</span>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-zinc-950/60 border border-white/10 flex items-center justify-center text-zinc-400">
              <User className="w-4 h-4 text-zinc-400" />
            </div>
            {canChangeUser ? (
              <select
                value={activeMozo}
                onChange={(e) => onMozoChange(e.target.value)}
                className="text-sm bg-transparent border-0 font-extrabold text-zinc-200 focus:outline-none focus:ring-0 p-0 cursor-pointer hover:text-brand-orange w-full"
              >
                {usuarios.filter(usuario => usuario.activo !== false).map(usuario => (
                  <option key={usuario.id_usuario} value={usuario.nombre} className="bg-zinc-905 bg-zinc-900 text-white text-xs">
                    {usuario.nombre} ({usuario.rol === 'superadmin' ? 'Super Admin' : usuario.rol === 'administrador' ? 'Administrador' : usuario.rol === 'cocina' ? 'Cocina' : 'Mozo'})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-extrabold text-zinc-200">{activeMozo}</span>
            )}
          </div>
          <p className="text-xs text-zinc-405 text-zinc-450 text-zinc-400">Persona logueada de forma segura.</p>
        </div>
 
        {/* Simulated shift time with clock advancement */}
        <div className="space-y-2 md:border-r border-white/5 md:px-4 last:border-0 bg-zinc-950/40 p-4 rounded-2xl border border-dashed border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-450 text-zinc-400 uppercase tracking-widest flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-zinc-450 text-zinc-400" />
              Reloj Operacional
            </span>
            <span className={`h-1.5 w-1.5 rounded-full ${autoTimerRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-black text-zinc-100 font-mono tracking-tight">{getSimulatedTimeStr()}</span>
            <div className="flex gap-1">
              <button
                onClick={onToggleAutoTimer}
                title={autoTimerRunning ? "Pausar" : "Iniciar"}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${autoTimerRunning ? 'bg-amber-600/20 text-amber-500' : 'bg-emerald-600/20 text-emerald-500'} cursor-pointer`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoTimerRunning ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => onAdvanceTime(15)}
                className="text-[10px] px-2 py-1 font-bold bg-zinc-900 border border-white/10 text-zinc-300 rounded hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              >
                +15m
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-400 font-medium">Control de comanda en reloj.</p>
        </div>
 
        {/* Mini Manager Insights */}
        <div className="space-y-2 md:pl-4">
          <span className="text-xs font-bold text-zinc-450 text-zinc-400 uppercase tracking-widest block mb-2">Turno en Cifras</span>
          <div className="flex flex-col gap-1 text-xs text-zinc-200 font-medium">
            <div className="flex justify-between items-center">
              <span>Ventas del Turno:</span>
              <strong className="text-emerald-400 font-mono text-sm">${totalSales.toLocaleString('es-AR')}</strong>
            </div>
            <div className="flex justify-between items-center border-t border-white/5 pt-1">
              <span>Ticket Promedio:</span>
              <strong className="text-zinc-100 font-mono">${averageTicket.toLocaleString('es-AR')}</strong>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Estimados consolidados de caja.</p>
        </div>
 
      </div>
 
      {/* Quick Shortcuts Panel */}
      <div className="bg-zinc-900/30 border border-zinc-700 rounded-3xl p-5 max-w-7xl mx-auto space-y-4 shadow-lg">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans pl-1">
          Acciones y Consultas Rápidas
        </h4>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('caja')}
            className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            Registrar Pago en Caja
          </button>
          
          <button
            onClick={() => onNavigate('inventario')}
            className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Insumos Críticos
          </button>
 
          <button
            onClick={() => onNavigate('recetas')}
            className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            <ChefHat className="w-3.5 h-3.5 text-brand-orange" />
            Recetas y Emplatados
          </button>
 
          <button
            onClick={() => onNavigate('sistema')}
            className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-700" />
            Diagnóstico de Servidores
          </button>
        </div>
      </div>
 
 
      {/* 3. Elegantly designed modules dashboard grid (operational focus) */}
      <div className="max-w-7xl mx-auto px-0 md:px-0 space-y-6">
        <h3 className="text-lg font-semibold text-zinc-400 uppercase tracking-widest mb-4">
          Módulos y Terminales de Operación
        </h3>
 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.filter(item => allowedViews.includes(item.id as AppView)).map(item => {
            const Icon = item.icon;
            
            // Determine badge theme colors
            let badgeStyle = 'bg-zinc-955 bg-zinc-950 text-zinc-400 border border-white/5';
            if (item.badge.type === 'emerald') badgeStyle = 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20';
            if (item.badge.type === 'amber') badgeStyle = 'bg-amber-950/20 text-amber-400 border border-amber-500/20 glow-yellow animate-pulse';
            if (item.badge.type === 'rose') badgeStyle = 'bg-red-950/20 text-red-400 border border-red-500/20 glow-red animate-pulse';
 
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group bg-zinc-900/35 hover:bg-zinc-900/70 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-brand-yellow/30 shadow-lg hover:shadow-brand-yellow/5 transition-all duration-300 text-left flex flex-col justify-between min-h-[170px] cursor-pointer border-l-4 border-l-brand-yellow hover:-translate-y-1`}
              >
                {/* Module Top Row */}
                <div className="w-full flex items-center justify-between gap-4">
                  <div className={`p-2.5 rounded-xl bg-zinc-950/60 border border-white/5 ${item.iconColor}`}>
                    <Icon className="w-6 h-6 shrink-0" />
                  </div>
                  
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wide ${badgeStyle}`}>
                    {item.badge.text}
                  </span>
                </div>
 
                {/* Module description content */}
                <div className="space-y-1.5 pt-3">
                  <h4 className="font-semibold text-xl text-zinc-100 group-hover:text-brand-yellow transition-colors tracking-tight flex items-center gap-1">
                    <span>{item.title}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </h4>
                  <p className="text-sm text-zinc-400 group-hover:text-zinc-350 transition-colors line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
 
    </div>
  );
}
