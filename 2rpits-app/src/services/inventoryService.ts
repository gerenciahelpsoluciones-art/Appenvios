import { supabase } from '../lib/supabaseClient'

export const inventoryService = {
  async getProducts() {
    const { data, error } = await supabase
      .from('trp_productos')
      .select('*')
      .order('nombre', { ascending: true })
    if (error) throw error
    return data
  },

  async getCombos() {
    const { data, error } = await supabase
      .from('trp_combos')
      .select('*, trp_combo_items(*)')
    if (error) throw error
    return data
  },

  async updateStock(id: string, newStock: number) {
    const { data, error } = await supabase
      .from('trp_productos')
      .update({ stock: newStock })
      .eq('id', id)
    if (error) throw error
    return data
  }
}
