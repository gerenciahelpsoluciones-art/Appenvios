import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Stethoscope, Tag, DollarSign, X } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/citas', icon: Calendar, label: 'Citas' },
  { to: '/pacientes', icon: Users, label: 'Pacientes' },
  { to: '/doctores', icon: Stethoscope, label: 'Doctores' },
  { to: '/tratamientos', icon: Tag, label: 'Tratamientos' },
  { to: '/facturacion', icon: DollarSign, label: 'Facturación' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 z-40 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-dental-500 rounded-xl flex items-center justify-center">
              <Stethoscope size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">DentalPro</p>
              <p className="text-gray-400 text-xs">Consultorio</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-dental-600 text-white shadow-lg shadow-dental-900/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">DentalPro v1.0</p>
          <p className="text-xs text-gray-600 text-center">© 2026</p>
        </div>
      </aside>
    </>
  );
}
