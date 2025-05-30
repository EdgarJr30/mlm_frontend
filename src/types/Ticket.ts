
export interface Ticket {
  id: number; // o string si prefieres
  title: string;
  description: string;
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
  responsible?: string;
  image?: string; // base64
}
