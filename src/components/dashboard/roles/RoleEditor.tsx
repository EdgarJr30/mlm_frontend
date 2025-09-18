import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { PERMISSIONS } from '../../../rbac/permissionRegistry';
import type { PermissionDef } from '../../../rbac/permissionRegistry';
import { Can, useCan } from '../../../rbac/PermissionsContext';

type Role = { id: number; name: string; description?: string | null };
type RPIdRow = { permission_id: string };
type PermRow = { code: string };

export default function RoleEditor() {
  const { id } = useParams<{ id: string }>();
  const roleId = Number(id);
  const navigate = useNavigate();
  const canManage = useCan('rbac:manage_roles');

  const [role, setRole] = useState<Role | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(roleId)) return;

    const load = async () => {
      const { data: r, error: er } = await supabase
        .from('roles')
        .select('id,name,description')
        .eq('id', roleId)
        .single();
      if (er) throw er;
      setRole(r as Role);

      const { data: rp, error: erp } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);
      if (erp) throw erp;

      const ids =
        (rp as RPIdRow[] | null)?.map((row) => row.permission_id) ?? [];

      let codes: string[] = [];
      if (ids.length > 0) {
        const { data: ps, error: eps } = await supabase
          .from('permissions')
          .select('code')
          .in('id', ids);
        if (eps) throw eps;
        codes = (ps as PermRow[] | null)?.map((p) => p.code) ?? [];
      }

      setChecked(new Set(codes));
    };

    load().catch((err) => {
      const m = err instanceof Error ? err.message : String(err);
      setMsg(`Error cargando rol: ${m}`);
    });
  }, [roleId]);

  const grouped = useMemo(() => {
    const byRes: Record<string, PermissionDef[]> = {};
    for (const p of PERMISSIONS) {
      const code = `${p.resource}:${p.action}`;
      if (filter) {
        const f = filter.toLowerCase();
        const matches =
          p.label.toLowerCase().includes(f) || code.toLowerCase().includes(f);
        if (!matches) continue;
      }
      (byRes[p.resource] ??= []).push(p);
    }
    return Object.entries(byRes).sort(([a], [b]) => a.localeCompare(b));
  }, [filter]);

  const toggle = (code: string) =>
    setChecked((prev) => {
      const n = new Set(prev);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });

  const toggleGroup = (resource: string, selectAll: boolean) => {
    const perms = PERMISSIONS.filter((p) => p.resource === resource);
    setChecked((prev) => {
      const n = new Set(prev);
      perms.forEach((p) => {
        const code = `${p.resource}:${p.action}`;
        if (selectAll) n.add(code);
        else n.delete(code);
      });
      return n;
    });
  };

  const save = async () => {
    if (!Number.isFinite(roleId)) return;
    try {
      setSaving(true);
      const codes = Array.from(checked);
      const { error } = await supabase.rpc('set_role_permissions', {
        p_role_id: roleId,
        p_perm_codes: codes,
      });
      if (error) throw error;
      navigate('/admin/roles');
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Error guardando permisos';
      setMsg(message);
    } finally {
      setSaving(false);
    }
  };

  if (!role)
    return (
      <div className="space-y-3">
        <div className="h-9 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-72 bg-gray-100 rounded animate-pulse" />
        <div className="h-40 bg-gray-50 rounded animate-pulse" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Permisos del rol</h1>
          <p className="text-muted-foreground">{role.name}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-lg border hover:bg-muted"
            onClick={() => navigate(-1)}
          >
            Volver
          </button>
          <Can perm="rbac:manage_roles">
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </Can>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Filtrar por nombre o code…"
          className="w-full md:w-96 px-3 py-2 rounded-lg border focus:outline-none"
          onChange={(e) => setFilter(e.target.value)}
          value={filter}
        />
        <span className="text-sm text-muted-foreground">
          {checked.size} seleccionados
        </span>
      </div>

      {msg && <div className="text-sm text-red-600">{msg}</div>}

      <div className="space-y-4">
        {grouped.map(([resource, perms]) => (
          <section key={resource} className="rounded-2xl border p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold capitalize">
                {resource.replace(/_/g, ' ')}
              </h3>
              <div className="flex gap-2">
                <button
                  className="text-xs px-2 py-1 rounded-md border hover:bg-muted"
                  onClick={() => toggleGroup(resource, true)}
                >
                  Seleccionar todo
                </button>
                <button
                  className="text-xs px-2 py-1 rounded-md border hover:bg-muted"
                  onClick={() => toggleGroup(resource, false)}
                >
                  Quitar todo
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {perms.map((p) => {
                const code = `${p.resource}:${p.action}`;
                const isOn = checked.has(code);
                return (
                  <label
                    key={code}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                      isOn
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={isOn}
                      onChange={() => toggle(code)}
                      disabled={!canManage}
                    />
                    <div className="leading-tight">
                      <div className="font-medium">{p.label}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {code}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
