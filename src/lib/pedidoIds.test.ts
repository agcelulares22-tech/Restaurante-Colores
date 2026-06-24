import assert from 'node:assert/strict';
import test from 'node:test';
import { createClientPedidoId } from './pedidoIds';

test('createClientPedidoId genera ids numericos con tiempo y aleatorio', () => {
  const now = 1710000000000;
  const random = 0.123;
  const d = new Date(now);
  const segundosDia = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  const rnd = Math.floor(random * 1000);
  const expected = String(segundosDia * 1000 + rnd);
  assert.equal(createClientPedidoId([], now, random), expected);
});

test('createClientPedidoId evita colision con ids existentes mayores', () => {
  assert.equal(createClientPedidoId(['999999999999'], 1000, 0.123), '1000000000000');
});
