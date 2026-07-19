import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasSupabaseConfig,
  normalizeSupabaseUrl,
  resolveSupabaseConfig,
} from './supabaseClient';

test('normaliza URLs de Supabase usadas por la app', () => {
  assert.equal(normalizeSupabaseUrl(' https://demo.supabase.co/rest/v1/ '), 'https://demo.supabase.co');
  assert.equal(normalizeSupabaseUrl('https://demo.supabase.co///'), 'https://demo.supabase.co');
});

test('resuelve credenciales Supabase desde variables de entorno primero', () => {
  assert.deepEqual(
    resolveSupabaseConfig(
      {
        VITE_SUPABASE_URL: 'https://env.supabase.co/rest/v1',
        VITE_SUPABASE_ANON_KEY: 'env-key',
      },
      {
        SUPABASE_URL: 'https://local.supabase.co',
        SUPABASE_ANON_KEY: 'local-key',
      },
    ),
    { url: 'https://env.supabase.co', key: 'env-key' },
  );
});

test('acepta publishable key y usa configuracion local como fallback', () => {
  assert.deepEqual(
    resolveSupabaseConfig({ VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key' }, {
      SUPABASE_URL: 'https://local.supabase.co',
      SUPABASE_ANON_KEY: 'local-key',
    }),
    { url: 'https://local.supabase.co', key: 'publishable-key' },
  );

  assert.deepEqual(
    resolveSupabaseConfig({}, {
      SUPABASE_URL: 'https://local.supabase.co',
      SUPABASE_ANON_KEY: 'local-key',
    }),
    { url: 'https://local.supabase.co', key: 'local-key' },
  );
});

test('detecta configuracion Supabase incompleta o placeholder', () => {
  assert.equal(hasSupabaseConfig({ url: '', key: '' }), false);
  assert.equal(hasSupabaseConfig({ url: 'https://demo.supabase.co', key: 'tu-anon-key' }), false);
  assert.equal(hasSupabaseConfig({ url: 'https://demo.supabase.co', key: 'abc...' }), false);
  assert.equal(hasSupabaseConfig({ url: 'https://demo.supabase.co', key: 'real-key' }), true);
});

test('producción ignora overrides locales obsoletos y usa sólo variables del despliegue', () => {
  assert.deepEqual(resolveSupabaseConfig({
    PROD: true,
    VITE_SUPABASE_URL: 'https://produccion.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'production-public-key-1234567890',
  }, {
    SUPABASE_URL: 'https://equivocada.supabase.co',
    SUPABASE_ANON_KEY: 'stale-browser-key-1234567890',
  }), {
    url: 'https://produccion.supabase.co',
    key: 'production-public-key-1234567890',
  });
});
