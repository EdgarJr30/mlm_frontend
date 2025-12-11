/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/inventoryCountsService.ts
import { supabase } from '../lib/supabaseClient';
import type { InventoryCount, PendingReasonCode } from '../types/inventory';

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
  areaName: string | null;
  areaCode: string | null;
  isArea: boolean;
};

export type WarehouseInfo = {
  id: number;
  code: string;
  name: string;
  areaName?: string | null;
  areaCode?: string | null;
  isArea?: boolean;
};

export type AuditItem = {
  id: number; // id de inventory_count_lines
  itemId: number;
  uomId: number;
  sku: string;
  name: string;
  uom: string;
  countedQty: number;
  status: ItemStatus;
  comment?: string;
  pendingReasonCode?: PendingReasonCode;

  availableUoms?: Array<{
    id: number;
    code: string;
    name: string;
  }>;
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
  warehouseId: number,
  areaId?: number
): Promise<EnsureOpenCountResult> {
  // 1) Intentar buscar una jornada abierta existente
  let q = supabase
    .from('inventory_counts')
    .select('id, status')
    .eq('warehouse_id', warehouseId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1);

  if (typeof areaId === 'number') {
    q = q.eq('area_id', areaId);
  } else {
    // Conteos generales de almacén (sin área)
    q = q.is('area_id', null);
  }

  const { data: existing, error: selectError } = await q.maybeSingle();

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 = no rows found
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
      area_id: typeof areaId === 'number' ? areaId : null,
      name: `Conteo físico ${fecha}`,
      description: `Jornada creada desde app web el ${fecha}`,
      // status usa default 'open'
      planned_at: null,
      started_at: now.toISOString(),
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
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
  areaId?: number;
  itemId: number;
  uomId: number;
  warehouseItemId?: number;
  quantity: number;
  isWeighted: boolean;
  status: InventoryStatus; // 'counted' | 'pending' | 'recount'
  auditorEmail?: string;
  statusComment?: string;
  pendingReasonCode?: PendingReasonCode;
};

/**
 * Registra un conteo:
 * - Garantiza jornada abierta (inventory_counts)
 * - Obtiene la UoM configurada para el item en ese almacén (warehouse_items.uom_id)
 * - Inserta operación cruda (inventory_count_operations)
 * - Actualiza/resume línea (inventory_count_lines) ACUMULANDO la cantidad
 */
type WarehouseItemRow = {
  id: number;
  uom_id: number;
  quantity: string | number | null;
};

