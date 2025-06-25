import { useEffect, useRef, useState, useCallback } from "react";
import { getTicketsByStatusPaginated } from "../../services/ticketService";
import type { Ticket } from "../../types/Ticket";
interface Props {
    tickets?: Ticket[];
    isSearching: boolean;
    status: Ticket["status"];
    onOpenModal: (ticket: Ticket) => void;
    getPriorityStyles: (priority: Ticket["priority"]) => string;
    getStatusStyles: (status: Ticket["status"]) => string;
    capitalize: (word?: string) => string;
    onFirstLoad: () => void;
    isLoading: boolean;
    pageSize?: number;
    reloadSignal: number;
    lastUpdatedTicket: Ticket | null;
    location?: string;
}

export default function KanbanColumn({
    tickets,
    isSearching,
    status,
    onOpenModal,
    getPriorityStyles,
    getStatusStyles,
    capitalize,
    onFirstLoad,
    pageSize = 10,
    reloadSignal,
    lastUpdatedTicket,
    location,

}: Props) {
    const [localTickets, setLocalTickets] = useState<Ticket[]>([]);
    const [page, setPage] = useState(0);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [firstLoaded, setFirstLoaded] = useState(false);

    const pageRef = useRef(0);
    const isPaginatingRef = useRef(false);
    const columnRef = useRef<HTMLDivElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    // Skeleton loader
    const skeletonTickets = Array.from({ length: 5 });
    // Decide qué tickets renderizar
    const ticketsToRender = isSearching ? (tickets ?? []) : localTickets;
    // Loading solo cuando no hay tickets para mostrar y está cargando
    const showSkeleton = isInitialLoading && !isSearching;

    // Pagina y agrega tickets SOLO en modo normal
    const loadMoreTickets = useCallback(
        async (force = false) => {
            if (isSearching) return; // ← aquí ignoramos si estamos buscando

            if ((isInitialLoading || isPaginatingRef.current) && !force) return;
            if (!hasMore) return;

            if (force) {
                setIsInitialLoading(true);
                pageRef.current = 0;
                setPage(0);
            } else {
                setIsPaginating(true);
            }

            const currentPage = force ? 0 : pageRef.current;
            const newTickets = await getTicketsByStatusPaginated(status, currentPage, pageSize ?? 20, location);

            setLocalTickets((prev) => {
                const merged = force ? [...newTickets] : [...prev, ...newTickets];
                const unique = Array.from(new Map(merged.map((t) => [t.id, t])).values());
                return unique;
            });

            if (newTickets.length < pageSize) {
                setHasMore(false);
            } else {
                pageRef.current = currentPage + 1;
                setPage(currentPage + 1);
            }

            if (force) setIsInitialLoading(false);
            else setIsPaginating(false);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isSearching, isInitialLoading, hasMore, status, page, pageSize]
    );

    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    useEffect(() => {
        isPaginatingRef.current = isPaginating;
    }, [isPaginating]);

    // Efecto: resetea y carga los tickets solo si NO estás buscando
    // Resetea y recarga cada vez que:
    // - sales del modo búsqueda (isSearching pasa a false)
    // - cambia el status (columna)
    // - cambia reloadSignal (se fuerza recarga global)
    useEffect(() => {
        if (!isSearching) {
            setLocalTickets([]);
            setPage(0);
            setHasMore(true);
            setFirstLoaded(false);
            setIsInitialLoading(true);
            loadMoreTickets(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSearching, status, reloadSignal]);

    // Cuando termina de cargar los tickets por primera vez, notificamos al board
    useEffect(() => {
        if (!firstLoaded && (isSearching || localTickets.length > 0)) {
            setFirstLoaded(true);
            onFirstLoad();
        }
    }, [isSearching, localTickets.length, firstLoaded, onFirstLoad]);

    // Observador de intersección para el sentinel
    useEffect(() => {
        if (isSearching) return; // No observar en modo búsqueda

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSearching, localTickets.length, hasMore]);

    // Efecto: actualiza los tickets locales cuando hay un ticket actualizado
    // y no estás buscando
    // Esta lógica se mantiene igual que antes, pero ahora se asegura de que
    // no se ejecute si estás buscando tickets.
    // Esto evita que se actualicen los tickets mientras estás en modo búsqueda,
    // lo cual podría causar inconsistencias o problemas de rendimiento.
    // Si estás buscando, simplemente ignoramos este efecto.
    // Si no estás buscando, se aplica la lógica de actualización de tickets.
    // Si el ticket actualizado tiene el mismo estado que la columna,
    // lo actualizamos o lo agregamos a la lista local.
    // Si el ticket actualizado tiene un estado diferente, lo eliminamos de la lista local.
    // Esto asegura que la columna siempre muestre los tickets correctos según su estado,
    // incluso si se actualizan en tiempo real mientras estás en modo búsqueda.
    // Si estás buscando, simplemente ignoramos este efecto.
    useEffect(() => {
        if (isSearching || !lastUpdatedTicket) return;

        // Misma lógica que antes
        if (lastUpdatedTicket.status === status) {
            setLocalTickets((prev) => {
                const exists = prev.some((t) => t.id === lastUpdatedTicket.id);
                if (exists) {
                    return prev.map((t) =>
                        t.id === lastUpdatedTicket.id ? lastUpdatedTicket : t
                    );
                } else {
                    return [lastUpdatedTicket, ...prev];
                }
            });
        } else {
            setLocalTickets((prev) => prev.filter((t) => t.id !== lastUpdatedTicket.id));
        }
    }, [isSearching, lastUpdatedTicket, status]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 w-[300px] sm:w-[350px] md:w-[400px] xl:w-[420px] min-w-[300px] flex-shrink-0 flex flex-col">
            {/* <div className="bg-white rounded-lg shadow-lg p-4 w-[350px] min-w-[300px] flex-shrink-0 flex flex-col"> */}
            <h3 className="font-semibold text-lg mb-4 flex items-center">
                <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusStyles(status)}`}>
                    {status}
                </span>
            </h3>
            <div ref={columnRef} className="flex flex-col gap-3 overflow-y-auto max-h-[80vh]">
                {showSkeleton
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
                            {ticketsToRender.map((ticket) => (
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
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                            </svg>
                                            Ubicación: {ticket.location || "No especificada"}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 9h10m-11 5h12a2 2 0 002-2v-5H3v5a2 2 0 002 2z" />
                                            </svg>
                                            Fecha: {ticket.incident_date ? (ticket.incident_date) : "No especificada"}
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
                            ))}{isPaginating && !isSearching && (
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
