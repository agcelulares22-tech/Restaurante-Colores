import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle, Clock, Trash, Search, X, AlertTriangle, Download } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { backupsService, BackupSnapshotData, Checkpoint, parseBackupContent } from '../services/backupsService';
import { EventoLog, Insumo, Merma, Mesa, Pedido, ProductoMenu, RecetaEscandallo, Usuario } from '../types';
import { usuariosService } from '../services/usuariosService';
import { mesasService } from '../services/mesasService';
import { insumosService } from '../services/insumosService';
import { menuService } from '../services/menuService';
import { recetasService } from '../services/recetasService';
import { pedidosService } from '../services/pedidosService';
import { mermasService } from '../services/mermasService';
import { proveedoresService } from '../services/proveedoresService';
import { promocionesService } from '../services/promocionesService';
import { reservasService } from '../services/reservasService';
import { facturacionService } from '../services/facturacionService';
import { auditoriaService } from '../services/auditoriaService';
import { ToastContainer, useToast } from './ToastContainer';

interface BackupsModuleProps {
  operationalData: {
    usuarios: Usuario[];
    mesas: Mesa[];
    insumos: Insumo[];
    productosMenu: ProductoMenu[];
    recetas: RecetaEscandallo[];
    pedidos: Pedido[];
    mermas: Merma[];
    logs: EventoLog[];
  };
  onRestoreData: (snapshot: BackupSnapshotData) => void;
  addLog: (tipo: EventoLog['tipo'], mensaje: string) => void;
}

