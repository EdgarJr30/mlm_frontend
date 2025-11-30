import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';
import { useCan } from '../../../../rbac/PermissionsContext';

type Warehouse = {
  id: string; // va en la URL, ej: 'oc-quimicos'
  label: string; // se muestra, ej: 'OC - Químicos'
  itemCount: number; // cantidad de artículos del almacén
};

const WAREHOUSES: Warehouse[] = [
  { id: 'oc-quimicos', label: 'OC - Químicos', itemCount: 124 },
  { id: 'oc-vegetales', label: 'OC - Vegetales', itemCount: 87 },
  { id: 'cuarto-frio', label: 'Cuarto Frío', itemCount: 56 },
  { id: 'pasillo-a', label: 'Pasillo A', itemCount: 35 },
  { id: 'pasillo-b', label: 'Pasillo B', itemCount: 28 },
];

export default function InventoryCountsPage() {
  const navigate = useNavigate();

  // ✅ Solo usuarios con alguno de estos permisos verán el botón
  const canSeeAuditAdmin = useCan([
    'inventory_adjustments:full_access',
    'inventory_adjustments:read',
  ]);

  const handleOpenWarehouse = (warehouseId: string) => {
    navigate(`/osalm/almacenes/${warehouseId}`);
  };

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
                Selecciona un almacén para iniciar o continuar un conteo.
              </p>
            </div>

            {canSeeAuditAdmin && (
              <button
                type="button"
                onClick={() =>
                  navigate('/osalm/conteos_inventario/auditoria/almacenes')
                }
                className="inline-flex items-center gap-2 rounded-full bg-white/95 text-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm hover:bg-white transition"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-base">
                  ⚙️
                </span>
                <span>Administración de auditoría</span>
              </button>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <section className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 max-w-6xl mx-auto">
            {/* Header de la sección */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-sm sm:text-lg font-semibold text-gray-800">
                  Almacenes disponibles
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Elige un almacén para ver y gestionar sus conteos de
                  inventario.
                </p>
              </div>
              <span className="text-xs sm:text-sm text-gray-500">
                {WAREHOUSES.length} almacenes
              </span>
            </div>

            {/* Grid de almacenes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-8">
              {WAREHOUSES.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleOpenWarehouse(w.id)}
                  className="group relative flex flex-col items-start gap-2 rounded-2xl bg-white px-4 py-4 sm:px-5 sm:py-5 shadow-sm border border-gray-100
                             hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all text-left"
                >
                  {/* Badge superior */}
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-600 text-[11px] sm:text-xs px-2 py-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Almacén
                    </span>
                    <span className="text-[11px] sm:text-xs text-gray-400">
                      ID: {w.id}
                    </span>
                  </div>

                  {/* Nombre del almacén */}
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-700 line-clamp-2">
                    {w.label}
                  </h3>

                  {/* Cantidad de artículos */}
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    {w.itemCount} artículos registrados
                  </p>

                  {/* Footer / hint */}
                  <div className="mt-3 flex items-center gap-1 text-[11px] sm:text-xs text-blue-600 font-medium">
                    Ver detalle del almacén
                    <span className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
