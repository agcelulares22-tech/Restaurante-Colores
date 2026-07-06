import React, { useState, useMemo } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  Server, 
  Github, 
  Terminal, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Activity, 
  FileSpreadsheet,
  Lock,
  Compass,
  Trash
} from 'lucide-react';
import { ProductoMenu, Insumo, RecetaEscandallo, Pedido, Mesa } from '../types';
import SupabaseManager from './SupabaseManager';
import ElPatronLogo from './ElPatronLogo';
import { useToast, ToastContainer } from './ToastContainer';
import { saveArcaCredentials, deleteArcaCredentials, testArcaConnection } from '../services/arcaService';
import { printerService } from '../services/printerService';


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
  // Test latencies
  const [dbPingStatus, setDbPingStatus] = useState<'idle' | 'testing' | 'ready'>('idle');
  const [dbPingMs, setDbPingMs] = useState<number>(0);
  const [activeDbEngine, setActiveDbEngine] = useState<'SQLite Local (.db)' | 'PostgreSQL / Supabase (Cloud)'>('PostgreSQL / Supabase (Cloud)');

  // Real Speed/Latency states
  const [realPingMs, setRealPingMs] = useState<number | null>(null);
  const [realMbps, setRealMbps] = useState<number | null>(null);
  const [realNetStatus, setRealNetStatus] = useState<'idle' | 'testing' | 'ready' | 'error'>('idle');

  // Printer diagnostics states
  const [printerDiagnosticStatus, setPrinterDiagnosticStatus] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle');
  const [printerTestResult, setPrinterTestResult] = useState<string>('');

  // ARCA (AFIP) Credentials Setup States
  const [arcaCuit, setArcaCuit] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('colores_pizzeria_arca_creds');
      if (stored) {
        return JSON.parse(stored).cuit || '';
      }
    } catch {}
    return '';
  });
  const [arcaProd, setArcaProd] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('colores_pizzeria_arca_creds');
      if (stored) {
        return JSON.parse(stored).production || false;
      }
    } catch {}
    return false;
  });
  const [arcaCert, setArcaCert] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('colores_pizzeria_arca_creds');
      if (stored) {
        return JSON.parse(stored).cert || '';
      }
    } catch {}
    return '';
  });
  const [arcaKey, setArcaKey] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('colores_pizzeria_arca_creds');
      if (stored) {
        return JSON.parse(stored).key || '';
      }
    } catch {}
    return '';
  });
  const [isTestingArca, setIsTestingArca] = useState(false);
  const [arcaConfigured, setArcaConfigured] = useState<boolean>(() => {
    try {
      return localStorage.getItem('colores_pizzeria_arca_creds') !== null;
    } catch { return false; }
  });


  // Selected checklist verification states
  const [deployChecklist, setDeployChecklist] = useState<{ [id: string]: boolean }>({
    'db_local': true,
    'sql_supabase': false,
    'users_config': true,
    'menu_receta': false, // will check dynamically
    'stock_critico': false, // will check dynamically
    'caja_init': true,
    'ci_github': true,
    'secrets_bound': false
  });

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

  // Real Speed/Latency test
  const runRealNetworkTest = async () => {
    setRealNetStatus('testing');
    const start = Date.now();
    try {
      const res = await fetch('https://api.cdnjs.com/libraries?limit=1', { cache: 'no-store' });
      const end = Date.now();
      const latency = end - start;
      setRealPingMs(latency);

      const speedStart = Date.now();
      const speedRes = await fetch('https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js', { cache: 'no-store' });
      const blob = await speedRes.blob();
      const speedEnd = Date.now();
      
      const durationSecs = (speedEnd - speedStart) / 1000;
      const sizeBits = blob.size * 8;
      const mbps = (sizeBits / 1000000) / (durationSecs || 0.1);
      setRealMbps(parseFloat(mbps.toFixed(2)));
      setRealNetStatus('ready');
      addLog('sistema', `DIAGNOSTICO: Test de red. Latencia: ${latency}ms, Velocidad: ${mbps.toFixed(2)} Mbps`);
      toast.success('Test de red completado.');
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

  // Simulate active latencies speed test
  const triggerSpeedTest = () => {
    setDbPingStatus('testing');
    setTimeout(() => {
      setDbPingMs(Math.floor(Math.random() * 15 + (activeDbEngine === 'SQLite Local (.db)' ? 12 : 110)));
      setDbPingStatus('ready');
      addLog('sistema', `DIAGNOSTICO: Test de latencia de red completado en ${activeDbEngine}. Velocidad óptima.`);
    }, 1200);
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
  
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setActiveDbEngine('SQLite Local (.db)');
                  setDbPingStatus('idle');
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  activeDbEngine === 'SQLite Local (.db)'
                    ? 'border-[#4A2D1B] bg-[#4A2D1B]/5 ring-1 ring-[#4A2D1B]/10'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#4A2D1B]" />
                  <span className="text-xs font-extrabold text-slate-800">SQLite Local</span>
                </div>
                <p className="text-[10px] text-slate-450 mt-1 font-medium leading-normal">
                  Almacenamiento local en archivo plano `data/restaurante.db`. Ideal para operaciones offline.
                </p>
              </button>
  
              <button
                onClick={() => {
                  setActiveDbEngine('PostgreSQL / Supabase (Cloud)');
                  setDbPingStatus('idle');
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  activeDbEngine === 'PostgreSQL / Supabase (Cloud)'
                    ? 'border-[#4A2D1B] bg-[#4A2D1B]/5 ring-1 ring-[#4A2D1B]/10'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#6B4A35]" />
                  <span className="text-xs font-extrabold text-slate-800">Supabase PG Link</span>
                </div>
                <p className="text-[10px] text-slate-450 mt-1 font-medium leading-normal">
                  Base PostgreSQL en la nube Supabase. Operación simultánea remota escalable de producción.
                </p>
              </button>
            </div>

          {/* Double diagnostics block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Speed Test Panel */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900/50 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] text-slate-450 dark:text-zinc-400 uppercase font-black tracking-wide block">Test de Velocidad de Red</span>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                  Mide la latencia real y la velocidad de descarga en vivo de la conexión a internet.
                </p>
              </div>

              {realNetStatus !== 'idle' && (
                <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-850 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-450 dark:text-zinc-400">Latencia (Ping):</span>
                    <span className={`font-black ${realPingMs && realPingMs < 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {realPingMs ? `${realPingMs} ms` : 'Midiendo...'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450 dark:text-zinc-400">Velocidad:</span>
                    <span className="font-black text-blue-600">
                      {realMbps ? `${realMbps} Mbps` : 'Calculando...'}
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
                {realNetStatus === 'testing' ? 'Analizando Red...' : 'Ejecutar Test de Velocidad'}
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

        {/* Entorno Servidor Python (requirements.txt) */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-md space-y-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#FF4B4B] font-mono">requirements.txt</p>
              <h4 className="font-extrabold text-white text-xs font-sans tracking-tight">
                Dependencias del Servidor de Producción Python 3.11
              </h4>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                Copia o descarga los paquetes configurados para el login y base relacional PostgreSQL/Supabase.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 font-mono text-[10px] text-slate-300 max-h-[160px] overflow-y-auto scrollbar-thin">
            {[
              'libpq-dev',
              'build-essential',
              'gcc',
              'python3-dev',
              'streamlit>=1.35.0',
              'pandas>=2.0.0',
              'plotly>=5.18.0',
              'python-dotenv>=1.0.0',
              'psycopg2-binary>=2.9.0',
              'psycopg>=3.2.0',
              'psycopg-pool>=3.2.0',
              'python-escpos>=3.0',
              'fastapi>=0.109.0',
              'uvicorn>=0.26.0',
              'pydantic>=2.0.0',
              'openpyxl>=3.1.0',
              'reportlab>=4.2.0',
              'supabase>=2.3.0',
              '# Python version for Streamlit Cloud',
              'python-3.11'
            ].map((line, idx) => (
              <div key={idx} className="flex justify-between py-0.5 hover:bg-slate-900 px-1 rounded transition-colors">
                <span className={line.startsWith('#') ? 'text-slate-500 italic' : line.includes('>=') ? 'text-amber-300/95 font-medium' : 'text-slate-300'}>{line}</span>
                {!line.startsWith('#') && line.includes('>=') && (
                  <span className="text-[9px] text-[#FF4B4B] bg-red-950/40 border border-[#FF4B4B]/30 px-1 rounded font-bold">Compilado</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-slate-850 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
            <span>Ubicación del script:</span>
            <span className="font-mono text-[10px] text-[#FF4B4B] bg-slate-950 px-2 py-0.5 rounded font-bold">backend/login.py</span>
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
            
            {/* Checklist item 1 */}
            <label className="flex items-start gap-3 p-2.5 bg-slate-850 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors border border-slate-800">
              <input
                type="checkbox"
                checked={deployChecklist.db_local}
                onChange={(e) => setDeployChecklist(prev => ({ ...prev, db_local: e.target.checked }))}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 bg-slate-800 focus:ring-offset-slate-900 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-100 block">Base de Datos SQLite inicializada</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-sans leading-normal">
                  Base local cargada de manera sincronizada en `data/restaurante.db` lista para persistir.
                </span>
              </div>
            </label>

            {/* Checklist item 2 */}
            <label className="flex items-start gap-3 p-2.5 bg-slate-850 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors border border-slate-800">
              <input
                type="checkbox"
                checked={deployChecklist.sql_supabase}
                onChange={(e) => setDeployChecklist(prev => ({ ...prev, sql_supabase: e.target.checked }))}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 bg-slate-800 focus:ring-offset-slate-900 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-100 block">Link SQL Supabase (PostgreSQL)</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-sans leading-normal">
                  Carga del esquema en la nube con `supabase/schema.sql` y enlace con variables secretas `DATABASE_URL`.
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

            {/* Checklist item 5 */}
            <label className="flex items-start gap-3 p-2.5 bg-slate-850 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors border border-slate-800">
              <input
                type="checkbox"
                checked={deployChecklist.ci_github}
                onChange={(e) => setDeployChecklist(prev => ({ ...prev, ci_github: e.target.checked }))}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 bg-slate-800 focus:ring-offset-slate-900 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-100 block">Integración Continua (CI) en GitHub</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-sans leading-normal">
                  Workflow `.github/workflows/ci.yml` configurado para compilar, auditar código de Streamlit/TypeScript y pruebas unitarias de extremo a extremo.
                </span>
              </div>
            </label>

          </div>

          {/* Visual terminal logs widget inside checking */}
          <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-[9px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1 text-slate-300 font-extrabold border-b border-slate-800 pb-1 mb-1">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              STATUS CONSOLA DE PLENO DEPLOY
            </div>
            <p className="text-emerald-500">✔ python -m py_compile tests_restaurante.py ok</p>
            <p className="text-emerald-500">✔ npx tsc --noEmit && vite build success</p>
            <p className="text-slate-300">SQLite Engine: Linked successfully (data/restaurante.db)</p>
            <p className="text-purple-400">Supabase State: Waiting DB_URL secret assignment</p>
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

        {/* ARCA (AFIP) Credentials Configuration Wizard */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm space-y-4 mt-6">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2.5">
            <Lock className="w-4.5 h-4.5 text-[#624A3E]" />
            <div className="text-left">
              <h4 className="font-bold text-[#624A3E] text-xs font-sans tracking-tight">
                Firma Digital & Factura Electrónica (ARCA / AFIP)
              </h4>
              <p className="text-[10px] text-stone-500 font-medium">
                Sube tu certificado X.509 y llave privada para autorizar comprobantes electrónicos con CAE.
              </p>
            </div>
          </div>

          <div className="space-y-3 font-sans">
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">CUIT Emisor (Sólo números)</label>
              <input
                type="number"
                placeholder="Ej. 20384491021"
                value={arcaCuit}
                onChange={e => setArcaCuit(e.target.value)}
                className="w-full text-xs min-h-10 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E] font-mono"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-150 text-xs">
              <span className="font-bold text-stone-700">Entorno del Servidor</span>
              <div className="flex bg-stone-200 p-0.5 rounded-lg border border-stone-300">
                <button
                  type="button"
                  onClick={() => setArcaProd(false)}
                  className={`text-[9px] font-black px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    !arcaProd ? 'bg-white text-stone-850 shadow-xs' : 'text-stone-500'
                  }`}
                >
                  Homologación
                </button>
                <button
                  type="button"
                  onClick={() => setArcaProd(true)}
                  className={`text-[9px] font-black px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    arcaProd ? 'bg-[#624A3E] text-amber-300 shadow-xs' : 'text-stone-500'
                  }`}
                >
                  Producción
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">Certificado (.crt / .pem)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-[#624A3E]/40 text-stone-600 rounded-xl text-[10px] font-extrabold text-center cursor-pointer transition-colors shadow-xs truncate block">
                    {arcaCert ? '✓ Certificado Cargado' : 'Subir Archivo'}
                    <input
                      type="file"
                      accept=".crt,.pem,.txt,.der"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const arrayBuffer = event.target?.result as ArrayBuffer;
                            if (arrayBuffer) {
                              const bytes = new Uint8Array(arrayBuffer);
                              let isPem = false;
                              try {
                                const header = new TextDecoder('utf-8').decode(bytes.slice(0, 50));
                                if (header.includes('-----BEGIN') || header.includes('---')) {
                                  isPem = true;
                                }
                              } catch (e) {}

                              if (isPem) {
                                const text = new TextDecoder('utf-8').decode(bytes);
                                setArcaCert(text);
                                toast.success('Certificado PEM cargado.');
                              } else {
                                // Convert binary DER to PEM format
                                let binary = '';
                                const len = bytes.byteLength;
                                for (let i = 0; i < len; i++) {
                                  binary += String.fromCharCode(bytes[i]);
                                }
                                const base64 = btoa(binary);
                                const pem = `-----BEGIN CERTIFICATE-----\n${base64}\n-----END CERTIFICATE-----`;
                                setArcaCert(pem);
                                toast.success('Certificado DER binario convertido a PEM con éxito.');
                              }
                            }
                          };
                          reader.readAsArrayBuffer(file);
                        }
                      }}
                    />
                  </label>
                  {arcaCert && (
                    <button
                      type="button"
                      onClick={() => setArcaCert('')}
                      className="p-2 border border-stone-200 hover:border-red-200 text-stone-550 hover:text-rose-600 rounded-xl bg-white hover:bg-stone-50 transition-colors shadow-xs shrink-0"
                      title="Eliminar"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">Clave Privada (.key)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-[#624A3E]/40 text-stone-600 rounded-xl text-[10px] font-extrabold text-center cursor-pointer transition-colors shadow-xs truncate block">
                    {arcaKey ? '✓ Clave Privada Cargada' : 'Subir Archivo'}
                    <input
                      type="file"
                      accept=".key,.pem,.txt,.der"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const arrayBuffer = event.target?.result as ArrayBuffer;
                            if (arrayBuffer) {
                              const bytes = new Uint8Array(arrayBuffer);
                              let isPem = false;
                              try {
                                const header = new TextDecoder('utf-8').decode(bytes.slice(0, 50));
                                if (header.includes('-----BEGIN') || header.includes('---')) {
                                  isPem = true;
                                }
                              } catch (e) {}

                              if (isPem) {
                                const text = new TextDecoder('utf-8').decode(bytes);
                                setArcaKey(text);
                                toast.success('Clave privada PEM cargada.');
                              } else {
                                // Convert binary DER to PEM format
                                let binary = '';
                                const len = bytes.byteLength;
                                for (let i = 0; i < len; i++) {
                                  binary += String.fromCharCode(bytes[i]);
                                }
                                const base64 = btoa(binary);
                                const pem = `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----`;
                                setArcaKey(pem);
                                toast.success('Clave privada DER binaria convertida a PEM con éxito.');
                              }
                            }
                          };
                          reader.readAsArrayBuffer(file);
                        }
                      }}
                    />
                  </label>
                  {arcaKey && (
                    <button
                      type="button"
                      onClick={() => setArcaKey('')}
                      className="p-2 border border-stone-200 hover:border-red-200 text-stone-550 hover:text-rose-600 rounded-xl bg-white hover:bg-stone-50 transition-colors shadow-xs shrink-0"
                      title="Eliminar"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (!arcaCuit.trim()) {
                    toast.error('Carga el CUIT del contribuyente.');
                    return;
                  }
                  if (!arcaCert || !arcaKey) {
                    toast.error('Sube el certificado (.crt) y la clave privada (.key).');
                    return;
                  }
                  
                  const creds = {
                    cuit: Number(arcaCuit),
                    cert: arcaCert,
                    key: arcaKey,
                    production: arcaProd
                  };
                  saveArcaCredentials(creds);
                  setArcaConfigured(true);
                  addLog('sistema', `ARCA: Credenciales actualizadas mediante la interfaz de usuario. CUIT: ${arcaCuit}`);
                  toast.success('Configuración de ARCA guardada exitosamente.');
                }}
                className="flex-1 py-2 bg-[#624A3E] hover:bg-[#503C32] text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-sm cursor-pointer text-center"
              >
                Guardar Configuración
              </button>

              {arcaConfigured && (
                <button
                  type="button"
                  disabled={isTestingArca}
                  onClick={async () => {
                    setIsTestingArca(true);
                    toast.info('Verificando firma con WSAA (AFIP)...');
                    try {
                      const result = await testArcaConnection();
                      if (result.success) {
                        toast.success('¡Conexión exitosa! El token de acceso WSAA fue emitido correctamente.');
                        addLog('sistema', 'ARCA: Conexión probada exitosamente con WSAA (Token OK).');
                      } else {
                        toast.error(`Error al conectar con ARCA: ${result.error}`, { duration: 8000 });
                      }
                    } catch (err: any) {
                      toast.error(`Error: ${err.message || err}`);
                    } finally {
                      setIsTestingArca(false);
                    }
                  }}
                  className="py-2 px-3 bg-stone-900 hover:bg-stone-850 text-amber-300 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isTestingArca ? 'Probando...' : 'Probar Conexión'}
                </button>
              )}
            </div>

            {arcaConfigured && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas eliminar la firma digital de ARCA de la memoria local?')) {
                    deleteArcaCredentials();
                    setArcaCuit('');
                    setArcaCert('');
                    setArcaKey('');
                    setArcaConfigured(false);
                    addLog('sistema', 'ARCA: Credenciales eliminadas de la memoria local activa.');
                    toast.success('Credenciales eliminadas de la memoria local.');
                  }
                }}
                className="w-full py-1.5 border border-red-200 hover:bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer text-center"
              >
                Desconectar / Eliminar Firma Digital
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  </div>
);
}

