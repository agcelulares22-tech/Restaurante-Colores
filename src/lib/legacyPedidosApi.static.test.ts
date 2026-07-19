import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const files = [
  '../../api/pedidos/cargar.ts',
  '../../api/pedidos/[id_pedido].ts',
  '../../api/pedidos/[id_pedido]/agregar-item.ts',
];

test('las APIs heredadas de comandas no permiten acceso anónimo', () => {
  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /status\(410\)/);
    assert.doesNotMatch(source, /createClient|SUPABASE_ANON_KEY|\.from\(/);
  }
});
