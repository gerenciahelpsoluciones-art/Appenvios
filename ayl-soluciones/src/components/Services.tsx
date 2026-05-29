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
    description: 'Equipos tecnológicos para empresas: computadores, impresoras, periféricos, redes y soluciones audiovisuales.',
    icon: Monitor,
    color: 'emerald',
    features: ['Computadores & Laptops', 'Redes & Conectividad', 'Equipos Audiovisuales']
  }
];

const Services = () => {
  return (
    <section id="servicios" className="py-32 bg-white relative overflow-hidden mesh-green">
      <div className="layout-container">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-xs font-bold tracking-[0.4em] text-primary uppercase mb-5">
            Lo que hacemos
          </h2>
          <h3 className="text-4xl md:text-6xl font-display font-bold text-emerald-deep leading-[1.05] tracking-tight">
            Servicios que <span className="text-accent italic">cubren</span> todo el ciclo del evento
          </h3>
          <p className="mt-6 text-base text-emerald-deep/55 max-w-xl mx-auto leading-relaxed">
            Un solo proveedor para logística, producción, alimentación, suministros y tecnología. Menos coordinación, mejores resultados.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="group p-8 rounded-3xl bg-white border border-emerald-deep/6 hover:bg-emerald-deep hover:-translate-y-2 transition-all duration-300 cursor-default shadow-sm hover:shadow-2xl hover:shadow-emerald-deep/15"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border transition-all duration-300 ${
                service.color === 'emerald'
                  ? 'bg-emerald-deep/5 border-emerald-deep/10 group-hover:bg-white/10 group-hover:border-white/20'
                  : 'bg-accent/8 border-accent/15 group-hover:bg-white/10 group-hover:border-white/20'
              }`}>
                <service.icon size={26} className={`transition-colors duration-300 ${
                  service.color === 'emerald' ? 'text-emerald-deep group-hover:text-accent' : 'text-accent group-hover:text-white'
                }`} />
              </div>

              <h4 className="text-xl font-bold text-emerald-deep group-hover:text-white mb-4 transition-colors tracking-tight">
                {service.title}
              </h4>

              <p className="text-emerald-deep/65 group-hover:text-white/65 mb-8 leading-relaxed transition-colors text-sm">
                {service.description}
              </p>

              <ul className="space-y-3 mb-8">
                {service.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-emerald-deep/55 group-hover:text-white/55 transition-colors">
                    <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button className="flex items-center gap-2 text-xs font-bold text-accent group-hover:text-accent/80 transition-all uppercase tracking-[0.15em]">
                Ver más
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
