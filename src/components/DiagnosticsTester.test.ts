import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./DiagnosticsTester.tsx', import.meta.url), 'utf8');

test('el diagnóstico ARCA evalúa success y muestra el error real', () => {
  assert.match(source, /if \(result\.success\)/);
  assert.match(source, /result\.error \|\|/);
  assert.doesNotMatch(source, /if \(isOk\)/);
});
