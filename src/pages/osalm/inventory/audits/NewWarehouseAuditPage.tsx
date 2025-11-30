import { useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';
import {
  NewWarehouseAuditForm,
  type NewWarehouseAuditPayload,
  type SelectedProductForAudit,
} from './NewWarehouseAuditForm';

// En producción lo ideal es importar esto de un archivo compartido
const MOCK_WAREHOUSES = [
  { id: 'oc-quimicos', name: 'OC - Químicos' },
  // agrega más si hace falta
];

type LocationState =
  | {
      product?: SelectedProductForAudit;
    }
  | undefined;

export default function NewWarehouseAuditPage() {
  const navigate = useNavigate();
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const location = useLocation();
  const state = location.state as LocationState;

  const warehouse =
    useMemo(
      () =>
        MOCK_WAREHOUSES.find((w) => w.id === warehouseId) ?? MOCK_WAREHOUSES[0],
      [warehouseId]
    ) ?? MOCK_WAREHOUSES[0];

  const initialProduct = state?.product;

  const handleSubmit = (payload: NewWarehouseAuditPayload) => {
    console.log('Nueva auditoría almacen', payload);
    // Más adelante aquí harás el POST a la API
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
              {warehouse && (
                <p className="text-sm sm:text-base mt-1 opacity-90">
                  Almacén:{' '}
                  <span className="font-semibold">{warehouse.name}</span>
                </p>
              )}

              {initialProduct && (
                <p className="text-xs sm:text-sm mt-1 text-blue-100/90">
                  Producto seleccionado:{' '}
                  <span className="font-semibold">
                    {initialProduct.code} · {initialProduct.name} (
                    {initialProduct.uomCode})
                  </span>
                </p>
              )}
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
