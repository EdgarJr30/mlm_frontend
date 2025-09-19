export type PermissionAction =
  | 'create' | 'read' | 'read_own' | 'update' | 'delete'
  | 'work' | 'import' | 'export'
  | 'approve' | 'assign' | 'disable'
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
  p(RESOURCES.work_orders, 'read', 'Ver OT'),
  p(RESOURCES.work_orders, 'read_own', 'Ver mis OT'),
  p(RESOURCES.work_orders, 'create', 'Crear OT'),
  p(RESOURCES.work_orders, 'update', 'Editar OT'),
  p(RESOURCES.work_orders, 'delete', 'Eliminar OT'),
  p(RESOURCES.work_orders, 'work', 'Trabajar OT'),
  p(RESOURCES.work_orders, 'approve', 'Aprobar / Rechazar OT'),

  // WorkRequests (Solicitudes)
  p(RESOURCES.work_requests, 'read', 'Ver solicitudes'),
  p(RESOURCES.work_requests, 'create', 'Crear solicitudes'),
  p(RESOURCES.work_requests, 'update', 'Editar solicitudes'),
  p(RESOURCES.work_requests, 'delete', 'Eliminar solicitudes'),
  p(RESOURCES.work_requests, 'work', 'Trabajar solicitudes'),
  p(RESOURCES.work_requests, 'approve', 'Aprobar / Rechazar solicitudes'),

  // Reportes
  p(RESOURCES.reports, 'read', 'Ver reportes'),

  // Usuarios
  p(RESOURCES.users, 'read', 'Ver usuarios'),
  p(RESOURCES.users, 'create', 'Crear usuarios'),
  p(RESOURCES.users, 'update', 'Editar usuarios'),

  // Técnicos
  p(RESOURCES.assignees, 'read', 'Ver técnicos'),
  p(RESOURCES.assignees, 'create', 'Crear técnicos'),
  p(RESOURCES.assignees, 'update', 'Gestionar técnicos'),
  p(RESOURCES.assignees, 'delete', 'Eliminar técnicos'),
];
