import { useState, useRef, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import EditTicketModal from './EditWorkOrdersModal';
import {
  updateTicket,
  getTicketCountsRPC,
  getTicketsByWorkOrdersFiltersPaginated,
} from '../../../services/ticketService';
import type { Ticket } from '../../../types/Ticket';
import type { FilterState } from '../../../types/filters';
import type { WorkOrdersFilterKey } from '../../../features/tickets/WorkOrdersFilters';
import WorkOrdersColumn from './WorkOrdersColumn';
import Modal from '../../ui/Modal';
import { showToastSuccess, showToastError } from '../../../notifications/toast';

const STATUSES: Ticket['status'][] = [
  'Pendiente',
  'En Ejecución',
  'Finalizadas',
];
const FILTERED_LIMIT = 200;

interface Props {
  filters?: FilterState<WorkOrdersFilterKey>;
}

export default function WorkOrdersBoard({ filters }: Props) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedTicket, setLastUpdatedTicket] = useState<Ticket | null>(
    null
  );
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState<Record<Ticket['status'], number>>({
    Pendiente: 0,
    'En Ejecución': 0,
    Finalizadas: 0,
  });

  const loadedColumns = useRef(0);

  /** ¿Hay filtros activos? */
  const isFiltering = useMemo(() => {
    const f = (filters ?? {}) as Record<string, unknown>;
    return Object.keys(f).some((k) => {
      const val = f[k];
      if (val === undefined || val === null || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    });
  }, [filters]);

  /** Normalización segura para la RPC de conteos */
  const countsFilters = useMemo(
    () => ({
      term:
        typeof (filters as Record<string, unknown> | undefined)?.q === 'string'
          ? ((filters as Record<string, unknown>).q as string).trim() ||
            undefined
          : undefined,
      location:
        typeof (filters as Record<string, unknown> | undefined)?.location ===
        'string'
          ? ((filters as Record<string, unknown>).location as string)
          : undefined,
    }),
    [filters]
  );

  /** Carga cuando hay filtros (una sola query y se reparte por columnas) */
  useEffect(() => {
    let alive = true;
    (async () => {
      setIsLoading(true);
      if (isFiltering) {
        const { data } = await getTicketsByWorkOrdersFiltersPaginated(
          (filters ?? {}) as FilterState<string>,
          0,
          FILTERED_LIMIT
        );
        if (alive) setFilteredTickets(data);
      } else {
        setFilteredTickets([]);
        setReloadKey((p) => p + 1); // fuerza recarga de columnas con paginación local
      }
      setIsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [isFiltering, JSON.stringify(filters)]);

  /** Conteos (badges) */
  useEffect(() => {
    let alive = true;
    (async () => {
      const c = await getTicketCountsRPC(countsFilters);
      if (alive) setCounts(c);
    })();
    return () => {
      alive = false;
    };
  }, [JSON.stringify(countsFilters)]);

  /** UI optimista para los badges */
  function bumpCountsLocal(oldTicket: Ticket, newTicket: Ticket) {
    setCounts((prev) => {
      const next = { ...prev };
      if (STATUSES.includes(oldTicket.status)) {
        next[oldTicket.status] = Math.max(0, (next[oldTicket.status] ?? 0) - 1);
      }
      if (STATUSES.includes(newTicket.status)) {
        next[newTicket.status] = (next[newTicket.status] ?? 0) + 1;
      }
      return next;
    });
  }

  /** Debounce para reconciliar con la BD vía RPC */
  const refreshTimeout = useRef<number | null>(null);
  function scheduleCountsRefresh() {
    if (refreshTimeout.current) window.clearTimeout(refreshTimeout.current);
    refreshTimeout.current = window.setTimeout(async () => {
      const c = await getTicketCountsRPC(countsFilters);
      setCounts(c);
      refreshTimeout.current = null;
    }, 1200);
  }

  /** Modal */
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
      const prev = selectedTicket || updatedTicket;

      await updateTicket(Number(updatedTicket.id), {
        comments: updatedTicket.comments ?? undefined,
        assignee_id: updatedTicket.assignee_id ?? undefined,
        priority: updatedTicket.priority,
        status: updatedTicket.status,
        is_urgent: !!updatedTicket.is_urgent,
        deadline_date: updatedTicket.deadline_date ?? undefined,
      });

      setLastUpdatedTicket(updatedTicket);
      showToastSuccess('Ticket actualizado correctamente.');
      setModalOpen(false);
      setSelectedTicket(null);

      const affected =
        prev.status !== updatedTicket.status ||
        prev.is_accepted !== updatedTicket.is_accepted ||
        prev.location !== updatedTicket.location;

      if (affected) {
        bumpCountsLocal(prev, updatedTicket);
        scheduleCountsRefresh();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error al actualizar el ticket:', error.message);
        showToastError(
          `No se pudo actualizar el ticket. Intenta de nuevo. ${error.message}`
        );
      } else {
        console.error('❌ Error desconocido:', error);
        showToastError(
          `No se pudo actualizar el ticket. Intenta de nuevo. ${error}`
        );
      }
    }
  };

  /** Sincroniza la animación del loader por columnas */
  const handleColumnLoaded = () => {
    loadedColumns.current += 1;
    if (loadedColumns.current >= STATUSES.length) setIsLoading(false);
  };
  useEffect(() => {
    loadedColumns.current = 0;
    setIsLoading(true);
  }, [reloadKey]);

  /** Realtime: actualiza badges por delta */
  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes-WorkOrdersBoard')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets' },
        (payload) => {
          const oldRow = payload.old as Ticket;
          const newRow = payload.new as Ticket;
          if (
            oldRow.status !== newRow.status ||
            oldRow.is_accepted !== newRow.is_accepted ||
            oldRow.location !== newRow.location
          ) {
            bumpCountsLocal(oldRow, newRow);
            scheduleCountsRefresh();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [JSON.stringify(countsFilters)]);

  return (
    <div className="flex gap-6 h-full w-full overflow-x-auto">
      {STATUSES.map((status) => (
        <WorkOrdersColumn
          key={status}
          status={status}
          isSearching={isFiltering}
          isFiltering={isFiltering}
          tickets={
            isFiltering
              ? filteredTickets.filter((t) => t.status === status)
              : undefined
          }
          onOpenModal={openModal}
          getPriorityStyles={(priority) => {
            const styles: Record<Ticket['priority'], string> = {
              baja: 'bg-green-100 text-green-800 border-green-200',
              media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
              alta: 'bg-orange-100 text-orange-800 border-orange-200',
            };
            return (
              styles[priority] || 'bg-gray-100 text-gray-800 border-gray-200'
            );
          }}
          getStatusStyles={(s) => {
            const styles: Record<Ticket['status'], string> = {
              Pendiente: 'bg-yellow-100 text-gray-800 border-gray-200',
              'En Ejecución': 'bg-blue-100 text-blue-800 border-blue-200',
              Finalizadas: 'bg-green-100 text-green-800 border-green-200',
            };
            return styles[s] || 'bg-gray-100 text-gray-800 border-gray-200';
          }}
          capitalize={(w) =>
            typeof w === 'string' ? w[0].toUpperCase() + w.slice(1) : ''
          }
          isLoading={isLoading}
          onFirstLoad={handleColumnLoaded}
          reloadSignal={reloadKey}
          lastUpdatedTicket={lastUpdatedTicket}
          selectedLocation={
            typeof (filters as Record<string, unknown> | undefined)
              ?.location === 'string'
              ? ((filters as Record<string, unknown>).location as string)
              : undefined
          }
          count={counts[status]}
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
