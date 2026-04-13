import React, { useState } from 'react';
import { type AppUser } from '../types/crm';
import { Phone, Mail, Building, Clock, CircleCheck, CircleX, MessageSquare, Sparkles, Share2, Copy, Send } from 'lucide-react';

export interface ClienteWeb {
  id: string;
  created_at: string;
  nombre: string;
  empresa?: string;
  email?: string;
  telefono: string;
  requerimiento: string;
  historial_chat?: any;
  borrador_cotizacion?: any;
  estado: 'Nuevo' | 'Cotizando' | 'Cerrado' | 'Perdido';
  asesor?: string;
}

interface LeadsWebProps {
  leads: ClienteWeb[];
  onUpdateLead: (lead: ClienteWeb) => Promise<void>;
  currentUser?: AppUser | null;
}

const COLUMNS: { id: ClienteWeb['estado'], label: string, color: string }[] = [
  { id: 'Nuevo', label: 'Nuevos Leads', color: 'bg-blue-500' },
  { id: 'Cotizando', label: 'En Cotización', color: 'bg-yellow-500' },
  { id: 'Cerrado', label: 'Ganados', color: 'bg-green-500' },
  { id: 'Perdido', label: 'Perdidos', color: 'bg-red-500' },
];

const LeadsWebModule: React.FC<LeadsWebProps> = ({ leads, onUpdateLead, currentUser }) => {
  const [selectedLead, setSelectedLead] = useState<ClienteWeb | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleStatusChange = async (lead: ClienteWeb, newStatus: ClienteWeb['estado']) => {
    if (lead.estado === newStatus) return;
    await onUpdateLead({ ...lead, estado: newStatus });
    if (selectedLead?.id === lead.id) {
      setSelectedLead({ ...lead, estado: newStatus });
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-zinc-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles size={24} className="text-purple-600" /> Leads Web (Helpi)
          </h2>
          <p className="text-zinc-500 mt-1">Gestión de prospectos capturados inteligentemente por el bot Helpi</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colLeads = leads.filter(l => {
            const isAdmin = currentUser?.rol === 'Admin';
            const isOwner = l.asesor && currentUser?.nombre && 
                            l.asesor.toLowerCase().includes(currentUser.nombre.split(' ')[0].toLowerCase());
            
            // Si el lead YA tiene asesor, y no soy Admin ni el dueño de este lead, lo oculto de mi vista
            if (!isAdmin && !isOwner && l.asesor) return false;

            return col.id === 'Nuevo' ? (l.estado === 'Nuevo' || !l.estado) : l.estado === col.id;
          });
          return (
            <div key={col.id} className="flex-1 min-w-[300px] bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex flex-col h-[70vh]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${col.color}`}></div>
                  <h3 className="font-bold text-zinc-700">{col.label}</h3>
                </div>
                <span className="bg-white px-2 py-1 rounded-md text-xs font-bold border border-zinc-200 text-zinc-500 shadow-sm">
                  {colLeads.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {colLeads.map(lead => (
                  <div 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-zinc-200 hover:border-purple-400 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-zinc-900 text-sm group-hover:text-purple-700 transition-colors">{lead.nombre}</h4>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium bg-zinc-100 px-1.5 py-0.5 rounded">
                        <Clock size={10} /> {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {lead.empresa && (
                      <p className="text-[11px] text-zinc-600 flex items-center gap-1 mb-1 font-medium">
                        <Building size={12} className="text-zinc-400" /> {lead.empresa}
                      </p>
                    )}
                    <p className="text-[11px] text-zinc-600 flex items-center gap-1 mb-3">
                      <Phone size={12} className="text-zinc-400" /> {lead.telefono}
                    </p>
                    {lead.asesor && (
                      <p className="text-[10px] text-zinc-500 font-bold mb-2 bg-indigo-50 text-indigo-700 w-fit px-2 py-0.5 rounded-sm">
                        Asignado a: {lead.asesor}
                      </p>
                    )}
                    <div className="bg-zinc-50 text-zinc-700 p-2.5 rounded-lg border border-zinc-100 text-xs line-clamp-2 italic leading-relaxed">
                      "{lead.requerimiento}"
                    </div>
                    {lead.borrador_cotizacion && (
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-purple-700 font-bold bg-purple-50 border border-purple-100 px-2 py-1 rounded-md w-fit shadow-[0_2px_4px_rgba(147,51,234,0.1)]">
                        <Sparkles size={10} className="animate-pulse" /> IA Draft Listo
                      </div>
                    )}
                  </div>
                ))}
                {colLeads.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 text-zinc-400 text-xs gap-2 opacity-50">
                    <CircleCheck size={24} />
                    <span>Columna vacía</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-zinc-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-start bg-white">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {selectedLead.nombre.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900">{selectedLead.nombre}</h2>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-xs font-medium text-zinc-600">
                  {selectedLead.empresa && <span className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-full"><Building size={14} className="text-zinc-400"/> {selectedLead.empresa}</span>}
                  <span className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-full"><Phone size={14} className="text-zinc-400"/> {selectedLead.telefono}</span>
                  {selectedLead.email && <span className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-full"><Mail size={14} className="text-zinc-400"/> {selectedLead.email}</span>}
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedLead(null);
                  setShowSharePanel(false);
                }}
                className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 text-zinc-400 border border-zinc-200 transition-colors"
              >
                <CircleX size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-zinc-50/50">
              
              {/* Request Update Section */}
              <div className="mb-6 p-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-100 shadow-sm">
                <div className="bg-white p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Share2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Actualización de Datos</h3>
                      <p className="text-[11px] text-slate-500">Solicita al cliente que actualice su información corporativa (RUT, Cámara, etc.)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSharePanel(!showSharePanel)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-100 flex items-center gap-2"
                  >
                    {showSharePanel ? 'Ocultar' : 'Solicitar'}
                  </button>
                </div>

                {showSharePanel && (
                  <div className="p-4 bg-emerald-50/30 border-t border-emerald-100 mt-1 rounded-b-xl animate-fade-in">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-emerald-100 shadow-inner overflow-hidden">
                        <span className="text-[10px] text-slate-400 truncate flex-1 font-mono">
                          {window.location.origin}/?form=registro
                        </span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/?form=registro`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                          {copied ? <CircleCheck size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      
                      <div className="flex gap-2">
                        <a 
                          href={`mailto:${selectedLead.email || ''}?subject=Actualización de Datos Corporativos - Appenvios&body=Hola ${selectedLead.nombre},%0D%0A%0D%0APor favor, ayúdanos a mantener nuestra información actualizada completando el siguiente formulario de registro corporativo:%0D%0A%0D%0A${window.location.origin}/?form=registro%0D%0A%0D%0A¡Muchas gracias!`}
                          className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                          <Send size={14} /> Enviar por Correo
                        </a>
                        <a 
                          href={`https://wa.me/${selectedLead.telefono.replace(/\D/g, '')}?text=Hola+${encodeURIComponent(selectedLead.nombre)},+por+favor+podrías+actualizar+tus+datos+corporativos+aquí:+${encodeURIComponent(window.location.origin + '/?form=registro')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#22c35e] transition-all shadow-lg shadow-green-100"
                        >
                          <MessageSquare size={14} /> WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-zinc-900 mb-3 text-sm flex items-center gap-2">
                <MessageSquare size={16} /> Requerimiento Solicitado
              </h3>
              <div className="bg-white text-zinc-700 p-5 rounded-2xl text-sm italic mb-8 border border-zinc-200 shadow-sm leading-relaxed">
                "{selectedLead.requerimiento}"
              </div>

              {selectedLead.borrador_cotizacion ? (
                <div className="mb-8 border border-purple-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-purple-50 p-4 border-b border-purple-100 flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-600" />
                    <h3 className="font-bold text-purple-900 text-sm">Draft Mágico de Cotización (IA)</h3>
                  </div>
                  <div className="p-4 bg-white overflow-x-auto">
                    <pre className="text-[11px] text-zinc-600 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedLead.borrador_cotizacion, null, 2)}
                    </pre>
                  </div>
                  <div className="p-5 bg-purple-50/50 border-t border-purple-100">
                    <button 
                      onClick={() => alert('¡Próximamente! Este botón abrirá y rellenará el formulario de nueva Cotización con los datos de este lead al instante.')}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(147,51,234,0.2)] hover:shadow-[0_12px_24px_rgba(147,51,234,0.3)] transition-all hover:-translate-y-0.5"
                    >
                      <Sparkles size={18} />
                      Convertir a Cotización Real
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-6 bg-white border border-zinc-200 border-dashed rounded-2xl text-center text-zinc-400 text-sm flex flex-col items-center justify-center gap-3">
                  <Sparkles size={24} className="text-zinc-200 opacity-50" />
                  <p>El bot no ha adjuntado un borrador de productos para este lead.</p>
                </div>
              )}

              {selectedLead.historial_chat && (
                <div>
                  <h3 className="font-bold text-zinc-900 mb-4 text-sm flex items-center gap-2">
                    <MessageSquare size={16} /> Historial Exacto del Chat
                  </h3>
                  <div className="space-y-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                    {Array.isArray(selectedLead.historial_chat) ? (
                      selectedLead.historial_chat.map((msg: any, idx: number) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-tl-none'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500">Formato de historial no soportado.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 bg-white border-t border-zinc-100 flex flex-wrap justify-between items-center gap-4">
              <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Mover a columna:</span>
              <div className="flex gap-2">
                <button onClick={() => handleStatusChange(selectedLead, 'Nuevo')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedLead.estado === 'Nuevo' ? 'bg-blue-500 text-white shadow-md' : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'}`}>Nuevo</button>
                <button onClick={() => handleStatusChange(selectedLead, 'Cotizando')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedLead.estado === 'Cotizando' ? 'bg-yellow-500 text-white shadow-md' : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'}`}>Cotizando</button>
                <button onClick={() => handleStatusChange(selectedLead, 'Cerrado')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedLead.estado === 'Cerrado' ? 'bg-green-500 text-white shadow-md' : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'}`}>Ganado</button>
                <button onClick={() => handleStatusChange(selectedLead, 'Perdido')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedLead.estado === 'Perdido' ? 'bg-red-500 text-white shadow-md' : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'}`}>Perdido</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsWebModule;
