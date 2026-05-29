"use client";

import React, { useRef, useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ContactPage() {
    const form = useRef<HTMLFormElement>(null);
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const sendEmail = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.current) return;

        setStatus('sending');

        const formData = new FormData(form.current);
        const data = Object.fromEntries(formData.entries());
        
        // Configuraciones de Formsubmit
        data._subject = formData.get('subject') ? `Nuevo Contacto: ${formData.get('subject')}` : "Nuevo Mensaje de Contacto";
        data._captcha = "false"; // Desactivar captcha para una mejor UX inicial (opcional)
        data._template = "table"; // Estilo de correo en tabla

        fetch("https://formsubmit.co/ajax/gerencia@helpsoluciones.com.co", {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Integración con n8n Lead Capture
        fetch("http://localhost:5678/webhook/web-leads", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...data,
                source: 'web-principal',
                timestamp: new Date().toISOString()
            })
        })
            .then(response => response.json())
            .then((result) => {
                console.log("n8n Lead captured:", result);
                setStatus('success');
                form.current?.reset();
            })
            .catch((error) => {
                console.error("n8n/fetch error:", error);
                // No bloqueamos totalmente el envío, pero marcamos éxito si al menos uno funcionó (o error si falló n8n)
                setStatus('error');
            });
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-[#101822] py-20 px-4 md:px-10 overflow-hidden min-h-[500px] flex items-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#101822] to-[#101822] pointer-events-none" />
                <div className="max-w-6xl mx-auto relative z-10 w-full text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                        <MessageSquare size={14} /> Contáctenos
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight mb-6">
                        Hablemos de su Seguridad
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Estamos listos para ayudarle a proteger y optimizar su infraestructura tecnológica through.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-20 px-4 md:px-10 bg-gray-50">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Contact Form */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Envíenos un mensaje</h2>
                        <form ref={form} onSubmit={sendEmail} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="user_name" className="text-sm font-medium text-slate-700">Nombre</label>
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
                                        placeholder="correo@empresa.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-medium text-slate-700">Asunto</label>
                                <input
                                    type="text"
                                    name="subject"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="¿En qué podemos ayudarle?"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium text-slate-700">Mensaje</label>
                                <textarea
                                    name="message"
                                    required
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                    placeholder="Detalles sobre su consulta..."
                                ></textarea>
                            </div>

                            <Button
                                variant="primary"
                                className={`w-full justify-center ${status === 'sending' ? 'opacity-70 cursor-wait' : ''}`}
                                disabled={status === 'sending'}
                            >
                                {status === 'sending' ? 'Enviando...' : (
                                    <>Enviar Mensaje <Send size={18} /></>
                                )}
                            </Button>

                            {status === 'success' && (
                                <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium text-center">
                                    ¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium text-center">
                                    Hubo un error al enviar el mensaje. Por favor intente nuevamente.
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Contact Info & Map */}
                    <div className="space-y-8">
                        {/* Info Cards */}
                        <div className="grid gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-xl text-primary">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">Email</h3>
                                    <p className="text-slate-600 text-sm">gerencia@helpsoluciones.com.co</p>
                                    <p className="text-slate-400 text-xs mt-1">Respuesta en 24h</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                                <div className="p-3 bg-green-50 rounded-xl text-green-600">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">Teléfono</h3>
                                    <p className="text-slate-600 text-sm">+57 311 3522760</p>
                                    <p className="text-slate-400 text-xs mt-1">Lunes a Viernes, 8am - 6pm</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">Ubicación</h3>
                                    <p className="text-slate-600 text-sm">Bogotá, Colombia</p>
                                    <p className="text-slate-400 text-xs mt-1">Calle 6c #82a-91 oficina 2 apto 204 torre 3 Aralia de Castilla</p>
                                </div>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 h-[300px] overflow-hidden relative">
                            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2238.958054358746!2d-74.15534772185754!3d4.642398397265803!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9c3b8cf47e3d%3A0xf100561014fc92a7!2sCl.%206c%20%2382a-91%2C%20Bogot%C3%A1!5e0!3m2!1ses!2sco!4v1769048997989!5m2!1ses!2sco" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>

                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
