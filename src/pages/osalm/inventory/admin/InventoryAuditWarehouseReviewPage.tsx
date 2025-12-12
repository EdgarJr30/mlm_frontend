import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';
import { useCan } from '../../../../rbac/PermissionsContext';
import {
  getInventoryAuditById,
  saveWarehouseAuditChanges,
  type AuditStatus,
  type ItemStatus,
  type AuditItem,
  type WarehouseInfo,
} from '../../../../services/inventoryCountsService';
import type { PendingReasonCode } from '../../../../types/inventory';
import { InventoryAuditExportButton } from './InventoryAuditExportButton';
import { showToastError, showToastSuccess } from '../../../../notifications';

type FilterTab = 'all' | ItemStatus;

const PAGE_SIZE = 50;

// Helper seguro para extraer mensajes de error
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const anyErr = err as {
      message?: string;
      error_description?: string;
      error?: string;
      code?: string;
    };
    return (
      anyErr.message ??
      anyErr.error_description ??
      anyErr.error ??
      anyErr.code ??
      'Ocurrió un error'
    );
  }
  return 'Ocurrió un error';
}

export default function InventoryWarehouseAuditReviewPage() {
  const navigate = useNavigate();
  const { inventoryCountId } = useParams<{ inventoryCountId: string }>();

  // ✅ Solo auditores ven esta pantalla
  const canManageAudit = useCan([
    'inventory_adjustments:full_access',
    'inventory_adjustments:read',
  ]);

  const [warehouse, setWarehouse] = useState<WarehouseInfo | null>(null);
  const [auditStatus, setAuditStatus] = useState<AuditStatus>('in_progress');
  const [items, setItems] = useState<AuditItem[]>([]);
  const [inventoryCountIdState, setInventoryCountIdState] = useState<
    number | null
  >(null);
  const [isClosedFromDb, setIsClosedFromDb] = useState(false);

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [currentPage, setCurrentPage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReadOnly = isClosedFromDb;

  // Carga de datos inicial
  useEffect(() => {
    if (!canManageAudit) {
      setLoading(false);
      showToastError(
        'No tienes permisos para administrar las auditorías de almacenes.'
      );
      return;
    }

    let isMounted = true;

    async function load() {
      if (!inventoryCountId) {
        const msg = 'No se encontró el id de la jornada en la URL.';
        setError(msg);
        showToastError(msg);
        setLoading(false);
        return;
      }

      const numericId = Number(inventoryCountId);
      if (Number.isNaN(numericId)) {
        const msg = 'El id de la jornada no es válido.';
        setError(msg);
        showToastError(msg);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getInventoryAuditById(numericId);

        if (!isMounted) return;

        setWarehouse(data.warehouse);
        setAuditStatus(data.auditStatus);
        setItems(data.items);
        setInventoryCountIdState(data.inventoryCountId);
        setIsClosedFromDb(data.auditStatus === 'completed');
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = extractErrorMessage(err);
        setError(msg);
        showToastError(`Error cargando la auditoría del almacén: ${msg}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [canManageAudit, inventoryCountId]);

  // Reset página cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilter]);

  // Filtrado de items
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return items;
    return items.filter((item) => item.status === activeFilter);
  }, [items, activeFilter]);

  // Paginación
  const totalItemsForFilter = filteredItems.length;
  const totalPages =
    totalItemsForFilter === 0 ? 1 : Math.ceil(totalItemsForFilter / PAGE_SIZE);

  const paginatedItems = useMemo(() => {
    const safePage =
      currentPage >= totalPages ? totalPages - 1 : Math.max(currentPage, 0);
    const from = safePage * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    return filteredItems.slice(from, to);
  }, [filteredItems, currentPage, totalPages]);

  const currentRange = useMemo(() => {
    if (totalItemsForFilter === 0) {
      return { from: 0, to: 0 };
    }
    const from = currentPage * PAGE_SIZE + 1;
    const to = Math.min((currentPage + 1) * PAGE_SIZE, totalItemsForFilter);
    return { from, to };
  }, [currentPage, totalItemsForFilter]);

  // Estadísticas de items (sobre todo el universo)
  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((i) => i.status === 'pending').length,
      counted: items.filter((i) => i.status === 'counted').length,
      recount: items.filter((i) => i.status === 'recount').length,
    }),
    [items]
  );

  // Cambiar estado de la auditoría (para mostrar toast cuando se marca como completada)
  const handleChangeAuditStatus = (nextStatus: AuditStatus) => {
    if (isReadOnly) return;

    setAuditStatus(nextStatus);

    if (nextStatus === 'completed') {
      showToastSuccess(
        'La auditoría se ha marcado como Completada. No olvides guardar los cambios para cerrar el almacén.'
      );
    }
  };

  // Cambiar estado de un item
  const handleChangeItemStatus = (id: number, status: ItemStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  // Cambiar comentario de un item
  const handleChangeItemComment = (id: number, comment: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, comment } : item))
    );
  };

  // Cambiar cantidad contada de un item
  const handleChangeItemQty = (id: number, countedQty: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, countedQty } : item))
    );
  };

  // Guardar cambios
  const handleSaveChanges = async () => {
    if (isReadOnly) {
      showToastError(
        'Este conteo ya está cerrado; no se pueden guardar cambios.'
      );
      return;
    }

    if (!inventoryCountIdState) {
      showToastError(
        'No hay una jornada de inventario asociada a este almacén. No se pueden guardar cambios.'
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveWarehouseAuditChanges({
        inventoryCountId: inventoryCountIdState,
        auditStatus,
        items,
      });

      const successMsg =
        auditStatus === 'completed'
          ? 'Cambios guardados y auditoría marcada como Completada.'
          : 'Cambios de la auditoría guardados correctamente.';

      showToastSuccess(successMsg);
    } catch (err: unknown) {
      const baseMsg = extractErrorMessage(err);
      setError(baseMsg);
      showToastError(`Error al guardar cambios: ${baseMsg}`);
    } finally {
      setSaving(false);
    }
  };

  // Cambiar UoM de un item
  const handleChangeItemUom = (id: number, uomId: number, uomCode: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, uomId, uom: uomCode } : item
      )
    );
  };

  // Renderizado principal
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
          <div className="px-4 sm:px-6 lg:px-10 pb-4 sm:pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 max-w-6xl mx-auto w-full">
            {/* Título y descripción */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/80">
                Auditoría de inventario
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold leading-tight break-words">
                {warehouse
                  ? warehouse.isArea && warehouse.areaName
                    ? `${warehouse.name} · ${warehouse.areaName}`
                    : warehouse.name
                  : 'Almacén'}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-blue-50/90 max-w-xl">
                Revisión de artículos pendientes, contados y para reconteo.
              </p>
            </div>

            {/* Estado de auditoría + acciones */}
            <div className="flex flex-col items-stretch sm:items-end gap-3 sm:gap-4">
              {/* Selector de estado de la auditoría */}
              <AuditStatusSelector
                status={auditStatus}
                onChange={handleChangeAuditStatus}
                readOnly={isReadOnly}
              />

              {/* Botones de acciones (Exportar + Volver) */}
              <div className="flex sm:flex-row gap-2 w-full sm:w-auto">
                <InventoryAuditExportButton
                  warehouse={warehouse}
                  items={items}
                  inventoryCountId={inventoryCountIdState}
                  disabled={loading || inventoryCountIdState == null}
                />

                <button
                  type="button"
                  onClick={() =>
                    navigate('/osalm/conteos_inventario/auditoria/almacenes')
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/95 text-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm hover:bg-white transition shrink-0"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-base">
                    ←
                  </span>
                  <span className="whitespace-nowrap">Volver a auditorías</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <section className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 max-w-6xl mx-auto w-full">
            {loading && (
              <p className="text-sm text-gray-500">Cargando auditoría...</p>
            )}

            {error && !loading && (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            )}

            {!loading && !error && inventoryCountIdState == null && (
              <p className="text-sm text-gray-500 mb-4">
                No existe ninguna jornada de inventario registrada para este
                almacén.
              </p>
            )}

            {!loading && !error && inventoryCountIdState != null && (
              <>
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
                  <div className="w-full sm:w-auto overflow-x-auto">
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
                </div>

                {/* Listado de items */}
                <div className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[720px]">
                      <div className="border-b border-gray-100 px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-500 flex">
                        <div className="w-24 sm:w-28">SKU</div>
                        <div className="flex-1">Artículo</div>
                        <div className="w-20 sm:w-24 text-right">Contado</div>
                        <div className="w-24 sm:w-28 text-center">Estado</div>
                        <div className="hidden sm:block w-40 text-center">
                          Motivo
                        </div>
                        <div className="hidden sm:block w-56">Comentario</div>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {paginatedItems.length === 0 && (
                          <div className="px-4 sm:px-6 py-6 text-center text-sm text-gray-500">
                            No hay artículos para este filtro.
                          </div>
                        )}

                        {paginatedItems.map((item) => (
                          <AuditItemRow
                            key={item.id}
                            item={item}
                            onChangeStatus={handleChangeItemStatus}
                            onChangeComment={handleChangeItemComment}
                            onChangeCountedQty={handleChangeItemQty}
                            onChangeUom={handleChangeItemUom}
                            readOnly={isReadOnly}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Paginador */}
                  {totalItemsForFilter > PAGE_SIZE && (
                    <div className="border-t border-gray-100 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-gray-600">
                      <span>
                        Mostrando{' '}
                        <span className="font-semibold">
                          {currentRange.from}
                        </span>{' '}
                        –{' '}
                        <span className="font-semibold">{currentRange.to}</span>{' '}
                        de{' '}
                        <span className="font-semibold">
                          {totalItemsForFilter}
                        </span>{' '}
                        artículos
                      </span>
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(p - 1, 0))
                          }
                          disabled={currentPage === 0}
                          className="px-3 py-1 rounded-full border border-gray-200 bg-white text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Anterior
                        </button>
                        <span className="text-xs sm:text-sm text-gray-500">
                          Página{' '}
                          <span className="font-semibold">
                            {currentPage + 1}
                          </span>{' '}
                          de <span className="font-semibold">{totalPages}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage((p) =>
                              p + 1 >= totalPages ? p : p + 1
                            )
                          }
                          disabled={currentPage + 1 >= totalPages}
                          className="px-3 py-1 rounded-full border border-gray-200 bg-white text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer de acciones */}
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Revisa los artículos y actualiza su estado. Luego marca el
                    almacén como{' '}
                    <span className="font-semibold">Completado</span> cuando la
                    auditoría esté cerrada.
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
                      disabled={saving || isReadOnly}
                      className="px-5 py-2 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isReadOnly
                        ? 'Conteo cerrado'
                        : saving
                        ? 'Guardando...'
                        : auditStatus === 'completed'
                        ? 'Guardar y cerrar'
                        : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </>
            )}
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
  readOnly?: boolean;
}) {
  const { status, onChange, readOnly } = props;

  const buttonBase =
    'px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition flex items-center gap-1.5';

  return (
    <div className="inline-flex rounded-full bg-blue-500/20 p-1 backdrop-blur text-xs sm:text-sm">
      <button
        type="button"
        onClick={() => !readOnly && onChange('pending')}
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
        onClick={() => !readOnly && onChange('in_progress')}
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
        onClick={() => !readOnly && onChange('completed')}
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
  onChangeCountedQty: (id: number, countedQty: number) => void;
  onChangeUom: (id: number, uomId: number, uomCode: string) => void;
  readOnly?: boolean;
}) {
  const {
    item,
    onChangeStatus,
    onChangeComment,
    onChangeCountedQty,
    onChangeUom,
    readOnly,
  } = props;

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

  const pendingReasonLabel: Record<PendingReasonCode, string> = {
    UOM_DIFFERENT: 'UoM diferente / revisar',
    REVIEW: 'Revisión posterior',
  };

  const motiveInfo = item.pendingReasonCode
    ? {
        label: pendingReasonLabel[item.pendingReasonCode],
        toneClasses:
          item.status === 'pending'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-gray-50 text-gray-500 border-gray-200',
      }
    : null;

  return (
    <div className="px-4 sm:px-6 py-3 text-xs sm:text-sm flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Info principal */}
      <div className="flex-1 flex items-start gap-3 sm:gap-4">
        <div className="w-24 sm:w-28 font-mono text-gray-700">{item.sku}</div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{item.name}</p>
          {readOnly ||
          !item.availableUoms ||
          item.availableUoms.length === 0 ? (
            <p className="text-[11px] sm:text-xs text-gray-500">
              UoM: {item.uom}
            </p>
          ) : (
            <div className="mt-1 inline-flex items-center gap-2">
              <span className="text-[11px] text-gray-400">UoM:</span>
              <select
                value={item.uomId}
                onChange={(e) => {
                  const newUomId = Number(e.target.value);
                  const selected = item.availableUoms?.find(
                    (u) => u.id === newUomId
                  );
                  if (!selected) return;
                  onChangeUom(item.id, selected.id, selected.code);
                }}
                className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              >
                {item.availableUoms?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} — {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* En móviles mostramos el motivo debajo del nombre */}
          {motiveInfo && (
            <div className="mt-1 inline-flex sm:hidden items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] text-gray-600 bg-gray-50">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span>{motiveInfo.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cantidad, estado, motivo, comentario */}
      <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-between sm:justify-end flex-1">
        {/* Cantidad contada */}
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
            Contado
          </p>

          {item.status === 'recount' && !readOnly ? (
            <div className="inline-flex items-center justify-end gap-1">
              <input
                type="number"
                inputMode="decimal"
                step="0.0001"
                min={0}
                value={
                  Number.isNaN(Number(item.countedQty))
                    ? ''
                    : String(item.countedQty)
                }
                onChange={(e) => {
                  const value = e.target.value.replace(',', '.');
                  const numeric = value === '' ? 0 : Number(value);
                  if (Number.isNaN(numeric)) return;
                  onChangeCountedQty(item.id, numeric);
                }}
                className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-1 text-right text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
              <span className="text-[11px] text-gray-400 ml-1">{item.uom}</span>
            </div>
          ) : (
            <p className="font-semibold text-gray-800">
              {item.countedQty.toLocaleString('es-DO')}
            </p>
          )}
        </div>

        {/* Selector de estado */}
        <div className="w-24 sm:w-28">
          <select
            value={item.status}
            onChange={(e) =>
              onChangeStatus(item.id, e.target.value as ItemStatus)
            }
            disabled={readOnly}
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

        {/* Motivo pendiente (solo en desktop en su propia columna) */}
        <div className="hidden sm:block w-40 text-center">
          {motiveInfo ? (
            <div
              className={[
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px]',
                motiveInfo.toneClasses,
              ].join(' ')}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="font-medium">{motiveInfo.label}</span>
            </div>
          ) : (
            <span className="text-[11px] text-gray-400">—</span>
          )}
        </div>

        {/* Comentario */}
        <div className="w-full sm:w-56">
          <textarea
            value={item.comment ?? ''}
            onChange={(e) => onChangeComment(item.id, e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
            placeholder="Comentario del auditor (opcional)…"
          />
        </div>
      </div>
    </div>
  );
}
