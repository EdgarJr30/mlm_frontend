// src/components/ui/filters/FilterBar.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  FilterSchema,
  FilterField,
  FilterValue,
} from '../../../types/filters';
import { useFilters } from '../../../hooks/useFilters';

/* ============ helpers de UI ============ */
const control =
  'h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const pillBtn =
  'inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50';
const primaryBtn =
  'inline-flex items-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500';
const subtleBtn =
  'inline-flex items-center rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-800 hover:bg-gray-200';
const chipCls =
  'inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700';
const toolbar =
  'rounded-2xl border border-gray-200 bg-white p-3 md:p-4 shadow-sm';

// Popover que se renderiza en <body> y se posiciona bajo el botón
function AnchoredPopover({
  anchorRef,
  open,
  onClose,
  children,
  minWidth,
}: {
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  minWidth?: number;
}) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  // 👇 ref al contenedor del popover renderizado en portal
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function recalc() {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom + 8, left: r.left, width: r.width });
    }

    function handleDocPointerDown(e: MouseEvent) {
      const target = e.target as Node | null;
      // Si el click ocurre dentro del anchor o dentro del popover, NO cerrar
      if (
        (anchorRef.current && anchorRef.current.contains(target)) ||
        (popoverRef.current && popoverRef.current.contains(target))
      ) {
        return;
      }
      onClose();
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    if (open) {
      recalc();
      const opts = { passive: true } as AddEventListenerOptions;
      window.addEventListener('scroll', recalc, opts);
      window.addEventListener('resize', recalc, opts);
      // importante: usar mousedown/pointerdown, pero ignorar si es dentro del popover
      document.addEventListener('mousedown', handleDocPointerDown);
      document.addEventListener('keydown', handleKey);
      return () => {
        window.removeEventListener('scroll', recalc);
        window.removeEventListener('resize', recalc);
        document.removeEventListener('mousedown', handleDocPointerDown);
        document.removeEventListener('keydown', handleKey);
      };
    }
  }, [open, anchorRef, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        minWidth: minWidth ?? pos.width,
        zIndex: 9999,
      }}
      className="rounded-xl border border-gray-200 bg-white p-2 shadow-2xl max-h-72 overflow-auto"
      role="menu"
      // Cinturón y tirantes: evita burbujeo por si algún handler global usa capture
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

/* ============ vistas guardadas (localStorage) ============ */
type SavedView<T extends string> = {
  id: string;
  name: string;
  values: Record<T, unknown>;
};
function loadViews<T extends string>(schemaId: string): SavedView<T>[] {
  try {
    const raw = localStorage.getItem(`filters:views:${schemaId}`);
    return raw ? (JSON.parse(raw) as SavedView<T>[]) : [];
  } catch {
    return [];
  }
}
function saveViews<T extends string>(schemaId: string, views: SavedView<T>[]) {
  localStorage.setItem(`filters:views:${schemaId}`, JSON.stringify(views));
}

