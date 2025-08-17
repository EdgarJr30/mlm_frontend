import type { JSX } from 'react';
import type { RoleName } from '../../services/userService';
import CreateTicketPage from '../../pages/CreateTicketPage';
import LoginPage from '../../pages/LoginPage';
import KanbanPage from '../../pages/KanbanPage';
import InboxPage from '../../pages/InboxPage';
import UserManagementPage from '../../pages/UserManagementPage';
import MyTicketsPage from '../../pages/MyTicketsPage';
import ForbiddenPage from '../../pages/ForbiddenPage';
import ReportsPage from '../../pages/ReportsPage';
import AutoHome from '../../components/Routes/AutoHome';

// Tipado de la ruta
export type AppRoute = {
  path: string;
  element: JSX.Element;
  allow: RoleName[]; // roles permitidos
  name?: string; // texto del menú
  icon?: JSX.Element; // ícono para el menú
  showInSidebar?: boolean; // si aparece en el sidebar
};

const IconDashboard = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="w-5 h-5 mr-2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
  </svg>
);

const IconInbox = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="w-5 h-5 mr-2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3"
    />
  </svg>
);

const IconUsers = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="w-5 h-5 mr-2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
    />
  </svg>
);

const IconProfile = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="w-5 h-5 mr-2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const IconCreate = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="w-5 h-5 mr-2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const IconReports = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="w-5 h-5 mr-2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
    />
  </svg>
);

// Rutas protegidas y de menú
export const APP_ROUTES: AppRoute[] = [
  {
    path: '/kanban',
    element: <KanbanPage />,
    allow: ['admin', 'super_admin'],
    name: 'Dashboard',
    icon: IconDashboard,
    showInSidebar: true,
  },
  {
    path: '/inbox',
    element: <InboxPage />,
    allow: ['admin', 'super_admin'],
    name: 'Bandeja de Entrada',
    icon: IconInbox,
    showInSidebar: true,
  },
  {
    path: '/admin_usuarios',
    element: <UserManagementPage />,
    allow: ['super_admin'],
    name: 'Usuarios',
    icon: IconUsers,
    showInSidebar: true,
  },
  {
    path: '/mi-perfil',
    element: <MyTicketsPage />,
    allow: ['user', 'admin', 'super_admin'],
    name: 'Mi Perfil',
    icon: IconProfile,
    showInSidebar: true,
  },
  {
    path: '/crear-ticket',
    element: <CreateTicketPage />,
    allow: ['user', 'admin', 'super_admin'],
    name: 'Crear Ticket',
    icon: IconCreate,
    showInSidebar: true,
  },
  {
    path: '/informes',
    element: <ReportsPage />,
    allow: ['super_admin'],
    name: 'Informes',
    icon: IconReports,
    showInSidebar: true,
  },

  // Rutas no visibles en el sidebar
  {
    path: '/',
    element: <AutoHome />,
    allow: ['user', 'admin', 'super_admin'],
    showInSidebar: false,
  },
];

// Rutas públicas / especiales que no usan RequireRole
export const PUBLIC_ROUTES = [
  { path: '/login', element: <LoginPage /> },
  { path: '/403', element: <ForbiddenPage /> },
];
