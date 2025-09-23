// components/admin/roles/RoleUsersPage.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getUsersByRolePaginated,
  getUsersWithoutRolePaginated,
  bulkSetUsersRole,
  bulkClearUsersRole,
  type DbUser,
} from '../../services/userAdminService'; // 👈 ajusta si tu estructura difiere
import { showToastError, showToastSuccess } from '../../notifications';
import { useCan } from '../../rbac/PermissionsContext';

const PAGE_SIZE = 8;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function ActiveChip({ active }: { active: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
      )}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

type Props = {
  /** (opcional) Búsqueda que viene del Navbar externo del layout */
  externalSearchTerm?: string;
};

export default function RoleUsersPage({ externalSearchTerm = '' }: Props) {
  const { roleId } = useParams();
  const roleIdNum = Number(roleId);
  const canManageRoles = useCan('rbac:manage_roles');

  const [roleName, setRoleName] = useState<string>('Rol');
  const [search, setSearch] = useState(''); // búsqueda local (se sincroniza con externa si viene)
  const [includeInactive, setIncludeInactive] = useState(false);

  const [rows, setRows] = useState<DbUser[]>([]);
  const [selected, setSelected] = useState<DbUser[]>([]);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [openAdd, setOpenAdd] = useState(false);

  // Sincroniza la búsqueda externa del Navbar (RoleManagementPage) con la local
  useEffect(() => {
    setPage(0);
    setSearch(externalSearchTerm || '');
  }, [externalSearchTerm]);

  const allChecked = selected.length > 0 && selected.length === rows.length;
  const indeterminate = selected.length > 0 && selected.length < rows.length;
  const checkbox = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (checkbox.current) checkbox.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const loadRole = useCallback(async () => {
    const { data, error } = await (
      await import('../../lib/supabaseClient')
    ).supabase
      .from('roles')
      .select('name')
      .eq('id', roleIdNum)
      .maybeSingle();
    if (error) showToastError(error.message);
    else if (data?.name) setRoleName(data.name);
  }, [roleIdNum]);

  const load = useCallback(async () => {
    if (!roleIdNum) return;
    setLoading(true);
    try {
      const { data, count } = await getUsersByRolePaginated({
        roleId: roleIdNum,
        page,
        pageSize: PAGE_SIZE,
        search: search.trim().length >= 2 ? search : undefined,
        includeInactive,
      });
      setRows(data);
      setCount(count);
      setSelected([]);
    } catch (e) {
      showToastError(
        e instanceof Error ? e.message : 'Error cargando usuarios del rol'
      );
    } finally {
      setLoading(false);
    }
  }, [roleIdNum, page, search, includeInactive]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const toggleAll = () => setSelected(allChecked ? [] : rows);

  const removeFromRole = async (ids: string[]) => {
    if (!canManageRoles) {
      showToastError('No tienes permiso para gestionar roles.');
      return;
    }
    try {
      await bulkClearUsersRole(ids);
      showToastSuccess(
        ids.length === 1
          ? 'Usuario removido del rol.'
          : 'Usuarios removidos del rol.'
      );
      await load();
    } catch (e) {
      showToastError(
        e instanceof Error ? e.message : 'Error removiendo usuarios del rol'
      );
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-6">
      {/* Header propio de la sección */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Usuarios del rol:{' '}
            <span className="text-indigo-700">{roleName}</span>
          </h1>
          <p className="text-sm text-gray-500">
            Gestiona qué usuarios pertenecen a este rol.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/permisos"
            className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
          >
            ← Volver a roles
          </Link>
          <button
            type="button"
            onClick={() => setOpenAdd(true)}
            disabled={!canManageRoles}
            title={!canManageRoles ? 'No tienes permiso' : undefined}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer"
          >
            Agregar usuarios
          </button>
        </div>
      </div>

      {/* Toolbar interna (además de la búsqueda del Navbar) */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Buscar (nombre, apellido, email, ubicación)…"
          className="w-full sm:w-80 rounded-lg border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
        />
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
            checked={includeInactive}
            onChange={(e) => {
              setPage(0);
              setIncludeInactive(e.target.checked);
            }}
          />
          Mostrar inactivos
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => removeFromRole(selected.map((u) => u.id))}
            disabled={!canManageRoles || selected.length === 0}
            className="inline-flex items-center rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-40 cursor-pointer"
            title={!canManageRoles ? 'No tienes permiso' : undefined}
          >
            Quitar selección del rol
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="text-sm text-gray-700">
        Página {page + 1} de {totalPages} — {count} usuario(s)
      </div>

      {/* Tabla */}
      <div className="flex-1 min-h-0 overflow-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 w-12">
                <input
                  ref={checkbox}
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                  checked={allChecked}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Apellido
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Ubicación
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Creado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  No hay usuarios en este rol.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const isSelected = selected.includes(u);
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 w-12">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelected((prev) => [...prev, u]);
                          else
                            setSelected((prev) => prev.filter((x) => x !== u));
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {u.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {u.last_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {u.location ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ActiveChip active={u.is_active} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(u.created_at).toLocaleString('es-DO')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-rose-600 hover:text-rose-500 text-sm cursor-pointer disabled:opacity-40"
                        disabled={!canManageRoles}
                        title={
                          !canManageRoles ? 'No tienes permiso' : undefined
                        }
                        onClick={() => void removeFromRole([u.id])}
                      >
                        Quitar del rol
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium disabled:opacity-40 cursor-pointer hover:bg-gray-300 disabled:hover:bg-gray-200"
        >
          Anterior
        </button>
        <button
          onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
          disabled={page + 1 >= totalPages}
          className="px-4 py-2 rounded bg-indigo-600 text-white font-medium disabled:opacity-40 cursor-pointer hover:bg-indigo-500 disabled:hover:bg-indigo-600"
        >
          Siguiente
        </button>
      </div>

      {openAdd && (
        <AddUsersModal
          roleId={roleIdNum}
          roleName={roleName}
          onClose={async (changed) => {
            setOpenAdd(false);
            if (changed) await load();
          }}
        />
      )}
    </div>
  );
}

function AddUsersModal({
  roleId,
  roleName,
  onClose,
}: {
  roleId: number;
  roleName: string;
  onClose: (changed: boolean) => void;
}) {
  const canManageRoles = useCan('rbac:manage_roles');
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [rows, setRows] = useState<DbUser[]>([]);
  const [selected, setSelected] = useState<DbUser[]>([]);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 8;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await getUsersWithoutRolePaginated({
        page,
        pageSize: PAGE_SIZE,
        search: search.trim().length >= 2 ? search : undefined,
        includeInactive,
      });
      setRows(data);
      setCount(count);
      setSelected([]);
    } catch (e) {
      showToastError(
        e instanceof Error ? e.message : 'Error cargando usuarios sin rol'
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, includeInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const addToRole = async () => {
    if (!canManageRoles) {
      showToastError('No tienes permiso para gestionar roles.');
      return;
    }
    try {
      await bulkSetUsersRole(
        selected.map((u) => u.id),
        roleId
      );
      showToastSuccess('Usuarios agregados al rol ' + roleName + '.');
      onClose(true);
    } catch (e) {
      showToastError(
        e instanceof Error ? e.message : 'Error agregando usuarios al rol'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => onClose(false)}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Agregar usuarios al rol:{' '}
              <span className="text-indigo-700">{roleName}</span>
            </h2>
            <button
              onClick={() => onClose(false)}
              className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Toolbar */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              placeholder="Buscar…"
              className="w-full sm:w-80 rounded-lg border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                checked={includeInactive}
                onChange={(e) => {
                  setPage(0);
                  setIncludeInactive(e.target.checked);
                }}
              />
              Mostrar inactivos
            </label>
          </div>

          {/* Lista */}
          <div className="mt-4 max-h-[55vh] overflow-auto rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Sel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Apellido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Ubicación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Cargando…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Sin usuarios disponibles.
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => {
                    const isSel = selected.includes(u);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                            checked={isSel}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelected((prev) => [...prev, u]);
                              else
                                setSelected((prev) =>
                                  prev.filter((x) => x !== u)
                                );
                            }}
                          />
                        </td>
                        <td className="px-4 py-2 text-sm">{u.name ?? '—'}</td>
                        <td className="px-4 py-2 text-sm">
                          {u.last_name ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-sm">{u.email}</td>
                        <td className="px-4 py-2 text-sm">
                          {u.location ?? '—'}
                        </td>
                        <td className="px-4 py-2">
                          <ActiveChip active={u.is_active} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {selected.length} seleccionado(s) — Página {page + 1} de{' '}
              {totalPages} ({count} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-2 rounded border text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                disabled={page + 1 >= totalPages}
                className="px-3 py-2 rounded border text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente
              </button>
              <button
                onClick={addToRole}
                disabled={selected.length === 0 || !canManageRoles}
                className="ml-2 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                Agregar al rol
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
