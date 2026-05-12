import Image from 'next/image';
import Link from 'next/link';
import { Phone, Clock, Users, BarChart3, Shield, MonitorCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: <Clock size={20} />,
    title: 'Respuesta en menos de 2 horas',
    text: 'SLA garantizado por contrato. Si no respondemos en 2h, escalamos automáticamente.',
  },
  {
    icon: <Phone size={20} />,
    title: 'Canal único multicanal',
    text: 'Un solo número de contacto para teléfono, WhatsApp, email y ticket — sin laberintos.',
  },
  {
    icon: <Users size={20} />,
    title: 'Soporte Nivel 1, 2 y 3',
    text: 'Escalamiento inteligente según complejidad. Desde reinicios hasta fallas de servidor.',
  },
  {
    icon: <MonitorCheck size={20} />,
    title: 'Acceso remoto seguro',
    text: 'Resolvemos el 70% de incidencias de forma remota — sin esperar visita técnica.',
  },
  {
    icon: <BarChart3 size={20} />,
    title: 'Reportes mensuales',
    text: 'Historial completo de incidencias, tiempos de resolución y tendencias de fallas.',
  },
  {
    icon: <Shield size={20} />,
    title: 'Costo fijo predecible',
    text: 'Sin sorpresas en la factura. Pague solo por los usuarios que necesitan soporte.',
  },
];

const slaItems = [
  { label: 'Tiempo de respuesta', value: '< 2h' },
  { label: 'Disponibilidad', value: '24/7' },
  { label: 'Resolución remota', value: '70%' },
  { label: 'Satisfacción clientes', value: '98%' },
];

const HelpDesk: React.FC = () => {
  return (
    <section className="px-4 py-24 md:px-10 lg:py-40 relative overflow-hidden" id="mesa-de-ayuda">
      {/* Background blobs */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10" />
      <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-sky-400/5 rounded-full blur-[100px] -z-10" />

      <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">

        {/* LEFT — Copy */}
        <div className="w-full lg:w-1/2 flex flex-col gap-8 order-2 lg:order-1">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 text-primary">
              <div className="p-2 rounded-lg bg-primary/10">
                <Phone size={18} className="text-primary" />
              </div>
              <span className="text-sm font-bold uppercase tracking-[0.2em]">Mesa de Ayuda Empresarial</span>
            </div>

            <h2 className="text-zinc-900 text-4xl md:text-5xl lg:text-6xl font-display font-black leading-[1.1] tracking-tight text-glow">
              ¿Cuánto le Cuesta Cada Hora{' '}
              <span className="text-primary">Sin Soporte TI?</span>
            </h2>

            <p className="text-zinc-700 text-lg font-medium leading-relaxed">
              Sin una mesa de ayuda centralizada, su equipo pierde horas buscando al técnico correcto, repitiendo el problema y esperando respuesta. Nosotros eliminamos ese caos con un canal único, ingenieros certificados y un SLA que cumplimos — por contrato.
            </p>

            {/* Quick proof */}
            <div className="flex flex-wrap gap-3 pt-1">
              {['Sin contratos largos', 'Setup en 48h', 'Escalamiento incluido'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                  <CheckCircle2 size={12} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex gap-3 p-4 glass-card rounded-xl border-zinc-100 hover:border-primary/20 hover:bg-primary/5 transition-all duration-300 group">
                <div className="text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <div>
                  <p className="text-zinc-900 font-bold text-sm leading-tight mb-1">{f.title}</p>
                  <p className="text-zinc-500 text-xs leading-relaxed">{f.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/contactenos"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_8px_24px_rgba(37,99,234,0.3)] text-sm"
            >
              Activar Mesa de Ayuda
              <ArrowRight size={16} />
            </Link>
            <a
              href="https://wa.me/573102172251"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline underline-offset-4"
            >
              Hablar ahora por WhatsApp →
            </a>
          </div>
        </div>

        {/* RIGHT — Image with overlays */}
        <div className="w-full lg:w-1/2 relative order-1 lg:order-2 flex-shrink-0">
          {/* Main image */}
          <div className="relative w-full lg:h-[580px] rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="/images/pexels-anete-lusina-31854226.jpg"
              alt="Agente de Mesa de Ayuda Help Soluciones brindando soporte técnico empresarial"
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 580px"
              quality={85}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/50 via-transparent to-transparent" />
          </div>

          {/* SLA floating card */}
          <div className="absolute -bottom-6 -left-4 lg:-left-8 bg-white rounded-2xl p-5 shadow-xl border border-zinc-100 grid grid-cols-2 gap-4 min-w-[240px]">
            {slaItems.map((item) => (
              <div key={item.label} className="flex flex-col">
                <span className="text-2xl font-black text-primary font-display leading-none">{item.value}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-tight mt-0.5">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Live badge */}
          <div className="absolute top-5 right-5 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-zinc-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-zinc-700">Agentes en línea ahora</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HelpDesk;
