import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { RegistroAsistencia } from '../types';

const OFFLINE_STORAGE_KEY = 'colores_pizzeria_fichajes_offline';

export const asistenciaService = {
  /**
   * Obtiene todos los fichajes locales almacenados en el búfer offline
   */
  getOfflineFichajes(): RegistroAsistencia[] {
    try {
      const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error al leer fichajes offline:', e);
      return [];
    }
  },

  /**
   * Registra un fichaje de ingreso o egreso.
   * Si está online, lo manda a Supabase. Si está offline, lo encola localmente.
   */
  async fichar(fichaje: Omit<RegistroAsistencia, 'id'>): Promise<{ success: boolean; data?: any; offline: boolean; error?: string }> {
    const client = tryGetActiveSupabaseClient();
    const newFichaje: RegistroAsistencia = {
      ...fichaje,
      fecha_hora: new Date(fichaje.fecha_hora).toISOString()
    };

    if (!client) {
      // Guardar localmente si está desconectado
      const offlineList = this.getOfflineFichajes();
      offlineList.push(newFichaje);
      try {
        localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(offlineList));
      } catch (err) {
        console.warn('No se pudo guardar en localStorage:', err);
      }
      return { success: true, offline: true };
    }

    try {
      const { data, error } = await client
        .from('registro_asistencia')
        .insert([newFichaje])
        .select();

      if (error) {
        throw error;
      }

      return { success: true, data: data?.[0], offline: false };
    } catch (err: any) {
      console.error('[asistenciaService] Error insertando en Supabase:', err);
      
      // Diferenciar error de red vs error de base de datos
      const isNetworkError = !navigator.onLine || 
        err.message?.includes('FetchError') || 
        err.message?.includes('Failed to fetch') || 
        err.status === 0;

      if (isNetworkError) {
        const offlineList = this.getOfflineFichajes();
        offlineList.push(newFichaje);
        try {
          localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(offlineList));
        } catch (e) {
          console.warn('LocalStorage falló:', e);
        }
        return { success: true, offline: true };
      }

      // Si es un error estructural de base de datos (ej. tabla no existe, permisos, etc.), fallar para poder diagnosticarlo
      return { success: false, offline: false, error: err.message || JSON.stringify(err) };
    }
  },

  /**
   * Lista todos los fichajes del sistema.
   * Si está online, los une con los locales que falte sincronizar.
   */
  async list(): Promise<RegistroAsistencia[]> {
    const client = tryGetActiveSupabaseClient();
    const offlineList = this.getOfflineFichajes();

    if (!client) {
      return [...offlineList].sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());
    }

    try {
      const { data, error } = await client
        .from('registro_asistencia')
        .select('*')
        .order('fecha_hora', { ascending: false });

      if (error) {
        throw error;
      }

      // Fusionar con registros offline no sincronizados
      const all = [...offlineList, ...(data || [])];
      return all.sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());
    } catch (err) {
      console.error('[asistenciaService] Error listing attendances:', err);
      return [...offlineList].sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());
    }
  },

  /**
   * Sincroniza fichajes guardados offline a Supabase
   */
  async sincronizarFichajes(): Promise<{ synced: number; failed: number }> {
    const client = tryGetActiveSupabaseClient();
    const offlineList = this.getOfflineFichajes();

    if (!client || offlineList.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    const remaining: RegistroAsistencia[] = [];

    for (const fichaje of offlineList) {
      try {
        const { error } = await client
          .from('registro_asistencia')
          .insert([fichaje]);
        if (error) {
          throw error;
        }
        synced++;
      } catch (e) {
        console.error('Error sincronizando fichaje offline:', e);
        remaining.push(fichaje);
        failed++;
      }
    }

    try {
      if (remaining.length === 0) {
        localStorage.removeItem(OFFLINE_STORAGE_KEY);
      } else {
        localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(remaining));
      }
    } catch (err) {
      console.warn('Error al actualizar búfer offline de fichajes:', err);
    }

    return { synced, failed };
  }
};
