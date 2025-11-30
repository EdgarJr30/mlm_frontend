/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/inventoryCountsService.ts
import { supabase } from '../lib/supabaseClient';
import type { InventoryCount } from '../types/inventory';

// =======================
// Tipos base existentes
// =======================

export type InventoryStatus = 'counted' | 'pending' | 'recount';

// Reusamos el mismo union para los ítems de auditoría
export type ItemStatus = InventoryStatus;

type EnsureOpenCountResult = {
  id: number;
};

// =======================
// Tipos para auditoría (historial / revisión)
// =======================

export type AuditStatus = 'completed' | 'in_progress' | 'pending';

export type AuditSession = {
  id: number; // id de inventory_counts
  date: string; // "dd/MM/yyyy"
  time: string; // "HH:mm"
  warehouse: string;
  warehouseCode: string; // code de warehouses (OC-QUIM)
  itemsAudited: number;
  status: AuditStatus;
};

export type WarehouseInfo = {
  id: number;
  code: string;
  name: string;
};

export type AuditItem = {
  id: number; // id de inventory_count_lines
  sku: string;
  name: string;
  uom: string;
  countedQty: number;
  systemQty: number;
  status: ItemStatus;
  comment?: string;
};

type DbInventoryCountStatus = 'open' | 'closed' | 'cancelled';

// =======================
// Helpers de mapeo
// =======================

function mapDbStatusToUi(status: DbInventoryCountStatus): AuditStatus {
  switch (status) {
    case 'open':
      return 'in_progress';
    case 'closed':
      return 'completed';
    case 'cancelled':
    default:
      return 'pending';
  }
}

function mapUiItemStatusToDb(
  status: ItemStatus
): 'pending' | 'counted' | 'ignored' {
  if (status === 'recount') return 'ignored';
  return status;
}

function mapDbItemStatusToUi(
  status: 'pending' | 'counted' | 'ignored'
): ItemStatus {
  if (status === 'ignored') return 'recount';
  return status;
}

function formatDateTime(isoString: string | null): {
  date: string;
  time: string;
} {
  if (!isoString) return { date: '—', time: '—' };
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return {
    date: `${dd}/${mm}/${yyyy}`,
    time: `${hh}:${mi}`,
  };
}

// =======================
// Lógica de jornadas (lo que ya tenías)
// =======================

/**
 * Busca una jornada de conteo abierta para el almacén.
 * Si no existe, crea una nueva.
 */
export async function ensureOpenInventoryCountForWarehouse(
  warehouseId: number
): Promise<EnsureOpenCountResult> {
  // 1) Intentar buscar una jornada abierta existente
  const { data: existing, error: selectError } = await supabase
    .from('inventory_counts')
    .select('id, status')
    .eq('warehouse_id', warehouseId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 = no rows found
    // eslint-disable-next-line no-console
    console.error(
      '[ensureOpenInventoryCountForWarehouse] select error:',
      selectError
    );
  }

  if (existing?.id) {
    return { id: existing.id as number };
  }

  // 2) Crear una nueva jornada de conteo
  const now = new Date();
  const fecha = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: inserted, error: insertError } = await supabase
    .from('inventory_counts')
    .insert({
      warehouse_id: warehouseId,
      name: `Conteo físico ${fecha}`,
      description: `Jornada creada desde app web el ${fecha}`,
      // status usa default 'open'
      planned_at: null,
      started_at: now.toISOString(),
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    // eslint-disable-next-line no-console
    console.error(
      '[ensureOpenInventoryCountForWarehouse] insert error:',
      insertError
    );
    throw new Error(
      insertError?.message ??
        'No se pudo crear la jornada de conteo para este almacén'
    );
  }

  return { id: inserted.id as number };
}

export type RegisterInventoryOperationInput = {
  warehouseId: number;
  itemId: number;
  quantity: number;
  isWeighted: boolean;
  status: InventoryStatus;
  auditorEmail?: string;
};

