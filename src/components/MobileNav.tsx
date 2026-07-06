import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User, Clock, LogOut, RefreshCw } from 'lucide-react';
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
  isOnline: boolean;
  syncQueueSize: number;
  onTriggerSync: () => void;
}

const NAV_ITEMS: { id: AppView; label: string; icon: string }[] = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'mozo', label: 'Mozo', icon: '📱' },
  { id: 'cocina', label: 'Horno', icon: '🍕' },
  { id: 'caja', label: 'Caja', icon: '💵' },
  { id: 'menu', label: 'Menú', icon: '📖' },
  { id: 'recetas', label: 'Recetas', icon: '⚖️' },
  { id: 'mesas', label: 'Delivery', icon: '🛵' },
  { id: 'inventario', label: 'Inventario', icon: '📦' },
  { id: 'proveedores', label: 'Proveedores', icon: '🚚' },
  { id: 'promociones', label: 'Promociones', icon: '🏷️' },
  { id: 'reservas', label: 'Reservas', icon: '📅' },
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
  onAdvanceTime,
  isOnline,
  syncQueueSize,
  onTriggerSync
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-stone-200 shadow-md flex items-center justify-between px-3 safe-area-top">
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors cursor-pointer shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => setShowDiagnostics(true)}
          className="flex items-center gap-2 min-w-0 flex-1 justify-center px-2 cursor-pointer select-none active:opacity-75"
          title="Ver estado de conexión"
        >
          <div className="w-7 h-7 bg-stone-100 rounded-lg flex items-center justify-center p-0.5 border border-stone-250 overflow-hidden shrink-0 relative">
            <ElPatronLogo className="w-6 h-6 object-contain rounded" variant="icon" color="#E8B800" />
            <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`} />
          </div>
          <div className="min-w-0 text-left">
            <span className="font-extrabold text-sm text-[#624A3E] drop-shadow block leading-tight truncate">Colores Pizzería</span>
            <div className="flex items-center gap-1.5 leading-none mt-0.5">
              <span className="text-[7px] uppercase font-bold text-stone-550 tracking-wider block leading-none">
                {isOnline ? 'En línea' : 'Sin conexión'}
              </span>
              {syncQueueSize > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerSync();
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-black text-[7px] font-black uppercase px-1 rounded flex items-center gap-0.5 animate-pulse cursor-pointer shrink-0 transition-colors"
                  title="Sincronizar cambios pendientes ahora"
                >
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span>{syncQueueSize} Sync</span>
                </button>
              )}
            </div>
          </div>
        </div>


        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Reloj</span>
            <span className="text-xs font-black text-stone-900 font-mono leading-none">{getSimulatedTimeStr()}</span>
          </div>

          <button
            onClick={onToggleAutoTimer}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${autoTimerRunning ? 'bg-amber-600/20 text-amber-500' : 'bg-emerald-600/20 text-emerald-500'}`}
            aria-label="Toggle timer"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer (full overlay) ───────────────────────────────────── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            ref={drawerRef}
            className="absolute top-0 left-0 bottom-0 w-[min(82vw,320px)] bg-white shadow-2xl flex flex-col border-r border-stone-200"
          >
            {/* Drawer header */}
            <div className="p-3 border-b border-stone-200 flex items-center justify-between">
              <div 
                onClick={() => { setShowDiagnostics(true); setOpen(false); }}
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 select-none active:scale-[0.98]"
                title="Abrir Diagnóstico"
              >
                <div className="w-9 h-9 bg-stone-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center p-0.5 border border-stone-250 dark:border-zinc-800 overflow-hidden shrink-0 relative">
                  <ElPatronLogo className="w-8 h-8 object-contain rounded" variant="icon" color="#E8B800" />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-zinc-950 ${
                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`} />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-sm text-[#624A3E] dark:text-brand-yellow block leading-tight">Colores Pizzería</span>
                  <span className="text-[7px] uppercase font-bold text-stone-500 dark:text-zinc-500 tracking-wider block leading-tight">
                    {isOnline ? '🟢 En línea (Cloud)' : '🔴 Sin conexión'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 flex items-center justify-center text-stone-700 dark:text-white cursor-pointer"
                aria-label="Cerrar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sync Queue Mobile Panel */}
            {syncQueueSize > 0 && (
              <div className="mx-3 mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>{syncQueueSize} cambios por subir</span>
                </span>
                <button 
                  onClick={onTriggerSync}
                  className="bg-amber-500 text-black hover:bg-amber-400 font-black px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                >
                  Sincronizar
                </button>
              </div>
            )}


            {/* Reloj y simulación */}
            <div className="mx-3 mt-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] uppercase font-bold text-stone-500 tracking-wider font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Reloj
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${autoTimerRunning ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
              </div>
              <div className="flex items-center justify-between">
                <strong className="text-sm font-black text-stone-900 font-mono tracking-tight">{getSimulatedTimeStr()}</strong>
                <div className="flex items-center gap-1">
                  <button onClick={onToggleAutoTimer} className={`p-1.5 rounded-lg cursor-pointer ${autoTimerRunning ? 'bg-amber-600/20 text-amber-500' : 'bg-emerald-600/20 text-emerald-500'}`}>
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onAdvanceTime(15)} className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-[9px] font-bold cursor-pointer">+15m</button>
                </div>
              </div>
            </div>

            {/* User selector */}
            <div className="mx-3 mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-250 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-stone-550" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[7px] text-stone-500 block font-bold uppercase tracking-wider">Usuario</span>
                  {isAdmin ? (
                    <select
                      value={activeMozo}
                      onChange={(e) => onMozoChange(e.target.value)}
                      className="text-[11px] bg-transparent border-none p-0 focus:outline-none font-extrabold text-stone-900 cursor-pointer w-full mt-0.5 focus:ring-0"
                    >
                      {usuarios.filter(u => u.activo !== false).map(u => (
                        <option key={u.id_usuario || u.nombre} value={u.nombre} className="bg-white text-stone-900">{u.nombre}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[11px] font-extrabold text-stone-900 mt-0.5 block">{activeUser.nombre}</span>
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
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-brand-yellow text-brand-black shadow-sm' : 'text-stone-950 hover:text-black hover:bg-stone-100/70'}`}
                  >
                    <span className="text-base shrink-0 leading-none">{item.icon}</span>
                    <span className="text-[13px] font-bold tracking-wide leading-none">{item.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-black shrink-0" />}
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-stone-200 space-y-2">

              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer text-brand-red hover:bg-red-50 border border-transparent"
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
