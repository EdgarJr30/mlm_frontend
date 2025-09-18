export type PermissionAction =
  | 'create' | 'read' | 'update' | 'delete'
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
  ({ resource, action, label, description });

export const PERMISSIONS: PermissionDef[] = [
  // RBAC / Admin
  p('rbac', 'manage_permissions', 'Sincronizar permisos'),
  p('rbac', 'manage_roles', 'Gestionar roles'),

  // Tickets / WorkOrders
  p('tickets', 'create', 'Crear tickets'),
  p('tickets', 'read', 'Ver tickets'),
  p('tickets', 'update', 'Editar tickets'),
  p('tickets', 'delete', 'Eliminar tickets'),
  p('tickets', 'work', 'Trabajar tickets'),
  p('tickets', 'approve', 'Aprobar / Rechazar solicitudes'),

  // WorkRequests (Solicitudes)
  p('workRequests', 'read', 'Ver bandeja de solicitudes'),

  // Reportes
  p('reports', 'read', 'Ver reportes'),

  // Usuarios
  p('users', 'read', 'Ver usuarios'),
  p('users', 'create', 'Crear usuarios'),
  p('users', 'update', 'Editar usuarios'),

  // Técnicos
  p('assignees', 'read', 'Ver técnicos'),
  p('assignees', 'update', 'Gestionar técnicos'),
];
