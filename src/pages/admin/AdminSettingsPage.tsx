import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/navigation/Navbar';
import { useSettings } from '../../context/SettingsContext';
import { showToastSuccess, showToastError } from '../../notifications/toast';

export default function AdminSettingsPage() {
  const { maxSecondary, update, canManage } = useSettings();
  const [, setSearchTerm] = useState(''); // para Navbar (consistencia con otras páginas)
  const [selectedLocation, setSelectedLocation] = useState(''); // para Navbar
  const [value, setValue] = useState<number>(maxSecondary);
  const [saving, setSaving] = useState(false);

  // si maxSecondary cambia por refresh del contexto, sincroniza el input
  useEffect(() => setValue(maxSecondary), [maxSecondary]);

  const disabled = useMemo(() => saving || !canManage, [saving, canManage]);

  const onSave = async () => {
    try {
      setSaving(true);
      await update(value);
      showToastSuccess('Parámetro actualizado.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToastError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="h-screen flex bg-gray-100">
        <Sidebar />
        <main className="flex flex-col h-[100dvh] overflow-hidden flex-1">
          <div className="w-full">
            <Navbar
              onSearch={setSearchTerm}
              onFilterLocation={setSelectedLocation}
              selectedLocation={selectedLocation}
            />
          </div>
          <header className="px-4 md:px-6 lg:px-8 pb-0 pt-4 md:pt-6">
            <h2 className="text-3xl font-bold">Parámetros</h2>
          </header>
          <section className="flex-1 overflow-x-auto px-4 md:px-6 lg:px-8 pt-4 pb-8">
            <div className="p-4 rounded-lg border bg-white shadow-sm">
              No tienes permiso para ver esta página.
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex flex-col h-[100dvh] overflow-hidden flex-1">
        <div className="w-full">
          {/* Navbar con búsqueda y filtro (consistencia visual) */}
          <Navbar
            onSearch={setSearchTerm}
            onFilterLocation={setSelectedLocation}
            selectedLocation={selectedLocation}
          />
        </div>

        <header className="px-4 md:px-6 lg:px-8 pb-0 pt-4 md:pt-6">
          <h2 className="text-3xl font-bold">Parámetros</h2>
        </header>

        <section className="flex-1 overflow-x-auto px-4 md:px-6 lg:px-8 pt-4 pb-8">
          {/* Card principal */}
          <div className="max-w-2xl">
            <div className="p-4 md:p-6 rounded-lg border bg-white shadow-sm space-y-4">
              <h3 className="text-lg font-semibold">Órdenes de Trabajo</h3>

              <div className="grid gap-2">
                <label className="block text-sm font-medium">
                  Máximo de técnicos secundarios por OT
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    disabled={disabled}
                    className="border rounded p-2 w-32 disabled:bg-gray-100"
                  />
                  <span className="text-sm text-gray-500">
                    Total permitido por OT = 1 principal + este valor.
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setValue(maxSecondary)}
                  disabled={disabled}
                  className={
                    'px-4 py-2 rounded border hover:bg-gray-50 cursor-pointer ' +
                    (disabled ? 'opacity-60 cursor-not-allowed' : '')
                  }
                >
                  Restablecer
                </button>
                <button
                  onClick={onSave}
                  disabled={disabled}
                  className={
                    'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer ' +
                    (disabled ? 'opacity-60 cursor-not-allowed' : '')
                  }
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>

            {/* Sección futura: más parámetros */}
            {/* <div className="mt-6 p-4 md:p-6 rounded-lg border bg-white shadow-sm">
              <h3 className="text-lg font-semibold">Otras configuraciones</h3>
              ...
            </div> */}
          </div>
        </section>
      </main>
    </div>
  );
}
