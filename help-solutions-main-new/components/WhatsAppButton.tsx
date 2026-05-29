'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, User, Mail, X, Send } from 'lucide-react';

interface Agent {
  name: string;
  role: string;
  phone: string;
  email: string;
  avatar?: string;
}

const WhatsAppButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const agents: Agent[] = [
    {
      name: 'Lidy Hernandez',
      role: 'Ejecutiva Comercial',
      phone: '573123709335',
      email: 'lidy.hernandez@helpsoluciones.com.co'
    },
    {
      name: 'Deicy Rodriguez',
      role: 'Ejecutiva Comercial',
      phone: '573213950191',
      email: 'deicy.rodriguez@helpsoluciones.com.co'
    },
    {
      name: 'Soporte General',
      role: 'Centro de Soluciones',
      phone: '573113522760',
      email: 'gerencia@helpsoluciones.com.co'
    }
  ];

  const toggleOpen = () => setIsOpen(!isOpen);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getWhatsappUrl = (phone: string, name: string) => {
    const message = `Hola ${name}, me gustaría más información sobre los servicios de Help Soluciones.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-4" ref={containerRef}>
      
      {/* Popover Menu */}
      <div 
        className={`transition-all duration-500 origin-bottom-right transform ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'
        } bg-white/90 backdrop-blur-xl border border-zinc-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl p-4 sm:p-6 w-[calc(100vw-2rem)] sm:w-[360px] flex flex-col gap-4 sm:gap-6`}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex flex-col">
            <h3 className="text-zinc-900 font-display font-bold text-lg">Centro de Contacto</h3>
            <p className="text-zinc-500 text-xs font-medium">Elige una ejecutiva para chatear</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
            aria-label="Cerrar centro de contacto"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {agents.map((agent, index) => (
            <div 
              key={index} 
              className="group flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-transparent hover:border-primary/20 hover:bg-white transition-all shadow-sm hover:shadow-md cursor-pointer"
              onClick={() => window.open(getWhatsappUrl(agent.phone, agent.name), '_blank')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 overflow-hidden relative">
                  <User size={20} />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-900 font-bold text-sm tracking-tight">{agent.name}</span>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{agent.role}</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-all scale-90 group-hover:scale-100">
                <Send size={14} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 flex items-center justify-between text-white">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Atención Inmediata</span>
            <span className="text-xs font-medium">Lunes - Viernes 8am - 6pm</span>
          </div>
          <div className="p-2 bg-white/10 rounded-lg">
            <MessageCircle size={16} className="text-primary" />
          </div>
        </div>
      </div>

      {/* Main Trigger Button */}
      <div className="flex items-center gap-3 group">
        <div 
          className={`hidden md:block transition-all duration-300 ${
            isOpen ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          } bg-white text-zinc-900 px-4 py-2 rounded-xl shadow-lg font-bold text-xs whitespace-nowrap border border-zinc-100 relative`}
        >
          ¡Hola! ¿Cómo podemos ayudarte?
          <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-white transform rotate-45 border-t border-r border-zinc-100"></div>
        </div>

        <button
          onClick={toggleOpen}
          className={`relative flex items-center justify-center w-14 h-14 ${
            isOpen ? 'bg-zinc-900' : 'bg-[#25D366]'
          } rounded-full shadow-lg transition-all duration-500 hover:scale-110 active:scale-95 z-10`}
          aria-label="Abrir centro de contacto"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-ping duration-[2000ms]"></span>
              <svg
                className="w-8 h-8 text-white relative z-10"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WhatsAppButton;
