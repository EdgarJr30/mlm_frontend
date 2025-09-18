import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/navigation/Navbar';
import KanbanBoard from '../components/dashboard/kanban/KanbanBoard';
import WorkOrdersList from '../components/dashboard/kanban/WorkOrdersList';
// import KanbanFiltersBar from '../components/dashboard/kanban/KanbanFiltersBar';
import Modal from '../components/ui/Modal';
import EditTicketModal from '../components/dashboard/ticket/EditTicketModal';
import { updateTicket } from '../services/ticketService';
import { showToastError, showToastSuccess } from '../notifications/toast';
import type { FilterState } from '../types/filters';
import type { KanbanFilterKey } from '../features/tickets/kanbanFilters';
import type { Ticket } from '../types/Ticket';

type ViewMode = 'kanban' | 'list';

export default function KanbanPage() {
  // Navbar
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Filtros avanzados
  const [filters] = useState<Record<string, unknown>>({});

  // Vista actual
  const [view, setView] = useState<ViewMode>('kanban');

  // Modal para LISTA (kanban ya maneja su propio modal interno)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const mergedFilters = useMemo<FilterState<KanbanFilterKey>>(
    () => ({
      ...(filters as FilterState<KanbanFilterKey>),
      q: searchTerm || undefined,
      location: selectedLocation || undefined,
    }),
    [filters, searchTerm, selectedLocation]
  );

  useEffect(() => {
    // hijos reaccionan a mergedFilters
  }, [mergedFilters]);

  async function handleSave(updated: Ticket) {
    try {
      await updateTicket(Number(updated.id), updated);
      showToastSuccess('Ticket actualizado correctamente.');
      setModalOpen(false);
      setSelectedTicket(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToastError(`No se pudo actualizar el ticket. ${msg}`);
    }
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex flex-col h-[100dvh] overflow-hidden flex-1">
        <Navbar
          onSearch={setSearchTerm}
          onFilterLocation={setSelectedLocation}
          selectedLocation={selectedLocation}
        />

        <header className="px-4 md:px-6 lg:px-8 pb-0 pt-4 md:pt-6 flex items-center gap-3">
          <h2 className="text-3xl font-bold">Órdenes de Trabajo</h2>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView('kanban')}
              className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium cursor-pointer
                ${
                  view === 'kanban'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              title="Vista kanban"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 6v-6h6v6h-6z" />
              </svg>
              Kanban
            </button>

            <button
              type="button"
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium cursor-pointer
                ${
                  view === 'list'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              title="Vista de lista"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
              </svg>
              Lista
            </button>
          </div>
        </header>

        {/* <div className="px-4 md:px-6 lg:px-8 pt-3">
          <KanbanFiltersBar onApply={(vals) => setFilters(vals)} />
        </div> */}

        <section className="flex-1 overflow-x-auto px-4 md:px-6 lg:px-8 pt-4 pb-8">
          {view === 'kanban' ? (
            <KanbanBoard filters={mergedFilters} />
          ) : (
            <WorkOrdersList
              filters={mergedFilters}
              onOpen={(t) => {
                setSelectedTicket(t);
                setModalOpen(true);
              }}
            />
          )}
        </section>

        {/* Modal (LISTA) — usa el MISMO componente que Kanban */}
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedTicket(null);
          }}
          isLocked={showFullImage}
        >
          {selectedTicket && (
            <EditTicketModal
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false);
                setSelectedTicket(null);
              }}
              ticket={selectedTicket}
              onSave={handleSave}
              showFullImage={showFullImage}
              setShowFullImage={setShowFullImage}
            />
          )}
        </Modal>
      </main>
    </div>
  );
}
