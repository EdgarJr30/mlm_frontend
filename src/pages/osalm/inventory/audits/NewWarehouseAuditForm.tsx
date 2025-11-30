import { useEffect, useState } from 'react';
import { useUser } from '../../../../context/UserContext';

export type InventoryStatus = 'counted' | 'pending' | 'recount';

export type SelectedProductForAudit = {
  id: string;
  code: string;
  name: string;
  uomCode: string;
  isWeighted: 'N' | 'Y';
};

export type NewWarehouseAuditPayload = {
  warehouseId: string;
  date: string;
  time: string;

  // Producto
  productSearch: string; // lo puedes seguir usando cuando entras con el botón +
  productId?: string;
  productCode?: string;
  productName?: string;
  uomCode?: string;

  isWeighted: 'N' | 'Y';
  quantity: number;
  status: InventoryStatus;
  auditorEmail: string; // aquí mandamos el usuario conectado (mail) y mostramos el nombre en UI
};

type NewWarehouseAuditFormProps = {
  warehouse: { id: string; name: string };
  initialProduct?: SelectedProductForAudit;
  onCancel: () => void;
  onSubmit?: (payload: NewWarehouseAuditPayload) => void;
};

export function NewWarehouseAuditForm({
  warehouse,
  initialProduct,
  onCancel,
  onSubmit,
}: NewWarehouseAuditFormProps) {
  const { profile } = useUser();

  // Fecha / hora (solo lectura para el usuario)
  const [date] = useState(() => new Date().toISOString().slice(0, 10));
  const [time] = useState(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });

  // Producto
  const [productSearch, setProductSearch] = useState(() =>
    initialProduct ? `${initialProduct.code} - ${initialProduct.name}` : ''
  );

  const [isWeighted, setIsWeighted] = useState<'N' | 'Y'>(
    initialProduct?.isWeighted ?? 'N'
  );

  // Cantidad: editable + botones, 0–99999
  const [quantity, setQuantity] = useState<number>(0);

  const [status, setStatus] = useState<InventoryStatus>('counted');

  // Auditor: se llena automáticamente con el usuario conectado
  const [auditorEmail, setAuditorEmail] = useState('');

  useEffect(() => {
    if (profile?.email && auditorEmail === '') {
      setAuditorEmail(profile.email);
    }
  }, [profile?.email, auditorEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: NewWarehouseAuditPayload = {
      warehouseId: warehouse.id,
      date,
      time,
      productSearch,
      productId: initialProduct?.id,
      productCode: initialProduct?.code,
      productName: initialProduct?.name,
      uomCode: initialProduct?.uomCode,
      isWeighted,
      quantity,
      status,
      auditorEmail,
    };

    onSubmit?.(payload);
  };

  const clampQuantity = (value: number): number => {
    if (Number.isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > 99999) return 99999;
    return value;
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (raw === '') {
      setQuantity(0);
      return;
    }

    const parsed = Number(raw);
    const clamped = clampQuantity(parsed);
    setQuantity(clamped);
  };

  const increment = () => setQuantity((q) => clampQuantity(q + 1));

  const decrement = () => setQuantity((q) => clampQuantity(q - 1));

  const auditorDisplay =
    profile?.name ??
    // por si tu modelo de perfil usa otros nombres
    (profile && 'name' in profile ? profile.name : undefined) ??
    auditorEmail;

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-28"
    >
      {/* Fecha / Hora (solo lectura) */}
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
              disabled
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Hora
            </label>
            <input
              type="time"
              value={time}
              disabled
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          La fecha y la hora se toman automáticamente al momento del conteo.
        </p>
      </div>

      {/* Almacén (solo texto) */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Almacén *</h2>
        <div className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm sm:text-base text-gray-900">
          {warehouse.name}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          El almacén se toma desde la pantalla anterior y no se puede cambiar.
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

        {initialProduct ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-3 py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">
                  {initialProduct.code} · {initialProduct.name}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Unidad de medida:{' '}
                  <span className="font-semibold">
                    {initialProduct.uomCode}
                  </span>
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-blue-700 shadow-sm">
                Seleccionado desde el listado
              </span>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              Si este no es el producto correcto, cierre esta pantalla y
              seleccione el artículo adecuado en el listado.
            </p>
          </div>
        ) : (
          <>
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
            <p className="text-[11px] text-gray-400">
              Este modo se usa cuando el artículo no aparece en el listado del
              almacén.
            </p>
          </>
        )}
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
          <input
            type="number"
            min={0}
            max={99999}
            value={quantity}
            onChange={handleQuantityChange}
            className="w-28 text-center text-2xl font-bold text-gray-900 rounded-xl border border-gray-200 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
          />
          <button
            type="button"
            onClick={increment}
            className="h-11 w-11 rounded-2xl bg-blue-600 text-white text-xl font-semibold flex items-center justify-center"
          >
            +
          </button>
        </div>
        <p className="mt-2 text-[11px] text-gray-400 text-center">
          Mínimo 0 · Máximo 99,999 unidades.
        </p>
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

      {/* Auditor (auto desde perfil) */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Auditor *</h2>
        <div className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm sm:text-base bg-gray-50 text-gray-900">
          {auditorDisplay || 'Cargando usuario...'}
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          El auditor se toma automáticamente del usuario conectado.
        </p>
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
