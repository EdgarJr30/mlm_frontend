// src/hooks/useFilters.ts
import { useEffect, useMemo, useState } from 'react';
import type { FilterSchema, FilterState, FilterField, FilterValue } from '../types/filters';

function parseFromURL<T extends string>(fields: FilterField<T>[]): FilterState<T> {
  const params = new URLSearchParams(window.location.search);
  const state: FilterState<T> = {};
  for (const f of fields) {
    if (f.hidden) continue;                           // <-- ignorar ocultos
    const raw = params.get(f.key);
    if (!raw) continue;
    if (f.type === 'multiselect') state[f.key] = raw.split(',');
    else if (f.type === 'boolean') state[f.key] = raw === 'true';
    else if (f.type === 'daterange') {
      const [from, to] = raw.split('|');
      state[f.key] = { from: from || undefined, to: to || undefined };
    } else {
      state[f.key] = raw;
    }
  }
  return state;
}

function writeToURL<T extends string>(fields: FilterField<T>[], values: FilterState<T>) {
  const params = new URLSearchParams(window.location.search);
  for (const f of fields) {
    if (f.hidden) {                                   // <-- no persistir ocultos
      params.delete(f.key);
      continue;
    }
    const v = values[f.key];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
      params.delete(f.key);
      continue;
    }
    if (f.type === 'multiselect' && Array.isArray(v)) params.set(f.key, v.join(','));
    else if (f.type === 'boolean' && typeof v === 'boolean') params.set(f.key, String(v));
    else if (f.type === 'daterange' && typeof v === 'object') {
      const { from = '', to = '' } = v as { from?: string; to?: string };
      params.set(f.key, `${from}|${to}`);
    } else params.set(f.key, String(v));
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', newUrl);
}

export function useFilters<T extends string>(schema: FilterSchema<T>) {
  const defaults: FilterState<T> = useMemo(() => {
    const out: FilterState<T> = {};
    for (const f of schema.fields) {
      if (f.defaultValue !== undefined) out[f.key] = f.defaultValue;
    }
    return out;
  }, [schema.fields]);

  const [values, setValues] = useState<FilterState<T>>({
    ...defaults,
    ...parseFromURL(schema.fields),
  });

  // actualizar URL cuando los valores cambien
  useEffect(() => {
    writeToURL(schema.fields, values);
  }, [schema.fields, values]);

  const setValue = <K extends T>(key: K, value: FilterValue | undefined) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => setValues(defaults);

  const activeCount = useMemo(() => {
    return schema.fields.reduce((acc, f) => {
      const v = values[f.key];
      const isActive =
        v !== undefined &&
        v !== null &&
        v !== '' &&
        (!Array.isArray(v) || v.length > 0) &&
        (typeof v !== 'object' ||
          (v && typeof v === 'object' && (('from' in v) || ('to' in v))));
      return acc + (isActive ? 1 : 0);
    }, 0);
  }, [schema.fields, values]);

  return { values, setValue, reset, activeCount };
}
