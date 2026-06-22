import { getActiveSupabaseClient } from '../lib/supabaseClient';
import type { ZonaEnvio, CalleEnvio } from '../types';

export async function fetchZonasEnvio(): Promise<ZonaEnvio[]> {
  try {
    const client = getActiveSupabaseClient();
    const { data, error } = await client
      .from('zonas_envio')
      .select('*')
      .eq('activo', true)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data || []) as ZonaEnvio[];
  } catch (err) {
    console.error('[zonasEnvioService] fetchZonasEnvio error:', err);
    return [];
  }
}

export async function fetchCallesEnvio(): Promise<CalleEnvio[]> {
  try {
    const client = getActiveSupabaseClient();
    const { data, error } = await client
      .from('calles_envio')
      .select('*')
      .eq('activo', true);

    if (error) throw error;
    return (data || []) as CalleEnvio[];
  } catch (err) {
    console.error('[zonasEnvioService] fetchCallesEnvio error:', err);
    return [];
  }
}

export interface ResultadoZonaEnvio {
  status: 'success' | 'error';
  zona?: string;
  color?: string;
  costo_envio?: number;
  minimo_pedido?: number;
  direccion_valida?: boolean;
  mensaje: string;
}

const normalizeCalle = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(av\.?|avenida|bv\.?|boulevard|calle|pasaje|peatonal)\s+/i, '')
    .replace(/\s+/g, ' ');

export function resolverZonaEnvio(
  direccion: string,
  zonas: ZonaEnvio[],
  calles: CalleEnvio[]
): ResultadoZonaEnvio {
  if (!direccion || !direccion.trim()) {
    return { status: 'error', mensaje: 'Ingresá una dirección de envío' };
  }

  const match = direccion.match(/^(.+?)\s+(\d+)$/);
  if (!match) {
    return { status: 'error', mensaje: 'Ingresá calle y altura (ej: Alvear 1362)' };
  }

  const calleInput = normalizeCalle(match[1]);
  const altura = parseInt(match[2], 10);

  const candidatas = calles.filter((c) => normalizeCalle(c.nombre_calle) === calleInput);

  if (candidatas.length === 0) {
    return { status: 'error', mensaje: 'Dirección fuera de cobertura' };
  }

  const calleMatch = candidatas.find((c) => {
    if (c.altura_desde == null || c.altura_hasta == null) return true;
    return altura >= c.altura_desde && altura <= c.altura_hasta;
  });

  if (!calleMatch) {
    return { status: 'error', mensaje: 'Altura no válida para esa calle' };
  }

  const zona = zonas.find((z) => z.id === calleMatch.zona_id);
  if (!zona) {
    return { status: 'error', mensaje: 'Dirección fuera de cobertura' };
  }

  return {
    status: 'success',
    zona: zona.nombre_zona,
    color: zona.color_hex,
    costo_envio: zona.costo_envio,
    minimo_pedido: zona.minimo_pedido,
    direccion_valida: true,
    mensaje: 'Zona identificada correctamente'
  };
}
