import type { Metadata } from 'next';
import React from 'react';
import { Wrench, Clock, Server, Smartphone, Headphones, ShieldCheck, CheckCircle2, ArrowRight, Settings } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Mantenimiento Preventivo y Correctivo',
  description: 'Mantenimiento preventivo y correctivo para PCs, servidores y redes en Colombia. Planes con SLA garantizado y atención en menos de 2 horas. Pida su plan.',
  keywords: ['mantenimiento preventivo TI Colombia', 'mantenimiento correctivo PCs Bogotá', 'soporte técnico empresarial Colombia', 'mantenimiento servidores SLA', 'help desk Colombia', 'soporte TI empresas', 'mantenimiento hardware empresarial'],
  alternates: { canonical: 'https://www.helpsoluciones.com.co/mantenimiento' },
  openGraph: {
    title: 'Mantenimiento Preventivo y Correctivo | Help Soluciones',
    description: 'Mantenimiento preventivo y correctivo para PCs, servidores y redes en Colombia. Planes con SLA garantizado y atención en menos de 2 horas. Pida su plan.',
    url: 'https://www.helpsoluciones.com.co/mantenimiento',
  },
};

export default function MantenimientoPage() {
    const services = [
        {
            icon: <Server className="w-8 h-8 text-primary" />,
            title: "Servidores y Equipos",
            description: "Mantenimiento preventivo y correctivo para servidores, computadores de escritorio y portátiles."
        },
        {
            icon: <Smartphone className="w-8 h-8 text-primary" />,
            title: "Dispositivos Móviles",
            description: "Reparación y optimización de tablets y celulares corporativos."
        },
        {
            icon: <Settings className="w-8 h-8 text-primary" />,
            title: "Componentes Electrónicos",
            description: "Diagnóstico y reparación de componentes electrónicos esenciales para su operación."
        },
        {
            icon: <Headphones className="w-8 h-8 text-primary" />,
            title: "Soporte Remoto y en Sitio",
            description: "Atención flexible según su necesidad, ya sea visita presencial o asistencia remota inmediata."
        }
    ];

    const processSteps = [
        "Atención al cliente personalizada",
        "Asesoramiento experto",
        "Disponibilidad de repuestos originales",
        "Precios competitivos y ofertas",
        "Facturación transparente",
        "Entrega y puesta en marcha"
    ];

    const benefits = [
        {
            title: "Soluciones Especializadas",
            description: "Adaptamos nuestros servicios a las necesidades específicas de su industria."
        },
        {
            title: "Calidad y Garantía",
            description: "Servicio rápido, asequible y con garantía en cada intervención."
        },
        {
            title: "Precios Asequibles",
            description: "Equilibrio perfecto entre costo y beneficio, centrado en la confiabilidad."
        },
        {
            title: "Compra Segura",
            description: "Transparencia total y seguridad en la adquisición de repuestos y servicios."
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.helpsoluciones.com.co" }, { "@type": "ListItem", "position": 2, "name": "Mantenimiento Preventivo y Correctivo", "item": "https://www.helpsoluciones.com.co/mantenimiento" }] }) }} />
            {/* Hero Section */}
            <section className="relative bg-[#101822] py-20 px-4 md:px-10 overflow-hidden min-h-[900px]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#101822] to-[#101822] pointer-events-none" />
                <div className="max-w-6xl mx-auto relative z-10 text-center md:text-left flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                            <Wrench size={14} /> Soporte Técnico Integral
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
                            Mantenimiento Preventivo y Correctivo
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                            Minimizamos el tiempo de inactividad y maximizamos la productividad de su empresa con servicios técnicos especializados que cumplen los protocolos de los fabricantes.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                            <a href="https://wa.me/573043358650">
                                <Button variant="primary" className="gap-2">
                                    Agendar Visita Técnica <ArrowRight size={18} />
                                </Button>
                            </a>
                        </div>
                    </div>
                    <div className="flex-1 relative hidden md:block">
                        <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-gradient-to-tr from-green-500/10 to-transparent rounded-full blur-3xl" />
                        <div className="relative z-10 grid grid-cols-1 gap-4 max-w-md mx-auto">
                            <div className="bg-[#1a2332] border-l-4 border-green-500 p-6 rounded-r-xl shadow-2xl">
                                <div className="flex items-center gap-4">
                                    <Clock className="w-12 h-12 text-gray-500 shrink-0" />
                                    <div>
                                        <h3 className="text-white font-bold text-lg mb-1">Soporte 24/7</h3>
                                        <p className="text-sm text-gray-400">Disponibles cuando más nos necesita.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#1a2332] border-l-4 border-blue-500 p-6 rounded-r-xl shadow-2xl translate-x-8">
                                <div className="flex items-center gap-4">
                                    <ShieldCheck className="w-12 h-12 text-gray-500 shrink-0" />
                                    <div>
                                        <h3 className="text-white font-bold text-lg mb-1">Repuestos Originales</h3>
                                        <p className="text-sm text-gray-400">Garantía de calidad en cada reparación.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-20 px-4 md:px-10 bg-white">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900">
                            Nuestros Servicios Técnicos
                        </h2>
                        <p className="text-lg text-slate-600">
                            Desde el mantenimiento preventivo planificado hasta la solución urgente de fallas, cubrimos todo el espectro de necesidades de hardware.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {services.map((service, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300 group"
                            >
                                <div className="mb-4 p-3 bg-white w-fit rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                    {service.icon}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    {service.title}
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {service.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process & Benefits */}
            <section className="py-20 px-4 md:px-10 bg-slate-50">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                    {/* Process Column */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">Nuestro Proceso</h2>
                            <p className="text-slate-600">Un flujo de trabajo diseñado para su tranquilidad y eficiencia operativa.</p>
                        </div>
                        <div className="grid gap-4">
                            {processSteps.map((step, index) => (
                                <div key={index} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <span className="font-medium text-slate-800">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Benefits Column */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">Beneficios</h2>
                            <p className="text-slate-600">Razones por las que las empresas confían en Help Soluciones.</p>
                        </div>
                        <div className="grid gap-6">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="mt-1">
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">{benefit.title}</h3>
                                        <p className="text-slate-600 text-sm">{benefit.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </section>

            {/* Why Us / CTA */}
            <section className="py-24 px-4 md:px-10 bg-white">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900">
                        Enfóquese en su negocio
                    </h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Deje en nuestras manos los constantes cambios tecnológicos y el mantenimiento de su infraestructura. Nosotros nos encargamos de que todo funcione.
                    </p>
                    <div className="pt-8">
                        <Link href="/contactenos">
                            <Button variant="primary" className="shadow-xl shadow-primary/20 hover:shadow-primary/30">
                                ¡Consiga una cita ahora!
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
