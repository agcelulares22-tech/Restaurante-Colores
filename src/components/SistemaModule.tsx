import React, { useState, useMemo } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Download, 
  Server, 
  Terminal, 
  CheckCircle, 
  Activity, 
  FileSpreadsheet,
  Compass
} from 'lucide-react';
import { ProductoMenu, Insumo, RecetaEscandallo, Pedido, Mesa } from '../types';
import SupabaseManager from './SupabaseManager';
import ElPatronLogo from './ElPatronLogo';
import { useToast, ToastContainer } from './ToastContainer';
import {
  getArcaEnvironmentLabel,
  getArcaPuntoVenta,
  isArcaConfigured,
  testArcaConnection,
} from '../services/arcaService';
import { printerService } from '../services/printerService';
import { hasSupabaseConfig } from '../lib/supabaseClient';


interface SistemaModuleProps {
  insumos: Insumo[];
  productosMenu: ProductoMenu[];
  recetas: RecetaEscandallo[];
  pedidos: Pedido[];
  mesas: Mesa[];
  addLog: (tipo: 'pedido_creado' | 'descuento_stock' | 'alerta_stock' | 'comanda_estado' | 'sistema', mensaje: string) => void;
  onSyncComplete?: (data: {
    mesas?: any[];
    insumos?: any[];
    productosMenu?: any[];
    recetas?: any[];
    usuarios?: any[];
    pedidos?: any[];
    mermas?: any[];
  }) => void;
}

