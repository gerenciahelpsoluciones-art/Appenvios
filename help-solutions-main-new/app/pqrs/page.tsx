"use client";

import React, { useRef, useState } from 'react';
import { Mail, Send, FileText, AlertCircle, HelpCircle, ThumbsUp, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function PQRSPage() {
    const form = useRef<HTMLFormElement>(null);
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const sendEmail = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.current) return;

        setStatus('sending');

        const formData = new FormData(form.current);
        const data = Object.fromEntries(formData.entries());
        
        // Configuraciones de Formsubmit
        const tipo = formData.get('type') || 'PQRS General';
        data._subject = `Nueva Solicitud [${tipo}]: ${formData.get('subject') || 'Sin Asunto'}`;
        data._captcha = "false"; 
        data._template = "table";

        fetch("https://formsubmit.co/ajax/ventasonline@helpsoluciones.com.co", {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then((result) => {
                console.log(result);
                setStatus('success');
                form.current?.reset();
            })
            .catch((error) => {
                console.log(error);
                setStatus('error');
            });
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-[#101822] py-20 px-4 md:px-10 overflow-hidden min-h-[500px] flex items-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#101822] to-[#101822] pointer-events-none" />
                <div className="max-w-6xl mx-auto relative z-10 w-full text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                        <FileText size={14} /> Centro de Atención
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight mb-6">
                        PQRS
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Preguntas, Quejas, Reclamos, Sugerencias y Felicitaciones. Su opinión es fundamental para nuestra mejora continua.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-20 px-4 md:px-10 bg-gray-50">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* PQRS Form */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Radicar Solicitud</h2>
                        <form ref={form} onSubmit={sendEmail} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="user_name" className="text-sm font-medium text-slate-700">Nombre Completo</label>
                                    <input
                                        type="text"
                                        name="user_name"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Su nombre"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="user_email" className="text-sm font-medium text-slate-700">Email</label>
                                    <input
                                        type="email"
                                        name="user_email"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium text-slate-700">Teléfono (Opcional)</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="+57 300 000 0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="type" className="text-sm font-medium text-slate-700">Tipo de Solicitud</label>
                                    <div className="relative">
                                        <select
                                            name="type"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Seleccione una opción</option>
                                            <option value="Peticion">Petición / Pregunta</option>
                                            <option value="Queja">Queja</option>
                                            <option value="Reclamo">Reclamo</option>
                                            <option value="Sugerencia">Sugerencia</option>
                                            <option value="Felicitacion">Felicitación</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-medium text-slate-700">Asunto</label>
                                <input
                                    type="text"
                                    name="subject"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Breve descripción del tema"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium text-slate-700">Detalle de la Solicitud</label>
                                <textarea
                                    name="message"
                                    required
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                    placeholder="Por favor describa su solicitud con el mayor detalle posible..."
                                ></textarea>
                            </div>

                            <div className="flex items-start gap-3">
                                <input type="checkbox" id="terms" required className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                <label htmlFor="terms" className="text-sm text-slate-600">
                                    Acepto la política de tratamiento de datos personales y autorizo a Help Soluciones a contactarme para dar respuesta a esta solicitud.
                                </label>
                            </div>

                            <Button
                                variant="primary"
                                className={`w-full justify-center ${status === 'sending' ? 'opacity-70 cursor-wait' : ''}`}
                                disabled={status === 'sending'}
                            >
                                {status === 'sending' ? 'Radicando...' : (
                                    <>Radicar Solicitud <Send size={18} /></>
                                )}
                            </Button>

                            {status === 'success' && (
                                <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium text-center">
                                    ¡Solicitud radicada con éxito! Hemos enviado una copia a su correo.
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium text-center">
                                    Hubo un error al procesar su solicitud. Por favor intente nuevamente o contáctenos directamente.
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Information Column */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Glosario PQRS</h2>
                            <p className="text-slate-600 mb-6">Para brindarle una mejor atención, identifique el tipo de solicitud que desea realizar:</p>
                        </div>

                        <div className="grid gap-4">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                                <div className="mt-1 text-blue-500 shrink-0"><HelpCircle size={20} /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Petición / Pregunta</h3>
                                    <p className="text-sm text-slate-600 mt-1">Solicitud de información sobre nuestros servicios, productos o gestión.</p>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                                <div className="mt-1 text-amber-500 shrink-0"><AlertCircle size={20} /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Queja</h3>
                                    <p className="text-sm text-slate-600 mt-1">Manifestación de insatisfacción con la conducta de nuestros colaboradores.</p>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                                <div className="mt-1 text-red-500 shrink-0"><MessageSquare size={20} /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Reclamo</h3>
                                    <p className="text-sm text-slate-600 mt-1">Disconformidad relacionada con la prestación de nuestros servicios o productos adquiridos.</p>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                                <div className="mt-1 text-green-500 shrink-0"><ThumbsUp size={20} /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Sugerencia / Felicitación</h3>
                                    <p className="text-sm text-slate-600 mt-1">Propuesta para mejorar nuestro servicio o reconocimiento por una buena gestión.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mt-8">
                            <div className="flex items-center gap-3 mb-4 text-blue-800">
                                <Mail size={20} />
                                <h3 className="font-bold">Canales Alternativos</h3>
                            </div>
                            <p className="text-sm text-slate-600 mb-4">
                                También puede radicar su solicitud escribiendo directamente a nuestro correo electrónico corporativo:
                            </p>
                            <a href="mailto:info@helpsoluciones.com" className="text-primary font-medium hover:underline">
                                info@helpsoluciones.com
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