export async function registerInventoryOperation(
  input: RegisterInventoryOperationInput
): Promise<void> {
  const {
    warehouseId,
    areaId,
    itemId,
    uomId,
    warehouseItemId,
    quantity,
    isWeighted,
    status,
    auditorEmail,
    statusComment,
    pendingReasonCode,
  } = input;

  // 1) Garantizar jornada abierta
  const { id: inventoryCountId } = await ensureOpenInventoryCountForWarehouse(
    warehouseId,
    areaId
  );

  // 2) Obtener la fila de warehouse_items SIN ambigüedad
  let whItemData: WarehouseItemRow | null = null;
  let whItemError: unknown = null;

  if (typeof warehouseItemId === 'number') {
    // Si viene el id de warehouse_items, lo usamos directo
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('id, uom_id, quantity')
      .eq('id', warehouseItemId)
      .maybeSingle();

    whItemData = (data ?? null) as WarehouseItemRow | null;
    whItemError = error;
  } else {
    // Fallback: buscamos por (warehouse_id, item_id, uom_id)
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('id, uom_id, quantity')
      .eq('warehouse_id', warehouseId)
      .eq('item_id', itemId)
      .eq('uom_id', uomId)
      .maybeSingle();

    whItemData = (data ?? null) as WarehouseItemRow | null;
    whItemError = error;
  }

  if (whItemError || !whItemData) {
    console.error(
      '[registerInventoryOperation] warehouse_items error:',
      whItemError
    );
    throw new Error(
      'No existe configuración de stock para este artículo/UoM en este almacén'
    );
  }

  // Por seguridad, usamos siempre la UoM real de la fila de warehouse_items
  const effectiveUomId = whItemData.uom_id;
  const currentStockQty = Number(whItemData.quantity ?? 0);
  const netQty = quantity;

  // 3) Insertar operación cruda
  const clientOpId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const isPending = status === 'pending';

  const finalPendingComment = isPending
    ? statusComment?.trim() ||
      `Marcado como pendiente desde la app web${
        auditorEmail ? ` por ${auditorEmail}` : ''
      }`
    : null;

  const dbPendingReasonCode: PendingReasonCode | null = isPending
    ? pendingReasonCode ?? null
    : null;

  const { error: opError } = await supabase
    .from('inventory_count_operations')
    .insert({
      client_op_id: clientOpId,
      inventory_count_id: inventoryCountId,
      item_id: itemId,
      uom_id: effectiveUomId,
      is_weighted: isWeighted,
      basket_id: null,
      gross_qty: null,
      net_qty: netQty,
      is_pending: isPending,
      pending_comment: finalPendingComment,
      pending_reason_code: dbPendingReasonCode,
      device_id: 'web',
    });

  if (opError) {
    console.error('[registerInventoryOperation] op insert error:', opError);
    throw new Error(
      opError.message ??
        'No se pudo registrar la operación de conteo en la base de datos'
    );
  }

  // 4) Insertar SIEMPRE una línea nueva en inventory_count_lines
  const dbStatus: 'counted' | 'pending' | 'ignored' = isPending
    ? 'pending'
    : 'counted';

  const { error: lineError } = await supabase
    .from('inventory_count_lines')
    .insert({
      inventory_count_id: inventoryCountId,
      item_id: itemId,
      uom_id: effectiveUomId,
      counted_qty: netQty,
      last_counted_at: new Date().toISOString(),
      status: dbStatus,
      status_comment: dbStatus === 'pending' ? finalPendingComment : null,
      pending_reason_code: dbStatus === 'pending' ? dbPendingReasonCode : null,
    });

  if (lineError) {
    console.error('[registerInventoryOperation] line insert error:', lineError);
    throw new Error(
      lineError.message ??
        'No se pudo crear la línea de conteo para este artículo'
    );
  }

  // 5) Actualizar warehouse_items.quantity
  const newStockQty = currentStockQty + netQty;

  const { error: whUpdateError } = await supabase
    .from('warehouse_items')
    .update({ quantity: newStockQty })
    .eq('id', whItemData.id);

  if (whUpdateError) {
    console.error(
      '[registerInventoryOperation] warehouse_items update error:',
      whUpdateError
    );
    // Por ahora solo logueamos.
  }
}

