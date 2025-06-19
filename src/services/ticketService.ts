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

export async function updateTicket(id: string, updatedData: Partial<Ticket>) {
  const { error } = await supabase
    .from("tickets")
    .update(updatedData)
    .eq("id", id);

  if (error) {
    throw new Error(`Error al actualizar el ticket: ${error.message}`);
  }
}


export async function getTicketsByStatusPaginated(status: string, page: number, pageSize: number) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("status", status)
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    console.error(`❌ Error al cargar tickets con estado "${status}":`, error.message);
    return [];
  }

  console.log(`📥 Estado "${status}" - Página ${page + 1} - Se cargaron ${data.length} tickets:`);
  console.table(data);
  return data;
}

export async function getFilteredTickets(term: string): Promise<Ticket[]> {
  const query = supabase
    .from("tickets")
    .select("*")
    .order("id", { ascending: false });

  if (term.length >= 2) {
    const filters = [
      // `id.ilike.%${term}%`,
      `title.ilike.%${term}%`,
      `requester.ilike.%${term}%`,
    ];

    if (!isNaN(Number(term))) {
      filters.push(`id.eq.${term}`);
    }

    query.or(filters.join(","));
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Error buscando tickets:", error.message);
    return [];
  }

  return data as Ticket[];
}


