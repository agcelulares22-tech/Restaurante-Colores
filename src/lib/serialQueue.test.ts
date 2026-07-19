import assert from 'node:assert/strict';
import test from 'node:test';
import { withSerializedKey } from './serialQueue';

const pause = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

test('serializa tareas con la misma clave fiscal', async () => {
  const events: string[] = [];
  await Promise.all([
    withSerializedKey('cuit:pv:tipo', async () => {
      events.push('first:start');
      await pause(15);
      events.push('first:end');
    }),
    withSerializedKey('cuit:pv:tipo', async () => {
      events.push('second:start');
      events.push('second:end');
    }),
  ]);
  assert.deepEqual(events, ['first:start', 'first:end', 'second:start', 'second:end']);
});

test('libera la clave fiscal aunque una tarea falle', async () => {
  await assert.rejects(() => withSerializedKey('failing-key', async () => {
    throw new Error('fallo esperado');
  }));
  const result = await withSerializedKey('failing-key', async () => 'ok');
  assert.equal(result, 'ok');
});
