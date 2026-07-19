import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeFacturas, toFacturaDbPayload, type Factura } from './facturacionService';

const factura = (id: string, total: number): Factura => ({
  id_factura: id,
  nro_ticket: id,
  cliente: 'Consumidor Final',
  cuit: '99-99999999-9',
  total,
  iva_veintiuno: total * 0.21,
  medio_pago: 'efectivo',
  fecha: '12:00 hs',
  estado: 'emitido'
});

test('combina respaldo local y remoto sin duplicar comprobantes', () => {
  const merged = mergeFacturas(
    [factura('fac_2', 200), factura('fac_1', 150)],
    [factura('fac_1', 100), factura('fac_0', 50)]
  );

  assert.deepEqual(merged.map(item => item.id_factura), ['fac_2', 'fac_1', 'fac_0']);
  assert.equal(merged.find(item => item.id_factura === 'fac_1')?.total, 150);
});

test('serializa todos los datos fiscales necesarios para una escritura idempotente', () => {
  const input: Factura = {
    ...factura('fac_fiscal_1', 1210),
    tipo: 'C',
    afip_cae: '12345678901234',
    afip_vto: '20260729',
    afip_qr: '{"ver":1}',
    afip_resultado: 'A',
    fecha_emision: '2026-07-19T12:00:00.000Z',
  };
  assert.deepEqual(toFacturaDbPayload(input), {
    id_factura: 'fac_fiscal_1',
    id_pedido: null,
    numero_factura: 'fac_fiscal_1',
    total: 1210,
    tipo_comprobante: 'Factura C',
    metodo_pago: 'Efectivo',
    cuit_cliente: '99-99999999-9',
    fecha_emision: '2026-07-19T12:00:00.000Z',
    afip_cae: '12345678901234',
    afip_vto: '20260729',
    afip_qr: '{"ver":1}',
    afip_resultado: 'A',
  });
});
