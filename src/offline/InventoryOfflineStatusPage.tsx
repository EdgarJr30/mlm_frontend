// src/pages/osalm/inventory/InventoryOfflineStatusPage.tsx

import { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import {
  getOfflineInventoryOpsSummary,
  retryErroredInventoryOperations,
  syncPendingInventoryOperations,
} from '../offline/inventoryOfflineStore';
import { toast } from 'react-toastify';

type Summary = {
  pending: number;
  error: number;
  synced: number;
  total: number;
};

export default function InventoryOfflineStatusPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await getOfflineInventoryOpsSummary();
      setSummary(data);
    } catch (err: unknown) {
      console.error('[OfflineStatus] Error al cargar resumen:', err);
      toast.error('No se pudo cargar el estado offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  const handleRetrySync = async () => {
    setSyncing(true);
    try {
      await retryErroredInventoryOperations();
      await syncPendingInventoryOperations();
      await loadSummary();

      toast.success('Sincronización ejecutada. Revisa si quedan pendientes.');
    } catch (err: unknown) {
      console.error('[OfflineStatus] Error forzando sincronización:', err);
      toast.error('Ocurrió un error al intentar sincronizar.');
    } finally {
      setSyncing(false);
    }
  };

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />

      <main className="flex flex-col flex-1 h-[100dvh] bg-gray-100 overflow-hidden">
        {/* HEADER */}
        <header className="bg-blue-600 text-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-10 py-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                Estado Offline de Inventario
              </h1>
              <p className="text-sm sm:text-base mt-1 opacity-90">
                Monitorea las operaciones de conteo guardadas en el dispositivo
                cuando no hay conexión.
              </p>
            </div>

            {/* Estado de conexión */}
            <div className="mt-1">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm
                  ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnline ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
                {isOnline ? 'Conectado' : 'Sin conexión'}
              </span>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <section className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
          {/* Resumen */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 mb-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                Resumen de operaciones offline
              </h2>
              <button
                type="button"
                onClick={() => void loadSummary()}
                disabled={loading || syncing}
                className="inline-flex items-center gap-1 rounded-2xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
              >
                🔄 Actualizar
              </button>
            </div>

            {loading || !summary ? (
              <p className="text-sm text-gray-500">Cargando resumen…</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Pendientes</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">
                    {summary.pending}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Operaciones en cola esperando sincronizarse.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Con error</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">
                    {summary.error}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    No se pudieron enviar. Puedes reintentar la sincronización.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Sincronizadas</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">
                    {summary.synced}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Operaciones enviadas correctamente a Supabase.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Total en dispositivo</p>
                  <p className="mt-1 text-2xl font-bold text-gray-800">
                    {summary.total}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Suma de pendientes, con error y sincronizadas.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Botón reintentar */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
            <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">
              Reintentar sincronización
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              Este botón vuelve a poner en cola las operaciones con error y
              luego intenta sincronizar todas las operaciones pendientes con
              Supabase. Es útil cuando hubo problemas de conexión o errores
              temporales en el servidor.
            </p>

            <button
              type="button"
              onClick={() => void handleRetrySync()}
              disabled={syncing}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {syncing ? 'Sincronizando…' : 'Reintentar sincronización'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
