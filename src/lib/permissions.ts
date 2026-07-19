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
  administrador: [
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
  mozo: ['home', 'mozo', 'caja', 'reservas', 'fichaje', 'mesas'] as AppView[],
  cocina: ['home', 'cocina', 'fichaje']
};

export const getAllowedViews = (role: Usuario['rol']): AppView[] => (
  [...(ROLE_PERMISSIONS[role] || [])]
);

export const canAccessView = (role: Usuario['rol'], view: AppView): boolean => {
  const views = ROLE_PERMISSIONS[role];
  return views ? views.includes(view) : false;
};