/**
 * Registra un conteo:
 * - Garantiza jornada abierta (inventory_counts)
 * - Inserta operación cruda (inventory_count_operations)
 * - Actualiza/resume línea (inventory_count_lines)
 */
export async function registerInventoryOperation(
  input: RegisterInventoryOperationInput
): Promise<void> {
  const { warehouseId, itemId, quantity, isWeighted, status, auditorEmail } =
    input;

  // 1) Garantizar jornada abierta
  const { id: inventoryCountId } = await ensureOpenInventoryCountForWarehouse(
    warehouseId
  );

  // 2) Obtener UoM base del ítem (base_uom_id)
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id, base_uom_id')
    .eq('id', itemId)
    .maybeSingle();

  if (itemError || !item) {
    // eslint-disable-next-line no-console
    console.error('[registerInventoryOperation] item error:', itemError);
    throw new Error(
      itemError?.message ?? 'No se pudo obtener la unidad base del artículo'
    );
  }

  const uomId = item.base_uom_id as number;
  const netQty = quantity; // en esta versión usamos net_qty = cantidad digitada

  // 3) Insertar operación cruda
  const clientOpId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const isPending = status === 'pending';
  const pendingComment = isPending
    ? `Marcado como pendiente desde la app web${
        auditorEmail ? ` por ${auditorEmail}` : ''
      }`
    : null;

  const { error: opError } = await supabase
    .from('inventory_count_operations')
    .insert({
      client_op_id: clientOpId,
      inventory_count_id: inventoryCountId,
      item_id: itemId,
      uom_id: uomId,
      is_weighted: isWeighted,
      basket_id: null,
      gross_qty: null,
      net_qty: netQty,
      is_pending: isPending,
      pending_comment: pendingComment,
      device_id: 'web', // etiqueta simple para identificar origen
    });

  if (opError) {
    // eslint-disable-next-line no-console
    console.error('[registerInventoryOperation] op insert error:', opError);
    throw new Error(
      opError.message ??
        'No se pudo registrar la operación de conteo en la base de datos'
    );
  }

  // 4) Upsert en inventory_count_lines (estado resumido por ítem/UoM)
  // Mapeo de estado de UI -> estado permitido en DB
  const dbStatus: 'counted' | 'pending' | 'ignored' =
    status === 'pending' ? 'pending' : 'counted';

  const { error: lineError } = await supabase
    .from('inventory_count_lines')
    .upsert(
      {
        inventory_count_id: inventoryCountId,
        item_id: itemId,
        uom_id: uomId,
        counted_qty: netQty,
        last_counted_at: new Date().toISOString(),
        status: dbStatus,
        status_comment:
          dbStatus === 'pending'
            ? 'Conteo marcado como pendiente desde app web'
            : null,
      },
      {
        onConflict: 'inventory_count_id,item_id,uom_id',
      }
    );

  if (lineError) {
    // eslint-disable-next-line no-console
    console.error('[registerInventoryOperation] line upsert error:', lineError);
    throw new Error(
      lineError.message ??
        'No se pudo actualizar la línea de conteo para este artículo'
    );
  }
}

export async function getOpenInventoryCountForWarehouse(
  warehouseId: number
): Promise<InventoryCount | null> {
  const { data, error } = await supabase
    .from('inventory_counts')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error al obtener jornada abierta:', error.message);
    return null;
  }

  return (data as InventoryCount) ?? null;
}

// =======================
// Nuevas funciones de auditoría (historial / revisión)
// =======================

/**
 * Devuelve una "lista de sesiones" por inventario (inventory_counts)
 * con info del almacén y un conteo básico de items auditados.
 */
