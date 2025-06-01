import React, { useState, useEffect } from "react";
import type { Ticket } from "../types/Ticket";

const STATUSES: Ticket["status"][] = [
  "Pendiente",
  "En Revisión",
  "Asignado",
  "En Proceso",
  "En Espera",
  "Completado",
  "Cerrado",
];

// Mock responsables (luego lo sacas de la BD)
const RESPONSABLES = [
  "Sin asignar",
  "Juan Mantenimiento",
  "Pedro Electricista",
  "María Técnica",
];

interface EditTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onSave: (ticket: Ticket) => void;
}

export default function EditTicketModal({
  onClose,
  ticket,
  onSave,
}: EditTicketModalProps) {
  const [edited, setEdited] = useState<Ticket>(ticket);

  useEffect(() => {
    setEdited(ticket);
  }, [ticket]);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, type, value } = e.target;
    let newValue: string | boolean = value;
    if (type === "checkbox") {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setEdited({ ...edited, [name]: newValue });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(edited);
    onClose();
  };

  if (!ticket) return null;

  return (
    <form onSubmit={handleSave}>
      {ticket.image && (
        <img
          src={ticket.image}
          alt="Adjunto"
          className="w-full h-36 object-contain rounded mb-4"
          style={{ background: "#f1f5f9" }}
        />
      )}
      <div className="mb-4">
        <label className="block text-sm font-medium">Título</label>
        <input
          name="title"
          value={edited.title}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Descripción</label>
        <textarea
          name="description"
          value={edited.description}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded"
          required
        />
      </div>
      {/* Fecha del Incidente */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Fecha del Incidente</label>
        <input
          type="date"
          name="incidentDate"
          value={edited.incidentDate}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded"
          required
        />
      </div>
      {/* Urgente */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          name="isUrgent"
          checked={edited.isUrgent || false}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label className="text-sm font-medium">Urgente</label>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Prioridad</label>
        <select
          name="priority"
          value={edited.priority}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded"
        >
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Estatus</label>
        <select
          name="status"
          value={edited.status}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      {/* Solicitante */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Solicitante</label>
        <input
          name="requester"
          value={edited.requester || ""}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded"
          required
        />
      </div>
      {/* Ubicación */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Ubicación</label>
        <select
          name="location"
          value={edited.location || ""}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded"
          required
        >
          <option value="">Seleccione una ubicación</option>
          <option value="Operadora de Servicios Alimenticios">Operadora de Servicios Alimenticios</option>
          <option value="Adrian Tropical 27">Adrian Tropical 27</option>
          <option value="Adrian Tropical Malecón">Adrian Tropical Malecón</option>
          <option value="Adrian Tropical Lincoln">Adrian Tropical Lincoln</option>
          <option value="Adrian Tropical San Vicente">Adrian Tropical San Vicente</option>
          <option value="Atracciones el Lago">Atracciones el Lago</option>
          <option value="M7">M7</option>
          <option value="E. Arturo Trading">E. Arturo Trading</option>
          <option value="Edificio Comunitario">Edificio Comunitario</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Responsable</label>
        <select
          name="responsible"
          value={edited.responsible || ""}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded"
        >
          {RESPONSABLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
}
