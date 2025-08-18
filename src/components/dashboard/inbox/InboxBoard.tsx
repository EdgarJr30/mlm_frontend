import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import type { Ticket } from '../../../types/Ticket';
import {
  getFilteredTickets,
  getUnacceptedTicketsPaginated,
  acceptTickets,
} from '../../../services/ticketService';
import {
  getPublicImageUrl,
  getTicketImagePaths,
} from '../../../services/storageService';
import { showToastError, showToastSuccess } from '../../../notifications';
import { formatDateInTimezone } from '../../../utils/formatDate';

interface Props {
  searchTerm: string;
  selectedLocation: string;
}

const PAGE_SIZE = 8;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function PriorityChip({ value }: { value: string }) {
  const map: Record<string, string> = {
    Baja: 'bg-emerald-100 text-emerald-800',
    Media: 'bg-amber-100 text-amber-800',
    Alta: 'bg-orange-100 text-orange-800',
    Crítica: 'bg-rose-100 text-rose-800',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        map[value] || 'bg-gray-100 text-gray-700'
      )}
    >
      {value}
    </span>
  );
}

function StatusChip({ value }: { value: string }) {
  const map: Record<string, string> = {
    Nueva: 'bg-gray-100 text-gray-800',
    'En Revisión': 'bg-yellow-100 text-yellow-800',
    Aprobada: 'bg-emerald-100 text-emerald-800',
    Rechazada: 'bg-rose-100 text-rose-800',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        map[value] || 'bg-gray-100 text-gray-700'
      )}
    >
      {value}
    </span>
  );
}

