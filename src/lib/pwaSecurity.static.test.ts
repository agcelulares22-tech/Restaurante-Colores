import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const viteConfig = readFileSync(new URL('../../vite.config.ts', import.meta.url), 'utf8');

test('el service worker no comparte respuestas autenticadas de Supabase entre sesiones', () => {
  assert.doesNotMatch(viteConfig, /supabase-api|urlPattern:\s*\/\^https:.*supabase/i);
  assert.match(viteConfig, /registerType:\s*'autoUpdate'/);
  assert.match(viteConfig, /skipWaiting:\s*true/);
});
