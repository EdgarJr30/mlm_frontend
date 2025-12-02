// src/offline/inventoryOfflineService.ts
import { openDB, type IDBPDatabase } from 'idb';
import {
  registerInventoryOperation,
  ensureOpenInventoryCountForWarehouse,
  type RegisterInventoryOperationInput,
  type InventoryStatus,
} from '../services/inventoryCountsService';

const DB_NAME = 'inventory-offline';
const DB_VERSION = 2;
const STORE_OPS = 'inventory_ops';
const STORE_SESSIONS = 'inventory_sessions';

// Motivos de pendiente que usas en el form
export type PendingReasonCode = 'UOM_DIFFERENT' | 'REVIEW';

export type LocalInventoryOperation = {
  clientOpId: string;
  inventoryCountId: number;
  payload: Omit<
    RegisterInventoryOperationInput,
    'inventoryCountId' | 'clientOpId'
  >;
  syncStatus: 'pending' | 'synced' | 'error';
  errorMessage?: string | null;
  createdAt: number;
  updatedAt: number;
};

export type LocalInventorySession = {
  warehouseId: number;
  inventoryCountId: number;
  createdAt: number;
  lastUsedAt: number;
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store de operaciones
        if (!db.objectStoreNames.contains(STORE_OPS)) {
          const store = db.createObjectStore(STORE_OPS, {
            keyPath: 'clientOpId',
          });
          store.createIndex('by_status', 'syncStatus', { unique: false });
        }

        // Store de sesiones por almacén
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          db.createObjectStore(STORE_SESSIONS, {
            keyPath: 'warehouseId',
          });
        }
      },
    });
  }
  return dbPromise;
}

// ===============================
// 1) COLA OFFLINE
// ===============================

