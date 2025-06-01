import { useState, useEffect } from "react";
import Modal from "./Modal";
import EditTicketModal from "./EditTicketModal";
import { getTicketsFromStorage, saveTicketsToStorage } from "../utils/localStorageTickets";
import type { Ticket } from "../types/Ticket";

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

// const STATUS_ICONS: Record<Ticket["status"], string> = {
//     "Pendiente": "🔴",
//     "En Ejecución": "🟡",
//     "Finalizadas": "🟢",
// };

const PRIORITY_ICONS: Record<string, string> = {
  baja: "🔻",
  media: "🔸",
  alta: "🔺",
};

export default function KanbanBoard() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        setTickets(getTicketsFromStorage());
    }, []);

    const handleSave = (editedTicket: Ticket) => {
        const newTickets = getTicketsFromStorage().map((t: Ticket) =>
            t.id === editedTicket.id ? editedTicket : t
        );
        saveTicketsToStorage(newTickets);
        setTickets(newTickets);
    };

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
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                        {/* <span className="mr-2 text-xl">{STATUS_ICONS[status]}</span> */}
                        <span className={`px-2 py-1 rounded text-sm font-medium ${STATUS_STYLES[status]}`}>{status}</span>
                        {/* {status} */}
                    </h3>
                    <div className="flex flex-col gap-3 overflow-y-auto">
                        {tickets.filter((t) => t.status === status).map((ticket) => (
                            <div
                                key={ticket.id}
                                className="bg-blue-50 border border-blue-200 rounded p-3 cursor-pointer hover:bg-blue-100 transition"
                                onClick={() => openModal(ticket)}
                            >
                                {/* Mostramos la imagen si existe */}
                                {ticket.image && (
                                    <img
                                        src={ticket.image}
                                        alt="Adjunto"
                                        className="w-full h-20 object-contain rounded mb-2"
                                        style={{ background: "#f1f5f9" }}
                                    />
                                )}
                                <div className="font-medium">{ticket.title}</div>
                                {ticket.isUrgent && (
                                    <div className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded mb-1">
                                        🚨 Urgente
                                    </div>
                                )}
                                <div className="text-xs text-gray-600">
                                    Fecha Incidente: {ticket.incidentDate || "No especificada"}
                                </div>
                                <strong>Prioridad:</strong> {PRIORITY_ICONS[ticket.priority]} {ticket.priority}
                                <div className="text-xs text-gray-600">Prioridad: {ticket.priority}</div>
                                <div className="text-xs text-gray-600">Solicitante: {ticket.requester}</div>
                                <div className="text-xs text-gray-600">Ubicación: {ticket.location}</div>
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