/* ============ componentes atómicos ============ */
function SearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative w-full">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
          clipRule="evenodd"
        />
      </svg>
      <input
        className={`${control} pl-10`}
        placeholder={placeholder ?? 'Buscar…'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value?: string | number;
  onChange: (v: string | number | undefined) => void;
  placeholder?: string;
  options: { label: string; value: string | number }[];
}) {
  return (
    <div className="relative">
      <select
        className={`${control} appearance-none pr-8`}
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">{placeholder ?? 'Seleccionar…'}</option>
        {options.map((op) => (
          <option key={String(op.value)} value={String(op.value)}>
            {op.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path d="M5.25 7.5L10 12.25 14.75 7.5H5.25z" />
      </svg>
    </div>
  );
}

/* ============ renderizador de campos del schema ============ */
function FieldRenderer<T extends string>({
  f,
  value,
  onChange,
}: {
  f: FilterField<T>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (f.type === 'text') {
    return (
      <SearchInput
        placeholder={f.placeholder ?? 'Buscar…'}
        value={(value as string) ?? ''}
        onChange={(v) => onChange(v)}
      />
    );
  }
  if (f.type === 'select') {
    return (
      <Select
        value={(value as string) ?? ''}
        onChange={(v) => onChange(v)}
        placeholder={f.label}
        options={f.options}
      />
    );
  }
  if (f.type === 'multiselect') {
    const arr = (Array.isArray(value) ? value : []) as (string | number)[];
    const toggle = (v: string | number) =>
      arr.includes(v)
        ? onChange(arr.filter((x) => x !== v))
        : onChange([...arr, v]);
    return (
      <div className="flex flex-wrap gap-1">
        {f.options.map((op) => (
          <button
            key={String(op.value)}
            type="button"
            className={`rounded-xl border px-3 py-1.5 text-xs ${
              arr.includes(op.value)
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggle(op.value)}
          >
            {op.label}
          </button>
        ))}
      </div>
    );
  }
  if (f.type === 'boolean') {
    return (
      <label className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {f.label}
      </label>
    );
  }
  if (f.type === 'daterange') {
    const v = (value ?? {}) as { from?: string; to?: string };
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={v.from ?? ''}
          onChange={(e) =>
            onChange({ ...v, from: e.target.value || undefined })
          }
          className={control}
        />
        <span className="text-gray-400">—</span>
        <input
          type="date"
          value={v.to ?? ''}
          onChange={(e) => onChange({ ...v, to: e.target.value || undefined })}
          className={control}
        />
      </div>
    );
  }
  return null;
}

/* ============ barra de filtros ============ */
type Props<T extends string> = {
  schema: FilterSchema<T>;
  onApply?: (values: Record<T, unknown>) => void;
  sticky?: boolean;
};

export default function FilterBar<T extends string>({
  schema,
  onApply,
  sticky,
}: Props<T>) {
  const { values, setValue, reset, activeCount } = useFilters(schema);
  const [openDrawer, setOpenDrawer] = useState(false);

  // vistas guardadas
  const [views, setViews] = useState<SavedView<T>[]>(() =>
    loadViews<T>(schema.id)
  );
  const apply = () => onApply?.(values as Record<T, unknown>);

  // separar campos por ubicación
  const [barFields, drawerFields] = useMemo(() => {
    const bar: FilterField<T>[] = [];
    const drawer: FilterField<T>[] = [];
    schema.fields.forEach((f) => {
      if (f.hidden) return;
      if (f.responsive === 'bar') bar.push(f);
      else if (f.responsive === 'drawer') drawer.push(f);
      else {
        bar.push(f);
        drawer.push(f);
      }
    });
    return [bar, drawer];
  }, [schema.fields]);

  // presets de fecha si existe un campo 'daterange'
  const dateField = schema.fields.find((f) => f.type === 'daterange');

  function askAndSaveView() {
    const name = prompt('Nombre de la vista:');
    if (!name) return;
    const v: SavedView<T> = {
      id: crypto.randomUUID(),
      name,
      values: values as Record<T, unknown>,
    };
    const next = [...views, v];
    setViews(next);
    saveViews(schema.id, next);
  }
  function applyView(v: SavedView<T>) {
    // aplica y dispara onApply
    onApply?.(v.values);
  }
  function removeView(id: string) {
    const next = views.filter((v) => v.id !== id);
    setViews(next);
    saveViews(schema.id, next);
  }

  return (
    <div className={`${sticky ? 'sticky top-0 z-10' : ''}`}>
      <div className={toolbar}>
        {/* fila principal (como tu captura 1) */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {barFields.slice(0, 4).map((f) => (
            <div key={f.key}>
              <FieldRenderer
                f={f}
                value={(values as Record<T, unknown>)[f.key]}
                onChange={(v) => setValue(f.key, v as FilterValue | undefined)}
              />
            </div>
          ))}
        </div>

        {/* fila secundaria (como tu captura 2): presets + acciones */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* presets de fecha */}
          {dateField &&
            (() => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const btnRef = useRef<HTMLButtonElement>(null);
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const [open, setOpen] = useState(false);

              const label = (() => {
                const v = (values as Record<string, unknown>)[dateField.key] as
                  | { from?: string; to?: string }
                  | undefined;
                return v?.from && v?.to
                  ? `${v.from} – ${v.to}`
                  : 'Últimos 30 días';
              })();

              const handleSelect = (days: number) => {
                if (!dateField) return;

                // calcula el rango
                const to = new Date();
                const from = new Date();
                from.setDate(to.getDate() - (days - 1));

                const nextRange = {
                  from: from.toISOString().slice(0, 10),
                  to: to.toISOString().slice(0, 10),
                };

                // 1) actualiza en el hook de filtros
                setValue(dateField.key as T, nextRange as FilterValue);

                // 2) dispara onApply con los valores fusionados
                if (onApply) {
                  const merged = {
                    ...(values as Record<T, unknown>),
                    [dateField.key]: nextRange,
                  } as Record<T, unknown>;
                  onApply(merged);
                }

                // 3) cierra popover
                setOpen(false);
              };

              return (
                <div className="relative">
                  <button
                    ref={btnRef}
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className={`${pillBtn}`}
                    aria-haspopup="menu"
                    aria-expanded={open}
                  >
                    <svg
                      className="mr-2 h-4 w-4 text-gray-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M6 2a1 1 0 112 0v1h4V2a1 1 0 112 0v1h1a2 2 0 012 2v2H3V5a2 2 0 012-2h1V2zM3 9h14v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    {label}
                    <svg
                      className="ml-2 h-4 w-4 text-gray-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5.25 7.5L10 12.25 14.75 7.5H5.25z" />
                    </svg>
                  </button>

                  <AnchoredPopover
                    anchorRef={btnRef as React.RefObject<HTMLElement>}
                    open={open}
                    onClose={() => setOpen(false)}
                  >
                    <button
                      className={`${subtleBtn} w-full justify-start`}
                      onClick={() => handleSelect(7)}
                    >
                      Últimos 7 días
                    </button>
                    <button
                      className={`${subtleBtn} w-full justify-start mt-1`}
                      onClick={() => handleSelect(30)}
                    >
                      Últimos 30 días
                    </button>
                    <button
                      className={`${subtleBtn} w-full justify-start mt-1`}
                      onClick={() => handleSelect(90)}
                    >
                      Últimos 90 días
                    </button>
                  </AnchoredPopover>
                </div>
              );
            })()}

          {/* botón para abrir drawer (más filtros) en md- */}
          {drawerFields.length > 0 && (
            <button
              type="button"
              onClick={() => setOpenDrawer(true)}
              className={pillBtn}
            >
              Más filtros ({activeCount})
            </button>
          )}

          <button type="button" onClick={reset} className={pillBtn}>
            Reset
          </button>

          <button type="button" onClick={askAndSaveView} className={pillBtn}>
            Guardar Vista
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={apply} className={primaryBtn}>
              Aplicar
            </button>
          </div>
        </div>

        {/* chips activos */}
        <div className="mt-3 flex flex-wrap gap-2">
          {schema.fields.map((f) => {
            if (f.hidden) return null;
            const v = (values as Record<string, unknown>)[f.key];
            const empty =
              v === undefined ||
              v === null ||
              v === '' ||
              (Array.isArray(v) && v.length === 0) ||
              (typeof v === 'object' &&
                v !== null &&
                !('from' in v) &&
                !('to' in v));
            if (empty) return null;

            let text = '';
            if (f.type === 'multiselect')
              text = `${f.label}: ${(v as unknown[]).join(', ')}`;
            else if (f.type === 'daterange') {
              const { from = '—', to = '—' } =
                (v as { from?: string; to?: string }) ?? {};
              text = `${f.label}: ${from} → ${to}`;
            } else if (f.type === 'boolean')
              text = `${f.label}: ${v ? 'Sí' : 'No'}`;
            else text = `${f.label}: ${v}`;

            return (
              <span key={f.key} className={chipCls}>
                {text}
                <button
                  onClick={() => setValue(f.key as T, undefined)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>

        {/* vistas guardadas (pills) */}
        {views.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Vistas:</span>
            {views.map((v) => (
              <span key={v.id} className={chipCls}>
                <button className="font-medium" onClick={() => applyView(v)}>
                  {v.name}
                </button>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  title="Eliminar vista"
                  onClick={() => removeView(v.id)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Drawer móvil */}
      {openDrawer && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setOpenDrawer(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto max-w-xl">
              <div className="mb-3 h-1 w-10 rounded bg-gray-300 mx-auto" />
              <h3 className="text-base font-semibold mb-3">Filtros</h3>
              <div className="grid grid-cols-1 gap-3">
                {schema.fields
                  .filter(
                    (f) =>
                      !f.hidden &&
                      (f.responsive === 'drawer' || f.responsive === 'both')
                  )
                  .map((f) => (
                    <div key={f.key}>
                      <div className="mb-1 text-xs font-medium text-gray-600">
                        {f.label}
                      </div>
                      <FieldRenderer
                        f={f}
                        value={(values as Record<T, unknown>)[f.key]}
                        onChange={(v) =>
                          setValue(f.key, v as FilterValue | undefined)
                        }
                      />
                    </div>
                  ))}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button className={pillBtn} onClick={reset}>
                  Limpiar
                </button>
                <button
                  className={primaryBtn}
                  onClick={() => {
                    setOpenDrawer(false);
                    apply();
                  }}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
