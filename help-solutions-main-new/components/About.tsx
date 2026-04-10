import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, ArrowRight } from 'lucide-react';

const About: React.FC = () => {
  return (
    <section className="px-4 pt-8 pb-20 md:px-10 lg:pt-12 lg:pb-32 relative overflow-hidden" id="nosotros">
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="flex flex-col-reverse lg:flex-row gap-16 lg:gap-24 items-start">
        {/* Image - Premium Style */}
        <div
          className="w-full lg:w-1/2 aspect-video md:aspect-square lg:h-[500px] rounded-2xl glass-card border-black/5 bg-zinc-100 group relative overflow-hidden"
          aria-label="IT Professionals discussing server maintenance"
        >
          <Image
            src="/images/premium_about.png"
            alt="IT Professionals discussing server maintenance"
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px"
            quality={65}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
          <div className="absolute bottom-6 left-6 right-6 p-6 glass-card border-black/10 backdrop-blur-lg translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
            <p className="text-zinc-900 text-sm font-semibold italic">"Infraestructura robusta para negocios imparables"</p>
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
              Más que un Proveedor, su <span className="text-primary">Aliado</span> en Soporte TI
            </h2>
            <p className="text-zinc-700 text-lg font-medium leading-relaxed">
              En Help Soluciones transformamos los desafíos tecnológicos en ventajas competitivas. Nuestra metodología exclusiva de mantenimiento proactivo asegura que su empresa en Colombia esté siempre un paso adelante.
            </p>
            <div className="space-y-4 pt-2">
              {[
                { label: "Ingeniería Certificada", text: "Expertos con 10+ años de trayectoria en Mantenimiento de Hardware y Redes." },
                { label: "Soporte Técnico 24/7", text: "Atención inmediata para servidores y redes empresariales críticas." },
                { label: "Infraestructura Global", text: "Aliados estratégicos de fabricantes líderes en tecnología y conectividad." }
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
              { val: "10+", label: "Años Exp." },
              { val: "500+", label: "Proyectos" },
              { val: "24/7", label: "Monitor" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col p-4 glass-card border-black/10 rounded-xl hover:bg-black/5 transition-colors group">
                <span className="text-3xl font-black text-zinc-900 font-display group-hover:text-primary transition-colors">{stat.val}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-tight">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <Link href="/sobre-nosotros" className="inline-flex items-center gap-3 text-primary font-bold hover:gap-5 transition-all group py-2">
              <span className="border-b-2 border-primary/20 group-hover:border-primary transition-all">Explorar nuestra historia</span>
              <ArrowRight size={20} className="group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;