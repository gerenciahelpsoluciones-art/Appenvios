import {
  Calendar,
  Target,
  Utensils,
  Package,
  ArrowRight,
  Monitor,
} from 'lucide-react';

const services = [
  {
    title: 'Organización de Eventos',
    description: 'Planeación, coordinación y ejecución de congresos, ferias, convenciones y lanzamientos de marca.',
    icon: Calendar,
    color: 'emerald',
    features: ['Stands & Montajes', 'Producción Técnica', 'Logística Integral']
  },
  {
    title: 'Marketing Experiencial',
    description: 'Estrategias BTL y experiencias memorables que conectan marcas con su audiencia de forma directa.',
    icon: Target,
    color: 'accent',
    features: ['Activaciones de Marca', 'Producción Audiovisual', 'Imagen Corporativa']
  },
  {
    title: 'Gastronomía & Catering',
    description: 'Servicios gastronómicos especializados para eventos corporativos e institucionales de alto nivel.',
    icon: Utensils,
    color: 'emerald',
    features: ['Coffee Breaks', 'Catering Corporativo', 'Estaciones Temáticas']
  },
  {
    title: 'Suministro Empresarial',
    description: 'Comercio integral de material publicitario, kits institucionales, dotaciones y tecnología.',
    icon: Package,
    color: 'accent',
    features: ['Merchandising', 'Equipo Audiovisual', 'Mobiliario para Ferias']
  },
  {
    title: 'Venta de Tecnología',
    description: 'Equipos tecnológicos para empresas: computadores, impresoras, periféricos, redes y soluciones audiovisuales de última generación.',
    icon: Monitor,
    color: 'emerald',
    features: ['Computadores & Laptops', 'Redes & Conectividad', 'Equipos Audiovisuales']
  }
];

const Services = () => {
  return (
    <section id="servicios" className="py-32 bg-white relative overflow-hidden mesh-green">
      <div className="layout-container">
        <div className="text-center max-w-4xl mx-auto mb-24">
          <h2 className="text-sm font-bold tracking-[0.4em] text-primary uppercase mb-6">
            Ecosistemas de Ejecución
          </h2>
          <h3 className="text-5xl md:text-7xl font-display font-bold text-emerald-deep leading-[1.1]">
            Ingeniería de <span className="text-accent italic">Experiencias</span> que Desafían lo <span className="text-gradient">Convencional</span>
          </h3>
          <p className="mt-8 text-lg text-emerald-deep/60 max-w-2xl mx-auto">
            Fusionamos la precisión logística con la disrupción creativa para materializar visiones empresariales que trascienden el tiempo y el espacio.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-10">
          {services.map((service) => (
            <div 
              key={service.title}
              className="group p-10 rounded-[40px] bg-white border border-emerald-deep/5 hover:bg-emerald-deep hover:-translate-y-4 transition-all duration-700 cursor-default shadow-xl hover:shadow-emerald-deep/20"
            >
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-10 border transition-all duration-700 ${
                service.color === 'emerald' 
                  ? 'bg-emerald-deep/5 border-emerald-deep/10 group-hover:bg-white/10 group-hover:border-white/20' 
                  : 'bg-accent/5 border-accent/10 group-hover:bg-white/10 group-hover:border-white/20'
              }`}>
                <service.icon size={36} className={`transition-all duration-700 ${
                  service.color === 'emerald' ? 'text-emerald-deep group-hover:text-accent' : 'text-accent group-hover:text-white'
                }`} />
              </div>

              <h4 className="text-2xl font-bold text-emerald-deep group-hover:text-white mb-6 transition-colors tracking-tight">
                {service.title}
              </h4>
              
              <p className="text-emerald-deep/70 group-hover:text-white/70 mb-10 leading-relaxed transition-colors text-sm">
                {service.description}
              </p>

              <ul className="space-y-4 mb-10">
                {service.features.map(feature => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-emerald-deep/60 group-hover:text-white/60 transition-colors font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent group-hover:scale-150 transition-transform" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button className="flex items-center gap-2 text-xs font-bold text-accent group-hover:text-white transition-all uppercase tracking-[0.2em]">
                Explorar Potencial
                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
