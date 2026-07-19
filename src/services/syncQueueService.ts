import { getActiveSupabaseClient } from '../lib/supabaseClient';
import { Pedido, Merma } from '../types';
import { Factura } from './facturacionService';

export interface SyncQueueItem {
  id: string;
  action: 'upsert_pedido' | 'upsert_factura' | 'create_merma' | 'update_pedido_estado';
  payload: any;
  timestamp: string;
  attempts: number;
  lastError?: string;
}

const QUEUE_KEY = 'colores_pizzeria_offline_sync_queue';
let processingPromise: Promise<void> | null = null;

const getPedidoIdentity = (payload: any): string => String(
  payload?.idempotency_key || payload?.id_pedido || ''
);

const getFacturaIdentity = (payload: any): string => String(payload?.id_factura || '');

export const mergeQueueItem = (queue: SyncQueueItem[], incoming: SyncQueueItem): SyncQueueItem[] => {
  if (incoming.action === 'upsert_pedido') {
    const identity = getPedidoIdentity(incoming.payload);
    if (identity) {
      const existingIndex = queue.findIndex(item => (
        item.action === 'upsert_pedido' && getPedidoIdentity(item.payload) === identity
      ));
      if (existingIndex >= 0) {
        const next = [...queue];
        next[existingIndex] = {
          ...incoming,
          attempts: 0,
        };
        return next;
      }
    }
  }
  if (incoming.action === 'upsert_factura') {
    const identity = getFacturaIdentity(incoming.payload);
    if (identity) {
      const existingIndex = queue.findIndex(item => (
        item.action === 'upsert_factura' && getFacturaIdentity(item.payload) === identity
      ));
      if (existingIndex >= 0) {
        const next = [...queue];
        next[existingIndex] = { ...incoming, attempts: 0 };
        return next;
      }
    }
  }
  return [...queue, incoming];
};

export const mergeQueueAfterProcessing = (
  latestQueue: SyncQueueItem[],
  processedIds: Set<string>,
  failedItems: SyncQueueItem[],
): SyncQueueItem[] => {
  const newlyQueued = latestQueue.filter(item => !processedIds.has(item.id));
  return [...failedItems, ...newlyQueued];
};

export const syncQueueService = {
  getQueue(): SyncQueueItem[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  saveQueue(queue: SyncQueueItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('sync-queue-changed'));
  },

  enqueue(action: SyncQueueItem['action'], payload: any): void {
    const queue = this.getQueue();
    const item: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action,
      payload,
      timestamp: new Date().toISOString(),
      attempts: 0
    };
    this.saveQueue(mergeQueueItem(queue, item));

    // Trigger immediate background sync check
    this.processQueue().catch(err => console.warn('Immediate sync try failed:', err));
  },

  async isOnline(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    // Deep network check: test connection to Supabase
    try {
      const supabase = getActiveSupabaseClient();
      const { error } = await supabase.from('mesas').select('id_mesa').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  async processQueue(): Promise<void> {
    if (processingPromise) return processingPromise;
    processingPromise = this.processQueueOnce().finally(() => {
      processingPromise = null;
    });
    return processingPromise;
  },

  async processQueueOnce(): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    // Check if network is online
    const online = await this.isOnline();
    if (!online) {
      console.log('SyncQueue: Device is offline. post-poning sync.');
      return;
    }

    console.log(`SyncQueue: Found ${queue.length} pending items to synchronize.`);
    const remaining: SyncQueueItem[] = [];
    const processedIds = new Set<string>();

    // Dynamically import services to avoid circular dependency
    const { pedidosService } = await import('./pedidosService');
    const { facturacionService } = await import('./facturacionService');
    const { mermasService } = await import('./mermasService');

    for (const item of queue) {
      processedIds.add(item.id);
      item.attempts += 1;
      let success = false;

      try {
        if (item.action === 'upsert_pedido') {
          if (item.payload.is_accumulation) {
            await pedidosService.agregarItemsAComandaExistente(item.payload.id_pedido, item.payload.items, true);
          } else {
            // Serialize and push header & details
            await pedidosService.upsert([item.payload], true);
          }
          success = true;
        } else if (item.action === 'upsert_factura') {
          await facturacionService.upsert([item.payload], true);
          success = true;
        } else if (item.action === 'create_merma') {
          await mermasService.create(item.payload);
          success = true;
        } else if (item.action === 'update_pedido_estado') {
          await pedidosService.update(item.payload.id, item.payload.fields, true);
          success = true;
        }
      } catch (err) {
        item.lastError = err instanceof Error ? err.message : String(err);
        console.error(`SyncQueue: Failed synchronization attempt #${item.attempts} for task ${item.id}:`, err);
      }

      if (success) {
        console.log(`SyncQueue: Task ${item.id} (${item.action}) successfully synchronized.`);
      } else {
        // Never discard an unsynchronized commercial operation automatically.
        item.attempts = Math.min(item.attempts, 50);
        remaining.push(item);
        if (item.attempts >= 50) console.error(`SyncQueue: Task ${item.id} requires manual attention and remains queued.`);
      }
    }

    // Preserve items enqueued while this processing pass was in flight.
    this.saveQueue(mergeQueueAfterProcessing(this.getQueue(), processedIds, remaining));
  },

  initBackgroundSync(): void {
    if (typeof window === 'undefined') return;

    // Listen to network change events reactively
    window.addEventListener('online', () => {
      console.log('SyncQueue: Network restored! Retrying sync...');
      this.processQueue().catch(err => console.error('Error in online event sync:', err));
    });

    // Run interval check every 20 seconds
    setInterval(() => {
      this.processQueue().catch(err => console.error('Error in periodic sync:', err));
    }, 20000);
  }
};
