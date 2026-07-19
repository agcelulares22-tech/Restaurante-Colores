/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { 
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Mesa, Insumo, ProductoMenu, RecetaEscandallo, Pedido, Merma, Usuario } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import { useToast, ToastContainer } from './components/ToastContainer';
import PythonStreamlitLogin from './components/PythonStreamlitLogin';
import RestaurantCover from './components/RestaurantCover';
import ElPatronLogo from './components/ElPatronLogo';
import BottomNavigation from './components/BottomNavigation';
import MobileNav from './components/MobileNav';
import RetryErrorWrapper from './components/RetryErrorWrapper';
import RecetasErrorBoundary from './components/RecetasErrorBoundary';
import Skeleton from './components/Skeleton';
import DiagnosticsTester from './components/DiagnosticsTester';

import { useAppState } from './hooks/useAppState';
import { AppView } from './lib/permissions';

// Lazy-loaded modules (code-split, loaded on demand)
const HomeMenuModule = lazy(() => import('./components/HomeMenuModule'));
const MozoTerminal = lazy(() => import('./components/MozoTerminal'));
const KitchenMonitor = lazy(() => import('./components/KitchenMonitor'));
const InventoryModule = lazy(() => import('./components/InventoryModule'));
const CajaModule = lazy(() => import('./components/CajaModule'));
const SistemaModule = lazy(() => import('./components/SistemaModule'));
const UsuariosModule = lazy(() => import('./components/UsuariosModule'));
const MenuModule = lazy(() => import('./components/MenuModule'));
const RecetasModule = lazy(() => import('./components/RecetasModule'));
const DeliveryModule = lazy(() => import('./components/DeliveryModule'));
const ProveedoresModule = lazy(() => import('./components/ProveedoresModule'));
const PromocionesModule = lazy(() => import('./components/PromocionesModule'));
const ReservasModule = lazy(() => import('./components/ReservasModule'));
const BackupsModule = lazy(() => import('./components/BackupsModule'));
const FichajeModule = lazy(() => import('./components/FichajeModule'));

