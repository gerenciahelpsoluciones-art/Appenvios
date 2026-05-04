import { supabase } from '../lib/supabaseClient'
import { startOfDay, endOfDay } from 'date-fns'

export const dashboardService = {
  async getDashboardStats() {
    const todayStart = startOfDay(new Date()).toISOString()
    const todayEnd = endOfDay(new Date()).toISOString()

    const { data: orders, error: ordersErr } = await supabase
      .from('trp_ordenes')
      .select('total, estado, fecha_salida')
    
    if (ordersErr) throw ordersErr

    const activeOrders = orders.filter(o => o.estado !== 'ENTREGADO').length
    
    // Filter income for TODAY only
    const dayIncome = orders
      .filter(o => 
        o.estado === 'ENTREGADO' && 
        o.fecha_salida && 
        o.fecha_salida >= todayStart && 
        o.fecha_salida <= todayEnd
      )
      .reduce((acc, curr) => acc + (curr.total || 0), 0)

    const deliveredCount = orders.filter(o => o.estado === 'ENTREGADO').length

    return {
      activeOrders,
      dayIncome,
      avgTicket: deliveredCount > 0 ? dayIncome / deliveredCount : 0
    }
  }
}
