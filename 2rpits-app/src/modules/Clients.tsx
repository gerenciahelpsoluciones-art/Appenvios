// @ts-nocheck
import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Bike, 
  MessageSquare, 
  Phone, 
  Mail, 
  ChevronRight,
  History,
  TrendingUp,
  ArrowLeft
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

interface Client {
  nombre: string
  telefono: string
  email: string
  motos_count: number
  total_spent: number
  last_visit: string
  motos: any[]
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    try {
      // Obtenemos motos y órdenes para cruzar datos
      const [motosRes, ordersRes] = await Promise.all([
        supabase.from('trp_motos').select('*'),
        supabase.from('trp_ordenes').select('moto_id, total, estado')
      ])
      
      if (motosRes.error) throw motosRes.error
      if (ordersRes.error) throw ordersRes.error

      const motos = motosRes.data
      const orders = ordersRes.data

      // Agrupamos por teléfono
      const clientsMap: { [key: string]: Client } = {}

      motos?.forEach(moto => {
        const key = moto.cliente_telefono || moto.cliente_nombre
        if (!clientsMap[key]) {
          clientsMap[key] = {
            nombre: moto.cliente_nombre,
            telefono: moto.cliente_telefono,
            email: moto.cliente_email,
            motos_count: 0,
            total_spent: 0,
            last_visit: moto.created_at,
            motos: []
          }
        }
        
        clientsMap[key].motos_count++
        clientsMap[key].motos.push(moto)
        
        // Sumamos el total de las órdenes de esta moto
        const motoOrders = orders?.filter(o => o.moto_id === moto.id && o.estado === 'ENTREGADO') || []
        const motoTotal = motoOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0)
        clientsMap[key].total_spent += motoTotal

        if (new Date(moto.created_at) > new Date(clientsMap[key].last_visit)) {
          clientsMap[key].last_visit = moto.created_at
        }
      })

      setClients(Object.values(clientsMap))
    } catch (err) {
      console.error('Error fetching clients:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono?.includes(searchTerm)
  )

  if (selectedClient) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
        <button 
          onClick={() => setSelectedClient(null)}
          className="flex items-center gap-2 text-racing-cream/40 hover:text-racing-orange transition-colors font-bold uppercase text-xs tracking-widest"
        >
          <ArrowLeft size={16} /> Volver al listado
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Perfil Izquierdo */}
          <div className="md:w-1/3 space-y-6">
            <div className="glass-card p-8 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-racing-orange/10 rounded-full flex items-center justify-center text-racing-orange mb-4 border-2 border-racing-orange/20">
                <Users size={48} />
              </div>
              <h2 className="text-2xl font-bold font-racing italic">{selectedClient.nombre}</h2>
              <p className={`text-sm mb-6 uppercase tracking-widest font-bold ${
                selectedClient.total_spent > 1000000 ? 'text-racing-orange' : 
                selectedClient.total_spent > 500000 ? 'text-blue-400' : 
                'text-racing-cream/40'
              }`}>
                {selectedClient.total_spent > 1000000 ? 'PRO RIDER' : 
                 selectedClient.total_spent > 500000 ? 'EXPERTO' : 
                 'PILOTO ROOKIE'}
              </p>
              
              <div className="w-full space-y-3">
                <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-white/5">
                  <Phone size={16} className="text-racing-orange" />
                  <span className="text-sm font-bold">{selectedClient.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-white/5">
                  <Mail size={16} className="text-racing-orange" />
                  <span className="text-sm font-bold truncate">{selectedClient.email || 'Sin email'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-6">
                <button 
                  onClick={() => window.open(`https://wa.me/${selectedClient.telefono?.replace(/\D/g, '')}`, '_blank')}
                  className="bg-[#25D366]/10 text-[#25D366] p-3 rounded-lg hover:bg-[#25D366] hover:text-white transition-all flex justify-center"
                >
                  <MessageSquare size={20} />
                </button>
                <button 
                  onClick={() => window.open(`tel:${selectedClient.telefono}`, '_self')}
                  className="bg-blue-500/10 text-blue-500 p-3 rounded-lg hover:bg-blue-500 hover:text-white transition-all flex justify-center"
                >
                  <Phone size={20} />
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-racing text-sm italic mb-4 text-racing-orange tracking-widest">RESUMEN COMERCIAL</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-racing-cream/40 font-bold uppercase">Motos en Garaje</span>
                  <span className="font-bold text-lg">{selectedClient.motos_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-racing-cream/40 font-bold uppercase">Total Invertido</span>
                  <span className="font-bold text-lg text-green-500">${selectedClient.total_spent.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Garaje y Actividad */}
          <div className="flex-1 space-y-6">
            <h3 className="text-xl font-racing font-bold italic tracking-wide flex items-center gap-3">
              <Bike className="text-racing-orange" /> GARAJE VIRTUAL
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedClient.motos.map((moto: any) => (
                <div key={moto.id} className="glass-card hover:border-racing-orange/40 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg uppercase">{moto.marca} {moto.modelo}</h4>
                      <p className="text-xs font-mono text-racing-cream/40 tracking-widest">{moto.placa}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg">
                      <Bike size={20} className="text-racing-orange" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-racing-cream/40 mt-4 pt-4 border-t border-white/5">
                    <span>KM: <b className="text-racing-cream">{moto.kilometraje}</b></span>
                    <span>AÑO: <b className="text-racing-cream">{moto.anio}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="racing-title text-racing-orange">CLIENTES PITS</h1>
          <p className="text-racing-cream/40">Directorio de pilotos y sus máquinas</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-full max-w-md focus-within:border-racing-orange/50 transition-all">
          <Search size={18} className="text-racing-cream/30" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o celular..." 
            className="bg-transparent border-none outline-none text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse"></div>)}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-32 text-racing-cream/20 border-dashed border-2">
          <Users size={64} className="mb-4 opacity-5" />
          <p className="font-racing text-2xl uppercase italic">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedClient(client)}
              className="glass-card hover:border-racing-orange/40 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-racing-orange group-hover:bg-racing-orange/10 transition-colors">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-tighter text-lg">{client.nombre}</h3>
                    <p className="text-xs text-racing-cream/40 flex items-center gap-1">
                      <Phone size={10} /> {client.telefono || 'Sin número'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-racing-cream/20 uppercase tracking-widest">Motos</p>
                   <p className="text-lg font-bold font-racing text-racing-orange">{client.motos_count}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                   <span className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Activo</span>
                </div>
                <ChevronRight size={16} className="text-racing-cream/20 group-hover:text-racing-orange group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
