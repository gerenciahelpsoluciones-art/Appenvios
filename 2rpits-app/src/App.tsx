import { useState } from 'react'
import { 
  Gauge, 
  Settings, 
  Package, 
  Users, 
  ClipboardList, 
  Menu,
  ChevronRight,
  Plus,
  Bell,
  Search,
  Receipt
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Dashboard from './modules/Dashboard'
import Inventory from './modules/Inventory'
import Orders from './modules/Orders'
import NewOrder from './modules/NewOrder'
import Billing from './modules/Billing'
import MaintenanceReminders from './modules/MaintenanceReminders'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showNewOrder, setShowNewOrder] = useState(false)

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setShowNewOrder(false)
  }

  const menuItems = [
    { id: 'dashboard', label: 'The Track', icon: Gauge },
    { id: 'orders', label: 'Órdenes Pits', icon: ClipboardList },
    { id: 'billing', label: 'Facturación', icon: Receipt },
    { id: 'reminders', label: 'Recordatorios', icon: Bell },
    { id: 'inventory', label: 'Almacén', icon: Package },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'config', label: 'Ajustes', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-racing-carbon text-racing-cream">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-racing-black border-r border-white/5 flex flex-col h-screen"
      >
        <div className="p-6 flex items-center justify-center h-24 overflow-hidden">
          <img 
            src="/logo.jpg" 
            alt="2Rpits Logo" 
            className={`transition-all duration-300 max-h-full ${isSidebarOpen ? 'w-auto' : 'w-10 h-10 object-cover rounded-sm'}`} 
          />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all group relative ${
                activeTab === item.id && !showNewOrder
                  ? 'bg-racing-orange text-white shadow-lg' 
                  : 'text-racing-cream/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={22} className="shrink-0" />
              {isSidebarOpen && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
              {activeTab === item.id && isSidebarOpen && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full h-10 flex items-center justify-center rounded-lg bg-white/5 text-racing-cream/40 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-racing-black/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-lg border border-white/5 w-full max-w-md focus-within:border-racing-orange/50 transition-all">
            <Search size={18} className="text-racing-cream/30" />
            <input 
              type="text" 
              placeholder="Buscar por placa o cliente..." 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 text-racing-cream/60 hover:text-white transition-colors">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-racing-orange rounded-full shadow-[0_0_8px_rgba(244,115,33,1)]"></span>
            </button>
            <button 
              onClick={() => setShowNewOrder(true)}
              className="btn-racing flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} />
              <span className="hidden md:inline">NUEVA ENTRADA</span>
              <span className="md:hidden">NUEVA</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-racing-carbon">
          <AnimatePresence mode="wait">
            <motion.div
              key={showNewOrder ? 'new-order' : activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {showNewOrder ? (
                <NewOrder onBack={() => setShowNewOrder(false)} />
              ) : (
                <>
                  {activeTab === 'dashboard' && <Dashboard />}
                  {activeTab === 'orders' && <Orders />}
                  {activeTab === 'billing' && <Billing />}
                  {activeTab === 'inventory' && <Inventory />}
                  {activeTab === 'reminders' && <MaintenanceReminders />}
                  {(activeTab === 'clients' || activeTab === 'config') && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-racing-cream/20 italic">
                      <div className="w-20 h-20 border-2 border-dashed border-racing-orange/20 rounded-full flex items-center justify-center mb-4">
                         <Plus size={32} />
                      </div>
                      <p className="font-racing text-xl">Módulo {activeTab} en construcción</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default App
