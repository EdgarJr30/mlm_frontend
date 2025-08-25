import { supabase } from "../lib/supabaseClient";
import type { Ticket } from "../types/Ticket";
import type { FilterState } from "../types/filters";
import type { InboxFilterKey } from "../features/tickets/inboxFilters";

const PAGE_SIZE = 20;
type Status = Ticket["status"];
export type TicketCounts = Record<Status, number>;

/**
 * Normaliza el rango de fechas a límites del día (00:00:00 / 23:59:59).
 */
function normalizeDateRange(
  v: FilterState<InboxFilterKey>['created_at']
): { from?: string; to?: string } | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const from = (v as { from?: string }).from;
  const to   = (v as { to?: string }).to;
  return {
    from: from ? `${from} 00:00:00` : undefined,
    to:   to   ? `${to} 23:59:59`   : undefined,
  };
}

export async function createTicket(ticket: Omit<Ticket, "id" | "status" | "created_by">) {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("No hay sesión activa.");

  const { data, error } = await supabase
    .from("tickets")
    .insert([{
      ...ticket,
      status: "Pendiente",
      assignee: "Sin asignar",
      created_by: user.id,
    }])
    .select("id, title")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllTickets(page: number): Promise<Ticket[]> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error al obtener tickets:", error.message);
    return [];
  }

  return data as Ticket[];
}

export async function updateTicket(id: number, updatedData: Partial<Ticket>) {
  const { error } = await supabase
    .from("tickets")
    .update(updatedData)
    .eq("id", id);

  if (error) {
    throw new Error(`Error al actualizar el ticket: ${error.message}`);
  }
}

export async function getTicketsByUserId(userId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Ticket[];
}

export async function getTicketsByStatusPaginated(status: Ticket['status'], page: number, pageSize: number, location?: string) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("tickets")
    .select("*")
    .eq("status", status)
    .eq("is_accepted", true) 
    .order("id", { ascending: false })
    .range(from, to);

  if (status === "Pendiente") {
    query = query.eq("is_accepted", true);
  }
  if (location) {
    query = query.eq("location", location);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`❌ Error al cargar tickets con estado "${status}":`, error.message);
    return [];
  }
  return data as Ticket[];
}

export async function getFilteredTickets(term: string, location?: string, isAccepted?: boolean): Promise<Ticket[]> {
  let query = supabase
    .from("tickets")
    .select("*")
    .order("id", { ascending: false });

  // Aquí decides a quién buscas
  if (typeof isAccepted === "boolean") {
    query = query.eq("is_accepted", isAccepted);
  }

  if (location) {
    query = query.eq("location", location);
  }

  if (term.length >= 2) {
    const filters = [
      `title.ilike.%${term}%`,
      `requester.ilike.%${term}%`,
    ];
    if (!isNaN(Number(term))) filters.push(`id.eq.${term}`);
    query = query.or(filters.join(","));
  }

  const { data, error } = await query;
  if (error) {
    console.error("❌ Error buscando tickets:", error.message);
    return [];
  }
  return data as Ticket[];
}

export async function getUnacceptedTicketsPaginated(page: number, pageSize: number, location?: string) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("tickets")
    .select("*", { count: "exact" })
    .eq("is_accepted", false)
    .order("id", { ascending: false })
    .range(from, to);

  if (location) {
    query = query.eq("location", location);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("❌ Error al cargar tickets no aceptados:", error.message);
    return { data: [], count: 0 };
  }

  return { data: data as Ticket[], count: count || 0 };
}

export async function acceptTickets(ticketIds: string[]): Promise<void> {
  const { error } = await supabase
    .from("tickets")
    .update({ is_accepted: true })
    .in("id", ticketIds);

  if (error) throw new Error(error.message);
}

export async function getTicketCountsRPC(filters?: {
  term?: string;
  location?: string;
}): Promise<TicketCounts> {
  const { data, error } = await supabase.rpc("ticket_counts", {
    p_location: filters?.location ?? null,
    p_term: filters?.term ?? null,
  });

  if (error) {
    console.error("RPC ticket_counts error:", error.message);
  }

  // inicializa en 0 y rellena con lo que devuelva la RPC
  const out: TicketCounts = {
    "Pendiente": 0,
    "En Ejecución": 0,
    "Finalizadas": 0,
  };

  (data as { status: Status; total: number }[] | null | undefined)?.forEach(
    (row) => {
      if (row?.status && typeof row.total === "number") {
        out[row.status] = row.total;
      }
    }
  );

  return out;
}

/**
 * Filtra directamente en Supabase (server-side) con paginación y count.
 * SIN serverFiltering.ts y SIN inboxServerSchema.ts
 */