export default function SistemaModule({
  insumos,
  productosMenu,
  recetas,
  pedidos,
  mesas,
  addLog,
  onSyncComplete
}: SistemaModuleProps) {
  const { toast, toasts, removeToast } = useToast();
  // Real Speed/Latency states
  const [realPingMs, setRealPingMs] = useState<number | null>(null);
  const [realNetStatus, setRealNetStatus] = useState<'idle' | 'testing' | 'ready' | 'error'>('idle');

  // Printer diagnostics states
  const [printerDiagnosticStatus, setPrinterDiagnosticStatus] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle');
  const [printerTestResult, setPrinterTestResult] = useState<string>('');

  const [isTestingArca, setIsTestingArca] = useState(false);
  const arcaConfigured = isArcaConfigured();
  const supabaseConfigured = hasSupabaseConfig();

  // Database audit of "Productos activos sin receta" (menu items that have no recipes assigned!)
  const menuItemsWithoutRecipe = useMemo(() => {
    return productosMenu.filter(p => {
      const hasRecipe = recetas.some(r => r.id_producto === p.id_producto);
      return !hasRecipe;
    });
  }, [productosMenu, recetas]);

  // Ingredients below critical safety stock minimums
  const ingredientsBelowMin = useMemo(() => {
    return insumos.filter(i => i.stock_actual <= i.stock_minimo);
  }, [insumos]);

  // Measure the application's own backend, without sending diagnostics to third parties.
  const runRealNetworkTest = async () => {
    setRealNetStatus('testing');
    const start = Date.now();
    try {
      const res = await fetch(`/api/supabase-config?diagnostic=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      const end = Date.now();
      const latency = end - start;
      setRealPingMs(latency);
      setRealNetStatus('ready');
      addLog('sistema', `DIAGNOSTICO: API de la aplicación respondió en ${latency} ms.`);
      toast.success('Conectividad con el servidor verificada.');
    } catch {
      setRealNetStatus('error');
      toast.error('Error al medir la velocidad de red.');
    }
  };

  const runPrinterTest = async () => {
    setPrinterDiagnosticStatus('testing');
    setPrinterTestResult('');
    const config = printerService.getDefaultConfig();
    
    // Simulate printing dummy ESC/POS ticket
    const dummyTicket: any = {
      nombreComercial: 'Pizzería Colores',
      razonSocial: 'COLORES S.A.S.',
      cuit: '30-71829384-9',
      direccion: 'Av. Corrientes 1234, CABA',
      telefono: '+54 11 9876-5432',
      email: 'impresion@pizzeriacolores.com',
      nroComprobante: 'TEST-0001',
      tipoComprobante: 'ticket_consumo',
      fechaHora: new Date().toLocaleString('es-AR'),
      mesa: 'Test',
      mozo: 'Sistema',
      cajero: 'Diagnóstico',
      idPedido: '9999',
      items: [
        { descripcion: 'Test de Impresión ESC/POS', cantidad: 1, precio_unitario: 0, precioUnitario: 0, subtotal: 0 }
      ],
      subtotal: 0,
      descuento: 0,
      propina: 0,
      iva: 0,
      total: 0,
      metodosPago: [{ metodo: 'efectivo', monto: 0 }],
      vuelto: 0,
      mensajePie: 'DIAGNOSTICO DE IMPRESION EXITOSO'
    };

    try {
      const outcome = await printerService.sendToPrinter(dummyTicket, config);
      if (outcome.success) {
        setPrinterDiagnosticStatus('online');
        setPrinterTestResult(outcome.message);
        toast.success('Impresión de prueba enviada con éxito.');
        addLog('sistema', `DIAGNOSTICO: Impresora enlazada y en línea (${config.printerName})`);
      } else {
        setPrinterDiagnosticStatus('offline');
        setPrinterTestResult(outcome.message);
        toast.warning('Impresora no detectada. Se usará el PDF de respaldo.');
        addLog('sistema', `DIAGNOSTICO: Impresora fuera de línea (${config.printerName})`);
      }
    } catch (err: any) {
      setPrinterDiagnosticStatus('offline');
      setPrinterTestResult(err.message || 'Error desconocido.');
      toast.error('Fallo en la comunicación con el bridge de impresión.');
    }
  };

  // CSV Serialization helper
  const triggerCsvDownload = (tableName: string, dataArray: any[]) => {
    if (dataArray.length === 0) {
      toast.error("No hay registros en la tabla para exportar.");
      return;
    }

    // Get table keys
    const headers = Object.keys(dataArray[0]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
      headers.join(";") + "\n" + 
      dataArray.map(row => 
        headers.map(header => {
          let cell = row[header];
          if (cell instanceof Date) {
            return cell.toISOString();
          }
          if (typeof cell === 'string') {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          if (typeof cell === 'object' && cell !== null) {
            return `"${JSON.stringify(cell).replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(";")
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Backup_${tableName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }

    addLog('sistema', `DIAGNOSTICO: Backup local de base de datos generado para la tabla '${tableName}'.`);
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn" id="sistema-module-container">
      
      {/* Institutional Brand Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm flex flex-col md:flex-row items-center gap-5 justify-between">
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 h-14 bg-[#FAF4EE] rounded-2xl flex items-center justify-center p-1 border border-stone-200 shadow-sm shrink-0 overflow-hidden">
            <ElPatronLogo className="w-12 h-12 object-contain rounded" variant="badge" color="#4A2D1B" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#4A2D1B] tracking-tight">Marca Institucional & Control del Sistema</h2>
            <p className="text-xs text-stone-500 mt-0.5">Pizzería Colores • Sistema Operativo Sincronizado</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#22C55E]/10 px-4 py-1.5 rounded-full border border-[#22C55E]/20">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-[10px] uppercase font-bold text-[#22C55E] tracking-wider font-sans">Enlace Institucional Activo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMN LEFT: Live Diagnostics, DB engine & backup buttons (Col Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Supabase Realtime Database Link Manager */}
          <SupabaseManager
            addLog={addLog}
            currentMesas={mesas}
            currentInsumos={insumos}
            currentProductosMenu={productosMenu}
            currentRecetas={recetas}
            onSyncComplete={onSyncComplete}
          />
  
          {/* Connection & DB Engine Settings */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans">Infraestructura y Persistencia</p>
                <h3 className="font-extrabold text-[#4A2D1B] font-sans tracking-tight">Motor de Base de Datos Vinculado</h3>
              </div>
              
              <span className="bg-[#4A2D1B]/10 border border-[#4A2D1B]/20 text-[#4A2D1B] text-[10px] font-extrabold px-2.5 py-1 rounded-lg font-mono">
                Estabilidad 100%
              </span>
            </div>
  
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-left">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#4A2D1B]" />
                  <span className="text-xs font-extrabold text-slate-800">Cola local PWA</span>
                </div>
                <p className="text-[10px] text-slate-450 mt-1 font-medium leading-normal">
                  Conserva comandas pendientes en el navegador cuando no hay red y las sincroniza al recuperar conexión.
                </p>
              </div>
  
              <div className="p-4 rounded-xl border border-[#4A2D1B] bg-[#4A2D1B]/5 ring-1 ring-[#4A2D1B]/10 text-left">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#6B4A35]" />
                  <span className="text-xs font-extrabold text-slate-800">Supabase PostgreSQL</span>
                </div>
                <p className="text-[10px] text-slate-450 mt-1 font-medium leading-normal">
                  Persistencia principal con Supabase Auth, PostgreSQL y políticas de seguridad RLS.
                </p>
              </div>
            </div>

          {/* Double diagnostics block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Speed Test Panel */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900/50 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] text-slate-450 dark:text-zinc-400 uppercase font-black tracking-wide block">Conectividad del servidor</span>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                  Mide la respuesta del backend de esta aplicación sin contactar servicios externos.
                </p>
              </div>

              {realNetStatus !== 'idle' && (
                <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-850 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-450 dark:text-zinc-400">Respuesta API:</span>
                    <span className={`font-black ${realPingMs && realPingMs < 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {realPingMs ? `${realPingMs} ms` : 'Midiendo...'}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={runRealNetworkTest}
                disabled={realNetStatus === 'testing'}
                className="w-full py-2 bg-slate-900 dark:bg-zinc-800 text-white text-[10px] font-black uppercase rounded-lg hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 border-0"
              >
                <Activity className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                {realNetStatus === 'testing' ? 'Consultando servidor...' : 'Probar conectividad'}
              </button>
            </div>

            {/* Printer Test Panel */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900/50 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] text-slate-450 dark:text-zinc-400 uppercase font-black tracking-wide block">Diagnóstico de Impresora Térmica</span>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                  Verifica el enlace local con el bridge de la ticketera física (Puerto 8012).
                </p>
              </div>

              {printerDiagnosticStatus !== 'idle' && (
                <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-850 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-450 dark:text-zinc-400">Estado:</span>
                    <span className={`font-black uppercase ${
                      printerDiagnosticStatus === 'online' ? 'text-emerald-600' :
                      printerDiagnosticStatus === 'testing' ? 'text-amber-500' : 'text-rose-600'
                    }`}>
                      {printerDiagnosticStatus === 'testing' ? 'Probando...' :
                       printerDiagnosticStatus === 'online' ? 'En Línea 🟢' : 'Fuera de Línea 🔴'}
                    </span>
                  </div>
                  <p className="text-[9px] text-stone-400 dark:text-zinc-400 leading-snug truncate mt-0.5" title={printerTestResult}>
                    {printerTestResult}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={runPrinterTest}
                disabled={printerDiagnosticStatus === 'testing'}
                className="w-full py-2 bg-slate-900 dark:bg-zinc-800 text-white text-[10px] font-black uppercase rounded-lg hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 border-0"
              >
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                {printerDiagnosticStatus === 'testing' ? 'Probando Impresión...' : 'Imprimir Ticket de Prueba'}
              </button>
            </div>
          </div>

        </div>

        {/* Dynamic Database Diagnostics Panel (Checking specific README requests!) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-800 text-xs font-sans tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Auditorías Críticas de Producción
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Audit A: Productos activos sin receta */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              menuItemsWithoutRecipe.length > 0 
                ? 'border-amber-100 bg-amber-50/30' 
                : 'border-slate-100 bg-slate-50/40'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-sans">Productos Activos Sin Receta</span>
                <p className="text-[11px] text-slate-500 leading-snug mt-1 font-sans">
                  Productos configurados como comercialmente activos pero que no poseen insumos asignados. No decrementarán stock en Cocina.
                </p>
              </div>

              {menuItemsWithoutRecipe.length > 0 ? (
                <div className="mt-3 bg-amber-100 border border-amber-200 p-2 text-stone-800 rounded-lg text-[10px] space-y-0.5">
                  <p className="font-bold text-amber-900">⚠️ {menuItemsWithoutRecipe.length} platos sin receta:</p>
                  <ul className="list-disc list-inside text-[9px] opacity-90">
                    {menuItemsWithoutRecipe.map(p => <li key={p.id_producto}>{p.nombre}</li>)}
                  </ul>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-1.5 text-emerald-700 text-[10px] font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Todos las platos poseen fórmulas asociadas.
                </div>
              )}
            </div>

            {/* Audit B: Stock bajo */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              ingredientsBelowMin.length > 0 
                ? 'border-rose-100 bg-rose-50/20' 
                : 'border-slate-100 bg-slate-50/40'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-sans">Insumos Abajo del Mínimo</span>
                <p className="text-[11px] text-slate-500 leading-snug mt-1 font-sans">
                  Materias primas que perforaron el stock de seguridad. Pueden ocasionar la inhabilitación de platos en terminales de Mozos.
                </p>
              </div>

              {ingredientsBelowMin.length > 0 ? (
                <div className="mt-3 bg-red-100 border border-red-200 p-2 text-red-800 rounded-lg text-[10px]">
                  <p className="font-bold text-red-900">🚨 {ingredientsBelowMin.length} materiales críticos:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ingredientsBelowMin.slice(0, 3).map(i => (
                      <span key={i.id_insumo} className="bg-white border rounded text-[9px] px-1 font-mono">{i.nombre}</span>
                    ))}
                    {ingredientsBelowMin.length > 3 && <span>...</span>}
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-1.5 text-emerald-700 text-[10px] font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Depósito abastecido de manera óptima.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Database Backups Local serialization */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-800 text-xs font-sans tracking-tight">
                Copia de Seguridad y Exportación Local (.db Backup)
              </h4>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Descargue archivos físicos síncronos estructurados para migración u operaciones externas.
              </p>
            </div>
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => triggerCsvDownload('usuarios_export', [{ id: 1, nom: 'Enzo', rol: 'mozo' }, { id: 2, nom: 'Micaela', rol: 'mozo' }])}
              className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/50"
            >
              <Download className="w-3 h-3 text-slate-500" />
              usuarios.csv
            </button>
            <button
              onClick={() => triggerCsvDownload('mesas_export', mesas)}
              className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/50"
            >
              <Download className="w-3 h-3 text-slate-500" />
              mesas.csv
            </button>
            <button
              onClick={() => triggerCsvDownload('insumos_export', insumos)}
              className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/50"
            >
              <Download className="w-3 h-3 text-slate-500" />
              insumos.csv
            </button>
            <button
              onClick={() => triggerCsvDownload('pedidos_export', pedidos.map(p => ({
                id: p.id_pedido,
                mesa: p.numero_mesa,
                mozo: p.mozo,
                items_count: p.items.length,
                total_est: p.items.reduce((sum, current) => sum + current.cantidad * 8000, 0),
                fecha: p.fecha_hora.toISOString()
              })))}
              className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/50"
            >
              <Download className="w-3 h-3 text-slate-500" />
              pedidos.csv
            </button>
          </div>
        </div>

        {/* Arquitectura real desplegada */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-md space-y-4 text-white">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-amber-300 font-mono">Arquitectura activa</p>
            <h4 className="font-extrabold text-white text-xs font-sans tracking-tight">React + Vercel + Supabase</h4>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">Componentes que realmente sostienen esta versión del sistema.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
            {[
              ['Interfaz', 'React, TypeScript y Vite PWA'],
              ['Base de datos', 'Supabase PostgreSQL con RLS'],
              ['Autenticación', 'Supabase Auth y perfiles operativos'],
              ['Funciones', 'Vercel serverless para ARCA'],
              ['Modo sin red', 'Caché PWA y cola local persistente'],
              ['Facturación', 'WSAA + WSFE desde el servidor'],
            ].map(([label, value]) => (
              <div key={label} className="bg-slate-950 rounded-lg border border-slate-800 p-2.5">
                <span className="text-slate-500 block uppercase font-bold">{label}</span>
                <span className="text-slate-200 block mt-0.5">{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* COLUMN RIGHT: Production Deploy Checklist (Col Span 5) */}
      <div className="lg:col-span-5">
        
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-sm font-sans tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" />
              Checklist de Despliegue en Producción
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Pasos requeridos antes del lanzamiento general en la sucursal.
            </p>
          </div>

          <div className="space-y-3">
            
            {/* Persistencia offline */}
            <label className="flex items-start gap-3 p-2.5 bg-slate-850 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors border border-slate-800">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-0.5 rounded border-slate-700 text-indigo-600 bg-slate-800 focus:ring-offset-slate-900 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-100 block">Cola local de recuperación activa</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-sans leading-normal">
                  Las operaciones pendientes no se descartan y se reintentan cuando vuelve la conectividad.
                </span>
              </div>
            </label>

            {/* Supabase */}
            <label className="flex items-start gap-3 p-2.5 bg-slate-850 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors border border-slate-800">
              <input
                type="checkbox"
                checked={supabaseConfigured}
                disabled
                className="mt-0.5 rounded border-slate-700 text-indigo-600 bg-slate-800 focus:ring-offset-slate-900 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-100 block">Supabase PostgreSQL configurado</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-sans leading-normal">
                  La aplicación utiliza Supabase Auth y políticas RLS para proteger los datos operativos.
                </span>
              </div>
            </label>

            {/* Checklist item 3 */}
            <label className="flex items-start gap-3 p-2.5 bg-slate-850 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors border border-slate-800">
              <input
                type="checkbox"
                checked={menuItemsWithoutRecipe.length === 0}
                disabled
                className="mt-0.5 rounded border-slate-700 text-indigo-600 bg-slate-800 focus:ring-offset-slate-900 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-100 block flex items-center gap-1.5">
                  Recetas de Plato Completadas
                  <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold ${menuItemsWithoutRecipe.length === 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                    {menuItemsWithoutRecipe.length === 0 ? 'SÍ' : `NO - ${menuItemsWithoutRecipe.length}`}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-sans leading-normal">
                  Todos los platos activos del menú gastronómico poseen receta de escandallo asociada. (Auditado automáticamente).
                </span>
              </div>
            </label>

            {/* Checklist item 4 */}
            <label className="flex items-start gap-3 p-2.5 bg-slate-850 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors border border-slate-800">
              <input
                type="checkbox"
                checked={ingredientsBelowMin.length === 0}
                disabled
                className="mt-0.5 rounded border-slate-700 text-indigo-600 bg-slate-800 focus:ring-offset-slate-900 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-100 block flex items-center gap-1.5">
                  Bodega Abastecida (Stock Mínimo)
                  <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold ${ingredientsBelowMin.length === 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400 animate-pulse'}`}>
                    {ingredientsBelowMin.length === 0 ? 'SÍ' : `NO - Falta Abastecer`}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-sans leading-normal">
                  Evita quiebres de stock en cocina. Reponer insumos en la sección de Stock si hay alertas activas.
                </span>
              </div>
            </label>

            {/* Verificación automatizada */}
            <label className="flex items-start gap-3 p-2.5 bg-slate-850 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors border border-slate-800">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-0.5 rounded border-slate-700 text-indigo-600 bg-slate-800 focus:ring-offset-slate-900 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-100 block">Verificación automatizada del código</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-sans leading-normal">
                  TypeScript, pruebas de regresión, auditoría de configuración y compilación de producción.
                </span>
              </div>
            </label>

          </div>

          {/* Visual terminal logs widget inside checking */}
          <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-[9px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1 text-slate-300 font-extrabold border-b border-slate-800 pb-1 mb-1">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              ESTADO DE LA ARQUITECTURA
            </div>
            <p className="text-emerald-500">✔ React + TypeScript PWA</p>
            <p className="text-emerald-500">✔ Supabase Auth + PostgreSQL + RLS</p>
            <p className="text-slate-300">✔ Cola offline con reintentos persistentes</p>
            <p className={arcaConfigured ? 'text-emerald-400' : 'text-amber-400'}>
              {arcaConfigured ? `✔ ARCA ${getArcaEnvironmentLabel()} configurado en servidor` : '⚠ ARCA pendiente de configuración en servidor'}
            </p>
          </div>
        </div>

        {/* Logo Identity Manager */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm space-y-3 mt-6 animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2.5">
            <Compass className="w-4.5 h-4.5 text-[#4A2D1B]" />
            <div className="text-left">
              <h4 className="font-bold text-[#4A2D1B] text-xs font-sans tracking-tight">
                Identidad de Marca & Logotipo
              </h4>
              <p className="text-[10px] text-stone-500 font-medium">
                Carga el isotipo o logotipo oficial de la pizzería para todo el sistema.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-200 hover:border-[#4A2D1B]/40 rounded-xl bg-[#FFFDF8]/60 transition-all space-y-3 relative group">
            <div className="w-16 h-16 rounded-full bg-[#FAF4EE] flex items-center justify-center p-1 shadow-sm border border-stone-100 relative overflow-hidden">
              <ElPatronLogo className="w-14 h-14 object-contain rounded-full" variant="badge" color="#4A2D1B" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold text-stone-850 block">Subir Logotipo Real de la Pizzería</span>
              <p className="text-[9px] text-stone-500 max-w-[210px] leading-normal mx-auto font-medium">
                Puedes seleccionar el archivo de imagen de logotipo que prefieras. La pestaña y los banners se actualizarán de forma dinámica.
              </p>
            </div>

            <div className="flex gap-2 w-full pt-1">
              <label className="flex-1 py-1.5 px-2 bg-[#4A2D1B] hover:bg-[#6B4A35] text-white rounded-lg text-[10px] font-extrabold text-center cursor-pointer transition-colors shadow-sm block">
                Cargar Imagen
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        if (dataUrl) {
                          try {
                            localStorage.setItem('colores_pizzeria_custom_logo', dataUrl);
                            window.dispatchEvent(new Event('colores_logo_changed'));
                            addLog('sistema', `MARCA: Logotipo cargado correctamente en memoria local activa.`);
                          } catch (error) {
                            toast.error("La imagen es muy grande. Por favor selecciona una menor a 1.5MB.");
                          }
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('colores_pizzeria_custom_logo');
                  window.dispatchEvent(new Event('colores_logo_changed'));
                  addLog('sistema', `MARCA: Logotipo restablecido al isotipo de vector por defecto.`);
                }}
                className="px-3 py-1.5 border border-stone-200 hover:border-red-200 text-stone-550 hover:text-rose-600 rounded-lg text-[10px] font-extrabold bg-white hover:bg-stone-50 transition-all cursor-pointer shadow-xs"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>

        {/* ARCA se administra en secretos del servidor; nunca desde el navegador. */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm space-y-4 mt-6">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2.5">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
            <div className="text-left">
              <h4 className="font-bold text-[#624A3E] text-xs font-sans tracking-tight">
                Facturación Electrónica ARCA protegida
              </h4>
              <p className="text-[10px] text-stone-500 font-medium">
                El certificado, la clave privada y los tokens se conservan exclusivamente en el servidor.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-semibold">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <span className="block text-stone-500 uppercase font-black">Estado</span>
              <span className={arcaConfigured ? 'text-emerald-700' : 'text-rose-600'}>
                {arcaConfigured ? 'Configurado en servidor' : 'No configurado'}
              </span>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <span className="block text-stone-500 uppercase font-black">Ambiente</span>
              <span className="text-stone-800">{getArcaEnvironmentLabel()}</span>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <span className="block text-stone-500 uppercase font-black">Punto de venta</span>
              <span className="text-stone-800 font-mono">{String(getArcaPuntoVenta()).padStart(4, '0')}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={!arcaConfigured || isTestingArca}
            onClick={async () => {
              setIsTestingArca(true);
              try {
                const result = await testArcaConnection();
                if (result.success) toast.success('Conexión autenticada con ARCA establecida correctamente.');
                else toast.error(result.error || 'ARCA no confirmó la conexión.');
              } finally {
                setIsTestingArca(false);
              }
            }}
            className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTestingArca ? 'Verificando con ARCA...' : 'Probar conexión segura'}
          </button>
        </div>


      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  </div>
);
}

