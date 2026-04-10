import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-emerald-deep border-t border-white/5 pt-20 pb-10 overflow-hidden relative">
      {/* Visual Decoration */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />
      
      <div className="layout-container">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="space-y-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl transform group hover:rotate-6 transition-transform">
                <span className="text-emerald-deep font-black text-xl italic group-hover:scale-110 transition-transform">A&L</span>
              </div>
              <div>
                <span className="text-2xl font-display font-bold text-white tracking-tighter">SOLUCIONES</span>
                <span className="block text-[10px] tracking-[0.4em] font-bold text-accent uppercase -mt-1 opacity-80">Integrales S.A.S.</span>
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs font-medium">
              Evolucionando la gestión corporativa hacia una dimensión de <span className="text-white">precisión absoluta</span> y <span className="text-accent">disrupción creativa</span>.
            </p>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-xs">Navegación</h4>
             <ul className="space-y-4">
               {['Inicio', 'Nosotros', 'Servicios', 'Productos', 'Experiencia'].map(item => (
                 <li key={item}>
                   <Link href={`#${item.toLowerCase()}`} className="text-white/40 hover:text-accent transition-colors text-sm">
                     {item}
                   </Link>
                 </li>
               ))}
             </ul>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-xs">Servicios</h4>
             <ul className="space-y-4">
               {['Logística de Eventos', 'Activación de Marca', 'Catering Corporativo', 'Dotaciones y Kits'].map(item => (
                 <li key={item}>
                   <span className="text-white/40 text-sm">{item}</span>
                 </li>
               ))}
             </ul>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-xs">Legal</h4>
             <ul className="space-y-4">
               {['Políticas de Privacidad', 'Términos y Condiciones', 'Tratamiento de Datos'].map(item => (
                 <li key={item}>
                   <Link href="#" className="text-white/40 hover:text-accent transition-colors text-sm">
                     {item}
                   </Link>
                 </li>
               ))}
             </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-white/30 text-xs text-center md:text-left">
             © 2026 A&L SOLUCIONES INTEGRALES S.A.S. Todos los derechos reservados.
           </p>
           <div className="flex gap-6">
              {/* Simple Social Icons */}
              {['FB', 'IG', 'LI'].map(social => (
                <span key={social} className="text-white/20 hover:text-accent transition-colors font-bold text-xs cursor-pointer tracking-widest">{social}</span>
              ))}
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
