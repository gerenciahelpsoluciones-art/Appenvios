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
    // Fetch thresholds from config
    const { data: configData } = await supabase
      .from('trp_config')
      .select('*')
      .eq('key', 'maintenance_rules')
      .single()

    const thresholds = configData?.value || { days_threshold: 120, km_threshold: 3000 }
    
    const { data, error } = await supabase
      .from('trp_motos')
      .select('*')
    
    if (error) throw error

    const timeThreshold = new Date()
    timeThreshold.setDate(timeThreshold.getDate() - (thresholds.days_threshold || 120))

    return data
      .map(moto => {
        const lastService = new Date(moto.last_service_date || moto.created_at)
        const needsByTime = lastService < timeThreshold
        const kmSinceService = (moto.kilometraje || 0) - (moto.last_service_km || 0)
        const needsByKm = kmSinceService >= (thresholds.km_threshold || 3000)
        
        return {
          ...moto,
          needsByTime,
          needsByKm,
          kmSinceService
        }
      })
      .filter(moto => moto.needsByTime || moto.needsByKm)
  }
}
