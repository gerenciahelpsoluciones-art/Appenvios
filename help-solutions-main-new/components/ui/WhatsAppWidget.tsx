"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function WhatsAppWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Aparece después de 3 segundos
    const timer = setTimeout(() => {
      setIsVisible(true);
      setShowTooltip(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700">
      {showTooltip && (
        <div className="bg-white p-4 rounded-2xl shadow-2xl border border-zinc-100 max-w-[250px] relative mb-2">
          <button 
            onClick={() => setShowTooltip(false)}
            className="absolute -top-2 -right-2 bg-zinc-100 p-1 rounded-full text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <X size={12} />
          </button>
          <p className="text-zinc-800 text-sm font-medium">
            👋 ¡Hola! Soy el experto de Help Soluciones. ¿En qué puedo ayudarte con tu infraestructura hoy?
          </p>
        </div>
      )}
      
      <a
        href="https://wa.me/573102172251"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#25D366] hover:bg-[#20B558] text-white p-4 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-all duration-300 group relative"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle size={32} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-white/20"></span>
        </span>
      </a>
    </div>
  );
}
