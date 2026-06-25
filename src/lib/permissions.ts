import { Usuario } from '../types';

export type AppView =
  | 'home'
  | 'mozo'
  | 'cocina'
  | 'caja'
  | 'usuarios'
  | 'menu'
  | 'recetas'
  | 'mesas'
  | 'delivery'
  | 'inventario'
  | 'proveedores'
  | 'promociones'
  | 'reservas'
  | 'sistema'
  | 'backups'
  | 'fichaje';

export const ALL_APP_VIEWS: AppView[] = [
  'home',
  'mozo',
  'cocina',
  'caja',
  'usuarios',
  'menu',
  'recetas',
  'mesas',
  'delivery',
  'inventario',
  'proveedores',
  'promociones',
  'reservas',
  'sistema',
  'backups',
  'fichaje'
];

const MODULOS_SOLO_SUPERADMIN: AppView[] = ['sistema'];

const ALL_SIN_RESTRINGIDOS = ALL_APP_VIEWS.filter(
  v => !MODULOS_SOLO_SUPERADMIN.includes(v)
);

const ROLE_PERMISSIONS: Record<Usuario['rol'], AppView[]> = {
  superadmin: [
    'home',
    'mozo',
    'cocina',
    'caja',
    'usuarios',
    'menu',
    'recetas',
    'mesas',
    'delivery',
    'inventario',
    'proveedores',
    'promociones',
    'reservas',
    'sistema',
    'backups',
    'fichaje'
  ],
  administrador: ALL_SIN_RESTRINGIDOS,
  mozo: ['home', 'mozo', 'caja', 'reservas', 'fichaje', 'mesas', 'menu', 'recetas'] as AppView[],
  cocina: ['home', 'cocina', 'fichaje']
};

export const getAllowedViews = (role: Usuario['rol']): AppView[] => (
  [...(ROLE_PERMISSIONS[role] || [])]
);

export const canAccessView = (role: Usuario['rol'], view: AppView): boolean => {
  const views = ROLE_PERMISSIONS[role];
  return views ? views.includes(view) : false;
};
