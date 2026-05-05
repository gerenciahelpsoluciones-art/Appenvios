"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, ShieldCheck, Headset } from 'lucide-react';

interface Agent {
  name: string;
  role: string;
  phone: string;
  icon: React.ReactNode;
  color: string;
}

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const agents: Agent[] = [
    {
      name: 'Lidy Hernandez',
      role: 'Ejecutiva Comercial',
      phone: '573123709335',
      icon: <User size={20} />,
      color: 'bg-blue-500'
    },
    {
      name: 'Deicy Rodriguez',
      role: 'Ejecutiva Comercial',
      phone: '573213950191',
      icon: <User size={20} />,
      color: 'bg-purple-500'
    },
    {
      name: 'Soporte General',
      role: 'Centro de Soluciones',
      phone: '573113522760',
      icon: <Headset size={20} />,
      color: 'bg-primary'
    }
  ];

  useEffect(() => {
    // Aparece el tooltip después de 3 segundos si no está abierto
    const timer = setTimeout(() => {
      if (!isOpen) setShowTooltip(true);
    }, 3000);

    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpenChat = (phone: string, name: string) => {
    const message = `Hola ${name}, vengo desde la web de Help Soluciones y me gustaría recibir asesoría técnica.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end" ref={widgetRef}>
      
      {/* Tooltip */}
      {showTooltip && !isOpen && (
        <div className="bg-white p-4 rounded-2xl shadow-2xl border border-zinc-100 max-w-[260px] relative mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => setShowTooltip(false)}
            className="absolute -top-2 -right-2 bg-zinc-100 p-1 rounded-full text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <X size={12} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-[#25D366]"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">En línea ahora</span>
          </div>
          <p className="text-zinc-800 text-sm font-bold leading-tight">
            ¿Buscas optimizar tu infraestructura? Chatea con nuestras expertas.
          </p>
        </div>
      )}

      {/* Agents Menu */}
      {isOpen && (
        <div className="bg-white/90 backdrop-blur-xl border border-zinc-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-6 w-[320px] mb-4 animate-in zoom-in-95 fade-in slide-in-from-bottom-10 duration-300 origin-bottom-right">
          <div className="flex items-center justify-between mb-6 border-b border-zinc-100 pb-4">
            <div className="flex flex-col">
              <h3 className="text-zinc-900 font-black text-xl tracking-tighter">Centro de Soluciones</h3>
              <p className="text-zinc-500 text-xs font-medium">Elige una ejecutiva para iniciar</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {agents.map((agent, idx) => (
              <button
                key={idx}
                onClick={() => handleOpenChat(agent.phone, agent.name)}
                className="group flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-transparent hover:border-primary/20 hover:bg-white transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${agent.color} flex items-center justify-center text-white shadow-inner relative overflow-hidden`}>
                    {agent.icon}
                    <div className="absolute inset-0 bg-white/10 group-hover:bg-white/0 transition-colors" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-zinc-900 font-bold text-sm">{agent.name}</span>
                    <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">{agent.role}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-all scale-90 group-hover:scale-100">
                  <Send size={14} />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-2 justify-center opacity-50">
            <ShieldCheck size={14} className="text-zinc-400" />
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Conexión Segura Help Soluciones</span>
          </div>
        </div>
      )}
      
      {/* Main Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowTooltip(false);
        }}
        className={`relative flex items-center justify-center w-16 h-16 ${
          isOpen ? 'bg-zinc-900 rotate-90' : 'bg-[#25D366]'
        } rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.3)] hover:scale-110 active:scale-95 transition-all duration-500 z-10 group`}
        aria-label="Abrir centro de contacto"
      >
        {isOpen ? (
          <X className="w-8 h-8 text-white" />
        ) : (
          <>
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-ping duration-[2000ms]"></span>
            <MessageCircle className="w-9 h-9 text-white relative z-10 group-hover:rotate-12 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
}
