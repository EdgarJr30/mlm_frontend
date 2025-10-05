import { useEffect, useMemo, useState, type JSX } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/navigation/Navbar';
import { Can, useCan } from '../../rbac/PermissionsContext';
import { cn } from '../../utils/cn';
import { Settings, ShieldCheck, ListChecks } from 'lucide-react';

import GeneralSettings from '../../components/dashboard/admin/GeneralSettings';
import RoleList from '../../components/dashboard/roles/RoleList';
import PermissionsTable from '../../components/dashboard/permissions/PermissionsTable';
import RoleUsersModal from './RoleUsersModal';

type TabKey = 'general' | 'roles' | 'permissions';

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

  const canSeePermissions = useCan('rbac:manage_permissions');
  const canManageRoles = useCan('rbac:manage_roles');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const rawTab = q.get('tab') as TabKey | null;
  const computedInitial: TabKey =
    rawTab ||
    (canManageRoles ? 'roles' : canSeePermissions ? 'permissions' : 'general');

  const [tab, setTab] = useState<TabKey>(computedInitial);

  // Estado del modal “Usuarios por rol”
  const [roleUsersModal, setRoleUsersModal] = useState<{
    open: boolean;
    roleId?: number;
  }>({
    open: false,
  });

  // Redirecciones por permisos
  useEffect(() => {
    if (tab === 'roles' && !canManageRoles) {
      const next: TabKey = canSeePermissions ? 'permissions' : 'general';
      setTab(next);
      navigate(`/admin/settings?tab=${next}`, { replace: true });
    }
    if (tab === 'permissions' && !canSeePermissions) {
      const next: TabKey = canManageRoles ? 'roles' : 'general';
      setTab(next);
      navigate(`/admin/settings?tab=${next}`, { replace: true });
    }
  }, [tab, canManageRoles, canSeePermissions, navigate]);

  // Mantener tab en la URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    navigate(`/admin/settings?${params.toString()}`, { replace: true });
  }, [tab, navigate]);

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
                Administra parámetros de la plataforma, roles y permisos.
              </p>
            </div>

            <TopTabs
              value={tab}
              onChange={(t) => setTab(t)}
              disabledPermissionsTab={!canSeePermissions}
              disabledRolesTab={!canManageRoles}
            />
          </div>
        </header>

        <section className="flex-1 overflow-x-auto px-4 md:px-6 lg:px-8 pt-4 pb-8">
          {tab === 'roles' && (
            <Can perm="rbac:manage_roles">
              <div className="space-y-6">
                <RoleList
                  searchTerm={searchTerm}
                  onOpenUsers={(roleId: number) =>
                    setRoleUsersModal({ open: true, roleId })
                  }
                />
                <p className="text-xs text-gray-500">
                  Tip: usa el botón “Usuarios” para gestionar miembros del rol
                  sin salir de esta pantalla.
                </p>
              </div>
            </Can>
          )}

          {tab === 'permissions' && (
            <Can perm="rbac:manage_permissions">
              <PermissionsTable searchTerm={searchTerm} />
            </Can>
          )}

          {tab === 'general' && (
            <div className="max-w-3xl">
              <GeneralSettings />
            </div>
          )}
        </section>
      </main>

      {roleUsersModal.open && typeof roleUsersModal.roleId === 'number' && (
        <RoleUsersModal
          roleId={roleUsersModal.roleId}
          onClose={() => setRoleUsersModal({ open: false })}
        />
      )}
    </div>
  );
}
