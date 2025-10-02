// src/pages/admin/AdminSettingsHubPage.tsx
import { useEffect, useMemo, useState, type JSX } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/navigation/Navbar';
import { Can, useCan } from '../../rbac/PermissionsContext';
import { cn } from '../../utils/cn';
import { Settings, ShieldCheck, ListChecks, UsersRound } from 'lucide-react';

// Secciones (reutilizamos tus componentes existentes)
import GeneralSettings from '../../components/dashboard/admin/GeneralSettings';
import RoleList from '../../components/dashboard/roles/RoleList';
import PermissionsTable from '../../components/dashboard/permissions/PermissionsTable';
import RoleUsersPage from './RoleUsersPage';

type TabKey = 'general' | 'roles' | 'permissions' | 'role-users';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function TopTabs({
  value,
  onChange,
  disabledPermissionsTab,
  disabledRolesTab,
}: {
  value: TabKey;
  onChange: (t: TabKey) => void;
  disabledPermissionsTab?: boolean;
  disabledRolesTab?: boolean;
}) {
  const Item = ({
    k,
    icon,
    label,
    disabled,
  }: {
    k: TabKey;
    icon: JSX.Element;
    label: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(k)}
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition cursor-pointer',
        value === k
          ? 'bg-indigo-600 text-white'
          : 'bg-white hover:bg-gray-50 border',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      title={disabled ? 'No tienes permiso' : undefined}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );

  // Orden requerido: 1) Roles, 2) Permisos, 3) General
  return (
    <div className="inline-flex rounded-2xl border bg-white p-1 shadow-sm">
      <Item
        k="roles"
        label="Roles"
        icon={<ShieldCheck className="h-4 w-4" />}
        disabled={disabledRolesTab}
      />
      <Item
        k="permissions"
        label="Permisos"
        icon={<ListChecks className="h-4 w-4" />}
        disabled={disabledPermissionsTab}
      />
      <Item
        k="general"
        label="General"
        icon={<Settings className="h-4 w-4" />}
      />
    </div>
  );
}

export default function AdminSettingsHubPage() {
  const q = useQuery();
  const navigate = useNavigate();

  // Permisos (antes del estado de tab para decidir default)
  const canSeePermissions = useCan('rbac:manage_permissions');
  const canManageRoles = useCan('rbac:manage_roles');

  // Estado de barra superior (Navbar)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Tab inicial: si no hay ?tab, prioriza roles → permisos → general
  const initialFromQuery = q.get('tab') as TabKey | null;
  const computedInitial: TabKey =
    initialFromQuery ||
    (canManageRoles ? 'roles' : canSeePermissions ? 'permissions' : 'general');

  const [tab, setTab] = useState<TabKey>(computedInitial);

  // Para sub-pantalla Role Users
  const roleIdFromQuery = q.get('roleId');

  // Si llegan a role-users sin roleId: caer a roles
  useEffect(() => {
    if (tab === 'role-users' && !roleIdFromQuery) {
      setTab('roles');
      navigate('/admin/settings?tab=roles', { replace: true });
    }
  }, [tab, roleIdFromQuery, navigate]);

  // Si no tiene permiso de roles y está en roles o role-users: redirige
  useEffect(() => {
    if ((tab === 'roles' || tab === 'role-users') && !canManageRoles) {
      const next: TabKey = canSeePermissions ? 'permissions' : 'general';
      setTab(next);
      navigate(`/admin/settings?tab=${next}`, { replace: true });
    }
  }, [tab, canManageRoles, canSeePermissions, navigate]);

  // Si no tiene permiso de permisos y está en permissions: redirige
  useEffect(() => {
    if (tab === 'permissions' && !canSeePermissions) {
      const next: TabKey = canManageRoles ? 'roles' : 'general';
      setTab(next);
      navigate(`/admin/settings?tab=${next}`, { replace: true });
    }
  }, [tab, canSeePermissions, canManageRoles, navigate]);

  // Mantener tab en la URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (tab === 'role-users' && roleIdFromQuery)
      params.set('roleId', roleIdFromQuery);
    navigate(`/admin/settings?${params.toString()}`, { replace: true });
  }, [tab, roleIdFromQuery, navigate]);

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex flex-col h-[100dvh] overflow-hidden flex-1">
        <div className="w-full">
          <Navbar
            onSearch={setSearchTerm}
            onFilterLocation={setSelectedLocation}
            selectedLocation={selectedLocation}
          />
        </div>

        <header className="px-4 md:px-6 lg:px-8 pb-0 pt-4 md:pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Configuración</h1>
              <p className="text-sm text-gray-500">
                Administra parámetros de la plataforma, roles y permisos, todo
                en un solo lugar.
              </p>
            </div>

            <TopTabs
              value={tab === 'role-users' ? 'roles' : tab}
              onChange={(t) => {
                setTab(t);
                // Si pasan de role-users a otro tab, limpia roleId
                if (t !== 'role-users' && roleIdFromQuery) {
                  navigate(`/admin/settings?tab=${t}`, { replace: true });
                }
              }}
              disabledPermissionsTab={!canSeePermissions}
              disabledRolesTab={!canManageRoles}
            />
          </div>

          {/* Sub-nav pegajosa cuando se está en role-users */}
          {tab === 'role-users' && (
            <div className="mt-3 rounded-xl bg-white border shadow-sm px-3 py-2 flex items-center justify-between sticky top-0 z-10">
              <div className="inline-flex items-center gap-2 text-sm">
                <UsersRound className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">Usuarios por rol</span>
              </div>
              <button
                type="button"
                className="text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
                onClick={() => setTab('roles')}
              >
                ← Volver a Roles
              </button>
            </div>
          )}
        </header>

        <section className="flex-1 overflow-x-auto px-4 md:px-6 lg:px-8 pt-4 pb-8">
          {/* ROLES (ahora primera) */}
          {tab === 'roles' && (
            <Can perm="rbac:manage_roles">
              <div className="space-y-6">
                <RoleList searchTerm={searchTerm} />
                <p className="text-xs text-gray-500">
                  Tip: desde aquí puedes navegar a “Usuarios por rol” y volver
                  sin perder el contexto.
                </p>
              </div>
            </Can>
          )}

          {/* PERMISOS (ahora segunda) */}
          {tab === 'permissions' && (
            <Can perm="rbac:manage_permissions">
              <PermissionsTable searchTerm={searchTerm} />
            </Can>
          )}

          {/* GENERAL (tercera) */}
          {tab === 'general' && (
            <div className="max-w-3xl">
              <GeneralSettings />
            </div>
          )}

          {/* ROLE USERS */}
          {tab === 'role-users' && roleIdFromQuery && (
            <Can perm="rbac:manage_roles">
              <RoleUsersPage externalSearchTerm={searchTerm} />
            </Can>
          )}
        </section>
      </main>
    </div>
  );
}
