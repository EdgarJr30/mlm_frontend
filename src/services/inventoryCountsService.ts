// src/services/inventoryCountsService.ts
import { supabase } from '../lib/supabaseClient';

export type InventoryStatus = 'counted' | 'pending' | 'recount';

type EnsureOpenCountResult = {
  id: number;
};

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
    // PGRST116 = no rows found, en ese caso simplemente seguimos a crear
    console.error(
      '[ensureOpenInventoryCountForWarehouse] select error:',
      selectError
    );
  }

  if (existing?.id) {
    return { id: existing.id };
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
    console.error(
      '[ensureOpenInventoryCountForWarehouse] insert error:',
      insertError
    );
    throw new Error(
      insertError?.message ??
        'No se pudo crear la jornada de conteo para este almacén'
    );
  }

  return { id: inserted.id };
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
  // 1) Garantizar jornada abierta
  const { warehouseId, itemId, quantity, isWeighted, status, auditorEmail } =
    input;

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
    console.error('[registerInventoryOperation] item error:', itemError);
    throw new Error(
      itemError?.message ?? 'No se pudo obtener la unidad base del artículo'
    );
  }

  const uomId = item.base_uom_id;
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
    console.error('[registerInventoryOperation] line upsert error:', lineError);
    throw new Error(
      lineError.message ??
        'No se pudo actualizar la línea de conteo para este artículo'
    );
  }
}
