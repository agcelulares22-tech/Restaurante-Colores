import { getActiveSupabaseClient } from '../lib/supabaseClient';

const API_URL = '/api/arca';
const LEGACY_CREDENTIAL_KEYS = ['colores_pizzeria_arca_creds', 'colores_pizzeria_arca_ta'];

if (typeof window !== 'undefined') {
  for (const key of LEGACY_CREDENTIAL_KEYS) {
    try { window.localStorage.removeItem(key); } catch {}
  }
}

const getRuntimeEnv = (): Record<string, unknown> => (
  ((import.meta as { env?: Record<string, unknown> }).env) ?? {}
);

const getEnvString = (key: string): string => {
  const value = getRuntimeEnv()[key];
  return typeof value === 'string' ? value.trim() : '';
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = getActiveSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('La sesión venció. Iniciá sesión nuevamente para usar ARCA.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function callArca(body: Record<string, unknown>): Promise<any> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({ error: 'Respuesta inválida del servidor fiscal.' }));
  if (!res.ok) {
    throw new Error(data.error || `ARCA respondió HTTP ${res.status}`);
  }
  return data;
}

/**
 * La configuración real vive exclusivamente en el servidor. El navegador solo
 * recibe metadatos no secretos para mostrar el estado operativo.
 */
export function isArcaConfigured(): boolean {
  return getEnvString('VITE_ARCA_ENABLED') === 'true' || Boolean(getEnvString('VITE_ARCA_CUIT'));
}

export function getArcaCuit(): number | null {
  const value = Number(getEnvString('VITE_ARCA_CUIT'));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function requireArcaCuit(): number {
  const cuit = getArcaCuit();
  if (!cuit) throw new Error('El CUIT emisor ARCA no está publicado por el servidor.');
  return cuit;
}

export function getArcaPuntoVenta(): number {
  const value = Number(getEnvString('VITE_ARCA_PTO_VTA') || '1');
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

export function getArcaEnvironmentLabel(): 'Producción' | 'Homologación' {
  return getEnvString('VITE_ARCA_PROD') === 'true' ? 'Producción' : 'Homologación';
}

export async function testArcaConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isArcaConfigured()) return { success: false, error: 'ARCA no está configurado en el servidor.' };
  try {
    const data = await callArca({ action: 'test' });
    return data.success === true
      ? { success: true }
      : { success: false, error: data.error || 'ARCA no confirmó la conexión.' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export interface ArcaInvoicePayload {
  tipoComprobante: number;
  puntoVenta?: number;
  cliente?: {
    tipoDoc: number;
    nroDoc: number;
    nombre?: string;
    condicionIva: number;
  };
  items?: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    ivaId: number;
    ivaBase: number;
    ivaImporte: number;
  }>;
  docTipo?: number;
  docNro?: number;
  condicionIva?: number;
  total: number;
  neto: number;
  ivaTotal: number;
  ivaItems?: { Id: number; BaseImp: number; Importe: number }[];
}

export interface ArcaInvoiceResult {
  success: boolean;
  resultado?: 'A' | 'O' | 'R';
  cae?: string;
  vencimiento?: string;
  CodAutorizacion?: string;
  CAE?: string;
  Vencimiento?: string;
  CAEFchVto?: string;
  nroCmp?: number;
  error?: string;
}

export async function createArcaInvoice(payload: ArcaInvoicePayload): Promise<ArcaInvoiceResult> {
  if (!isArcaConfigured()) throw new Error('ARCA no está configurado en el servidor.');
  return callArca({ action: 'createInvoice', payload });
}

export const TIPOS_COMPROBANTE = {
  factura_a: { id: 1, label: 'Factura A', requiereCuit: true, condicionIva: 1 },
  factura_b: { id: 6, label: 'Factura B', requiereCuit: false, condicionIva: 5 },
  factura_c: { id: 11, label: 'Factura C', requiereCuit: false, condicionIva: 6 },
  ticket_a: { id: 201, label: 'Ticket Factura A', requiereCuit: true, condicionIva: 1 },
  ticket_b: { id: 206, label: 'Ticket Factura B', requiereCuit: false, condicionIva: 5 },
} as const;

export const TIPOS_DOCUMENTO = [
  { id: 99, label: 'Consumidor Final' },
  { id: 80, label: 'CUIT' },
  { id: 96, label: 'DNI' },
];

export const CONDICIONES_IVA_RECEPTOR = [
  { id: 1, label: 'IVA Responsable Inscripto' },
  { id: 2, label: 'IVA No Responsable' },
  { id: 3, label: 'IVA Exento' },
  { id: 4, label: 'IVA Sujeto Exento' },
  { id: 5, label: 'Consumidor Final' },
  { id: 6, label: 'IVA Monotributo' },
  { id: 12, label: 'IVA No Alcanzado' },
];
