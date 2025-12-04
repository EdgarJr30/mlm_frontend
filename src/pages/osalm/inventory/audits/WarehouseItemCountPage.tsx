import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';
import {
  NewWarehouseAuditForm,
  type WarehouseItemCountPayload,
  type SelectedProductForAudit,
} from './WarehouseItemCountForm';
import {
  getActiveWarehouses,
  getWarehouseItemBySku,
  type WarehouseStockItem,
} from '../../../../services/inventoryService';
import { registerInventoryOperation } from '../../../../services/inventoryCountsService';

type RouteParams = {
  warehouseId: string; // aquí usas el code desde BD: "OC-QUIM", etc.
  itemId: string; // SKU: "A000001"
};

type WarehouseHeader = {
  id: string; // lo guardamos como string para el form
  code: string;
  name: string;
};

type LocationState =
  | {
      area?: { id: string; name: string };
    }
  | undefined;

export default function WarehouseItemCountPage() {
  const navigate = useNavigate();
  const { warehouseId, itemId } = useParams<RouteParams>();

  const [warehouse, setWarehouse] = useState<WarehouseHeader | null>(null);
  const location = useLocation();
  const state = location.state as LocationState;
  const area = state?.area ?? null;
  const [initialProduct, setInitialProduct] =
    useState<SelectedProductForAudit | null>(null);

  const [loadingWarehouse, setLoadingWarehouse] = useState(true);
  const [loadingItem, setLoadingItem] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 1) Cargar almacén desde DB (getActiveWarehouses)
  useEffect(() => {
    let isMounted = true;

    async function fetchWarehouse() {
      if (!warehouseId) {
        setError('No se encontró el código de almacén en la URL.');
        setLoadingWarehouse(false);
        return;
      }

      try {
        setLoadingWarehouse(true);
        setError(null);

        const list = await getActiveWarehouses();
        if (!isMounted) return;

        const found = (
          list as Array<{ id: number; code: string; name: string }>
        ).find((w) => w.code === warehouseId);

        if (!found) {
          setWarehouse(null);
          setError(`No se encontró el almacén con código "${warehouseId}".`);
        } else {
          setWarehouse({
            id: String(found.id),
            code: found.code,
            name: found.name,
          });
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error) {
          console.error('❌ Error al cargar almacén:', err.message);
          setError(err.message);
        } else {
          console.error('❌ Error desconocido al cargar almacén:', err);
          setError('Ocurrió un error al cargar el almacén.');
        }
      } finally {
        if (isMounted) setLoadingWarehouse(false);
      }
    }

    fetchWarehouse();
    return () => {
      isMounted = false;
    };
  }, [warehouseId]);

  // 2) Cargar item desde la vista vw_warehouse_stock
  useEffect(() => {
    let isMounted = true;

    async function fetchItem() {
      if (!warehouseId || !itemId) {
        setLoadingItem(false);
        return;
      }

      try {
        setLoadingItem(true);
        // no pisamos error de almacén si ya lo hay
        const row: WarehouseStockItem | null = await getWarehouseItemBySku(
          warehouseId,
          itemId
        );
        if (!isMounted) return;

        if (!row) {
          setInitialProduct(null);
        } else {
          setInitialProduct({
            id: String(row.item_id),
            code: row.item_sku,
            name: row.item_name,
            uomCode: row.uom_code,
            isWeighted: row.item_is_weightable ? 'Y' : 'N',
          });
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error) {
          console.error(
            `❌ Error al cargar item "${itemId}" en almacén "${warehouseId}":`,
            err.message
          );
          setError(err.message);
        } else {
          console.error('❌ Error desconocido al cargar item:', err);
          setError('Ocurrió un error al cargar el artículo.');
        }
      } finally {
        if (isMounted) setLoadingItem(false);
      }
    }

    fetchItem();
    return () => {
      isMounted = false;
    };
  }, [warehouseId, itemId]);

  const handleSubmit = async (payload: WarehouseItemCountPayload) => {
    if (!warehouse || !initialProduct) return;

    const warehouseNumericId = Number(warehouse.id);
    const itemNumericId = Number(initialProduct.id);
    const areaNumericId = payload.areaId ? Number(payload.areaId) : undefined;

    if (Number.isNaN(warehouseNumericId) || Number.isNaN(itemNumericId)) {
      alert(
        'Ocurrió un problema con los identificadores de almacén o artículo.'
      );
      return;
    }

    try {
      setSaving(true);

      await registerInventoryOperation({
        warehouseId: warehouseNumericId,
        areaId: areaNumericId,
        itemId: itemNumericId,
        quantity: payload.quantity,
        isWeighted: payload.isWeighted === 'Y',
        status: payload.status,
        auditorEmail: payload.auditorEmail,
        statusComment: payload.statusComment,
        pendingReasonCode: payload.pendingReasonCode,
      });

      navigate(-1);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error registrando conteo:', error.message);
        alert(`No se pudo guardar el conteo: ${error.message}`);
      } else {
        console.error('❌ Error desconocido registrando conteo:', error);
        alert('Ocurrió un error al guardar el conteo.');
      }
    } finally {
      setSaving(false);
    }
  };

  const loading = loadingWarehouse || loadingItem;

  // 3) Caso: no se encontró el artículo para ese almacén
  if (!loading && (!initialProduct || !warehouse)) {
    return (
      <div className="h-screen flex bg-gray-100">
        <Sidebar />
        <main className="flex flex-col flex-1 h-[100dvh] bg-gray-100 overflow-hidden">
          <header className="bg-blue-600 text-white shadow-sm">
            <div className="px-4 sm:px-6 lg:px-10 py-4 flex items-start gap-3">
              <button
                onClick={() => navigate(-1)}
                className="mt-1 mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-blue-500/30 focus:outline-none focus:ring-2 focus:ring-white/70"
                aria-label="Volver"
              >
                <span className="text-2xl leading-none">‹</span>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                  Conteo de Inventario
                </h1>
                {warehouse && (
                  <p className="text-sm sm:text-base mt-1 opacity-90">
                    Almacén:{' '}
                    <span className="font-semibold">{warehouse.name}</span>
                  </p>
                )}
              </div>
            </div>
          </header>
          <section className="flex-1 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-sm px-6 py-8 max-w-md text-center">
              <p className="text-sm text-gray-700 font-semibold mb-2">
                Artículo no encontrado
              </p>
              <p className="text-xs text-gray-500 mb-4">
                No pudimos cargar la información del artículo con id/code:{' '}
                <span className="font-mono">{itemId}</span> en el almacén{' '}
                <span className="font-semibold">
                  {warehouse?.code ?? warehouseId}
                </span>
                .
              </p>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center h-10 px-4 rounded-2xl bg-blue-600 text-white text-sm font-semibold"
              >
                Volver al listado
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />

      <main className="flex flex-col flex-1 h-[100dvh] bg-gray-100 overflow-hidden">
        {/* HEADER AZUL */}
        <header className="bg-blue-600 text-white shadow-sm pt-16 sm:pt-6">
          <div className="px-4 sm:px-6 lg:px-10 pb-4 flex items-center justify-between gap-4">
            {/* Texto del header */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight break-words">
                Conteo de Inventario
              </h1>

              <p className="text-sm sm:text-base mt-1 opacity-90">
                {loadingWarehouse ? (
                  'Cargando almacén…'
                ) : warehouse ? (
                  <>
                    Almacén:{' '}
                    <span className="font-semibold">{warehouse.name}</span>
                  </>
                ) : (
                  'Almacén no encontrado'
                )}
              </p>

              {initialProduct && (
                <p className="text-xs sm:text-sm mt-1 text-blue-100/90 break-words">
                  Producto seleccionado:{' '}
                  <span className="font-semibold">
                    {initialProduct.code} · {initialProduct.name} (
                    {initialProduct.uomCode})
                  </span>
                </p>
              )}

              {saving && (
                <p className="mt-1 text-xs text-blue-100/90">
                  Guardando conteo…
                </p>
              )}
            </div>

            {/* Botón Volver */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full bg-white/95 text-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm hover:bg-white transition shrink-0"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-base">
                ←
              </span>
              <span>Volver</span>
            </button>
          </div>
        </header>

        {/* CONTENIDO */}
        <section className="flex-1 overflow-y-auto">
          {warehouse && initialProduct && (
            <NewWarehouseAuditForm
              warehouse={{ id: warehouse.id, name: warehouse.name }}
              area={area}
              initialProduct={initialProduct}
              onCancel={() => navigate(-1)}
              onSubmit={handleSubmit}
            />
          )}
        </section>
      </main>
    </div>
  );
}
