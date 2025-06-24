import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import type { Ticket } from '../../types/Ticket';
import { getFilteredTickets, getUnacceptedTicketsPaginated, acceptTickets } from '../../services/ticketService';
import { showToastError, showToastSuccess } from '../../notifications';
interface Props {
    searchTerm: string;
}

const PAGE_SIZE = 10;

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function InboxBoard({ searchTerm }: Props) {
    const checkbox = useRef<HTMLInputElement>(null)
    const [checked, setChecked] = useState(false)
    const [indeterminate, setIndeterminate] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<Ticket[]>([])
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [, setFilteredTickets] = useState<Ticket[]>([]);

    useLayoutEffect(() => {
        const isIndeterminate = selectedTicket.length > 0 && selectedTicket.length < tickets.length
        setChecked(selectedTicket.length === tickets.length)
        setIndeterminate(isIndeterminate)
        if (checkbox.current) {
            checkbox.current.indeterminate = isIndeterminate
        }
    }, [selectedTicket, tickets.length])

    function toggleAll() {
        setSelectedTicket(checked || indeterminate ? [] : tickets)
        setChecked(!checked && !indeterminate)
        setIndeterminate(false)
    }

    async function handleAcceptTickets() {
        if (selectedTicket.length === 0) return;
        setIsLoading(true);
        try {
            const ids = selectedTicket.map((t) => t.id);
            await acceptTickets(ids);
            showToastSuccess(
                ids.length === 1
                    ? "Ticket aceptado correctamente."
                    : `Se aceptaron ${ids.length} tickets correctamente.`
            );
            setSelectedTicket([]);
            // Recarga los tickets sin aceptar
            const { data, count } = await getUnacceptedTicketsPaginated(page, PAGE_SIZE);
            setTickets(data);
            setTotalCount(count);
        } catch (error) {
            showToastError(`Hubo un error al aceptar los tickets. Error: ${error instanceof Error ? error.message : 'Desconocido'}`);
        } finally {
            setIsLoading(false);
        }
    }

    // Solo buscar cuando searchTerm está activo (>= 2 caracteres)
    useEffect(() => {
        if (searchTerm.length >= 2) {
            console.log("🟢 Ejecutando búsqueda desde InboxBoard:", searchTerm);
            setIsLoading(true);
            getFilteredTickets(searchTerm)
                .then(results => {
                    setFilteredTickets(results);
                    setIsLoading(false);
                });
        }
    }, [searchTerm]);

    // Carga tickets cada vez que cambia la página
    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        getUnacceptedTicketsPaginated(page, PAGE_SIZE).then(({ data, count }) => {
            if (mounted) {
                setTickets(data);
                setTotalCount(count);
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
        };
    }, [page]);


    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    {/* <h1 className="text-base font-semibold text-gray-900">Tickets</h1> */}
                    <p className="mt-2 text-sm text-gray-700">
                        Listado de tickets pendientes de aceptación. Puedes seleccionar varios tickets para aceptarlos de una vez.
                    </p>
                    <span className="text-sm text-gray-500">
                        Página {page + 1} de {Math.ceil(totalCount / PAGE_SIZE) || 1}
                    </span>
                </div>
                {/* <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        type="button"
                        className="block rounded-md bg-indigo-600 px-3 py-1.5 text-center text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Add user
                    </button>
                </div> */}
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="relative">
                            {selectedTicket.length > 0 && (
                                <div className="absolute top-0 left-14 flex h-12 items-center space-x-3 bg-white sm:left-12">
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                                        onClick={handleAcceptTickets}
                                        // disabled={selectedTicket.length === 0 || isLoading}
                                    >
                                        Aceptar tickets
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                                    >
                                        Delete all
                                    </button>
                                </div>
                            )}
                            <table className="min-w-full table-fixed divide-y divide-gray-300">
                                <thead>
                                    <tr>
                                        <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                                            <div className="group absolute top-1/2 left-4 -mt-2 grid size-4 grid-cols-1">
                                                <input
                                                    type="checkbox"
                                                    className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                                    ref={checkbox}
                                                    checked={checked}
                                                    onChange={toggleAll}
                                                />
                                                <svg
                                                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                                                    viewBox="0 0 14 14"
                                                    fill="none"
                                                >
                                                    <path
                                                        className="opacity-0 group-has-checked:opacity-100"
                                                        d="M3 8L6 11L11 3.5"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                    <path
                                                        className="opacity-0 group-has-indeterminate:opacity-100"
                                                        d="M3 7H11"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Título</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Solicitante</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ubicación</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Fecha de creación</th>
                                        <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-3">
                                            <span className="sr-only">Edit</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-gray-400">
                                                Cargando...
                                            </td>
                                        </tr>
                                    ) : tickets.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-gray-400">
                                                No hay tickets pendientes.
                                            </td>
                                        </tr>
                                    ) : (
                                        tickets.map((ticket) => (
                                            <tr key={ticket.id} className={selectedTicket.includes(ticket) ? 'bg-gray-50' : undefined}>
                                                <td className="relative px-7 sm:w-12 sm:px-6">
                                                    {selectedTicket.includes(ticket) && (
                                                        <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
                                                    )}
                                                    <div className="group absolute top-1/2 left-4 -mt-2 grid size-4 grid-cols-1">
                                                        <input
                                                            type="checkbox"
                                                            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                                            value={ticket.id}
                                                            checked={selectedTicket.includes(ticket)}
                                                            onChange={(e) =>
                                                                setSelectedTicket(
                                                                    e.target.checked
                                                                        ? [...selectedTicket, ticket]
                                                                        : selectedTicket.filter((p) => p !== ticket),
                                                                )
                                                            }
                                                        />
                                                        <svg
                                                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                                                            viewBox="0 0 14 14"
                                                            fill="none"
                                                        >
                                                            <path
                                                                className="opacity-0 group-has-checked:opacity-100"
                                                                d="M3 8L6 11L11 3.5"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                            <path
                                                                className="opacity-0 group-has-indeterminate:opacity-100"
                                                                d="M3 7H11"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    </div>
                                                </td>
                                                <td
                                                    className={classNames(
                                                        'py-4 pr-3 text-sm font-medium whitespace-nowrap',
                                                        selectedTicket.includes(ticket) ? 'text-indigo-600' : 'text-gray-900',
                                                    )}
                                                >
                                                    {ticket.id}
                                                </td>
                                                <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{ticket.title}</td>
                                                <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{ticket.requester}</td>
                                                <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{ticket.location}</td>
                                                <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-3">
                                                    <a href="#" className="text-indigo-600 hover:text-indigo-900">
                                                        Edit<span className="sr-only">, {ticket.is_accepted}</span>
                                                    </a>
                                                </td>
                                            </tr>
                                        ))
                                    )}

                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            {/* Paginación */}
            <div className="flex justify-end gap-2 mt-4">
                <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium disabled:opacity-40"
                >
                    Anterior
                </button>
                <button
                    onClick={() => setPage((p) => (p + 1 < Math.ceil(totalCount / PAGE_SIZE) ? p + 1 : p))}
                    disabled={page + 1 >= Math.ceil(totalCount / PAGE_SIZE)}
                    className="px-4 py-2 rounded bg-indigo-600 text-white font-medium disabled:opacity-40"
                >
                    Siguiente
                </button>
            </div>
        </div>
    )
}
