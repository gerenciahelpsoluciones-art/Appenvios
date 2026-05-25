import type { Metadata } from 'next';
import React from "react";
import { Video, Eye, HardDrive, ShieldAlert, Camera } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: 'CCTV y Videovigilancia Empresarial | Help Soluciones',
  description: 'Sistemas de videovigilancia IP y CCTV HD para empresas en Colombia. Monitoreo remoto, cámaras inteligentes y analítica de video. Proteja sus instalaciones.',
  alternates: { canonical: 'https://www.helpsoluciones.com.co/cctv' },
  openGraph: {
    title: 'CCTV y Videovigilancia Empresarial | Help Soluciones',
    description: 'Sistemas de videovigilancia IP y CCTV HD para empresas en Colombia. Monitoreo remoto, cámaras inteligentes y analítica de video. Proteja sus instalaciones.',
    url: 'https://www.helpsoluciones.com.co/cctv',
  },
};

export default function CCTVPage() {
  const features = [
    {
      icon: <Camera className="w-10 h-10 text-primary" />,
      title: "Cámaras de Seguridad IP",
      description:
        "Equipos de alta resolución y tecnologías avanzadas (visión nocturna, reconocimiento térmico) para interiores y exteriores.",
    },
    {
      icon: <HardDrive className="w-10 h-10 text-primary" />,
      title: "Almacenamiento (NVR/DVR)",
      description:
        "Sistemas de grabación robustos que garantizan la disponibilidad y retención segura de las evidencias en video.",
    },
    {
      icon: <Eye className="w-10 h-10 text-primary" />,
      title: "Video Analítica",
      description:
        "Analítica inteligente para detección de movimiento, cruce de línea, reconocimiento facial y conteo de personas.",
    },
    {
      icon: <ShieldAlert className="w-10 h-10 text-primary" />,
      title: "Monitoreo Remoto",
      description:
        "Acceso seguro en tiempo real a sus cámaras desde cualquier dispositivo móvil o centro de control integrado.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative bg-[#101822] py-20 px-4 md:px-10 overflow-hidden min-h-[500px] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#101822] to-[#101822] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center flex flex-col items-center gap-8 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Video size={16} /> Infraestructura TI
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
            Sistema de CCTV y<br />
            Videovigilancia
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl leading-relaxed">
            Proteja sus instalaciones, supervisando de forma centralizada sus
            activos con tecnología de vanguardia.
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
              Diseñamos implementaciones a la medida para empresas de cualquier
              tamaño y sector industrial.
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
                    feature.icon as React.ReactElement<
                      React.SVGProps<SVGSVGElement>
                    >,
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
              La tranquilidad de estar protegido
            </h2>
            <p className="text-blue-50 text-xl max-w-3xl mx-auto opacity-90">
              Evaluamos las vulnerabilidades de sus espacios y le proponemos la
              mejor solución integral CCTV.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/contactenos">
                <Button
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90 font-bold px-8 py-4 text-lg"
                >
                  Solicitar Auditoría
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
