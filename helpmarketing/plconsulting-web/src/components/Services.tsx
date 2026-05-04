import { Calculator, FileText, Users, LineChart, Briefcase, ArrowRight } from 'lucide-react';

/* ──────────────────────────────────────────────────────
   Services — Executive Precision (Stitch Design System)
   Sharp corners, border-defined cards, gold accents
   ────────────────────────────────────────────────────── */
export function Services() {
  const services = [
    {
      icon: <Calculator size={28} strokeWidth={1.5} />,
      number: '01',
      title: 'Contabilidad',
      description:
        'Llevamos la contabilidad de su empresa con precisión, oportunidad y cumplimiento normativo.',
    },
    {
      icon: <FileText size={28} strokeWidth={1.5} />,
      number: '02',
      title: 'Impuestos',
      description:
        'Asesoría y gestión en obligaciones tributarias nacionales y distritales. Planeación y cumplimiento fiscal.',
    },
    {
      icon: <Users size={28} strokeWidth={1.5} />,
      number: '03',
      title: 'Revisoría Fiscal',
      description:
        'Aportamos transparencia y confianza con una evaluación objetiva e independiente de su organización.',
    },
    {
      icon: <LineChart size={28} strokeWidth={1.5} />,
      number: '04',
      title: 'Asesoría Empresarial',
      description:
        'Acompañamos su empresa en la toma de decisiones estratégicas para su crecimiento y sostenibilidad.',
    },
    {
      icon: <Briefcase size={28} strokeWidth={1.5} />,
      number: '05',
      title: 'Nómina y Seguridad Social',
      description:
        'Administración integral de nómina y cumplimiento de obligaciones laborales y de seguridad social.',
    },
  ];

  return (
    <section id="servicios" className="py-28 bg-corporate-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <div className="section-label mb-5">Nuestros Servicios</div>
            <h2
              className="font-serif font-bold text-corporate-blue leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}
            >
              Soluciones Integrales<br />
              <span className="text-corporate-gold italic">para su Empresa</span>
            </h2>
          </div>
          <p className="font-sans text-corporate-muted max-w-sm text-sm" style={{ lineHeight: '1.75' }}>
            Un portafolio completo diseñado para garantizar la tranquilidad
            financiera y el cumplimiento normativo de su organización.
          </p>
        </div>

        {/* ── Service cards grid (sharp corners, border-defined) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-corporate-stroke">
          {services.map((service, index) => (
            <div
              key={index}
              className={`bg-white p-8 flex flex-col gap-5 transition-all duration-300 hover:bg-corporate-blue group cursor-default ${
                index === 4 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              {/* Number + Icon row */}
              <div className="flex items-center justify-between">
                <span
                  className="font-serif font-bold text-3xl text-corporate-stroke group-hover:text-corporate-gold/30 transition-colors"
                >
                  {service.number}
                </span>
                <div className="w-12 h-12 flex items-center justify-center border border-corporate-stroke group-hover:border-corporate-gold text-corporate-blue group-hover:text-corporate-gold transition-all">
                  {service.icon}
                </div>
              </div>

              {/* Gold line */}
              <span className="block w-8 h-px bg-corporate-gold" />

              {/* Title */}
              <h3 className="font-serif font-semibold text-corporate-blue text-xl group-hover:text-white transition-colors">
                {service.title}
              </h3>

              {/* Description */}
              <p className="font-sans text-corporate-muted text-sm group-hover:text-white/75 transition-colors" style={{ lineHeight: '1.7' }}>
                {service.description}
              </p>

              {/* Hover arrow */}
              <div className="mt-auto flex items-center gap-2 text-corporate-gold opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold uppercase tracking-widest">
                <span>Más información</span>
                <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
