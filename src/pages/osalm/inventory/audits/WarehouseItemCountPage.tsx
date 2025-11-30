// src/pages/osalm/inventory/WarehouseItemCountPage.tsx
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';
import {
  NewWarehouseAuditForm,
  type NewWarehouseAuditPayload,
  type SelectedProductForAudit,
} from './NewWarehouseAuditForm';

// En producción lo ideal es que esto venga de la API o de un hook compartido
const MOCK_WAREHOUSES = [
  { id: 'oc-quimicos', name: 'OC - Químicos' },
  // agrega más almacenes
];

// También en producción esto vendrá de tu query real
const MOCK_ITEMS = [
  {
    id: 'A000001',
    code: 'A000001',
    name: 'Azúcar refinada 25 lb',
    uomCode: 'ENV. 25 LB.',
    is_weightable: false,
  },
  {
    id: 'A000002',
    code: 'A000002',
    name: 'Azúcar a granel',
    uomCode: 'LIBRAS',
    is_weightable: true,
  },
  {
    id: 'A000009-1',
    code: 'A000009',
    name: 'Aceite vegetal 10.5 oz',
    uomCode: 'ENV. 10.5 OZF.',
    is_weightable: false,
  },
  {
    id: 'A000009-2',
    code: 'A000009',
    name: 'Aceite vegetal 5 litros',
    uomCode: 'ENV. 5 LIT.',
    is_weightable: false,
  },
];

type RouteParams = {
  warehouseId: string;
  itemId: string;
};

export default function WarehouseItemCountPage() {
  const navigate = useNavigate();
  const { warehouseId, itemId } = useParams<RouteParams>();

  // Buscar almacén
  const warehouse =
    useMemo(
      () =>
        MOCK_WAREHOUSES.find((w) => w.id === warehouseId) ?? MOCK_WAREHOUSES[0],
      [warehouseId]
    ) ?? MOCK_WAREHOUSES[0];

  // Buscar artículo
  const item = useMemo(
    () =>
      MOCK_ITEMS.find(
        (i) => i.id === itemId || i.code === itemId // por si usas code en la ruta
      ),
    [itemId]
  );

  const initialProduct: SelectedProductForAudit | undefined = item
    ? {
        id: item.id,
        code: item.code,
        name: item.name,
        uomCode: item.uomCode,
        isWeighted: item.is_weightable ? 'Y' : 'N',
      }
    : undefined;

  const handleSubmit = (payload: NewWarehouseAuditPayload) => {
    console.log('Conteo de artículo en almacén', payload);
    // Aquí luego harás el POST a la API
  };

  // Si no se encontró el artículo, muestra un mensaje sencillo
  if (!item) {
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
                <p className="text-sm sm:text-base mt-1 opacity-90">
                  Almacén:{' '}
                  <span className="font-semibold">{warehouse.name}</span>
                </p>
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
                <span className="font-mono">{itemId}</span>.
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

              <p className="text-xs sm:text-sm mt-1 text-blue-100/90">
                Producto seleccionado:{' '}
                <span className="font-semibold">
                  {item.code} · {item.name} ({item.uomCode})
                </span>
              </p>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <section className="flex-1 overflow-y-auto">
          <NewWarehouseAuditForm
            warehouse={warehouse}
            initialProduct={initialProduct}
            onCancel={() => navigate(-1)}
            onSubmit={handleSubmit}
          />
        </section>
      </main>
    </div>
  );
}
