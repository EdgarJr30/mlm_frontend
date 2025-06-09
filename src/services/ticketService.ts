import { supabase } from "../lib/supabaseClient";
import type { Ticket } from "../types/Ticket";

export async function createTicket(ticket: Omit<Ticket, "id" | "status">) {
  const { data, error } = await supabase.from("tickets").insert([
    {
      ...ticket,
      status: "Pendiente",
    }
  ]);

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

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