function TicketDetailModal({
  ticket,
  onClose,
}: {
  ticket: Ticket;
  onClose: () => void;
}) {
  const imagePaths = getTicketImagePaths(ticket.image ?? '');

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[86vh] overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-xl font-semibold">Solicitud #{ticket.id}</h3>
            <p className="text-gray-500">{ticket.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 grid place-items-center cursor-pointer"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <nav className="px-6 pt-3">
          <div className="flex gap-6 text-sm">
            <span className="font-medium text-indigo-600">Detalles</span>
            <span className="text-gray-400">Comentarios</span>
            <span className="text-gray-400">Historial</span>
          </div>
        </nav>

        <section className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Información General */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Información General</h4>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Solicitante</dt>
                <dd className="text-gray-900">{ticket.requester}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Ubicación</dt>
                <dd className="text-gray-900">{ticket.location}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Fecha de creación</dt>
                <dd className="text-gray-900">
                  {formatDateInTimezone(ticket.created_at)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Estado y Prioridad */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Estado y Prioridad</h4>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Estado actual</dt>
                <dd className="mt-1">
                  <StatusChip value={ticket.status ?? 'Nueva'} />
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Prioridad</dt>
                <dd className="mt-1">
                  <PriorityChip value={ticket.priority ?? 'Media'} />
                </dd>
              </div>
            </dl>
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <h4 className="text-lg font-semibold mb-2">
              Descripción del Problema
            </h4>
            <p className="text-gray-700 whitespace-pre-wrap">
              {ticket.description || '—'}
            </p>
          </div>

          {/* Fotos Adjuntas */}
          <div className="md:col-span-2">
            <h4 className="text-lg font-semibold mb-3">Fotos Adjuntas</h4>
            {imagePaths.length === 0 ? (
              <p className="text-sm text-gray-500">No hay imágenes.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {imagePaths.map((p, i) => (
                  <a
                    key={i}
                    href={getPublicImageUrl(p)}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <img
                      src={getPublicImageUrl(p)}
                      alt={`Adjunto ${i + 1}`}
                      className="w-full h-28 object-cover rounded"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function InboxBoard({ searchTerm, selectedLocation }: Props) {
  const checkbox = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);

  const isSearching = searchTerm.length >= 2;
  const ticketsToShow = isSearching ? filteredTickets : tickets;

  useLayoutEffect(() => {
    const isIndeterminate =
      selectedTicket.length > 0 && selectedTicket.length < ticketsToShow.length;
    setChecked(
      selectedTicket.length === ticketsToShow.length && ticketsToShow.length > 0
    );
    setIndeterminate(isIndeterminate);
    if (checkbox.current) checkbox.current.indeterminate = isIndeterminate;
  }, [selectedTicket, ticketsToShow.length]);

  function toggleAll() {
    setSelectedTicket(checked || indeterminate ? [] : ticketsToShow);
    setChecked(!checked && !indeterminate);
    setIndeterminate(false);
  }

  async function handleAcceptSelected() {
    if (selectedTicket.length === 0) return;
    setIsLoading(true);
    try {
      const ids = selectedTicket.map((t) => t.id);
      await acceptTickets(ids);
      showToastSuccess(
        ids.length === 1
          ? 'Ticket aceptado correctamente.'
          : `Se aceptaron ${ids.length} tickets correctamente.`
      );
      setSelectedTicket([]);
      await reload();
    } catch (error) {
      showToastError(
        `Hubo un error al aceptar los tickets. Error: ${
          error instanceof Error ? error.message : 'Desconocido'
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAcceptOne(id: number) {
    setIsLoading(true);
    try {
      await acceptTickets([String(id)]);
      showToastSuccess('Ticket aceptado correctamente.');
      await reload();
    } catch (error) {
      showToastError(
        `Hubo un error al aceptar el ticket. Error: ${
          error instanceof Error ? error.message : 'Desconocido'
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function reload() {
    if (isSearching) {
      const results = await getFilteredTickets(
        searchTerm,
        selectedLocation,
        false
      );
      setFilteredTickets(results);
    } else {
      const { data, count } = await getUnacceptedTicketsPaginated(
        page,
        PAGE_SIZE,
        selectedLocation
      );
      setTickets(data);
      setTotalCount(count);
    }
  }

  // Búsqueda por texto + ubicación
  useEffect(() => {
    if (!isSearching) return;
    setIsLoading(true);
    getFilteredTickets(searchTerm, selectedLocation, false)
      .then((results) => setFilteredTickets(results))
      .finally(() => setIsLoading(false));
  }, [searchTerm, isSearching, selectedLocation]);

  // Limpiar resultados al salir de búsqueda
  useEffect(() => {
    if (!isSearching) setFilteredTickets([]);
  }, [isSearching]);

  // Carga paginada
  useEffect(() => {
    if (isSearching) return;
    let mounted = true;
    setIsLoading(true);
    getUnacceptedTicketsPaginated(page, PAGE_SIZE, selectedLocation).then(
      ({ data, count }) => {
        if (!mounted) return;
        setTickets(data);
        setTotalCount(count);
        setIsLoading(false);
      }
    );
    return () => {
      mounted = false;
    };
  }, [page, isSearching, selectedLocation]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Barra superior: texto + botón masivo */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-700">
          Tickets pendientes de aprobación — Página {page + 1} de{' '}
          {Math.ceil(totalCount / PAGE_SIZE) || 1}
        </p>
        <div className="ml-auto">
          <button
            type="button"
            onClick={handleAcceptSelected}
            disabled={selectedTicket.length === 0 || isLoading}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40 cursor-pointer"
          >
            Aceptar tickets
          </button>
        </div>
      </div>

      {/* CONTENEDOR SCROLLABLE */}
      <div className="mt-3 flex-1 min-h-0">
        {/* ===== Vista Móvil: tarjetas ===== */}
        <div className="md:hidden space-y-3 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Cargando…</div>
          ) : ticketsToShow.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              No hay tickets pendientes.
            </div>
          ) : (
            ticketsToShow.map((t) => {
              const imagePaths = getTicketImagePaths(t.image ?? '');
              const cover = imagePaths[0];
              const selected = selectedTicket.includes(t);

              return (
                <div
                  key={t.id}
                  className={`rounded-xl border bg-white p-4 shadow-sm ${
                    selected ? 'ring-1 ring-indigo-300' : ''
                  }`}
                  onClick={() => setDetailTicket(t)}
                >
                  <div className="flex items-start gap-3">
                    {/* checkbox */}
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      checked={selected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedTicket((prev) => [...prev, t]);
                        else
                          setSelectedTicket((prev) =>
                            prev.filter((x) => x !== t)
                          );
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">#{t.id}</div>
                      <div className="mt-0.5 text-base font-semibold text-gray-900 line-clamp-1">
                        {t.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {t.description}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-gray-700">{t.requester}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-700">{t.location}</span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <PriorityChip value={t.priority ?? 'Media'} />
                        <StatusChip value={t.status ?? 'Nueva'} />
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        {formatDateInTimezone(t.created_at)}
                      </div>
                    </div>

                    {/* miniatura/activo */}
                    {cover ? (
                      <img
                        src={getPublicImageUrl(cover)}
                        alt="Activo"
                        className="h-14 w-20 rounded object-cover"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailTicket(t);
                        }}
                      />
                    ) : null}
                  </div>

                  {/* Acciones */}
                  <div className="mt-3 flex items-center justify-end gap-4">
                    <button
                      className="text-indigo-600 hover:text-indigo-500 text-sm cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailTicket(t);
                      }}
                    >
                      Ver
                    </button>
                    <button
                      className="text-emerald-600 hover:text-emerald-500 text-sm cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptOne(Number(t.id));
                      }}
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ===== Vista md+: tabla clásica con header sticky y scroll horizontal si es necesario ===== */}
        <div className="hidden md:block h-full min-h-0 overflow-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-auto rounded-lg ring-1 ring-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 w-12">
                      <input
                        ref={checkbox}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                        checked={checked}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleAll();
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Solicitud
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Solicitante
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Prioridad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Ubicación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Adjuntos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-8 text-center text-gray-400"
                      >
                        Cargando…
                      </td>
                    </tr>
                  ) : ticketsToShow.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-8 text-center text-gray-400"
                      >
                        No hay tickets pendientes.
                      </td>
                    </tr>
                  ) : (
                    ticketsToShow.map((t) => {
                      const imagePaths = getTicketImagePaths(t.image ?? '');
                      const firstAsset = imagePaths[0];
                      const selected = selectedTicket.includes(t);

                      return (
                        <tr
                          key={t.id}
                          className={cx(
                            'hover:bg-gray-50 transition cursor-pointer',
                            selected && 'bg-indigo-50'
                          )}
                          onClick={() => setDetailTicket(t)}
                        >
                          <td
                            className="relative px-6 w-12"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {selected && (
                              <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
                            )}
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                              checked={selected}
                              onChange={(e) => {
                                if (e.target.checked)
                                  setSelectedTicket((prev) => [...prev, t]);
                                else
                                  setSelectedTicket((prev) =>
                                    prev.filter((x) => x !== t)
                                  );
                              }}
                            />
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            #{t.id}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {t.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {t.description}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {t.requester}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <PriorityChip value={t.priority ?? 'Media'} />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <StatusChip value={t.status ?? 'Nueva'} />
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {t.location}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {firstAsset ? (
                              <img
                                src={getPublicImageUrl(firstAsset)}
                                alt="Activo"
                                className="h-10 w-20 object-cover rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailTicket(t);
                                }}
                              />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {formatDateInTimezone(t.created_at)}
                          </td>
                          <td
                            className="px-4 py-4 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                className="text-indigo-600 hover:text-indigo-500 cursor-pointer"
                                onClick={() => setDetailTicket(t)}
                              >
                                👁️
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-500 cursor-pointer"
                                onClick={() => handleAcceptOne(Number(t.id))}
                              >
                                ✓
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Paginación */}
      {!isSearching && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium disabled:opacity-40 cursor-pointer hover:bg-gray-300 disabled:hover:bg-gray-200"
          >
            Anterior
          </button>
          <button
            onClick={() =>
              setPage((p) =>
                p + 1 < Math.ceil(totalCount / PAGE_SIZE) ? p + 1 : p
              )
            }
            disabled={page + 1 >= Math.ceil(totalCount / PAGE_SIZE)}
            className="px-4 py-2 rounded bg-indigo-600 text-white font-medium disabled:opacity-40 cursor-pointer hover:bg-indigo-500 disabled:hover:bg-indigo-600"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal */}
      {detailTicket && (
        <TicketDetailModal
          ticket={detailTicket}
          onClose={() => setDetailTicket(null)}
        />
      )}
    </div>
  );
}
