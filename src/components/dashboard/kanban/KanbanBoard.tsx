import { useState, useRef, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { getFilteredTickets } from '../../../services/ticketService';
import EditTicketModal from '../ticket/EditTicketModal';
import {
  updateTicket,
  getTicketCountsRPC,
} from '../../../services/ticketService';
import type { Ticket } from '../../../types/Ticket';
import KanbanColumn from './KanbanColumn';
import Modal from '../../ui/Modal';
import { showToastSuccess, showToastError } from '../../../notifications/toast';

const STATUSES: Ticket['status'][] = [
  'Pendiente',
  'En Ejecución',
  'Finalizadas',
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
  const [lastUpdatedTicket, setLastUpdatedTicket] = useState<Ticket | null>(
    null
  );
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState<Record<Ticket['status'], number>>({
    Pendiente: 0,
    'En Ejecución': 0,
    Finalizadas: 0,
  });

  const isSearching = searchTerm.length >= 2;
  const loadedColumns = useRef(0);
  const isFiltering = isSearching || selectedLocation.length > 0;

  // ===== Helpers de filtros/negocio =====
  const normTerm = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);

  function matchesActiveFilters(t: Ticket): boolean {
    // location
    if (selectedLocation && t.location !== selectedLocation) return false;

    // búsqueda (refleja la lógica de getFilteredTickets)
    if (normTerm.length >= 2) {
      const isNumeric = !isNaN(Number(normTerm));
      const title = (t.title ?? '').toLowerCase();
      const requester = (t.requester ?? '').toLowerCase();
      if (
        !title.includes(normTerm) &&
        !requester.includes(normTerm) &&
        !(isNumeric && String(t.id) === normTerm)
      ) {
        return false;
      }
    }
    return true;
  }

  // Regla: en "Pendiente" solo cuentan los aceptados
  function countsInStatus(
    t: Ticket,
    status: Ticket['status'] = t.status
  ): boolean {
    if (t.status !== status) return false;
    if (status === 'Pendiente' && !t.is_accepted) return false;
    return true;
  }

  // ===== UI optimista para badges =====
  function bumpCountsLocal(oldTicket: Ticket, newTicket: Ticket) {
    setCounts((prev) => {
      const next = { ...prev };

      // Restar de donde contaba antes (si aplicaba filtros)
      const oldCounted =
        (!isFiltering || matchesActiveFilters(oldTicket)) &&
        countsInStatus(oldTicket, oldTicket.status);

      if (oldCounted) {
        next[oldTicket.status] = Math.max(0, (next[oldTicket.status] ?? 0) - 1);
      }

      // Sumar donde cuenta ahora (si aplica filtros)
      const newCounted =
        (!isFiltering || matchesActiveFilters(newTicket)) &&
        countsInStatus(newTicket, newTicket.status);

      if (newCounted) {
        next[newTicket.status] = (next[newTicket.status] ?? 0) + 1;
      }

      return next;
    });
  }

  // Debounce para reconciliar con la BD vía RPC
  const refreshTimeout = useRef<number | null>(null);
  function scheduleCountsRefresh() {
    if (refreshTimeout.current) window.clearTimeout(refreshTimeout.current);
    refreshTimeout.current = window.setTimeout(async () => {
      const filters = isFiltering
        ? {
            term: normTerm || undefined,
            location: selectedLocation || undefined,
          }
        : undefined;
      const c = await getTicketCountsRPC(filters);
      setCounts(c);
      refreshTimeout.current = null;
    }, 1500);
  }

  // ===== Modal =====
  const openModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setModalOpen(false);
  };

  // Guardado desde modal (aplica optimismo si cambia algo que altera el conteo)
  const handleSave = async (updatedTicket: Ticket) => {
    try {
      const prev = selectedTicket || updatedTicket;
      await updateTicket(Number(updatedTicket.id), updatedTicket);
      setLastUpdatedTicket(updatedTicket);
      showToastSuccess('Ticket actualizado correctamente.');
      setModalOpen(false);
      setSelectedTicket(null);

      const affected =
        prev.status !== updatedTicket.status ||
        prev.is_accepted !== updatedTicket.is_accepted ||
        prev.location !== updatedTicket.location;

      if (affected) {
        bumpCountsLocal(prev, updatedTicket); // UI inmediata
        scheduleCountsRefresh(); // reconciliación barata
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

  // ===== Carga de datos / filtros =====
  const handleColumnLoaded = () => {
    loadedColumns.current += 1;
    if (loadedColumns.current >= STATUSES.length) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFiltering) {
      setIsLoading(true);
      getFilteredTickets(searchTerm, selectedLocation, true).then((results) => {
        setFilteredTickets(results);
        setIsLoading(false);
      });
    }
  }, [isFiltering, searchTerm, selectedLocation]);

  useEffect(() => {
    if (!isFiltering) {
      setFilteredTickets([]);
      setIsLoading(true);
      setReloadKey((prev) => prev + 1);
    }
  }, [isFiltering, searchTerm, selectedLocation]);

  useEffect(() => {
    setIsLoading(true);
    loadedColumns.current = 0;
  }, [reloadKey]);

  // Cargar conteos iniciales / ante cambios de filtros
  useEffect(() => {
    let alive = true;
    (async () => {
      const filters = isFiltering
        ? {
            term: normTerm || undefined,
            location: selectedLocation || undefined,
          }
        : undefined;
      const c = await getTicketCountsRPC(filters);
      if (alive) setCounts(c);
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey, isFiltering, normTerm, selectedLocation]);

  // ===== Realtime: actualiza badges por delta =====
  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets' },
        (payload) => {
          const oldRow = payload.old as Ticket;
          const newRow = payload.new as Ticket;

          // Solo si realmente cambió algo que afecta conteos
          const affected =
            oldRow.status !== newRow.status ||
            oldRow.is_accepted !== newRow.is_accepted ||
            oldRow.location !== newRow.location;

          if (!affected) return;

          bumpCountsLocal(oldRow, newRow);
          scheduleCountsRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isFiltering, normTerm, selectedLocation]); // dependencias por si cambian filtros

  // limpiar highlight
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
          selectedLocation={selectedLocation}
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
