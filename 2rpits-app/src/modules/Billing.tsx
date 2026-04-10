import { useState, useRef } from 'react'
import { 
  Search, 
  Receipt, 
  CheckCircle2, 
  Package, 
  Printer, 
  Download, 
  ArrowRight, 
  Wallet, 
  User, 
  History,
  Loader2,
  Tag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { orderService } from '../services/orderService'
import { InvoiceTemplate } from '../components/InvoiceTemplate'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { supabase } from '../lib/supabaseClient'

export default function Billing() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isFinalized, setIsFinalized] = useState(false)
  const [loading, setLoading] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  const handleSearch = async () => {
    if (!searchQuery) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trp_ordenes')
        .select('*, trp_motos(*), trp_orden_items(*)')
        .or(`consecutivo.eq.${parseInt(searchQuery) || 0}, trp_motos(placa).ilike.%${searchQuery}%`)
        .eq('estado', 'LISTO')
        .limit(1)
        .single()
      
      if (error) throw error
      setSelectedOrder(data)
    } catch (err) {
      console.error('Error searching order:', err)
      alert('No se encontró una orden lista para facturar con ese criterio.')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!invoiceRef.current || !selectedOrder) return
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Factura_2Rpits_${selectedOrder.consecutivo}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err)
    }
  }

  const handleFinalize = async () => {
    setLoading(true)
    try {
      await orderService.updateOrderStatus(selectedOrder.id, 'ENTREGADO')
      setIsFinalized(true)
    } catch (err) {
      console.error('Error finalizing order:', err)
      alert('Error al cerrar la orden.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="racing-title text-racing-orange">CHECK-OUT</h1>
        <p className="text-racing-cream/40">Liquidación de órdenes y entrega de vehículos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search and Selection */}
        <div className="lg:col-span-2 space-y-6">
          {!isFinalized ? (
            <div className="glass-card">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Search size={18} className="text-racing-orange" />
                BUSCAR ORDEN PARA LIQUIDAR
              </h3>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Número de orden o Placa..." 
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-racing-orange/50 transition-all font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button 
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg font-bold hover:bg-white/10 transition-all"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'BUSCAR'}
                </button>
              </div>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            {selectedOrder && !isFinalized ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key="order-preview"
                className="glass-card border-racing-orange/30 space-y-6"
              >
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                   <div>
                      <p className="text-xs font-bold text-racing-orange uppercase tracking-widest mb-1">Orden #{selectedOrder.consecutivo}</p>
                      <h2 className="text-2xl font-bold font-racing italic uppercase">{selectedOrder.trp_motos?.marca} {selectedOrder.trp_motos?.modelo}</h2>
                      <div className="flex gap-4 mt-2">
                         <span className="bg-white/5 px-2 py-0.5 rounded text-xs font-bold">{selectedOrder.trp_motos?.placa}</span>
                         <span className="text-xs text-racing-cream/40">{selectedOrder.trp_motos?.kilometraje} KM</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm text-racing-cream/40">Técnico Asignado</p>
                      <p className="font-bold text-racing-cream/80 uppercase">{selectedOrder.tecnico_nombre}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-racing-cream/30">DETALLE DE SERVICIO</h3>
                   <div className="space-y-2">
                      {selectedOrder.trp_orden_items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                           <div>
                              <p className="font-bold uppercase text-sm">{item.nombre}</p>
                              <p className="text-[10px] text-racing-cream/40">x{item.cantidad}</p>
                           </div>
                           <p className="font-mono font-bold text-racing-orange">${(item.cantidad * item.precio_unitario).toLocaleString()}</p>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-white/5 flex justify-between items-center mt-8">
                   <div>
                      <p className="text-xs font-bold text-racing-cream/40 uppercase tracking-widest">Total a Pagar</p>
                      <p className="text-4xl font-bold font-racing text-white italic mt-1">${(selectedOrder.total || 0).toLocaleString()}</p>
                   </div>
                   <button 
                    onClick={handleFinalize}
                    className="btn-racing px-12 text-xl"
                   >
                      CERRAR Y PAGAR
                   </button>
                </div>
              </motion.div>
            ) : isFinalized ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card flex flex-col items-center justify-center py-20 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-4">
                   <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-racing font-bold text-green-500">¡ORDEN CERRADA CON ÉXITO!</h2>
                <p className="text-racing-cream/60">La orden para la moto {selectedOrder?.trp_motos?.placa} ha sido facturada y entregada.</p>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-lg">
                  <button 
                    onClick={downloadPDF}
                    className="flex-1 px-8 py-4 bg-racing-orange text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-[0_4px_20px_rgba(244,115,33,0.4)]"
                  >
                    <Download size={20} />
                    DESCARGAR FACTURA PDF
                  </button>
                  <button 
                    onClick={() => { setIsFinalized(false); setSelectedOrder(null); setSearchQuery(''); }}
                    className="flex-1 px-8 py-4 bg-white/5 text-racing-cream/60 rounded-lg font-bold hover:text-white transition-all border border-white/5"
                  >
                    NUEVA BÚSQUEDA
                  </button>
                </div>

                {/* Hidden Invoice Template for PDF Generation */}
                <div className="fixed left-[-9999px] top-[-9999px]">
                  <div id="invoice-target">
                    <InvoiceTemplate ref={invoiceRef} order={selectedOrder} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card border-dashed py-32 flex flex-col items-center justify-center text-racing-cream/20 italic">
                <Receipt size={48} className="mb-4 opacity-10" />
                <p>Busca una orden para comenzar el proceso de liquidación</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Status/Shortcuts */}
        <div className="space-y-6 text-sm">
           <div className="glass-card">
              <h3 className="font-bold text-racing-cream/30 uppercase tracking-widest text-[10px] mb-4">MÉTODOS DE PAGO</h3>
              <div className="space-y-3">
                 {[
                   { id: 'cash', label: 'Efectivo', icon: Wallet },
                   { id: 'card', label: 'Datafono', icon: Wallet },
                   { id: 'transfer', label: 'Transferencia', icon: Wallet }
                 ].map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                       <div className="flex items-center gap-3">
                          <m.icon size={18} className="text-racing-orange" />
                          <span className="font-bold">{m.label}</span>
                       </div>
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]"></div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="glass-card border-racing-orange/20 bg-racing-orange/5 p-6">
              <h3 className="font-bold text-racing-orange mb-2">RECORDATORIO</h3>
              <p className="text-racing-cream/60 leading-relaxed">Asegúrate de registrar el kilometraje final para activar los recordatorios de mantenimiento automático.</p>
              <div className="mt-4 flex items-center gap-2 text-racing-orange text-xs font-bold uppercase tracking-widest">
                 <History size={14} /> Historial de Entregas
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
