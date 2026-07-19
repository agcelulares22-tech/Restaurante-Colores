import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeArcaPem } from './arcaPem';

test('normaliza saltos de línea escapados en certificados PEM de Vercel', () => {
  const configured = '"-----BEGIN CERTIFICATE-----\\nQUJDRA==\\n-----END CERTIFICATE-----"';

  assert.equal(
    normalizeArcaPem(configured, 'CERTIFICATE'),
    '-----BEGIN CERTIFICATE-----\nQUJDRA==\n-----END CERTIFICATE-----'
  );
});

test('acepta claves privadas PKCS#8 y recompone líneas de 64 caracteres', () => {
  const body = 'A'.repeat(64) + 'Qg==';
  const normalized = normalizeArcaPem(
    `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`,
    'PRIVATE KEY'
  );

  assert.equal(normalized.split('\n')[1].length, 64);
  assert.equal(normalized.split('\n')[2], 'Qg==');
});

test('rechaza una clave cifrada y certificados truncados', () => {
  assert.throws(
    () => normalizeArcaPem(
      '-----BEGIN ENCRYPTED PRIVATE KEY-----\nQUJDRA==\n-----END ENCRYPTED PRIVATE KEY-----',
      'PRIVATE KEY'
    ),
    /cifrada/
  );

  assert.throws(
    () => normalizeArcaPem('-----BEGIN CERTIFICATE-----\nQUJDRA==', 'CERTIFICATE'),
    /Falta el cierre/
  );
});
