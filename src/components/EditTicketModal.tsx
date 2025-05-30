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
    setEdited({ ...edited, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(edited);
    onClose();
  };

  if (!ticket) return null;

  return (
    <form onSubmit={handleSave}>
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
