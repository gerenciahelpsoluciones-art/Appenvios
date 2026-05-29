import { ExternalLink, Layers, MapPin } from 'lucide-react';

const projects = [
  {
    title: 'Congreso Internacional de Tecnología',
    location: 'Bogotá, Colombia',
    type: 'Logística & Eventos',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070',
    size: 'large'
  },
  {
    title: 'Activación de Marca Automotriz',
    location: 'Medellín, Colombia',
    type: 'Marketing Experiencial',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070',
    size: 'small'
  },
  {
    title: 'Lanzamiento Nueva Colección Moda',
    location: 'Cartagena, Colombia',
    type: 'Producción Audiovisual',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2070',
    size: 'small'
  },
  {
    title: 'Cena de Gala Empresarial',
    location: 'Cali, Colombia',
    type: 'Catering & Logística',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2070',
    size: 'small'
  }
];

const Portfolio = () => {
  return (
    <section id="proyectos" className="py-24 bg-white">
      <div className="layout-container">
        <div className="grid lg:grid-cols-2 gap-20 items-center mb-24">
          <div>
             <h2 className="text-xs font-bold tracking-[0.4em] text-primary uppercase mb-6">
              Nuestra Experiencia
            </h2>
            <h3 className="text-5xl md:text-8xl font-display font-bold text-emerald-deep leading-[0.95] tracking-tighter">
              Proyectos que <span className="text-gradient">hablan</span> por sí solos
            </h3>
          </div>
          <div className="space-y-6">
            <p className="text-xl text-emerald-deep/70 leading-relaxed font-medium">
              Más de 500 eventos producidos en 15 ciudades. Desde congresos internacionales hasta activaciones de marca y cenas de gala para los <span className="text-primary font-bold">sectores más exigentes de Colombia</span>.
            </p>
            <div className="h-px w-full bg-gradient-to-r from-accent to-transparent" />
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          {projects.map((project, idx) => (
            <div 
              key={project.title} 
              className={`relative group rounded-2xl overflow-hidden cursor-pointer ${
                idx === 0 ? 'md:col-span-12 lg:col-span-8 h-[600px]' : 
                idx === 1 ? 'md:col-span-6 lg:col-span-4 h-[300px] lg:h-[600px]' :
                'md:col-span-6 lg:col-span-4 h-[300px]'
              }`}
            >
              <img 
                src={project.image} 
                alt={project.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep via-emerald-deep/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-accent text-[10px] font-bold text-emerald-deep uppercase tracking-widest">
                    {project.type}
                  </span>
                </div>
                
                <h4 className="text-2xl md:text-3xl font-bold text-white mb-4 max-w-md leading-tight">
                  {project.title}
                </h4>
                
                <div className="flex items-center justify-between border-t border-white/20 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <MapPin size={16} className="text-accent" />
                    {project.location}
                  </div>
                  <div className="p-3 rounded-full bg-white/10 text-white">
                    <ExternalLink size={18} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
           <a href="#contacto" className="px-12 py-5 bg-emerald-deep text-white font-bold rounded-full hover:bg-emerald-deep/90 transition-all flex items-center gap-3 mx-auto group">
             Ver Portafolio Completo
             <Layers size={20} className="group-hover:rotate-12 transition-transform" />
           </a>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
