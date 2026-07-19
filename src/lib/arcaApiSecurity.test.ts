import assert from 'node:assert/strict';
import test from 'node:test';
import { canUseArca, formatArcaDate, validateArcaInvoicePayload } from './arcaApiSecurity';

test('valida una Factura C consistente y descarta campos controlados por el cliente', () => {
  const payload = validateArcaInvoicePayload({
    tipoComprobante: 11,
    puntoVenta: 999,
    total: 1000,
    neto: 1000,
    ivaTotal: 0,
    cliente: { tipoDoc: 99, nroDoc: 0, condicionIva: 5 },
  });

  assert.deepEqual(payload, {
    tipoComprobante: 11,
    total: 1000,
    neto: 1000,
    ivaTotal: 0,
    cliente: { tipoDoc: 99, nroDoc: 0, condicionIva: 5 },
  });
  assert.equal('puntoVenta' in payload, false);
});

test('rechaza importes inconsistentes y documentos inválidos', () => {
  assert.throws(() => validateArcaInvoicePayload({
    tipoComprobante: 6,
    total: 121,
    neto: 100,
    ivaTotal: 20,
    cliente: { tipoDoc: 99, nroDoc: 20371081004, condicionIva: 5 },
  }), /Consumidor Final/);

  assert.throws(() => validateArcaInvoicePayload({
    tipoComprobante: 6,
    total: 121,
    neto: 100,
    ivaTotal: 20,
    cliente: { tipoDoc: 80, nroDoc: 20371081004, condicionIva: 1 },
  }), /no coincide/);
});

test('solo roles operativos autenticados pueden usar ARCA', () => {
  assert.equal(canUseArca('Super Admin'), true);
  assert.equal(canUseArca('administrador'), true);
  assert.equal(canUseArca('mozo'), true);
  assert.equal(canUseArca('cocina'), false);
  assert.equal(canUseArca('anon'), false);
});

test('la fecha fiscal usa el calendario argentino y no UTC', () => {
  assert.equal(formatArcaDate(new Date('2026-07-20T01:30:00.000Z')), '20260719');
});
