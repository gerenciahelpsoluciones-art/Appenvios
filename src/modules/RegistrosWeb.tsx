import React, { useState } from 'react';
import { type AppUser } from '../App';
import { 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  Download,
  CreditCard,
  Briefcase,
  ShieldCheck,
  Search
} from 'lucide-react';

export interface RegistroPendiente {
  id: string;
  created_at: string;
  tipo_registro: 'CLIENTE' | 'PROVEEDOR';
  accion: string;
  nombre_razon_social: string;
  nit_cedula: string;
  direccion: string;
  ciudad: string;
  email: string;
  telefono: string;
  pagina_web?: string;
  datos_representante?: any;
  datos_cartera?: any;
  datos_bancarios?: any;
  datos_contabilidad?: any;
  datos_tributarios?: any;
  referencias_comerciales?: any;
  declaracion_sarlaft?: any;
  doc_camara_comercio_url?: string;
  doc_rut_url?: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
}

interface RegistrosWebProps {
  registros: RegistroPendiente[];
  onUpdateStatus: (id: string, newStatus: RegistroPendiente['estado']) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  currentUser?: AppUser | null;
}

const RegistrosWeb: React.FC<RegistrosWebProps> = ({ registros, onUpdateStatus, onDelete, currentUser }) => {
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroPendiente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CLIENTE' | 'PROVEEDOR'>('ALL');

  const filteredRegistros = registros
    .filter(r => filterType === 'ALL' || r.tipo_registro === filterType)
    .filter(r => 
      r.nombre_razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.nit_cedula.includes(searchTerm)
    );

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Aprobado': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Rechazado': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-amber-600 bg-amber-50 border-amber-100';
    }
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-4 mt-6 first:mt-0">
      <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-500">
        <Icon size={18} />
      </div>
      <h3 className="font-bold text-zinc-800 text-sm uppercase tracking-wider">{title}</h3>
    </div>
  );

  const DataItem = ({ label, value }: { label: string, value: any }) => (
    <div className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm">
      <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">{label}</p>
      <p className="text-sm text-zinc-700 font-medium">{value || 'N/A'}</p>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
              <FileText size={28} />
            </div>
            Registros Públicos
          </h2>
          <p className="text-zinc-500 mt-1 font-medium italic">Gestión de formularios diligenciados por Clientes y Proveedores</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre o NIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <select 
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 outline-none"
          >
            <option value="ALL text-zinc-400">Todo</option>
            <option value="CLIENTE">Clientes</option>
            <option value="PROVEEDOR">Proveedores</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Entidad / NIT</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Contacto</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredRegistros.map(reg => (
                <tr key={reg.id} className="group hover:bg-zinc-50/80 transition-colors">
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter ${reg.tipo_registro === 'CLIENTE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {reg.tipo_registro}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-900 text-sm group-hover:text-primary transition-colors">{reg.nombre_razon_social}</div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">{reg.nit_cedula}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-zinc-600 flex items-center gap-1.5"><Mail size={12} className="text-zinc-300"/> {reg.email}</div>
                    <div className="text-xs text-zinc-600 flex items-center gap-1.5 mt-1"><Phone size={12} className="text-zinc-300"/> {reg.telefono}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5 font-mono">
                      <Clock size={12} /> {new Date(reg.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[11px] font-bold border ${getStatusColor(reg.estado)}`}>
                      {reg.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedRegistro(reg)}
                        className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all shadow-sm flex items-center gap-2"
                      >
                        <ExternalLink size={14} /> Revisar
                      </button>
                      {currentUser?.rol === 'Admin' && onDelete && (
                        <button 
                          onClick={() => { if (window.confirm('¿Está seguro de eliminar este registro permanentemente?')) onDelete(reg.id) }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Eliminar Registro"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRegistros.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Search size={48} />
                      <p className="font-bold">No se encontraron registros</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRegistro && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-zinc-50 rounded-[40px] max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
            {/* Modal Header */}
            <div className="p-8 bg-white border-b border-zinc-100 flex justify-between items-start">
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg ${selectedRegistro.tipo_registro === 'CLIENTE' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}>
                  <Building2 size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-zinc-900">{selectedRegistro.nombre_razon_social}</h2>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${selectedRegistro.tipo_registro === 'CLIENTE' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      DOC: {selectedRegistro.accion}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs font-bold text-zinc-400">
                    <span className="flex items-center gap-1.5"><ShieldCheck size={14}/> NIT: {selectedRegistro.nit_cedula}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={14}/> {selectedRegistro.ciudad}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRegistro(null)}
                className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Basic & Legal */}
              <div className="space-y-6">
                <SectionTitle icon={User} title="Identificación & Legal" />
                <div className="grid grid-cols-1 gap-3">
                  <DataItem label="Tipo de Registro" value={selectedRegistro.tipo_registro} />
                  <DataItem label="Email de contacto" value={selectedRegistro.email} />
                  <DataItem label="Teléfono" value={selectedRegistro.telefono} />
                  <DataItem label="Dirección" value={selectedRegistro.direccion} />
                  <DataItem label="Pagina Web" value={selectedRegistro.pagina_web} />
                </div>

                <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm mt-4">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mb-3 text-center">Representante Legal</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Nombre:</span>
                      <span className="font-bold text-zinc-700">{selectedRegistro.datos_representante?.nombre || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Cédula:</span>
                      <span className="font-bold text-zinc-700">{selectedRegistro.datos_representante?.cedula || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial & Banking */}
              <div className="space-y-6">
                <SectionTitle icon={CreditCard} title="Datos Financieros" />
                <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                   <p className="text-[10px] text-zinc-400 font-bold uppercase border-b pb-2">Información Bancaria</p>
                   <DataItem label="Banco" value={selectedRegistro.datos_bancarios?.banco} />
                   <DataItem label="Tipo Cuenta" value={selectedRegistro.datos_bancarios?.tipo_cuenta} />
                   <DataItem label="Número" value={selectedRegistro.datos_bancarios?.numero} />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4 mt-4">
                   <p className="text-[10px] text-zinc-400 font-bold uppercase border-b pb-2">Contabilidad & Tributario</p>
                   <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Auto-retenedor:</span>
                      <span className={`font-bold ${selectedRegistro.datos_tributarios?.autoretenedor ? 'text-emerald-600' : 'text-zinc-400'}`}>
                        {selectedRegistro.datos_tributarios?.autoretenedor ? 'SÍ' : 'NO'}
                      </span>
                   </div>
                   <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Gran Contribuyente:</span>
                      <span className={`font-bold ${selectedRegistro.datos_tributarios?.gran_contribuyente ? 'text-emerald-600' : 'text-zinc-400'}`}>
                        {selectedRegistro.datos_tributarios?.gran_contribuyente ? 'SÍ' : 'NO'}
                      </span>
                   </div>
                   <DataItem label="Contacto Contabilidad" value={selectedRegistro.datos_contabilidad?.nombre} />
                   <DataItem label="Email Contabilidad" value={selectedRegistro.datos_contabilidad?.email} />
                </div>
              </div>

              {/* Documents & Actions */}
              <div className="space-y-6">
                <SectionTitle icon={Briefcase} title="Soportes y Acciones" />
                
                <div className="space-y-3">
                  {selectedRegistro.doc_rut_url && (
                    <a 
                      href={selectedRegistro.doc_rut_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between group hover:bg-emerald-600 hover:border-emerald-600 transition-all text-emerald-700 hover:text-white"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={20} />
                        <span className="text-xs font-black uppercase">Descargar RUT</span>
                      </div>
                      <Download size={18} />
                    </a>
                  )}

                  {selectedRegistro.doc_camara_comercio_url && (
                    <a 
                      href={selectedRegistro.doc_camara_comercio_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between group hover:bg-blue-600 hover:border-blue-600 transition-all text-blue-700 hover:text-white"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 size={20} />
                        <span className="text-xs font-black uppercase">Cámara de Comercio</span>
                      </div>
                      <Download size={18} />
                    </a>
                  )}
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-zinc-200 mt-8 space-y-4">
                  <p className="text-xs font-black text-center text-zinc-400 uppercase tracking-widest mb-4">Gestión de Estado</p>
                  <button 
                    onClick={() => {
                      onUpdateStatus(selectedRegistro.id, 'Aprobado');
                      setSelectedRegistro({...selectedRegistro, estado: 'Aprobado'});
                    }}
                    className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${selectedRegistro.estado === 'Aprobado' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 'bg-zinc-50 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 border border-zinc-100'}`}
                  >
                    <CheckCircle2 size={20} /> APROBAR REGISTRO
                  </button>
                  <button 
                    onClick={() => {
                      onUpdateStatus(selectedRegistro.id, 'Rechazado');
                      setSelectedRegistro({...selectedRegistro, estado: 'Rechazado'});
                    }}
                    className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${selectedRegistro.estado === 'Rechazado' ? 'bg-rose-500 text-white shadow-xl shadow-rose-100' : 'bg-zinc-50 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 border border-zinc-100'}`}
                  >
                    <XCircle size={20} /> RECHAZAR
                  </button>

                  {currentUser?.rol === 'Admin' && onDelete && (
                    <button 
                      onClick={() => {
                        if (window.confirm('¿Está seguro de eliminar este registro permanentemente?')) {
                          onDelete(selectedRegistro.id);
                          setSelectedRegistro(null);
                        }
                      }}
                      className="w-full py-3 rounded-2xl font-bold text-xs text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      🗑️ ELIMINAR PERMANENTEMENTE
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default RegistrosWeb;
