export const ARCA_ALLOWED_INVOICE_TYPES = new Set([1, 6, 11, 201, 206]);
export const ARCA_ALLOWED_DOCUMENT_TYPES = new Set([80, 96, 99]);
export const ARCA_ALLOWED_RECIPIENT_VAT_CONDITIONS = new Set([1, 2, 3, 4, 5, 6, 12]);
export const ARCA_ALLOWED_ROLES = new Set(['superadmin', 'administrador', 'mozo']);

export interface ArcaValidatedPayload {
  tipoComprobante: number;
  cliente: {
    tipoDoc: number;
    nroDoc: number;
    condicionIva: number;
  };
  total: number;
  neto: number;
  ivaTotal: number;
}

const asFiniteNumber = (value: unknown, field: string): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} debe ser un número válido.`);
  return parsed;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function validateArcaInvoicePayload(input: unknown): ArcaValidatedPayload {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('El pedido fiscal tiene un formato inválido.');
  }

  const payload = input as Record<string, unknown>;
  const cliente = payload.cliente && typeof payload.cliente === 'object' && !Array.isArray(payload.cliente)
    ? payload.cliente as Record<string, unknown>
    : {};

  const tipoComprobante = asFiniteNumber(payload.tipoComprobante, 'tipoComprobante');
  const tipoDoc = asFiniteNumber(cliente.tipoDoc ?? 99, 'cliente.tipoDoc');
  const nroDoc = asFiniteNumber(cliente.nroDoc ?? 0, 'cliente.nroDoc');
  const condicionIva = asFiniteNumber(cliente.condicionIva ?? 5, 'cliente.condicionIva');
  const total = roundMoney(asFiniteNumber(payload.total, 'total'));
  const neto = roundMoney(asFiniteNumber(payload.neto, 'neto'));
  const ivaTotal = roundMoney(asFiniteNumber(payload.ivaTotal, 'ivaTotal'));

  if (!Number.isInteger(tipoComprobante) || !ARCA_ALLOWED_INVOICE_TYPES.has(tipoComprobante)) {
    throw new Error('El tipo de comprobante no está habilitado.');
  }
  if (!Number.isInteger(tipoDoc) || !ARCA_ALLOWED_DOCUMENT_TYPES.has(tipoDoc)) {
    throw new Error('El tipo de documento del receptor no está habilitado.');
  }
  if (!Number.isSafeInteger(nroDoc) || nroDoc < 0 || String(nroDoc).length > 11) {
    throw new Error('El número de documento del receptor es inválido.');
  }
  if (!Number.isInteger(condicionIva) || !ARCA_ALLOWED_RECIPIENT_VAT_CONDITIONS.has(condicionIva)) {
    throw new Error('La condición de IVA del receptor no está habilitada.');
  }
  if (tipoDoc === 99 && nroDoc !== 0) {
    throw new Error('Consumidor Final debe enviarse con documento 0.');
  }
  if (tipoDoc !== 99 && nroDoc === 0) {
    throw new Error('El receptor identificado requiere un número de documento.');
  }
  if (total <= 0 || neto < 0 || ivaTotal < 0) {
    throw new Error('Los importes fiscales deben ser positivos.');
  }

  if (tipoComprobante === 11) {
    if (ivaTotal !== 0 || Math.abs(total - neto) > 0.01) {
      throw new Error('La Factura C debe tener IVA en cero y neto igual al total.');
    }
  } else if (Math.abs(roundMoney(neto + ivaTotal) - total) > 0.01) {
    throw new Error('La suma de neto e IVA no coincide con el total.');
  }

  return {
    tipoComprobante,
    cliente: { tipoDoc, nroDoc, condicionIva },
    total,
    neto,
    ivaTotal,
  };
}

export function normalizeArcaRole(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function canUseArca(role: unknown): boolean {
  return ARCA_ALLOWED_ROLES.has(normalizeArcaRole(role));
}

export function formatArcaDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? '';
  return `${read('year')}${read('month')}${read('day')}`;
}
