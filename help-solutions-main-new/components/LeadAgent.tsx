'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2, MinusCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const LeadAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy Helpi, tu asistente experto de Help Soluciones. ¿En qué puedo ayudarte con tu infraestructura tecnológica hoy?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
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

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.message || 'Lo siento, tuve un problema técnico. ¿Podrías intentar de nuevo o contactarnos por WhatsApp?';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-4 sm:bottom-8 sm:left-8 z-[99999] flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
        aria-label="Abrir chat de ayuda"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 sm:bottom-10 sm:left-10 z-[99999] w-full sm:w-[400px] bg-background/95 backdrop-blur-md border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${isMinimized ? 'h-[60px]' : 'h-[85vh] sm:h-[500px]'}`}>
      {/* Header */}
      <div className="bg-primary p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Helpi - Asistente TI</h3>
            <p className="text-[10px] opacity-80">En línea ahora</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/10 rounded transition-colors" aria-label={isMinimized ? "Maximizar chat" : "Minimizar chat"}>
            <MinusCircle size={18} />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded transition-colors" aria-label="Cerrar chat de ayuda">
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide overscroll-contain">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start items-end'}`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Bot size={16} className="text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-muted text-foreground rounded-tl-none border border-border shadow-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Bot size={16} className="text-primary" />
                </div>
                <div className="bg-muted p-3 rounded-2xl rounded-tl-none border border-border flex gap-1 items-center h-10 px-4">
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-[bounce_1s_infinite_0ms]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-[bounce_1s_infinite_400ms]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-background/50">
            <form className="relative" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="w-full bg-muted/50 border border-border rounded-xl py-2 pl-4 pr-10 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                aria-label="Enviar mensaje"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-[9px] text-center mt-2 text-muted-foreground">
              Desarrollado por Help Soluciones IA
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default LeadAgent;
