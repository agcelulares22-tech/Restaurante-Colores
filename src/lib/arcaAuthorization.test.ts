import assert from 'node:assert/strict';
import test from 'node:test';
import { requireApprovedArcaAuthorization } from './arcaAuthorization';

test('acepta únicamente una autorización ARCA completa', () => {
  assert.deepEqual(requireApprovedArcaAuthorization({
    success: true,
    resultado: 'A',
    CAE: '74123456789012',
    CAEFchVto: '20260729',
    nroCmp: 8327
  }), {
    cae: '74123456789012',
    vencimiento: '20260729',
    nroCmp: 8327
  });
});

test('rechaza respuestas R y respuestas sin CAE', () => {
  assert.throws(
    () => requireApprovedArcaAuthorization({ success: false, resultado: 'R', error: 'CUIT inexistente' }),
    /CUIT inexistente/
  );
  assert.throws(
    () => requireApprovedArcaAuthorization({ success: true, resultado: 'A', nroCmp: 8327 }),
    /no devolvió CAE/
  );
});
