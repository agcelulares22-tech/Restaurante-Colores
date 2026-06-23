import React, { useEffect, useState, useMemo } from 'react';
import { 
  Clock, 
  MapPin, 
  UserCheck, 
  Download, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  ExternalLink,
  Filter,
  Users
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
  const [direccionResolvida, setDireccionResolvida] = useState<string>('');

  // Helper function to convert lat/lng to street address using Nominatim (OpenStreetMap)
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
            'User-Agent': 'ColoresPizzeriaAttendanceModule/1.0'
          }
        }
      );
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      if (data && data.address) {
        const road = data.address.road || data.address.pedestrian || data.address.suburb || '';
        const houseNumber = data.address.house_number || '';
        if (road && houseNumber) {
          return `${road} ${houseNumber}`;
        } else if (road) {
          return `${road} (Sin altura)`;
        } else if (data.display_name) {
          return data.display_name.split(',')[0];
        }
      }
      return 'Dirección no identificada';
    } catch (e) {
      console.error('Error reverse geocoding:', e);
      return 'Error al obtener dirección';
    }
  };

  // Filtering states
  const [filterEmpleado, setFilterEmpleado] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterFecha, setFilterFecha] = useState<'hoy' | '7dias' | 'todos'>('todos');

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

    const successCallback = async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      setCoords({
        latitude: lat,
        longitude: lon,
        accuracy: position.coords.accuracy
      });
      setLocationStatus('success');
      try {
        const address = await reverseGeocode(lat, lon);
        setDireccionResolvida(address);
      } catch (err) {
        console.warn('Geocoding error:', err);
      }
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error('Error obtaining GPS coordinates (high accuracy):', error);
      
      // Si el error es denegación de permisos, no reintentamos (ya está denegado por el usuario)
      if (error.code === error.PERMISSION_DENIED) {
        setLocationStatus('error');
        setGpsErrorMsg('Permiso de ubicación denegado por el usuario.');
        return;
      }

      // Si es otro tipo de error (Timeout o Posición no disponible), intentamos con precisión baja (red móvil/wifi)
      console.log('Reintentando geolocalización con baja precisión...');
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (fallbackError) => {
          console.error('Error obtaining GPS coordinates (low accuracy):', fallbackError);
          setLocationStatus('error');
          switch (fallbackError.code) {
            case fallbackError.POSITION_UNAVAILABLE:
              setGpsErrorMsg('Información de ubicación no disponible (GPS desactivado o sin señal).');
              break;
            case fallbackError.TIMEOUT:
              setGpsErrorMsg('Tiempo de espera agotado al obtener ubicación.');
              break;
            default:
              setGpsErrorMsg('Error desconocido de geolocalización.');
          }
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    });
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
      toast.warning('Se registrará el fichaje sin geolocalización (GPS desactivado o sin permisos).');
    }

    const payload: Omit<RegistroAsistencia, 'id'> = {
      id_usuario: activeUser.id_usuario,
      nombre_empleado: `${activeUser.nombre} ${activeUser.apellido || ''}`.trim(),
      tipo,
      fecha_hora: new Date(),
      latitud: coords?.latitude,
      longitud: coords?.longitude,
      precision: coords?.accuracy,
      dispositivo: navigator.userAgent,
      direccion: direccionResolvida || undefined
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
      const statsResult = await asistenciaService.sincronizarFichajes();
      if (statsResult.synced > 0) {
        toast.success(`Se sincronizaron ${statsResult.synced} fichajes offline.`);
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

  // Localized date utilities
  const formatDateTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const dia = d.toLocaleDateString('es-AR', { weekday: 'long' });
    const fecha = d.toLocaleDateString('es-AR');
    const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return { dia, fecha, hora };
  };

  const offlineLogsCount = asistenciaService.getOfflineFichajes().length;

  // Real-time statistics for owner
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fichajesHoy = fichajes.filter(f => {
      return new Date(f.fecha_hora) >= today;
    });

    // Empleados activos ahora (último fichaje de hoy es un 'ingreso')
    const ultimoFichajeMap = new Map<string, string>();
    [...fichajesHoy]
      .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
      .forEach(f => {
        ultimoFichajeMap.set(f.nombre_empleado, f.tipo);
      });

    const activos = Array.from(ultimoFichajeMap.entries())
      .filter(([_, tipo]) => tipo === 'ingreso')
      .map(([nombre]) => nombre);

    return {
      fichajesHoy: fichajesHoy.length,
      activos: activos
    };
  }, [fichajes]);

  // List of unique employee names for filtering
  const uniqueEmpleados = useMemo(() => {
    const set = new Set<string>();
    fichajes.forEach(f => set.add(f.nombre_empleado));
    return Array.from(set).sort();
  }, [fichajes]);

  // Apply filters
  const filteredFichajes = useMemo(() => {
    return fichajes.filter(f => {
      // General permission filtering
      const matchesUser = isAdmin || f.id_usuario === activeUser?.id_usuario;
      if (!matchesUser) return false;

      // Filter by Employee
      if (filterEmpleado !== 'todos' && f.nombre_empleado !== filterEmpleado) return false;

      // Filter by Type
      if (filterTipo !== 'todos' && f.tipo !== filterTipo) return false;

      // Filter by Date
      if (filterFecha === 'hoy') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(f.fecha_hora) >= today;
      } else if (filterFecha === '7dias') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return new Date(f.fecha_hora) >= sevenDaysAgo;
      }

      return true;
    });
  }, [fichajes, filterEmpleado, filterTipo, filterFecha, isAdmin, activeUser]);

  // CSV Export for Owners
  const handleExportCsv = () => {
    if (filteredFichajes.length === 0) {
      toast.error('No hay fichajes disponibles para exportar con los filtros actuales.');
      return;
    }

    const headers = ['ID Usuario', 'Empleado', 'Tipo', 'Fecha', 'Hora', 'Día', 'Latitud', 'Longitud', 'Precisión (m)', 'Dispositivo'];
    const csvRows = [headers.join(';')];

    filteredFichajes.forEach(f => {
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
    link.setAttribute('download', `Fichajes_Filtrados_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow transition-colors active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar Offline ({offlineLogsCount})
            </button>
          )}

          <div className="flex items-center gap-2 bg-[#22C55E]/10 px-4 py-1.5 rounded-full border border-[#22C55E]/20 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[10px] uppercase font-black text-[#22C55E] tracking-wider">Terminal GPS Activa</span>
          </div>

          <button
            onClick={() => {
              window.location.reload();
            }}
            className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-stone-800 rounded-lg transition-colors border border-stone-200 cursor-pointer"
            title="Forzar recarga completa (Soluciona problemas de caché)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ADMIN METRICS DASHBOARD */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-stone-400">Personal Activo Ahora</span>
              <h3 className="text-2xl font-black text-stone-850 mt-0.5">{stats.activos.length}</h3>
              <p className="text-[10px] text-stone-500 leading-tight mt-0.5 truncate max-w-[300px]">
                {stats.activos.length > 0 ? stats.activos.join(', ') : 'Ningún empleado ha fichado ingreso hoy'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-stone-400">Total Fichajes Hoy</span>
              <h3 className="text-2xl font-black text-stone-850 mt-0.5">{stats.fichajesHoy}</h3>
              <p className="text-[10px] text-stone-500 leading-tight mt-0.5">Fichajes totales registrados durante la jornada de hoy</p>
            </div>
          </div>
        </div>
      )}

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
                    {direccionResolvida && (
                      <p className="font-extrabold text-stone-850 text-sm py-0.5">📍 {direccionResolvida}</p>
                    )}
                    <p className="font-mono text-[9px] text-slate-400">Lat: {coords.latitude.toFixed(6)}, Lng: {coords.longitude.toFixed(6)}</p>
                    <p className="text-[9px] text-slate-400">Precisión estimada: ±{coords.accuracy.toFixed(1)} metros</p>
                  </div>
                ) : locationStatus === 'requesting' ? (
                  <p className="text-xs text-slate-600 font-medium">Obteniendo coordenadas satelitales...</p>
                ) : (
                  <div className="text-xs text-rose-800 space-y-2">
                    <p className="font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Error de Geolocalización</p>
                    <p className="text-[10px] mt-0.5 opacity-90">{gpsErrorMsg}</p>
                    
                    {gpsErrorMsg.includes('denegado') && (
                      <div className="mt-2 p-2.5 bg-rose-100/60 rounded-lg border border-rose-200/50 text-[10px] leading-normal text-rose-950 space-y-1">
                        <p className="font-extrabold uppercase tracking-wider text-[8px] text-rose-800">💡 ¿Cómo activar el GPS en tu navegador?</p>
                        <ol className="list-decimal list-inside space-y-1 text-stone-700">
                          <li>Toca el candado 🔒 o ícono de ajustes a la izquierda de <strong>restaurante-colores.vercel.app</strong> en la barra superior.</li>
                          <li>Busca la opción <strong>Ubicación</strong> (Location) y cámbiala a <strong>Permitir</strong> (Allow).</li>
                          <li>Toca el botón <strong>"Reintentar conexión GPS"</strong> abajo o recarga el sitio.</li>
                        </ol>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <button 
                        onClick={requestLocation}
                        className="mt-2 text-[10px] font-bold text-rose-600 underline hover:text-rose-850 cursor-pointer bg-transparent border-0 p-0"
                      >
                        Reintentar conexión GPS
                      </button>
                      <button 
                        onClick={() => {
                          setCoords({
                            latitude: -33.122394,
                            longitude: -64.348981,
                            accuracy: 12
                          });
                          setDireccionResolvida('Alvear 1362');
                          setLocationStatus('success');
                          toast.success('GPS simulado con éxito (Alvear 1362, Cba) 📍');
                        }}
                        className="mt-2 text-[10px] font-bold text-amber-600 underline hover:text-amber-850 cursor-pointer bg-transparent border-0 p-0"
                        title="Simular coordenadas de prueba para demostración"
                      >
                        Simular GPS (Demo)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warning when GPS failed but clock-in is still allowed */}
            {locationStatus === 'error' && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-800 font-semibold text-center leading-normal">
                ⚠️ Geolocalización inactiva. Fichajes permitidos sin GPS. Las coordenadas se registrarán como vacías.
              </div>
            )}

            {/* CHECK-IN ACTIONS - Always functional except during GPS query load */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleFichar('ingreso')}
                disabled={locationStatus === 'requesting'}
                className="py-4 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-100 disabled:text-stone-400 disabled:border-stone-200 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm flex flex-col items-center justify-center gap-2 shadow-sm border border-emerald-700/10 cursor-pointer active:scale-95 transition-all"
              >
                <span className="text-2xl">📥</span>
                Fichar Ingreso
              </button>

              <button
                onClick={() => handleFichar('egreso')}
                disabled={locationStatus === 'requesting'}
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
            
            {/* Header & CSV export button */}
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
                  className="py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-brand-yellow" />
                  Exportar Filtrado (.csv)
                </button>
              )}
            </div>

            {/* ADVANCED FILTERS (Admin only) */}
            {isAdmin && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                
                {/* Employee Filter */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3" /> Empleado
                  </label>
                  <select
                    value={filterEmpleado}
                    onChange={(e) => setFilterEmpleado(e.target.value)}
                    className="w-full bg-white border border-stone-200 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-brand-orange text-stone-750"
                  >
                    <option value="todos">Todos los empleados</option>
                    {uniqueEmpleados.map((nombre, i) => (
                      <option key={i} value={nombre}>{nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Tipo de registro
                  </label>
                  <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="w-full bg-white border border-stone-200 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-brand-orange text-stone-750"
                  >
                    <option value="todos">Todos los tipos</option>
                    <option value="ingreso">Ingresos (📥)</option>
                    <option value="egreso">Egresos (📤)</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Rango temporal
                  </label>
                  <select
                    value={filterFecha}
                    onChange={(e) => setFilterFecha(e.target.value as any)}
                    className="w-full bg-white border border-stone-200 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-brand-orange text-stone-750"
                  >
                    <option value="todos">Todo el historial</option>
                    <option value="hoy">Sólo hoy</option>
                    <option value="7dias">Últimos 7 días</option>
                  </select>
                </div>

              </div>
            )}

            {/* RENDER LOGS LIST */}
            {loading ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                Cargando registros...
              </div>
            ) : filteredFichajes.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-sm italic">
                No hay fichajes registrados con los criterios seleccionados.
              </div>
            ) : (
              <div className="space-y-3">
                
                {/* 1. DESKTOP VIEW: Clean detailed table */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-150 text-[10px] font-black text-stone-400 uppercase tracking-wider bg-stone-50">
                        {isAdmin && <th className="py-2.5 px-3">Empleado</th>}
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Día</th>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Hora</th>
                        <th className="py-2.5 px-3">Dirección (GPS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFichajes.map((f, idx) => {
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
                            <td className="py-3 px-3 max-w-[220px] truncate">
                              {googleMapsUrl ? (
                                <a
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-orange font-bold flex items-center gap-1 hover:underline text-[10px] cursor-pointer"
                                  title={`Ver en mapa: ${f.latitud}, ${f.longitud}`}
                                >
                                  <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                                  <span className="truncate">{f.direccion || `${f.latitud.toFixed(5)}, ${f.longitud.toFixed(5)}`}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">Sin GPS</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 2. MOBILE VIEW: Responsive card layout */}
                <div className="grid grid-cols-1 gap-2 md:hidden">
                  {filteredFichajes.map((f, idx) => {
                    const { dia, fecha, hora } = formatDateTime(f.fecha_hora);
                    const googleMapsUrl = f.latitud && f.longitud 
                      ? `https://www.google.com/maps?q=${f.latitud},${f.longitud}` 
                      : null;

                    return (
                      <div key={idx} className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-2 text-left">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-stone-850 text-xs">
                            {f.nombre_empleado}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            f.tipo === 'ingreso' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {f.tipo}
                          </span>
                        </div>

                        <div className="text-[10px] text-stone-500 space-y-0.5 text-left">
                          <p>📅 <strong className="capitalize">{dia}</strong> - {fecha}</p>
                          <p>🕒 Hora: <strong className="text-stone-800">{hora} hs</strong></p>
                          {f.direccion && (
                            <p className="text-stone-750 font-semibold mt-1">📍 {f.direccion}</p>
                          )}
                        </div>

                        <div className="pt-1.5 border-t border-stone-100 flex justify-between items-center">
                          <span className="text-[9px] text-stone-450 font-mono truncate max-w-[200px]" title={f.dispositivo || ''}>
                            📱 {f.dispositivo ? f.dispositivo.split(') ')[0].substring(0, 30) + '...' : 'Dispositivo desconocido'}
                          </span>
                          
                          {googleMapsUrl ? (
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-orange font-bold flex items-center gap-1 hover:underline text-[10px] cursor-pointer"
                            >
                              <MapPin className="w-3 h-3" />
                              Ver Mapa
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-[9px]">Sin GPS</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
