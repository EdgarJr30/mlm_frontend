import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { PERMISSIONS } from '../../../rbac/permissionRegistry';
import { Can } from '../../../rbac/PermissionsContext';
import { syncPermissions } from '../../../rbac/syncPermissions';

type DbPerm = {
  id: string;
  code: string;
  label?: string | null;
  description?: string | null;
};

interface Props {
  searchTerm?: string;
}

export default function PermissionsTable({ searchTerm = '' }: Props) {
  const [rows, setRows] = useState<DbPerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('permissions')
      .select('id,code,label,description')
      .order('code');
    if (error) setMsg(error.message);
    setRows((data ?? []) as DbPerm[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        (r.label ?? '').toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
    );
  }, [rows, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Permisos</h3>
        <Can perm="rbac:manage_permissions">
          <button
            className="px-3 py-2 rounded-lg border hover:bg-muted bg-white"
            onClick={async () => {
              await syncPermissions();
              await load();
            }}
          >
            Sincronizar
          </button>
        </Can>
      </div>
      <div className="rounded-2xl border bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 grid gap-2 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No hay permisos.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Label</th>
                <th className="text-left p-3">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{p.code}</td>
                  <td className="p-3">{p.label ?? '—'}</td>
                  <td className="p-3 text-muted-foreground">
                    {p.description ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {msg && <div className="border-t p-3 text-sm text-red-600">{msg}</div>}
      </div>

      <details className="rounded-xl border bg-white p-4">
        <summary className="cursor-pointer font-medium">
          ¿Qué se sincroniza?
        </summary>
        <p className="mt-2 text-sm text-muted-foreground">
          Se comparan los permisos definidos en{' '}
          <code className="font-mono">permissionRegistry.ts</code> con la tabla
          <code className="font-mono"> permissions</code> y se
          insertan/actualizan los faltantes. No elimina registros manuales.
        </p>
        <div className="mt-3 text-xs text-muted-foreground">
          <strong>Total en código:</strong> {PERMISSIONS.length}
        </div>
      </details>
    </div>
  );
}
