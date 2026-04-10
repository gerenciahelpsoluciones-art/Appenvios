import { useState } from 'react'
import { 
  ArrowLeft, 
  Bike, 
  User, 
  Clipboard, 
  Camera, 
  Save, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { orderService } from '../services/orderService'

interface NewOrderFormProps {
  onBack: () => void
}

export default function NewOrder({ onBack }: NewOrderFormProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    placa: '',
    marca: '',
    modelo: '',
    kilometraje: '',
    observaciones: '',
    tecnico: 'Juan Pérez' // Default for now
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await orderService.createOrder(
        {
          placa: formData.placa,
          marca: formData.marca,
          modelo: formData.modelo,
          kilometraje: parseInt(formData.kilometraje) || 0,
          cliente_nombre: formData.cliente_nombre,
          cliente_telefono: formData.cliente_telefono
        },
        {
          observaciones: formData.observaciones,
          tecnico: formData.tecnico
        }
      )
      setSuccess(true)
      setTimeout(onBack, 3000)
    } catch (err) {
      console.error('Error creating order:', err)
      alert('Error al crear la orden. Revisa la consola.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 bg-green-500/10 border border-green-500/20 rounded-3xl text-center"
      >
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
          <CheckCircle2 size={40} className="text-white" />
        </div>
        <h2 className="text-3xl font-racing font-bold text-green-500">¡INGRESO EXITOSO!</h2>
        <p className="text-racing-cream/60">La moto {formData.placa} ya está en la fila de Pits.</p>
        <p className="text-xs text-racing-cream/30 mt-4">Redirigiendo al Board...</p>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 bg-white/5 rounded-full hover:bg-racing-orange transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="racing-title text-racing-orange">ADMISIÓN A PITS</h1>
          <p className="text-racing-cream/40">Registro de entrada de nueva unidad</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div 
            key={s} 
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-racing-orange shadow-[0_0_10px_rgba(244,115,33,0.5)]' : 'bg-white/10'}`}
          />
        ))}
      </div>

      <div className="glass-card p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-racing-orange mb-4">
                <User size={20} />
                <h2 className="text-xl font-bold font-racing italic underline decoration-racing-orange underline-offset-8 uppercase">Datos del Cliente</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-racing-cream/40 px-1 uppercase tracking-widest">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={formData.cliente_nombre}
                    onChange={(e) => handleInputChange('cliente_nombre', e.target.value)}
                    placeholder="Ej. Juan Pérez" 
                    className="w-full bg-racing-carbon border border-white/10 p-3 rounded focus:border-racing-orange outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-racing-cream/40 px-1 uppercase tracking-widest">Teléfono / WhatsApp</label>
                  <input 
                    type="tel" 
                    value={formData.cliente_telefono}
                    onChange={(e) => handleInputChange('cliente_telefono', e.target.value)}
                    placeholder="+57 300..." 
                    className="w-full bg-racing-carbon border border-white/10 p-3 rounded focus:border-racing-orange outline-none transition-all" 
                  />
                </div>
              </div>
              
              <div className="pt-6 flex justify-end">
                <button 
                  disabled={!formData.cliente_nombre || !formData.cliente_telefono}
                  onClick={() => setStep(2)}
                  className="btn-racing disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  SIGUIENTE NIVEL
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-racing-orange mb-4">
                <Bike size={20} />
                <h2 className="text-xl font-bold font-racing italic underline decoration-racing-orange underline-offset-8 uppercase">Identificación de la Moto</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-racing-cream/40 px-1 uppercase tracking-widest">Placa</label>
                  <input 
                    type="text" 
                    value={formData.placa}
                    onChange={(e) => handleInputChange('placa', e.target.value)}
                    placeholder="ABC-123" 
                    className="w-full bg-racing-carbon border border-white/10 p-3 rounded focus:border-racing-orange outline-none transition-all font-bold uppercase" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-racing-cream/40 px-1 uppercase tracking-widest">Marca</label>
                  <input 
                    type="text" 
                    value={formData.marca}
                    onChange={(e) => handleInputChange('marca', e.target.value)}
                    placeholder="Ej. KTM, Yamaha..." 
                    className="w-full bg-racing-carbon border border-white/10 p-3 rounded focus:border-racing-orange outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-racing-cream/40 px-1 uppercase tracking-widest">Modelo / Año</label>
                  <input 
                    type="text" 
                    value={formData.modelo}
                    onChange={(e) => handleInputChange('modelo', e.target.value)}
                    placeholder="Duke 390 / 2024" 
                    className="w-full bg-racing-carbon border border-white/10 p-3 rounded focus:border-racing-orange outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-racing-cream/40 px-1 uppercase tracking-widest">Kilometraje Actual</label>
                  <input 
                    type="number" 
                    value={formData.kilometraje}
                    onChange={(e) => handleInputChange('kilometraje', e.target.value)}
                    placeholder="000" 
                    className="w-full bg-racing-carbon border border-white/10 p-3 rounded focus:border-racing-orange outline-none transition-all font-mono" 
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-between">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-2 text-racing-cream/40 hover:text-white"
                >
                  ATRÁS
                </button>
                <button 
                  disabled={!formData.placa || !formData.marca}
                  onClick={() => setStep(3)}
                  className="btn-racing disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  DIAGNÓSTICO
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-racing-orange mb-4">
                <Clipboard size={20} />
                <h2 className="text-xl font-bold font-racing italic underline decoration-racing-orange underline-offset-8 uppercase">Detalles Técnicos</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-racing-cream/40 px-1 uppercase tracking-widest">Motivo de Ingreso / Observaciones</label>
                  <textarea 
                    rows={4} 
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Describe el problema o el servicio solicitado..." 
                    className="w-full bg-racing-carbon border border-white/10 p-3 rounded focus:border-racing-orange outline-none transition-all resize-none" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-white/5 rounded-xl text-racing-cream/40 hover:border-racing-orange/40 hover:text-racing-orange transition-all group">
                    <Camera size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm tracking-widest">SUBIR FOTOS INICIALES</span>
                  </button>
                  
                  <div className="p-4 bg-racing-orange/5 border border-racing-orange/20 rounded-xl flex items-start gap-3">
                    <AlertCircle size={20} className="text-racing-orange shrink-0 mt-0.5" />
                    <p className="text-xs text-racing-cream/60">
                      Al recibir la moto, asegúrate de documentar rayones o daños previos para evitar reclamos futuros.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-between">
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-2 text-racing-cream/40 hover:text-white"
                >
                  ATRÁS
                </button>
                <button 
                  disabled={loading}
                  onClick={handleSubmit}
                  className="btn-racing flex items-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {loading ? 'INGRESANDO...' : 'GUARDAR E INGRESAR A PITS'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
