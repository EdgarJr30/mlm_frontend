import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';
import {
  NewWarehouseAuditForm,
  type NewWarehouseAuditPayload,
  type SelectedProductForAudit,
} from './NewWarehouseAuditForm';
import { getActiveWarehouses } from '../../../../services/inventoryService';
import { registerInventoryOperation } from '../../../../services/inventoryCountsService';

type LocationState =
  | {
      product?: SelectedProductForAudit;
    }
  | undefined;

type WarehouseHeader = {
  id: string;
  code: string;
  name: string;
};

export default function NewWarehouseAuditPage() {
  const navigate = useNavigate();
  const { warehouseId } = useParams<{ warehouseId: string }>(); // code
  const location = useLocation();
  const state = location.state as LocationState;

  const [warehouse, setWarehouse] = useState<WarehouseHeader | null>(null);
  const [loadingWarehouse, setLoadingWarehouse] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initialProduct = state?.product;

  // Cargar almacén desde DB
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

  const handleSubmit = async (payload: NewWarehouseAuditPayload) => {
    if (!warehouse) return;

    // Validaciones mínimas
    if (!payload.productId) {
      alert('Debes seleccionar un producto para registrar el conteo.');
      return;
    }

    const warehouseNumericId = Number(warehouse.id);
    const itemNumericId = Number(payload.productId);

    if (Number.isNaN(warehouseNumericId) || Number.isNaN(itemNumericId)) {
      alert(
        'Ocurrió un problema con los identificadores de almacén o artículo.'
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await registerInventoryOperation({
        warehouseId: warehouseNumericId,
        itemId: itemNumericId,
        quantity: payload.quantity,
        isWeighted: payload.isWeighted === 'Y',
        status: payload.status,
        auditorEmail: payload.auditorEmail,
      });

      // Podrías navegar hacia atrás o mostrar un mensaje de éxito
      // Por ahora: volvemos al listado de artículos del almacén
      navigate(-1);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('❌ Error registrando conteo:', err.message);
        setError(err.message);
        alert(`No se pudo guardar el conteo: ${err.message}`);
      } else {
        console.error('❌ Error desconocido registrando conteo:', err);
        setError('Ocurrió un error al guardar el conteo.');
        alert('Ocurrió un error al guardar el conteo.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />

      <main className="flex flex-col flex-1 h-[100dvh] bg-gray-100 overflow-hidden">
        {/* HEADER AZUL */}
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
                Nueva Auditoría
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
                <p className="text-xs sm:text-sm mt-1 text-blue-100/90">
                  Producto seleccionado:{' '}
                  <span className="font-semibold">
                    {initialProduct.code} · {initialProduct.name} (
                    {initialProduct.uomCode})
                  </span>
                </p>
              )}

              {error && <p className="mt-1 text-xs text-red-100/90">{error}</p>}

              {saving && (
                <p className="mt-1 text-xs text-blue-100/90">
                  Guardando conteo…
                </p>
              )}
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <section className="flex-1 overflow-y-auto">
          {warehouse && (
            <NewWarehouseAuditForm
              warehouse={{ id: warehouse.id, name: warehouse.name }}
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
