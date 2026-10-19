import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { sheetsService } from './sheetsService';
import { Reserva } from '../types';

// ---------------------------------------------------------------------------
// Normalización de fechas
// Supabase/Sheets puede devolver fechas en ISO (YYYY-MM-DD) o DD/MM/YYYY.
// Esta función las unifica siempre a ISO.
// ---------------------------------------------------------------------------
function normalizarFecha(valor: string | null | undefined): string {
    if (!valor) return new Date().toISOString().split('T')[0];
    // Ya viene en ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
    // Formato DD/MM/YYYY o DD-MM-YYYY
  const parts = valor.split(/[-\/]/);
    if (parts.length === 3) {
          const [d, m, y] = parts;
          const dia  = d.padStart(2, '0');
          const mes  = m.padStart(2, '0');
          const anio = y.length === 2 ? `20${y}` : y;
          // Si el primer segmento parece año (>31) ya viene YYYY-MM-DD con separador /
      if (Number(d) > 31) return `${d}-${m.padStart(2,'0')}-${y.padStart(2,'0')}`;
          return `${anio}-${mes}-${dia}`;
    }
    return valor;
}

// ---------------------------------------------------------------------------
// Mapeo DB/Sheet → Reserva
// Centralizado para no duplicar la lógica en list() y listByFecha().
// ---------------------------------------------------------------------------
function asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function asOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
}

function asNumber(value: unknown, fallback: number): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function asOptionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizarHora(value: unknown): string {
    const raw = asString(value, '21:00 hs').trim();
    if (/^\d{1,2}:\d{2}$/.test(raw)) return `${raw.padStart(5, '0')} hs`;
    if (/^\d{1,2}:\d{2}\s*hs$/i.test(raw)) return raw.replace(/\s*hs$/i, ' hs').padStart(8, '0');
    return '21:00 hs';
}

function normalizarEstado(value: unknown): Reserva['estado'] {
    const estados: Reserva['estado'][] = ['confirmada','sentada','cancelada','pendiente','completada'];
    return typeof value === 'string' && estados.includes(value as Reserva['estado'])
      ? value as Reserva['estado']
      : 'confirmada';
}

function mapRowToReserva(r: Record<string, unknown>): Reserva {
    const idMesa = asOptionalNumber(r.id_mesa);
    const listaEspera = Boolean(r.lista_espera === true || r.lista_espera === 'true');
    return {
          id_reserva:     asString(r.id_reserva, `r_${Date.now()}`),
          nombre_cliente: asString(r.cliente ?? r.nombre_cliente),
          telefono:       asString(r.telefono),
          pax:            asNumber(r.personas ?? r.pax, 1),
          id_mesa:        idMesa,
          nombre_mesa:    asString(r.nombre_mesa, idMesa ? `Mesa ${idMesa}` : 'Sin mesa'),
          hora:           normalizarHora(r.hora),
          estado:         normalizarEstado(r.estado),
          fecha:          normalizarFecha(asOptionalString(r.fecha)),
          email:          asOptionalString(r.email),
          observaciones:  asOptionalString(r.observaciones ?? r.notas),
          lista_espera:   listaEspera,
          prioridad_espera: listaEspera ? asOptionalNumber(r.prioridad_espera) ?? 0 : undefined,
    };
}

// ---------------------------------------------------------------------------
// Payload DB / Sheets ← Reserva
// Centralizado para no duplicar en create() y update().
// ---------------------------------------------------------------------------
function toDbPayload(res: Partial<Reserva> & { id_reserva?: string }) {
    const payload: Record<string, unknown> = {};
    if (res.id_reserva     !== undefined) payload.id_reserva   = res.id_reserva;
    if (res.nombre_cliente !== undefined) payload.cliente       = res.nombre_cliente;
    if (res.telefono       !== undefined) payload.telefono      = res.telefono;
    if (res.pax            !== undefined) payload.personas      = res.pax;
    if (res.lista_espera === true && res.id_mesa === undefined) payload.id_mesa = null;
    else if (res.id_mesa   !== undefined) payload.id_mesa       = res.id_mesa ?? null;
    if (res.hora           !== undefined) payload.hora          = res.hora;
    if (res.estado         !== undefined) payload.estado        = res.estado;
    if (res.fecha          !== undefined) payload.fecha         = res.fecha;
    if (res.email          !== undefined) payload.email         = res.email ?? null;
    if (res.observaciones  !== undefined) payload.observaciones = res.observaciones ?? null;
    if (res.lista_espera   !== undefined) payload.lista_espera  = res.lista_espera;
    if (res.prioridad_espera !== undefined) payload.prioridad_espera = res.prioridad_espera;
    return payload;
}

