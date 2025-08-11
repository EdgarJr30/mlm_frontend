import { supabase } from "../lib/supabaseClient";

export type RoleName = "super_admin" | "admin" | "user";

export type UserProfile = {
  id: string;
  name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  location: string;
};

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

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, name, last_name, email, phone, location")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error.message);
    return null;
  }
  return data as UserProfile;
}