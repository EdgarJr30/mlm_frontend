// src/hooks/useMyRoles.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useMyRoles() {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user }, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        if (!user) {
          if (alive) { setRoles([]); setLoading(false); }
          return;
        }

        // ✅ Pedimos los roles por su nombre haciendo inner-join a user_roles
        //    Esto devuelve filas de roles, no arrays anidados confusos.
        const { data: rows, error: joinErr } = await supabase
          .from('roles')
          .select('name, user_roles!inner(user_id)')
          .eq('user_roles.user_id', user.id);

        if (joinErr) throw joinErr;

        const names = (rows ?? [])
          .map((r: { name?: string | null }) => r.name)
          .filter((n): n is string => Boolean(n && n.trim()));

        if (alive) { setRoles(names); setLoading(false); }
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Error cargando roles');
        setRoles([]);
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  return { roles, loading, error };
}
