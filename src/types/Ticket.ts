
export interface Ticket {
  id: string;
  title: string;
  description: string;
  isUrgent: boolean;
  priority: "baja" | "media" | "alta";
  status:
    | "Pendiente"
    | "En Revisión"
    | "Asignado"
    | "En Proceso"
    | "En Espera"
    | "Completado"
    | "Cerrado";
  requester: string;
  location: string;
  responsible?: string;
  incidentDate: string;
  image?: string; // base64
}
