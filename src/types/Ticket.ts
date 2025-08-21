export interface Ticket {
  id: string;
  title: string;
  description: string;
  is_accepted: boolean;
  is_urgent: boolean;
  priority: "baja" | "media" | "alta";
  status:
    | "Pendiente"
    | "En Ejecución"
    | "Finalizadas";
  requester: string;
  location: string;
  assignee?: string;
  assignee_id?: number;
  incident_date: string;
  deadline_date?: string; // ISO date string
  image?: string; // base64
  email?: string;
  phone?: string;
  created_at: string; // ISO date string
  comments?: string;
}

export const Locations = [
  "Operadora de Servicios Alimenticios",
  "Adrian Tropical 27",
  "Adrian Tropical Malecón",
  "Adrian Tropical Lincoln",
  "Adrian Tropical San Vicente",
  "Atracciones el Lago",
  "M7",
  "E. Arturo Trading",
  "Edificio Comunitario",
];