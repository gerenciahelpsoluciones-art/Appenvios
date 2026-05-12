'use client'
import React, { useState } from 'react';

const ContactCTA: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('sending');

        fetch("https://formsubmit.co/ajax/ventasonline@helpsoluciones.com.co", {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                _subject: "Nuevo Contacto de Evaluación Gratuita (CTA)",
                _captcha: "false",
                _template: "table",
                "Correo de Contacto": email
            })
        })
            .then(response => response.json())
            .then((result) => {
                setStatus('success');
                setEmail('');
            })
            .catch((error) => {
                setStatus('error');
            });
    };

    return (
        <section className="px-4 py-12 md:px-10 md:py-20 mb-10" id="contacto">
            <div className="rounded-2xl glass-card p-8 md:p-16 flex flex-col items-center text-center gap-8 relative overflow-hidden shadow-2xl transition-all duration-500 hover:border-primary/30">
                {/* Background glow effect - enhanced */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex flex-col gap-4 max-w-[700px]">
                    <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wider uppercase mx-auto">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Diagnóstico Gratuito — Sin Compromiso
                    </div>
                    <h2 className="text-zinc-900 text-3xl md:text-5xl font-display font-black leading-tight text-glow">
                        ¿Su infraestructura TI está protegida hoy?
                    </h2>
                    <p className="text-zinc-700 text-base md:text-lg font-medium leading-relaxed">
                        Déjenos su correo y un ingeniero certificado evaluará su sistema actual — sin costo ni obligación. Respuesta garantizada en menos de 2 horas.
                    </p>
                </div>

                <div className="relative z-10 w-full max-w-[500px]">
                    <form className="flex flex-col md:flex-row w-full gap-3 p-1 rounded-xl bg-black/5 backdrop-blur-md border border-black/10" onSubmit={handleSubmit}>
                        <input
                            className="flex-1 rounded-lg bg-transparent text-zinc-900 px-4 py-3 focus:outline-none placeholder:text-zinc-400 transition-all"
                            placeholder="correo@suempresa.com"
                            type="email"
                            id="cta-email"
                            name="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={status === 'sending'}
                        />
                        <button
                            type="submit"
                            disabled={status === 'sending'}
                            className={`flex items-center justify-center rounded-lg bg-primary hover:bg-primary-hover transition-all duration-300 text-white px-8 py-3 font-bold font-display tracking-wide shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:scale-105 active:scale-95 ${status === 'sending' ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {status === 'sending' ? 'Enviando…' : 'Solicitar Evaluación'}
                        </button>
                    </form>
                    
                    {status === 'success' && (
                        <p className="text-green-400 text-sm mt-4 font-bold flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            ¡Gracias! Nos pondremos en contacto pronto.
                        </p>
                    )}
                    {status === 'error' && (
                        <p className="text-red-400 text-sm mt-4 font-bold">
                            Hubo un error al enviar. Por favor intente nuevamente.
                        </p>
                    )}
                    {status === 'idle' && (
                        <p className="text-zinc-500 text-xs mt-4 font-medium tracking-wide italic">
                            Respetamos su privacidad. No enviamos spam.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ContactCTA;