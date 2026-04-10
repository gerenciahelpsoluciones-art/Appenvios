import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Clock, 
  ChevronRight,
  MoreVertical,
  Bike,
  Plus
} from 'lucide-react'
import { orderService } from '../services/orderService'

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await orderService.getOpenOrders()
        setOrders(data)
      } catch (err) {
        console.error('Error loading orders:', err)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="racing-title text-racing-orange">BOARD DE PITS</h1>
          <p className="text-racing-cream/40">Seguimiento de reparaciones activas</p>
        </div>
        <div className="flex gap-4">
           <div className="flex bg-white/5 p-1 rounded-lg">
              <button className="px-4 py-1.5 rounded-md bg-racing-orange text-white text-xs font-bold shadow-lg">ABIERTAS</button>
              <button className="px-4 py-1.5 rounded-md text-racing-cream/40 text-xs font-bold hover:text-white transition-colors">HISTORIAL</button>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-racing-cream/20" />
           <input 
             type="text" 
             placeholder="Buscar por placa, cliente o técnico..." 
             className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-racing-orange/50 transition-all font-medium text-sm"
           />
        </div>
        <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-racing-cream/40 hover:text-white transition-all flex items-center gap-2">
           <Filter size={18} />
           <span className="text-sm font-bold">FILTROS</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-racing-cream/40 uppercase text-xs font-bold font-racing tracking-widest">
              <tr>
                <th className="px-6 py-4">Orden ID</th>
                <th className="px-6 py-4">Moto & Placa</th>
                <th className="px-6 py-4">Técnico</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Entrada</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={6} className="h-16 bg-white/5 border-b border-white/5"></td></tr>)
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20 text-racing-cream/20 italic">No hay órdenes abiertas en este momento.</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-racing-orange">#{order.id.toString().slice(-4).toUpperCase()}</td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center font-bold text-[10px] text-racing-cream/40 px-1 truncate">
                          {order.trp_motos?.placa}
                        </div>
                        <div>
                          <p className="font-bold">{order.trp_motos?.marca} {order.trp_motos?.modelo}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-racing-cream/60">{order.tecnico_nombre || '---'}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase ${
                       order.estado === 'RECEPCION' ? 'bg-blue-500/10 text-blue-500' :
                       order.estado === 'PITS' ? 'bg-orange-500/10 text-orange-500' :
                       'bg-green-500/10 text-green-500'
                     }`}>
                        {order.estado}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-racing-cream/40 flex items-center gap-1">
                     <Clock size={14} />
                     {new Date(order.fecha_entrada).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button className="p-2 text-racing-cream/20 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        <MoreVertical size={18} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
