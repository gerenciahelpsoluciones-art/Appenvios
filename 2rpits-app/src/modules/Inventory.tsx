import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Box,
  Tag
} from 'lucide-react'
import { inventoryService } from '../services/inventoryService'

export default function Inventory() {
  const [view, setView] = useState<'products' | 'combos'>('products')
  const [products, setProducts] = useState<any[]>([])
  const [combos, setCombos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInventory() {
      try {
        const [prodData, comboData] = await Promise.all([
          inventoryService.getProducts(),
          inventoryService.getCombos()
        ])
        setProducts(prodData)
        setCombos(comboData)
      } catch (err) {
        console.error('Error loading inventory:', err)
      } finally {
        setLoading(false)
      }
    }
    loadInventory()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="racing-title text-racing-orange">ALMACÉN PRO</h1>
          <p className="text-racing-cream/40">Gestión de stock técnico y promociones</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setView('products')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${view === 'products' ? 'bg-racing-orange text-white shadow-lg' : 'text-racing-cream/40 hover:text-white'}`}
          >
            PRODUCTOS
          </button>
          <button 
            onClick={() => setView('combos')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${view === 'combos' ? 'bg-racing-orange text-white shadow-lg' : 'text-racing-cream/40 hover:text-white'}`}
          >
            COMBOS TUNING
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-racing-orange/50 transition-all">
          <Search size={20} className="text-racing-cream/20" />
          <input 
            type="text" 
            placeholder={`Buscar ${view === 'products' ? 'repuestos...' : 'combos...'}`} 
            className="bg-transparent border-none outline-none w-full text-sm font-medium"
          />
        </div>
        <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-racing-cream/40 hover:text-white hover:border-white/20 transition-all">
          <Filter size={20} />
        </button>
        <button className="btn-racing flex items-center gap-2">
          <Plus size={20} />
          <span>{view === 'products' ? 'NUEVO PRODUCTO' : 'NUEVO COMBO'}</span>
        </button>
      </div>

      {view === 'products' ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded"></div>)}
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="text-xs font-bold text-racing-cream/40 uppercase border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Precio Venta</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold">{product.nombre}</p>
                        <p className="text-[10px] text-racing-cream/30 uppercase tracking-widest">{product.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-racing-cream/60">{product.categoria}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className={`font-mono font-bold ${product.stock <= product.stock_minimo ? 'text-red-500' : ''}`}>
                              {product.stock}
                           </span>
                           {product.stock <= product.stock_minimo && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-racing-orange">${product.precio_venta.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-racing-cream/20 hover:text-white transition-colors">Ver más</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse"></div>)
          ) : combos.map((combo) => (
            <div key={combo.id} className="glass-card group hover:border-racing-orange/50 transition-all border-none bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                <Tag size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2">{combo.nombre}</h3>
              <p className="text-sm text-racing-cream/60 mb-6">{combo.descripcion}</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold text-racing-orange tracking-widest uppercase">PRECIO ESPECIAL</p>
                  <p className="text-2xl font-bold">${combo.precio_combo.toLocaleString()}</p>
                </div>
                <button className="p-3 bg-racing-orange rounded-lg text-white shadow-lg shadow-orange-500/20 hover:scale-110 transition-transform">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
