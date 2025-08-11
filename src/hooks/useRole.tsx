import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSession } from "../utils/auth";

export function useRole() {
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setRoleLoading(true);
      const { data } = await getSession();
      const user = data.session?.user;
      if (!user) {
        setRole(null);
        setRoleLoading(false);
        return;
      }

      // **Siempre desde BD**
      type UserWithRole = {
        rol_id: number;
        roles: {
          name: string;
        } | null;
      };

      const { data: u } = await supabase
        .from("users")
        .select("rol_id, roles(name)")
        .eq("id", user.id)
        .single<UserWithRole>();

      const r = u?.roles?.name
        ? String(u.roles.name).trim().toLowerCase()
        : null;

      setRole(r);
      setRoleLoading(false);
    })();
  }, []);

  return { role, roleLoading };
}
