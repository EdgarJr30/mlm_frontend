import { useState, useEffect } from "react";
import Modal from "./Modal";
import EditTicketModal from "./EditTicketModal";
import { getTicketsFromStorage, saveTicketsToStorage } from "../utils/localStorageTickets";
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

export default function KanbanBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Lee SIEMPRE desde localStorage al montar
  useEffect(() => {
    setTickets(getTicketsFromStorage());
  }, []);

  // Cuando edites, guarda y recarga desde storage
  const handleSave = (editedTicket: Ticket) => {
    const newTickets = getTicketsFromStorage().map((t: Ticket) =>
      t.id === editedTicket.id ? editedTicket : t
    );
    saveTicketsToStorage(newTickets);
    setTickets(newTickets);
  };

  // Recargar al cerrar el modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedTicket(null);
    setTickets(getTicketsFromStorage());
  };

  const openModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };

  return (
    <div className="flex gap-4 h-full min-h-[500px]">
      {STATUSES.map((status) => (
        <div
          key={status}
          className="bg-white rounded-lg shadow-lg p-4 w-80 min-w-[20rem] flex flex-col h-full"
        >
          <h3 className="font-semibold text-lg mb-4">{status}</h3>
          <div className="flex flex-col gap-3 overflow-y-auto">
            {tickets.filter((t) => t.status === status).map((ticket) => (
              <div
                key={ticket.id}
                className="bg-blue-50 border border-blue-200 rounded p-3 cursor-pointer hover:bg-blue-100 transition"
                onClick={() => openModal(ticket)}
              >
                <div className="font-medium">{ticket.title}</div>
                <div className="text-xs text-gray-600">Prioridad: {ticket.priority}</div>
                <div className="text-xs text-gray-600">Solicitante: {ticket.requester}</div>
                <div className="text-xs text-gray-600">
                  Responsable: {ticket.responsible || "Sin asignar"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Modal isOpen={modalOpen} onClose={closeModal}>
        {selectedTicket && (
          <EditTicketModal
            isOpen={modalOpen}
            onClose={closeModal}
            ticket={selectedTicket}
            onSave={handleSave}
          />
        )}
      </Modal>
    </div>
  );
}