export async function getInventoryAuditSessions(): Promise<AuditSession[]> {
  // 1) Traer todas las jornadas de inventario con su almacén
  const { data: counts, error } = await supabase
    .from('inventory_counts')
    .select(
      `
        id,
        status,
        started_at,
        created_at,
        warehouse_id,
        warehouses:warehouse_id (
          id,
          code,
          name
        )
      `
    )
    .order('created_at', { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching inventory_counts', error);
    throw error;
  }

  if (!counts || counts.length === 0) {
    return [];
  }

  const countIds = counts.map((c) => c.id as number);

  // 2) Conteo de líneas por jornada (items auditados)
  const { data: lines, error: linesError } = await supabase
    .from('inventory_count_lines')
    .select('id, inventory_count_id')
    .in('inventory_count_id', countIds);

  if (linesError) {
    // eslint-disable-next-line no-console
    console.error('Error fetching inventory_count_lines', linesError);
    throw linesError;
  }

  const linesByCountId = new Map<number, number>();
  for (const line of lines ?? []) {
    const current = linesByCountId.get(line.inventory_count_id as number) ?? 0;
    linesByCountId.set(line.inventory_count_id as number, current + 1);
  }

  const sessions: AuditSession[] = counts.map((c) => {
    const wh = (c as any).warehouses as {
      id: number;
      code: string;
      name: string;
    } | null;
    const { date, time } = formatDateTime(
      (c as any).started_at ?? (c as any).created_at
    );
    const itemsAudited = linesByCountId.get(c.id as number) ?? 0;

    return {
      id: c.id as number,
      date,
      time,
      warehouse: wh?.name ?? 'Almacén',
      warehouseCode: wh?.code ?? '',
      itemsAudited,
      status: mapDbStatusToUi((c.status ?? 'open') as DbInventoryCountStatus),
    };
  });

  return sessions;
}

/**
 * Devuelve la jornada abierta (o la última) de un almacén + items para revisión.
 */
export async function getWarehouseAuditForReview(
  warehouseCode: string
): Promise<{
  warehouse: WarehouseInfo | null;
  auditStatus: AuditStatus;
  items: AuditItem[];
  inventoryCountId: number | null;
}> {
  // 1) Buscar almacén por code
  const { data: warehouse, error: whError } = await supabase
    .from('warehouses')
    .select('id, code, name')
    .eq('code', warehouseCode)
    .maybeSingle();

  if (whError) {
    // eslint-disable-next-line no-console
    console.error('Error fetching warehouse', whError);
    throw whError;
  }

  if (!warehouse) {
    return {
      warehouse: null,
      auditStatus: 'pending',
      items: [],
      inventoryCountId: null,
    };
  }

  // 2) Buscar jornada de inventario (primero abierta; si no, la última)
  const { data: openCount, error: openErr } = await supabase
    .from('inventory_counts')
    .select('id, status, started_at, created_at')
    .eq('warehouse_id', warehouse.id)
    .eq('status', 'open')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openErr) {
    // eslint-disable-next-line no-console
    console.error('Error fetching open inventory_count', openErr);
    throw openErr;
  }

  let inventoryCount = openCount;

  if (!inventoryCount) {
    const { data: lastCount, error: lastErr } = await supabase
      .from('inventory_counts')
      .select('id, status, started_at, created_at')
      .eq('warehouse_id', warehouse.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr) {
      // eslint-disable-next-line no-console
      console.error('Error fetching last inventory_count', lastErr);
      throw lastErr;
    }

    inventoryCount = lastCount;
  }

  if (!inventoryCount) {
    // No hay jornadas aún
    return {
      warehouse: {
        id: warehouse.id as number,
        code: warehouse.code as string,
        name: warehouse.name as string,
      },
      auditStatus: 'pending',
      items: [],
      inventoryCountId: null,
    };
  }

  // 3) Traer líneas de conteo + info de artículo y uom
  const { data: lines, error: linesErr } = await supabase
    .from('inventory_count_lines')
    .select(
      `
        id,
        item_id,
        uom_id,
        counted_qty,
        status,
        status_comment,
        items:item_id (
          sku,
          name
        ),
        uoms:uom_id (
          code,
          name
        )
      `
    )
    .eq('inventory_count_id', inventoryCount.id)
    .order('id', { ascending: true });

  if (linesErr) {
    // eslint-disable-next-line no-console
    console.error('Error fetching inventory_count_lines', linesErr);
    throw linesErr;
  }

  const itemIds = (lines ?? []).map((l) => l.item_id as number);
  const uomIds = (lines ?? []).map((l) => l.uom_id as number);

  // 4) Traer stock del almacén para esos artículos/UoM desde la vista
  let stockByKey = new Map<string, number>();

  if (itemIds.length > 0) {
    const { data: stock, error: stockErr } = await supabase
      .from('vw_warehouse_stock')
      .select('item_id, uom_id, quantity')
      .eq('warehouse_id', warehouse.id)
      .in('item_id', itemIds)
      .in('uom_id', uomIds);

    if (stockErr) {
      // eslint-disable-next-line no-console
      console.error('Error fetching vw_warehouse_stock', stockErr);
      throw stockErr;
    }

    stockByKey = new Map(
      (stock ?? []).map((s) => [`${s.item_id}-${s.uom_id}`, Number(s.quantity)])
    );
  }

  const items: AuditItem[] =
    lines?.map((l) => {
      const key = `${l.item_id}-${l.uom_id}`;
      const systemQty = stockByKey.get(key) ?? 0;

      return {
        id: l.id as number,
        sku: (l as any).items?.sku ?? '',
        name: (l as any).items?.name ?? '',
        uom: (l as any).uoms?.code ?? '',
        countedQty: Number(l.counted_qty ?? 0),
        systemQty,
        status: mapDbItemStatusToUi(
          (l.status ?? 'counted') as 'pending' | 'counted' | 'ignored'
        ),
        comment: (l.status_comment as string | null) ?? undefined,
      };
    }) ?? [];

  return {
    warehouse: {
      id: warehouse.id as number,
      code: warehouse.code as string,
      name: warehouse.name as string,
    },
    auditStatus: mapDbStatusToUi(
      (inventoryCount.status ?? 'open') as DbInventoryCountStatus
    ),
    items,
    inventoryCountId: inventoryCount.id as number,
  };
}

