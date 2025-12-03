// src/pages/osalm/conteos_inventario/auditoria/InventoryAuditWarehouseHistoryPage.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';
import { useCan } from '../../../../rbac/PermissionsContext';
import {
  getInventoryAuditSessions,
  type AuditSession,
  type AuditStatus,
} from '../../../../services/inventoryCountsService';

export default function InventoryAuditWarehousePage() {
  const navigate = useNavigate();

  // ✅ Solo auditores ven esta pantalla
  const canManageAudit = useCan([
    'inventory_adjustments:full_access',
    'inventory_adjustments:read',
  ]);

  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getInventoryAuditSessions();
        if (!isMounted) return;
        setSessions(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error cargando el historial de auditorías');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (canManageAudit) {
      void load();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [canManageAudit]);

  if (!canManageAudit) {
    return (
      <div className="h-screen flex bg-gray-100">
        <Sidebar />
        <main className="flex flex-col flex-1 h-[100dvh] bg-gray-100 overflow-hidden">
          <header className="bg-blue-600 text-white shadow-sm">
            <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                  Inventario Auditoría
                </h1>
                <p className="text-sm sm:text-base mt-1 opacity-90">
                  Acceso restringido
                </p>
              </div>
            </div>
          </header>
          <section className="flex-1 flex items-center justify-center">
            <p className="text-gray-600 text-sm sm:text-base">
              No tienes permisos para administrar las auditorías de almacenes.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />

      <main className="flex flex-col flex-1 h-[100dvh] bg-gray-100 overflow-hidden">
        {/* TOP BAR */}
        <header className="bg-blue-600 text-white shadow-sm pt-16 sm:pt-6">
          <div className="px-4 sm:px-6 lg:px-10 pb-4 sm:pb-5 flex items-center justify-between gap-4">
            {/* Títulos */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight break-words">
                Inventario Auditoría
              </h1>
              <p className="text-sm sm:text-base mt-1 opacity-90">
                Administración de auditorías de almacenes
              </p>
            </div>

            {/* Botón Volver */}
            <button
              type="button"
              onClick={() => navigate('/osalm/conteos_inventario')}
              className="inline-flex items-center gap-2 rounded-full bg-white/95 text-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm hover:bg-white transition shrink-0"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-base">
                ←
              </span>
              <span>Volver a conteos</span>
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <section className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 max-w-6xl">
            {/* Tabs */}
            <div className="mt-1 border-b border-gray-200">
              <div className="flex gap-8 text-sm font-medium">
                <button className="relative py-3 flex items-center gap-2 text-blue-600">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-blue-100">
                    <span className="h-3 w-3 rounded-sm border border-blue-500" />
                  </span>
                  <span>Sesiones</span>
                  <span className="absolute left-0 right-0 -bottom-px h-[3px] rounded-full bg-blue-600" />
                </button>

                <button className="py-3 flex items-center gap-2 text-gray-400 hover:text-gray-600">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200">
                    <span className="h-3 w-3 rounded-sm border border-gray-300" />
                  </span>
                  <span>Productos</span>
                </button>
              </div>
            </div>

            {/* Title: history */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold tracking-[0.14em] text-gray-500">
                HISTORIAL DE AUDITORÍAS POR ALMACÉN
              </h3>
            </div>

            {/* Estados de carga / error */}
            {loading && (
              <div className="mt-4 text-sm text-gray-500">
                Cargando auditorías...
              </div>
            )}

            {error && !loading && (
              <div className="mt-4 text-sm text-red-500">{error}</div>
            )}

            {/* Sessions list */}
            {!loading && !error && (
              <div className="mt-3 flex flex-col gap-3 sm:gap-4 pb-16">
                {sessions.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No hay jornadas de auditoría registradas todavía.
                  </p>
                )}

                {sessions.map((session) => (
                  <AuditSessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function AuditSessionCard({ session }: { session: AuditSession }) {
  const navigate = useNavigate();

  const statusConfig: Record<
    AuditStatus,
    { label: string; textColor: string; iconRing: string }
  > = {
    completed: {
      label: 'Completado',
      textColor: 'text-green-600',
      iconRing: 'border-green-500',
    },
    in_progress: {
      label: 'En Progreso',
      textColor: 'text-blue-600',
      iconRing: 'border-blue-500',
    },
    pending: {
      label: 'Pendiente',
      textColor: 'text-amber-500',
      iconRing: 'border-amber-400',
    },
  };

  const cfg = statusConfig[session.status];

  const handleClick = () => {
    // Usamos warehouseCode como param de ruta (ej: "OC-QUIM")
    navigate(`/osalm/conteos_inventario/auditoria/almacenes/${session.id}`);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="bg-white rounded-2xl shadow-sm px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs sm:text-sm text-gray-500 tracking-wide">
          <span className="font-medium">{session.date}</span>
          <span className="mx-2">•</span>
          <span>{session.time}</span>
        </p>
        <h4 className="text-lg sm:text-xl font-semibold text-gray-900">
          {session.warehouse}
        </h4>
        <p className="text-sm text-gray-500">
          {session.itemsAudited} items auditados
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 min-w-[110px]">
        <div
          className={[
            'flex items-center justify-center h-10 w-10 rounded-full border-2 bg-white',
            cfg.iconRing,
          ].join(' ')}
        >
          {session.status === 'completed' && (
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white text-xl leading-none">
              ✓
            </span>
          )}

          {session.status === 'pending' && (
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-400 text-white text-xl leading-none">
              ⏱
            </span>
          )}

          {session.status === 'in_progress' && (
            <span className="flex items-center justify-center h-5 w-5 rounded-full border-2 border-blue-500">
              <span className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </span>
          )}
        </div>
        <span className={['text-sm font-medium mt-1', cfg.textColor].join(' ')}>
          {cfg.label}
        </span>
      </div>
    </article>
  );
}
