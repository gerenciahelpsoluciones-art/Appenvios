import type { Metadata } from 'next';
import React from 'react';
import { Target, Eye, CheckCircle, Lightbulb, RefreshCw, TrendingUp, ShieldCheck, Headset, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Help Soluciones',
  description: '12 años protegiendo la infraestructura TI de más de 500 empresas en Colombia. Conozca el equipo de Help Soluciones y nuestra historia de confianza.',
  alternates: { canonical: 'https://www.helpsoluciones.com.co/sobre-nosotros' },
  openGraph: {
    title: 'Sobre Nosotros | Help Soluciones',
    description: '12 años protegiendo la infraestructura TI de más de 500 empresas en Colombia. Conozca el equipo de Help Soluciones y nuestra historia de confianza.',
    url: 'https://www.helpsoluciones.com.co/sobre-nosotros',
  },
};

// Use a relative import to ensure compatibility if @/components alias is not fully defined for all paths
import Button from '@/components/ui/Button';

export default function SobreNosotrosPage() {
    const values = [
        {
            icon: <CheckCircle className="w-10 h-10 text-primary" />,
            title: "Calidad",
            description: "Estamos comprometidos en brindar productos y servicios, con altos estándares de calidad, de manera fiable, segura y efectiva."
        },
        {
            icon: <Lightbulb className="w-10 h-10 text-primary" />,
            title: "Innovación",
            description: "Creamos e impulsamos soluciones novedosas en productos y servicios tecnológicos adaptándonos a la vanguardia de las necesidades del mercado."
        },
        {
            icon: <RefreshCw className="w-10 h-10 text-primary" />,
            title: "Adaptabilidad",
            description: "Fomentamos la flexibilidad a tecnologías emergentes y contamos con la capacidad de adaptarnos a las necesidades de nuestros clientes."
        },
        {
            icon: <TrendingUp className="w-10 h-10 text-primary" />,
            title: "Mejora continua",
            description: "Estamos en constante evolución y comprometidos con la optimización de los recursos, procesos, productos y servicios."
        },
        {
            icon: <ShieldCheck className="w-10 h-10 text-primary" />,
            title: "Integridad y transparencia",
            description: "Actuamos con ética en la toma de decisiones de la organización e interacciones con nuestros clientes, generando confianza y seguridad en la gestión de la información."
        },
        {
            icon: <Headset className="w-10 h-10 text-primary" />,
            title: "Servicio",
            description: "Ofrecemos productos y servicios de calidad, brindando un excelente soporte técnico, atención al cliente personalizada y soluciones ágiles."
        },
        {
            icon: <Users className="w-10 h-10 text-primary" />,
            title: "Trabajo en equipo",
            description: "Contamos con profesionales calificados y colaborativos que generan sinergia y efectividad en el desarrollo de las actividades, procesos y procedimientos."
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-[#101822] py-20 px-4 md:px-10 overflow-hidden min-h-[600px] flex items-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#101822] to-[#101822] pointer-events-none" />
                <div className="max-w-6xl mx-auto relative z-10 text-center flex flex-col items-center gap-8 w-full">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                        <Users size={16} /> Conoce a nuestro equipo
                    </div>
                    <h1 className="text-4xl md:text-7xl font-display font-bold text-white leading-tight">
                        Sobre Nosotros
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-3xl leading-relaxed">
                        Somos su aliado estratégico en Tecnología de la Información. Brindamos soluciones integrales con experiencia, agilidad y el compromiso de transformar su negocio para el futuro.
                    </p>
                </div>
            </section>

            {/* Misión y Visión Section */}
            <section className="py-20 px-4 md:px-10 bg-white relative">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                        {/* Misión */}
                        <div className="flex flex-col gap-6 p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-primary">
                                    <Target className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-display font-bold text-slate-900">Nuestra Misión</h2>
                            </div>
                            <p className="text-lg text-slate-600 leading-relaxed font-medium">
                                Ser una empresa del sector TIC
                                comprometida con la calidad, agilidad y
                                confiabilidad en los productos y servicios
                                que comercializamos, convirtiéndonos en
                                aliados estratégicos de nuestros clientes,
                                consumidores y comunidad.
                            </p>
                        </div>

                        {/* Visión */}
                        <div className="flex flex-col gap-6 p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-primary">
                                    <Eye className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-display font-bold text-slate-900">Nuestra Visión</h2>
                            </div>
                            <p className="text-lg text-slate-600 leading-relaxed font-medium">
                                Ser la empresa líder en el sector TIC para
                                el 2030, impactando el mercado a nivel
                                nacional e internacional, a través de la
                                creación de soluciones estratégicas e
                                innovadoras,
                                medio ambiente.
                                asegurando
                                la
                                responsabilidad social y sostenibilidad del medio ambiente.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Valores Section */}
            <section className="py-24 px-4 md:px-10 bg-gray-50 border-t border-gray-100">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="text-center max-w-3xl mx-auto space-y-4 text-slate-900">
                        <h2 className="text-3xl md:text-5xl font-display font-bold">
                            Nuestros Valores
                        </h2>
                        <p className="text-lg text-slate-600">
                            Nuestros valores sobre los que se sostiene esta estrategia de
                            crecimiento y diferenciación con el servicio son:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {values.map((value, index) => (
                            <div
                                key={index}
                                className={`bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col gap-4 ${index === 6 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                            >
                                <div className="mb-2 p-4 bg-blue-50 w-fit rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                    {React.cloneElement(value.icon, { className: "w-8 h-8 group-hover:text-white transition-colors duration-300" })}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                                    {value.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 md:px-10 bg-white">
                <div className="max-w-5xl mx-auto bg-primary rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 space-y-8">
                        <h2 className="text-3xl md:text-5xl font-display font-bold">
                            ¿Listo para llevar su infraestructura al siguiente nivel?
                        </h2>
                        <p className="text-blue-50 text-xl max-w-3xl mx-auto opacity-90">
                            Descubra cómo nuestras soluciones y nuestro equipo pueden impulsar el éxito de su organización.
                        </p>
                        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link href="/contactenos">
                                <Button variant="secondary" className="bg-white text-primary hover:bg-white/90 font-bold px-8 py-4 text-lg">
                                    Contáctenos Hoy
                                </Button>
                            </Link>
                            <Link href="/productos">
                                <button className="font-bold text-white hover:text-blue-100 transition-colors flex items-center gap-2 group px-6 py-4">
                                    Ver Productos <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
