import { supabase } from "../lib/supabaseClient";
import type { Ticket } from "../types/Ticket";

const PAGE_SIZE = 20;

export async function createTicket(ticket: Omit<Ticket, "id" | "status">) {
  const { data, error } = await supabase.from("tickets").insert([
    {
      ...ticket,
      status: "Pendiente",
    }
  ])
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

export async function getTicketsByStatusPaginated(status: string, page: number, pageSize: number, location?: string) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("tickets")
    .select("*")
    .eq("status", status)
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

// export async function getTotalTicketsCount() {
//   const { count, error } = await supabase
//     .from('tickets')
//     .select('id', { count: 'exact', head: true });

//   if (error) {
//     console.error("Error al contar tickets:", error.message);
//     return 0;
//   }
//   console.log(`Total de tickets: ${count}`);
//   return count || 0;
// }

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
