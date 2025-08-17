import { supabase } from "../lib/supabaseClient";
import type {
  ReportFilters,
  CountByStatusDTO,
  CountByFieldDTO,
  TicketStatus,
} from "../types/Report";

const STATUS_ORDER: TicketStatus[] = ["Pendiente", "En Ejecución", "Finalizadas"];

// Solo las columnas que necesitamos para los reportes
type TicketLite = {
  status: string | null;
  is_accepted: boolean | null;
  location: string | null;
  assignee: string | null;
  requester: string | null;
  created_at: string | null; // ISO
};

function buildBaseSelect(columns: string) {
  // forzamos select de is_accepted para filtrar siempre en servidor
  const cols = `is_accepted, ${columns}`;
  return supabase.from("tickets").select(cols);
}

function applyFilters(query: ReturnType<typeof buildBaseSelect>, filters?: ReportFilters) {
  let q = query.eq("is_accepted", true); // SIEMPRE aceptados

  if (filters?.location) q = q.eq("location", filters.location);
  if (filters?.assignee) q = q.eq("assignee", filters.assignee);
  if (filters?.requester) q = q.eq("requester", filters.requester);
  if (filters?.status) q = q.eq("status", filters.status);

  if (filters?.from) q = q.gte("created_at", filters.from);
  if (filters?.to) q = q.lte("created_at", filters.to);

  return q;
}

/**
 * Cuenta tickets por STATUS (Pendiente / En Ejecución / Finalizadas)
 * Nota: hacemos el agrupado en cliente para evitar .group()
 */
export async function getCountByStatus(filters?: ReportFilters): Promise<CountByStatusDTO[]> {
  const q = applyFilters(buildBaseSelect("status, created_at"), filters);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as TicketLite[];

  // Inicializamos el contador con 0 para cada status esperado
  const counts = new Map<TicketStatus, number>(
    STATUS_ORDER.map((s) => [s, 0]),
  );

  for (const r of rows) {
    const s = (r.status ?? "") as string;
    // Normalizamos posibles variantes
    const normalized =
      s === "Pendiente" || s === "En Ejecución" || s === "Finalizadas" ? (s as TicketStatus) : null;

    if (normalized) counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  // Devolvemos orden fijo
  return STATUS_ORDER.map((s) => ({
    status: s,
    count: counts.get(s) ?? 0,
  }));
}

/**
 * Cuenta tickets agrupando por location | assignee | requester.
 * Podemos además filtrar por status y fechas.
 */
export async function getCountByField(
  field: "location" | "assignee" | "requester",
  filters?: ReportFilters,
): Promise<CountByFieldDTO[]> {
  const q = applyFilters(buildBaseSelect(`${field}, created_at`), filters);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Pick<TicketLite, typeof field>[];

  // Agrupamos en cliente
  const counter = new Map<string, number>();
  for (const r of rows) {
    const key = (r[field] ?? "(Sin valor)") as string;
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }

  const result: CountByFieldDTO[] = Array.from(counter.entries()).map(([key, count]) => ({
    key,
    count,
  }));

  // Orden: mayor a menor
  result.sort((a, b) => b.count - a.count);
  return result;
}

/** Helpers para Chart.js */

export function toBarChartFromStatus(dto: CountByStatusDTO[], datasetLabel = "Tickets aceptados") {
  return {
    labels: dto.map((d) => d.status),
    datasets: [
      {
        label: datasetLabel,
        data: dto.map((d) => d.count),
        backgroundColor: ["#6366f1", "#f59e0b", "#10b981"],
        borderColor: ["#6366f1", "#f59e0b", "#10b981"],
        borderWidth: 1,
      },
    ],
  };
}

export function toBarChartFromField(dto: CountByFieldDTO[], datasetLabel = "Tickets aceptados") {
  return {
    labels: dto.map((d) => d.key),
    datasets: [
      {
        label: datasetLabel,
        data: dto.map((d) => d.count),
        backgroundColor: "#6366f1",
        borderColor: "#6366f1",
        borderWidth: 1,
      },
    ],
  };
}