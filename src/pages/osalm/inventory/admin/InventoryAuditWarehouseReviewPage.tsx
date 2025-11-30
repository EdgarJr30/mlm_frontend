// src/pages/osalm/conteos_inventario/auditoria/WarehouseAuditReviewPage.tsx

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';
import { useCan } from '../../../../rbac/PermissionsContext';

type AuditStatus = 'completed' | 'in_progress' | 'pending';

type ItemStatus = 'pending' | 'counted' | 'recount';

type AuditItem = {
  id: number;
  sku: string;
  name: string;
  uom: string;
  countedQty: number;
  systemQty: number;
  status: ItemStatus;
  comment?: string;
};

type WarehouseInfo = {
  id: string; // warehouseId (slug)
  name: string;
};

// 🔹 Mock de almacenes (puedes sustituir luego por datos reales)
const MOCK_WAREHOUSES: WarehouseInfo[] = [
  { id: 'oc-quimicos', name: 'OC - Químicos' },
  { id: 'oc-vegetales', name: 'OC - Vegetales' },
  { id: 'cuarto-frio', name: 'Cuarto Frío' },
  { id: 'pasillo-a', name: 'Pasillo A' },
  { id: 'pasillo-b', name: 'Pasillo B' },
];

// 🔹 Mock de items auditados (por ahora no se filtra por almacén)
const MOCK_ITEMS: AuditItem[] = [
  {
    id: 1,
    sku: 'A000001',
    name: 'Harina 25 LB',
    uom: 'ENV. 25 LB.',
    countedQty: 120,
    systemQty: 120,
    status: 'counted',
  },
  {
    id: 2,
    sku: 'A000002',
    name: 'Azúcar Granel',
    uom: 'LIBRAS',
    countedQty: 180,
    systemQty: 200,
    status: 'recount',
    comment: 'Diferencia de 20 lb, pendiente reconteo.',
  },
  {
    id: 3,
    sku: 'A000003',
    name: 'Aceite Vegetal 1L',
    uom: 'UND',
    countedQty: 0,
    systemQty: 12,
    status: 'pending',
    comment: 'Producto no localizado en el pasillo.',
  },
  {
    id: 4,
    sku: 'A000004',
    name: 'Sal Refinada',
    uom: 'SACO 50 LB',
    countedQty: 24,
    systemQty: 24,
    status: 'counted',
  },
];

type FilterTab = 'all' | ItemStatus;

