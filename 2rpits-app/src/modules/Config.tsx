// @ts-nocheck
import { useState, useEffect } from 'react'
import { 
  Settings, 
  Save, 
  Store, 
  Bell, 
  ShieldCheck, 
  CreditCard,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Config() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [config, setConfig] = useState<any>({
    workshop_info: {},
    maintenance_rules: {},
    client_tiers: {},
    billing_settings: {}
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('trp_config').select('*')
      if (error) throw error

      const newConfig = { ...config }
      data.forEach(item => {
        newConfig[item.key] = item.value
      })
      setConfig(newConfig)
    } catch (err) {
      console.error('Error fetching config:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(key: string) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('trp_config')
        .upsert({ key, value: config[key] })
      
      if (error) throw error
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving config:', err)
      alert('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const updateNestedConfig = (section: string, field: string, value: any) => {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-racing-orange">
        <RefreshCw size={48} className="animate-spin mb-4" />
        <p className="font-racing italic animate-pulse uppercase tracking-widest">Sincronizando Centro de Mando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="racing-title text-racing-orange">CONFIGURACIÓN</h1>
          <p className="text-racing-cream/40">Ajustes técnicos y operativos del sistema</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20 animate-in fade-in zoom-in">
            <CheckCircle2 size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Ajustes Guardados</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Información del Taller */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 text-racing-orange mb-2">
            <Store size={20} />
            <h2 className="font-racing font-bold italic tracking-widest">INFORMACIÓN DEL TALLER</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Nombre Comercial</label>
              <input 
                type="text" 
                value={config.workshop_info.name || ''} 
                onChange={(e) => updateNestedConfig('workshop_info', 'name', e.target.value)}
                className="racing-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">NIT / Documento</label>
                <input 
                  type="text" 
                  value={config.workshop_info.nit || ''} 
                  onChange={(e) => updateNestedConfig('workshop_info', 'nit', e.target.value)}
                  className="racing-input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Teléfono</label>
                <input 
                  type="text" 
                  value={config.workshop_info.phone || ''} 
                  onChange={(e) => updateNestedConfig('workshop_info', 'phone', e.target.value)}
                  className="racing-input"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Dirección Física</label>
              <input 
                type="text" 
                value={config.workshop_info.address || ''} 
                onChange={(e) => updateNestedConfig('workshop_info', 'address', e.target.value)}
                className="racing-input"
              />
            </div>
          </div>
          <button 
            disabled={saving}
            onClick={() => handleSave('workshop_info')}
            className="btn-racing w-full flex items-center justify-center gap-2 text-xs"
          >
            <Save size={16} /> GUARDAR DATOS DEL TALLER
          </button>
        </div>

        {/* Reglas de Mantenimiento */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 text-racing-orange mb-2">
            <Bell size={20} />
            <h2 className="font-racing font-bold italic tracking-widest">REGLAS DE MANTENIMIENTO</h2>
          </div>
          
          <div className="p-4 bg-racing-orange/5 rounded-lg border border-racing-orange/20 mb-4">
            <p className="text-[10px] text-racing-orange/80 font-bold leading-relaxed">
              Define cuándo se activará la alerta en el "Pit Wall". El sistema enviará notificaciones cuando se cumpla cualquiera de estas condiciones.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Intervalo de Días</label>
                <span className="text-xs font-bold text-racing-orange">{config.maintenance_rules.days_threshold} Días</span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="365" 
                step="15"
                value={config.maintenance_rules.days_threshold || 120} 
                onChange={(e) => updateNestedConfig('maintenance_rules', 'days_threshold', parseInt(e.target.value))}
                className="w-full accent-racing-orange bg-white/5 h-2 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Intervalo de Kilómetros</label>
                <span className="text-xs font-bold text-racing-orange">{config.maintenance_rules.km_threshold} KM</span>
              </div>
              <input 
                type="range" 
                min="1000" 
                max="10000" 
                step="500"
                value={config.maintenance_rules.km_threshold || 3000} 
                onChange={(e) => updateNestedConfig('maintenance_rules', 'km_threshold', parseInt(e.target.value))}
                className="w-full accent-racing-orange bg-white/5 h-2 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          <button 
            disabled={saving}
            onClick={() => handleSave('maintenance_rules')}
            className="btn-racing w-full flex items-center justify-center gap-2 text-xs"
          >
            <Save size={16} /> ACTUALIZAR REGLAS DE PITS
          </button>
        </div>

        {/* Niveles de Fidelidad */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 text-racing-orange mb-2">
            <ShieldCheck size={20} />
            <h2 className="font-racing font-bold italic tracking-widest">NIVELES DE FIDELIDAD</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Umbral PRO RIDER ($)</label>
              <input 
                type="number" 
                value={config.client_tiers.pro_threshold || 1000000} 
                onChange={(e) => updateNestedConfig('client_tiers', 'pro_threshold', parseInt(e.target.value))}
                className="racing-input"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Umbral EXPERTO ($)</label>
              <input 
                type="number" 
                value={config.client_tiers.expert_threshold || 500000} 
                onChange={(e) => updateNestedConfig('client_tiers', 'expert_threshold', parseInt(e.target.value))}
                className="racing-input"
              />
            </div>
          </div>
          <button 
            disabled={saving}
            onClick={() => handleSave('client_tiers')}
            className="btn-racing w-full flex items-center justify-center gap-2 text-xs"
          >
            <Save size={16} /> GUARDAR RANGOS
          </button>
        </div>

        {/* Facturación y Finanzas */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 text-racing-orange mb-2">
            <CreditCard size={20} />
            <h2 className="font-racing font-bold italic tracking-widest">FACTURACIÓN Y FINANZAS</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Impuesto (IVA %)</label>
              <input 
                type="number" 
                value={config.billing_settings.tax_percent || 19} 
                onChange={(e) => updateNestedConfig('billing_settings', 'tax_percent', parseInt(e.target.value))}
                className="racing-input"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Moneda</label>
              <select 
                value={config.billing_settings.currency || 'COP'} 
                onChange={(e) => updateNestedConfig('billing_settings', 'currency', e.target.value)}
                className="racing-input bg-racing-black"
              >
                <option value="COP">COP ($)</option>
                <option value="USD">USD ($)</option>
                <option value="MXN">MXN ($)</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Pie de Factura</label>
            <textarea 
              value={config.billing_settings.invoice_footer || ''} 
              onChange={(e) => updateNestedConfig('billing_settings', 'invoice_footer', e.target.value)}
              className="racing-input h-20 py-2 resize-none"
            />
          </div>
          <button 
            disabled={saving}
            onClick={() => handleSave('billing_settings')}
            className="btn-racing w-full flex items-center justify-center gap-2 text-xs"
          >
            <Save size={16} /> GUARDAR AJUSTES FINANCIEROS
          </button>
        </div>
      </div>
    </div>
  )
}
