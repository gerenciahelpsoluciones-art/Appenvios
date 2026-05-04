// @ts-nocheck
import { useState, useEffect } from 'react'
import { 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  TrendingDown, 
  Calendar,
  Tag,
  Trash2,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newExpense, setNewExpense] = useState({
    descripcion: '',
    monto: '',
    categoria: 'Insumos',
    metodo_pago: 'Efectivo',
    fecha: format(new Date(), 'yyyy-MM-dd')
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  async function fetchExpenses() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trp_gastos')
        .select('*')
        .order('fecha', { ascending: false })
      
      if (error) throw error
      setExpenses(data || [])
    } catch (err) {
      console.error('Error fetching expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddExpense() {
    if (!newExpense.descripcion || !newExpense.monto) return

    try {
      const { error } = await supabase
        .from('trp_gastos')
        .insert([{
          ...newExpense,
          monto: parseFloat(newExpense.monto)
        }])
      
      if (error) throw error
      
      setShowAddModal(false)
      setNewExpense({
        descripcion: '',
        monto: '',
        categoria: 'Insumos',
        metodo_pago: 'Efectivo',
        fecha: format(new Date(), 'yyyy-MM-dd')
      })
      fetchExpenses()
    } catch (err) {
      console.error('Error adding expense:', err)
      alert('Error al registrar el gasto')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este registro de gasto?')) return
    try {
      const { error } = await supabase.from('trp_gastos').delete().eq('id', id)
      if (error) throw error
      fetchExpenses()
    } catch (err) {
      console.error('Error deleting expense:', err)
    }
  }

  const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0)

  const categories = ['Insumos', 'Nomina', 'Arriendo', 'Servicios', 'Herramientas', 'Otros']

  // Calculate top category dynamically
  const categoryTotals = expenses.reduce((acc: any, curr) => {
    acc[curr.categoria] = (acc[curr.categoria] || 0) + Number(curr.monto)
    return acc
  }, {})

  const topCategory = Object.entries(categoryTotals).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '---'

  const filteredExpenses = expenses.filter(e => 
    e.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const budgetLimit = 5000000 // Example limit: 5 Million

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="racing-title text-racing-orange">GASTOS PITS</h1>
          <p className="text-racing-cream/40">Control de egresos y costos operativos</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex-1 md:w-64 focus-within:border-racing-orange/50 transition-all">
            <Search size={18} className="text-racing-cream/30" />
            <input 
              type="text" 
              placeholder="Buscar gasto..." 
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-racing flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={20} />
            REGISTRAR GASTO
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card bg-gradient-to-br from-racing-danger/10 to-transparent border-racing-danger/20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-racing-cream/30">Total Gastos</p>
          <p className="text-3xl font-bold mt-2 font-racing text-racing-danger">${totalExpenses.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-racing-danger">
            <TrendingDown size={12} />
            <span className="text-[10px] font-bold uppercase">Egreso acumulado</span>
          </div>
        </div>
        <div className="glass-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-racing-cream/30">Mayor Categoría</p>
          <p className="text-xl font-bold mt-2 uppercase font-racing italic text-racing-orange">{topCategory}</p>
        </div>
        <div className="glass-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-racing-cream/30">Alertas de Costo</p>
          {totalExpenses > budgetLimit ? (
            <p className="text-sm font-bold mt-2 text-racing-danger uppercase flex items-center gap-2">
              <AlertCircle size={16} /> Sobre presupuesto
            </p>
          ) : (
            <p className="text-sm font-bold mt-2 text-green-500 uppercase flex items-center gap-2">
              <CheckCircle2 size={16} /> Dentro del presupuesto
            </p>
          )}
        </div>
      </div>

      {/* Expenses Table/List */}
      <div className="glass-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-racing-cream/40 border-b border-white/5">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Monto</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 bg-white/2"></td>
                  </tr>
                ))
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-racing-cream/20">
                    <AlertCircle className="mx-auto mb-2 opacity-10" size={32} />
                    <p className="font-racing italic">No hay gastos registrados en este periodo</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono text-racing-cream/60">
                      {format(new Date(expense.fecha), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 font-bold text-sm uppercase tracking-tight">
                      {expense.descripcion}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        expense.categoria === 'Nomina' ? 'bg-blue-500/20 text-blue-400' :
                        expense.categoria === 'Arriendo' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-white/5 text-racing-cream/60'
                      }`}>
                        {expense.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-racing-danger">
                      ${Number(expense.monto).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-racing-cream/20 hover:text-racing-danger transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Gasto Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md border-racing-orange/30 shadow-[0_0_50px_rgba(244,115,33,0.1)]">
             <div className="flex justify-between items-center mb-6">
                <h2 className="font-racing text-xl italic font-bold text-racing-orange">REGISTRAR NUEVO GASTO</h2>
                <button onClick={() => setShowAddModal(false)} className="text-racing-cream/40 hover:text-white">
                  <Plus className="rotate-45" size={24} />
                </button>
             </div>

             <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Descripción del Gasto</label>
                  <input 
                    type="text" 
                    placeholder="Ejem: Aceite para taller, Pago energía..."
                    className="racing-input"
                    value={newExpense.descripcion}
                    onChange={(e) => setNewExpense({...newExpense, descripcion: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Monto ($)</label>
                    <input 
                      type="number" 
                      className="racing-input"
                      value={newExpense.monto}
                      onChange={(e) => setNewExpense({...newExpense, monto: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Fecha</label>
                    <input 
                      type="date" 
                      className="racing-input"
                      value={newExpense.fecha}
                      onChange={(e) => setNewExpense({...newExpense, fecha: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Categoría</label>
                    <select 
                      className="racing-input bg-racing-black"
                      value={newExpense.categoria}
                      onChange={(e) => setNewExpense({...newExpense, categoria: e.target.value})}
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-racing-cream/30 uppercase tracking-widest">Método</label>
                    <select 
                      className="racing-input bg-racing-black"
                      value={newExpense.metodo_pago}
                      onChange={(e) => setNewExpense({...newExpense, metodo_pago: e.target.value})}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleAddExpense}
                  className="btn-racing w-full mt-4 flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> FINALIZAR REGISTRO
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
