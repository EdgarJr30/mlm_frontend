export type PermissionAction =
  | 'create' | 'read' | 'read_own' | 'update' | 'delete' | 'work' | 'import' | 'export'
  | 'approve' | 'assign' | 'disable' | 'full_access' | 'cancel'
  | 'manage_roles' | 'manage_permissions';

export type PermissionDef = {
  resource: string;   // p.ej. 'tickets', 'WorkRequests', 'reports', 'users', 'assignees', 'rbac'
  action: PermissionAction;
  label: string;
  description?: string;
  is_active?: boolean;
};

const p = (resource: string, action: PermissionAction, label: string, description?: string): PermissionDef =>
  ({ resource: resource.toLowerCase(), action, label, description });

//Helpers tipados para recursos y códigos de permiso
export const RESOURCES = {
  home: 'home',
  work_orders: 'work_orders',
  work_requests: 'work_requests',
  reports: 'reports',
  users: 'users',
  assignees: 'assignees',
  rbac: 'rbac',
  special_incidents: 'special_incidents'
} as const;

type Resource = typeof RESOURCES[keyof typeof RESOURCES];
export type PermCode = `${Resource}:${PermissionAction}`;
export const code = (resource: Resource, action: PermissionAction) => `${resource}:${action}` as PermCode;

export const PERMISSIONS: PermissionDef[] = [
  // RBAC / Admin
  p(RESOURCES.rbac, 'manage_permissions', 'Sincronizar permisos'),
  p(RESOURCES.rbac, 'manage_roles', 'Gestionar roles'),

  // Home / Inicio
  p(RESOURCES.home, 'read', 'Ver inicio'),

  // Tickets / WorkOrders
  p(RESOURCES.work_orders, 'read',        'Ver OT'),
  p(RESOURCES.work_orders, 'read_own',    'Ver mis OT'),
  p(RESOURCES.work_orders, 'create',      'Crear OT'), 
  p(RESOURCES.work_orders, 'full_access', 'Acceso total OT (crear/modificar)'),
  p(RESOURCES.work_orders, 'cancel',      'Cancelar OT'),
  p(RESOURCES.work_orders, 'delete',      'Eliminar OT'),

  // WorkRequests (Solicitudes)
  p(RESOURCES.work_requests, 'read', 'Ver solicitudes'),
  p(RESOURCES.work_requests, 'full_access', 'Acceso total solicitudes (aprobar/editar)'),
  p(RESOURCES.work_requests, 'cancel',      'Cancelar solicitudes'),
  p(RESOURCES.work_requests, 'delete',      'Eliminar solicitudes'),

  // Reportes
  p(RESOURCES.reports, 'read', 'Ver reportes'),

  // Usuarios
  p(RESOURCES.users, 'read',        'Ver usuarios'),
  p(RESOURCES.users, 'create',      'Crear usuarios'),
  p(RESOURCES.users, 'update',      'Editar usuarios'),
  p(RESOURCES.users, 'full_access', 'Acceso total usuarios (crear/modificar)'),
  p(RESOURCES.users, 'cancel',      'Activar/Desactivar usuarios'),
  p(RESOURCES.users, 'delete',      'Eliminar usuarios'),

  // Técnicos (ASSIGNEES)
  p(RESOURCES.assignees, 'read',        'Ver técnicos'),
  p(RESOURCES.assignees, 'full_access', 'Acceso total técnicos (crear/modificar)'),
  p(RESOURCES.assignees, 'cancel',      'Activar/Desactivar técnicos'),
  p(RESOURCES.assignees, 'delete',      'Eliminar técnicos'),

  // Special Incidents
  p(RESOURCES.special_incidents, 'read',        'Ver incidencias especiales'),
  p(RESOURCES.special_incidents, 'full_access', 'Acceso total incidencias especiales (crear/modificar)'),
  p(RESOURCES.special_incidents, 'disable',     'Activar/Desactivar incidencias especiales'),
  p(RESOURCES.special_incidents, 'delete',      'Eliminar incidencias especiales'),
];
