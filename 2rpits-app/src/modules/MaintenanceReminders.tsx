import { useState, useEffect } from 'react'
import { 
  Bell, 
  Bike, 
  Calendar, 
  Gauge, 
  MessageSquare, 
  Clock,
  ArrowRight,
  TrendingUp,
  History
} from 'lucide-react'
import { motoService } from '../services/motoService'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default function MaintenanceReminders() {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReminders() {
      try {
        const data = await motoService.getMotosNeedingMaintenance()
        setReminders(data)
      } catch (err) {
        console.error('Error loading reminders:', err)
      } finally {
        setLoading(false)
      }
    }
    loadReminders()
  }, [])

  const sendWhatsApp = (moto: any) => {
    const message = `Hola ${moto.cliente_nombre}! 👋 Te saludamos de 2Rpits Pits. Notamos que tu ${moto.marca} ${moto.modelo} (${moto.placa}) ya está lista para su mantenimiento preventivo. ¿Te gustaría agendar una cita? 🏍️🏁`
    const url = `https://wa.me/${moto.cliente_telefono?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="racing-title text-racing-orange">THE PIT WALL</h1>
          <p className="text-racing-cream/40">Motos que requieren atención preventiva inmediata</p>
        </div>
        <div className="flex items-center gap-3 bg-racing-orange/10 px-4 py-2 rounded-lg border border-racing-orange/20">
          <Bell className="text-racing-orange animate-bounce" size={20} />
          <span className="font-racing font-bold text-xl">{reminders.length} Pendientes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse"></div>)
        ) : reminders.length === 0 ? (
          <div className="lg:col-span-3 glass-card flex flex-col items-center justify-center py-32 text-racing-cream/20">
            <History size={64} className="mb-4 opacity-10" />
            <p className="font-racing text-2xl uppercase italic">Todo el parque automotor está al día</p>
            <p className="text-sm mt-2 opacity-50 uppercase tracking-widest font-bold">Excelente gestión de taller</p>
          </div>
        ) : (
          reminders.map((moto) => {
            const lastService = new Date(moto.last_service_date || moto.created_at)
            const kmSince = (moto.kilometraje || 0) - (moto.last_service_km || 0)
            const needsByTime = (new Date().getTime() - lastService.getTime()) > (120 * 24 * 60 * 60 * 1000)

            return (
              <div key={moto.id} className="glass-card relative overflow-hidden group hover:border-racing-orange/40 transition-all">
                <div className="absolute top-0 right-0 p-3">
                   {needsByTime ? (
                     <div className="flex items-center gap-1 text-racing-danger bg-racing-danger/10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
                       <Clock size={10} /> Tiempo Vencido
                     </div>
                   ) : (
                     <div className="flex items-center gap-1 text-racing-orange bg-racing-orange/10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
                       <TrendingUp size={10} /> Km Vencido
                     </div>
                   )}
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center text-racing-orange shrink-0">
                    <Bike size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl uppercase tracking-tighter">{moto.marca} {moto.modelo}</h3>
                    <p className="text-xs text-racing-cream/40 font-mono tracking-widest">{moto.placa}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6 bg-black/20 p-4 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-racing-cream/40 flex items-center gap-2"><Calendar size={14}/> Último Servicio</span>
                    <span className="font-bold">{formatDistanceToNow(lastService, { addSuffix: true, locale: es })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-racing-cream/40 flex items-center gap-2"><Gauge size={14}/> Uso Reciente</span>
                    <span className="font-bold text-racing-orange">+{kmSince} KM</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-left">
                     <p className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Propietario</p>
                     <p className="text-sm font-bold text-white/80">{moto.cliente_nombre}</p>
                  </div>
                  <button 
                    onClick={() => sendWhatsApp(moto)}
                    className="flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] px-4 py-2 rounded-lg hover:bg-[#25D366] hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    <MessageSquare size={14} />
                    Avisar
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