export const __reservasServiceTestables = {
    normalizarFecha,
    mapRowToReserva,
    toDbPayload,
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
const CACHE_KEY = 'colores_pizzeria_cache_reservas';

const invalidateCache = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
};

export const reservasService = {

    /** Devuelve todas las reservas ordenadas por fecha y hora. */
    async list(): Promise<Reserva[]> {
          const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;

          // 1. Google Sheets como almacenamiento principal
          if (sheetsService.isConfigured()) {
            if (cached) {
              // Stale-While-Revalidate en segundo plano
              setTimeout(async () => {
                try {
                  const rows = await sheetsService.getRows('reservas');
                  if (rows && Array.isArray(rows)) {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
                  }
                } catch (e) {
                  console.warn('Background sheets reservas refresh failed:', e);
                }
              }, 500);

              try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) return parsed.map(mapRowToReserva);
              } catch {}
            }

            try {
              const rows = await sheetsService.getRows('reservas');
              if (rows && Array.isArray(rows)) {
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
                }
                return rows.map(mapRowToReserva);
              }
            } catch (err) {
              console.warn('[reservasService] Fallo lectura de Google Sheets, intentando fallback:', err);
            }
          }

          // 2. Fallback a Supabase si existiera la tabla
          const client = tryGetActiveSupabaseClient();
          if (client) {
            try {
              const { data, error } = await client
                .from('reservas')
                .select('*')
                .order('fecha', { ascending: true })
                .order('hora',  { ascending: true });

              if (!error && data) {
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                }
                return data.map(mapRowToReserva);
              }
            } catch {}
          }

          // 3. Fallback a cache local
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) return parsed.map(mapRowToReserva);
            } catch {}
          }

          return [];
    },

    /**
     * Devuelve solo las reservas de una fecha específica (YYYY-MM-DD).
     */
    async listByFecha(fecha: string): Promise<Reserva[]> {
          const all = await this.list();
          return all
            .filter(r => r.fecha === fecha)
            .sort((a, b) => a.hora.localeCompare(b.hora));
    },

    /**
     * Crea una reserva nueva.
     */
    async create(res: Reserva): Promise<Reserva> {
          invalidateCache();
          const payload = toDbPayload(res);

          // 1. Google Sheets
          if (sheetsService.isConfigured()) {
            await sheetsService.append('reservas', payload);
          }

          // 2. Supabase si está disponible
          const supabase = tryGetActiveSupabaseClient();
          if (supabase) {
            try {
              await supabase.from('reservas').insert([payload]);
            } catch {}
          }

          return res;
    },

    /**
     * Actualiza campos específicos de una reserva existente.
     */
    async update(id: string, fields: Partial<Reserva>): Promise<void> {
          invalidateCache();
          const payload = toDbPayload(fields);
          delete payload.id_reserva;

          // 1. Google Sheets
          if (sheetsService.isConfigured()) {
            await sheetsService.upsert('reservas', { ...payload, id_reserva: id }, 'id_reserva');
          }

          // 2. Supabase si está disponible
          const supabase = tryGetActiveSupabaseClient();
          if (supabase) {
            try {
              await supabase.from('reservas').update(payload).eq('id_reserva', id);
            } catch {}
          }
    },

    /**
     * Upsert masivo.
     */
    async upsert(reservas: Reserva[]): Promise<void> {
          invalidateCache();
          const payloads = reservas.map(r => toDbPayload(r));

          // 1. Google Sheets
          if (sheetsService.isConfigured()) {
            await sheetsService.upsert('reservas', payloads, 'id_reserva');
          }

          // 2. Supabase si está disponible
          const supabase = tryGetActiveSupabaseClient();
          if (supabase) {
            try {
              await supabase.from('reservas').upsert(payloads);
            } catch {}
          }
    },

    /**
     * Elimina o cancela una reserva por ID.
     */
    async remove(id: string): Promise<boolean> {
          invalidateCache();

          // 1. Google Sheets: marcamos como cancelada para persistencia contable/operativa
          if (sheetsService.isConfigured()) {
            await sheetsService.upsert('reservas', { id_reserva: id, estado: 'cancelada' }, 'id_reserva');
          }

          // 2. Supabase si está disponible
          const supabase = tryGetActiveSupabaseClient();
          if (supabase) {
            try {
              await supabase.from('reservas').delete().eq('id_reserva', id);
            } catch {}
          }

          return true;
    },
};
