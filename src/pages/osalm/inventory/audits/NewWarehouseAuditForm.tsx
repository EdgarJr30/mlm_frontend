import { useEffect, useState } from 'react';
import { useUser } from '../../../../context/UserContext';

export type InventoryStatus = 'counted' | 'pending' | 'recount';
export type PendingReasonCode = 'UOM_DIFFERENT' | 'REVIEW';

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
  productSearch: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  uomCode?: string;
  isWeighted: 'N' | 'Y';

  quantity: number;

  // 👇 Se envía “por detrás”
  status: InventoryStatus; // counted por defecto, pending si hay motivo
  auditorEmail: string;
  statusComment?: string;
  pendingReasonCode?: PendingReasonCode;
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

  // Cantidad
  const [quantity, setQuantity] = useState<number>(0);

  // 🔁 Ya NO se muestra el status en la UI.
  // Se calcula en el submit: counted si no hay motivo, pending si hay motivo.
  const [pendingReasonCode, setPendingReasonCode] = useState<
    PendingReasonCode | ''
  >('');

  const [statusComment, setStatusComment] = useState<string>('');

  // Auditor
  const [auditorEmail, setAuditorEmail] = useState('');
  useEffect(() => {
    if (profile?.email && auditorEmail === '') {
      setAuditorEmail(profile.email);
    }
  }, [profile?.email, auditorEmail]);

  // Si quitan el motivo, limpiamos el comentario porque ya no es pendiente
  useEffect(() => {
    if (pendingReasonCode === '' && statusComment !== '') {
      setStatusComment('');
    }
  }, [pendingReasonCode, statusComment]);

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
    setQuantity(clampQuantity(parsed));
  };

  const increment = () => setQuantity((q) => clampQuantity(q + 1));
  const decrement = () => setQuantity((q) => clampQuantity(q - 1));

  const auditorDisplay =
    profile?.name ??
    (profile && 'name' in profile ? profile.name : undefined) ??
    auditorEmail;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isPending = pendingReasonCode !== '';
    const derivedStatus: InventoryStatus = isPending ? 'pending' : 'counted';
    const trimmedComment = statusComment.trim();

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
      status: derivedStatus, // 👈 aquí va counted o pending según el motivo
      auditorEmail,
      pendingReasonCode: isPending ? pendingReasonCode : undefined,
      statusComment:
        isPending && trimmedComment !== '' ? trimmedComment : undefined,
    };

    onSubmit?.(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-28"
    >
      {/* Almacén */}
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

      {/* Estado del Inventario – solo motivos tipo “bolitas” */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Estado del Inventario
        </h2>
        <p className="text-[11px] text-gray-500 mb-3">
          Si no seleccionas ningún motivo, el artículo se registrará como{' '}
          <span className="font-semibold">CONTADO</span>. Si seleccionas un
          motivo, se marcará automáticamente como{' '}
          <span className="font-semibold">PENDIENTE</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Opción 1 */}
          <button
            type="button"
            onClick={() =>
              setPendingReasonCode((current) =>
                current === 'UOM_DIFFERENT' ? '' : 'UOM_DIFFERENT'
              )
            }
            className={`flex-1 inline-flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-xs sm:text-sm text-left transition
              ${
                pendingReasonCode === 'UOM_DIFFERENT'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
          >
            <span
              className={`h-3 w-3 rounded-full border flex-shrink-0
                ${
                  pendingReasonCode === 'UOM_DIFFERENT'
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-400 bg-white'
                }`}
            />
            <span className="font-semibold">
              Unidad de medida diferente / revisar configuración
            </span>
          </button>

          {/* Opción 2 */}
          <button
            type="button"
            onClick={() =>
              setPendingReasonCode((current) =>
                current === 'REVIEW' ? '' : 'REVIEW'
              )
            }
            className={`flex-1 inline-flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-xs sm:text-sm text-left transition
              ${
                pendingReasonCode === 'REVIEW'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
          >
            <span
              className={`h-3 w-3 rounded-full border flex-shrink-0
                ${
                  pendingReasonCode === 'REVIEW'
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-400 bg-white'
                }`}
            />
            <span className="font-semibold">
              Revisión posterior (duda / incidencia)
            </span>
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Comentario adicional (opcional)
          </label>
          <textarea
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            rows={3}
            placeholder="Ej.: Falta validar con SAP, producto en otra ubicación, etc."
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            disabled={pendingReasonCode === ''}
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Solo aplica si el artículo queda pendiente. Puedes dejarlo vacío.
          </p>
        </div>
      </div>

      {/* Auditor */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Auditor *</h2>
        <div className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm sm:text-base bg-gray-50 text-gray-900">
          {auditorDisplay || 'Cargando usuario...'}
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          El auditor se toma automáticamente del usuario conectado.
        </p>
      </div>

      {/* Botones inferiores */}
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
