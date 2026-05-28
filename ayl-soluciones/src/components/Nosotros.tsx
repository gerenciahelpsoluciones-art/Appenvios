import { Award, Users, Target, Zap } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Precisión Operativa',
    description: 'Ejecutamos cada detalle con estándares de excelencia que no dejan margen al error.',
  },
  {
    icon: Users,
    title: 'Equipo Especializado',
    description: 'Profesionales con más de 10 años de experiencia en logística, marketing y gastronomía.',
  },
  {
    icon: Award,
    title: 'Calidad Certificada',
    description: 'Procesos auditados y certificados que garantizan resultados consistentes en cada proyecto.',
  },
  {
    icon: Zap,
    title: 'Innovación Continua',
    description: 'Incorporamos tendencias globales para mantener a nuestros clientes en la vanguardia.',
  },
];

const Nosotros = () => {
  return (
    <section id="nosotros" className="py-32 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

      <div className="layout-container">
        <div className="grid lg:grid-cols-2 gap-20 items-center mb-24">
          <div>
            <h2 className="text-sm font-bold tracking-[0.4em] text-primary uppercase mb-6">
              Quiénes Somos
            </h2>
            <h3 className="text-5xl md:text-7xl font-display font-bold text-emerald-deep leading-[0.95] tracking-tighter mb-10">
              Más de una Década <br />
              <span className="text-accent italic">Construyendo</span>{' '}
              <span className="text-gradient">Experiencias</span>
            </h3>
            <p className="text-xl text-emerald-deep/60 leading-relaxed font-medium mb-6">
              A&amp;L Soluciones Integrales S.A.S. nació con la convicción de que cada evento, cada activación y cada suministro es una oportunidad para{' '}
              <span className="text-primary font-bold">dejar una huella duradera</span> en quienes participan.
            </p>
            <p className="text-lg text-emerald-deep/50 leading-relaxed">
              Desde Bogotá, operamos en más de 15 ciudades de Colombia, gestionando logística integral para empresas que exigen los más altos estándares de calidad y creatividad.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {values.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-8 rounded-3xl bg-primary/5 border border-primary/10 hover:border-accent/30 hover:bg-primary/10 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <Icon size={22} className="text-primary group-hover:text-accent transition-colors" aria-hidden="true" />
                </div>
                <h4 className="text-lg font-bold text-emerald-deep mb-3">{title}</h4>
                <p className="text-sm text-emerald-deep/60 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Nosotros;