export default function BackupsModule({
  operationalData,
  onRestoreData,
  addLog
}: BackupsModuleProps) {
  const { toast, toasts, removeToast } = useToast();
  const [backups, setBackups] = useState<Checkpoint[]>([]);
  const [searchBackup, setSearchBackup] = useState('');
  const debouncedSearchBackup = useDebounce(searchBackup, 300);
  const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete'; cp: Checkpoint } | null>(null);

  const filteredBackups = backups.filter(cp =>
    cp.nombre.toLowerCase().includes(debouncedSearchBackup.toLowerCase())
  );

  useEffect(() => {
    backupsService.list().then(setBackups).catch(() => {
      toast.error('No se pudo cargar el historial de respaldos.');
    });
  }, []);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  const [dragActive, setDragActive] = useState(false);
  const [droppedFileSummary, setDroppedFileSummary] = useState<{
    fileName: string;
    snapshotData: BackupSnapshotData;
    counts: {
      usuarios: number;
      mesas: number;
      insumos: number;
      productosMenu: number;
      pedidos: number;
      reservas: number;
    };
  } | null>(null);


  const handleCreateBackup = async () => {
    setBackingUp(true);
    addLog('sistema', `SISTEMA: Iniciando volcado completo de base de datos Postgres...`);
    try {
      // Gather active operational state from all entities
      const [
        usuarios,
        mesas,
        insumos,
        productosMenu,
        recetas,
        pedidos,
        mermas,
        proveedores,
        promociones,
        reservas,
        facturas,
        logs
      ] = await Promise.all([
        usuariosService.list().catch(() => operationalData.usuarios),
        mesasService.list().catch(() => operationalData.mesas),
        insumosService.list().catch(() => operationalData.insumos),
        menuService.list().catch(() => operationalData.productosMenu),
        recetasService.list().catch(() => operationalData.recetas),
        pedidosService.list().catch(() => operationalData.pedidos),
        mermasService.list().catch(() => operationalData.mermas),
        proveedoresService.list().catch(() => []),
        promocionesService.list().catch(() => []),
        reservasService.list().catch(() => []),
        facturacionService.list().catch(() => []),
        auditoriaService.list().catch(() => operationalData.logs)
      ]);

      const snapshot = {
        meta: {
          exportado: new Date().toISOString(),
          version: '1.2.0-Supabase'
        },
        data: {
          usuarios,
          mesas,
          insumos,
          productosMenu,
          recetas,
          pedidos,
          mermas,
          proveedores,
          promociones,
          reservas,
          facturas,
          logs
        }
      };

      const newBackup = await backupsService.create({
        nombre: `Punto de Control Completo (${new Date().toLocaleTimeString('es-AR')})`,
        dataToDump: snapshot.data
      });
      setBackups(prev => [newBackup, ...prev]);
      
      // Auto-trigger native JSON download in user browser to satisfy "export JSON"
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `restaurante_snapshot_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      addLog('sistema', `SISTEMA: Copia de seguridad guardada en Supabase y descargada como JSON.`);
      toast.success(
        newBackup.ubicacion === 'cloud'
          ? 'Respaldo guardado localmente y sincronizado con Supabase.'
          : 'Respaldo descargado y guardado localmente. Supabase no estaba disponible.'
      );
    } catch (error: any) {
      console.error(error);
      addLog('sistema', `ERROR: Falló el volcado automático del sistema: ${error.message}`);
      toast.error(`No se pudo crear el respaldo: ${error.message}`);
    } finally {
      setBackingUp(false);
    }
  };

  // Drag & Drop restoration bridge handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processUploadedFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processUploadedFile(file);
    }
  };

  const processUploadedFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast.error('Por favor, selecciona un archivo JSON de respaldo válido.');
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      const validatedData = parseBackupContent(parsed);
      if (!validatedData) {
        toast.error('El formato del archivo JSON no corresponde a un respaldo válido de la aplicación.');
        return;
      }

      setDroppedFileSummary({
        fileName: file.name,
        snapshotData: validatedData,
        counts: {
          usuarios: validatedData.usuarios?.length || 0,
          mesas: validatedData.mesas?.length || 0,
          insumos: validatedData.insumos?.length || 0,
          productosMenu: validatedData.productosMenu?.length || 0,
          pedidos: validatedData.pedidos?.length || 0,
          reservas: validatedData.reservas?.length || 0,
        }
      });
      toast.info('Archivo de respaldo cargado y verificado. Listo para restaurar.');
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al procesar el archivo JSON: ${err.message || 'JSON inválido.'}`);
    }
  };

  const handleConfirmDroppedRestore = async () => {
    if (!droppedFileSummary) return;
    setBackingUp(true);
    addLog('sistema', `SISTEMA: Iniciando restauración desde archivo JSON '${droppedFileSummary.fileName}'`);
    try {
      await backupsService.restore(droppedFileSummary.snapshotData);
      onRestoreData(droppedFileSummary.snapshotData);
      toast.success('Restauración completada. Los datos operativos se han sobrescrito con el respaldo.');
      setDroppedFileSummary(null);
    } catch (err: any) {
      toast.error(`Error al aplicar la restauración: ${err.message}`);
    } finally {
      setBackingUp(false);
    }
  };

  const [restoredOk, setRestoredOk] = useState<string | null>(null);

  const handleRestoreBackup = async (cp: Checkpoint) => {
    setConfirmAction({ type: 'restore', cp });
  };

  const executeRestore = async (cp: Checkpoint) => {
    setConfirmAction(null);
    setLoadingId(cp.id_cp);
    try {
      const snapshot = parseBackupContent(cp.contenido);
      await backupsService.restore(snapshot);
      onRestoreData(snapshot);
      addLog('sistema', `SISTEMA: Estado operativo y Supabase restaurados desde el punto de control '${cp.nombre}'.`);
      setRestoredOk(`El punto '${cp.nombre}' se restauró correctamente.`);
      toast.success('Estado operativo restaurado desde la copia seleccionada.');
      setTimeout(() => setRestoredOk(null), 6000);
    } catch (error: any) {
      addLog('sistema', `ERROR: No se pudo restaurar '${cp.nombre}': ${error.message}`);
      toast.error(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteBackup = (id: string) => {
    const cp = backups.find(c => c.id_cp === id);
    if (cp) setConfirmAction({ type: 'delete', cp });
  };

  const executeDelete = async (id: string) => {
    setConfirmAction(null);
    setBackups(prev => prev.filter(c => c.id_cp !== id));
    const removedFromCloud = await backupsService.remove(id);
    addLog('sistema', `SISTEMA: Registro de checkpoint eliminado de la tabla backups.`);
    toast.info(removedFromCloud ? 'Respaldo eliminado.' : 'Respaldo local eliminado; no se pudo confirmar el borrado remoto.');
  };

  return (
    <div className="space-y-6">
      
      {/* Storage stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Respaldo Local</span>
          <h4 className="text-2xl font-black text-emerald-600 font-mono mt-1">Disponible</h4>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Base de Datos</span>
          <h4 className="text-2xl font-black text-stone-900 font-mono mt-1">Supabase PostgreSQL</h4>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-[#624A3E]/5 border-l-4 border-l-[#624A3E]">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Último Respaldo Disponible</span>
          <h4 className="text-base font-bold text-stone-700 mt-2 flex items-center gap-1">
            <Clock className="w-4 h-4 text-stone-400" />
            {backups[0]?.fecha || 'Sin respaldos'}
          </h4>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-[#624A3E]" />
              Copias de Seguridad y Respaldos (DUMP SQL / JSON)
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">Gestione y recupere el estado histórico de comandas, mermas de stock y reportes.</p>
          </div>

          <button
            onClick={handleCreateBackup}
            disabled={backingUp}
            className="w-full sm:w-auto px-4 py-2 bg-[#624A3E] hover:bg-[#503C32] disabled:bg-stone-300 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${backingUp ? 'animate-spin' : ''}`} />
            {backingUp ? 'Generando Respaldo...' : 'Crear Punto de Control'}
          </button>
        </div>

        {restoredOk && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl animate-pulse flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-extrabold text-emerald-900">Restauración Exitosa del Sistema Gastronómico</p>
              <p className="font-medium text-emerald-700/90 mt-0.5">{restoredOk}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Buscador e Historial */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative max-w-xs">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchBackup} onChange={e => setSearchBackup(e.target.value)}
                placeholder="Buscar respaldo..."
                className="w-full pl-8 pr-2 py-1.5 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:ring-1 focus:ring-[#624A3E]" />
            </div>

            <div className="space-y-3">
              {backups.length === 0 && (
                <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center bg-white dark:bg-zinc-950/30">
                  <Database className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-stone-600">Todavía no hay puntos de control reales.</p>
                  <p className="text-xs text-stone-400 mt-1">Creá un respaldo para descargarlo y conservar una copia restaurable.</p>
                </div>
              )}
              {filteredBackups.map(cp => {
                const isLoading = loadingId === cp.id_cp;
                return (
                  <div key={cp.id_cp} className="p-4 bg-white dark:bg-zinc-950/40 border border-slate-250 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-extrabold text-stone-900 dark:text-zinc-150 text-sm tracking-tight">{cp.nombre}</h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          cp.tipo === 'manual' 
                            ? 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' 
                            : 'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                        }`}>
                          {cp.tipo}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400 font-bold">
                        <span>Creado: <strong className="text-stone-500 font-mono">{cp.fecha}</strong></span>
                        <span>•</span>
                        <span>Tamaño: <strong className="text-stone-500 font-mono">{cp.peso}</strong></span>
                        <span>•</span>
                        <span>Tablas: <strong className="text-stone-500">{cp.tablas_afectadas}</strong></span>
                        <span>•</span>
                        <span>Ubicación: <strong className="text-stone-500">{cp.ubicacion === 'cloud' ? 'Cloud' : 'Local'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <button
                        onClick={() => handleRestoreBackup(cp)}
                        disabled={isLoading || !cp.contenido}
                        className="flex-1 sm:flex-initial py-1.5 px-3 rounded-lg bg-orange-50 hover:bg-orange-100 disabled:bg-stone-100 text-orange-700 disabled:text-stone-400 text-[10px] font-black transition-colors flex items-center justify-center gap-1 cursor-pointer border-0"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Cargando...' : 'Restaurar'}
                      </button>

                      <button
                        onClick={() => {
                          const snapshotData = parseBackupContent(cp.contenido);
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ meta: { exportado: cp.fecha, version: '1.2.0-Manual' }, data: snapshotData }, null, 2));
                          const downloadAnchor = document.createElement('a');
                          downloadAnchor.setAttribute("href", dataStr);
                          downloadAnchor.setAttribute("download", `${cp.nombre.replace(/\s+/g, '_')}.json`);
                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();
                          downloadAnchor.remove();
                          toast.success('Respaldo descargado como archivo JSON.');
                        }}
                        disabled={!cp.contenido}
                        className="p-1.5 rounded-lg bg-stone-50 hover:bg-blue-50 text-stone-450 hover:text-blue-500 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-0"
                        title="Exportar archivo JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteBackup(cp.id_cp)}
                        className="p-1.5 rounded-lg bg-stone-50 hover:bg-rose-50 text-stone-450 hover:text-rose-500 dark:bg-zinc-900 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-0"
                        title="Borrar respaldo"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Drag and Drop Restore Zone */}
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 space-y-4">
              <div>
                <span className="text-[10px] text-slate-450 dark:text-zinc-400 uppercase font-black tracking-wide block">Restauración Manual</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Carga o arrastra un archivo `.json` de respaldo exportado anteriormente para restaurar la base de datos de manera directa.
                </p>
              </div>
              
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-[#624A3E] bg-[#624A3E]/5 dark:border-amber-700/50' 
                    : 'border-stone-300 dark:border-zinc-700 hover:border-stone-400'
                }`}
                onClick={() => document.getElementById('json-backup-upload')?.click()}
              >
                <input 
                  type="file" 
                  id="json-backup-upload" 
                  accept=".json" 
                  onChange={handleFileInputChange}
                  className="hidden" 
                />
                <Database className="w-8 h-8 text-stone-400 dark:text-zinc-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-stone-700 dark:text-zinc-300">Arrastra tu respaldo aquí</p>
                <p className="text-[10px] text-slate-450 mt-1">O haz clic para seleccionar archivo (.json)</p>
              </div>

              {droppedFileSummary && (
                <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-stone-150 dark:border-zinc-850 space-y-3 text-[11px] text-stone-850 dark:text-zinc-300">
                  <div className="border-b border-stone-100 dark:border-zinc-900 pb-1.5">
                    <p className="font-extrabold truncate">{droppedFileSummary.fileName}</p>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">Estructura validada ✔</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-stone-600 dark:text-zinc-400">
                    <div className="bg-stone-50 dark:bg-zinc-900 p-1.5 rounded">👥 Personal: <strong>{droppedFileSummary.counts.usuarios}</strong></div>
                    <div className="bg-stone-50 dark:bg-zinc-900 p-1.5 rounded">🍽 Mesas: <strong>{droppedFileSummary.counts.mesas}</strong></div>
                    <div className="bg-stone-50 dark:bg-zinc-900 p-1.5 rounded">📦 Insumos: <strong>{droppedFileSummary.counts.insumos}</strong></div>
                    <div className="bg-stone-50 dark:bg-zinc-900 p-1.5 rounded">🍕 Productos: <strong>{droppedFileSummary.counts.productosMenu}</strong></div>
                    <div className="bg-stone-50 dark:bg-zinc-900 p-1.5 rounded">🍕 Pedidos: <strong>{droppedFileSummary.counts.pedidos}</strong></div>
                    <div className="bg-stone-50 dark:bg-zinc-900 p-1.5 rounded">📅 Reservas: <strong>{droppedFileSummary.counts.reservas}</strong></div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmDroppedRestore}
                      className="flex-1 py-1.5 bg-orange-650 hover:bg-orange-600 text-white text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer border-0"
                    >
                      Restaurar Ahora
                    </button>
                    <button
                      type="button"
                      onClick={() => setDroppedFileSummary(null)}
                      className="py-1.5 px-2.5 bg-stone-100 dark:bg-zinc-900 text-stone-500 text-[10px] font-bold uppercase rounded-lg hover:bg-stone-200 transition-colors cursor-pointer border-0"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {confirmAction && (
        <div className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-stone-200 shadow-2xl overflow-hidden">
            <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700"><AlertTriangle className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-sm font-black text-amber-900 uppercase">
                    {confirmAction.type === 'restore' ? 'Restaurar Respaldo' : 'Eliminar Respaldo'}
                  </h3>
                  <p className="text-xs text-amber-700 mt-1">
                    {confirmAction.type === 'restore'
                      ? `Se restaurarán los datos del punto "${confirmAction.cp.nombre}".`
                      : `Se eliminará permanentemente "${confirmAction.cp.nombre}".`}
                  </p>
                </div>
              </div>
              <button onClick={() => setConfirmAction(null)} className="touch-target p-1 rounded-lg text-amber-500 hover:bg-amber-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-2 justify-end">
              <button onClick={() => setConfirmAction(null)}
                className="min-h-11 py-2 px-4 rounded-xl border border-stone-200 bg-white text-stone-600 text-xs font-black uppercase hover:bg-stone-50 cursor-pointer">Cancelar</button>
              <button onClick={() => confirmAction.type === 'restore' ? executeRestore(confirmAction.cp) : executeDelete(confirmAction.cp.id_cp)}
                className="min-h-11 py-2 px-4 rounded-xl bg-red-600 text-white text-xs font-black uppercase hover:bg-red-500 cursor-pointer">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
