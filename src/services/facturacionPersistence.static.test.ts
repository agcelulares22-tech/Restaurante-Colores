import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const serviceSource = readFileSync(new URL('./facturacionService.ts', import.meta.url), 'utf8');
const cajaSource = readFileSync(new URL('../features/caja/hooks/useCaja.ts', import.meta.url), 'utf8');

test('un comprobante fiscal conserva respaldo local y escritura idempotente', () => {
  assert.doesNotMatch(serviceSource, /removeItem\(LOCAL_FACTURAS_KEY\)/);
  assert.match(serviceSource, /localStorage\.setItem\(LOCAL_FACTURAS_KEY/);
  assert.match(serviceSource, /upsert\(\[dbPayload\], \{ onConflict: 'id_factura' \}\)/);
  assert.match(serviceSource, /return pendingFactura;/);
});

test('el cobro dividido conserva la factura antes de actualizar la caja', () => {
  const persistenceIndex = cajaSource.lastIndexOf('const persistedInvoice = await facturacionService.create');
  const salesIndex = cajaSource.lastIndexOf('await cajaService.updateSales(breakdowns.finalTotal');
  assert.ok(persistenceIndex >= 0);
  assert.ok(salesIndex > persistenceIndex);
});
