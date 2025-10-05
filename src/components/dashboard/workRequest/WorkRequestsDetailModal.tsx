import { useEffect } from 'react';
import type { Ticket } from '../../../types/Ticket';
import { formatDateInTimezone } from '../../../utils/formatDate';
import {
  getPublicImageUrl,
  getTicketImagePaths,
} from '../../../services/storageService';
import { useAssignees } from '../../../context/AssigneeContext';
import type { Assignee } from '../../../types/Assignee';
import { formatAssigneeFullName } from '../../../services/assigneeService';

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

export default function WorkRequestsDetailModal({
  ticket,
  onClose,
  canFullWR,
  getAssigneeFor,
  setAssigneeFor,
}: {
  ticket: Ticket;
  onClose: () => void;
  canFullWR: boolean;
  getAssigneeFor: (id: number) => number | '';
  setAssigneeFor: (id: number, assigneeId: number) => void;
}) {
  const imagePaths = getTicketImagePaths(ticket.image ?? '');
  const { loading, bySectionActive } = useAssignees();

  const SECTIONS_ORDER: Array<
    'SIN ASIGNAR' | 'Internos' | 'TERCEROS' | 'OTROS'
  > = ['SIN ASIGNAR', 'Internos', 'TERCEROS', 'OTROS'];

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
        className="w-full max-w-5xl max-h-[86vh] overflow-y-auto no-x-scroll rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold">Solicitud #{ticket.id}</h3>
            <p className="text-gray-500 wrap-anywhere">{ticket.title}</p>
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
          <div>
            <h4 className="text-lg font-semibold mb-4">Información General</h4>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Solicitante</dt>
                <dd className="text-gray-900 wrap-anywhere">
                  {ticket.requester}
                </dd>
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

          {/* Asignación */}
          <div className="md:col-span-2">
            <h4 className="text-lg font-semibold mb-2">Asignación</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600">
                  Responsable
                </label>
                <select
                  className={
                    'mt-1 w-full rounded border-gray-300' +
                    (!canFullWR
                      ? ' opacity-50 cursor-not-allowed bg-gray-100'
                      : '')
                  }
                  disabled={loading || !canFullWR}
                  value={getAssigneeFor(Number(ticket.id))}
                  onChange={(e) =>
                    setAssigneeFor(Number(ticket.id), Number(e.target.value))
                  }
                >
                  <option value="" disabled>
                    Selecciona…
                  </option>
                  {SECTIONS_ORDER.map((g) => (
                    <optgroup key={g} label={g}>
                      {(bySectionActive[g] ?? []).map(
                        (a: Assignee | undefined) =>
                          a ? (
                            <option key={a.id} value={a.id}>
                              {formatAssigneeFullName(a)}
                            </option>
                          ) : null
                      )}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-lg font-semibold mb-2">
              Descripción del Problema
            </h4>
            <p className="text-gray-700 wrap-anywhere whitespace-pre-wrap">
              {ticket.description || '—'}
            </p>
          </div>

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
