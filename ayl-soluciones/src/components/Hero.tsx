import React from 'react';
import { ArrowRight, Play, CheckCircle } from 'lucide-react';

const Hero = () => {
  return (
    <section id="inicio" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Video/Image Background Placeholder */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-emerald-deep/70 backdrop-blur-sm z-10" />
        <img 
          src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2070" 
          alt="Events Background" 
          className="w-full h-full object-cover scale-105 animate-slow-zoom"
        />
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-deep to-transparent z-15" />
      </div>

      <div className="layout-container relative z-20 pt-20 flex flex-col items-center text-center">
        <div className="max-w-5xl">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full glass border-white/20 mb-8 animate-fade-in disruptive-glow">
            <span className="w-2 h-2 rounded-full bg-emerald-light animate-pulse" />
            <span className="text-xs font-bold tracking-[0.3em] text-emerald-light uppercase">
              Ecosistemas de Valor & Trascendencia
            </span>
          </div>

          <h1 className="text-6xl md:text-9xl font-display font-bold text-white leading-[0.9] mb-10 tracking-tighter">
            Arquitectura de <span className="text-accent italic">Impacto</span> <br className="hidden md:block" />
            <span className="text-gradient">Disrupción</span> Estratégica
          </h1>

          <p className="text-xl md:text-2xl text-white/80 mb-14 max-w-3xl mx-auto leading-relaxed text-justify md:text-center px-4">
            No solo gestionamos logística; <span className="text-white font-bold italic">redefinimos la realidad corporativa</span>. Creamos experiencias sensoriales y operativas que posicionan su marca en el epicentro de la excelencia global.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <button className="w-full sm:w-auto px-12 py-6 bg-white text-emerald-deep font-bold rounded-2xl hover:bg-accent hover:text-white transition-all duration-500 shadow-2xl shadow-emerald-light/20 flex items-center justify-center gap-3 group overflow-hidden relative">
              <span className="relative z-10 flex items-center gap-3">
                Materializar Visión
                <ArrowRight className="group-hover:translate-x-2 transition-transform duration-500" />
              </span>
            </button>
            
            <button className="w-full sm:w-auto px-12 py-6 glass border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-4 group">
              <div className="p-2 rounded-full bg-white/10 group-hover:bg-accent transition-all duration-500 group-hover:scale-110">
                <Play fill="white" size={16} className="ml-1" />
              </div>
              Experience Showreel
            </button>
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
                <div className="text-sm text-white/50 tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aesthetic Decorations */}
      <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-emerald-light/10 blur-[120px] rounded-full pointer-events-none" />
    </section>
  );
};

export default Hero;