export default function WarehouseAuditReviewPage() {
  const navigate = useNavigate();
  const { warehouseId } = useParams<{ warehouseId: string }>();

  // ✅ Solo auditores ven esta pantalla
  const canManageAudit = useCan([
    'inventory_adjustments:full_access',
    'inventory_adjustments:read',
  ]);

  const warehouse = useMemo<WarehouseInfo | undefined>(
    () => MOCK_WAREHOUSES.find((w) => w.id === warehouseId),
    [warehouseId]
  );

  // Estado del almacén (estatus general de la auditoría)
  const [auditStatus, setAuditStatus] = useState<AuditStatus>('in_progress');

  // Estado de items (en producción los traerías de la API)
  const [items, setItems] = useState<AuditItem[]>(MOCK_ITEMS);

  // Filtro de vista (todos / pendientes / contados / recontar)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return items;
    return items.filter((item) => item.status === activeFilter);
  }, [items, activeFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((i) => i.status === 'pending').length,
      counted: items.filter((i) => i.status === 'counted').length,
      recount: items.filter((i) => i.status === 'recount').length,
    }),
    [items]
  );

  const handleChangeItemStatus = (id: number, status: ItemStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleChangeItemComment = (id: number, comment: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, comment } : item))
    );
  };

  const handleSaveChanges = () => {
    // Aquí luego conectarás con Supabase / API
    // Por ahora solo mostramos en consola
    // eslint-disable-next-line no-console
    console.log('Guardar auditoría:', {
      warehouseId,
      auditStatus,
      items,
    });
    // Podrías mostrar un toast o SweetAlert en el futuro
  };

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
        <header className="bg-blue-600 text-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.16em] text-blue-100/90">
                Auditoría de almacén
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {warehouse?.name ?? 'Almacén'}
              </h1>
              <p className="text-sm sm:text-base mt-1 opacity-90">
                Revisión de artículos pendientes, contados y para reconteo.
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              {/* Selector de estado de la auditoría */}
              <AuditStatusSelector
                status={auditStatus}
                onChange={setAuditStatus}
              />

              {/* Volver */}
              <button
                type="button"
                onClick={() =>
                  navigate('/osalm/conteos_inventario/auditoria/almacenes')
                }
                className="inline-flex items-center gap-2 rounded-full bg-white/95 text-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm hover:bg-white transition"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-base">
                  ←
                </span>
                <span>Volver a auditorías</span>
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <section className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 max-w-6xl">
            {/* Resumen y filtros */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Resumen */}
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                <SummaryPill label="Total" value={stats.total} />
                <SummaryPill
                  label="Pendientes"
                  value={stats.pending}
                  tone="warning"
                />
                <SummaryPill
                  label="Contados"
                  value={stats.counted}
                  tone="success"
                />
                <SummaryPill
                  label="Recontar"
                  value={stats.recount}
                  tone="info"
                />
              </div>

              {/* Filtros por estado de item */}
              <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs sm:text-sm font-medium">
                <FilterChip
                  label="Todos"
                  active={activeFilter === 'all'}
                  onClick={() => setActiveFilter('all')}
                />
                <FilterChip
                  label="Pendientes"
                  active={activeFilter === 'pending'}
                  tone="warning"
                  onClick={() => setActiveFilter('pending')}
                />
                <FilterChip
                  label="Contados"
                  active={activeFilter === 'counted'}
                  tone="success"
                  onClick={() => setActiveFilter('counted')}
                />
                <FilterChip
                  label="Recontar"
                  active={activeFilter === 'recount'}
                  tone="info"
                  onClick={() => setActiveFilter('recount')}
                />
              </div>
            </div>

            {/* Listado de items */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-500 flex">
                <div className="w-24 sm:w-28">SKU</div>
                <div className="flex-1">Artículo</div>
                <div className="w-20 sm:w-24 text-right">Sistema</div>
                <div className="w-20 sm:w-24 text-right">Contado</div>
                <div className="w-24 sm:w-28 text-center">Estado</div>
                <div className="hidden sm:block w-56">Comentario</div>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredItems.length === 0 && (
                  <div className="px-4 sm:px-6 py-6 text-center text-sm text-gray-500">
                    No hay artículos para este filtro.
                  </div>
                )}

                {filteredItems.map((item) => (
                  <AuditItemRow
                    key={item.id}
                    item={item}
                    onChangeStatus={handleChangeItemStatus}
                    onChangeComment={handleChangeItemComment}
                  />
                ))}
              </div>
            </div>

            {/* Footer de acciones */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-500">
                Revisa los artículos y actualiza su estado. Luego marca el
                almacén como <span className="font-semibold">Completado</span>{' '}
                cuando la auditoría esté cerrada.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="px-5 py-2 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-blue-700"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// ======================
// SUBCOMPONENTES
// ======================

function AuditStatusSelector(props: {
  status: AuditStatus;
  onChange: (status: AuditStatus) => void;
}) {
  const { status, onChange } = props;

  const buttonBase =
    'px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition flex items-center gap-1.5';

  return (
    <div className="inline-flex rounded-full bg-blue-500/20 p-1 backdrop-blur text-xs sm:text-sm">
      <button
        type="button"
        onClick={() => onChange('pending')}
        className={[
          buttonBase,
          status === 'pending'
            ? 'bg-white text-amber-600 border-amber-400 shadow-sm'
            : 'border-transparent text-blue-50/80 hover:bg-blue-500/40',
        ].join(' ')}
      >
        <span className="text-lg">⏱</span>
        <span>Pendiente</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('in_progress')}
        className={[
          buttonBase,
          status === 'in_progress'
            ? 'bg-white text-blue-600 border-blue-400 shadow-sm'
            : 'border-transparent text-blue-50/80 hover:bg-blue-500/40',
        ].join(' ')}
      >
        <span className="text-lg">🔄</span>
        <span>En progreso</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('completed')}
        className={[
          buttonBase,
          status === 'completed'
            ? 'bg-white text-green-600 border-green-400 shadow-sm'
            : 'border-transparent text-blue-50/80 hover:bg-blue-500/40',
        ].join(' ')}
      >
        <span className="text-lg">✅</span>
        <span>Completado</span>
      </button>
    </div>
  );
}

