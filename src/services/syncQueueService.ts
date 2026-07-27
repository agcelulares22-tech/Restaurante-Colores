import { getActiveSupabaseClient } from '../lib/supabaseClient';
import { Pedido, Merma } from '../types';
import { Factura } from './facturacionService';

export interface SyncQueueItem {
  id: string;
  action: 'upsert_pedido' | 'upsert_factura' | 'create_merma' | 'update_pedido_estado';
  payload: any;
  timestamp: string;
  attempts: number;
}

const QUEUE_KEY = 'colores_pizzeria_offline_sync_queue';

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
    queue.push(item);
    this.saveQueue(queue);

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

    // Dynamically import services to avoid circular dependency
    const { pedidosService } = await import('./pedidosService');
    const { facturacionService } = await import('./facturacionService');
    const { mermasService } = await import('./mermasService');

    for (const item of queue) {
      item.attempts += 1;
      let success = false;

      try {
        if (item.action === 'upsert_pedido') {
          const rawId = item.payload?.id_pedido ?? item.payload?.id;
          const { sanitizePedidoId } = await import('./pedidosService');
          const cleanId = sanitizePedidoId(rawId);
          if (!cleanId) {
            console.warn(`SyncQueue: Tarea ${item.id} descartada por ID no numérico inválido "${rawId}"`);
            success = true;
          } else {
            const cleanPayload = { ...item.payload, id_pedido: String(cleanId) };
            if (cleanPayload.is_accumulation) {
              await pedidosService.agregarItemsAComandaExistente(cleanPayload.id_pedido, cleanPayload.items, true);
            } else {
              await pedidosService.upsert([cleanPayload], true);
            }
            success = true;
          }
        } else if (item.action === 'upsert_factura') {
          await facturacionService.upsert([item.payload], true);
          success = true;
        } else if (item.action === 'create_merma') {
          await mermasService.create(item.payload);
          success = true;
        } else if (item.action === 'update_pedido_estado') {
          const rawId = item.payload?.id ?? item.payload?.id_pedido;
          const { sanitizePedidoId } = await import('./pedidosService');
          const cleanId = sanitizePedidoId(rawId);
          if (!cleanId) {
            console.warn(`SyncQueue: Tarea ${item.id} descartada por ID no numérico inválido "${rawId}"`);
            success = true;
          } else {
            await pedidosService.update(String(cleanId), item.payload?.fields || item.payload, true);
            success = true;
          }
        }
      } catch (err) {
        console.error(`SyncQueue: Failed synchronization attempt #${item.attempts} for task ${item.id}:`, err);
      }

      if (success) {
        console.log(`SyncQueue: Task ${item.id} (${item.action}) successfully synchronized.`);
      } else {
        // Keep in queue if it hasn't exceeded 2 attempts
        if (item.attempts < 2) {
          remaining.push(item);
        } else {
          console.warn(`SyncQueue: Tarea ${item.id} descartada tras 2 reintentos para no bloquear la cola.`);
        }
      }
    }

    this.saveQueue(remaining);
  },

  clearQueue(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(QUEUE_KEY);
    window.dispatchEvent(new CustomEvent('sync-queue-changed'));
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
