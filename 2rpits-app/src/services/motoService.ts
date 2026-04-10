import { supabase } from '../lib/supabaseClient'

export const motoService = {
  async getAllMotos() {
    const { data, error } = await supabase
      .from('trp_motos')
      .select('*')
      .order('last_service_date', { ascending: true })
    if (error) throw error
    return data
  },

  async getMotosNeedingMaintenance() {
    const { data, error } = await supabase
      .from('trp_motos')
      .select('*')
    
    if (error) throw error

    const fourMonthsAgo = new Date()
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4)

    return data.filter(moto => {
      const lastService = new Date(moto.last_service_date || moto.created_at)
      const needsByTime = lastService < fourMonthsAgo
      const kmSinceService = (moto.kilometraje || 0) - (moto.last_service_km || 0)
      const needsByKm = kmSinceService >= 3000
      
      return needsByTime || needsByKm
    })
  }
}
