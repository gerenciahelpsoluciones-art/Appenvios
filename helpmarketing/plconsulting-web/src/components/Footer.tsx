import { Mail, MapPin, Phone, MessageCircle } from 'lucide-react';

/* ──────────────────────────────────────────────────────
   Footer — Executive Precision (Stitch Design System)
   Logo consistent with Navbar, sharp corners
   ────────────────────────────────────────────────────── */
export function Footer() {
  return (
    <footer id="contacto" className="bg-corporate-blue text-white">

      {/* ── Top gold rule ── */}
      <div className="h-px bg-corporate-gold/40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* ── Brand (logo consistent with Navbar) ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              {/* Diamond mark */}
              <div className="relative flex-shrink-0" style={{ width: 64, height: 52 }}>
                <svg width="64" height="52" viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M32,4 L60,26 L32,48 L4,26 Z" stroke="#C5A059" strokeWidth="1.5" fill="none" />
                  <path d="M32,4 L60,26 L32,48 L4,26 Z" fill="rgba(197,160,89,0.12)" />
                  <text x="32" y="31" textAnchor="middle" fontFamily="'Noto Serif', Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="18" fill="#C5A059" letterSpacing="-0.5">PL</text>
                </svg>
              </div>

              {/* Gold vertical rule */}
              <div className="self-stretch flex-shrink-0" style={{ width: '1px', background: 'linear-gradient(to bottom, transparent, #C5A059 30%, #C5A059 70%, transparent)', minHeight: 38 }} />

              {/* Typographic lockup */}
              <div className="flex flex-col justify-center" style={{ gap: '1px' }}>
                <div className="flex items-baseline gap-1.5">
                  <span style={{ fontFamily: "'Noto Serif', Georgia, serif", fontStyle: 'italic', fontWeight: 800, fontSize: '0.95rem', color: '#C5A059', lineHeight: 1 }}>PL</span>
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 600, fontSize: '0.6rem', color: '#FFFFFF', letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1 }}>Consulting &amp; Tax</span>
                </div>
                <div style={{ height: '1px', background: '#C5A059', opacity: 0.4, margin: '3px 0' }} />
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 700, fontSize: '0.55rem', color: '#FFFFFF', letterSpacing: '0.22em', textTransform: 'uppercase' }}>SAS</span>
                  <span style={{ color: '#C5A059', fontSize: '0.4rem', opacity: 0.7 }}>◆</span>
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 400, fontSize: '0.5rem', color: '#C5A059', letterSpacing: '0.18em', textTransform: 'uppercase', fontStyle: 'italic' }}>Contadores Públicos</span>
                </div>
              </div>
            </div>

            <p className="font-sans text-white/60 text-sm mb-8 max-w-sm" style={{ lineHeight: '1.75' }}>
              Firma de contadores públicos comprometida con brindar soluciones
              contables, tributarias y financieras integrales, basadas en la
              ética, la calidad y el conocimiento.
            </p>

            {/* Contact quick row */}
            <div className="flex flex-col gap-3">
              <a href="mailto:Plconsulting.tax@gmail.com" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm font-sans">
                <Mail size={14} className="text-corporate-gold" />
                Plconsulting.tax@gmail.com
              </a>
              <a href="tel:+573133961662" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm font-sans">
                <Phone size={14} className="text-corporate-gold" />
                313 396 1662
              </a>
              <a href="tel:+573102172251" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm font-sans">
                <Phone size={14} className="text-corporate-gold" />
                310 217 2251
              </a>
              <div className="flex items-start gap-3 text-white/60 text-sm font-sans">
                <MapPin size={14} className="text-corporate-gold shrink-0 mt-0.5" />
                Carrera 93 F 127 B 12, Bogotá, Colombia
              </div>
            </div>
          </div>

          {/* ── Navigation ── */}
          <div>
            <h4 className="font-sans font-semibold text-xs uppercase tracking-widest text-corporate-gold mb-6">
              Navegación
            </h4>
            <ul className="flex flex-col gap-3">
              {['#inicio', '#nosotros', '#servicios', '#contacto'].map((href, i) => {
                const labels = ['Inicio', 'Sobre Nosotros', 'Servicios', 'Contacto'];
                return (
                  <li key={i}>
                    <a
                      href={href}
                      className="font-sans text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                      <span className="block w-0 h-px bg-corporate-gold group-hover:w-4 transition-all duration-300" />
                      {labels[i]}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── WhatsApp CTA ── */}
          <div>
            <h4 className="font-sans font-semibold text-xs uppercase tracking-widest text-corporate-gold mb-6">
              Asesoría Directa
            </h4>
            <p className="font-sans text-white/60 text-sm mb-6" style={{ lineHeight: '1.7' }}>
              ¿Necesita ayuda inmediata? Escríbanos directamente a través de WhatsApp.
            </p>
            <a
              href="https://wa.me/573133961662"
              target="_blank"
              rel="noopener noreferrer"
              id="footer-cta-whatsapp-1"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20B558] text-white font-semibold text-sm py-3 px-5 w-full justify-center transition-colors duration-200"
              style={{ borderRadius: 0 }}
            >
              <MessageCircle size={16} />
              313 396 1662
            </a>
            <a
              href="https://wa.me/573102172251"
              target="_blank"
              rel="noopener noreferrer"
              id="footer-cta-whatsapp-2"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20B558] text-white font-semibold text-sm py-3 px-5 w-full justify-center transition-colors duration-200 mt-2"
              style={{ borderRadius: 0 }}
            >
              <MessageCircle size={16} />
              310 217 2251
            </a>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-white/40 text-xs font-sans">
          <p>&copy; {new Date().getFullYear()} PL Consulting &amp; Tax SAS. Todos los derechos reservados.</p>
          <a href="https://www.plconsultingtax.com" className="hover:text-corporate-gold transition-colors">
            www.plconsultingtax.com
          </a>
        </div>
      </div>
    </footer>
  );
}
