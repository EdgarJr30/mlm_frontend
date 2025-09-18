import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { Can } from '../../../rbac/PermissionsContext';
import { syncPermissions } from '../../../rbac/syncPermissions';

export type Role = { id: number; name: string; description?: string | null };

interface Props {
  searchTerm?: string;
}

export default function RoleList({ searchTerm = '' }: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('roles')
      .select('id,name,description')
      .order('name');

    if (error) setMsg(error.message);
    setRoles((data ?? []) as Role[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
    );
  }, [roles, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Roles</h1>
        <div className="flex gap-2">
          <Can perm="rbac:manage_permissions">
            <button
              className="px-3 py-2 rounded-lg border hover:bg-muted bg-white"
              onClick={async () => {
                await syncPermissions();
                await load();
              }}
              title="Sincroniza permisos del registro en código hacia la BD"
            >
              Sincronizar permisos
            </button>
          </Can>
          <Can perm="rbac:manage_roles">
            <Link
              to="/admin/roles/new"
              onClick={(e) => {
                e.preventDefault();
                setOpenCreate(true);
              }}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
            >
              Nuevo rol
            </Link>
          </Can>
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 grid gap-2 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              🔎
            </div>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? 'No hay roles que coincidan con tu búsqueda.'
                : 'No hay roles.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Descripción</th>
                <th className="text-right p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {r.description ?? '—'}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/admin/roles/${r.id}`}
                      className="px-3 py-1.5 rounded-md border hover:bg-muted"
                    >
                      Editar permisos
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {msg && <div className="border-t p-3 text-sm text-red-600">{msg}</div>}
      </div>

      {openCreate && (
        <RoleCreateModal
          onClose={() => {
            setOpenCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

/* Modal en el mismo archivo para tu conveniencia.
   Si prefieres, muévelo a: ./RoleCreateModal.tsx y exporta por default. */
function RoleCreateModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!name.trim()) {
      setMsg('Escribe un nombre de rol.');
      return;
    }
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('roles')
        .insert({ name: name.trim(), description: description.trim() || null });
      if (error) throw error;
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMsg(err.message);
      } else {
        setMsg('Error creando rol');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nuevo rol</h2>
            <button onClick={onClose} className="text-gray-500">
              ✕
            </button>
          </div>
          <form onSubmit={createRole} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium">Nombre</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="p.ej. Administrador"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Descripción (opcional)
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Permite administrar usuarios, roles y permisos"
              />
            </div>
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border px-3 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? 'Creando…' : 'Crear rol'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
