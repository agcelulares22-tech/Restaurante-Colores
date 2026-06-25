import React, { useState, useMemo, useEffect } from 'react';
import { PaginatedList } from './VirtualizedList';
import { 
  Receipt, 
  Printer, 
  Coins, 
  CreditCard, 
  Download, 
  CheckCircle, 
  Percent, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Users, 
  ShieldCheck, 
  Settings, 
  Plus, 
  Trash2, 
  QrCode, 
  FileText, 
  Lock, 
  Unlock, 
  Info,
  ChevronRight,
  RefreshCw,
  Smartphone,
  FolderOpen,
  X,
  Tag
} from 'lucide-react';
import { facturacionService } from '../services/facturacionService';
import { 
  Pedido, 
  ProductoMenu, 
  CierreCaja, 
  PrinterConfig, 
  TicketData, 
  TicketItem, 
  TipoComprobante,
  FacturaDb,
  PagoDb,
  Cliente
} from '../types';
import { useToast, ToastContainer } from './ToastContainer';
import { useCaja, SplitPartition } from '../features/caja/hooks/useCaja';
import { cajaService } from '../services/cajaService';
import { pdfService } from '../services/pdfService';
import { printerService } from '../services/printerService';
import ElPatronLogo from './ElPatronLogo';

interface CajaModuleProps {
  pedidos: Pedido[];
  productosMenu: ProductoMenu[];
  onFacturarMesa: (idPedido: string, alreadyUpdatedInCaja?: boolean, itemsRemaining?: Pedido['items']) => void;
  onCambiarEstadoPedido: (idPedido: string, nuevoEstado: Pedido['estado_comanda']) => void;
  addLog: (tipo: 'pedido_creado' | 'descuento_stock' | 'alerta_stock' | 'comanda_estado' | 'merma_registrada' | 'sistema', mensaje: string) => void;
}

