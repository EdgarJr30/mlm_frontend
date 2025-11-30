import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';
import { useCan } from '../../../../rbac/PermissionsContext';

type AuditStatus = 'completed' | 'in_progress' | 'pending';

type AuditSession = {
  id: number;
  date: string;
  time: string;
  warehouse: string;
  itemsAudited: number;
  status: AuditStatus;
};

const SESSIONS: AuditSession[] = [
  {
    id: 1,
    date: '27/01/2025',
    time: '14:30',
    warehouse: 'OC - Químicos',
    itemsAudited: 24,
    status: 'completed',
  },
  {
    id: 2,
    date: '27/01/2025',
    time: '10:15',
    warehouse: 'OC - Vegetales',
    itemsAudited: 18,
    status: 'completed',
  },
  {
    id: 3,
    date: '26/01/2025',
    time: '16:45',
    warehouse: 'Cuarto Frío',
    itemsAudited: 12,
    status: 'pending',
  },
  {
    id: 4,
    date: '26/01/2025',
    time: '09:00',
    warehouse: 'Pasillo A',
    itemsAudited: 35,
    status: 'in_progress',
  },
  {
    id: 5,
    date: '25/01/2025',
    time: '11:30',
    warehouse: 'Pasillo B',
    itemsAudited: 28,
    status: 'completed',
  },
];

type WarehouseChip = {
  id: string;
  label: string;
};

const warehouses: WarehouseChip[] = [
  { id: 'oc-quimicos', label: 'OC - Químicos' },
  { id: 'oc-vegetales', label: 'OC - Vegetales' },
  { id: 'cuarto-frio', label: 'Cuarto Frío' },
  { id: 'pasillo-a', label: 'Pasillo A' },
  { id: 'pasillo-b', label: 'Pasillo B' },
];

export default function InventoryAuditWarehouseHistoryPage() {
  const navigate = useNavigate();

  // ✅ Solo auditores ven esta pantalla
  const canManageAudit = useCan([
    'inventory_adjustments:full_access',
    'inventory_adjustments:read',
  ]);

  if (!canManageAudit) {
    // Puedes cambiar esto por un redirect a /403 si tienes una página de error
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
        <header className="bg-blue-600 text-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                Inventario Auditoría
              </h1>
              <p className="text-sm sm:text-base mt-1 opacity-90">
                Administración de auditorías de almacenes
              </p>
            </div>

            {/* Botón para volver a la vista general de conteos */}
            <button
              type="button"
              onClick={() => navigate('/osalm/conteos_inventario')}
              className="inline-flex items-center gap-2 rounded-full bg-white/95 text-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm hover:bg-white transition"
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
            {/* Warehouses pills */}
            <div>
              <h2 className="text-xs font-semibold tracking-[0.12em] text-gray-500 mb-2">
                ALMACENES
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {warehouses.map((w, idx) => (
                  <button
                    key={w.id}
                    onClick={() => navigate(`/osalm/almacenes/${w.id}`)}
                    className={[
                      'flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm whitespace-nowrap transition-colors',
                      idx === 0
                        ? 'bg-white border-blue-500 text-blue-700 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400',
                    ].join(' ')}
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-gray-300">
                      <span className="block h-3 w-4 border-b-2 border-gray-400" />
                    </span>
                    <span className="font-medium">{w.label}</span>
                    <span className="ml-1 text-gray-400 text-base">›</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 border-b border-gray-200">
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

            {/* Sessions list */}
            <div className="mt-3 flex flex-col gap-3 sm:gap-4 pb-16">
              {SESSIONS.map((session) => (
                <AuditSessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>

          {/* Floating Action Button (para crear nueva sesión de auditoría) */}
          <div className="pointer-events-none relative">
            <button
              className="pointer-events-auto fixed md:absolute bottom-6 right-6 md:right-10 h-16 w-16 rounded-full bg-blue-600 shadow-xl flex items-center justify-center text-4xl text-white"
              aria-label="Nueva sesión de auditoría"
            >
              +
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function AuditSessionCard({ session }: { session: AuditSession }) {
  const statusConfig: Record<
    AuditStatus,
    { label: string; textColor: string; iconAccent: string; iconRing: string }
  > = {
    completed: {
      label: 'Completado',
      textColor: 'text-green-600',
      iconAccent: 'bg-green-500',
      iconRing: 'border-green-500',
    },
    in_progress: {
      label: 'En Progreso',
      textColor: 'text-blue-600',
      iconAccent: 'border-b-2 border-blue-500',
      iconRing: 'border-blue-500',
    },
    pending: {
      label: 'Pendiente',
      textColor: 'text-amber-500',
      iconAccent: 'bg-amber-400',
      iconRing: 'border-amber-400',
    },
  };

  const cfg = statusConfig[session.status];

  return (
    <article className="bg-white rounded-2xl shadow-sm px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4">
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