export default function App() {
  const { toasts, removeToast } = useToast();
  
  const {
    isStreamlitLoggedIn,
    showCover,
    setShowCover,
    permitirVentaSinStock,
    usuarios,
    setUsuarios,
    mesas,
    setMesas,
    insumos,
    setInsumos,
    productosMenu,
    setProductosMenu,
    recetas,
    setRecetas,
    pedidos,
    setPedidos,
    mermas,
    logs,
    postLoginLoading,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    showDiagnostics,
    setShowDiagnostics,
    isOnline,
    syncQueueSize,
    activeMozo,
    activeView,
    minutosGlobal,
    autoTimerRunning,
    activeUser,
    allowedViews,
    addLog,
    handleTriggerSync,
    handleLoginSuccess,
    handleLogout,
    handleCambiarEstadoPedido,
    handleProducirPedidoConEscandallo,
    handleFacturarMesa,
    handleRegistrarMerma,
    handleRestockInsumo,
    handleReservaEstadoChange,
    handleAdvanceTime,
    handleToggleAutoTimer,
    handleRestoreBackupData,
    handleMozoChange,
    handleNavigate,
    handleCrearPedido,
    getSimulatedTimeStr,
    handleSupabaseSync,
    cajaSession,
    setCajaSession
  } = useAppState();

  if (!isStreamlitLoggedIn && showCover) {
    return (
      <ErrorBoundary>
        <div className="dark bg-[#0B132B] min-h-screen">
          <RestaurantCover 
            onEnterSystem={() => setShowCover(false)} 
            productosMenu={productosMenu} 
            insumos={insumos} 
          />
        </div>
      </ErrorBoundary>
    );
  }

  if (!isStreamlitLoggedIn) {
    return (
      <ErrorBoundary>
        <PythonStreamlitLogin 
          onLoginSuccess={handleLoginSuccess} 
          onBackToCover={() => setShowCover(true)} 
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className="h-screen overflow-hidden bg-vintage-beige-light dark:bg-slate-950 flex font-sans text-zinc-900 dark:text-zinc-50 antialiased selection:bg-brand-yellow selection:text-brand-black transition-colors duration-300">

      {/* MOBILE/TABLET HEADER + DRAWER / RAIL */}
      <MobileNav
        activeView={activeView}
        allowedViews={allowedViews}
        activeUser={activeUser}
        activeMozo={activeMozo}
        usuarios={usuarios}
        autoTimerRunning={autoTimerRunning}
        getSimulatedTimeStr={getSimulatedTimeStr}
        onNavigate={handleNavigate}
        onMozoChange={handleMozoChange}
        onLogout={handleLogout}
        onToggleAutoTimer={handleToggleAutoTimer}
        onAdvanceTime={handleAdvanceTime}
        isOnline={isOnline}
        syncQueueSize={syncQueueSize}
        onTriggerSync={handleTriggerSync}
      />

      {/* LEFT SIDE PANEL - Desktop/Tablet sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen z-50 hidden lg:flex flex-col bg-white text-stone-950 border-r border-stone-200 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
        id="sidebar-left-panel"
      >
        {/* Logo & Sync Status */}
        <div 
          className={`flex flex-col border-b border-stone-200 ${isSidebarCollapsed ? 'items-center px-2' : 'px-3'} py-3 select-none`}
        >
          <div className="flex items-center cursor-pointer" onClick={() => setShowDiagnostics(true)} title="Ver diagnóstico">
            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center shadow-sm border border-stone-250 p-0.5 overflow-hidden shrink-0 relative">
              <ElPatronLogo className="w-7 h-7 object-contain rounded" variant="icon" color="#E8B800" />
              <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`} />
            </div>
            {!isSidebarCollapsed && (
              <div className="ml-3 min-w-0">
                <span className="font-bold text-sm text-[#624A3E] block leading-tight truncate">Colores Pizzería</span>
                <span className="text-[7px] uppercase font-bold text-stone-550 tracking-wider block leading-tight">
                  {isOnline ? '🟢 En línea (Cloud)' : '🔴 Sin conexión'}
                </span>
              </div>
            )}
          </div>
          {/* Sincronización interactiva */}
          {syncQueueSize > 0 && (
            isSidebarCollapsed ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerSync();
                }}
                className="mt-2 w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center cursor-pointer transition-colors relative"
                title={`Sincronizar ${syncQueueSize} cambios pendientes`}
              >
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span className="absolute -top-1 -right-1 bg-red-650 text-white font-mono text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-zinc-950">
                  {syncQueueSize}
                </span>
              </button>
            ) : (
              <div className="mt-2 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-md text-[10px]">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-amber-400" />
                  <span>{syncQueueSize} por subir</span>
                </span>
                <button 
                  onClick={handleTriggerSync}
                  className="bg-amber-500 text-black hover:bg-amber-400 font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                >
                  Subir
                </button>
              </div>
            )
          )}
        </div>


        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-3 min-h-0 sidebar-scrollbar">
          {[
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
          ].filter(item => (allowedViews || []).includes(item.id as AppView)).map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                title={isSidebarCollapsed ? item.label : ''}
                onClick={() => handleNavigate(item.id as AppView)}
                className={`mx-3 my-1 px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-start'
                } ${
                  isActive
                    ? 'bg-[#0EA5E9] text-zinc-950 font-black glow-blue shadow-md hover:bg-[#0284c7]'
                    : 'text-stone-950 hover:text-black hover:bg-stone-100/70'
                }`}
              >
                <span className="text-base shrink-0 leading-none">{item.icon}</span>
                {!isSidebarCollapsed && (
                  <span className="text-xs whitespace-nowrap truncate">{item.label}</span>
                )}
                {isActive && !isSidebarCollapsed && (
                  <motion.span 
                    layoutId="activeIndicator"
                    className="ml-auto w-2 h-2 rounded-full bg-stone-950 shrink-0" 
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-stone-200 p-3">

          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? 'Cerrar sesión' : ''}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-red-50 text-brand-red transition-colors cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="text-sm">Cerrar sesión</span>}
          </button>

          <button
            onClick={() => setIsSidebarCollapsed(c => !c)}
            title={isSidebarCollapsed ? 'Expandir' : 'Colapsar'}
            className="w-full flex items-center justify-center mt-2 p-2 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 overflow-x-hidden overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-6 pb-24 pt-16 lg:pt-4 max-w-[1600px] mx-auto w-full transition-all duration-300 ease-in-out bg-vintage-beige dark:bg-slate-900 ${
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        <RetryErrorWrapper>
          <Suspense fallback={<Skeleton count={6} />}>
            {activeView === 'home' && activeUser && (
              <HomeMenuModule 
                activeRol={activeUser.rol}
                mesas={mesas} pedidos={pedidos} insumos={insumos}
                productosMenu={productosMenu} usuarios={usuarios}
                allowedViews={allowedViews} canChangeUser={false}
                activeMozo={activeMozo} onMozoChange={handleMozoChange}
                onNavigate={handleNavigate}
                getSimulatedTimeStr={getSimulatedTimeStr}
                autoTimerRunning={autoTimerRunning}
                onToggleAutoTimer={handleToggleAutoTimer}
                onAdvanceTime={handleAdvanceTime}
              />
            )}
            {activeView === 'mozo' && (
              <MozoTerminal 
                activeMozo={activeMozo}
                mesas={mesas}
                insumos={insumos}
                productosMenu={productosMenu}
                setProductosMenu={setProductosMenu}
                recetas={recetas}
                usuarios={usuarios}
                pedidos={pedidos}
                onMozoChange={handleMozoChange}
                onCrearPedido={handleCrearPedido}
                onFacturarMesa={handleFacturarMesa}
                addLog={addLog}
              />
            )}
            {activeView === 'cocina' && (
              <KitchenMonitor 
                pedidos={pedidos}
                onCambiarEstadoPedido={handleCambiarEstadoPedido}
                onProducirPedidoConEscandallo={handleProducirPedidoConEscandallo}
                minutosGlobal={minutosGlobal}
                productosMenu={productosMenu}
                recetas={recetas}
                insumos={insumos}
                activeMozo={activeMozo}
                onCrearPedido={handleCrearPedido}
              />
            )}
            {activeView === 'caja' && (
              <CajaModule pedidos={pedidos} productosMenu={productosMenu} onFacturarMesa={handleFacturarMesa} onCambiarEstadoPedido={handleCambiarEstadoPedido} addLog={addLog} cajaSession={cajaSession} setCajaSession={setCajaSession} />
            )}
            {activeView === 'inventario' && (
              <InventoryModule insumos={insumos} productosMenu={productosMenu} recetas={recetas} mermas={mermas}
                onRegistrarMerma={handleRegistrarMerma}
                onRestockInsumo={handleRestockInsumo}
                addLog={addLog}
              />
            )}
            {activeView === 'usuarios' && (
              <UsuariosModule usuarios={usuarios} onUsuariosChange={setUsuarios} addLog={addLog} activeUser={activeUser} />
            )}
            {activeView === 'menu' && (
              <MenuModule productosMenu={productosMenu} onProductosChange={setProductosMenu} recetas={recetas} insumos={insumos} addLog={addLog} />
            )}
            {activeView === 'recetas' && (
              <RecetasErrorBoundary>
                <RecetasModule recetas={recetas} onRecetasChange={setRecetas} productosMenu={productosMenu} onProductosChange={setProductosMenu} insumos={insumos} addLog={addLog} />
              </RecetasErrorBoundary>
            )}
            {activeView === 'mesas' && (
              <DeliveryModule 
                pedidos={pedidos}
                productosMenu={productosMenu}
                onCrearPedido={handleCrearPedido}
                onCambiarEstadoPedido={handleCambiarEstadoPedido}
                onFacturarMesa={handleFacturarMesa}
                addLog={addLog}
                activeMozo={activeMozo}
                recetas={recetas}
                insumos={insumos}
              />
            )}
            {activeView === 'proveedores' && <ProveedoresModule addLog={addLog} />}
            {activeView === 'promociones' && <PromocionesModule addLog={addLog} />}
            {activeView === 'reservas' && (
              <ReservasModule mesas={mesas} onEstadoChange={handleReservaEstadoChange} addLog={addLog} />
            )}
            {activeView === 'sistema' && (
              <SistemaModule 
                insumos={insumos}
                productosMenu={productosMenu}
                recetas={recetas}
                pedidos={pedidos}
                mesas={mesas}
                addLog={addLog}
                onSyncComplete={handleSupabaseSync}
              />
            )}
            {activeView === 'backups' && (
              <BackupsModule 
                operationalData={{ usuarios, mesas, insumos, productosMenu, recetas, pedidos, mermas, logs }}
                onRestoreData={handleRestoreBackupData}
                addLog={addLog}
              />
            )}
            {activeView === 'fichaje' && (
              <FichajeModule activeMozo={activeMozo} usuarios={usuarios} />
            )}
          </Suspense>
        </RetryErrorWrapper>
      </main>

      {showDiagnostics && (
        <DiagnosticsTester onClose={() => setShowDiagnostics(false)} />
      )}

      <BottomNavigation activeView={activeView} onNavigate={handleNavigate} allowedViews={allowedViews} />
    </div>
    </ErrorBoundary>
  );
}
