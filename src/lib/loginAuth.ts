import { Usuario } from '../types';

export type LoginUser = Pick<Usuario, 'id_usuario' | 'nombre' | 'apellido' | 'username' | 'password' | 'rol' | 'activo'>;

export function normalizeLoginIdentifier(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function findLocalLoginUser(users: LoginUser[], identifier: string, password: string): LoginUser | null {
  const normalized = normalizeLoginIdentifier(identifier);
  const cleanPass = password.trim();
  return users.find(user => {
    const userPass = (user.password || '').trim();
    if (user.password !== password && userPass !== cleanPass) return false;
    const normUsername = normalizeLoginIdentifier(user.username || '');
    const normName = normalizeLoginIdentifier(user.nombre || '');
    const normLastName = normalizeLoginIdentifier(user.apellido || '');
    const normFullName = normalizeLoginIdentifier(`${user.nombre || ''}${user.apellido || ''}`);
    const normSpaceFullName = normalizeLoginIdentifier(`${user.nombre || ''} ${user.apellido || ''}`);
    const normDotName = normalizeLoginIdentifier(`${user.nombre || ''}.${user.apellido || ''}`);

    return (
      normUsername === normalized ||
      normName === normalized ||
      normLastName === normalized ||
      normFullName === normalized ||
      normSpaceFullName === normalized ||
      normDotName === normalized ||
      normUsername.split('@')[0] === normalized ||
      (normalized === 'super@admin.com' && normUsername === 'super@admi.com') ||
      (normalized === 'super@admi.com' && normUsername === 'super@admin.com')
    );
  }) ?? null;
}

export function canLogin(user: Pick<Usuario, 'activo'> | null | undefined): boolean {
  return Boolean(user && user.activo !== false);
}

export function getLoginErrorMessage(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';

  if (/invalid login credentials/i.test(message)) return 'Usuario o contraseña incorrectos.';
  if (/fetch|network|timeout|failed/i.test(message)) return 'No pudimos conectar con el servidor. Revisá la conexión e intentá nuevamente.';
  return 'No pudimos iniciar sesión. Verificá tus datos e intentá nuevamente.';
}
