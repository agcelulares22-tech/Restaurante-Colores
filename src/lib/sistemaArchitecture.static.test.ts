import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../components/SistemaModule.tsx', import.meta.url), 'utf8');
const managerSource = readFileSync(new URL('../components/SupabaseManager.tsx', import.meta.url), 'utf8');
const backupsSource = readFileSync(new URL('../components/BackupsModule.tsx', import.meta.url), 'utf8');

test('Sistema describe la arquitectura desplegada y no componentes heredados inexistentes', () => {
  assert.doesNotMatch(source, /SQLite|Streamlit|backend\/login\.py|requirements\.txt|data\/restaurante\.db/i);
  assert.doesNotMatch(source, /cdnjs/i);
  assert.match(source, /React \+ Vercel \+ Supabase/);
  assert.match(source, /Cola local PWA/);
  assert.doesNotMatch(managerSource, /SQLite/i);
  assert.doesNotMatch(backupsSource, /SQLite|1\.2% Uso/i);
});
