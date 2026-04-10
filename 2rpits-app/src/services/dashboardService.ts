import { supabase } from '../lib/supabaseClient'

export const dashboardService = {
  async getDashboardStats() {
    const { data: orders, error: ordersErr } = await supabase
      .from('trp_ordenes')
      .select('total, estado')
    
    if (ordersErr) throw ordersErr

    const activeOrders = orders.filter(o => o.estado !== 'ENTREGADO').length
    const dayIncome = orders
      .filter(o => o.estado === 'ENTREGADO') // Simple logic for mock stats
      .reduce((acc, curr) => acc + (curr.total || 0), 0)

    return {
      activeOrders,
      dayIncome,
      avgTicket: dayIncome / (orders.length || 1)
    }
  }
}
