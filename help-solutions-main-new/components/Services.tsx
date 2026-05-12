import React from 'react';
import Link from 'next/link';
import { Cable, Server, MonitorSmartphone, Cloud, ArrowRight } from 'lucide-react';

interface ServiceItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  index: number;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ icon, title, description, href, index }) => (
  <Link href={href} className="flex flex-col gap-6 p-8 glass-card group transition-all duration-700 hover:-translate-y-2 relative h-full cursor-pointer">
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

    <div className="flex items-start justify-between">
      <div className="text-primary p-4 rounded-2xl bg-primary/5 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner group-hover:shadow-[0_0_30px_rgba(37,99,234,0.3)] group-hover:rotate-12">
        {icon}
      </div>
      <div className="text-zinc-300 font-display font-black text-3xl opacity-20 group-hover:opacity-40 transition-opacity">
        0{index + 1}
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <h3 className="text-zinc-900 text-xl font-display font-bold leading-tight group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-zinc-600 text-sm font-medium leading-relaxed">
        {description}
      </p>
    </div>

    <div className="mt-auto pt-6 flex items-center gap-2 text-primary font-bold text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
      Ver Servicio <ArrowRight size={14} />
    </div>
  </Link>
);

const Services: React.FC = () => {
  const services = [
    {
      icon: <Cable size={32} strokeWidth={1.5} />,
      title: 'Redes y Cableado Estructurado Certificado',
      description: 'Cat6A, fibra óptica y WiFi corporativo de alta densidad. Diseñamos infraestructuras de red certificadas que soportan el crecimiento de su empresa sin interrupciones ni cuellos de botella.',
      href: '/contactenos',
    },
    {
      icon: <Server size={32} strokeWidth={1.5} />,
      title: 'Mantenimiento y Gestión de Servidores',
      description: 'Mantenimiento preventivo y correctivo de servidores rack, torre y blade. Garantizamos uptime del 99.9% con monitoreo proactivo, backups y respuesta de emergencia 24/7.',
      href: '/contactenos',
    },
    {
      icon: <MonitorSmartphone size={32} strokeWidth={1.5} />,
      title: 'Soporte Técnico TI en Sitio y Remoto',
      description: 'Ingenieros especializados disponibles en menos de 2 horas. Diagnóstico profundo, reparación de hardware, software y prolongamos la vida útil de sus equipos.',
      href: '/contactenos',
    },
    {
      icon: <Cloud size={32} strokeWidth={1.5} />,
      title: 'Cloud, Ciberseguridad y Outsourcing TI',
      description: 'Migración a la nube, firewall y auditorías de seguridad. Además, alquile equipos Dell, HP y Lenovo con gestión integral incluida — sin inversión inicial.',
      href: '/contactenos',
    },
  ];

  return (
    <section className="px-4 pt-24 pb-12 md:px-10 lg:pt-40 lg:pb-16 relative overflow-hidden" id="servicios">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -z-10 animate-blob" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-400/5 rounded-full blur-[120px] -z-10 animate-blob [animation-delay:4s]" />

      <div className="layout-container flex flex-col gap-20">
        <div className="flex flex-col gap-6 text-center md:text-left max-w-[900px]">
          <div className="flex items-center gap-4 text-primary font-bold tracking-[0.3em] uppercase text-xs md:text-sm">
            <span className="w-12 h-[2px] bg-primary rounded-full hidden md:block" />
            Ingeniería de Vanguardia
          </div>
          <h2 className="text-zinc-900 font-display text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-glow">
            Infraestructura TI <span className="text-primary">Sin Límites</span>
          </h2>
          <p className="text-zinc-600 text-lg md:text-2xl font-medium leading-relaxed text-balance">
            Desplegamos soluciones tecnológicas diseñadas para el futuro. Desde la base física de su red hasta la complejidad de la nube, somos el motor técnico de su éxito empresarial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5 auto-rows-fr">
          {services.map((service, index) => (
            <div key={index} className="animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both flex" style={{ animationDelay: `${index * 200}ms` }}>
              <ServiceItem {...service} index={index} href={service.href} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;