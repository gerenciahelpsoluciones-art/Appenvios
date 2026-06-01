'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Loader2, Minus, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

const QUICK_ACTIONS = [
  '¿Qué servicios ofrecen?',
  'Necesito soporte urgente',
  'Quiero una cotización',
  '¿Tienen cobertura en mi ciudad?',
];

const LeadAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy **Helpi**, tu asistente experto de Help Soluciones. 👋\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Mensaje proactivo después de 15s si el chat no se ha abierto
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) setUnreadCount(1);
    }, 15000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.content, timestamp: new Date() }]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, tuve un problema técnico. Contáctenos directamente: **+57 304 3358650** o **gerencia@helpsoluciones.com.co**',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  // Botón flotante cerrado
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-4 sm:bottom-8 sm:left-8 z-[99999] flex items-center gap-3 bg-primary text-white pl-3 pr-4 py-3 rounded-full shadow-[0_8px_30px_rgba(37,99,234,0.4)] hover:shadow-[0_12px_40px_rgba(37,99,234,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 group"
        aria-label="Abrir chat con Helpi"
      >
        <div className="relative">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={18} />
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-sm font-bold hidden sm:block">Hablar con Helpi</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-0 left-0 sm:bottom-8 sm:left-8 z-[99999] w-full sm:w-[400px] flex flex-col
        bg-white/95 backdrop-blur-xl border border-zinc-200/80 sm:rounded-2xl rounded-t-2xl
        shadow-[0_25px_60px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-500
        ${isMinimized ? 'h-[64px]' : 'h-[85vh] sm:h-[540px]'}`}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-blue-600 text-white shrink-0">
        {/* Decoración */}
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Bot size={20} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm leading-tight">Helpi</span>
              <Sparkles size={12} className="opacity-70" />
            </div>
            <p className="text-[10px] opacity-75 leading-tight">Asistente TI · En línea</p>
          </div>
        </div>

        <div className="flex items-center gap-1 relative z-10">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
            aria-label={isMinimized ? 'Maximizar chat' : 'Minimizar chat'}
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
            aria-label="Cerrar chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth overscroll-contain" style={{ scrollbarWidth: 'none' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start items-end'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Bot size={14} className="text-primary" />
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[82%]">
                  <div
                    className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary text-white rounded-2xl rounded-tr-sm shadow-[0_2px_12px_rgba(37,99,234,0.25)]'
                        : 'bg-zinc-50 text-zinc-800 rounded-2xl rounded-tl-sm border border-zinc-200/80 shadow-sm'
                    }`}
                    dangerouslySetInnerHTML={{ __html: formatContent(m.content) }}
                  />
                  <span className={`text-[10px] text-zinc-400 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {formatTime(m.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Bot size={14} className="text-primary" />
                </div>
                <div className="bg-zinc-50 border border-zinc-200/80 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 200, 400].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick actions — solo al inicio */}
            {messages.length === 1 && !isLoading && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="text-xs bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/40 px-3 py-1.5 rounded-full transition-all duration-200 font-medium"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-zinc-100 bg-white/80 backdrop-blur-sm">
            <form
              className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all"
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            >
              <input
                ref={inputRef}
                id="helpi-input"
                name="helpi-message"
                type="text"
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta…"
                className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none min-w-0"
                aria-label="Mensaje para Helpi"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="shrink-0 w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-all active:scale-90"
                aria-label="Enviar mensaje"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
            <p className="text-[9px] text-center mt-2 text-zinc-400 tracking-wide">
              Helpi IA · Help Soluciones · +57 304 3358650
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default LeadAgent;
