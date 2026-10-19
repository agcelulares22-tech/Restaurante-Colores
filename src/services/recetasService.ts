import { getActiveSupabaseClient, tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { RecetaEscandallo } from '../types';
import { INITIAL_RECETAS_ESCANDALLO } from '../data/initialData';
import { sheetsService } from './sheetsService';

export const recetasService = {
  async list(): Promise<RecetaEscandallo[]> {
    if (sheetsService.isConfigured()) {
      try {
        const rows = await sheetsService.getRows<RecetaEscandallo>('recetas_escandallo');
        if (rows && rows.length > 0) {
          return rows;
        }
      } catch (err) {
        console.warn('Sheets fetch for recetas_escandallo failed, falling back:', err);
      }
    }

    const client = tryGetActiveSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('recetas_escandallo').select('*').order('id_receta', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase recetas_escandallo fetch failed:', e);
      }
    }

    return INITIAL_RECETAS_ESCANDALLO;
  },

  async create(receta: RecetaEscandallo): Promise<RecetaEscandallo> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('recetas_escandallo').insert([receta]).select().single();
    if (error) {
      console.error('Error creating receta:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, receta: Partial<RecetaEscandallo>): Promise<RecetaEscandallo> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('recetas_escandallo').update(receta).eq('id_receta', id).select().single();
    if (error) {
      console.error('Error updating receta:', error);
      throw error;
    }
    return data;
  },

  async upsert(recetas: RecetaEscandallo[]): Promise<RecetaEscandallo[]> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('recetas_escandallo').upsert(recetas).select();
    if (error) {
      console.error('Error upserting recetas_escandallo:', error);
      throw error;
    }
    return data || [];
  },

  async remove(id: string): Promise<boolean> {
    const supabase = getActiveSupabaseClient();
    const { error } = await supabase.from('recetas_escandallo').delete().eq('id_receta', id);
    if (error) {
      console.error('Error deleting receta:', error);
      throw error;
    }
    return true;
  }
};
