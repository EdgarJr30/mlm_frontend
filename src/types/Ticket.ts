
export interface Ticket {
  id: string;
  title: string;
  description: string;
  isUrgent: boolean;
  priority: "baja" | "media" | "alta";
  status:
    | "Pendiente"
    | "En Ejecución"
    | "Finalizadas";
  requester: string;
  location: string;
  responsible?: string;
  incidentDate: string;
  deadlineDate?: string; // ISO date string
  image?: string; // base64
  email?: string;
  phone?: string;
  createdAt: string; // ISO date string
  details?: string; // additional details
}
