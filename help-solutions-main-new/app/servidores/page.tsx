import type { Metadata } from 'next';
import React from "react";
import { Database, HardDrive, Cloud, Save, Layers } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: 'Servidores y Almacenamiento',
  description: 'Instalación y mantenimiento de servidores HP, Dell y Lenovo en Colombia. Virtualización, SAN/NAS y recuperación ante desastres. Cotice gratis hoy.',
  keywords: ['servidores HP Colombia', 'instalación servidores Dell', 'mantenimiento servidores Bogotá', 'virtualización VMware Colombia', 'almacenamiento SAN NAS', 'backup empresarial Colombia', 'servidores empresariales'],
  alternates: { canonical: 'https://www.helpsoluciones.com.co/servidores' },
  openGraph: {
    title: 'Servidores y Almacenamiento | Help Soluciones',
    description: 'Instalación y mantenimiento de servidores HP, Dell y Lenovo en Colombia. Virtualización, SAN/NAS y recuperación ante desastres. Cotice gratis hoy.',
    url: 'https://www.helpsoluciones.com.co/servidores',
  },
};

export default function ServidoresPage() {
  const features = [
    {
      icon: <Layers className="w-10 h-10 text-primary" />,
      title: "Servidores (Rack y Torre)",
      description:
        "Provisión e implementación de servidores empresariales con el rendimiento necesario para sus cargas de trabajo críticas.",
    },
    {
      icon: <HardDrive className="w-10 h-10 text-primary" />,
      title: "Almacenamiento SAN/NAS",
      description:
        "Soluciones de almacenamiento centralizado escalables para un manejo rápido y eficiente de grandes volúmenes de información.",
    },
    {
      icon: <Cloud className="w-10 h-10 text-primary" />,
      title: "Virtualización",
      description:
        "Consolidación de infraestructura física mediante hipervisores para maximizar recursos y reducir costos operativos.",
    },
    {
      icon: <Save className="w-10 h-10 text-primary" />,
      title: "Backup y Recuperación",
      description:
        "Plataformas de copia de seguridad integrales y estrategias de recuperación ante desastres (DRP) para resguardar su información.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.helpsoluciones.com.co" }, { "@type": "ListItem", "position": 2, "name": "Servidores y Almacenamiento", "item": "https://www.helpsoluciones.com.co/servidores" }] }) }} />
      <section className="relative bg-[#101822] py-20 px-4 md:px-10 overflow-hidden min-h-[500px] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#101822] to-[#101822] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center flex flex-col items-center gap-8 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Database size={16} /> Infraestructura TI
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
            Servidores y<br />
            Almacenamiento
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl leading-relaxed">
            Potencia de cómputo y gestión robusta de datos para soportar de
            manera eficiente las operaciones de su empresa.
          </p>
        </div>
      </section>

      <section className="py-24 px-4 md:px-10 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4 text-slate-900">
            <h2 className="text-3xl md:text-5xl font-display font-bold">
              Nuestras Soluciones
            </h2>
            <p className="text-lg text-slate-600">
              Entregamos hardware de última generación y software de gestión
              líder en la industria para su negocio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col gap-4"
              >
                <div className="mb-2 p-4 bg-blue-50 w-fit rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  {React.cloneElement(
                    feature.icon as React.ReactElement<{ className?: string }>,
                    {
                      className:
                        "w-8 h-8 group-hover:text-white transition-colors duration-300",
                    },
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-10 bg-white">
        <div className="max-w-5xl mx-auto bg-primary rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl md:text-5xl font-display font-bold">
              Actualice su infraestructura tecnológica
            </h2>
            <p className="text-blue-50 text-xl max-w-3xl mx-auto opacity-90">
              Contamos con experiencia implementando data centers escalables de
              alto rendimiento.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/contactenos">
                <Button
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90 font-bold px-8 py-4 text-lg"
                >
                  Solicitar Propuesta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
