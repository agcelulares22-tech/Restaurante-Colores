import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User, Clock, LogOut } from 'lucide-react';
import { AppView, getAllowedViews } from '../lib/permissions';
import { Usuario } from '../types';
import ElPatronLogo from './ElPatronLogo';
import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import DiagnosticsTester from './DiagnosticsTester';


interface MobileNavProps {
  activeView: AppView;
  allowedViews: AppView[];
  activeUser: Usuario;
  activeMozo: string;
  usuarios: Usuario[];
  autoTimerRunning: boolean;
  getSimulatedTimeStr: () => string;
  onNavigate: (view: AppView) => void;
  onMozoChange: (mozo: string) => void;
  onLogout: () => void;
  onToggleAutoTimer: () => void;
  onAdvanceTime: (mins: number) => void;
}

const NAV_ITEMS: { id: AppView; label: string; icon: string }[] = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'panel', label: 'Panel', icon: '📊' },
  { id: 'mozo', label: 'Mozo', icon: '📱' },
  { id: 'cocina', label: 'Horno', icon: '🍕' },
  { id: 'caja', label: 'Caja', icon: '💵' },
  { id: 'reportes', label: 'Reportes', icon: '📈' },
  { id: 'menu', label: 'Menú', icon: '📖' },
  { id: 'recetas', label: 'Recetas', icon: '⚖️' },
  { id: 'mesas', label: 'Mapa Mesas', icon: '🪑' },
  { id: 'delivery', label: 'Delivery', icon: '🛵' },
  { id: 'inventario', label: 'Inventario', icon: '📦' },
  { id: 'proveedores', label: 'Proveedores', icon: '🚚' },
  { id: 'promociones', label: 'Promociones', icon: '🏷️' },
  { id: 'reservas', label: 'Reservas', icon: '📅' },
  { id: 'facturacion', label: 'Facturación', icon: '🧾' },
  { id: 'usuarios', label: 'Usuarios', icon: '👥' },
  { id: 'sistema', label: 'Sistema', icon: '💻' },
  { id: 'backups', label: 'Backups', icon: '🗄️' },
  { id: 'fichaje', label: 'Fichaje', icon: '🕒' },
];

export default function MobileNav({
  activeView,
  allowedViews,
  activeUser,
  activeMozo,
  usuarios,
  autoTimerRunning,
  getSimulatedTimeStr,
  onNavigate,
  onMozoChange,
  onLogout,
  onToggleAutoTimer,
  onAdvanceTime
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const isConnected = tryGetActiveSupabaseClient() !== null;
  const isAdmin = activeUser.rol === 'administrador' || activeUser.rol === 'superadmin';
  const visibleItems = NAV_ITEMS.filter(item => allowedViews.includes(item.id));


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const handleNavigate = (view: AppView) => {
    onNavigate(view);
    setOpen(false);
  };

  return (
    <>
      {/* ── Mobile / Tablet header (lg:hidden) ─────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-zinc-950/85 backdrop-blur-md border-b border-white/5 shadow-md flex items-center justify-between px-3 safe-area-top">
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 flex items-center justify-center text-white transition-all duration-200 cursor-pointer shrink-0 active:scale-95"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => setShowDiagnostics(true)}
          className="flex items-center gap-2 min-w-0 flex-1 justify-center px-2 cursor-pointer select-none active:opacity-75"
          title="Ver estado de conexión"
        >
          <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center p-0.5 border border-white/10 overflow-hidden shrink-0 relative">
            <ElPatronLogo className="w-6 h-6 object-contain rounded" variant="icon" color="#E8B800" />
            <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-zinc-950 ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`} />
          </div>
          <div className="min-w-0 text-left">
            <span className="font-extrabold text-sm text-brand-yellow drop-shadow block leading-tight truncate">Colores Pizzería</span>
            <span className="text-[7px] uppercase font-bold text-zinc-400 tracking-wider block leading-tight flex items-center gap-1">
              {isConnected ? '🟢 Supabase Cloud' : '🟡 Modo Local'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Reloj</span>
            <span className="text-xs font-black text-white font-mono leading-none">{getSimulatedTimeStr()}</span>
          </div>
          <button
            onClick={onToggleAutoTimer}
            className={`w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${autoTimerRunning ? 'bg-amber-600/20 text-amber-500' : 'bg-emerald-600/20 text-emerald-500'}`}
            aria-label="Toggle timer"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer (full overlay) ───────────────────────────────────── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <div
            ref={drawerRef}
            className="absolute top-0 left-0 bottom-0 w-[min(82vw,320px)] bg-zinc-950/95 backdrop-blur-xl shadow-2xl flex flex-col border-r border-white/5"
          >
            {/* Drawer header */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <div 
                onClick={() => { setShowDiagnostics(true); setOpen(false); }}
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 select-none active:scale-[0.98]"
                title="Abrir Diagnóstico"
              >
                <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center p-0.5 border border-white/10 overflow-hidden shrink-0 relative">
                  <ElPatronLogo className="w-8 h-8 object-contain rounded" variant="icon" color="#E8B800" />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-zinc-950 ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`} />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-sm text-brand-yellow block leading-tight">Colores Pizzería</span>
                  <span className="text-[7px] uppercase font-bold text-zinc-500 tracking-wider block leading-tight">
                    {isConnected ? '🟢 Supabase Cloud' : '🟡 Modo Local'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all duration-200"
                aria-label="Cerrar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reloj y simulación */}
            <div className="mx-3 mt-3 p-3 bg-zinc-900/60 border border-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Reloj
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${autoTimerRunning ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
              </div>
              <div className="flex items-center justify-between">
                <strong className="text-sm font-black text-white font-mono tracking-tight">{getSimulatedTimeStr()}</strong>
                <div className="flex items-center gap-1">
                  <button onClick={onToggleAutoTimer} className={`p-1.5 rounded-lg cursor-pointer transition-all duration-150 active:scale-95 ${autoTimerRunning ? 'bg-amber-600/20 text-amber-500' : 'bg-emerald-600/20 text-emerald-500'}`}>
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onAdvanceTime(15)} className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[9px] font-bold cursor-pointer transition-all duration-150 active:scale-95">+15m</button>
                </div>
              </div>
            </div>

            {/* User selector */}
            <div className="mx-3 mt-2 p-3 bg-zinc-900/60 border border-white/5 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[7px] text-zinc-500 block font-bold uppercase tracking-wider">Usuario</span>
                  {isAdmin ? (
                    <select
                      value={activeMozo}
                      onChange={(e) => onMozoChange(e.target.value)}
                      className="text-[11px] bg-transparent border-none p-0 focus:outline-none font-extrabold text-white cursor-pointer w-full mt-0.5 focus:ring-0"
                    >
                      {usuarios.filter(u => u.activo !== false).map(u => (
                        <option key={u.id_usuario || u.nombre} value={u.nombre} className="bg-zinc-900 text-white">{u.nombre}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[11px] font-extrabold text-white mt-0.5 block">{activeUser.nombre}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              {visibleItems.map(item => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-brand-yellow/10 text-brand-yellow font-black border-l-4 border-brand-yellow glow-yellow'
                        : 'text-zinc-450 text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base shrink-0 leading-none">{item.icon}</span>
                    <span className="text-[13px] font-bold tracking-wide leading-none">{item.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-yellow shrink-0 animate-pulse" />}
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-white/5">
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer text-brand-red hover:bg-red-950/20 border border-transparent active:scale-95"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="text-[13px] font-bold tracking-wide leading-none">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {showDiagnostics && (
        <DiagnosticsTester onClose={() => setShowDiagnostics(false)} />
      )}
    </>
  );
}
