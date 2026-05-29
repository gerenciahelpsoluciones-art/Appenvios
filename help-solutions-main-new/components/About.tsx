import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, ArrowRight } from 'lucide-react';

const About: React.FC = () => {
  return (
    <section className="px-4 pt-8 pb-20 md:px-10 lg:pt-12 lg:pb-32 relative overflow-hidden" id="nosotros">
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="flex flex-col-reverse lg:flex-row gap-16 lg:gap-24 items-start">
        {/* Image - Premium Style */}
        <div className="w-full lg:w-1/2 relative flex-shrink-0">
          {/* Main image */}
          <div
            className="w-full h-[280px] sm:h-[360px] lg:h-[540px] rounded-2xl bg-zinc-100 group relative overflow-hidden shadow-2xl"
            aria-label="Ingeniero de campo Help Soluciones trabajando en infraestructura de red"
          >
            <Image
              src="/images/pexels-field-engineer-147254-442151.jpg"
              alt="Ingeniero de campo Help Soluciones instalando infraestructura de red en Bogotá"
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 540px"
              quality={85}
            />
            {/* Dark gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/75 via-zinc-900/10 to-transparent" />
            {/* Always-visible quote at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-white text-sm font-semibold leading-relaxed">
                "12 años protegiendo la tecnología de más de 500 empresas en Colombia"
              </p>
              <p className="text-white/60 text-xs font-medium mt-1">— Help Soluciones Informáticas</p>
            </div>
          </div>

          {/* Floating stat card */}
          <div className="absolute top-3 right-3 sm:-top-4 sm:-right-4 lg:right-[-2rem] bg-white rounded-2xl p-4 shadow-xl border border-zinc-100 flex flex-col items-center gap-1 min-w-[90px] sm:min-w-[100px]">
            <span className="text-3xl font-black text-primary font-display leading-none">500+</span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest text-center">Proyectos<br/>Exitosos</span>
          </div>

          {/* Floating second image (thumbnail) */}
          <div className="absolute -bottom-6 -right-4 lg:right-[-2rem] w-36 h-28 rounded-xl overflow-hidden shadow-xl border-2 border-white hidden md:block">
            <Image
              src="/images/pexels-brett-sayles-2881229.jpg"
              alt="Data center Help Soluciones"
              fill
              className="object-cover"
              sizes="144px"
              quality={75}
            />
          </div>
        </div>

        {/* Content */}
        <div className="w-full lg:w-1/2 flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 text-primary">
              <div className="p-2 rounded-lg bg-primary/10">
                <BadgeCheck size={20} className="text-primary" />
              </div>
              <span className="text-sm font-bold uppercase tracking-[0.2em]">Trayectoria en Ingeniería de Sistemas</span>
            </div>
            <h2 className="text-zinc-900 text-4xl md:text-6xl font-display font-black leading-tight tracking-tight text-glow">
              No Solo un Proveedor: su <span className="text-primary">Departamento TI</span> Dedicado
            </h2>
            <p className="text-zinc-700 text-lg font-medium leading-relaxed">
              Llevamos 12 años siendo el respaldo tecnológico de empresas en Bogotá y toda Colombia. Nuestra metodología de mantenimiento proactivo detecta fallas antes de que ocurran — garantizando disponibilidad real, no promesas.
            </p>
            <div className="space-y-4 pt-2">
              {[
                { label: "Ingeniería Certificada", text: "Técnicos especializados en servidores Dell, HP, Lenovo con 12 años de experiencia comprobada." },
                { label: "Soporte Técnico 24/7", text: "Tiempo de respuesta garantizado en menos de 2 horas para emergencias críticas." },
                { label: "Partners Tecnológicos", text: "Aliados directos de fabricantes líderes: acceso a repuestos y soporte oficial." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(37,99,234,0.3)]" />
                  <p className="text-zinc-600 text-sm font-medium leading-relaxed">
                    <span className="text-zinc-900 font-black">{item.label}:</span> {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats - Premium Glass */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { val: "12+", label: "Años de Exp." },
              { val: "500+", label: "Proyectos" },
              { val: "<2h", label: "Respuesta" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col p-4 glass-card border-black/10 rounded-xl hover:bg-black/5 transition-colors group">
                <span className="text-3xl font-black text-zinc-900 font-display group-hover:text-primary transition-colors">{stat.val}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-tight">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-6">
            <Link href="/sobre-nosotros" className="inline-flex items-center gap-3 text-primary font-bold hover:gap-5 transition-all group py-2">
              <span className="border-b-2 border-primary/20 group-hover:border-primary transition-all">Conocer nuestra historia</span>
              <ArrowRight size={20} className="group-hover:translate-x-1" />
            </Link>
            <a
              href="https://wa.me/573043358650"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20 text-sm"
            >
              WhatsApp Directo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;