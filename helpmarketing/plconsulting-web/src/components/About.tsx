import { Award, ShieldCheck, TrendingUp } from 'lucide-react';

/* ──────────────────────────────────────────────────────
   About — Executive Precision (Stitch Design System)
   Typography: Noto Serif headings + Work Sans body
   ────────────────────────────────────────────────────── */
export function About() {
  const values = [
    {
      icon: <Award className="text-corporate-gold" size={28} strokeWidth={1.5} />,
      title: 'Experiencia',
      description:
        'Profesionales con amplia trayectoria y actualización técnica constante en normativa colombiana.',
    },
    {
      icon: <ShieldCheck className="text-corporate-gold" size={28} strokeWidth={1.5} />,
      title: 'Confianza',
      description:
        'Actuamos con ética, confidencialidad y responsabilidad en cada proceso.',
    },
    {
      icon: <TrendingUp className="text-corporate-gold" size={28} strokeWidth={1.5} />,
      title: 'Valor',
      description:
        'Generamos información clave para decisiones financieras inteligentes y sostenibles.',
    },
  ];

  return (
    <section id="nosotros" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* ── Left: Text ── */}
          <div>
            {/* Section overline */}
            <div className="section-label mb-6">Sobre Nosotros</div>

            <h2 className="font-serif font-bold text-corporate-blue mb-6 leading-tight"
                style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>
              Aliados estratégicos para su crecimiento empresarial
            </h2>

            <span className="gold-rule mb-8 block" />

            <p className="font-sans text-corporate-muted mb-5" style={{ lineHeight: '1.75' }}>
              <strong className="font-semibold text-corporate-blue">
                PL CONSULTING &amp; TAX SAS
              </strong>{' '}
              es una firma de contadores públicos comprometida con brindar soluciones
              contables, tributarias y financieras integrales, basadas en la ética,
              la calidad y el conocimiento profundo de la normativa colombiana.
            </p>

            <p className="font-sans text-corporate-muted mb-10" style={{ lineHeight: '1.75' }}>
              Nuestro propósito es ser aliados estratégicos de nuestros clientes,
              generando valor y contribuyendo al crecimiento sostenible de sus negocios
              con soluciones a la medida.
            </p>

            {/* Quote block — card with gold left border */}
            <div className="border-l-2 border-corporate-gold pl-6 py-1">
              <p className="font-serif italic text-corporate-blue text-lg leading-relaxed">
                "Transformamos números en información, información en decisiones
                y decisiones en resultados."
              </p>
            </div>
          </div>

          {/* ── Right: Value cards ── */}
          <div className="flex flex-col gap-px bg-corporate-stroke">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white flex gap-5 items-start p-7 transition-all duration-300 hover:bg-corporate-gray group"
              >
                {/* Icon box */}
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center border border-corporate-stroke group-hover:border-corporate-gold transition-colors">
                  {value.icon}
                </div>

                <div>
                  <h3 className="font-serif font-semibold text-corporate-blue text-xl mb-1.5">
                    {value.title}
                  </h3>
                  <p className="font-sans text-corporate-muted text-sm" style={{ lineHeight: '1.65' }}>
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
