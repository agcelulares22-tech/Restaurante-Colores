import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';

export interface PedidoDeliveryRapido {
  id: number;
  nombre_cliente: string;
  pedido: string;
  direccion: string;
  telefono: string;
  estado: 'nuevo' | 'horno' | 'delivery' | 'entregado';
  created_at: string;
}

export const pedidosDeliveryRapidoService = {
  async list(): Promise<PedidoDeliveryRapido[]> {
    const supabase = tryGetActiveSupabaseClient();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('pedidos_delivery_rapido')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error listing quick delivery orders:', err);
      return [];
    }
  },

  async create(pedido: Omit<PedidoDeliveryRapido, 'id' | 'created_at'>): Promise<PedidoDeliveryRapido | null> {
    const supabase = tryGetActiveSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('pedidos_delivery_rapido')
        .insert([pedido])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating quick delivery order:', err);
      return null;
    }
  },

  async updateEstado(id: number, estado: PedidoDeliveryRapido['estado']): Promise<boolean> {
    const supabase = tryGetActiveSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('pedidos_delivery_rapido')
        .update({ estado })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating quick delivery order status:', err);
      return false;
    }
  },

  subscribe(callback: (payload: any) => void) {
    const supabase = tryGetActiveSupabaseClient();
    if (!supabase) return null;
    try {
      const channel = supabase
        .channel('realtime:pedidos_delivery_rapido')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_delivery_rapido' }, callback)
        .subscribe();
      return channel;
    } catch (err) {
      console.warn('Failed to subscribe to quick delivery orders:', err);
      return null;
    }
  }
};
