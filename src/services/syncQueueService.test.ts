import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeQueueAfterProcessing, mergeQueueItem, type SyncQueueItem } from './syncQueueService';

const item = (id: string, pedido: string, attempts = 0): SyncQueueItem => ({
  id,
  action: 'upsert_pedido',
  payload: { id_pedido: pedido, items: [{ cantidad: 1 }] },
  timestamp: '2026-07-19T00:00:00.000Z',
  attempts,
});

test('la cola reemplaza la versión pendiente de una misma comanda sin duplicarla', () => {
  const original = item('sync-1', 'pedido-1', 4);
  const updated = { ...item('sync-2', 'pedido-1'), payload: { id_pedido: 'pedido-1', items: [{ cantidad: 3 }] } };
  const result = mergeQueueItem([original], updated);

  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'sync-2');
  assert.equal(result[0].payload.items[0].cantidad, 3);
  assert.equal(result[0].attempts, 0);
});

test('una actualización de la misma comanda durante el procesamiento conserva una revisión nueva', () => {
  const processing = item('sync-1', 'pedido-1');
  const replacement = { ...item('sync-2', 'pedido-1'), payload: { id_pedido: 'pedido-1', items: [{ cantidad: 4 }] } };
  const latestQueue = mergeQueueItem([processing], replacement);

  const result = mergeQueueAfterProcessing(latestQueue, new Set(['sync-1']), []);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'sync-2');
  assert.equal(result[0].payload.items[0].cantidad, 4);
});

test('la cola conserva operaciones agregadas mientras se procesaban otras', () => {
  const processed = item('sync-1', 'pedido-1');
  const newlyQueued = item('sync-2', 'pedido-2');
  const failed = { ...processed, attempts: 50, lastError: 'offline' };

  const result = mergeQueueAfterProcessing(
    [processed, newlyQueued],
    new Set(['sync-1']),
    [failed],
  );

  assert.deepEqual(result.map(entry => entry.id), ['sync-1', 'sync-2']);
  assert.equal(result[0].attempts, 50);
});

test('la cola conserva una sola revision de cada comprobante fiscal', () => {
  const original: SyncQueueItem = {
    id: 'sync-fac-1',
    action: 'upsert_factura',
    payload: { id_factura: 'fac-1', afip_cae: '123' },
    timestamp: '2026-07-19T00:00:00.000Z',
    attempts: 7,
  };
  const updated: SyncQueueItem = {
    ...original,
    id: 'sync-fac-2',
    payload: { ...original.payload, persistencia: 'pendiente_sync' },
    attempts: 0,
  };
  const result = mergeQueueItem([original], updated);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'sync-fac-2');
  assert.equal(result[0].attempts, 0);
});
