import { MessageCircle } from 'lucide-react';

/* ──────────────────────────────────────────────────────
   Hero — Executive Precision (Stitch Design System)
   Typography: Noto Serif headings + Work Sans body
   ────────────────────────────────────────────────────── */
export function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex flex-col items-center justify-center pt-24"
    >
      {/* ── Background: photo + deep navy overlay ── */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-corporate-blue/92" />
      </div>

      {/* ── Geometric pattern overlay (subtle) ── */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(#C5A059 1px, transparent 1px),
            linear-gradient(90deg, #C5A059 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">

        {/* Overline label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="block w-10 h-px bg-corporate-gold" />
          <span
            className="font-sans text-xs font-semibold text-corporate-gold uppercase"
            style={{ letterSpacing: '0.22em' }}
          >
            Firma de Contadores Públicos en Colombia
          </span>
          <span className="block w-10 h-px bg-corporate-gold" />
        </div>

        {/* H1 — Noto Serif Bold */}
        <h1
          className="font-serif font-bold text-white mb-6 leading-[1.08] text-balance"
          style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)' }}
        >
          Soluciones Contables y Tributarias{' '}
          <span
            className="font-serif italic"
            style={{ color: '#C5A059' }}
          >
            de Alto Impacto
          </span>
        </h1>

        {/* Subtitle — Work Sans */}
        <p
          className="font-sans font-light text-white/75 mb-10 max-w-2xl"
          style={{ fontSize: '1.125rem', lineHeight: '1.7' }}
        >
          Asesoría especializada para empresas y personas naturales.
          Cumplimiento, precisión y confianza en cada servicio.
        </p>

        {/* CTA Buttons (sharp corners) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <a
            href="https://wa.me/573133961662"
            target="_blank"
            rel="noopener noreferrer"
            id="hero-cta-primary"
            className="btn-primary group"
            style={{ borderRadius: 0 }}
          >
            <MessageCircle size={16} strokeWidth={2} />
            Consulta Gratuita · 313 396 1662
          </a>
          <a
            href="https://wa.me/573102172251"
            target="_blank"
            rel="noopener noreferrer"
            id="hero-cta-secondary-wa"
            className="btn-outline group"
            style={{ borderRadius: 0 }}
          >
            <MessageCircle size={16} strokeWidth={2} />
            310 217 2251
          </a>

        </div>

        {/* ── Stats row (bottom of hero) ── */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-px w-full max-w-2xl">
          {[
            { number: '10+',   label: 'Años de Experiencia'      },
            { number: '150+',  label: 'Clientes Satisfechos'     },
            { number: '100%',  label: 'Cumplimiento Tributario'  },
          ].map((stat, i) => (
            <div
              key={i}
              className="stat-item flex-1 py-5 border-t border-corporate-gold/30"
            >
              <span className="stat-number" style={{ color: '#C5A059' }}>
                {stat.number}
              </span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#nosotros"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 hover:text-white/70 transition-colors animate-bounce"
        aria-label="Desplazarse hacia abajo"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </a>
    </section>
  );
}
