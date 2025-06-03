import React, { useState, useEffect } from "react";
import type { Ticket } from "../types/Ticket";
import { LOCATIONS } from "../components/constants/locations";
import { formatDate } from "../utils/formatDate";


const STATUSES: Ticket["status"][] = [
  "Pendiente",
  "En Ejecución",
  "Finalizadas",
];

const STATUS_STYLES: Record<Ticket["status"], string> = {
  "Pendiente": "bg-yellow-100 text-yellow-800",
  "En Ejecución": "bg-blue-100 text-blue-800",
  "Finalizadas": "bg-green-100 text-green-800",
};

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
  showFullImage: boolean;
  setShowFullImage: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EditTicketModal({
  onClose,
  ticket,
  onSave,
  showFullImage,
  setShowFullImage,
}: EditTicketModalProps) {
  const [edited, setEdited] = useState<Ticket>(ticket);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowFullImage(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setShowFullImage]);

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
    <form onSubmit={handleSave} className="space-y-6">
      {/* {ticket.image && (
        <>
          <img
            src={ticket.image}
            alt="Adjunto"
            className="w-full h-36 object-contain rounded mb-6 cursor-pointer"
            style={{ background: "#f1f5f9" }}
            onClick={() => setShowFullImage(true)}
          />

          {showFullImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10"
              onClick={() => setShowFullImage(false)} // Cierra al hacer clic afuera
            >
              <div
                className="relative"
                onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
              >
                <button
                  onClick={() => setShowFullImage(false)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-gray-800 shadow-lg flex items-center justify-center transition-all duration-200 hover:bg-white hover:text-red-500 cursor-pointer"
                  aria-label="Cerrar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <img
                  src={ticket.image}
                  alt="Vista ampliada"
                  className="max-w-full max-h-[80vh] rounded shadow-lg"
                />
              </div>
            </div>
          )}
        </>
      )} */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: ID, Título, Descripción */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium">ID</label>
            <input
              name="id"
              value={edited.id}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Fecha del Incidente</label>
            <input
              type="date"
              name="incidentDate"
              value={formatDate(edited.incidentDate)}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Título</label>
            <input
              name="title"
              value={edited.title}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Descripción</label>
            <textarea
              name="description"
              value={edited.description}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

        </div>

        {/* Columna 2: Solicitante, Email, Tel */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium">Solicitante</label>
            <input
              name="requester"
              value={edited.requester || ""}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              name="email"
              value={edited.email || ""}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Tel</label>
            <input
              name="telephone"
              value={edited.phone || ""}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Ubicación</label>
            <select
              name="location"
              value={edited.location || ""}
              disabled
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            >
              <option value="" disabled>Selecciona una ubicación</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Columna 3: Responsable, Prioridad, Estatus */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium">Responsable</label>
            <select
              name="responsible"
              value={edited.responsible || ""}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded cursor-pointer"
            >
              {RESPONSABLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Prioridad</label>
            <select
              name="priority"
              value={edited.priority}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded cursor-pointer"
            >
              <option value="baja">🔻 Baja</option>
              <option value="media">🔸 Media</option>
              <option value="alta">🔺 Alta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Estatus</label>
            <select
              name="status"
              value={edited.status}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded cursor-pointer"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          {ticket.image && (
            <>
              <img
                src={ticket.image}
                alt="Adjunto"
                className="w-full h-36 object-contain rounded cursor-pointer border bg-gray-100"
                onClick={() => setShowFullImage(true)}
              />

              {showFullImage && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10"
                  onClick={() => setShowFullImage(false)} // Cierra al hacer clic afuera
                >
                  <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
                  >
                    <button
                      onClick={() => setShowFullImage(false)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-gray-800 shadow-lg flex items-center justify-center transition-all duration-200 hover:bg-white hover:text-red-500 cursor-pointer"
                      aria-label="Cerrar"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <img
                      src={ticket.image}
                      alt="Vista ampliada"
                      className="max-w-full max-h-[80vh] rounded shadow-lg"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-6 flex-wrap">
            {/* <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Estado</label>
              <span className={`px-2 py-1 text-xs rounded font-semibold ${STATUS_STYLES[edited.status]}`}>
                {edited.status}
              </span>
            </div> */}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isUrgent"
                checked={edited.isUrgent || false}
                onChange={handleChange}
                className="h-4 w-4 text-red-600 border-gray-300 rounded cursor-pointer"
              />
              <label className="text-sm font-medium text-red-700">🚨 Urgente</label>
            </div>
          </div>
        </div>

        {/* Columna 4: Fecha del incidente, ubicación, imagen, urgencia y estado */}
        {/* <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">

            {ticket.image && (
              <>
                <img
                  src={ticket.image}
                  alt="Adjunto"
                  className="w-full h-36 object-contain rounded cursor-pointer border bg-gray-100"
                  onClick={() => setShowFullImage(true)}
                />

                {showFullImage && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10"
                    onClick={() => setShowFullImage(false)} // Cierra al hacer clic afuera
                  >
                    <div
                      className="relative"
                      onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
                    >
                      <button
                        onClick={() => setShowFullImage(false)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-gray-800 shadow-lg flex items-center justify-center transition-all duration-200 hover:bg-white hover:text-red-500 cursor-pointer"
                        aria-label="Cerrar"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <img
                        src={ticket.image}
                        alt="Vista ampliada"
                        className="max-w-full max-h-[80vh] rounded shadow-lg"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Estado</label>
                <span className={`px-2 py-1 text-xs rounded font-semibold ${STATUS_STYLES[edited.status]}`}>
                  {edited.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isUrgent"
                  checked={edited.isUrgent || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-red-600 border-gray-300 rounded cursor-pointer"
                />
                <label className="text-sm font-medium text-red-700">🚨 Urgente</label>
              </div>
            </div>
          </div>
        </div> */}
      </div>


      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
        >
          Guardar Cambios
        </button>
      </div>
    </form>

  );
}
