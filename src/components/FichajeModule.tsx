import React, { useEffect, useState, useMemo } from 'react';
import { 
  Clock, 
  MapPin, 
  UserCheck, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { RegistroAsistencia, Usuario } from '../types';
import { asistenciaService } from '../services/asistenciaService';
import { useToast, ToastContainer } from './ToastContainer';

interface FichajeModuleProps {
  activeMozo: string;
  usuarios: Usuario[];
}

export default function FichajeModule({ activeMozo, usuarios }: FichajeModuleProps) {
  const { toast, toasts, removeToast } = useToast();
  const [fichajes, setFichajes] = useState<RegistroAsistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Geolocation states
  const [locationStatus, setLocationStatus] = useState<'requesting' | 'success' | 'error'>('requesting');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');

  // Active user details
  const activeUser = useMemo(() => {
    return usuarios.find(u => u.nombre === activeMozo);
  }, [usuarios, activeMozo]);

  const isAdmin = activeUser?.rol === 'superadmin' || activeUser?.rol === 'administrador';

  // Real-time clock for employee clock screen
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request GPS position
  const requestLocation = () => {
    setLocationStatus('requesting');
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setGpsErrorMsg('Geolocalización no soportada por el navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLocationStatus('success');
      },
      (error) => {
        console.error('Error obtaining GPS coordinates:', error);
        setLocationStatus('error');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsErrorMsg('Permiso de ubicación denegado por el usuario.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsErrorMsg('Información de ubicación no disponible.');
            break;
          case error.TIMEOUT:
            setGpsErrorMsg('Tiempo de espera agotado al obtener ubicación.');
            break;
          default:
            setGpsErrorMsg('Error desconocido de geolocalización.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Fetch clock-in logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const logs = await asistenciaService.list();
      setFichajes(logs);
    } catch (e) {
      toast.error('No se pudieron obtener los registros de asistencia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLocation();
    fetchLogs();
  }, [activeMozo]);

  // Handle Clock-in / Clock-out Action
  const handleFichar = async (tipo: 'ingreso' | 'egreso') => {
    if (!activeUser) {
      toast.error('Sesión inválida.');
      return;
    }

    if (locationStatus === 'requesting') {
      toast.info('Obteniendo ubicación del dispositivo. Espera un momento...');
      return;
    }

    if (locationStatus === 'error') {
      toast.error(`Error de GPS: ${gpsErrorMsg}. Por favor, habilita el GPS para fichar.`);
      return;
    }

    const payload: Omit<RegistroAsistencia, 'id'> = {
      id_usuario: activeUser.id_usuario,
      nombre_empleado: `${activeUser.nombre} ${activeUser.apellido || ''}`.trim(),
      tipo,
      fecha_hora: new Date(),
      latitud: coords?.latitude,
      longitud: coords?.longitude,
      precision: coords?.accuracy,
      dispositivo: navigator.userAgent
    };

    try {
      const res = await asistenciaService.fichar(payload);
      if (res.success) {
        toast.success(`Fichaje de ${tipo === 'ingreso' ? 'Ingreso 📥' : 'Egreso 📤'} registrado correctamente.`);
        fetchLogs();
      } else {
        toast.error('Ocurrió un error al intentar registrar la asistencia.');
      }
    } catch (e) {
      toast.error('Error al fichar.');
    }
  };

  // Sync offline clock-ins
  const handleSyncOffline = async () => {
    setSyncing(true);
    try {
      const stats = await asistenciaService.sincronizarFichajes();
      if (stats.synced > 0) {
        toast.success(`Se sincronizaron ${stats.synced} fichajes offline.`);
        fetchLogs();
      } else {
        toast.info('No hay fichajes offline pendientes de sincronizar.');
      }
    } catch (e) {
      toast.error('Error al sincronizar.');
    } finally {
      setSyncing(false);
    }
  };

  // CSV Export for Owners
  const handleExportCsv = () => {
    if (fichajes.length === 0) {
      toast.error('No hay fichajes disponibles para exportar.');
      return;
    }

    const headers = ['ID Usuario', 'Empleado', 'Tipo', 'Fecha', 'Hora', 'Día', 'Latitud', 'Longitud', 'Precisión (m)', 'Dispositivo'];
    const csvRows = [headers.join(';')];

    fichajes.forEach(f => {
      const d = new Date(f.fecha_hora);
      const diaSemana = d.toLocaleDateString('es-AR', { weekday: 'long' });
      const fechaStr = d.toLocaleDateString('es-AR');
      const horaStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const row = [
        f.id_usuario,
        `"${f.nombre_empleado.replace(/"/g, '""')}"`,
        f.tipo.toUpperCase(),
        fechaStr,
        horaStr,
        diaSemana,
        f.latitud || '',
        f.longitud || '',
        f.precision || '',
        `"${(f.dispositivo || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(';'));
    });

    const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fichajes_Personal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Localized date utilities
  const formatDateTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const dia = d.toLocaleDateString('es-AR', { weekday: 'long' });
    const fecha = d.toLocaleDateString('es-AR');
    const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return { dia, fecha, hora };
  };

  const offlineLogsCount = asistenciaService.getOfflineFichajes().length;

  return (
    <div className="space-y-6 w-full animate-fadeIn" id="fichaje-module-container">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Brand Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row items-center gap-5 justify-between">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center p-1 border border-yellow-200 shadow-sm shrink-0">
            <Clock className="w-6 h-6 text-brand-orange" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800 tracking-tight">Registro de Asistencia del Personal</h2>
            <p className="text-xs text-stone-500 mt-0.5">Control de jornada operativa y geolocalización de seguridad</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {offlineLogsCount > 0 && (
            <button
              onClick={handleSyncOffline}
              disabled={syncing}
              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow transition-colors active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar Offline ({offlineLogsCount})
            </button>
          )}

          <div className="flex items-center gap-2 bg-[#22C55E]/10 px-4 py-1.5 rounded-full border border-[#22C55E]/20 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[10px] uppercase font-black text-[#22C55E] tracking-wider">Terminal GPS Activa</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Geolocation Status & Live Clock check-in UI */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Clock Card */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm text-center space-y-5">
            <span className="text-[10px] uppercase font-black tracking-wider text-stone-400 block">Reloj de Control</span>
            
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl font-black font-mono text-stone-850 tracking-tight">
                {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h1>
              <p className="text-sm font-bold text-stone-500 capitalize">
                {currentTime.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/80 inline-flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-orange" />
              <span className="text-xs text-slate-600">Empleado activo: <strong className="text-stone-850">{activeUser ? `${activeUser.nombre} ${activeUser.apellido || ''}` : activeMozo}</strong></span>
            </div>

            {/* GPS Diagnostics Widget */}
            <div className={`p-4 rounded-xl border text-left flex items-start gap-3 ${
              locationStatus === 'success' ? 'bg-emerald-50/50 border-emerald-100' :
              locationStatus === 'requesting' ? 'bg-amber-50/50 border-amber-100' : 'bg-rose-50/50 border-rose-100'
            }`}>
              <MapPin className={`w-5 h-5 shrink-0 mt-0.5 ${
                locationStatus === 'success' ? 'text-emerald-600' :
                locationStatus === 'requesting' ? 'text-amber-500 animate-bounce' : 'text-rose-500'
              }`} />
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] uppercase font-black tracking-wider text-stone-400">Geolocalización GPS</span>
                {locationStatus === 'success' && coords ? (
                  <div className="text-xs text-slate-700 space-y-0.5">
                    <p className="font-semibold text-emerald-800">Ubicación capturada correctamente ✓</p>
                    <p className="font-mono text-[10px] text-slate-500">Lat: {coords.latitude.toFixed(6)}, Lng: {coords.longitude.toFixed(6)}</p>
                    <p className="text-[9px] text-slate-400">Precisión estimada: ±{coords.accuracy.toFixed(1)} metros</p>
                  </div>
                ) : locationStatus === 'requesting' ? (
                  <p className="text-xs text-slate-600 font-medium">Obteniendo coordenadas satelitales...</p>
                ) : (
                  <div className="text-xs text-rose-800">
                    <p className="font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Error de Geolocalización</p>
                    <p className="text-[10px] mt-0.5 opacity-90">{gpsErrorMsg}</p>
                    <button 
                      onClick={requestLocation}
                      className="mt-2 text-[10px] font-bold text-rose-600 underline hover:text-rose-800"
                    >
                      Reintentar conexión GPS
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* CHECK-IN ACTIONS */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleFichar('ingreso')}
                disabled={locationStatus !== 'success'}
                className="py-4 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-100 disabled:text-stone-400 disabled:border-stone-200 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm flex flex-col items-center justify-center gap-2 shadow-sm border border-emerald-700/10 cursor-pointer active:scale-95 transition-all"
              >
                <span className="text-2xl">📥</span>
                Fichar Ingreso
              </button>

              <button
                onClick={() => handleFichar('egreso')}
                disabled={locationStatus !== 'success'}
                className="py-4 px-3 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-100 disabled:text-stone-400 disabled:border-stone-200 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm flex flex-col items-center justify-center gap-2 shadow-sm border border-rose-700/10 cursor-pointer active:scale-95 transition-all"
              >
                <span className="text-2xl">📤</span>
                Fichar Egreso
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Attendances logs & Admin reports */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-850 text-sm md:text-base font-sans flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-orange" />
                  {isAdmin ? 'Panel de Control del Dueño - Fichajes de Personal' : 'Mi Historial de Asistencia Reciente'}
                </h3>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {isAdmin ? 'Reporte consolidado e historial de toda la nómina de trabajadores.' : 'Visualización de tus últimos ingresos y salidas registrados.'}
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={handleExportCsv}
                  className="py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  Exportar Informe (.csv)
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                Cargando registros...
              </div>
            ) : fichajes.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-sm italic">
                No hay fichajes registrados en el sistema.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-150 text-[10px] font-black text-stone-400 uppercase tracking-wider bg-stone-50">
                      {isAdmin && <th className="py-2.5 px-3">Empleado</th>}
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Día</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Hora</th>
                      <th className="py-2.5 px-3">GPS Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fichajes
                      .filter(f => isAdmin || f.id_usuario === activeUser?.id_usuario)
                      .map((f, idx) => {
                        const { dia, fecha, hora } = formatDateTime(f.fecha_hora);
                        const googleMapsUrl = f.latitud && f.longitud 
                          ? `https://www.google.com/maps?q=${f.latitud},${f.longitud}` 
                          : null;

                        return (
                          <tr key={idx} className="border-b border-stone-100 hover:bg-slate-50/50 transition-colors">
                            {isAdmin && (
                              <td className="py-3 px-3 font-bold text-stone-800">
                                {f.nombre_empleado}
                              </td>
                            )}
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                f.tipo === 'ingreso' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {f.tipo}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-500 capitalize">
                              {dia}
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-mono">
                              {fecha}
                            </td>
                            <td className="py-3 px-3 font-extrabold text-stone-850 font-mono">
                              {hora} hs
                            </td>
                            <td className="py-3 px-3">
                              {googleMapsUrl ? (
                                <a
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-orange font-bold flex items-center gap-1 hover:underline text-[10px]"
                                  title="Ver ubicación en Google Maps"
                                >
                                  <MapPin className="w-3 h-3" />
                                  Ver Mapa
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">No GPS</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
