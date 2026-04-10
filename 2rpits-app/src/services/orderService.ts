import { supabase } from '../lib/supabaseClient'

export const orderService = {
  async getOpenOrders() {
    const { data, error } = await supabase
      .from('trp_ordenes')
      .select('*, trp_motos(*)')
      .neq('estado', 'ENTREGADO')
      .order('fecha_entrada', { ascending: false })
    if (error) throw error
    return data
  },

  async createOrder(motoData: any, orderData: any) {
    // 1. Check/Create Moto
    let motoId = motoData.id
    if (!motoId) {
      const { data: newMoto, error: motoErr } = await supabase
        .from('trp_motos')
        .upsert({ 
          placa: motoData.placa.toUpperCase(),
          marca: motoData.marca,
          modelo: motoData.modelo,
          kilometraje: motoData.kilometraje,
          cliente_nombre: motoData.cliente_nombre,
          cliente_telefono: motoData.cliente_telefono
        })
        .select()
        .single()
      if (motoErr) throw motoErr
      motoId = newMoto.id
    }

    // 2. Create Order
    const { data: order, error: orderErr } = await supabase
      .from('trp_ordenes')
      .insert({
        moto_id: motoId,
        estado: 'RECEPCION',
        observaciones_cliente: orderData.observaciones,
        tecnico_nombre: orderData.tecnico
      })
      .select()
      .single()
    
    if (orderErr) throw orderErr
    return order
  },

  async updateOrderStatus(id: string, status: string) {
    const { data: order, error: fetchErr } = await supabase
      .from('trp_ordenes')
      .select('*, trp_motos(id, kilometraje)')
      .eq('id', id)
      .single()
    
    if (fetchErr) throw fetchErr

    const { data, error } = await supabase
      .from('trp_ordenes')
      .update({ 
        estado: status,
        fecha_salida: status === 'ENTREGADO' ? new Date().toISOString() : null
      })
      .eq('id', id)
    
    if (error) throw error

    // Special logic for reminders: Update moto stats if delivered
    if (status === 'ENTREGADO' && order?.trp_motos) {
      await supabase
        .from('trp_motos')
        .update({
          last_service_date: new Date().toISOString(),
          last_service_km: order.trp_motos.kilometraje
        })
        .eq('id', order.trp_motos.id)
    }

    return data
  }
}