export async function getTicketsByFiltersPaginated(
  values: FilterState<InboxFilterKey>,
  page: number,
  pageSize: number
): Promise<{ data: Ticket[]; count: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("tickets")
    .select("*", { count: "exact" })
    .eq("is_accepted", false); 

  // q (búsqueda libre: título, solicitante, id numérico)
  const term = typeof values.q === 'string' ? values.q.trim() : '';
  if (term.length >= 2) {
    const ors = [`title.ilike.%${term}%`, `requester.ilike.%${term}%`];
    const n = Number(term);
    if (!Number.isNaN(n)) ors.push(`id.eq.${n}`);
    q = q.or(ors.join(','));
  }

  // location
  const location = (values.location as string) || '';
  if (location) q = q.eq("location", location);

  // accepted -> is_accepted
  if (typeof values.accepted === 'boolean') {
    q = q.eq("is_accepted", values.accepted);
  }

  // created_at (rango normalizado a 00:00:00 / 23:59:59)
  const range = normalizeDateRange(values.created_at);
  if (range?.from) q = q.gte("created_at", range.from);
  if (range?.to)   q = q.lte("created_at", range.to);

  // has_image
  if (values.has_image === true) {
    // Si también quieres excluir NULL explícito, puedes añadir un .not('image','is',null)
    q = q.neq("image", "");
  }

  // priority (mapea valores UI -> valores en DB si en DB están capitalizados)
  const priorities = Array.isArray(values.priority)
    ? (values.priority as (string | number)[]).map(String)
    : [];
  if (priorities.length) {
    const PRIORITY_DB: Record<string, string> = { baja: 'Baja', media: 'Media', alta: 'Alta' };
    const dbValues = priorities.map(p => PRIORITY_DB[p.toLowerCase()] ?? p);
    q = q.in("priority", dbValues);
  }

  // status (usa valores tal como vienen del UI)
  const statuses = Array.isArray(values.status)
    ? (values.status as (string | number)[]).map(String)
    : [];
  if (statuses.length) {
    q = q.in("status", statuses);
  }

  const { data, error, count } = await q
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("❌ getTicketsByFiltersPaginated error:", error.message);
    return { data: [], count: 0 };
  }
  return { data: (data ?? []) as Ticket[], count: count ?? 0 };
}

// 👇 NUEVO: filtra para el Kanban (sin forzar is_accepted = false)
export async function getTicketsByKanbanFiltersPaginated<TKeys extends string>(
  values: FilterState<TKeys>,
  page: number,
  pageSize: number
): Promise<{ data: Ticket[]; count: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("tickets")
    .select("*", { count: "exact" })
    .eq("is_accepted", true);        // 👈 SIEMPRE aceptados en Kanban/Lista

  // q (título, solicitante, id numérico)
  const termRaw = (values as Record<string, unknown>)["q"];
  const term = typeof termRaw === "string" ? termRaw.trim() : "";
  if (term.length >= 2) {
    const ors = [`title.ilike.%${term}%`, `requester.ilike.%${term}%`];
    const n = Number(term);
    if (!Number.isNaN(n)) ors.push(`id.eq.${n}`);
    q = q.or(ors.join(","));
  }

  // location
  const locationRaw = (values as Record<string, unknown>)["location"];
  const location = typeof locationRaw === "string" ? locationRaw : undefined;
  if (location) q = q.eq("location", location);

  // assignee_id (si aplica)
  const assigneeIdRaw = (values as Record<string, unknown>)["assignee_id"];
  if (assigneeIdRaw !== undefined && assigneeIdRaw !== null && assigneeIdRaw !== "") {
    q = q.eq("assignee_id", Number(assigneeIdRaw));
  }

  // created_at (rango)
  const createdRaw = (values as Record<string, unknown>)["created_at"];
  if (createdRaw && typeof createdRaw === "object") {
    const { from: dFrom, to: dTo } = createdRaw as { from?: string; to?: string };
    if (dFrom) q = q.gte("created_at", `${dFrom} 00:00:00`);
    if (dTo)   q = q.lte("created_at", `${dTo} 23:59:59`);
  }

  // has_image
  if ((values as Record<string, unknown>)["has_image"] === true) {
    q = q.neq("image", "");
  }

  // priority
  const prw = (values as Record<string, unknown>)["priority"];
  const priorities = Array.isArray(prw) ? prw.map(String) : [];
  if (priorities.length) q = q.in("priority", priorities);

  // status
  const stw = (values as Record<string, unknown>)["status"];
  const statuses = Array.isArray(stw) ? stw.map(String) : [];
  if (statuses.length) q = q.in("status", statuses);

  const { data, error, count } = await q
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("❌ getTicketsByKanbanFiltersPaginated error:", error.message);
    return { data: [], count: 0 };
  }
  return { data: (data ?? []) as Ticket[], count: count ?? 0 };
}


