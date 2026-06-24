import React from 'react';
import { Home, Smartphone, ChefHat, DollarSign, Receipt, Grid } from 'lucide-react';
import { AppView } from '../lib/permissions';

interface BottomNavigationProps {
  activeView: AppView;
  allowedViews: AppView[];
  onNavigate: (view: AppView) => void;
}

const NAV_ITEMS: { id: AppView; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'mozo', label: 'Mozo', icon: Smartphone },
  { id: 'cocina', label: 'Horno', icon: ChefHat },
  { id: 'caja', label: 'Caja', icon: DollarSign },
  { id: 'facturacion', label: 'Factura', icon: Receipt },
  { id: 'panel', label: 'Panel', icon: Grid },
];

export default function BottomNavigation({ activeView, allowedViews, onNavigate }: BottomNavigationProps) {
  const visible = NAV_ITEMS.filter(item => allowedViews.includes(item.id));

  return (
    <nav className="mobile-bottom-nav lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-zinc-950/85 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl safe-area-bottom overflow-hidden">
      <div className="flex justify-around items-center w-full h-16 px-2">
        {visible.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`touch-target flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-all duration-200 cursor-pointer rounded-xl ${
                isActive ? 'text-brand-yellow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              style={{ minHeight: 48 }}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-brand-yellow' : 'text-zinc-500'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-brand-yellow' : 'text-zinc-500'}`}>
                {item.label}
              </span>
              {isActive && <div className="w-3 h-1 bg-brand-yellow rounded-full mt-0.5 shadow-[0_0_10px_#E8B800]" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
