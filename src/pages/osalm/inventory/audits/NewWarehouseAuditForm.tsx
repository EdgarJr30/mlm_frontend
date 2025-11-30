import { useState } from 'react';

type InventoryStatus = 'counted' | 'pending' | 'recount';

export type NewWarehouseAuditPayload = {
  warehouseId: string;
  date: string;
  time: string;
  productSearch: string;
  isWeighted: 'N' | 'Y';
  quantity: number;
  status: InventoryStatus;
  auditorEmail: string;
};

type NewWarehouseAuditFormProps = {
  warehouse: { id: string; name: string };
  onCancel: () => void;
  onSubmit?: (payload: NewWarehouseAuditPayload) => void;
};

export function NewWarehouseAuditForm({
  warehouse,
  onCancel,
  onSubmit,
}: NewWarehouseAuditFormProps) {
  // Estado del formulario (solo UI por ahora)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });

  const [productSearch, setProductSearch] = useState('');
  const [isWeighted, setIsWeighted] = useState<'N' | 'Y'>('N');
  const [quantity, setQuantity] = useState<number>(0);
  const [status, setStatus] = useState<InventoryStatus>('counted');
  const [auditorEmail, setAuditorEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: NewWarehouseAuditPayload = {
      warehouseId: warehouse.id,
      date,
      time,
      productSearch,
      isWeighted,
      quantity,
      status,
      auditorEmail,
    };

    onSubmit?.(payload);
  };

  const increment = () => setQuantity((q) => q + 1);
  const decrement = () => setQuantity((q) => (q > 0 ? q - 1 : 0));

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-28"
    >
      {/* Fecha / Hora */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Fecha / Hora
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Hora
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            />
          </div>
        </div>
      </div>

      {/* Almacén */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Almacén *</h2>
        <div className="relative">
          <select
            value={warehouse.id}
            disabled
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm sm:text-base text-gray-900 focus:outline-none"
          >
            <option value={warehouse.id}>{warehouse.name}</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400 text-lg">
            ▾
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          El almacén se toma desde la pantalla anterior.
        </p>
      </div>

      {/* Producto */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-700">Producto *</h2>
          <button
            type="button"
            className="inline-flex items-center rounded-2xl border border-gray-200 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50"
          >
            ✓ Maestra
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-gray-50 rounded-2xl border border-gray-200 px-3">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-sm sm:text-base py-2"
            />
          </div>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-500 text-xl"
            aria-label="Escanear código"
          >
            ⌗
          </button>
        </div>
      </div>

      {/* ¿Es pesado? */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          ¿Es Pesado?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsWeighted('N')}
            className={`h-11 rounded-2xl text-sm font-semibold transition
              ${
                isWeighted === 'N'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
          >
            N
          </button>
          <button
            type="button"
            onClick={() => setIsWeighted('Y')}
            className={`h-11 rounded-2xl text-sm font-semibold transition
              ${
                isWeighted === 'Y'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
          >
            Y
          </button>
        </div>
      </div>

      {/* Cantidad */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Cantidad</h2>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={decrement}
            className="h-11 w-11 rounded-2xl bg-gray-100 text-xl font-semibold flex items-center justify-center"
          >
            –
          </button>
          <div className="min-w-[80px] text-center text-2xl font-bold text-gray-900">
            {quantity}
          </div>
          <button
            type="button"
            onClick={increment}
            className="h-11 w-11 rounded-2xl bg-blue-600 text-white text-xl font-semibold flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Estado del Inventario */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Estado del Inventario
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setStatus('counted')}
            className={`h-11 rounded-2xl text-xs sm:text-sm font-semibold transition
              ${
                status === 'counted'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
          >
            Contado
          </button>
          <button
            type="button"
            onClick={() => setStatus('pending')}
            className={`h-11 rounded-2xl text-xs sm:text-sm font-semibold transition
              ${
                status === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
          >
            Pendiente
          </button>
          <button
            type="button"
            onClick={() => setStatus('recount')}
            className={`h-11 rounded-2xl text-xs sm:text-sm font-semibold transition
              ${
                status === 'recount'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
          >
            Reconteo
          </button>
        </div>
      </div>

      {/* Foto / Imagen */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Foto / Imagen
        </h2>
        <button
          type="button"
          className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-8 flex flex-col items-center justify-center text-gray-400 text-sm"
        >
          <span className="text-3xl mb-2">📷</span>
          <span>Tomar foto o seleccionar imagen</span>
        </button>
      </div>

      {/* Auditor */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Auditor *</h2>
        <input
          type="email"
          placeholder="correo@empresa.com"
          value={auditorEmail}
          onChange={(e) => setAuditorEmail(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/70"
        />
      </div>

      {/* BOTONES INFERIORES */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-10 py-3 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 rounded-2xl bg-gray-100 text-gray-800 text-sm sm:text-base font-semibold"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 h-11 rounded-2xl bg-blue-600 text-white text-sm sm:text-base font-semibold"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