function CajaModule({
  pedidos,
  productosMenu,
  onFacturarMesa,
  onCambiarEstadoPedido,
  addLog
}: CajaModuleProps) {
  const { toast, toasts, removeToast } = useToast();
  const [activeSummaryTab, setActiveSummaryTab] = useState<'platos' | 'gastos'>('platos');
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const caja = useCaja({
    pedidos,
    productosMenu,
    onFacturarMesa,
    onCambiarEstadoPedido,
    addLog,
    toast
  });

  const {
    restaurante,
    setRestaurante,
    editRestauranteMode,
    setEditRestauranteMode,
    cajaSession,
    sessionInsumos,
    lastFacturas,
    allFacturas,
    showOpenModal,
    setShowOpenModal,
    showCloseModal,
    setShowCloseModal,
    openingCashInput,
    setOpeningCashInput,
    cashierNameInput,
    setCashierNameInput,
    closingPhysicalCashInput,
    setClosingPhysicalCashInput,
    closingObservationsInput,
    setClosingObservationsInput,
    selectedPedidoId,
    setSelectedPedidoId,
    tipoComprobante,
    setTipoComprobante,
    cuitCliente,
    setCuitCliente,
    nombreCliente,
    setNombreCliente,
    metodoPago,
    setMetodoPago,
    mixedPayments,
    setMixedPayments,
    mixedMetodoInput,
    setMixedMetodoInput,
    mixedMontoInput,
    setMixedMontoInput,
    montoEntregadoEfectivo,
    setMontoEntregadoEfectivo,
    tipoDescuento,
    setTipoDescuento,
    descuentoPorcentaje,
    setDescuentoPorcentaje,
    descuentoMonto,
    setDescuentoMonto,
    propinaPorcentaje,
    setPropinaPorcentaje,
    splitPayerCount,
    setSplitPayerCount,
    activePayerIndex,
    setActivePayerIndex,
    splitByProducts,
    setSplitByProducts,
    selectedProductsForSplit,
    setSelectedProductsForSplit,
    showSuccessModal,
    setShowSuccessModal,
    successDetails,
    printerConfig,
    setPrinterConfig,
    showPrinterSettings,
    setShowPrinterSettings,
    selectedCliente,
    setSelectedCliente,
    dniCuitBuscar,
    setDniCuitBuscar,
    nombreNuevoCliente,
    setNombreNuevoCliente,
    emailNuevoCliente,
    setEmailNuevoCliente,
    telNuevoCliente,
    setTelNuevoCliente,
    puntosRedimidos,
    setPuntosRedimidos,
    couponInput,
    setCouponInput,
    appliedCoupon,
    couponError,
    handleApplyCoupon,
    handleRemoveCoupon,
    movimientosCajaChica,
    showMovimientoModal,
    setShowMovimientoModal,
    movimientoMonto,
    setMovimientoMonto,
    movimientoTipo,
    setMovimientoTipo,
    movimientoConcepto,
    setMovimientoConcepto,
    sumIngresosManuales,
    sumEgresosManuales,
    cajaEsperadaTotal,
    handleRegistrarMovimientoCajaChica,
    handleBuscarCliente,
    handleRegistrarCliente,
    activeBills,
    selectedPedido,
    orderBreakdowns,
    mixedSum,
    rawRemainingMixedBalance,
    calculatedChange,
    handleAddMixedPayment,
    handleRemoveMixedPayment,
    handleOpenShift,
    handleCloseShift,
    handleConfirmCheckout,
    triggerManualPrint,
    triggerPDFDownloadOnly,
    downloadFacturaHistorialPdf,
    isAdvancedSplitMode,
    setIsAdvancedSplitMode,
    advancedPartitions,
    setAdvancedPartitions,
    initAdvancedSplit,
    updatePartitionItem,
    updatePartitionPayment,
    processPartitionPayment,
    resetAdvancedSplit,
    getPartitionBreakdown,
    loadCajaState,
    getShiftProductBreakdown
  } = caja;

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [archiveMetodoFilter, setArchiveMetodoFilter] = useState('todos');
  const [archiveEstadoFilter, setArchiveEstadoFilter] = useState('todos');

  const filteredFacturas = useMemo(() => {
    return allFacturas.filter(f => {
      const matchesSearch = 
        f.nro_ticket.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
        f.cliente.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
        f.cuit.includes(archiveSearchQuery);
      
      const matchesMetodo = 
        archiveMetodoFilter === 'todos' || 
        f.medio_pago === archiveMetodoFilter;

      const matchesEstado = 
        archiveEstadoFilter === 'todos' || 
        f.estado === archiveEstadoFilter;

      return matchesSearch && matchesMetodo && matchesEstado;
    });
  }, [allFacturas, archiveSearchQuery, archiveMetodoFilter, archiveEstadoFilter]);

  const handleAnularFactura = async (idFactura: string) => {
    if (!window.confirm('¿Está seguro de que desea anular este comprobante y registrar una Nota de Crédito en Supabase?')) {
      return;
    }
    try {
      await facturacionService.markNotaCredito(idFactura);
      toast.success('Comprobante anulado correctamente.');
      loadCajaState();
    } catch (err: any) {
      toast.error('Error al anular: ' + err.message);
    }
  };

  // Group items by menu categories (Rule 3)
  const groupedItemsByCategory = useMemo(() => {
    if (!selectedPedido) return {};
    const grouped: { [category: string]: typeof selectedPedido.items } = {};
    
    selectedPedido.items.forEach(item => {
      const pm = productosMenu.find(p => p.id_producto === item.id_producto);
      const cat = pm?.categoria || 'Otros';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(item);
    });
    
    return grouped;
  }, [selectedPedido, productosMenu]);

  const platosConsumidosHoy = useMemo(() => {
    const todayStr = new Date().toDateString();
    const totals: { [name: string]: { cantidad: number; totalRecaudado: number; categoria: string } } = {};
    
    pedidos.forEach(p => {
      const orderDateStr = new Date(p.fecha_hora).toDateString();
      if (orderDateStr === todayStr && p.estado_comanda === 'entregado_cobrado') {
        p.items.forEach(item => {
          const pm = productosMenu.find(prod => prod.id_producto === item.id_producto);
          const price = item.precio_unitario ?? pm?.precio_venta ?? 0;
          if (!totals[item.nombre]) {
            totals[item.nombre] = { cantidad: 0, totalRecaudado: 0, categoria: item.categoria };
          }
          totals[item.nombre].cantidad += item.cantidad;
          totals[item.nombre].totalRecaudado += price * item.cantidad;
        });
      }
    });

    return Object.entries(totals)
      .map(([nombre, meta]) => ({
        nombre,
        cantidad: meta.cantidad,
        totalRecaudado: meta.totalRecaudado,
        categoria: meta.categoria
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [pedidos, productosMenu]);

  return (
    <div className="space-y-6" id="gastro-checkout-master">
      
      {/* HEADER BAR: Settings & Restaurant Config */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 ml-1 bg-[#624A3E]/10 rounded-xl text-[#624A3E]">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black text-stone-900 uppercase tracking-tight font-sans">
              Terminal de Caja & Facturación Fiscal
            </h1>
            <p className="text-[11px] text-stone-500 font-medium">
              Gestor de comprobantes de salón • {restaurante.nombreComercial}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowArchiveModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#624A3E]/30 bg-[#F5F1E9] text-[10px] uppercase font-extrabold text-[#624A3E] hover:bg-[#ebdfd8] cursor-pointer transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#624A3E]" />
            Archivos
          </button>

          <button
            onClick={() => setEditRestauranteMode(!editRestauranteMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-[10px] uppercase font-extrabold text-stone-600 hover:bg-stone-100 cursor-pointer transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Configurar Restaurant
          </button>
          
          <button
            onClick={() => setShowPrinterSettings(!showPrinterSettings)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-[10px] uppercase font-extrabold text-stone-600 hover:bg-stone-100 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Configuración Ticketera
          </button>
        </div>
      </div>

      {/* RESTAURANTE EDIT FORM */}
      {editRestauranteMode && (
        <div className="bg-[#F5F1E9]/80 border border-stone-200 p-5 rounded-2xl animate-fadeIn space-y-4">
          <h3 className="text-xs font-black text-[#624A3E] uppercase flex items-center gap-1.5">
            <Settings className="w-4 h-4" /> Editorial de Datos de Emisión (Cambios en Comprobantes)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">Nombre Fantasía</label>
              <input 
                type="text" 
                value={restaurante.nombreComercial} 
                onChange={e => setRestaurante(prev => ({ ...prev, nombreComercial: e.target.value }))}
                className="w-full min-h-11 p-2.5 text-sm bg-white border border-stone-200 rounded-lg text-stone-800 font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">Razón Social</label>
              <input 
                type="text" 
                value={restaurante.razonSocial} 
                onChange={e => setRestaurante(prev => ({ ...prev, razonSocial: e.target.value }))}
                className="w-full min-h-11 p-2.5 text-sm bg-white border border-stone-200 rounded-lg text-stone-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">CUIT Comercial</label>
              <input 
                type="text" 
                value={restaurante.cuit} 
                onChange={e => setRestaurante(prev => ({ ...prev, cuit: e.target.value }))}
                className="w-full min-h-11 p-2.5 text-sm bg-white border border-stone-200 rounded-lg text-stone-800 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">Dirección Física</label>
              <input 
                type="text" 
                value={restaurante.direccion} 
                onChange={e => setRestaurante(prev => ({ ...prev, direccion: e.target.value }))}
                className="w-full min-h-11 p-2.5 text-sm bg-white border border-stone-200 rounded-lg text-stone-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">Teléfono</label>
              <input 
                type="text" 
                value={restaurante.telefono} 
                onChange={e => setRestaurante(prev => ({ ...prev, telefono: e.target.value }))}
                className="w-full min-h-11 p-2.5 text-sm bg-white border border-stone-200 rounded-lg text-stone-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">Email Soporte factura</label>
              <input 
                type="text" 
                value={restaurante.email} 
                onChange={e => setRestaurante(prev => ({ ...prev, email: e.target.value }))}
                className="w-full min-h-11 p-2.5 text-sm bg-white border border-stone-200 rounded-lg text-stone-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">Pie de Comprobante</label>
              <input 
                type="text" 
                value={restaurante.mensajePie} 
                onChange={e => setRestaurante(prev => ({ ...prev, mensajePie: e.target.value }))}
                className="w-full min-h-11 p-2.5 text-sm bg-white border border-stone-200 rounded-lg text-stone-800"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setEditRestauranteMode(false)}
                className="w-full min-h-11 py-2.5 bg-[#624A3E] hover:bg-[#503C32] text-white text-xs uppercase font-black rounded-lg cursor-pointer"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTER SETTINGS MODULE FOR ESC/POS */}
      {showPrinterSettings && (
        <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl animate-fadeIn space-y-3">
          <div className="flex justify-between items-center border-b border-stone-100 pb-2">
            <h4 className="text-xs sm:text-sm font-black text-stone-800 uppercase flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-[#624A3E]" /> Parámetros de Integración Térmica (ESC/POS)
            </h4>
            <span className="text-[9px] text-[#22C55E] bg-emerald-50 px-2 py-0.5 rounded-full font-bold">API Enlazable</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="sm:col-span-2 md:col-span-1">
              <label className="text-[10px] font-bold text-stone-500 block mb-1">Nombre de Impresora</label>
              <input 
                type="text" 
                value={printerConfig.printerName}
                onChange={e => setPrinterConfig(prev => ({ ...prev, printerName: e.target.value }))}
                className="w-full min-h-11 p-2.5 text-sm border border-stone-200 rounded-lg font-mono text-stone-700"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">Ancho Papel</label>
              <select
                value={printerConfig.paperWidth}
                onChange={e => setPrinterConfig(prev => ({ ...prev, paperWidth: e.target.value as '58mm' | '80mm' }))}
                className="w-full min-h-11 p-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50 font-bold"
              >
                <option value="80mm">80 milímetros (Estándar)</option>
                <option value="58mm">58 milímetros (Estrecha)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1">Copias Ticket</label>
              <input 
                type="number" 
                min="1" 
                max="5"
                value={printerConfig.copies}
                onChange={e => setPrinterConfig(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))}
                className="w-full min-h-11 p-2.5 text-sm border border-stone-200 rounded-lg text-stone-700"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input 
                type="checkbox" 
                id="autoCutCheck" 
                checked={printerConfig.autoCut}
                onChange={e => setPrinterConfig(prev => ({ ...prev, autoCut: e.target.checked }))}
                className="w-5 h-5 accent-[#624A3E]"
              />
              <label htmlFor="autoCutCheck" className="text-[10px] font-bold text-stone-600 block cursor-pointer">Corte Automático</label>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input 
                type="checkbox" 
                id="openDrawerCheck" 
                checked={printerConfig.openDrawer}
                onChange={e => setPrinterConfig(prev => ({ ...prev, openDrawer: e.target.checked }))}
                className="w-5 h-5 accent-[#624A3E]"
              />
              <label htmlFor="openDrawerCheck" className="text-[10px] font-bold text-stone-600 block cursor-pointer">Abre Cajón Portamonedas</label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              onClick={() => {
                printerService.saveConfig(printerConfig);
                setShowPrinterSettings(false);
                toast.success('Ajustes de ticketera guardados en el navegador.');
              }}
              className="min-h-10 py-2 px-4 bg-[#624A3E] text-white text-xs font-black uppercase rounded-lg"
            >
              Aplicar Cambios
            </button>
          </div>
        </div>
      )}

      {/* CORE SPLIT SCREEN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* LEFT COLUMN: ACTIVE DRAWER & ACTIVE COMMANDS (LG: Span 4) */}
        <div className="lg:col-span-4 space-y-4 lg:space-y-6">
          
          {/* DAILY DRAWER SHIFT COMPONENT (Rule 1) */}
          <div className="glass-card border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-black text-zinc-400 block tracking-wider">Flujo Contable Diario</span>
                <h3 className="font-extrabold text-white text-sm md:text-base tracking-tight font-sans">Estado de Caja Diaria</h3>
              </div>
              
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 border ${
                cajaSession 
                  ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20 animate-pulse' 
                  : 'bg-zinc-800 text-zinc-400 border-white/5'
              }`}>
                {cajaSession ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                {cajaSession ? 'Abierta' : 'Cerrada'}
              </span>
            </div>

            {/* Display detailed figures inside shift */}
            {cajaSession ? (
              <div className="space-y-2">
                <div className="p-3 bg-zinc-950/45 rounded-xl border border-white/5 font-sans space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-400">
                    <span>Responsable:</span>
                    <span className="text-zinc-100">{cajaSession.usuario_cajero}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs font-semibold text-zinc-400">
                    <span>Apertura:</span>
                    <span className="font-mono text-zinc-105">{cajaSession.fecha_apertura}</span>
                  </div>

                  <div className="flex justify-between text-xs font-semibold text-zinc-400 pt-1 border-t border-white/5">
                    <span>Monto Inicial:</span>
                    <span className="font-mono text-zinc-100">${cajaSession.monto_apertura.toLocaleString('es-AR')}</span>
                  </div>

                  <div className="flex justify-between text-[13px] font-black text-[#E8B800] pt-1 border-t border-white/5">
                    <span>Ventas registradas:</span>
                    <span className="font-mono">${cajaSession.monto_ventas.toLocaleString('es-AR')}</span>
                  </div>

                  {sumIngresosManuales > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-emerald-400">
                      <span>(+) Ingresos Manuales:</span>
                      <span className="font-mono">${sumIngresosManuales.toLocaleString('es-AR')}</span>
                    </div>
                  )}

                  {sumEgresosManuales > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-rose-455">
                      <span>(-) Egresos Manuales:</span>
                      <span className="font-mono">-${sumEgresosManuales.toLocaleString('es-AR')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs font-bold text-white pt-1 font-mono border-t border-white/10 border-dotted">
                    <span>Arqueo Teórico:</span>
                    <span>${cajaEsperadaTotal.toLocaleString('es-AR')}</span>
                  </div>

                  <div className="flex justify-between text-[11px] font-black text-emerald-400 pt-1 border-t border-emerald-500/20">
                    <span>Caja esperada:</span>
                    <span className="font-mono">${cajaEsperadaTotal.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                {/* Turn revenue detailed tags */}
                {cajaSession.registros_totales && (
                  <div className="p-2 bg-zinc-950/60 rounded-xl space-y-1 text-[9px] font-mono text-zinc-400 font-bold border border-white/5">
                    <p className="font-sans text-[8px] text-zinc-500 uppercase tracking-widest block font-black border-b border-white/5 pb-1 mb-1">
                      Desglose cobros en turno
                    </p>
                    <div className="flex justify-between">
                      <span>• EFECTIVO:</span>
                      <span>${cajaSession.registros_totales.efectivo.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• TRANS./DÉBITO:</span>
                      <span>${(cajaSession.registros_totales.debito + cajaSession.registros_totales.transferencia).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• TARJETAS CRÉD:</span>
                      <span>${cajaSession.registros_totales.credito.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• MERCADOPAGO QR:</span>
                      <span>${cajaSession.registros_totales.mercadopago.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      setMovimientoTipo('egreso');
                      setMovimientoMonto('');
                      setMovimientoConcepto('');
                      setShowMovimientoModal(true);
                    }}
                    className="w-full py-2 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 rounded-xl text-[10px] uppercase font-black transition-all cursor-pointer border border-white/10 flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    Movimiento Caja Chica (+/-)
                  </button>

                  <button
                    onClick={() => pdfService.exportShiftClosePDF({
                      ...cajaSession,
                      movimientos_manuales: movimientosCajaChica
                    })}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/5 rounded-xl text-[10px] uppercase font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Reporte X (Parcial PDF)
                  </button>

                  <button
                    onClick={() => {
                      loadCajaState();
                      setClosingPhysicalCashInput('');
                      setClosingObservationsInput('Facturación normal del turno');
                      setShowCloseModal(true);
                    }}
                    className="w-full py-2.5 bg-[#E8B800] hover:bg-[#D4A700] text-black rounded-xl text-[10px] uppercase font-black transition-all cursor-pointer shadow-md glow-yellow border-0 flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Cierre de Turno comercial (Reporte Z)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-dashed border-white/15 text-center bg-zinc-950/40">
                  <span className="text-zinc-400 text-[11px] block font-medium">No se registran turnos fiscales abiertos</span>
                  <span className="text-zinc-400 text-[9px] block font-normal mt-0.5">Es indispensable abrir el turno para facturar a las mesas.</span>
                </div>
                
                <button
                  onClick={() => setShowOpenModal(true)}
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md glow-emerald cursor-pointer uppercase flex items-center justify-center gap-2"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-300" />
                  Abrir Caja Diaria
                </button>
              </div>
            )}
          </div>

          {/* RESUMEN DIARIO CONSOLIDADO */}
          {cajaSession && (
            <div className="glass-card border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h4 className="font-black text-white font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Resumen Diario Consolidado
                </h4>
                <div className="flex gap-1 p-0.5 bg-zinc-950/60 border border-white/5 rounded-lg">
                  <button
                    onClick={() => setActiveSummaryTab('platos')}
                    className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                      activeSummaryTab === 'platos'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    Platos
                  </button>
                  <button
                    onClick={() => setActiveSummaryTab('gastos')}
                    className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                      activeSummaryTab === 'gastos'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    Gastos ({movimientosCajaChica.length})
                  </button>
                </div>
              </div>

              {activeSummaryTab === 'platos' ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {platosConsumidosHoy.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-[10px]">
                      Aún no hay platos cobrados hoy en este turno.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {platosConsumidosHoy.map((plato, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-zinc-800 text-zinc-300 rounded-md px-1.5 py-0.5 text-[9px] font-black">
                              {plato.cantidad}x
                            </span>
                            <span className="font-semibold text-zinc-100">{plato.nombre}</span>
                            {plato.categoria && (
                              <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">
                                ({plato.categoria})
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-zinc-400">
                            ${plato.totalRecaudado.toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {movimientosCajaChica.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-[10px]">
                      No hay movimientos de caja chica registrados hoy.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {movimientosCajaChica.map((mov, idx) => (
                        <div key={idx} className="flex justify-between items-start py-2 text-[11px]">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                mov.tipo === 'ingreso' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`} />
                              <span className="font-black text-zinc-200 capitalize">{mov.concepto || 'Sin concepto'}</span>
                            </div>
                            <span className="text-[9px] text-zinc-500 font-mono">
                              {new Date(mov.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className={`font-mono font-black ${
                            mov.tipo === 'ingreso' ? 'text-emerald-400' : 'text-rose-455'
                          }`}>
                            {mov.tipo === 'ingreso' ? '+' : '-'}${mov.monto.toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ACTIVE UNBILLED COMMANDS LIST (Rule 2) */}
          <div className="glass-card border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h4 className="font-black text-white font-sans tracking-tight text-xs uppercase flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#E8B800]" />
                Comandas en Salón
              </h4>
              <span className="text-[9px] font-bold bg-[#E8B800]/10 text-[#E8B800] border border-white/5 rounded-full px-2 py-0.5 font-mono">
                {activeBills.length} pendientes
              </span>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {activeBills.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-white/10 rounded-xl bg-zinc-950/40">
                  <CheckCircle className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
                  <p className="text-[11px] text-zinc-300 font-black uppercase">¡Todo liquidado!</p>
                  <p className="text-[9px] text-zinc-450 mt-0.5">No hay comandos de mesas pendientes de liquidación.</p>
                </div>
              ) : (
                activeBills.map(b => {
                  const itemsCountSum = b.items.reduce((sum, current) => sum + current.cantidad, 0);
                  const totalPrice = b.items.reduce((sum, item) => {
                    const pm = productosMenu.find(pr => pr.id_producto === item.id_producto);
                    return sum + (pm ? pm.precio_venta * item.cantidad : 0);
                  }, 0);

                  const isSelected = b.id_pedido === selectedPedidoId;
                  const isReady = b.estado_comanda === 'listo' || b.estado_comanda === 'entregado';

                  return (
                    <button
                      key={b.id_pedido}
                      onClick={() => {
                        if (!cajaSession) {
                          toast.error('Tenga a bien abrir primero la caja para proceder con la cuenta.');
                          return;
                        }
                        setSelectedPedidoId(b.id_pedido);
                        setSplitPayerCount(1);
                        setActivePayerIndex(0);
                        setSplitByProducts(false);
                        setSelectedProductsForSplit([]);
                        setMixedPayments([]);
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex justify-between items-center cursor-pointer ${
                        isSelected 
                          ? 'border-[#E8B800] bg-[#E8B800]/10 ring-2 ring-[#E8B800]/10 shadow-md'
                          : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-xs font-sans tracking-tight">{b.numero_mesa}</span>
                          
                          {/* Waiter condition badge mapping */}
                          {isReady ? (
                            <span className="bg-emerald-500/10 text-emerald-450 text-[8px] font-black uppercase px-2 py-0.2 rounded-full border border-emerald-500/20 shrink-0">
                              Servido
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-400 text-[8px] font-black uppercase px-2 py-0.2 rounded-full border border-amber-500/20 shrink-0">
                              Activo
                            </span>
                          )}

                          {b.origen !== 'Mozo' && (
                            <span className="bg-zinc-800 text-zinc-300 text-[8px] font-extrabold px-1 py-0.2 rounded shrink-0 font-mono">
                              {b.origen.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans font-medium">
                          M-#{b.id_pedido} • Mozo: {b.mozo} • {itemsCountSum} ítems
                        </p>
                      </div>

                      <div className="text-right space-y-0.5 shrink-0">
                        <span className="font-mono text-xs font-black text-white block">
                          ${totalPrice.toLocaleString('es-AR')}
                        </span>
                        <span className="text-[9px] text-[#E8B800] uppercase font-black tracking-wide flex items-center gap-0.5 justify-end">
                          <Clock className="w-2.5 h-2.5" /> {b.minutos_transcurridos}m
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {lastFacturas.length > 0 && (
              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Tickets emitidos
                  </span>
                  <span className="text-[9px] font-mono font-bold text-zinc-500">{lastFacturas.length} disponibles</span>
                </div>
                {lastFacturas.map(f => (
                  <div key={f.id_factura} className="p-2 rounded-xl bg-zinc-950/40 border border-white/5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-zinc-200 font-mono truncate">{f.nro_ticket}</p>
                      <p className="text-[9px] text-zinc-400 truncate">{f.cliente} - ${f.total.toLocaleString('es-AR')}</p>
                    </div>
                    <button
                      onClick={() => downloadFacturaHistorialPdf(f)}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[9px] font-black uppercase flex items-center gap-1 shrink-0"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: CORE TERMINAL & RECEIPT PREVIEW (LG: Span 8) */}
        <div className="lg:col-span-8">
          
          {selectedPedido ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 bg-white rounded-2xl p-4 sm:p-6 border border-stone-200 shadow-sm">
              
              {/* TICKET OPTIONS CONTROLS (MD: Span 7) */}
              <div className="md:col-span-7 space-y-4 font-sans">
                
                {/* Header detail selected */}
                <div className="border-b border-white/5 pb-3 flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-[11px] text-[#E8B800] font-black uppercase tracking-wider block">Terminal de Liquidación</span>
                    <h3 className="font-extrabold text-white text-sm md:text-base tracking-tight flex items-center gap-1.5 mt-0.5">
                      Saldando Cuenta: {selectedPedido.numero_mesa} ({selectedPedido.mozo})
                    </h3>
                  </div>

                  <span className="text-[10px] text-zinc-400 font-mono bg-zinc-950/80 border border-white/5 px-2 py-0.5 rounded font-black">
                    Nro Trans: EP-{selectedPedido.id_pedido}
                  </span>
                </div>

                {/* Group categories of order items (Rule 3) */}
                <div className="bg-zinc-950/40 border border-white/5 p-3 sm:p-3.5 rounded-xl space-y-2">
                  {!isAdvancedSplitMode && (
                    <>
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Items del pedido</h4>
                      
                      <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 text-xs sm:text-sm">
                        {(Object.entries(groupedItemsByCategory) as [string, any[]][]).map(([category, items]) => (
                          <div key={category} className="space-y-1">
                            <h5 className="text-[9px] font-black text-[#E8B800] uppercase tracking-wider">
                              ■ {category}
                            </h5>
                            
                            <div className="pl-2 space-y-1">
                              {items.map((it, idx) => {
                                const pm = productosMenu.find(p => p.id_producto === it.id_producto);
                                const unitPrice = pm ? pm.precio_venta : 0;
                                const isProductSelected = selectedProductsForSplit.includes(it.id_producto);

                                return (
                                  <div key={idx} className="flex justify-between items-center text-zinc-300 py-0.5 font-medium">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {/* Item split selection checkbox (Dividir por productos - Rule 3) */}
                                      {splitByProducts && (
                                        <input 
                                          type="checkbox" 
                                          checked={isProductSelected}
                                          onChange={() => {
                                            if (isProductSelected) {
                                              setSelectedProductsForSplit(prev => prev.filter(id => id !== it.id_producto));
                                            } else {
                                              setSelectedProductsForSplit(prev => [...prev, it.id_producto]);
                                            }
                                          }}
                                          className="w-4 h-4 accent-[#E8B800] shrink-0"
                                        />
                                      )}
                                      <span className="truncate">{it.cantidad}x {it.nombre}</span>
                                    </div>
                                    <span className="font-mono text-white shrink-0">
                                      ${(it.cantidad * unitPrice).toLocaleString('es-AR')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Division controls helper line */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2.5 border-t border-white/5 font-sans">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          setSplitByProducts(!splitByProducts);
                          setSelectedProductsForSplit([]);
                          resetAdvancedSplit();
                        }}
                        className="text-[10px] font-extrabold uppercase text-zinc-300 hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Users className="w-3 h-3" />
                        {splitByProducts ? 'Quitar selector por producto' : 'Dividir o seleccionar ítems indiv.'}
                      </button>

                      <button
                        onClick={() => {
                          if (isAdvancedSplitMode) {
                            resetAdvancedSplit();
                          } else {
                            initAdvancedSplit(2);
                            setSplitByProducts(false);
                            setSelectedProductsForSplit([]);
                          }
                        }}
                        className="text-[10px] font-extrabold uppercase text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Users className="w-3 h-3 text-amber-400" />
                        {isAdvancedSplitMode ? 'Quitar División Avanzada' : 'División Avanzada por Personas / Fracciones'}
                      </button>
                    </div>
                    {splitByProducts && (
                      <span className="text-[8px] bg-amber-500/10 text-amber-400 font-extrabold uppercase px-1.5 py-0.5 rounded border border-amber-500/20">
                        Cuenta Fraccionada por Productos
                      </span>
                    )}
                    {isAdvancedSplitMode && (
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-extrabold uppercase px-1.5 py-0.5 rounded border border-emerald-500/20">
                        División Avanzada Activa
                      </span>
                    )}
                  </div>
                </div>

                {isAdvancedSplitMode ? (
                  <div className="space-y-4 font-sans animate-fadeIn text-left">
                    {/* Header/Control comensales */}
                    <div className="bg-[#624A3E]/10 border border-[#624A3E]/20 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="text-xs font-black text-[#E8B800] uppercase tracking-widest">División de Cuenta Avanzada</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Asigna porciones de ítems, propinas y cobra por separado.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold">Comensales:</span>
                        <div className="flex bg-zinc-950 border border-white/10 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              const nextCount = Math.max(1, advancedPartitions.length - 1);
                              initAdvancedSplit(nextCount);
                            }}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 rounded text-xs font-bold text-white cursor-pointer active:scale-95 border border-white/5"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-mono font-bold text-xs text-white">{advancedPartitions.length}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextCount = advancedPartitions.length + 1;
                              initAdvancedSplit(nextCount);
                            }}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 rounded text-xs font-bold text-white cursor-pointer active:scale-95 border border-white/5"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Distribuidor de Ítems */}
                    <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h5 className="text-[10px] font-black text-white uppercase tracking-wider">Asignación y Fraccionamiento de Platos</h5>
                        <span className="text-[9px] text-[#E8B800] font-black uppercase bg-[#E8B800]/10 px-1.5 py-0.5 rounded border border-[#E8B800]/20">
                          Total Mesa: ${(orderBreakdowns.finalTotal || 0).toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                        {selectedPedido.items.map((item) => {
                          const pm = productosMenu.find(p => p.id_producto === item.id_producto);
                          const price = item.precio_unitario ?? pm?.precio_venta ?? 0;
                          
                          const totalAssigned = advancedPartitions.reduce((sum, p) => {
                            const pItem = p.items.find(pi => pi.id_producto === item.id_producto);
                            return sum + (pItem ? pItem.cantidad : 0);
                          }, 0);

                          const unassigned = Number((item.cantidad - totalAssigned).toFixed(2));
                          const isFullyAssigned = Math.abs(unassigned) < 0.01;

                          return (
                            <div key={item.id_producto} className="bg-zinc-900/60 p-3 rounded-lg border border-white/5 space-y-2 text-left">
                              <div className="flex justify-between items-start text-xs font-bold">
                                <div>
                                  <span className="text-zinc-200">{item.cantidad}x {item.nombre}</span>
                                  <span className="text-[10px] text-zinc-400 block font-normal">Precio Unitario: ${price.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="text-right">
                                  {isFullyAssigned ? (
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded uppercase font-black">Asignado</span>
                                  ) : (
                                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded uppercase font-black">
                                      Faltan {unassigned} por asignar
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Comensales Assign Rows */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 border-t border-white/5">
                                {advancedPartitions.map((p) => {
                                  const pItem = p.items.find(pi => pi.id_producto === item.id_producto);
                                  const currentQty = pItem ? pItem.cantidad : 0;
                                  
                                  return (
                                    <div key={p.id} className="flex justify-between items-center text-[11px] bg-zinc-950 p-2 rounded border border-white/5">
                                      <span className="text-zinc-300 font-bold truncate max-w-[85px]">{p.nombre}:</span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={p.pagado || currentQty <= 0}
                                          onClick={() => {
                                            const nextQty = Number((currentQty - 0.25).toFixed(2));
                                            updatePartitionItem(p.id, item.id_producto, Math.max(0, nextQty));
                                          }}
                                          className="w-6 h-6 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded font-bold flex items-center justify-center cursor-pointer border border-white/5"
                                        >
                                          -
                                        </button>
                                        <span className="font-mono text-white text-xs font-black px-1">{currentQty}</span>
                                        <button
                                          type="button"
                                          disabled={p.pagado || isFullyAssigned}
                                          onClick={() => {
                                            const nextQty = Number((currentQty + 0.25).toFixed(2));
                                            updatePartitionItem(p.id, item.id_producto, nextQty);
                                          }}
                                          className="w-6 h-6 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded font-bold flex items-center justify-center cursor-pointer border border-white/5"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Quick split shortcuts */}
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  disabled={advancedPartitions.some(p => p.pagado)}
                                  onClick={() => {
                                    advancedPartitions.forEach((p, idx) => {
                                      let qty = Number((item.cantidad / advancedPartitions.length).toFixed(2));
                                      if (idx === advancedPartitions.length - 1) {
                                        const assignedSoFar = Number((Number((item.cantidad / advancedPartitions.length).toFixed(2)) * (advancedPartitions.length - 1)).toFixed(2));
                                        qty = Number((item.cantidad - assignedSoFar).toFixed(2));
                                      }
                                      updatePartitionItem(p.id, item.id_producto, qty);
                                    });
                                  }}
                                  className="text-[9px] uppercase font-black text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  Dividir Equitativamente
                                </button>
                                <button
                                  type="button"
                                  disabled={advancedPartitions.some(p => p.pagado)}
                                  onClick={() => {
                                    advancedPartitions.forEach(p => {
                                      updatePartitionItem(p.id, item.id_producto, 0);
                                    });
                                  }}
                                  className="text-[9px] uppercase font-black text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                >
                                  Limpiar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grilla de Participantes */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-[#E8B800] uppercase tracking-widest text-left">Liquidación por Comensal</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {advancedPartitions.map((p) => {
                          const breakdowns = getPartitionBreakdown(p);
                          
                          let cashChange = 0;
                          if (p.metodoPago === 'efectivo' && p.montoEntregadoEfectivo) {
                            const delivered = parseFloat(p.montoEntregadoEfectivo);
                            if (!isNaN(delivered)) {
                              cashChange = Math.max(0, delivered - breakdowns.finalTotal);
                            }
                          }

                          return (
                            <div key={p.id} className={`p-4 rounded-xl border flex flex-col justify-between space-y-3.5 text-left ${
                              p.pagado 
                                ? 'bg-emerald-950/20 border-emerald-500/25' 
                                : 'bg-zinc-950/40 border-white/5'
                            }`}>
                              {/* Person Header */}
                              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <input
                                  type="text"
                                  disabled={p.pagado}
                                  value={p.nombre}
                                  onChange={(e) => updatePartitionPayment(p.id, 'nombre', e.target.value)}
                                  className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-[#E8B800] text-xs font-black text-white focus:outline-none py-0.5 max-w-[120px] transition-colors"
                                  placeholder="Nombre comensal"
                                />
                                {p.pagado ? (
                                  <span className="text-[8px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black uppercase">
                                    Pagado ✓
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-black uppercase">
                                    Pendiente
                                  </span>
                                )}
                              </div>

                              {/* Items allocated list */}
                              <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                                {p.items.filter(it => it.cantidad > 0).map((it, idx) => (
                                  <div key={idx} className="flex justify-between text-[10px] text-zinc-300 font-mono">
                                    <span className="font-sans">{it.cantidad}x {it.nombre}</span>
                                    <span>${(it.cantidad * it.precio_unitario).toLocaleString('es-AR')}</span>
                                  </div>
                                ))}
                                {p.items.filter(it => it.cantidad > 0).length === 0 && (
                                  <p className="text-[10px] text-zinc-500 italic">Sin platos asignados aún</p>
                                )}
                              </div>

                              {/* Total breakdown */}
                              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-white/5 text-[10px] space-y-1">
                                <div className="flex justify-between text-zinc-400">
                                  <span>Subtotal:</span>
                                  <span className="font-mono">${breakdowns.subtotal.toLocaleString('es-AR')}</span>
                                </div>
                                {(breakdowns.promoDeduction + breakdowns.manualDeduction + breakdowns.couponDeduction) > 0 && (
                                  <div className="flex justify-between text-rose-450">
                                    <span>Bonif. Proporcional:</span>
                                    <span className="font-mono">-${(breakdowns.promoDeduction + breakdowns.manualDeduction + breakdowns.couponDeduction).toLocaleString('es-AR')}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-zinc-400">
                                  <span>Propina ({propinaPorcentaje}%):</span>
                                  <span className="font-mono">${breakdowns.propinaValue.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between text-white font-black border-t border-white/5 pt-1 text-xs">
                                  <span>Total a pagar:</span>
                                  <span className="font-mono text-[#E8B800]">${breakdowns.finalTotal.toLocaleString('es-AR', { maximumFractionDigits: 1 })}</span>
                                </div>
                              </div>

                              {/* Payment method */}
                              {!p.pagado && breakdowns.finalTotal > 0 && (
                                <div className="space-y-2 pt-1">
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                      { key: 'efectivo', label: 'Efe', icon: '💵' },
                                      { key: 'tarjeta', label: 'Tarj', icon: '💳' },
                                      { key: 'transferencia', label: 'Trans', icon: '🏦' },
                                      { key: 'mp_qr', label: 'QR', icon: '📱' }
                                    ].map(m => (
                                      <button
                                        key={m.key}
                                        type="button"
                                        onClick={() => updatePartitionPayment(p.id, 'metodoPago', m.key as any)}
                                        className={`py-1 px-1.5 rounded text-[9px] font-black flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                                          p.metodoPago === m.key
                                            ? 'bg-[#E8B800] text-zinc-950 border-[#E8B800]'
                                            : 'bg-zinc-900 border-white/15 text-zinc-300 hover:bg-zinc-800'
                                        }`}
                                      >
                                        <span>{m.icon}</span>
                                        <span>{m.label}</span>
                                      </button>
                                    ))}
                                  </div>

                                  {/* Cash input helper */}
                                  {p.metodoPago === 'efectivo' && (
                                    <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded border border-white/5">
                                      <input
                                        type="number"
                                        value={p.montoEntregadoEfectivo}
                                        onChange={(e) => updatePartitionPayment(p.id, 'montoEntregadoEfectivo', e.target.value)}
                                        placeholder="Paga con..."
                                        className="bg-transparent text-[10px] text-white font-mono focus:outline-none w-full"
                                      />
                                      {cashChange > 0 && (
                                        <span className="text-[9px] text-[#22C55E] font-black shrink-0 font-mono">Vuelto: ${cashChange.toLocaleString('es-AR')}</span>
                                      )}
                                    </div>
                                  )}

                                  {/* Charge action */}
                                  <button
                                    type="button"
                                    onClick={() => processPartitionPayment(p.id)}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                                  >
                                    Cobrar Parte (${breakdowns.finalTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })})
                                  </button>
                                </div>
                              )}

                              {p.pagado && (
                                <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/20 text-center font-mono text-[9px] text-zinc-300">
                                  Ticket Nº: {p.ticketNo}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Back Button */}
                    <button
                      type="button"
                      onClick={resetAdvancedSplit}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-black uppercase rounded-lg border border-white/10 transition-colors cursor-pointer"
                    >
                      ← Volver a Cobro Consolidado
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Automated Promotions Detector flag box */}
                    {((selectedPedido.items.some(it => it.id_producto === 'prod_car_ojo_bife' || it.id_producto === 'prod_bife') && selectedPedido.items.some(it => it.id_producto === 'prod_vino_malbec' || it.id_producto === 'prod_vino_rutini_botella')) || 
                     (selectedPedido.items.some(it => it.id_producto === 'prod_cri_hamburguesa' || it.id_producto === 'prod_hamburguesa') && selectedPedido.items.some(it => it.id_insumo === 'ins_beb_gaseosa' || it.id_producto === 'prod_gaseosa'))) && (
                      <div className="bg-emerald-550/10 border border-emerald-500/20 p-3 rounded-lg flex items-start gap-2 text-emerald-400">
                        <Percent className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div className="text-[10px] font-sans">
                          <p className="font-bold uppercase tracking-wide">Promoción automática calificada</p>
                          <p className="text-zinc-400 font-normal mt-0.5 leading-snug">Se han deducido $1.500 (Combo burger + lata) y/o el 15% del vino (Combo Ojo de bife + Vino) por compras cruzadas.</p>
                        </div>
                      </div>
                    )}

                {/* CLIENT & AFIP TYPE SYSTEM */}
                <div className="bg-zinc-950/40 border border-white/5 p-3 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Información Tributaria</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Tipo de Factura</label>
                      <select
                        value={tipoComprobante}
                        onChange={e => setTipoComprobante(e.target.value as TipoComprobante)}
                        className="w-full min-h-11 text-sm p-2 bg-zinc-950 border border-white/10 rounded text-zinc-105 font-bold focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                      >
                        <option value="factura_b" className="bg-zinc-950 text-zinc-100">Factura B (Cons. Final)</option>
                        <option value="factura_a" className="bg-zinc-950 text-zinc-100">Factura A (Inscripto)</option>
                        <option value="ticket_interno" className="bg-zinc-950 text-zinc-100">Ticket Interno (Mesa)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">DNI/CUIT Cliente</label>
                      <input 
                        type="text" 
                        value={cuitCliente}
                        onChange={e => {
                          const val = e.target.value;
                          setCuitCliente(val);
                          if (val === '99-99999999-9' || val === '') {
                            setNombreCliente('Consumidor Final');
                          }
                        }}
                        className="w-full min-h-11 text-sm p-2 bg-zinc-950 border border-white/10 rounded text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                        placeholder="Ej. 20-38449102-1"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Razón Social Cliente</label>
                      <input 
                        type="text" 
                        value={nombreCliente}
                        onChange={e => setNombreCliente(e.target.value)}
                        className="w-full min-h-11 text-sm p-2 bg-zinc-950 border border-white/10 rounded text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                        placeholder="Ej. José de San Martín"
                      />
                    </div>
                  </div>
                </div>

                {/* FIDELIZACION Y CLUB EL PATRON */}
                <div className="bg-zinc-950/40 border border-white/5 p-3 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#E8B800]" /> Fidelización de Clientes (Club Pizzería Colores)
                  </h4>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={dniCuitBuscar}
                      onChange={e => setDniCuitBuscar(e.target.value)}
                      placeholder="Buscar DNI/CUIT de cliente"
                      className="flex-1 min-h-11 text-sm p-2 bg-zinc-950 border border-white/10 rounded text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30 placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={handleBuscarCliente}
                      className="px-4 min-h-11 bg-[#E8B800] hover:bg-[#D4A700] text-zinc-950 text-xs font-black rounded-lg cursor-pointer transition-colors active:scale-95 btn-premium"
                    >
                      Buscar
                    </button>
                  </div>
                  {selectedCliente ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-emerald-400">{selectedCliente.nombre}</p>
                            {(() => {
                              const lvl = selectedCliente.puntos >= 500 ? { l: 'Oro', c: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', s: '⭐' } :
                                          selectedCliente.puntos >= 105 ? { l: 'Plata', c: 'bg-zinc-800 text-zinc-300 border-zinc-700', s: '🥈' } :
                                          { l: 'Bronce', c: 'bg-amber-700/25 text-amber-400 border-amber-600/30', s: '🥉' };
                              return (
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border ${lvl.c}`} title={`Nivel ${lvl.l}`}>
                                  {lvl.s} {lvl.l}
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono">{selectedCliente.dni_cuit}</p>
                          <p className="text-[10px] text-[#E8B800] font-bold mt-0.5">
                            Puntos Disponibles: {selectedCliente.puntos} (ARS ${(selectedCliente.puntos * 10).toLocaleString('es-AR')} de descuento)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCliente(null);
                            setPuntosRedimidos(0);
                            setDniCuitBuscar('');
                          }}
                          className="text-zinc-400 hover:text-zinc-200 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Deseleccionar
                        </button>
                      </div>

                      {/* Historial simulado */}
                      <div className="bg-zinc-950/50 p-2 rounded-lg border border-emerald-500/10 text-[9px] text-zinc-300 space-y-1">
                        <span className="font-bold uppercase text-[8px] text-zinc-500 block">Historial de Fidelización</span>
                        <div className="flex justify-between font-mono">
                          <span>• Alta de Cliente</span>
                          <span className="text-emerald-400 font-bold">+0 ptos</span>
                        </div>
                        {selectedCliente.puntos > 0 && (
                          <div className="flex justify-between font-mono">
                            <span>• Consumos Acumulados</span>
                            <span className="text-emerald-400 font-bold">+{selectedCliente.puntos} ptos</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 pt-1.5 border-t border-white/5">
                        {selectedCliente.puntos > 0 && (
                          <div className="flex items-center gap-2">
                            <label className="text-[9px] font-bold text-zinc-350 uppercase">Canjear Puntos:</label>
                            <input 
                              type="number"
                              min="0"
                              max={Math.min(selectedCliente.puntos, Math.floor((orderBreakdowns.finalTotal + (puntosRedimidos * 10)) / 10))}
                              value={puntosRedimidos || ''}
                              onChange={e => {
                                const pts = Math.max(0, parseInt(e.target.value) || 0);
                                const limit = Math.min(selectedCliente.puntos, Math.floor((orderBreakdowns.finalTotal + (puntosRedimidos * 10)) / 10));
                                if (pts > limit) {
                                  setPuntosRedimidos(limit);
                                  toast.warning(`El límite de canje para esta cuenta es de ${limit} puntos.`);
                                } else {
                                  setPuntosRedimidos(pts);
                                }
                              }}
                              className="w-16 p-1 bg-zinc-950 border border-white/10 rounded font-mono text-xs text-zinc-100 text-center focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                            />
                            <span className="text-[9px] text-zinc-400 font-bold">1 pt = $10 descuento</span>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (puntosRedimidos <= 0) {
                                toast.warning('Debe canjear por lo menos 1 punto para generar un voucher de recompensa.');
                              } else {
                                setShowVoucherModal(true);
                              }
                            }}
                            className="flex-1 py-1.5 bg-[#E8B800] hover:bg-[#D4A700] text-zinc-950 text-[9px] font-black uppercase rounded flex items-center justify-center gap-1 cursor-pointer transition-colors border-0 btn-premium active:scale-95"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Generar Voucher QR
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : dniCuitBuscar.trim() !== '' && (
                    <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-lg space-y-2">
                      <p className="text-[10px] text-zinc-400 font-bold italic">Cliente no registrado. Registrar comensal:</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input 
                          type="text" 
                          placeholder="Nombre Completo"
                          value={nombreNuevoCliente}
                          onChange={e => setNombreNuevoCliente(e.target.value)}
                          className="p-1.5 bg-zinc-950 border border-white/10 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                        />
                        <input 
                          type="email" 
                          placeholder="Email"
                          value={emailNuevoCliente}
                          onChange={e => setEmailNuevoCliente(e.target.value)}
                          className="p-1.5 bg-zinc-950 border border-white/10 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                        />
                        <input 
                          type="text" 
                          placeholder="Teléfono"
                          value={telNuevoCliente}
                          onChange={e => setTelNuevoCliente(e.target.value)}
                          className="p-1.5 bg-zinc-950 border border-white/10 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleRegistrarCliente}
                        className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase rounded transition-colors cursor-pointer btn-premium active:scale-95"
                      >
                        Registrar y Seleccionar Cliente
                      </button>
                    </div>
                  )}
                </div>

                {/* Standard split comensales (Rule 3) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl space-y-2">
                    <h5 className="text-[10px] font-black text-zinc-350 flex items-center gap-1 uppercase tracking-wider">
                      <Users className="w-3.5 h-3.5 text-[#E8B800]" /> Partes Comensales (Partes Iguales)
                    </h5>
                    
                    <div className="flex items-center justify-between gap-2 bg-zinc-950 border border-white/10 p-1.5 rounded-lg">
                      <button
                        onClick={() => {
                          setSplitPayerCount(prev => Math.max(1, prev - 1));
                          setActivePayerIndex(0);
                        }}
                        className="touch-target w-9 h-9 bg-zinc-900 hover:bg-zinc-800 rounded text-zinc-100 font-bold flex items-center justify-center cursor-pointer active:scale-90 border border-white/5"
                      >
                        -
                      </button>
                      <span className="text-sm font-mono font-black text-zinc-100">{splitPayerCount} pax</span>
                      <button
                        onClick={() => {
                          setSplitPayerCount(prev => prev + 1);
                          setActivePayerIndex(0);
                        }}
                        className="touch-target w-9 h-9 bg-zinc-900 hover:bg-zinc-800 rounded text-zinc-100 font-bold flex items-center justify-center cursor-pointer active:scale-90 border border-white/5"
                      >
                        +
                      </button>
                    </div>

                    {splitPayerCount > 1 && (
                      <div className="text-[10px] sm:text-xs text-zinc-300 leading-normal bg-zinc-950/60 p-2 rounded border border-white/5 space-y-0.5 text-center">
                        <p className="font-bold text-zinc-400">Monto partes iguales:</p>
                        <p className="text-[#22C55E] text-sm font-black font-mono">
                          ${(orderBreakdowns.finalTotal / splitPayerCount).toLocaleString('es-AR', { maximumFractionDigits: 1 })} c/u
                        </p>
                        <span className="bg-[#E8B800]/10 text-[#E8B800] px-1.5 py-0.5 rounded font-extrabold text-[9px] tracking-wider uppercase inline-block border border-[#E8B800]/20">
                          Pagador Actual: {activePayerIndex + 1} de {splitPayerCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Manual discounts & tip adjustments (Rule 3) */}
                  <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl space-y-2.5">
                    <h5 className="text-[10px] font-black text-zinc-350 flex items-center gap-1 uppercase tracking-wider">
                      <Percent className="w-3.5 h-3.5 text-[#E8B800]" /> Bonificación & Propinas
                    </h5>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 block uppercase">Tipo de Descuento</label>
                      <div className="flex gap-1 p-0.5 bg-zinc-950 border border-white/10 rounded-lg w-full">
                        <button
                          type="button"
                          onClick={() => {
                            setTipoDescuento('porcentaje');
                            setDescuentoMonto(0);
                          }}
                          className={`flex-1 py-1 text-[9px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                            tipoDescuento === 'porcentaje'
                              ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                              : 'text-zinc-550 hover:text-zinc-300'
                          }`}
                        >
                          % Porcentaje
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTipoDescuento('monto');
                            setDescuentoPorcentaje(0);
                          }}
                          className={`flex-1 py-1 text-[9px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                            tipoDescuento === 'monto'
                              ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                              : 'text-zinc-550 hover:text-zinc-300'
                          }`}
                        >
                          $ Monto Fijo
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        {tipoDescuento === 'porcentaje' ? (
                          <>
                            <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Descuento (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={descuentoPorcentaje || ''}
                              onChange={e => {
                                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                setDescuentoPorcentaje(val);
                              }}
                              className="w-full min-h-11 text-sm p-2 bg-zinc-950 border border-white/10 rounded font-mono text-center font-bold text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                              placeholder="Ej. 10"
                            />
                          </>
                        ) : (
                          <>
                            <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Descuento ($)</label>
                            <input
                              type="number"
                              min="0"
                              max={Math.max(0, orderBreakdowns.subtotal - orderBreakdowns.promoDeduction)}
                              value={descuentoMonto || ''}
                              onChange={e => {
                                const maxMonto = Math.max(0, orderBreakdowns.subtotal - orderBreakdowns.promoDeduction);
                                const val = Math.min(maxMonto, Math.max(0, parseFloat(e.target.value) || 0));
                                setDescuentoMonto(val);
                              }}
                              className="w-full min-h-11 text-sm p-2 bg-zinc-950 border border-white/10 rounded font-mono text-center font-bold text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                              placeholder="Monto $"
                            />
                          </>
                        )}
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Propina %</label>
                        <select
                          value={propinaPorcentaje}
                          onChange={e => setPropinaPorcentaje(parseInt(e.target.value) || 0)}
                          className="w-full min-h-11 text-sm p-2 bg-zinc-950 border border-white/10 rounded font-bold text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                        >
                          <option value="0" className="bg-zinc-950 text-zinc-100">0%</option>
                          <option value="5" className="bg-zinc-950 text-zinc-100">5%</option>
                          <option value="10" className="bg-zinc-950 text-zinc-100">10% (Rec.)</option>
                          <option value="15" className="bg-zinc-950 text-zinc-100">15%</option>
                          <option value="20" className="bg-zinc-950 text-zinc-100">20%</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coupon discount codes panel (Area 3) */}
                <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl space-y-2.5 font-sans">
                  <h5 className="text-[10px] font-black text-zinc-350 flex items-center gap-1 uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5 text-[#E8B800]" /> Cuponera & Promociones
                  </h5>
                  {appliedCoupon ? (
                    <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-emerald-400 font-sans">Cupón Activo: {appliedCoupon.code}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          Descuento: {appliedCoupon.type === 'porcentaje' ? `${appliedCoupon.value}%` : `$${appliedCoupon.value}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-rose-400 hover:text-rose-300 text-xs font-black transition-colors cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ingresar código de cupón"
                          value={couponInput}
                          onChange={e => setCouponInput(e.target.value)}
                          className="flex-1 min-h-11 text-xs p-2.5 bg-zinc-950 border border-white/10 rounded-xl text-zinc-100 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30 placeholder-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="px-4 min-h-11 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-100 text-xs font-black rounded-xl cursor-pointer transition-colors active:scale-95"
                        >
                          Aplicar
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[10px] text-rose-400 font-semibold">{couponError}</p>
                      )}
                      <p className="text-[9px] text-zinc-500 leading-relaxed">
                        Probá con: <span className="font-mono text-zinc-400 font-bold">PROMO10</span> (10%), <span className="font-mono text-zinc-400 font-bold">BIENVENIDA</span> ($500), <span className="font-mono text-zinc-400 font-bold">PIZZALOVER</span> (15%).
                      </p>
                    </div>
                  )}
                </div>

                {/* PAYMENT TYPE / MIXED PAYMENTS LAYOUT (Rule 4) */}
                <div className="bg-zinc-950/40 border border-white/5 p-3 sm:p-4 rounded-xl space-y-3.5">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">
                      Método de Liquidación Caja
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { key: 'efectivo', label: 'Efectivo', icon: <Coins className="w-3.5 h-3.5" /> },
                        { key: 'tarjeta', label: 'Tarjeta Crédito', icon: <CreditCard className="w-3.5 h-3.5" /> },
                        { key: 'transferencia', label: 'Transferencia/Deb.', icon: <Coins className="w-3.5 h-3.5" /> },
                        { key: 'mp_qr', label: 'MercadoPago QR', icon: <Smartphone className="w-3.5 h-3.5" /> },
                        { key: 'mixto', label: 'Pago Mixto (Varios)', icon: <TrendingUp className="w-3.5 h-3.5" /> }
                      ].map(m => (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => {
                            setMetodoPago(m.key as any);
                            setMixedPayments([]);
                            setMontoEntregadoEfectivo('');
                          }}
                          className={`min-h-11 py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-start gap-2 border transition-all cursor-pointer ${
                            metodoPago === m.key 
                              ? 'bg-[#E8B800] text-zinc-950 border-[#E8B800] shadow-sm'
                              : 'bg-zinc-900 border-white/10 text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {m.icon}
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Fields for Payment Method details */}
                  {metodoPago === 'efectivo' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-[#E8B800] block uppercase">Monto Entregado en Efectivo</label>
                        <p className="text-[10px] text-zinc-400 font-medium">Ayuda vuelto rápido cajero</p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <input 
                          type="number"
                          inputMode="decimal"
                          value={montoEntregadoEfectivo}
                          onChange={e => setMontoEntregadoEfectivo(e.target.value)}
                          placeholder="Monto entregado"
                          className="min-h-11 p-2 bg-zinc-950 border border-white/10 rounded-lg text-sm font-mono font-black text-zinc-100 w-full sm:w-28 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30 placeholder-zinc-500"
                        />
                        {calculatedChange > 0 && (
                          <div className="text-right pl-2 border-l border-white/10">
                            <span className="text-[8px] text-zinc-400 block font-bold uppercase">Entregar Vuelto</span>
                            <span className="text-[11px] text-[#22C55E] font-black font-mono">
                              ${calculatedChange.toLocaleString('es-AR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mixed Payment Rows interface */}
                  {metodoPago === 'mixto' && (
                    <div className="space-y-3.5 bg-zinc-950/60 p-3 sm:p-3.5 rounded-xl border border-white/10">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-black uppercase text-zinc-400 border-b border-white/5 pb-1 gap-1">
                        <span>Pagos Cargados parcialmente</span>
                        <span className="font-mono text-[#E8B800]">
                          Total: ${mixedSum.toLocaleString('es-AR')} / ${orderBreakdowns.finalTotal.toLocaleString('es-AR')}
                        </span>
                      </div>

                      {mixedPayments.length > 0 ? (
                        <div className="space-y-1">
                          {mixedPayments.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-zinc-900 border border-white/5 p-2 rounded-lg text-xs sm:text-sm font-bold text-zinc-200">
                              <span className="uppercase flex items-center gap-1">
                                <ChevronRight className="w-3.5 h-3.5 text-[#E8B800]" /> {p.metodo}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-zinc-100">${p.monto.toLocaleString('es-AR')}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMixedPayment(idx)}
                                  className="touch-target w-8 h-8 text-zinc-400 hover:text-rose-450 transition-colors cursor-pointer flex items-center justify-center"
                                  title="Borrar pago parcial"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-500 text-center italic">No hay pagos parciales ingresados. Introduzca por lo menos dos a continuación.</p>
                      )}

                      {/* Add partial form */}
                      {rawRemainingMixedBalance > 0 ? (
                        <form onSubmit={handleAddMixedPayment} className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={mixedMetodoInput}
                            onChange={e => setMixedMetodoInput(e.target.value)}
                            className="min-h-11 bg-zinc-950 border border-white/10 text-sm p-2 rounded-lg text-zinc-105 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                          >
                            <option value="efectivo" className="bg-zinc-950 text-zinc-100">Efectivo</option>
                            <option value="tarjeta" className="bg-zinc-950 text-zinc-100">Tarjeta Crédito</option>
                            <option value="transferencia" className="bg-zinc-950 text-zinc-100">Transferencia/Deb.</option>
                            <option value="mp_qr" className="bg-zinc-950 text-zinc-100">MercadoPago QR</option>
                          </select>

                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="Monto"
                            value={mixedMontoInput}
                            onChange={e => {
                              setMixedMontoInput(e.target.value);
                              if (mixedMetodoInput === 'efectivo') {
                                  setMontoEntregadoEfectivo(e.target.value);
                              }
                            }}
                            className="min-h-11 flex-1 bg-zinc-950 border border-white/10 p-2 text-sm rounded-lg font-mono font-bold text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30 placeholder-zinc-500"
                          />

                          <button
                            type="submit"
                            className="min-h-11 py-2 px-3 bg-zinc-800 text-white text-xs font-black rounded-lg cursor-pointer flex items-center justify-center gap-1 shrink-0 hover:bg-zinc-700 transition-colors btn-premium"
                          >
                            <Plus className="w-3.5 h-3.5" /> Agregar
                          </button>
                        </form>
                      ) : (
                        <div className="bg-emerald-500/10 text-emerald-450 text-[10px] p-2 text-center rounded border border-emerald-500/20 font-bold">
                          ✓ Saldo completado. Puede finalizar la transacción de cobro.
                        </div>
                      )}

                      {/* Cash change for mixed cash payments */}
                      {mixedPayments.some(p => p.metodo === 'efectivo') && (
                        <div className="bg-zinc-950 p-2.5 rounded-lg border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-2">
                          <span className="text-zinc-400 font-bold block uppercase text-[10px]">Arqueo Cambio Extra (Efectivo Mixto)</span>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input 
                              type="number" 
                              inputMode="decimal"
                              value={montoEntregadoEfectivo}
                              onChange={e => setMontoEntregadoEfectivo(e.target.value)}
                              placeholder="Monto entregado"
                              className="min-h-11 p-1.5 bg-zinc-950 border border-white/10 rounded text-sm text-zinc-100 font-mono w-full sm:w-24 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30 placeholder-zinc-500"
                            />
                            {calculatedChange > 0 && (
                              <span className="text-[#22C55E] font-black">${calculatedChange.toLocaleString('es-AR')}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* EMISSION ACTIONS BAR */}
                <div className="space-y-2">
                  {splitPayerCount > 1 ? (
                    <button
                      onClick={async () => {
                        toast.success(`Cobro de la parte #${activePayerIndex + 1} procesado por ${(orderBreakdowns.finalTotal / splitPayerCount).toLocaleString('es-AR')}`);
                        if (activePayerIndex + 1 >= splitPayerCount) {
                          await handleConfirmCheckout();
                        } else {
                          setActivePayerIndex(prev => prev + 1);
                        }
                      }}
                      className="w-full min-h-11 py-3 bg-[#22C55E] hover:bg-[#16a34a] text-[#1A1A1A] text-sm uppercase tracking-wider font-extrabold rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-2 btn-premium glow-emerald"
                    >
                      <CheckCircle className="w-5 h-5 text-[#1A1A1A]" />
                      Cobrar Parte #{activePayerIndex + 1} de {splitPayerCount} (${(orderBreakdowns.finalTotal / splitPayerCount).toLocaleString('es-AR', { maximumFractionDigits: 1 })})
                    </button>
                  ) : (
                    <button
                      onClick={handleConfirmCheckout}
                      className="w-full min-h-11 py-3 bg-[#E8B800] hover:bg-[#D4A700] text-zinc-950 text-sm uppercase tracking-wider font-extrabold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 btn-premium glow-yellow"
                    >
                      <CheckCircle className="w-5 h-5 text-zinc-950" />
                      Cobrar y Emitir Comprobante (${orderBreakdowns.finalTotal.toLocaleString('es-AR')} {restaurante.moneda})
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={triggerPDFDownloadOnly}
                      className="min-h-10 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-[10px] uppercase font-extrabold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar PDF
                    </button>
                    
                    <button
                      onClick={triggerManualPrint}
                      className="min-h-10 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-[10px] uppercase font-extrabold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir Ticket
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPedidoId(null);
                      setSplitPayerCount(1);
                      setActivePayerIndex(0);
                    }}
                    className="w-full min-h-10 text-center py-2 text-zinc-400 hover:text-zinc-200 text-xs uppercase font-extrabold cursor-pointer transition-colors"
                  >
                    ← Volver a Comandas
                  </button>
                </div>
              </>
            )}
          </div>

              {/* EPSON TICKET PREVIEW SIMULATOR (MD: Span 5) */}
              <div className="md:col-span-5 bg-zinc-950/40 border border-white/5 p-3 sm:p-4 rounded-xl flex flex-col items-center justify-start">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5" /> Simulación Salida Térmica (80mm)
                </span>

                <div className="w-full bg-white text-zinc-950 p-3 sm:p-4 shadow-sm font-mono text-[9px] sm:text-[10px] leading-relaxed border border-stone-200 relative">
                  
                  <div className="absolute top-0 inset-x-0 h-1 bg-stone-300 flex overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 shrink-0 bg-stone-250 rotate-45 transform -translate-y-0.5 border border-stone-250" />
                    ))}
                  </div>

                  <div className="text-center pt-2.5 pb-1 border-b border-dotted border-stone-300 space-y-0.5">
                    <ElPatronLogo className="w-10 h-10 mx-auto mb-1.5" />
                    <span className="font-bold text-[10px] sm:text-xs block uppercase tracking-tight">{restaurante.nombreComercial}</span>
                    <span className="block text-[8px] sm:text-[9px] text-stone-600">Raz. Soc: {restaurante.razonSocial}</span>
                    <span className="block text-[8px] sm:text-[9px] text-stone-600">CUIT: {restaurante.cuit}</span>
                    <span className="block text-[8px] sm:text-[9px] text-stone-600">{restaurante.direccion}</span>
                    <span className="block text-[8px] sm:text-[9px] text-stone-600">Telf: {restaurante.telefono}</span>
                  </div>

                  <div className="py-2 border-b border-dotted border-stone-300 space-y-0.5 text-[8.5px] sm:text-[9px]">
                    <p>COMPROB.: {tipoComprobante === 'factura_b' ? 'FACTURA B-CONS. FINAL' : (tipoComprobante === 'factura_a' ? 'FACTURA A-RESP. INS.' : 'TICKET INTERNO')}</p>
                    <p>CLIENTE: {nombreCliente.toUpperCase()}</p>
                    <p>CUIT/DNI: {cuitCliente}</p>
                    <p>FECHA: {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs</p>
                    <p>MESA: {selectedPedido.numero_mesa.toUpperCase()} • MOZO: {selectedPedido.mozo}</p>
                    <p>CAJERO: {(cajaSession?.usuario_cajero || 'SIN TURNO').toUpperCase()}</p>
                  </div>

                  <div className="py-2 border-b border-dotted border-stone-300 space-y-1">
                    <div className="flex justify-between font-bold text-[9px] sm:text-[10px]">
                      <span>DESCRIPCIÓN / CANT.</span>
                      <span>TOTAL ($)</span>
                    </div>

                    {selectedPedido.items.map((it, idx) => {
                      const pm = productosMenu.find(p => p.id_producto === it.id_producto);
                      const unit = pm ? pm.precio_venta : 0;
                      return (
                        <div key={idx} className="flex justify-between font-sans">
                          <span className="truncate pr-2">{it.cantidad}x {it.nombre}</span>
                          <span className="font-mono">${(it.cantidad * unit).toLocaleString('es-AR')}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="py-2 border-b border-dotted border-stone-300 space-y-1 font-sans">
                    <div className="flex justify-between">
                      <span>Subtotal Net:</span>
                      <span className="font-mono">${orderBreakdowns.subtotal.toLocaleString('es-AR')}</span>
                    </div>

                    {(orderBreakdowns.promoDeduction > 0 || orderBreakdowns.manualDeduction > 0 || (orderBreakdowns.couponDeduction || 0) > 0) && (
                      <>
                        <div className="flex justify-between text-emerald-800 font-bold font-sans">
                          <span>Descuentos:</span>
                          <span className="font-mono">-${(orderBreakdowns.promoDeduction + orderBreakdowns.manualDeduction + (orderBreakdowns.couponDeduction || 0)).toLocaleString('es-AR')}</span>
                        </div>
                        {orderBreakdowns.appliedPromosList && (orderBreakdowns.appliedPromosList as string[]).length > 0 && (
                          <div className="pl-3.5 space-y-0.5">
                            {(orderBreakdowns.appliedPromosList as string[]).map((promoName, i) => (
                              <div key={i} className="flex justify-between text-[9px] text-emerald-700 font-semibold italic">
                                <span>• {promoName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {appliedCoupon && (
                          <div className="pl-3.5 flex justify-between text-[9px] text-emerald-700 font-semibold italic">
                            <span>• Cupón: {appliedCoupon.code}</span>
                          </div>
                        )}
                      </>
                    )}

                    {orderBreakdowns.propinaValue > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>Propina ({propinaPorcentaje}%):</span>
                        <span className="font-mono">${orderBreakdowns.propinaValue.toLocaleString('es-AR')}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-stone-900 border-t border-dashed mt-1 pt-1">
                      <span>TOTAL CUENTA:</span>
                      <span className="font-mono font-black">${orderBreakdowns.finalTotal.toLocaleString('es-AR')}</span>
                    </div>

                    <div className="flex justify-between text-[7.5px] italic text-stone-500 mt-1">
                      <span>(IVA 21.0% incl en subtotal:</span>
                      <span className="font-mono">${orderBreakdowns.ivaValue.toLocaleString('es-AR', { maximumFractionDigits: 1 })})</span>
                    </div>
                  </div>

                  <div className="text-center pt-2 space-y-1 border-t border-stone-200">
                    <div className="w-14 h-14 bg-stone-50 border border-stone-200 mx-auto flex items-center justify-center relative">
                      <div className="grid grid-cols-4 gap-0.5 p-1 w-full h-full opacity-60">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className={`w-full h-full ${i % 3 === 0 || i % 7 === 1 ? 'bg-stone-900' : 'bg-transparent'}`} />
                        ))}
                      </div>
                      <span className="absolute bg-white px-0.5 text-[5px] font-bold text-stone-800 uppercase ring-1 ring-stone-900/5">AFIP QR</span>
                    </div>
                    <p className="text-[6.5px] text-stone-500 font-sans leading-tight">
                      CAE Nº: 732049182390 • VENCE: 15/12/2026
                    </p>
                  </div>

                  <p className="text-[8px] text-center text-stone-600 font-sans mt-2 pt-1 border-t border-dotted border-stone-300">
                    {restaurante.mensajePie}
                  </p>

                </div>

                <div className="mt-3 text-[10px] text-zinc-400 max-w-xs text-center font-bold">
                  ✓ Pizzería Colores POS emitirá este ticket y enviará el string compilado en bytes ESC/POS.
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-zinc-950/40 rounded-2xl p-10 border border-white/5 text-center flex flex-col justify-center items-center min-h-[450px]">
              <div className="p-4 bg-zinc-900/60 rounded-2xl text-[#E8B800] border border-white/5 mb-4 shadow-lg">
                <Receipt className="w-10 h-10" />
              </div>
              <h3 className="font-black text-white text-lg uppercase tracking-tight">
                Terminal de Cobro Pizzería Colores Pro
              </h3>
              <p className="text-zinc-400 text-xs mt-2 max-w-md leading-relaxed font-semibold">
                Seleccione una mesa ocupada desde la lista lateral. Se iniciará el panel interactivo de check-out, permitiéndole coordinar pagos mixtos, aplicar deducciones manuales, configurar datos de CUIT, fraccionar saldos por comensales u artículos indivisos, y emitir comprobantes en PDF y thermal roll.
              </p>
              
              {!cajaSession && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[11px] text-amber-400 max-w-sm flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-bold uppercase tracking-wide">Caja Cerrada</p>
                    <p className="mt-0.5 text-zinc-300 font-medium leading-relaxed">Tenga a bien iniciar el turno con el botón <strong>"Abrir Caja Diaria"</strong> izquierdo antes de realizar operaciones de facturación.</p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* SHIFT OPEN MODAL Dialog (Rule 1) */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-w-md w-full p-5 sm:p-6 animate-scaleIn space-y-4 shadow-2xl text-zinc-100 font-sans">
            <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-450" />
              Apertura de Caja Diaria
            </h3>
            
            <p className="text-[11px] text-zinc-400 leading-normal font-medium">
              Por favor, ingrese el saldo inicial físico depositado en el cajón portamonedas para el cambio comercial, y su nombre de operador de caja.
            </p>

            <form onSubmit={handleOpenShift} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Monto Inicial ($ ARS)</label>
                <input 
                  type="number"
                  inputMode="decimal"
                  required
                  value={openingCashInput}
                  onChange={e => setOpeningCashInput(e.target.value)}
                  className="w-full min-h-11 text-sm p-2.5 rounded-xl border border-white/10 font-mono font-extrabold focus:ring-1 focus:ring-[#E8B800]/30 focus:outline-none bg-zinc-950 text-zinc-100 placeholder-zinc-500"
                  placeholder="Ej. 25000"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Operador Responsable (Cajero)</label>
                <input 
                  type="text"
                  required
                  value={cashierNameInput}
                  onChange={e => setCashierNameInput(e.target.value)}
                  className="w-full min-h-11 text-sm p-2.5 rounded-xl border border-white/10 focus:ring-1 focus:ring-[#E8B800]/30 focus:outline-none bg-zinc-950 text-zinc-100 placeholder-zinc-500"
                  placeholder="Ej. Sofía Colombo"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="w-1/2 min-h-11 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 min-h-11 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase rounded-xl shadow cursor-pointer btn-premium glow-emerald active:scale-95 border-0"
                >
                  Confirmar Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHIFT CLOSE MODAL Dialog (Rule 1) */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-w-md w-full p-5 sm:p-6 animate-scaleIn space-y-4 shadow-2xl text-zinc-100 font-sans">
            <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#E8B800]" />
              Cierre de turno & Conciliación (Arqueo)
            </h3>
            
            <p className="text-[11px] text-zinc-400 leading-normal font-medium">
              Al procesar este cierre se sumarán las ventas totales de este turno. Por favor cuente físicamente el dinero de caja e ingréselo a continuación. El sistema computará el descuadre o diferencia automáticamente.
            </p>

            {cajaSession && (
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5 text-[10px] font-mono space-y-1 text-zinc-300">
                <div className="flex justify-between">
                  <span>Monto inicial:</span>
                  <span>${cajaSession.monto_apertura.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ventas acumuladas:</span>
                  <span>${cajaSession.monto_ventas.toLocaleString('es-AR')}</span>
                </div>
                {sumIngresosManuales > 0 && (
                  <div className="flex justify-between text-emerald-450">
                    <span>(+) Ingresos Manuales:</span>
                    <span>${sumIngresosManuales.toLocaleString('es-AR')}</span>
                  </div>
                )}
                {sumEgresosManuales > 0 && (
                  <div className="flex justify-between text-rose-450">
                    <span>(-) Egresos Manuales:</span>
                    <span>-${sumEgresosManuales.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10 border-dotted text-xs font-sans">
                  <span>Total Esperado:</span>
                  <span>${cajaEsperadaTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCloseShift} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Monto Real Físico de Arqueo ($ ARS)</label>
                <input 
                  type="number"
                  inputMode="decimal"
                  required
                  value={closingPhysicalCashInput}
                  onChange={e => setClosingPhysicalCashInput(e.target.value)}
                  className="w-full min-h-11 text-sm p-2.5 rounded-xl border border-white/10 font-mono font-extrabold focus:ring-1 focus:ring-[#E8B800]/30 focus:outline-none bg-zinc-950 text-zinc-100 placeholder-zinc-500"
                  placeholder="Ej. 120000"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Observaciones Finales</label>
                <textarea 
                  value={closingObservationsInput}
                  onChange={e => setClosingObservationsInput(e.target.value)}
                  className="w-full h-16 text-sm p-2.5 rounded-xl border border-white/10 focus:ring-1 focus:ring-[#E8B800]/30 focus:outline-none bg-zinc-950 text-zinc-100 placeholder-zinc-500"
                  placeholder="Ex. Todo perfectamente conciliado"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="w-1/2 min-h-11 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 min-h-11 py-2.5 bg-[#E8B800] hover:bg-[#D4A700] text-zinc-950 text-xs font-black uppercase rounded-xl shadow cursor-pointer border-0 btn-premium glow-yellow active:scale-95"
                >
                  Confirmar Arqueo & Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PETTY CASH MOVEMENT MODAL */}
      {showMovimientoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-w-md w-full p-5 sm:p-6 animate-scaleIn space-y-4 shadow-2xl text-zinc-100 font-sans">
            <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#E8B800]" />
              Movimiento de Caja Chica
            </h3>
            
            <p className="text-[11px] text-zinc-400 leading-normal font-medium">
              Registre un ingreso o egreso de efectivo manual (ej: compras de verdulería de urgencia o cambio adicional recibido).
            </p>

            <form onSubmit={handleRegistrarMovimientoCajaChica} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovimientoTipo('egreso')}
                    className={`min-h-11 py-2 px-3 text-xs font-black uppercase rounded-lg border transition-all cursor-pointer ${
                      movimientoTipo === 'egreso'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-zinc-950 border-white/10 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    Egreso (Salida)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovimientoTipo('ingreso')}
                    className={`min-h-11 py-2 px-3 text-xs font-black uppercase rounded-lg border transition-all cursor-pointer ${
                      movimientoTipo === 'ingreso'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-zinc-950 border-white/10 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    Ingreso (Entrada)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Monto ($ ARS)</label>
                <input 
                  type="number"
                  inputMode="decimal"
                  required
                  value={movimientoMonto}
                  onChange={e => setMovimientoMonto(e.target.value)}
                  className="w-full min-h-11 text-sm p-2.5 rounded-xl border border-white/10 font-mono font-extrabold focus:ring-1 focus:ring-[#E8B800]/30 focus:outline-none bg-zinc-950 text-zinc-100 placeholder-zinc-500"
                  placeholder="Ej. 1500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Concepto / Motivo</label>
                <input 
                  type="text"
                  required
                  value={movimientoConcepto}
                  onChange={e => setMovimientoConcepto(e.target.value)}
                  className="w-full min-h-11 text-sm p-2.5 rounded-xl border border-white/10 focus:ring-1 focus:ring-[#E8B800]/30 focus:outline-none bg-zinc-950 text-zinc-100 placeholder-zinc-500"
                  placeholder="Ej. Compra hielo de urgencia"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovimientoModal(false)}
                  className="w-1/2 min-h-11 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 min-h-11 py-2.5 bg-[#E8B800] hover:bg-[#D4A700] text-zinc-950 text-xs font-black uppercase rounded-xl shadow cursor-pointer border-0 btn-premium glow-yellow active:scale-95"
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORICAL SHIFTS LIST */}
      <div className="bg-zinc-950/40 p-5 rounded-2xl border border-white/5 shadow-xl space-y-4 font-sans">
        <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5 pb-2 border-b border-white/5">
          <Calendar className="w-4 h-4 text-[#E8B800]" /> Registro de Auditoría de Cierres de Caja Homologados ({sessionInsumos.length})
        </h4>

        {sessionInsumos.length > 0 ? (
          <PaginatedList
            items={sessionInsumos}
            pageSize={10}
            className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1"
            renderItem={(cs) => {
              const hasDiff = cs.diferencia !== null;
              const hasDiffErr = hasDiff && (cs.diferencia || 0) !== 0;

              return (
                <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-extrabold text-[#E8B800] flex items-center gap-1">
                      Cierre de Caja {cs.usuario_cajero}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-medium">
                      Apertura: {cs.fecha_apertura} • Cierre: {cs.fecha_cierre || 'En curso'}
                    </p>
                    <p className="text-[10px] font-medium text-zinc-550 italic">
                      Observaciones: "{cs.observaciones}"
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:text-right shrink-0">
                    <div className="bg-zinc-950 p-2 rounded border border-white/5 min-w-[100px] text-center">
                      <span className="text-[8px] text-zinc-550 block font-black uppercase">Ventas Turno</span>
                      <span className="font-mono font-bold text-zinc-100">${cs.monto_ventas.toLocaleString('es-AR')}</span>
                    </div>

                    <div className="bg-zinc-950 p-2 rounded border border-white/5 min-w-[100px] text-center">
                      <span className="text-[8px] text-zinc-550 block font-black uppercase">Monto Real</span>
                      <span className="font-mono font-bold text-zinc-100">${(cs.monto_real || 0).toLocaleString('es-AR')}</span>
                    </div>

                    {hasDiff && (
                      <div className={`p-2 rounded border min-w-[90px] text-center ${
                        hasDiffErr ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                      }`}>
                        <span className="text-[8px] block font-black uppercase">Diferencia</span>
                        <span className="font-mono font-bold">
                          {cs.diferencia && cs.diferencia > 0 ? '+' : ''}{cs.diferencia?.toLocaleString('es-AR')}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const movs = await cajaService.listMovimientosCajaChica(cs.id_cierre);
                          const desglose = getShiftProductBreakdown(pedidos, cs.id_cierre, cs.fecha_apertura, cs.fecha_cierre);
                          pdfService.exportShiftClosePDF({ ...cs, movimientos_manuales: movs, desglose_productos: desglose });
                        } catch {
                          const desglose = getShiftProductBreakdown(pedidos, cs.id_cierre, cs.fecha_apertura, cs.fecha_cierre);
                          pdfService.exportShiftClosePDF({ ...cs, desglose_productos: desglose });
                        }
                      }}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors flex items-center justify-center cursor-pointer active:scale-95 border border-white/10"
                      title="Descargar Arqueo PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }}
          />
        ) : (
          <p className="text-[10px] text-zinc-500 italic text-center py-4">No se registran históricos de cierres almacenados.</p>
        )}
      </div>

      {/* SUCCESS MODAL FOR TRANSACTION POLISH (Step 3) */}
      {showSuccessModal && successDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="bg-zinc-900 rounded-2xl border border-white/10 max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative text-zinc-100">
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-350 transition-all cursor-pointer border-0 bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white uppercase tracking-tight">Cobro Completado</h3>
              <p className="text-xs text-zinc-400 font-semibold">Comprobante Nº: {successDetails.nro}</p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2 font-mono text-sm">
              <div className="flex justify-between text-zinc-400">
                <span className="text-xs font-sans font-bold">Monto Cobrado:</span>
                <span className="font-extrabold text-[#E8B800]">${successDetails.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              {successDetails.vuelto > 0 && (
                <div className="flex justify-between text-[#22C55E] pt-2 border-t border-white/10 border-dotted">
                  <span className="text-xs font-sans font-bold">Vuelto Entregado:</span>
                  <span className="font-extrabold">${successDetails.vuelto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full min-h-11 py-2.5 bg-[#E8B800] hover:bg-[#D4A700] text-zinc-950 text-xs font-black uppercase rounded-xl shadow transition-all cursor-pointer border-0 btn-premium glow-yellow active:scale-95"
            >
              Cerrar y Continuar
            </button>
          </div>
        </div>
      )}

      {/* ARCHIVE DIALOG MODAL */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="bg-zinc-900 rounded-2xl border border-white/10 max-w-4xl w-full p-6 space-y-4 shadow-2xl relative flex flex-col max-h-[85vh] text-zinc-100">
            <button 
              onClick={() => setShowArchiveModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-350 transition-all cursor-pointer border-0 bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <FolderOpen className="w-6 h-6 text-[#E8B800]" />
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Archivo Histórico de Comprobantes</h3>
                <p className="text-[11px] text-zinc-400 font-medium">Búsqueda y descarga de facturas y pagos archivados en Supabase</p>
              </div>
            </div>

            {/* SEARCH AND FILTERS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-950/60 p-3 rounded-xl border border-white/5">
              <div>
                <label className="text-[10px] font-bold text-zinc-450 block mb-1">Buscar por ticket, cliente o CUIT</label>
                <input 
                  type="text"
                  value={archiveSearchQuery}
                  onChange={e => setArchiveSearchQuery(e.target.value)}
                  className="w-full min-h-10 px-3 text-xs bg-zinc-950 border border-white/10 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                  placeholder="Ej. T-0001 o Consumidor Final"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-455 block mb-1">Filtrar Medio de Pago</label>
                <select
                  value={archiveMetodoFilter}
                  onChange={e => setArchiveMetodoFilter(e.target.value)}
                  className="w-full min-h-10 px-3 text-xs bg-zinc-950 border border-white/10 rounded-lg text-zinc-100 font-semibold focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                >
                  <option value="todos" className="bg-zinc-950 text-zinc-100">Todos los medios</option>
                  <option value="efectivo" className="bg-zinc-950 text-zinc-100">Efectivo</option>
                  <option value="debito" className="bg-zinc-950 text-zinc-100">Débito</option>
                  <option value="tarjeta" className="bg-zinc-950 text-zinc-100">Tarjeta de Crédito</option>
                  <option value="transferencia" className="bg-zinc-950 text-zinc-100">Transferencia</option>
                  <option value="mp_qr" className="bg-zinc-950 text-zinc-100">MercadoPago QR</option>
                  <option value="mixto" className="bg-zinc-950 text-zinc-100">Mixto</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-455 block mb-1">Filtrar Estado</label>
                <select
                  value={archiveEstadoFilter}
                  onChange={e => setArchiveEstadoFilter(e.target.value)}
                  className="w-full min-h-10 px-3 text-xs bg-zinc-950 border border-white/10 rounded-lg text-zinc-100 font-semibold focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
                >
                  <option value="todos" className="bg-zinc-950 text-zinc-100">Todos los estados</option>
                  <option value="emitido" className="bg-zinc-950 text-zinc-100">Emitido</option>
                  <option value="nota_credito" className="bg-zinc-950 text-zinc-100">Anulado (Nota de Crédito)</option>
                </select>
              </div>
            </div>

            {/* RESULTS LIST */}
            <div className="flex-1 overflow-y-auto min-h-[300px] border border-white/5 rounded-xl divide-y divide-white/5 pr-1">
              {filteredFacturas.length === 0 ? (
                <div className="text-center py-12 text-zinc-550 text-xs italic">
                  No se encontraron comprobantes en el archivo que coincidan con los filtros.
                </div>
              ) : (
                filteredFacturas.map((f) => (
                  <div key={f.id_factura} className="p-3 hover:bg-zinc-950/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-white">{f.nro_ticket}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          f.estado === 'nota_credito' 
                            ? 'bg-rose-500/10 text-rose-455 border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-455 border-emerald-500/20'
                        }`}>
                          {f.estado === 'nota_credito' ? 'Anulado (NC)' : 'Emitido'}
                        </span>
                        <span className="text-[10px] text-zinc-450 font-medium font-mono">{f.fecha}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-semibold">
                        Cliente: <span className="text-zinc-200">{f.cliente}</span> • CUIT: <span className="font-mono text-zinc-200">{f.cuit}</span>
                      </p>
                      {f.afip_cae && (
                        <p className="text-[9px] text-[#E8B800] font-bold font-mono">
                          CAE: {f.afip_cae} | Vto: {f.afip_vto}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-500 block font-black uppercase font-sans">Total</span>
                        <span className="font-mono font-black text-white text-sm">${f.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-white/5 font-mono text-[9px] font-black uppercase text-zinc-350">
                        {f.medio_pago.toUpperCase()}
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => downloadFacturaHistorialPdf(f)}
                          className="px-2.5 py-1.5 bg-[#E8B800] hover:bg-[#D4A700] text-zinc-950 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer border-0 btn-premium active:scale-95"
                          title="Descargar Comprobante PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-zinc-950" />
                          PDF
                        </button>

                        {f.estado === 'emitido' && (
                          <button
                            type="button"
                            onClick={() => handleAnularFactura(f.id_factura)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-550 text-white rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border-0"
                          >
                            Anular (NC)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase rounded-xl transition-all cursor-pointer border-0"
              >
                Cerrar Archivos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOUCHER MODAL */}
      {showVoucherModal && selectedCliente && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="bg-zinc-900 rounded-2xl border border-white/10 max-w-sm w-full p-6 space-y-4 shadow-2xl relative flex flex-col text-center text-zinc-100">
            <button 
              onClick={() => setShowVoucherModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-350 transition-all cursor-pointer border-0 bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center gap-2 pb-2 border-b border-white/5">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-[#E8B800] border border-amber-500/20">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Voucher de Recompensa</h3>
                <p className="text-[11px] text-zinc-400 font-medium font-bold text-[#E8B800]">Club Pizzería Colores</p>
              </div>
            </div>

            <div className="space-y-3 py-2">
              <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 text-zinc-100 text-left">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400 font-semibold">Beneficiario:</span>
                  <span className="font-extrabold text-white">{selectedCliente.nombre}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400 font-semibold">Cédula/CUIT:</span>
                  <span className="font-mono text-white">{selectedCliente.dni_cuit}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400 font-semibold">Puntos Canjeados:</span>
                  <span className="font-mono font-bold text-[#E8B800]">{puntosRedimidos} ptos</span>
                </div>
                <div className="flex justify-between text-xs border-t border-white/5 pt-1.5 mt-1.5">
                  <span className="text-zinc-300 font-black">Valor Descuento:</span>
                  <span className="font-mono font-black text-emerald-450 text-sm">ARS ${(puntosRedimidos * 10).toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* MOCK QR CODE SVG */}
              <div className="flex justify-center p-3 bg-white border border-white/10 rounded-xl max-w-[160px] mx-auto">
                <svg className="w-32 h-32 text-stone-900" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer boundaries */}
                  <rect x="0" y="0" width="20" height="20" />
                  <rect x="2" y="2" width="16" height="16" fill="white" />
                  <rect x="5" y="5" width="10" height="10" />

                  <rect x="80" y="0" width="20" height="20" />
                  <rect x="82" y="2" width="16" height="16" fill="white" />
                  <rect x="85" y="5" width="10" height="10" />

                  <rect x="0" y="80" width="20" height="20" />
                  <rect x="2" y="82" width="16" height="16" fill="white" />
                  <rect x="8" y="88" width="4" height="4" fill="white" />
                  <rect x="5" y="85" width="10" height="10" />

                  {/* QR details mock pixels */}
                  <rect x="25" y="5" width="8" height="8" />
                  <rect x="35" y="3" width="5" height="5" />
                  <rect x="45" y="7" width="10" height="5" />
                  <rect x="60" y="2" width="12" height="4" />
                  
                  <rect x="25" y="20" width="5" height="15" />
                  <rect x="35" y="22" width="15" height="6" />
                  <rect x="55" y="15" width="8" height="8" />
                  <rect x="70" y="22" width="6" height="12" />
                  
                  <rect x="5" y="25" width="12" height="6" />
                  <rect x="10" y="35" width="6" height="12" />
                  <rect x="22" y="45" width="18" height="5" />
                  <rect x="45" y="35" width="8" height="12" />
                  
                  <rect x="60" y="40" width="15" height="5" />
                  <rect x="80" y="30" width="12" height="12" />
                  <rect x="82" y="32" width="8" height="8" fill="white" />
                  <rect x="84" y="34" width="4" height="4" />

                  <rect x="5" y="55" width="15" height="5" />
                  <rect x="25" y="55" width="8" height="8" />
                  <rect x="40" y="52" width="14" height="6" />
                  <rect x="60" y="50" width="6" height="18" />
                  <rect x="72" y="55" width="18" height="5" />
                  
                  <rect x="12" y="65" width="15" height="5" />
                  <rect x="32" y="68" width="20" height="4" />
                  <rect x="55" y="72" width="5" height="15" />
                  <rect x="65" y="68" width="12" height="6" />
                  <rect x="82" y="65" width="15" height="12" />
                  <rect x="85" y="68" width="9" height="6" fill="white" />
                  
                  <rect x="25" y="82" width="12" height="12" />
                  <rect x="42" y="85" width="8" height="8" />
                  <rect x="52" y="82" width="6" height="6" />
                  <rect x="62" y="88" width="15" height="8" />
                  
                  {/* Brand logo block in center */}
                  <rect x="42" y="42" width="16" height="16" fill="white" rx="2" />
                  <circle cx="50" cy="50" r="6" fill="#E8B800" />
                  <circle cx="50" cy="50" r="4" fill="#3E3228" />
                </svg>
              </div>

              <div className="text-center">
                <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-wider">Código de Cupón</span>
                <span className="font-mono text-base font-black text-white tracking-wider">
                  V-{Date.now().toString().slice(-6)}-{selectedCliente.dni_cuit.slice(-4)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  toast.success('Comprobante de cupón enviado a la cola de impresión.');
                  window.print();
                }}
                className="flex-1 py-2 bg-[#E8B800] hover:bg-[#D4A700] text-zinc-950 text-xs font-black uppercase rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5 btn-premium glow-yellow active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Imprimir Voucher
              </button>
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase rounded-xl transition-all cursor-pointer border-0"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}

export default React.memo(CajaModule);
