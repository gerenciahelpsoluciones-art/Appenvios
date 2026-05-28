import type { Metadata } from 'next';
import React from 'react';
import { Shield, Lock, Search, AlertTriangle, CreditCard, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Ciberseguridad Empresarial',
  description: 'Pentesting, firewall de próxima generación y protección anti-ransomware para empresas en Colombia. Proteja sus datos con ingenieros certificados.',
  keywords: ['ciberseguridad empresarial Colombia', 'pentesting Bogotá', 'firewall empresarial Colombia', 'protección ransomware', 'seguridad informática empresas Colombia', 'análisis de vulnerabilidades', 'ingenieros ciberseguridad Colombia'],
  alternates: { canonical: 'https://www.helpsoluciones.com.co/ciberseguridad' },
  openGraph: {
    title: 'Ciberseguridad Empresarial | Help Soluciones',
    description: 'Pentesting, firewall de próxima generación y protección anti-ransomware para empresas en Colombia. Proteja sus datos con ingenieros certificados.',
    url: 'https://www.helpsoluciones.com.co/ciberseguridad',
  },
};

export default function CiberseguridadPage() {
    const services = [
        {
            icon: <Shield className="w-10 h-10 text-primary" />,
            title: "Pentesting, Ethical Hacking y Análisis de Vulnerabilidades",
            description: "Analizamos tu infraestructura, aplicaciones y arquitectura organizacional desde la perspectiva de un atacante, identificando puntos débiles para evaluar y mejorar la efectividad de tus controles de seguridad."
        },
        {
            icon: <Search className="w-10 h-10 text-primary" />,
            title: "Análisis de Malware",
            description: "Métodos avanzados para detectar muestras maliciosas que intentan dañar o comprometer recursos informáticos, con el objetivo de identificar su funcionalidad, origen y el posible impacto en la organización."
        },
        {
            icon: <AlertTriangle className="w-10 h-10 text-primary" />,
            title: "Red Team",
            description: "Ejecución de ataques específicos y supervisados que tienen como objetivo detectar puntos vulnerables y evaluar posibles impactos en una compañía, con la finalidad de mejorar su seguridad y protección."
        },
        {
            icon: <CreditCard className="w-10 h-10 text-primary" />,
            title: "PCI (Compliance)",
            description: "A través de un análisis exhaustivo, ofrecemos una identificación precisa de datos mediante la correlación de palabras clave y la detección de patrones. Le asistiremos en la localización de códigos de verificación de tarjetas (CVV), PIN, PAN y otros datos de autenticación esenciales."
        },
        {
            icon: <Activity className="w-10 h-10 text-primary" />,
            title: "Pruebas de Denegación de Servicios (DOS y DDOS)",
            description: "Utilización de herramientas especializadas para interrumpir la disponibilidad de recursos informáticos, inundando redes o servidores con un alto volumen de solicitudes y datos, impidiendo su acceso por parte de los usuarios autorizados."
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.helpsoluciones.com.co" }, { "@type": "ListItem", "position": 2, "name": "Ciberseguridad Empresarial", "item": "https://www.helpsoluciones.com.co/ciberseguridad" }] }) }} />
            {/* Hero Section */}
            <section className="relative bg-[#101822] py-20 px-4 md:px-10 overflow-hidden min-h-[900px]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#101822] to-[#101822] pointer-events-none" />
                <div className="max-w-6xl mx-auto relative z-10 text-center md:text-left flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                            <Lock size={14} /> Soluciones de Seguridad Avanzada
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
                            Ciberseguridad
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                            Aseguramos la confidencialidad, integridad y disponibilidad de la información de tus activos con las mejores prácticas en seguridad informática. Ofrecemos monitoreo, gestión de incidentes y detección de amenazas.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                            <Button variant="primary" className="gap-2">
                                Solicitar Auditoría <ArrowRight size={18} />
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 relative hidden md:block">
                        <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl" />
                        <div className="relative z-10 grid grid-cols-1 gap-4 max-w-md mx-auto">
                            <div className="bg-[#1a2332] border-l-4 border-blue-400 p-6 rounded-r-xl shadow-2xl">
                                <div className="flex items-center gap-4">
                                    <Shield className="w-12 h-12 text-gray-500 shrink-0" />
                                    <div>
                                        <h3 className="text-white font-bold text-lg mb-1">Protección 24/7</h3>
                                        <p className="text-sm text-gray-400">Monitoreo constante de activos críticos.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#1a2332] border-l-4 border-amber-400 p-6 rounded-r-xl shadow-2xl translate-x-8">
                                <div className="flex items-center gap-4">
                                    <AlertTriangle className="w-12 h-12 text-gray-500 shrink-0" />
                                    <div>
                                        <h3 className="text-white font-bold text-lg mb-1">Hacking Ético</h3>
                                        <p className="text-sm text-gray-400">Identificación proactiva de vulnerabilidades.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-20 px-4 md:px-10 bg-gray-50">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900">
                            Nuestros Servicios de Seguridad
                        </h2>
                        <p className="text-lg text-slate-600">
                            Protegemos cada capa de su infraestructura con servicios especializados diseñados para mitigar riesgos y blindar su operación.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service, index) => (
                            <div
                                key={index}
                                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
                            >
                                <div className="mb-6 p-3 bg-blue-50 w-fit rounded-xl group-hover:bg-primary/10 transition-colors">
                                    {service.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">
                                    {service.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed text-sm">
                                    {service.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 md:px-10 bg-white">
                <div className="max-w-4xl mx-auto bg-primary rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl md:text-4xl font-display font-bold">
                            ¿Tu empresa está realmente segura?
                        </h2>
                        <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                            No espere a sufrir un incidente. Contacte a nuestros expertos hoy mismo para una evaluación inicial de seguridad.
                        </p>
                        <div className="pt-4">
                            <Link href="/contactenos">
                                <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
                                    Contactar a un Experto
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
