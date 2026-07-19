import assert from 'node:assert/strict';
import test from 'node:test';
import { isUncertainArcaTransportError } from './arcaTransport';

test('detecta respuestas inciertas luego de enviar una autorizacion', () => {
  assert.equal(isUncertainArcaTransportError('socket hang up'), true);
  assert.equal(isUncertainArcaTransportError('ECONNRESET'), true);
  assert.equal(isUncertainArcaTransportError('WSFE FECAESolicitar HTTP 503'), true);
  assert.equal(isUncertainArcaTransportError('El servidor tardo demasiado'), true);
});

test('no clasifica un rechazo fiscal conocido como resultado incierto', () => {
  assert.equal(isUncertainArcaTransportError('ARCA rechazo la solicitud: CUIT invalido'), false);
});
