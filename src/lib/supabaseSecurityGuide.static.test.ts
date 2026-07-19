import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../components/SupabaseManager.tsx', import.meta.url), 'utf8');

test('el asistente Supabase no recomienda desactivar RLS ni escritura anónima', () => {
  assert.doesNotMatch(source, /DISABLE ROW LEVEL SECURITY/i);
  assert.doesNotMatch(source, /rol de clave an[oó]nima.*inserci[oó]n/i);
  assert.match(source, /ENABLE ROW LEVEL SECURITY/);
  assert.match(source, /sesión Supabase autenticada/);
});
