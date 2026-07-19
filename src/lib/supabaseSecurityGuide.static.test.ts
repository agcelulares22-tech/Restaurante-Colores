import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../components/SupabaseManager.tsx', import.meta.url), 'utf8');
const clientSource = readFileSync(new URL('./supabaseClient.ts', import.meta.url), 'utf8');
const apiConfigSource = readFileSync(new URL('../../api/supabase-config.ts', import.meta.url), 'utf8');

test('el asistente Supabase no recomienda desactivar RLS ni escritura anónima', () => {
  assert.doesNotMatch(source, /DISABLE ROW LEVEL SECURITY/i);
  assert.doesNotMatch(source, /rol de clave an[oó]nima.*inserci[oó]n/i);
  assert.match(source, /ENABLE ROW LEVEL SECURITY/);
  assert.match(source, /sesión Supabase autenticada/);
});

test('producción no permite reemplazar la base ni volver a sembrar usuarios demo', () => {
  assert.doesNotMatch(source, /const default(Key|Url)/);
  assert.match(source, /runtimeConfigLocked = Boolean\(\(import\.meta as any\)\.env\?\.PROD\)/);
  assert.match(source, /!runtimeConfigLocked && \(/);
  assert.match(source, /configuración de producción sólo puede modificarse desde Vercel/i);
});

test('la conexión Supabase no contiene un proyecto alternativo fijado en código', () => {
  for (const configSource of [clientSource, apiConfigSource]) {
    assert.doesNotMatch(configSource, /msmaksbtetcmoaiyywto|DEFAULT_SUPABASE_(URL|ANON_KEY)/);
  }
});
