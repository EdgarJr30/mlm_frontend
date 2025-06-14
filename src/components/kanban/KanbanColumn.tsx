import { useEffect, useRef, useState, useCallback } from "react";
import { getTicketsByStatusPaginated } from "../../services/ticketService";
import type { Ticket } from "../../types/Ticket";
import { formatDateInTimezone } from "../../utils/formatDate";

interface Props {
    status: Ticket["status"];
    onOpenModal: (ticket: Ticket) => void;
    getPriorityStyles: (priority: Ticket["priority"]) => string;
    getStatusStyles: (status: Ticket["status"]) => string;
    capitalize: (word?: string) => string;
    onFirstLoad: () => void;
    isLoading: boolean;
    pageSize?: number;
    reloadSignal: number;
}

export default function KanbanColumn({
    status,
    onOpenModal,
    getPriorityStyles,
    getStatusStyles,
    capitalize,
    onFirstLoad,
    // isLoading,
    pageSize = 20,
    reloadSignal,

}: Props) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [page, setPage] = useState(0);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    // const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [firstLoaded, setFirstLoaded] = useState(false);

    const columnRef = useRef<HTMLDivElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    // Cuando termina de cargar los tickets por primera vez, notificamos al board
    useEffect(() => {
        if (!firstLoaded) {
            setFirstLoaded(true);
            onFirstLoad();
        }
    }, [tickets.length]);

    // Skeleton loader
    const skeletonTickets = Array.from({ length: 5 });

    const loadMoreTickets = useCallback(
        async (force = false) => {
            // Si es la carga inicial, usa isInitialLoading; si no, usa isPaginating
            if ((isInitialLoading || isPaginating) && !force) return;
            if (!hasMore) return;

            if (force) {
                setIsInitialLoading(true);
            } else {
                setIsPaginating(true);
            }

            const currentPage = force ? 0 : page;
            const newTickets = await getTicketsByStatusPaginated(status, currentPage, pageSize);

            setTickets((prev) => {
                const merged = force ? [...newTickets] : [...prev, ...newTickets];
                const unique = Array.from(new Map(merged.map((t) => [t.id, t])).values());
                return unique;
            });

            if (newTickets.length < pageSize) {
                setHasMore(false);
            }

            setPage((prev) => (force ? 1 : prev + 1));
            if (force) {
                setIsInitialLoading(false);
            } else {
                setIsPaginating(false);
            }
        },
        [isInitialLoading, isPaginating, hasMore, status, page, pageSize]
    );

    useEffect(() => {
        setTickets([]);
        setPage(0);
        setHasMore(true);
        setFirstLoaded(false);
        setIsInitialLoading(true);
        loadMoreTickets(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadSignal]);

    useEffect(() => {
        loadMoreTickets();
    }, []);

    useEffect(() => {
        if (!sentinelRef.current || !columnRef.current || !hasMore) return;

        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                console.log(`👁️ Observando sentinel "${status}": isIntersecting = ${entry.isIntersecting}`);
                if (entry.isIntersecting && hasMore) {
                    loadMoreTickets();
                }
            },
            {
                root: columnRef.current,
                threshold: 0.1,
            }
        );

        observer.current.observe(sentinelRef.current);

        return () => observer.current?.disconnect();
    }, [tickets.length, hasMore]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 w-[300px] sm:w-[350px] md:w-[400px] xl:w-[420px] min-w-[300px] flex-shrink-0 flex flex-col">
            {/* //TODO: Ver con cual de los dos estilos queda mejor */}
            {/* <div className="bg-white rounded-lg shadow-lg p-4 w-[350px] min-w-[300px] flex-shrink-0 flex flex-col"> */}
            <h3 className="font-semibold text-lg mb-4 flex items-center">
                <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusStyles(status)}`}>
                    {status}
                </span>
            </h3>
            <div ref={columnRef} className="flex flex-col gap-3 overflow-y-auto max-h-[80vh]">
                {isInitialLoading
                    ? skeletonTickets.map((_, idx) => (
                        // {/* ...skeleton ... */}
                        <div
                            key={idx}
                            className="bg-gray-100 animate-pulse border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-2"
                        >
                            <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
                            <div className="w-full h-3 bg-gray-200 rounded mb-1" />
                            <div className="w-1/2 h-3 bg-gray-200 rounded mb-1" />
                            <div className="flex gap-2 mt-1">
                                <div className="w-12 h-4 bg-gray-200 rounded" />
                                <div className="w-12 h-4 bg-gray-200 rounded" />
                            </div>
                        </div>
                    ))
                    :
                    (
                        <>
                            {tickets.map((ticket) => (
                                // {/* ...ticket ... */}
                                <div
                                    key={ticket.id}
                                    onClick={() => onOpenModal(ticket)}
                                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                                >
                                    {ticket.image && (
                                        <img
                                            src={ticket.image}
                                            alt="Adjunto"
                                            className="w-full h-24 object-contain rounded mb-3"
                                        />
                                    )}
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="font-semibold text-sm text-gray-900">{ticket.title.length > 100 ? `${ticket.title.slice(0, 100)}...` : ticket.title}</h4>
                                        <button
                                            type="button"
                                            className="text-gray-900 hover:text-gray-600"
                                            title="Ver más detalles"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 cursor-pointer">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{ticket.description || "Sin descripción"}</p>

                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        {ticket.is_urgent && (
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
                                            Fecha: {ticket.incident_date ? formatDateInTimezone(ticket.incident_date) : "No especificada"}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <strong className="text-xs">ID:</strong> {ticket.id}
                                        </div>
                                    </div>

                                    {ticket.assignee && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-6 w-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-semibold text-gray-700">
                                                {(!ticket.assignee || ticket.assignee === "<< SIN ASIGNAR >>")
                                                    ? "SA"
                                                    : ticket.assignee
                                                        .split(" ")
                                                        .slice(0, 2)
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()}
                                            </div>
                                            <span className="text-xs text-gray-600">{ticket.assignee}</span>
                                        </div>
                                    )}
                                </div>
                            ))}{isPaginating && (
                                <div className="flex justify-center py-3">
                                    <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                </div>
                            )}
                        </>
                    )}
                <div ref={sentinelRef} className="h-2 w-full" />
            </div>
        </div>
    );
}
