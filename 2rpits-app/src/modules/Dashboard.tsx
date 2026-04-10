import { useState, useEffect } from 'react'
import { 
  Gauge, 
  Bike,
  Timer,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Users
} from 'lucide-react'
import { dashboardService } from '../services/dashboardService'
import { orderService } from '../services/orderService'
import { motoService } from '../services/motoService'

export default function Dashboard() {
  const [stats, setStats] = useState({ activeOrders: 0, dayIncome: 0, avgTicket: 0 })
  const [orders, setOrders] = useState<any[]>([])
  const [maintenanceCount, setMaintenanceCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [dashStats, openOrders, motosMaint] = await Promise.all([
          dashboardService.getDashboardStats(),
          orderService.getOpenOrders(),
          motoService.getMotosNeedingMaintenance()
        ])
        setStats(dashStats)
        setOrders(openOrders)
        setMaintenanceCount(motosMaint.length)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="racing-title text-racing-orange">THE TRACK</h1>
          <p className="text-racing-cream/40">Resumen operativo de hoy en tiempo real</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
          <div className="text-right">
            <p className="text-xs font-bold text-racing-cream/30 uppercase tracking-widest">Estado de los Pits</p>
            <p className="text-xl font-bold font-racing italic">{orders.length} Unidades Activas</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-racing-orange/10 flex items-center justify-center text-racing-orange">
            <Timer size={24} className="animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos Entregadas', value: `$${stats.dayIncome.toLocaleString()}`, trend: 'Total hoy', color: 'from-orange-500/20' },
          { label: 'Ticket Promedio', value: `$${stats.avgTicket.toLocaleString()}`, trend: 'Proyectado', color: 'from-blue-500/20' },
          { label: 'Unidades en Taller', value: stats.activeOrders, trend: 'Carga actual', color: 'from-green-500/20' },
          { label: 'Mantenimientos', value: maintenanceCount, trend: 'Por avisar', color: 'from-red-500/20', alert: maintenanceCount > 0 },
        ].map((stat, i) => (
          <div key={i} className={`glass-card bg-gradient-to-br ${stat.color} to-transparent border-white/5 relative overflow-hidden`}>
            {stat.alert && (
               <div className="absolute top-0 right-0 p-2">
                 <div className="w-2 h-2 bg-racing-orange rounded-full animate-ping"></div>
               </div>
            )}
            <p className="text-[10px] font-bold uppercase tracking-widest text-racing-cream/30">{stat.label}</p>
            <p className="text-3xl font-bold mt-2 font-racing">{stat.value}</p>
            <div className="flex items-center gap-1 mt-2 text-racing-orange">
              <TrendingUp size={12} />
              <span className="text-[10px] font-bold uppercase">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Repair Board */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-racing italic tracking-wide">BOARD DE REPARACIÓN</h2>
            <span className="text-xs text-racing-cream/30 font-bold uppercase tracking-widest">En vivo</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse"></div>)
            ) : orders.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20 text-racing-cream/20 border-dashed border-2">
                <Bike size={48} className="mb-4 opacity-5" />
                <p className="font-racing text-xl">Sin motos en pits ahora mismo</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="glass-card flex items-center gap-6 hover:border-racing-orange/30 transition-all group cursor-pointer">
                   <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center font-bold text-racing-orange font-racing text-2xl shadow-inner border border-white/5">
                      {order.trp_motos?.placa?.slice(-3) || '---'}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-lg truncate uppercase tracking-tight">{order.trp_motos?.marca} {order.trp_motos?.modelo}</p>
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-racing-cream/40">{order.trp_motos?.placa}</span>
                      </div>
                      <p className="text-xs text-racing-cream/40 flex items-center gap-2">
                        <Users size={12} />
                        Técnico: <span className="text-racing-cream/60 font-medium">{order.tecnico_nombre || 'Asignando...'}</span>
                      </p>
                   </div>
                   <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                         <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${
                             order.estado === 'LISTO' ? 'bg-green-500/20 text-green-500' : 
                             order.estado === 'PITS' ? 'bg-racing-orange/20 text-racing-orange' : 
                             'bg-blue-500/20 text-blue-500'
                         }`}>
                            {order.estado}
                         </span>
                      </div>
                      <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${order.estado === 'LISTO' ? 'bg-green-500' : 'bg-racing-orange'} transition-all duration-1000`} style={{ width: order.estado === 'LISTO' ? '100%' : order.estado === 'PITS' ? '60%' : '20%' }}></div>
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Actions/Promos */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-racing italic tracking-wide">PROMOCIONES</h2>
          </div>
          <div className="glass-card racing-gradient border-none overflow-hidden relative p-8 group cursor-pointer">
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">OFERTA TUNING</p>
              <h3 className="text-3xl font-racing font-bold mt-2 text-white italic">COMBO RACING</h3>
              <p className="text-sm mt-3 text-white/90 leading-relaxed font-medium">Aceite Sintético + Filtro K&N + Diagnóstico computarizado.</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-2xl font-bold text-white">$185.000</span>
                <div className="p-2 bg-white rounded-lg text-racing-orange shadow-lg transform group-hover:translate-x-1 transition-transform">
                   <CheckCircle2 size={24} />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform">
               <Gauge size={160} />
            </div>
          </div>

          <div className="glass-card border-racing-orange/20 bg-racing-orange/5">
             <div className="flex items-center gap-2 text-racing-orange mb-4">
               <AlertCircle size={18} />
               <h3 className="font-bold text-sm tracking-widest uppercase"> ALERTAS DE STOCK</h3>
             </div>
             <div className="space-y-4">
                {[
                  { name: 'Aceite Motul 7100 4T', stock: 3, min: 10 },
                  { name: 'Pastillas Brembo Sinter', stock: 1, min: 5 }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                    <div>
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-[10px] text-racing-cream/30 uppercase tracking-widest">Stock bajo</p>
                    </div>
                    <div className="text-right">
                       <span className="text-racing-danger font-bold font-mono text-lg">{item.stock}</span>
                       <span className="text-[10px] text-racing-cream/30 ml-1">U.</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
