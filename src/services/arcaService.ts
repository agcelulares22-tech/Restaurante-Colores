// arcaService.ts — Proxy para la API de ARCA
// Las llamadas reales a @arcasdk/core se hacen desde /api/arca.ts (server-side)

interface ArcaCredentials {
  cuit: number;
  key: string;
  cert: string;
  production?: boolean;
  puntoVenta?: number;
}

const STORAGE_KEY = 'colores_pizzeria_arca_creds';
const TA_CACHE_KEY = 'colores_pizzeria_arca_ta';
const API_URL = '/api/arca';

interface CachedTa {
  token: string;
  sign: string;
  expiresAt: number;
}

function getCachedTa(): { token: string; sign: string } | null {
  try {
    const raw = localStorage.getItem(TA_CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedTa = JSON.parse(raw);
    // Si expira en menos de 5 minutos, descartar
    if (parsed.expiresAt - Date.now() < 5 * 60 * 1000) {
      localStorage.removeItem(TA_CACHE_KEY);
      return null;
    }
    return { token: parsed.token, sign: parsed.sign };
  } catch {
    return null;
  }
}

function setCachedTa(token: string, sign: string) {
  try {
    const expiresAt = Date.now() + 10 * 60 * 60 * 1000; // 10 horas
    const data: CachedTa = { token, sign, expiresAt };
    localStorage.setItem(TA_CACHE_KEY, JSON.stringify(data));
  } catch {}
}

export function clearCachedTa() {
  localStorage.removeItem(TA_CACHE_KEY);
}

export function saveArcaCredentials(creds: ArcaCredentials) {
  const old = getStoredCredentials();
  const changed = !old || 
                  old.cuit !== creds.cuit || 
                  old.key !== creds.key || 
                  old.cert !== creds.cert ||
                  old.production !== creds.production ||
                  old.puntoVenta !== creds.puntoVenta;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
  if (changed) {
    clearCachedTa(); // Limpiar token al cambiar credenciales
  }
  window.dispatchEvent(new Event('arca_config_changed'));
}

export function deleteArcaCredentials() {
  localStorage.removeItem(STORAGE_KEY);
  clearCachedTa();
  window.dispatchEvent(new Event('arca_config_changed'));
}

function getStoredCredentials(): ArcaCredentials | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: ArcaCredentials = JSON.parse(stored);
      // Validar si las credenciales están vacías o incompletas (ej: truncadas por exceso de cuota en localStorage)
      if (parsed && typeof parsed === 'object') {
        const keyStr = parsed.key || '';
        const certStr = parsed.cert || '';
        const hasKey = typeof keyStr === 'string' && 
                       keyStr.includes('PRIVATE KEY') && 
                       keyStr.includes('-----END');
        const hasCert = typeof certStr === 'string' && 
                        certStr.includes('CERTIFICATE') && 
                        certStr.includes('-----END CERTIFICATE-----');
        if (hasKey && hasCert) {
          return parsed;
        } else {
          console.warn('Credenciales de ARCA corruptas o incompletas en LocalStorage. Eliminando para evitar errores de PEM.');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }

    const env = (import.meta as any).env || {};
    const envCuit = env.VITE_ARCA_CUIT;
    const envKey = env.VITE_ARCA_KEY;
    const envCert = env.VITE_ARCA_CERT;
    const envPtoVta = env.VITE_ARCA_PTO_VTA;
    if (envCuit && envKey && envCert) {
      return { 
        cuit: Number(envCuit), 
        key: envKey, 
        cert: envCert, 
        production: env.VITE_ARCA_PROD === 'true',
        puntoVenta: envPtoVta ? Number(envPtoVta) : 1
      };
    }
    return null;
  } catch { return null; }
}

export function isArcaConfigured(): boolean {
  return getStoredCredentials() !== null;
}

export function getArcaCuit(): number | null {
  const creds = getStoredCredentials();
  return creds ? creds.cuit : null;
}

export function getArcaPuntoVenta(): number {
  const creds = getStoredCredentials();
  return creds && creds.puntoVenta ? creds.puntoVenta : 1;
}

export async function testArcaConnection(): Promise<{ success: boolean; error?: string }> {
  const creds = getStoredCredentials();
  if (!creds) return { success: false, error: 'No hay credenciales configuradas' };
  try {
    const cachedTa = getCachedTa();
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test', credentials: creds, wsaaToken: cachedTa }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error en el servidor de ARCA' }));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }
    const data = await res.json();
    if (data.wsaaToken) {
      setCachedTa(data.wsaaToken.token, data.wsaaToken.sign);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
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
  cbtesAsoc?: Array<{ tipo: number; ptoVta?: number; nro: number; cuit?: string }>;
}

export interface ArcaInvoiceResult {
  success: boolean;
  cae?: string;
  vencimiento?: string;
  CodAutorizacion?: string;
  CAE?: string;
  Vencimiento?: string;
  CAEFchVto?: string;
  nroCmp?: number;
}

export async function createArcaInvoice(payload: ArcaInvoicePayload): Promise<ArcaInvoiceResult> {
  const creds = getStoredCredentials();
  if (!creds) throw new Error('ARCA no está configurado');

  const cachedTa = getCachedTa();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createInvoice', credentials: creds, wsaaToken: cachedTa, payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error de conexión con ARCA' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.wsaaToken) {
    setCachedTa(data.wsaaToken.token, data.wsaaToken.sign);
  }
  return data;
}

export const TIPOS_COMPROBANTE = {
  'factura_a': { id: 1, label: 'Factura A', requiereCuit: true, condicionIva: 1 },
  'factura_b': { id: 6, label: 'Factura B', requiereCuit: false, condicionIva: 5 },
  'factura_c': { id: 11, label: 'Factura C', requiereCuit: false, condicionIva: 6 },
  'nota_credito_a': { id: 3, label: 'Nota de Crédito A', requiereCuit: true, condicionIva: 1 },
  'nota_credito_b': { id: 8, label: 'Nota de Crédito B', requiereCuit: false, condicionIva: 5 },
  'nota_credito_c': { id: 13, label: 'Nota de Crédito C', requiereCuit: false, condicionIva: 6 },
  'ticket_a': { id: 201, label: 'Ticket Factura A', requiereCuit: true, condicionIva: 1 },
  'ticket_b': { id: 206, label: 'Ticket Factura B', requiereCuit: false, condicionIva: 5 },
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
