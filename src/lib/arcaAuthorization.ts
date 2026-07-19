export interface ArcaAuthorizationResponse {
  success?: boolean;
  error?: string;
  resultado?: string;
  CodAutorizacion?: string;
  CAE?: string;
  Vencimiento?: string;
  CAEFchVto?: string;
  nroCmp?: number;
}

export interface ApprovedArcaAuthorization {
  cae: string;
  vencimiento: string;
  nroCmp: number;
}

export function requireApprovedArcaAuthorization(
  response: ArcaAuthorizationResponse | null | undefined
): ApprovedArcaAuthorization {
  if (!response || response.success === false || response.resultado === 'R') {
    throw new Error(response?.error || 'ARCA rechazó el comprobante. No se recibió autorización fiscal.');
  }

  const cae = String(response.CodAutorizacion || response.CAE || '').trim();
  const vencimiento = String(response.Vencimiento || response.CAEFchVto || '').trim();
  const nroCmp = Number(response.nroCmp);

  if (!/^\d+$/.test(cae) || !vencimiento || !Number.isInteger(nroCmp) || nroCmp <= 0) {
    throw new Error('ARCA no devolvió CAE, vencimiento y número de comprobante válidos. La operación no fue emitida.');
  }

  return { cae, vencimiento, nroCmp };
}