/**
 * Guarda cambios de la revisión:
 * - Actualiza status de la jornada (inventory_counts)
 * - Actualiza estado/comentario de cada línea (inventory_count_lines)
 */
export async function saveWarehouseAuditChanges(params: {
  inventoryCountId: number;
  auditStatus: AuditStatus;
  items: AuditItem[];
}): Promise<void> {
  const { inventoryCountId, auditStatus, items } = params;

  const uiToDbStatus: Record<AuditStatus, DbInventoryCountStatus> = {
    in_progress: 'open',
    completed: 'closed',
    pending: 'open', // podrías cambiarlo a otro flujo si quieres
  };

  const dbStatus = uiToDbStatus[auditStatus];

  // 1) Actualizar inventario_counts
  const { error: countErr } = await supabase
    .from('inventory_counts')
    .update({ status: dbStatus })
    .eq('id', inventoryCountId);

  if (countErr) {
    // eslint-disable-next-line no-console
    console.error('Error updating inventory_counts', countErr);
    throw countErr;
  }

  if (items.length === 0) return;

  // 2) Actualizar líneas
  const payload = items.map((it) => ({
    id: it.id,
    status: mapUiItemStatusToDb(it.status),
    status_comment: it.comment ?? null,
    counted_qty: it.countedQty,
  }));

  const { error: linesErr } = await supabase
    .from('inventory_count_lines')
    .upsert(payload, { onConflict: 'id' });

  if (linesErr) {
    // eslint-disable-next-line no-console
    console.error('Error updating inventory_count_lines', linesErr);
    throw linesErr;
  }
}