export async function getOpenInventoryCountForWarehouse(
  warehouseId: number,
  areaId?: number
): Promise<InventoryCount | null> {
  let q = supabase
    .from('inventory_counts')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (typeof areaId === 'number') {
    q = q.eq('area_id', areaId);
  } else {
    q = q.is('area_id', null);
  }

  const { data, error } = await q.maybeSingle();

  if (error) {
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
        area_id,
        warehouses (
          id,
          code,
          name
        ),
        warehouse_areas (
          id,
          code,
          name
        )
      `
    )
    .order('created_at', { ascending: false });

  if (error) {
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

    const area = (c as any).warehouse_areas as {
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

      areaName: area?.name ?? null,
      areaCode: area?.code ?? null,
      isArea: !!area,
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

  // 3) Traer SOLO las líneas de conteo
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
        pending_reason_code
      `
    )
    .eq('inventory_count_id', inventoryCount.id)
    .order('id', { ascending: true });

  if (linesErr) {
    console.error('Error fetching inventory_count_lines', linesErr);
    throw linesErr;
  }

  const itemIds = (lines ?? []).map((l) => l.item_id as number);
  const uomIds = (lines ?? []).map((l) => l.uom_id as number);
  const uomsByItem = await getUomsForItems(itemIds);

  // 4) Traer descripción (SKU, nombre, UoM) desde la vista vw_warehouse_stock
  let descByKey = new Map<
    string,
    { sku: string; name: string; uomCode: string }
  >();

  if (itemIds.length > 0) {
    const { data: descRows, error: descErr } = await supabase
      .from('vw_warehouse_stock')
      .select('item_id, uom_id, item_sku, item_name, uom_code')
      .eq('warehouse_id', warehouse.id)
      .in('item_id', itemIds)
      .in('uom_id', uomIds);

    if (descErr) {
      console.error(
        'Error fetching vw_warehouse_stock for audit descriptions',
        descErr
      );
      throw descErr;
    }

    descByKey = new Map(
      (descRows ?? []).map((r) => [
        `${r.item_id}-${r.uom_id}`,
        {
          sku: (r.item_sku as string) ?? '',
          name: (r.item_name as string) ?? '',
          uomCode: (r.uom_code as string) ?? '',
        },
      ])
    );
  }

  // 5) Armar items finales para la UI (solo cantidad contada)
  const items: AuditItem[] =
    lines?.map((l) => {
      const key = `${l.item_id}-${l.uom_id}`;
      const desc = descByKey.get(key);
      const availableUoms = uomsByItem.get(l.item_id as number) ?? [];

      return {
        id: l.id as number,
        itemId: l.item_id as number,
        uomId: l.uom_id as number,
        sku: desc?.sku ?? '',
        name: desc?.name ?? '',
        uom: desc?.uomCode ?? '',
        countedQty: Number(l.counted_qty ?? 0),
        status: mapDbItemStatusToUi(
          (l.status ?? 'counted') as 'pending' | 'counted' | 'ignored'
        ),
        comment: (l.status_comment as string | null) ?? undefined,
        pendingReasonCode:
          (l.pending_reason_code as PendingReasonCode | null) ?? undefined,
        availableUoms,
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
    pending: 'open',
  };

  const dbStatus = uiToDbStatus[auditStatus];

  // 1) Actualizar inventory_counts (solo el status)
  const { error: countErr } = await supabase
    .from('inventory_counts')
    .update({ status: dbStatus })
    .eq('id', inventoryCountId);

  if (countErr) {
    console.error('Error updating inventory_counts', countErr);
    throw countErr;
  }

  if (items.length === 0) return;

  // 2) Actualizar SOLO estado, motivo y comentario de cada línea (NO tocamos counted_qty)
  const nowIso = new Date().toISOString();

  const updates = items.map((it) => {
    const isPending = it.status === 'pending';

    return supabase
      .from('inventory_count_lines')
      .update({
        uom_id: it.uomId,
        counted_qty: it.countedQty, // cantidad final ajustada
        last_counted_at: nowIso, // huella de cuándo se ajustó
        status: mapUiItemStatusToDb(it.status),
        status_comment: isPending ? it.comment ?? null : null,
        pending_reason_code: isPending ? it.pendingReasonCode ?? null : null,
      })
      .eq('id', it.id);
  });

  const results = await Promise.all(updates);

  const failed = results.find((r) => r.error);
  if (failed && failed.error) {
    console.error('Error updating inventory_count_lines', failed.error);
    throw failed.error;
  }
}

export async function getInventoryAuditById(inventoryCountId: number): Promise<{
  warehouse: WarehouseInfo | null;
  auditStatus: AuditStatus;
  items: AuditItem[];
  inventoryCountId: number | null;
}> {
  // 1) Traer la jornada + almacén
  const { data: count, error: countErr } = await supabase
    .from('inventory_counts')
    .select(
      `
      id,
      status,
      warehouse_id,
      area_id,
      warehouses (
        id,
        code,
        name
      ),
      warehouse_areas (
        id,
        code,
        name
      )
    `
    )
    .eq('id', inventoryCountId)
    .maybeSingle();

  if (countErr) {
    console.error('Error fetching inventory_count by id', countErr);
    throw countErr;
  }

  if (!count) {
    return {
      warehouse: null,
      auditStatus: 'pending',
      items: [],
      inventoryCountId: null,
    };
  }

  const wh = (count as any).warehouses as {
    id: number;
    code: string;
    name: string;
  } | null;

  const area = (count as any).warehouse_areas as {
    id: number;
    code: string;
    name: string;
  } | null;

  // 2) Traer líneas de esa jornada (igual que en getWarehouseAuditForReview)
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
        pending_reason_code
      `
    )
    .eq('inventory_count_id', count.id)
    .order('id', { ascending: true });

  if (linesErr) {
    console.error('Error fetching inventory_count_lines by id', linesErr);
    throw linesErr;
  }

  const itemIds = (lines ?? []).map((l) => l.item_id as number);
  const uomIds = (lines ?? []).map((l) => l.uom_id as number);
  const uomsByItem = await getUomsForItems(itemIds);

  let descByKey = new Map<
    string,
    { sku: string; name: string; uomCode: string }
  >();

  if (itemIds.length > 0) {
    const { data: descRows, error: descErr } = await supabase
      .from('vw_warehouse_stock')
      .select('item_id, uom_id, item_sku, item_name, uom_code')
      .eq('warehouse_id', wh?.id)
      .in('item_id', itemIds)
      .in('uom_id', uomIds);

    if (descErr) {
      console.error(
        'Error fetching vw_warehouse_stock for audit by id',
        descErr
      );
      throw descErr;
    }

    descByKey = new Map(
      (descRows ?? []).map((r) => [
        `${r.item_id}-${r.uom_id}`,
        {
          sku: (r.item_sku as string) ?? '',
          name: (r.item_name as string) ?? '',
          uomCode: (r.uom_code as string) ?? '',
        },
      ])
    );
  }

  const items: AuditItem[] =
    lines?.map((l) => {
      const key = `${l.item_id}-${l.uom_id}`;
      const desc = descByKey.get(key);
      const availableUoms = uomsByItem.get(l.item_id as number) ?? [];

      return {
        id: l.id as number,
        itemId: l.item_id as number,
        uomId: l.uom_id as number,
        sku: desc?.sku ?? '',
        name: desc?.name ?? '',
        uom: desc?.uomCode ?? '',
        countedQty: Number(l.counted_qty ?? 0),
        status: mapDbItemStatusToUi(
          (l.status ?? 'counted') as 'pending' | 'counted' | 'ignored'
        ),
        comment: (l.status_comment as string | null) ?? undefined,
        pendingReasonCode:
          (l.pending_reason_code as PendingReasonCode | null) ?? undefined,
        availableUoms,
      };
    }) ?? [];

  return {
    warehouse: wh
      ? {
          id: wh.id,
          code: wh.code,
          name: wh.name,
          areaName: area?.name ?? null,
          areaCode: area?.code ?? null,
          isArea: !!area,
        }
      : null,
    auditStatus: mapDbStatusToUi(
      (count.status ?? 'open') as DbInventoryCountStatus
    ),
    items,
    inventoryCountId: count.id as number,
  };
}

async function getUomsForItems(
  itemIds: number[]
): Promise<Map<number, Array<{ id: number; code: string; name: string }>>> {
  if (itemIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('item_uoms')
    .select(
      `
      item_id,
      uom_id,
      uoms ( id, code, name )
    `
    )
    .eq('is_active', true)
    .in('item_id', itemIds);

  if (error) {
    console.error('Error fetching item_uoms for audit', error);
    return new Map();
  }

  const map = new Map<
    number,
    Array<{ id: number; code: string; name: string }>
  >();

  for (const row of data ?? []) {
    const u = (row as any).uoms as {
      id: number;
      code: string;
      name: string;
    } | null;
    if (!u) continue;

    const list = map.get(row.item_id as number) ?? [];
    list.push({ id: u.id, code: u.code, name: u.name });
    map.set(row.item_id as number, list);
  }

  return map;
}
