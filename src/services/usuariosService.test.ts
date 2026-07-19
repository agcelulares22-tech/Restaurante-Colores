import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeUsuarios, resolveUsuariosForOnlineSync } from './usuariosService';

test('combina usuarios locales y remotos sin duplicar ids', () => {
  const local = [
    { id_usuario: 1, nombre: 'Enzo local', apellido: 'A', username: 'enzo-local', password: '1234', rol: 'mozo' as const },
    { id_usuario: 2, nombre: 'Micaela', apellido: 'B', username: 'micaela', password: '1234', rol: 'mozo' as const }
  ];
  const remote = [
    { id_usuario: 1, nombre: 'Enzo remoto', apellido: 'A', username: 'enzo-remoto', password: '1234', rol: 'mozo' as const },
    { id_usuario: 3, nombre: 'Sofía', apellido: 'C', username: 'sofia', password: '1234', rol: 'administrador' as const }
  ];

  const merged = mergeUsuarios(remote, local);
  assert.deepEqual(merged.map(usuario => usuario.id_usuario), [1, 2, 3]);
  assert.equal(merged[0].nombre, 'Enzo remoto');
});

test('Supabase reemplaza la copia local obsoleta cuando devuelve usuarios', () => {
  const local = [
    { id_usuario: 9, nombre: 'Admin viejo', apellido: '', username: 'admin', password: '1998', rol: 'superadmin' as const }
  ];
  const remote = [
    { id_usuario: 4, nombre: 'Admin', apellido: '', username: 'admin', password: '__SUPABASE_AUTH__', rol: 'superadmin' as const }
  ];

  const resolved = resolveUsuariosForOnlineSync(remote, local);
  assert.deepEqual(resolved.map(usuario => usuario.id_usuario), [4]);
  assert.equal(resolved[0].password, '__SUPABASE_AUTH__');
});

test('conserva la copia local si Supabase no tiene usuarios', () => {
  const local = [
    { id_usuario: 2, nombre: 'Mozo offline', apellido: '', username: 'mozo', password: '1234', rol: 'mozo' as const }
  ];

  assert.deepEqual(resolveUsuariosForOnlineSync([], local), local);
});
