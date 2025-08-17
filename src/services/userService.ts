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
  const { data: { session }, error: sErr } = await supabase.auth.getSession();
  if (sErr) { console.error("getSession error:", sErr.message); return null; }

  const userId = session?.user?.id;
  if (!userId) return null;

  type EmbedData = { rol_id: string | null; roles?: { name: string } | null };
  const { data: embedData, error: embedErr } = await supabase
    .from("users")
    .select("rol_id, roles:roles!users_rol_id_fkey(name)")
    .eq("id", userId)
    .maybeSingle<EmbedData>();

  if (embedErr) {
    console.warn("embed error:", embedErr.message);
  }

  let roleName = embedData?.roles?.name as RoleName | undefined;

  if (!roleName && embedData?.rol_id != null) {
    const { data: roleRow, error: roleErr } = await supabase
      .from("roles")
      .select("name")
      .eq("id", embedData.rol_id)
      .maybeSingle();

    if (roleErr) {
      console.warn("roles lookup error:", roleErr.message);
      return null;
    }
    roleName = roleRow?.name as RoleName | undefined;
  }

  return roleName ?? null;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, name, last_name, email, phone, location")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user profile:", error.message);
    return null;
  }
  return (data ?? null) as UserProfile | null;
}