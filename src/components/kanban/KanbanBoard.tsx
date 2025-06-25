import React, { useState, useRef, useEffect } from "react";
import { getFilteredTickets } from "../../services/ticketService";
import EditTicketModal from "../ticket/EditTicketModal";
import { updateTicket } from "../../services/ticketService";
import type { Ticket } from "../../types/Ticket";
import KanbanColumn from "./KanbanColumn";
import Modal from "../Modal";
import { showToastSuccess, showToastError } from "../../notifications/toast";

const STATUSES: Ticket["status"][] = [
    "Pendiente",
    "En Ejecución",
    "Finalizadas",
];

interface Props {
    searchTerm: string;
    selectedLocation: string;
}

export default function KanbanBoard({ searchTerm, selectedLocation }: Props) {
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [reloadKey, setReloadKey] = useState<number>(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [showFullImage, setShowFullImage] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdatedTicket, setLastUpdatedTicket] = useState<Ticket | null>(null);
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);

    const isSearching = searchTerm.length >= 2;

    // Contador de columnas cargadas (para controlar cuando quitar el loading)
    const loadedColumns = useRef(0);

    const isFiltering = searchTerm.length >= 2 || selectedLocation.length > 0;

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
            showToastSuccess("Ticket actualizado correctamente.")
            setModalOpen(false);
            setSelectedTicket(null);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("❌ Error al actualizar el ticket:", error.message);
            } else {
                console.error("❌ Error desconocido:", error);
            }
            showToastError("No se pudo actualizar el ticket. Intenta de nuevo.");
            console.error("No se pudo actualizar el ticket. Intenta de nuevo.");
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

    // Solo buscar cuando searchTerm está activo (>= 2 caracteres)
    useEffect(() => {
        if (isFiltering) {
            // Si hay un término de búsqueda o una ubicación, hacemos la búsqueda
            console.log("🟢 Ejecutando búsqueda desde KanbanBoard:", searchTerm);
            setIsLoading(true);
            getFilteredTickets(searchTerm, selectedLocation, true)
                .then(results => {
                    setFilteredTickets(results);
                    setIsLoading(false);
                });
        }
    }, [isFiltering, searchTerm, selectedLocation]);

    // Si el término de búsqueda es menor a 2 caracteres o no hay ubicación, reseteamos el estado
    useEffect(() => {
        if (!isFiltering) {
            console.log("🔴 Reseteando búsqueda en KanbanBoard");
            setFilteredTickets([]);
            setIsLoading(true);
            setReloadKey(prev => prev + 1);
        }
    }, [isFiltering, searchTerm, selectedLocation]);

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
        <div className="flex gap-6 h-full w-full overflow-x-auto">
            {STATUSES.map((status) => (
                <KanbanColumn
                    key={status}
                    status={status}
                    isSearching={isSearching}
                    isFiltering={isFiltering}
                    tickets={isFiltering ? filteredTickets.filter(t => t.status === status) : undefined}
                    onOpenModal={openModal}
                    getPriorityStyles={getPriorityStyles}
                    getStatusStyles={getStatusStyles}
                    capitalize={capitalize}
                    isLoading={isLoading}
                    onFirstLoad={handleColumnLoaded}
                    reloadSignal={reloadKey}
                    lastUpdatedTicket={lastUpdatedTicket}
                    selectedLocation={selectedLocation}
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