function SummaryPill(props: {
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'warning' | 'info';
}) {
  const { label, value, tone = 'default' } = props;

  const tones: Record<
    NonNullable<typeof tone>,
    { bg: string; text: string }
  > = {
    default: { bg: 'bg-gray-100', text: 'text-gray-700' },
    success: { bg: 'bg-green-50', text: 'text-green-700' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700' },
    info: { bg: 'bg-blue-50', text: 'text-blue-700' },
  };

  const cfg = tones[tone];

  return (
    <div
      className={[
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        cfg.bg,
      ].join(' ')}
    >
      <span className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
        {label}
      </span>
      <span className={['text-sm font-semibold', cfg.text].join(' ')}>
        {value}
      </span>
    </div>
  );
}

function FilterChip(props: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: 'default' | 'success' | 'warning' | 'info';
}) {
  const { label, active, onClick, tone = 'default' } = props;

  const tones: Record<
    NonNullable<typeof tone>,
    { active: string; inactive: string }
  > = {
    default: {
      active: 'bg-white text-gray-900',
      inactive: 'text-gray-500',
    },
    success: {
      active: 'bg-green-500 text-white',
      inactive: 'text-green-700',
    },
    warning: {
      active: 'bg-amber-400 text-white',
      inactive: 'text-amber-700',
    },
    info: {
      active: 'bg-blue-500 text-white',
      inactive: 'text-blue-700',
    },
  };

  const cfg = tones[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-1 rounded-full mx-0.5',
        active ? cfg.active : cfg.inactive,
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function AuditItemRow(props: {
  item: AuditItem;
  onChangeStatus: (id: number, status: ItemStatus) => void;
  onChangeComment: (id: number, comment: string) => void;
}) {
  const { item, onChangeStatus, onChangeComment } = props;

  const statusLabel: Record<ItemStatus, string> = {
    pending: 'Pendiente',
    counted: 'Contado',
    recount: 'Recontar',
  };

  const statusClass: Record<ItemStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    counted: 'bg-green-50 text-green-700 border-green-200',
    recount: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const diff = item.countedQty - item.systemQty;
  const hasDiff = diff !== 0;

  return (
    <div className="px-4 sm:px-6 py-3 text-xs sm:text-sm flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Info principal */}
      <div className="flex-1 flex items-start gap-3 sm:gap-4">
        <div className="w-24 sm:w-28 font-mono text-gray-700">{item.sku}</div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{item.name}</p>
          <p className="text-[11px] sm:text-xs text-gray-500">
            UoM: {item.uom}
          </p>
          <p
            className={[
              'text-[11px] sm:text-xs mt-1',
              hasDiff ? 'text-amber-600' : 'text-gray-400',
            ].join(' ')}
          >
            Diferencia:{' '}
            <span className="font-semibold">
              {diff > 0 ? `+${diff}` : diff}
            </span>
          </p>
        </div>
      </div>

      {/* Cantidades & estado */}
      <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-between sm:justify-end flex-1">
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
            Sistema
          </p>
          <p className="font-semibold text-gray-800">
            {item.systemQty.toLocaleString('es-DO')}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
            Contado
          </p>
          <p className="font-semibold text-gray-800">
            {item.countedQty.toLocaleString('es-DO')}
          </p>
        </div>

        {/* Selector de estado */}
        <div className="w-24 sm:w-28">
          <select
            value={item.status}
            onChange={(e) =>
              onChangeStatus(item.id, e.target.value as ItemStatus)
            }
            className={[
              'w-full rounded-full border px-2 py-1 text-xs sm:text-sm font-medium',
              statusClass[item.status],
            ].join(' ')}
          >
            <option value="pending">{statusLabel.pending}</option>
            <option value="counted">{statusLabel.counted}</option>
            <option value="recount">{statusLabel.recount}</option>
          </select>
        </div>

        {/* Comentario (en móvil ocupa ancho completo) */}
        <div className="w-full sm:w-56">
          <textarea
            value={item.comment ?? ''}
            onChange={(e) => onChangeComment(item.id, e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
            placeholder="Comentario del auditor (opcional)…"
          />
        </div>
      </div>
    </div>
  );
}
