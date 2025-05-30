import React, { useState } from "react";

// Ciclo de vida del ticket
const STATUSES = [
  "Pendiente",
  "En Revisión",
  "Asignado",
  "En Proceso",
  "En Espera",
  "Completado",
  "Cerrado",
];

const mockTickets = [
  {
    id: 1,
    title: "Reparar aire acondicionado",
    status: "Pendiente",
    priority: "alta",
    requester: "Juan Pérez",
  },
  {
    id: 2,
    title: "Cambio de bombillo",
    status: "En Proceso",
    priority: "media",
    requester: "María López",
  },
];

export default function KanbanBoard() {
  const [tickets, setTickets] = useState(mockTickets);

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-8">Tablero Kanban - Mantenimiento</h2>
      <div className="flex gap-4 overflow-x-auto">
        {STATUSES.map((status) => (
          <div key={status} className="bg-white rounded-lg shadow-lg p-4 w-80 min-w-[20rem]">
            <h3 className="font-semibold text-lg mb-4">{status}</h3>
            <div className="space-y-3">
              {tickets.filter((t) => t.status === status).map((ticket) => (
                <div key={ticket.id} className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="font-medium">{ticket.title}</div>
                  <div className="text-xs text-gray-600">Prioridad: {ticket.priority}</div>
                  <div className="text-xs text-gray-600">Solicitante: {ticket.requester}</div>
                  {/* Aquí agregar botones para cambiar de estado, asignar, etc. */}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
