// services/userAdminService.ts
import { supabase } from '../lib/supabaseClient';

export type DbUser = {
  id: string;
  email: string;
  name: string | null;
  last_name: string | null;
  location: string | null;
  rol_id: number | null;
  created_at: string;
  is_active: boolean;
};

export async function getUsersPaginated(opts: {
  page: number;
  pageSize: number;
  search?: string;
  location?: string;
  includeInactive?: boolean;
}) {
  const { page, pageSize, search, location, includeInactive } = opts;
  let q = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (search && search.trim().length >= 2) {
    const s = `%${search.trim()}%`;
    q = q.or(
      `email.ilike.${s},name.ilike.${s},last_name.ilike.${s}`
    );
  }

  if (location && location !== 'TODAS') {
    q = q.eq('location', location);
  }

  if (!includeInactive) {
    q = q.eq('is_active', true);
  }

  const { data, error, count } = await q;
  if (error) throw error;
  return { data: (data ?? []) as DbUser[], count: count ?? 0 };
}

export async function updateUser(userId: string, patch: Partial<DbUser>) {
  // Solo campos editables de ficha (no toques id/created_at)
  const { error } = await supabase
    .from('users')
    .update({
      name: patch.name ?? null,
      last_name: patch.last_name ?? null,
      email: patch.email ?? null,
      location: patch.location ?? null,
      rol_id: typeof patch.rol_id === 'number' ? patch.rol_id : null,
    })
    .eq('id', userId);
  if (error) throw error;
}

export async function setUserActive(userId: string, active: boolean) {
  const { error } = await supabase
    .from('users')
    .update({ is_active: active })
    .eq('id', userId);
  if (error) throw error; // Trigger exige users:cancel
}

export async function bulkSetUserActive(ids: string[], active: boolean) {
  if (!ids.length) return;
  const { error } = await supabase
    .from('users')
    .update({ is_active: active })
    .in('id', ids);
  if (error) throw error; // Trigger exige users:cancel
}

export async function deleteUser(userId: string) {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error; // RLS exige users:delete
}
