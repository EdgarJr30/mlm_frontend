import React, { useState, useRef, useEffect } from "react";
import EditTicketModal from "../ticket/EditTicketModal";
import { updateTicket } from "../../services/ticketService";
import type { Ticket } from "../../types/Ticket";
import KanbanColumn from "./KanbanColumn";
import Modal from "../Modal";
// import { formatDateInTimezone } from "../../utils/formatDate";

const STATUSES: Ticket["status"][] = [
    "Pendiente",
    "En Ejecución",
    "Finalizadas",
];

export default function KanbanBoard() {
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [reloadKey] = useState<number>(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [showFullImage, setShowFullImage] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdatedTicket, setLastUpdatedTicket] = useState<Ticket | null>(null);


    // Contador de columnas cargadas (para controlar cuando quitar el loading)
    const loadedColumns = useRef(0);

    const openModal = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setModalOpen(true);
    };

    const closeModal = () => {
        setSelectedTicket(null);
        setModalOpen(false);
    };

    const handleSave = async (updatedTicket: Ticket) => {
        try {
            await updateTicket(updatedTicket.id, updatedTicket);
            setLastUpdatedTicket(updatedTicket);
            console.log("✅ Ticket actualizado");

            // Opcional: mostrar alerta de éxito
            // await showSuccessAlert("Actualizado", `Ticket #${updatedTicket.id} guardado correctamente.`);

            setModalOpen(false);
            setSelectedTicket(null);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("❌ Error al actualizar el ticket:", error.message);
            } else {
                console.error("❌ Error desconocido:", error);
            }
            alert("No se pudo actualizar el ticket. Intenta de nuevo.");
        }
    };

    const getPriorityStyles = (priority: Ticket["priority"]) => {
        const styles: Record<Ticket["priority"], string> = {
            baja: "bg-green-100 text-green-800 border-green-200",
            media: "bg-yellow-100 text-yellow-800 border-yellow-200",
            alta: "bg-orange-100 text-orange-800 border-orange-200",
        };
        return styles[priority] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getStatusStyles = (status: Ticket["status"]) => {
        const styles: Record<Ticket["status"], string> = {
            "Pendiente": "bg-yellow-100 text-gray-800 border-gray-200",
            "En Ejecución": "bg-blue-100 text-blue-800 border-blue-200",
            "Finalizadas": "bg-green-100 text-green-800 border-green-200",
        };
        return styles[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const capitalize = (word?: string) =>
        typeof word === "string" ? word.charAt(0).toUpperCase() + word.slice(1) : "";

    // Callback que le pasamos a cada columna, la columna lo llama cuando termina su primer carga
    const handleColumnLoaded = () => {
        loadedColumns.current += 1;
        if (loadedColumns.current >= STATUSES.length) {
            setIsLoading(false);
        }
    };

    // Si recargas las columnas, resetea el loading
    React.useEffect(() => {
        setIsLoading(true);
        loadedColumns.current = 0;
    }, [reloadKey]);

    useEffect(() => {
        if (lastUpdatedTicket) {
            const timeout = setTimeout(() => setLastUpdatedTicket(null), 1000);
            return () => clearTimeout(timeout);
        }
    }, [lastUpdatedTicket]);

    return (
        <div className="flex gap-6 h-full w-full p-4 overflow-x-auto">
            {STATUSES.map((status) => (
                <KanbanColumn
                    key={status}
                    status={status}
                    onOpenModal={openModal}
                    getPriorityStyles={getPriorityStyles}
                    getStatusStyles={getStatusStyles}
                    capitalize={capitalize}
                    isLoading={isLoading}
                    onFirstLoad={handleColumnLoaded}
                    reloadSignal={reloadKey}
                    lastUpdatedTicket={lastUpdatedTicket}
                />
            ))}

            <Modal isOpen={modalOpen} onClose={closeModal} isLocked={showFullImage}>
                {selectedTicket && (
                    <EditTicketModal
                        isOpen={modalOpen}
                        onClose={closeModal}
                        ticket={selectedTicket}
                        onSave={handleSave}
                        showFullImage={showFullImage}
                        setShowFullImage={setShowFullImage}
                    />
                )}
            </Modal>
        </div>
    );
}
