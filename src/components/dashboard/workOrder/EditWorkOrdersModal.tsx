import React, { useState, useEffect } from 'react';
import type { Ticket } from '../../../types/Ticket';
import { useAssignees } from '../../../context/AssigneeContext';
import { LOCATIONS } from '../../../constants/locations';
import { STATUSES } from '../../../constants/const_ticket';
import {
  getTicketImagePaths,
  getPublicImageUrl,
} from '../../../services/storageService';
import { MAX_COMMENTS_LENGTH } from '../../../utils/validators';
import { formatAssigneeFullName } from '../../../services/assigneeService';
import type { Assignee } from '../../../types/Assignee';

// 👇 NUEVO: permisos
import { useCan } from '../../../rbac/PermissionsContext';

interface EditWorkOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onSave: (ticket: Ticket) => void;
  showFullImage: boolean;
  setShowFullImage: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EditWorkOrdersModal({
  onClose,
  ticket,
  onSave,
  // showFullImage,
  setShowFullImage,
}: EditWorkOrdersModalProps) {
  const [edited, setEdited] = useState<Ticket>(ticket);
  const [fullImageIdx, setFullImageIdx] = useState<number | null>(null);
  const { loading: loadingAssignees, bySectionActive } = useAssignees();
  const SECTIONS_ORDER: Array<
    'SIN ASIGNAR' | 'Internos' | 'TERCEROS' | 'OTROS'
  > = ['SIN ASIGNAR', 'Internos', 'TERCEROS', 'OTROS'];

  // 👇 NUEVO: flags de permisos
  const canFullAccess = useCan('work_orders:full_access');
  // Si necesitas mostrar/ocultar botones de negocio en este modal (no están en tu UI actual):
  // const canCancel  = useCan('work_orders:cancel');
  // const canDelete  = useCan('work_orders:delete');

  // bloquea edición si no hay full_access
  const isReadOnly = !canFullAccess;
  const addDisabledCls = (base = '') =>
    base + (isReadOnly ? ' opacity-50 cursor-not-allowed bg-gray-100' : '');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFullImage(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowFullImage]);

  useEffect(() => {
    setEdited(ticket);
  }, [ticket]);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (isReadOnly) return; // 👈 doble blindaje en UI
    const { name, type, value } = e.target;
    if (type === 'checkbox') {
      setEdited({ ...edited, [name]: (e.target as HTMLInputElement).checked });
      return;
    }
    if (name === 'assignee_id') {
      setEdited({ ...edited, assignee_id: Number(value) });
      return;
    }
    if (name === 'deadline_date') {
      setEdited({
        ...edited,
        deadline_date: value?.trim() ? value : undefined,
      });
      return;
    }
    setEdited({ ...edited, [name]: value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canFullAccess) return; // 👈 evita submit sin permiso
    onSave(edited);
    onClose();
  };

  if (!ticket) return null;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: ID, Título, Fecha incidente, Descripción, Comentarios */}
        <div className="flex flex-col gap-4">
          {/* Ticket ID */}
          <div>
            <label className="block text-sm font-medium">ID</label>
            <input
              name="id"
              value={edited.id}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium">Título</label>
            <input
              name="title"
              value={edited.title}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          {/* Fecha del incidente */}
          <div>
            <label className="block text-sm font-medium">
              Fecha del Incidente
            </label>
            <input
              type="text"
              name="incident_date"
              value={edited.incident_date}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium">Descripción</label>
            <textarea
              name="description"
              value={edited.description}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800 min-h-[100px] max-h-[150px] resize-y"
            />
          </div>

          {/* Comentarios */}
          <div>
            <label className="block text-sm font-medium">Comentarios</label>
            <textarea
              name="comments"
              maxLength={MAX_COMMENTS_LENGTH}
              value={edited.comments || ''}
              onChange={handleChange}
              placeholder="Agrega un comentario..."
              rows={3}
              disabled={isReadOnly}
              className={addDisabledCls(
                'mt-1 p-2 w-full border rounded min-h-[100px] max-h-[150px] resize-y'
              )}
            />
          </div>
        </div>

        {/* Columna 2: Solicitante, Email, Teléfono, Ubicación */}
        <div className="flex flex-col gap-4">
          {/* Solicitante */}
          <div>
            <label className="block text-sm font-medium">Solicitante</label>
            <input
              name="requester"
              value={edited.requester || ''}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              name="email"
              value={edited.email || ''}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium">Teléfono</label>
            <input
              name="telephone"
              value={edited.phone || ''}
              readOnly
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            />
          </div>

          {/* Ubicación (ya estaba deshabilitado; lo dejamos así) */}
          <div>
            <label className="block text-sm font-medium">Ubicación</label>
            <select
              name="location"
              value={edited.location || ''}
              disabled
              className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-800"
            >
              <option value="" disabled>
                Selecciona una ubicación
              </option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Columna 3: Responsable, Prioridad, Estatus, Fecha entrega */}
        <div className="flex flex-col gap-4">
          {/* Responsable */}
          <div>
            <label className="block text-sm font-medium">Responsable</label>
            <select
              name="assignee_id"
              value={edited.assignee_id || ''}
              onChange={handleChange}
              className={addDisabledCls(
                'mt-1 p-2 w-full border rounded cursor-pointer'
              )}
              disabled={loadingAssignees || isReadOnly}
            >
              {SECTIONS_ORDER.map((grupo) => (
                <optgroup key={grupo} label={grupo}>
                  {(bySectionActive[grupo] ?? []).map(
                    (assignee: Assignee | undefined) =>
                      assignee ? (
                        <option key={assignee.id} value={assignee.id}>
                          {formatAssigneeFullName(assignee)}
                        </option>
                      ) : null
                  )}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium">Prioridad</label>
            <select
              name="priority"
              value={edited.priority}
              onChange={handleChange}
              className={addDisabledCls(
                'mt-1 p-2 w-full border rounded cursor-pointer'
              )}
              disabled={isReadOnly}
            >
              <option value="baja">🔻 Baja</option>
              <option value="media">🔸 Media</option>
              <option value="alta">🔺 Alta</option>
            </select>
          </div>

          {/* Estatus */}
          <div>
            <label className="block text-sm font-medium">Estatus</label>
            <select
              name="status"
              value={edited.status}
              onChange={handleChange}
              className={addDisabledCls(
                'mt-1 p-2 w-full border rounded cursor-pointer'
              )}
              disabled={isReadOnly}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha estimada de entrega (deadline_date) */}
          <div>
            <label className="block text-sm font-medium">
              Fecha estimada de entrega
            </label>
            <input
              type="date"
              name="deadline_date"
              value={edited.deadline_date ?? ''}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 10)}
              disabled={isReadOnly}
              className={addDisabledCls(
                'mt-1 p-2 w-full border rounded text-gray-800'
              )}
            />
          </div>

          {/* IMÁGENES DEL TICKET */}
          {ticket.image &&
            (() => {
              const imagePaths = getTicketImagePaths(ticket.image ?? '[]');
              if (imagePaths.length === 0) return null;
              return (
                <div className="flex gap-2 flex-wrap my-2">
                  {imagePaths.map((path, idx) => (
                    <img
                      key={idx}
                      src={getPublicImageUrl(path)}
                      alt={`Adjunto ${idx + 1}`}
                      className="w-20 h-20 object-contain rounded cursor-pointer border bg-gray-100 hover:scale-105 transition"
                      onClick={() => setFullImageIdx(idx)}
                    />
                  ))}
                </div>
              );
            })()}

          {/* Urgente? */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_urgent"
                checked={edited.is_urgent || false}
                onChange={handleChange}
                disabled={isReadOnly}
                className={
                  'h-4 w-4 text-red-600 border-gray-300 rounded cursor-pointer' +
                  (isReadOnly ? ' opacity-50 cursor-not-allowed' : '')
                }
              />
              <label className="text-sm font-medium text-red-700">
                🚨 Urgente
              </label>
            </div>
          </div>
        </div>
      </div>

      {fullImageIdx !== null &&
        (() => {
          const imagePaths = getTicketImagePaths(ticket.image ?? '[]');
          const path = imagePaths[fullImageIdx];
          if (!path) return null;
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20"
              onClick={() => setFullImageIdx(null)}
            >
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setFullImageIdx(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-gray-800 shadow-lg flex items-center justify-center transition-all duration-200 hover:bg-white hover:text-red-500 cursor-pointer"
                  aria-label="Cerrar"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <img
                  src={getPublicImageUrl(path)}
                  alt="Vista ampliada"
                  className="max-w-full max-h-[80vh] rounded shadow-lg"
                />
                {/* Flechas para navegar entre imágenes */}
                {imagePaths.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full"
                      onClick={() =>
                        setFullImageIdx((prev) =>
                          prev! > 0 ? prev! - 1 : imagePaths.length - 1
                        )
                      }
                      type="button"
                    >
                      ◀️
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full"
                      onClick={() =>
                        setFullImageIdx((prev) =>
                          prev! < imagePaths.length - 1 ? prev! + 1 : 0
                        )
                      }
                      type="button"
                    >
                      ▶️
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}

      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 cursor-pointer"
        >
          Cancelar
        </button>

        {/* Guardar: deshabilitado si no tiene full_access */}
        <button
          type="submit"
          disabled={!canFullAccess}
          title={!canFullAccess ? 'No tienes permiso para editar' : undefined}
          className={
            'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer' +
            (!canFullAccess ? ' opacity-50 cursor-not-allowed' : '')
          }
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
}
