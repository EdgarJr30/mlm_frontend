import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';
import { useCan } from '../../../../rbac/PermissionsContext';
import { getActiveWarehouses } from '../../../../services/inventoryService';

type WarehouseCard = {
  id: number;
  code: string; // va en la URL, ej: 'oc-quimicos'
  name: string; // se muestra, ej: 'OC - Químicos'
};

export default function InventoryCountsPage() {
  const navigate = useNavigate();

  // ✅ Solo usuarios con alguno de estos permisos verán el botón
  const canSeeAuditAdmin = useCan([
    'inventory_adjustments:full_access',
    'inventory_adjustments:read',
  ]);

  const [warehouses, setWarehouses] = useState<WarehouseCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleOpenWarehouse = (warehouseCode: string) => {
    // usas el code como slug → /osalm/almacenes/oc-quimicos
    navigate(`/osalm/almacenes/${warehouseCode}`);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchWarehouses() {
      try {
        setLoading(true);
        setError(null);

        const data = await getActiveWarehouses();

        if (!isMounted) return;

        // 🔎 Mapear filas de BD → modelo para la UI
        const mapped: WarehouseCard[] = (
          data as Array<{
            id: number;
            code: string;
            name: string;
          }>
        ).map((w) => ({
          id: w.id,
          code: w.code,
          name: w.name,
        }));

        setWarehouses(mapped);
      } catch (err: unknown) {
        if (!isMounted) return;

        if (err instanceof Error) {
          console.error('❌ Error al cargar almacenes:', err.message);
          setError(err.message);
        } else {
          console.error('❌ Error desconocido al cargar almacenes:', err);
          setError('Ocurrió un error al cargar los almacenes.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchWarehouses();

    return () => {
      isMounted = false;
    };
  }, []);

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
                {loading ? 'Cargando…' : `${warehouses.length} almacenes`}
              </span>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs sm:text-sm text-red-700">
                Ocurrió un problema al cargar los almacenes: {error}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && warehouses.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-6 sm:px-6 sm:py-8 text-center text-sm sm:text-base text-gray-500">
                No hay almacenes activos configurados para conteos de
                inventario.
              </div>
            )}

            {/* Grid de almacenes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-8">
              {loading &&
                // Skeletons mientras carga
                Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse flex flex-col gap-2 rounded-2xl bg-white px-4 py-4 sm:px-5 sm:py-5 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="h-4 w-16 rounded-full bg-gray-200" />
                      <div className="h-3 w-20 rounded-full bg-gray-200" />
                    </div>
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200 mt-2" />
                    <div className="h-3 w-1/3 rounded bg-gray-200 mt-3" />
                  </div>
                ))}

              {!loading &&
                !error &&
                warehouses.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleOpenWarehouse(w.code)}
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
                        Código: {w.code}
                      </span>
                    </div>

                    {/* Nombre del almacén */}
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-700 line-clamp-2">
                      {w.name}
                    </h3>

                    {/* Descripción / hint */}
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                      Almacén activo para conteos de inventario.
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