export async function queueInventoryOperationForSync(params: {
  clientOpId: string;
  inventoryCountId: number;
  payload: Omit<
    RegisterInventoryOperationInput,
    'inventoryCountId' | 'clientOpId'
  >;
}) {
  const db = await getDb();
  const now = Date.now();

  const record: LocalInventoryOperation = {
    clientOpId: params.clientOpId,
    inventoryCountId: params.inventoryCountId,
    payload: params.payload,
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await db.put(STORE_OPS, record);
}

// ===============================
// 2) SYNC CON SUPABASE
// ===============================

export async function syncPendingInventoryOperations() {
  const db = await getDb();

  const tx = db.transaction(STORE_OPS, 'readwrite');
  const store = tx.objectStore(STORE_OPS);
  const index = store.index('by_status');

  let cursor = await index.openCursor('pending');

  while (cursor) {
    const op = cursor.value as LocalInventoryOperation;

    try {
      await registerInventoryOperation({
        ...op.payload,
        inventoryCountId: op.inventoryCountId,
        clientOpId: op.clientOpId,
      });

      op.syncStatus = 'synced';
      op.errorMessage = null;
      op.updatedAt = Date.now();
      await cursor.update(op);
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Error desconocido al sincronizar';

      console.error('[syncPendingInventoryOperations] Error:', msg);

      op.syncStatus = 'error';
      op.errorMessage = msg;
      op.updatedAt = Date.now();
      await cursor.update(op);
    }

    cursor = await cursor.continue();
  }

  await tx.done;
}

export async function retryErroredInventoryOperations() {
  const db = await getDb();

  const tx = db.transaction(STORE_OPS, 'readwrite');
  const store = tx.objectStore(STORE_OPS);
  const index = store.index('by_status');

  let cursor = await index.openCursor('error');

  while (cursor) {
    const op = cursor.value as LocalInventoryOperation;
    op.syncStatus = 'pending';
    op.updatedAt = Date.now();
    await cursor.update(op);
    cursor = await cursor.continue();
  }

  await tx.done;
  // Luego se llama a syncPendingInventoryOperations()
}

// ===============================
// 3) SESIONES POR ALMACÉN (JORNADA)
// ===============================

export async function getInventorySession(
  warehouseId: number
): Promise<LocalInventorySession | null> {
  const db = await getDb();
  const session = (await db.get(STORE_SESSIONS, warehouseId)) as
    | LocalInventorySession
    | undefined;

  if (!session) return null;

  session.lastUsedAt = Date.now();
  await db.put(STORE_SESSIONS, session);

  return session;
}

export async function saveInventorySession(params: {
  warehouseId: number;
  inventoryCountId: number;
}) {
  const db = await getDb();
  const now = Date.now();

  const record: LocalInventorySession = {
    warehouseId: params.warehouseId,
    inventoryCountId: params.inventoryCountId,
    createdAt: now,
    lastUsedAt: now,
  };

  await db.put(STORE_SESSIONS, record);
}

export async function clearInventorySession(warehouseId: number) {
  const db = await getDb();
  await db.delete(STORE_SESSIONS, warehouseId);
}

// ===============================
// 4) Helper para clientOpId
// ===============================

function generateClientOpId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ===============================
// 5) API PRINCIPAL PARA LOS FORMS
// ===============================

export async function submitInventoryOperationWithOfflineSupport(params: {
  warehouseId: number;
  itemId: number;
  quantity: number;
  isWeighted: boolean;
  status: InventoryStatus;
  auditorEmail?: string;
  statusComment?: string;
  pendingReasonCode?: PendingReasonCode;
  deviceId?: string;
}) {
  const {
    warehouseId,
    itemId,
    quantity,
    isWeighted,
    status,
    auditorEmail,
    statusComment,
    pendingReasonCode,
    deviceId,
  } = params;

  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // 1) Buscar sesión local
  const session = await getInventorySession(warehouseId);
  let inventoryCountId = session?.inventoryCountId;

  // 2) Si no hay sesión y estamos online → crear jornada
  if (!inventoryCountId && online) {
    const { id } = await ensureOpenInventoryCountForWarehouse(warehouseId);
    inventoryCountId = id;
    await saveInventorySession({ warehouseId, inventoryCountId });
  }

  // 3) Sin sesión y offline → error (hay que haber abierto con conexión antes)
  if (!inventoryCountId && !online) {
    throw new Error(
      'No existe una jornada de conteo abierta para este almacén en este dispositivo. ' +
        'Abre la jornada con conexión antes de continuar sin internet.'
    );
  }

  const clientOpId = generateClientOpId();

  const basePayload: Omit<
    RegisterInventoryOperationInput,
    'inventoryCountId' | 'clientOpId'
  > = {
    warehouseId,
    itemId,
    quantity,
    isWeighted,
    status,
    auditorEmail,
    statusComment,
    pendingReasonCode,
    deviceId,
  };

  if (online) {
    await registerInventoryOperation({
      ...basePayload,
      inventoryCountId: inventoryCountId as number,
      clientOpId,
    });
  } else {
    await queueInventoryOperationForSync({
      clientOpId,
      inventoryCountId: inventoryCountId as number,
      payload: basePayload,
    });
  }
}

// ===============================
// 6) SUMMARY PARA LA UI OFFLINE
// ===============================

export async function getOfflineInventoryOpsSummary(): Promise<{
  pending: number;
  error: number;
  synced: number;
  total: number;
}> {
  const db = await getDb();
  const tx = db.transaction(STORE_OPS, 'readonly');
  const store = tx.objectStore(STORE_OPS);
  const index = store.index('by_status');

  const [pendingOps, errorOps, syncedOps, total] = await Promise.all([
    index.getAllKeys('pending'),
    index.getAllKeys('error'),
    index.getAllKeys('synced'),
    store.count(),
  ]);

  await tx.done;

  const pending = pendingOps.length;
  const error = errorOps.length;
  const synced = syncedOps.length;

  return {
    pending,
    error,
    synced,
    total,
  };
}

export async function listOfflineInventoryOpsByStatus(
  status: LocalInventoryOperation['syncStatus'],
  limit = 50
): Promise<LocalInventoryOperation[]> {
  const db = await getDb();
  const tx = db.transaction(STORE_OPS, 'readonly');
  const store = tx.objectStore(STORE_OPS);
  const index = store.index('by_status');

  const results: LocalInventoryOperation[] = [];
  let cursor = await index.openCursor(status);

  while (cursor && results.length < limit) {
    results.push(cursor.value as LocalInventoryOperation);
    cursor = await cursor.continue();
  }

  await tx.done;
  return results;
}

// ===============================
// 7) SETUP GLOBAL (main.tsx)
// ===============================

export function setupInventoryOfflineSync() {
  if (typeof window === 'undefined') return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.__inventoryOfflineSyncSetup) {
    return;
  }
  w.__inventoryOfflineSyncSetup = true;

  const runSync = async () => {
    if (!navigator.onLine) return;
    try {
      console.log(
        '[offline] Sincronizando operaciones de inventario pendientes…'
      );
      await syncPendingInventoryOperations();
      console.log('[offline] Sincronización de inventario completada');
    } catch (err) {
      console.error('[offline] Error al sincronizar inventario:', err);
    }
  };

  // Sync inicial si hay internet
  if (navigator.onLine) {
    void runSync();
  }

  // Sync cada vez que vuelve la conexión
  window.addEventListener('online', () => {
    void runSync();
  });
}
