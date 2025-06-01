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

// const PRIORITY_ICONS: Record<string, string> = {
//     baja: "🔻",
//     media: "🔸",
//     alta: "🔺",
// };

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

    function getPriorityStyles(priority: "baja" | "media" | "alta" | "urgente") {
        const styles: Record<"baja" | "media" | "alta" | "urgente", string> = {
            baja: "bg-green-100 text-green-800 border-green-200",
            media: "bg-yellow-100 text-yellow-800 border-yellow-200",
            alta: "bg-orange-100 text-orange-800 border-orange-200",
            urgente: "bg-red-100 text-red-800 border-red-200",
        };
        return styles[priority] || "bg-gray-100 text-gray-800 border-gray-200";
    }

    function getStatusStyles(status: Ticket["status"]) {
        const styles: Record<Ticket["status"], string> = {
            "Pendiente": "bg-gray-100 text-gray-800 border-gray-200",
            "En Ejecución": "bg-blue-100 text-blue-800 border-blue-200",
            "Finalizadas": "bg-green-100 text-green-800 border-green-200",
        };
        return styles[status] || "bg-gray-100 text-gray-800 border-gray-200";
    }

    function capitalize(word?: string) {
        return typeof word === "string" ? word.charAt(0).toUpperCase() + word.slice(1) : "";
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-full w-full p-4 overflow-x-hidden">
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
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[80vh]">
                        {tickets.filter((t) => t.status === status).map((ticket) => {
                            return (
                                <div
                                    key={ticket.id}
                                    onClick={() => openModal(ticket)}
                                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                                >
                                    {ticket.image && (
                                        <img
                                            src={ticket.image}
                                            alt="Adjunto"
                                            className="w-full h-24 object-contain rounded mb-3 bg-slate-100"
                                        />
                                    )}
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="font-semibold text-sm text-gray-900">{ticket.title}</h4>
                                        <button
                                            type="button"
                                            className="text-gray-900 hover:text-gray-600"
                                            title="Ver más detalles"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.01M12 12h.01M18 12h.01" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{ticket.description || "Sin descripción"}</p>

                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        {ticket.isUrgent && (
                                            <span className="flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Urgente
                                            </span>
                                        )}
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getPriorityStyles(ticket.priority)}`}>
                                            {capitalize(ticket.priority)}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getStatusStyles(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>

                                    <div className="text-xs text-gray-500 space-y-1">
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A3 3 0 008 19h8a3 3 0 002.879-1.196M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Solicitante: {ticket.requester}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 9h10m-11 5h12a2 2 0 002-2v-5H3v5a2 2 0 002 2z" />
                                            </svg>
                                            Fecha: {ticket.incidentDate || "No especificada"}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <strong className="text-xs">ID:</strong> {ticket.id}
                                        </div>
                                    </div>

                                    {ticket.responsible && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-6 w-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-semibold text-gray-700">
                                                {ticket.responsible
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </div>
                                            <span className="text-xs text-gray-600">{ticket.responsible}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

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
