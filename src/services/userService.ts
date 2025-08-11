import { supabase } from "../lib/supabaseClient";

export type RoleName = "super_admin" | "admin" | "user";

export async function getCurrentUserRole(): Promise<RoleName | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("getSession error:", sessionError.message);
    return null;
  }
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  // 1) Obtener rol_id de la tabla users
  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("rol_id")
    .eq("id", userId)
    .single();

  if (userErr || !userRow) {
    console.warn("No se pudo obtener rol_id del usuario:", userErr?.message);
    return null;
  }

  // 2) Obtener nombre del rol
  const { data: roleRow, error: roleErr } = await supabase
    .from("roles")
    .select("name")
    .eq("id", userRow.rol_id)
    .single();

  if (roleErr || !roleRow) {
    console.warn("No se pudo obtener el nombre del rol:", roleErr?.message);
    return null;
  }

  return roleRow.name as RoleName;
}
