import { ArrowRight, Play } from 'lucide-react';

const Hero = () => {
  return (
    <section id="inicio" className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-emerald-deep/65 z-10" />
        <img
          src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2070"
          alt="Eventos corporativos A&L Soluciones"
          className="w-full h-full object-cover scale-105 animate-slow-zoom"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-deep to-transparent z-15" />
      </div>

      <div className="layout-container relative z-20 pt-20 flex flex-col items-center text-center">
        <div className="max-w-5xl">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass border-white/20 mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-light animate-pulse" />
            <span className="text-xs font-semibold tracking-[0.25em] text-white/80 uppercase">
              Eventos · Catering · Suministros · Tecnología
            </span>
          </div>

          <h1 className="text-5xl md:text-8xl font-display font-bold text-white leading-[0.92] mb-8 tracking-tighter">
            Arquitectura de <span className="text-accent italic">Impacto</span><br className="hidden md:block" />
            <span className="text-gradient">Disrupción</span> Estratégica
          </h1>

          <p className="text-lg md:text-xl text-white/75 mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            Desde Bogotá gestionamos logística integral, catering corporativo, marketing experiencial y suministros en más de 15 ciudades de Colombia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#contacto" className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-deep font-bold rounded-xl hover:bg-accent hover:text-white transition-all duration-300 shadow-xl shadow-black/20 flex items-center justify-center gap-3 group">
              Solicitar Propuesta
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </a>

            <a href="#proyectos" className="w-full sm:w-auto px-8 py-4 glass border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 group">
              <div className="p-1.5 rounded-full bg-white/10 group-hover:bg-accent transition-all duration-300">
                <Play fill="white" size={14} className="ml-0.5" />
              </div>
              Ver Proyectos
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 border-t border-white/10 pt-10">
            {[
              { label: 'Eventos Producidos', value: '500+' },
              { label: 'Marcas Aliadas', value: '120+' },
              { label: 'Ciudades de Alcance', value: '15+' },
              { label: 'Suministros Entregados', value: '50k+' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/50 tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-emerald-light/8 blur-[120px] rounded-full pointer-events-none" />
    </section>
  );
};

export default Hero;
