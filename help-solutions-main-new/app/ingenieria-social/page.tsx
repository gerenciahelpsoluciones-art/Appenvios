import type { Metadata } from 'next';
import React from 'react';
import { UserX, MessageSquareWarning, DoorOpen, Usb, ArrowRight, ShieldAlert, Fingerprint, Lock } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Ingeniería Social y Pentesting | Help Soluciones',
  description: 'Simulacros de phishing, pruebas de penetración y auditorías de seguridad para empresas en Colombia. Detectamos sus vulnerabilidades antes que los atacantes.',
  alternates: { canonical: 'https://www.helpsoluciones.com.co/ingenieria-social' },
  openGraph: {
    title: 'Ingeniería Social y Pentesting | Help Soluciones',
    description: 'Simulacros de phishing, pruebas de penetración y auditorías de seguridad para empresas en Colombia. Detectamos sus vulnerabilidades antes que los atacantes.',
    url: 'https://www.helpsoluciones.com.co/ingenieria-social',
  },
};

export default function IngenieriaSocialPage() {
    const techniques = [
        {
            icon: <UserX className="w-10 h-10 text-primary" />,
            title: "Phishing y Spear Phishing",
            description: "El ataque más común. Mientras el Phishing busca víctimas generales masivamente, el Spear Phishing es un ataque dirigido quirúrgicamente para obtener información de una persona u organización específica.",
            risks: ["Robo de credenciales", "Infección de malware", "Pérdida de datos confidenciales"]
        },
        {
            icon: <MessageSquareWarning className="w-10 h-10 text-primary" />,
            title: "Smishing y Vishing",
            description: "Variantes telefónicas del fraude. Smishing utiliza mensajes de texto (SMS) falsos, y Vishing emplea llamadas de voz suplantando identidades legítimas para engañar a las víctimas.",
            risks: ["Estafas financieras", "Suplantación de identidad", "Acceso a cuentas bancarias"]
        },
        {
            icon: <DoorOpen className="w-10 h-10 text-primary" />,
            title: "Tailgating",
            description: "Técnica física donde un atacante sigue a una persona autorizada para acceder a un área restringida, aprovechando la cortesía o distracciones para burlar controles de acceso.",
            risks: ["Acceso físico no autorizado", "Robo de activos", "Instalación de dispositivos espía"]
        },
        {
            icon: <Usb className="w-10 h-10 text-primary" />,
            title: "Baiting (Cebo)",
            description: "Atrae a las víctimas ofreciendo algo irresistible, como memorias USB 'perdidas' o descargas gratuitas. Una vez interaccionan con el cebo, se infectan sus sistemas.",
            risks: ["Compromiso de red interna", "Instalación de ransomware", "Exfiltración de datos"]
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-[#101822] py-20 px-4 md:px-10 overflow-hidden min-h-[900px]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#101822] to-[#101822] pointer-events-none" />
                <div className="max-w-6xl mx-auto relative z-10 text-center md:text-left flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                            <ShieldAlert size={14} /> Factor Humano en Riesgo
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
                            Ingeniería Social
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                            La tecnología puede ser segura, pero el factor humano suele ser el eslabón más débil. Evaluamos y mitigamos los riesgos de manipulación psicológica que amenazan su seguridad.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                            <a href="https://wa.me/573043358650">
                                <Button variant="primary" className="gap-2">
                                    Solicitar Evaluación de Riesgos <ArrowRight size={18} />
                                </Button>
                            </a>
                        </div>
                    </div>
                    <div className="flex-1 relative hidden md:block">
                        <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-gradient-to-tr from-red-500/10 to-transparent rounded-full blur-3xl" />
                        <div className="relative z-10 grid grid-cols-1 gap-4 max-w-md mx-auto">
                            <div className="bg-[#1a2332] border-l-4 border-red-500 p-6 rounded-r-xl shadow-2xl">
                                <div className="flex items-center gap-4">
                                    <Fingerprint className="w-12 h-12 text-gray-500 shrink-0" />
                                    <div>
                                        <h3 className="text-white font-bold text-lg mb-1">Identidad Comprometida</h3>
                                        <p className="text-sm text-gray-400">El 90% de las brechas de datos comienzan con un error humano.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#1a2332] border-l-4 border-blue-500 p-6 rounded-r-xl shadow-2xl translate-x-8">
                                <div className="flex items-center gap-4">
                                    <Lock className="w-12 h-12 text-gray-500 shrink-0" />
                                    <div>
                                        <h3 className="text-white font-bold text-lg mb-1">Acceso No Autorizado</h3>
                                        <p className="text-sm text-gray-400">Técnicas sutiles para eludir los controles más estrictos.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Techniques Grid */}
            <section className="py-20 px-4 md:px-10 bg-gray-50">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900">
                            Técnicas de Manipulación
                        </h2>
                        <p className="text-lg text-slate-600">
                            Conozca las estrategias más utilizadas por los ciberdelincuentes para engañar a sus empleados y vulnerar su organización.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {techniques.map((tech, index) => (
                            <div
                                key={index}
                                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-150 duration-700 pointer-events-none">
                                    {tech.icon}
                                </div>

                                <div className="relative z-10 flex flex-col gap-6">
                                    <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                                        {tech.icon}
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">
                                            {tech.title}
                                        </h3>
                                        <p className="text-slate-600 leading-relaxed">
                                            {tech.description}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Riesgos Principales</h4>
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {tech.risks.map((risk, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                    {risk}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 md:px-10 bg-white">
                <div className="max-w-5xl mx-auto bg-[#101822] rounded-[2.5rem] p-8 md:p-16 text-center text-white relative overflow-hidden isolate">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] -z-10" />

                    <div className="space-y-8">
                        <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">
                            ¿Está su equipo preparado para <br className="hidden md:block" /> detectar el engaño?
                        </h2>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                            La concienciación y el entrenamiento son las mejores defensas contra la ingeniería social. Proteja su activo más valioso: su gente.
                        </p>
                        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/contactenos">
                                <Button variant="primary" className="w-full sm:w-auto shadow-lg shadow-primary/25">
                                    Solicitar Entrenamiento
                                </Button>
                            </Link>
                            <a href="https://wa.me/573043358650">
                                <Button variant="secondary" className="w-full sm:w-auto bg-white/5 border-white/10 hover:bg-white/10">
                                    Consultar por WhatsApp
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
