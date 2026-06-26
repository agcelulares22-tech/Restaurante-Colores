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
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { label: 'Servicio de Desayuno ☕', color: 'bg-amber-100 text-amber-700 border-amber-300' };
    if (hour >= 12 && hour < 17) return { label: 'Servicio de Almuerzo ☀️', color: 'bg-brand-yellow/20 text-amber-900 border-brand-yellow/40' };
    if (hour >= 17 && hour < 20) return { label: 'Servicio de Merienda 🥐', color: 'bg-amber-100 text-amber-700 border-amber-300' };
    return { label: 'Servicio de Cena 🌙', color: 'bg-slate-100 text-slate-700 border-slate-300' };
  }, []);

  // Active alert collection
  const activeAlerts = useMemo(() => {
    const alerts: { text: string; type: 'danger' | 'warning'; action: AppView }[] = [];
    if (lowStockCount > 0) {
      alerts.push({
        text: `${lowStockCount} insumo(s) con stock crítico`,
        type: 'danger',
        action: 'inventario'
      });
    }
    if (pendingCooking > 0) {
      alerts.push({
        text: `${pendingCooking} comanda(s) pendientes en cocina`,
        type: 'warning',
        action: 'cocina'
      });
    }
    return alerts;
  }, [lowStockCount, pendingCooking]);

  // Menu items list
  const menuItems = [
    {
      id: 'mozo',
      title: 'Terminal Mozo',
      description: 'Crear pedidos para mesa, take away y delivery con acceso rápido al menú, comandas y pre-cuenta.',
      icon: Smartphone,
      iconColor: 'text-brand-yellow',
      badge: {
        text: 'MOZO',
        type: 'amber'
      }
    },
    {
      id: 'cocina',
      title: 'Monitor de Horno',
      description: 'Visualización en tiempo real de comandas pendientes, en preparación y listas para servir.',
      icon: ChefHat,
      iconColor: 'text-brand-orange',
      badge: {
        text: pendingCooking > 0 ? `${pendingCooking} ACTIVOS` : 'COCINA',
        type: pendingCooking > 0 ? 'amber' : 'emerald'
      }
    },
    {
      id: 'caja',
      title: 'Caja',
      description: 'Control de cobros de mesas, división de cuentas de comensales y cierres de turno.',
      icon: DollarSign,
      iconColor: 'text-emerald-500',
      badge: {
        text: 'FACTURACIÓN ABIERTA',
        type: 'emerald'
      }
    },
    {
      id: 'mesas',
      title: 'Delivery',
      description: 'Gestión de envíos a domicilio, zonas de reparto, seguimiento de pedidos y repartidores.',
      icon: Truck,
      iconColor: 'text-indigo-400',
      badge: {
        text: 'DELIVERY',
        type: 'emerald'
      }
    },

    {
      id: 'menu',
      title: 'Menú',
      description: 'Crear y modificar la oferta culinaria, configurar precios públicos y categorías.',
      icon: UtensilsCrossed,
      iconColor: 'text-amber-500',
      badge: {
        text: `${productosMenu.length} PRODUCTOS`,
        type: 'neutral'
      }
    },
    {
      id: 'recetas',
      title: 'Recetas y Escandallo',
      description: 'Costeo de platos, emplatados estándar, márgenes y relación con insumos.',
      icon: Scale,
      iconColor: 'text-brand-orange',
      badge: {
        text: 'COSTOS',
        type: 'neutral'
      }
    },
    {
      id: 'inventario',
      title: 'Inventario',
      description: 'Control de stock, alertas de reposición, y movimientos de insumos por producción.',
      icon: Database,
      iconColor: 'text-emerald-500',
      badge: {
        text: lowStockCount > 0 ? `${lowStockCount} CRÍTICOS` : 'STOK OK',
        type: lowStockCount > 0 ? 'rose' : 'emerald'
      }
    },
    {
      id: 'proveedores',
      title: 'Proveedores',
      description: 'Directorio de proveedores, órdenes de compra e historial de precios por insumo.',
      icon: Truck,
      iconColor: 'text-zinc-400',
      badge: {
        text: 'COMPRAS',
        type: 'neutral'
      }
    },
    {
      id: 'promociones',
      title: 'Promociones',
      description: 'Armado de combos, descuentos temporales y ofertas especiales por canal.',
      icon: Percent,
      iconColor: 'text-pink-400',
      badge: {
        text: 'MARKETING',
        type: 'neutral'
      }
    },
    {
      id: 'reservas',
      title: 'Reservas',
      description: 'Agenda de reservas telefónicas y web, asignación de mesas y recordatorios.',
      icon: Calendar,
      iconColor: 'text-purple-400',
      badge: {
        text: 'AGENDA',
        type: 'neutral'
      }
    },

    {
      id: 'sistema',
      title: 'Sistema',
      description: 'Configuración general, conectividad de Supabase, diagnóstico y parámetros.',
      icon: Sliders,
      iconColor: 'text-indigo-400',
      badge: {
        text: hasSupabase ? 'EN LÍNEA' : 'LOCAL',
        type: hasSupabase ? 'emerald' : 'amber'
      }
    },
    {
      id: 'backups',
      title: 'Backups',
      description: 'Respaldos manuales y automáticos de la base de datos local y nube.',
      icon: Cloud,
      iconColor: 'text-blue-400',
      badge: {
        text: 'RESPALDOS',
        type: 'neutral'
      }
    },
    {
      id: 'usuarios',
      title: 'Usuarios',
      description: 'Gestión de personal, roles, permisos y accesos al sistema.',
      icon: Users,
      iconColor: 'text-cyan-400',
      badge: {
        text: `${usuarios.length} USUARIOS`,
        type: 'neutral'
      }
    },

  ];

  return (
    <div className="space-y-8 animate-fadeIn bg-white/80 dark:bg-slate-950/30 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors duration-300" id="home-operational-menu">
      
      {/* 1. Impact Brand Header Block */}
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-white dark:from-amber-500/10 dark:via-orange-500/5 dark:to-transparent rounded-3xl p-8 md:p-10 text-slate-900 dark:text-zinc-100 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-6 border border-slate-200 dark:border-zinc-700 border-b-4 border-b-brand-yellow transition-colors duration-300">
        {/* Subtle decorative logo outline in the background of the banner */}
        <div className="absolute right-[-25px] bottom-[-25px] opacity-10 rotate-12 scale-110 pointer-events-none">
          <ElPatronLogo className="w-64 h-64" variant="icon" color="#E8B800" />
        </div>
        
        {/* Prominent circular badge logo on the banner with object-contain */}
        <div className="w-24 h-24 md:w-28 md:h-28 bg-white dark:bg-zinc-950 rounded-full flex items-center justify-center p-1.5 shadow-md border border-slate-200 dark:border-zinc-700 shrink-0 relative z-10 transition-colors duration-300">
          <ElPatronLogo className="w-full h-full object-contain rounded-full" variant="badge" color="#E8B800" />
        </div>
 
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Shift info badge */}
          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border shadow-xs transition-colors duration-300 ${
            shiftInfo.color.includes('bg-amber-155') || shiftInfo.color.includes('bg-amber-100')
              ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-brand-orange dark:border-amber-500/20'
              : shiftInfo.color.includes('brand-yellow')
                ? 'bg-brand-yellow/20 text-amber-900 border-brand-yellow/40 dark:bg-brand-yellow/15 dark:text-brand-yellow dark:border-brand-yellow/20 glow-yellow'
                : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-zinc-950 dark:text-zinc-300 dark:border-zinc-700'
          }`}>
            {shiftInfo.label}
          </span>
          <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs transition-colors duration-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Servicio Activo
          </span>
        </div>
 
        <div className="flex-1 space-y-2.5 relative z-10 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50 font-display uppercase tracking-wider transition-colors duration-300">
            Bienvenido a Pizzería Colores
          </h2>
          <p className="text-base md:text-lg text-slate-600 dark:text-zinc-300 font-medium leading-relaxed max-w-xl transition-colors duration-300">
            Sistema de gestión gastronómica diseñado para el control operativo absoluto en cocina, salón, caja e inventario.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
            <span className="bg-white text-brand-black dark:bg-zinc-950 dark:text-brand-yellow text-[11px] px-3 py-1 rounded-full font-bold border border-slate-200 dark:border-zinc-700 font-mono shadow-xs transition-colors duration-300">
              Estación Principal Terminal POS
            </span>
            <span className="bg-white text-slate-700 dark:bg-zinc-950 dark:text-zinc-300 text-[11px] px-3 py-1 rounded-full font-bold border border-slate-200 dark:border-zinc-700 font-sans transition-colors duration-300">
              Mesa de Enlace Local
            </span>
          </div>
        </div>
      </div>
 
      {/* Live Action Center - Notifications bell */}
      {activeAlerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-zinc-900/40 backdrop-blur-md border border-amber-200 dark:border-white/5 rounded-3xl p-5 max-w-7xl mx-auto space-y-3 shadow-lg transition-colors duration-300">
          <h4 className="text-xs font-bold text-amber-800 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-sans transition-colors duration-300">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-500 animate-bounce" />
            Centro de Mensajes y Alertas en Vivo
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeAlerts.map((alert, idx) => (
              <div 
                key={idx} 
                onClick={() => onNavigate(alert.action)}
                className={`p-3 rounded-xl border flex justify-between items-center text-xs font-medium cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md transition-colors duration-300 ${
                  alert.type === 'danger' 
                    ? 'border-red-300 hover:border-red-400 text-red-800 bg-red-50 dark:border-red-500/20 dark:hover:border-red-500/40 dark:text-red-200 dark:bg-red-950/15' 
                    : 'border-amber-300 hover:border-amber-400 text-amber-900 bg-amber-50 dark:border-amber-500/20 dark:hover:border-amber-500/40 dark:text-amber-200 dark:bg-amber-950/15'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.type === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                  <span className="text-slate-800 dark:text-zinc-200 leading-snug transition-colors duration-300">{alert.text}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 dark:text-zinc-500 shrink-0 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* 2. Top-Level Operational Context Row (Live stats + quick action info) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-zinc-900/30 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-lg dark:shadow-none backdrop-blur-md max-w-7xl mx-auto transition-colors duration-300">
        
        {/* Salon Capacity & Shift Widget */}
        <div className="space-y-2 md:border-r border-slate-200 dark:border-white/5 md:pr-4 last:border-0 transition-colors duration-300">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-2 transition-colors duration-300">Estado del Salón</span>
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl text-slate-900 dark:text-zinc-100 text-sm font-bold flex items-center gap-2 w-full transition-colors duration-300">
              <span className={`h-2 w-2 rounded-full ${occupiedTables > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>Ocupación: {Math.round((occupiedTables / (mesas.length || 1)) * 100)}%</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 transition-colors duration-300">{occupiedTables} mesas ocupadas de {mesas.length} totales.</p>
        </div>
 
        {/* Active operator / logged user */}
        <div className="space-y-2 md:border-r border-slate-200 dark:border-white/5 md:px-4 last:border-0 transition-colors duration-300">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-2 transition-colors duration-300">Usuario Activo</span>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-zinc-400 transition-colors duration-300">
              <User className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
            </div>
            {canChangeUser ? (
              <select
                value={activeMozo}
                onChange={(e) => onMozoChange(e.target.value)}
                className="text-sm bg-transparent border-0 font-extrabold text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-0 p-0 cursor-pointer hover:text-brand-orange w-full transition-colors duration-300"
              >
                {usuarios.filter(usuario => usuario.activo !== false).map(usuario => (
                  <option key={usuario.id_usuario} value={usuario.nombre} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white text-xs transition-colors duration-300">
                    {usuario.nombre} ({usuario.rol === 'superadmin' ? 'Super Admin' : usuario.rol === 'administrador' ? 'Administrador' : usuario.rol === 'cocina' ? 'Cocina' : 'Mozo'})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-200 transition-colors duration-300">{activeMozo}</span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 transition-colors duration-300">Persona logueada de forma segura.</p>
        </div>
 
        {/* Simulated shift time with clock advancement */}
        <div className="space-y-2 md:border-r border-slate-200 dark:border-white/5 md:px-4 last:border-0 bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1 font-mono transition-colors duration-300">
              <Clock className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
              Reloj Operacional
            </span>
            <span className={`h-1.5 w-1.5 rounded-full ${autoTimerRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-black text-slate-900 dark:text-zinc-100 font-mono tracking-tight transition-colors duration-300">{getSimulatedTimeStr()}</span>
            <div className="flex gap-1">
              <button
                onClick={onToggleAutoTimer}
                title={autoTimerRunning ? "Pausar" : "Iniciar"}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${autoTimerRunning ? 'bg-amber-100 text-amber-600 dark:bg-amber-600/20 dark:text-amber-500' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-500'} cursor-pointer transition-colors duration-300`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoTimerRunning ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => onAdvanceTime(15)}
                className="text-[10px] px-2 py-1 font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer transition-colors duration-300"
              >
                +15m
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium transition-colors duration-300">Control de comanda en reloj.</p>
        </div>
 
        {/* Mini Manager Insights */}
        <div className="space-y-2 md:pl-4">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-2 transition-colors duration-300">Turno en Cifras</span>
          <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-zinc-200 font-medium transition-colors duration-300">
            <div className="flex justify-between items-center">
              <span>Ventas del Turno:</span>
              <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-sm transition-colors duration-300">${totalSales.toLocaleString('es-AR')}</strong>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/5 pt-1 transition-colors duration-300">
              <span>Ticket Promedio:</span>
              <strong className="text-slate-900 dark:text-zinc-100 font-mono transition-colors duration-300">${averageTicket.toLocaleString('es-AR')}</strong>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1 transition-colors duration-300">Estimados consolidados de caja.</p>
        </div>
 
      </div>

      {/* Quick Shortcuts Panel */}
      <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-700 rounded-3xl p-5 max-w-7xl mx-auto space-y-4 shadow-lg transition-colors duration-300">
        <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-sans pl-1 transition-colors duration-300">
          Acciones y Consultas Rápidas
        </h4>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('caja')}
            className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-colors duration-300"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            Registrar Pago en Caja
          </button>
          
          <button
            onClick={() => onNavigate('inventario')}
            className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-colors duration-300"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Insumos Críticos
          </button>
 
          <button
            onClick={() => onNavigate('recetas')}
            className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-colors duration-300"
          >
            <ChefHat className="w-3.5 h-3.5 text-brand-orange" />
            Recetas y Emplatados
          </button>
 
          <button
            onClick={() => onNavigate('sistema')}
            className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-colors duration-300"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
            Diagnóstico de Servidores
          </button>
        </div>
      </div>

      {/* 3. Elegantly designed modules dashboard grid (operational focus) */}
      <div className="max-w-7xl mx-auto px-0 md:px-0 space-y-6">
        <h3 className="text-lg font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-4 transition-colors duration-300">
          Módulos y Terminales de Operación
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.filter(item => allowedViews.includes(item.id as AppView)).map(item => {
            const Icon = item.icon;
            
            // Determine badge theme colors
            let badgeStyle = 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-zinc-950 dark:text-zinc-400 dark:border-white/5';
            if (item.badge.type === 'emerald') badgeStyle = 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/20';
            if (item.badge.type === 'amber') badgeStyle = 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-500/20 glow-yellow animate-pulse';
            if (item.badge.type === 'rose') badgeStyle = 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-500/20 glow-red animate-pulse';

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group bg-white dark:bg-zinc-900/35 hover:bg-slate-50 dark:hover:bg-zinc-900/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-brand-yellow/40 dark:hover:border-brand-yellow/30 shadow-lg hover:shadow-brand-yellow/10 dark:hover:shadow-brand-yellow/5 transition-all duration-300 text-left flex flex-col justify-between min-h-[170px] cursor-pointer border-l-4 border-l-brand-yellow hover:-translate-y-1 transition-colors duration-300`}
              >
                {/* Module Top Row */}
                <div className="w-full flex items-center justify-between gap-4">
                  <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/5 ${item.iconColor} transition-colors duration-300`}>
                    <Icon className="w-6 h-6 shrink-0" />
                  </div>
                  
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wide ${badgeStyle} transition-colors duration-300`}>
                    {item.badge.text}
                  </span>
                </div>

                {/* Module description content */}
                <div className="space-y-1.5 pt-3">
                  <h4 className="font-semibold text-xl text-slate-900 dark:text-zinc-100 group-hover:text-brand-yellow transition-colors tracking-tight flex items-center gap-1 transition-colors duration-300">
                    <span>{item.title}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-300 transition-colors line-clamp-2 leading-relaxed transition-colors duration-300">
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
