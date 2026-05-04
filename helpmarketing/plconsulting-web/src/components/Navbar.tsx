import { useState, useEffect } from 'react';
import { Menu, X, Phone } from 'lucide-react';

/* ──────────────────────────────────────────────────────
   Logo SVG — PL Consulting & Tax SAS
   Executive Precision Design System (Stitch)
   ────────────────────────────────────────────────────── */
function LogoMark({ scrolled }: { scrolled: boolean }) {
  const navy = scrolled ? '#0B1B3D' : '#FFFFFF';
  const gold = '#C5A059';

  // Diamond points: top(32,4) right(60,26) bottom(32,48) left(4,26)
  const diamond = 'M32,4 L60,26 L32,48 L4,26 Z';

  return (
    <div className="flex items-center gap-4" style={{ transition: 'all 0.3s ease' }}>

      {/* ─── Escudo: diamond SVG mark ─── */}
      <div className="relative flex-shrink-0" style={{ width: 64, height: 52 }}>
        <svg
          width="64" height="52"
          viewBox="0 0 64 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Outer diamond — gold stroke */}
          <path
            d={diamond}
            stroke={gold}
            strokeWidth="1.5"
            fill="none"
          />
          {/* Inner diamond — very subtle fill */}
          <path
            d={diamond}
            fill={scrolled ? 'rgba(197,160,89,0.07)' : 'rgba(197,160,89,0.12)'}
          />
          {/* PL serif italic monogram — centered */}
          <text
            x="32"
            y="31"
            textAnchor="middle"
            fontFamily="'Noto Serif', Georgia, serif"
            fontStyle="italic"
            fontWeight="700"
            fontSize="18"
            fill={gold}
            letterSpacing="-0.5"
          >
            PL
          </text>
        </svg>
      </div>

      {/* ─── Gold vertical rule ─── */}
      <div
        className="self-stretch flex-shrink-0"
        style={{
          width: '1px',
          background: `linear-gradient(to bottom, transparent, ${gold} 30%, ${gold} 70%, transparent)`,
          minHeight: 38,
        }}
      />

      {/* ─── Typographic lockup ─── */}
      <div className="flex flex-col justify-center" style={{ gap: '1px' }}>
        {/* Top line: PL + CONSULTING & TAX */}
        <div className="flex items-baseline gap-1.5">
          <span
            style={{
              fontFamily: "'Noto Serif', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: gold,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            PL
          </span>
          <span
            style={{
              fontFamily: "'Work Sans', sans-serif",
              fontWeight: 600,
              fontSize: '0.6rem',
              color: navy,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              lineHeight: 1,
              transition: 'color 0.3s ease',
            }}
          >
            Consulting &amp; Tax
          </span>
        </div>

        {/* Thin gold rule */}
        <div style={{ height: '1px', background: gold, opacity: 0.4, margin: '3px 0' }} />

        {/* Bottom row: SAS + Contadores Públicos */}
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "'Work Sans', sans-serif",
              fontWeight: 700,
              fontSize: '0.55rem',
              color: navy,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              transition: 'color 0.3s ease',
            }}
          >
            SAS
          </span>
          <span style={{ color: gold, fontSize: '0.4rem', opacity: 0.7 }}>◆</span>
          <span
            style={{
              fontFamily: "'Work Sans', sans-serif",
              fontWeight: 400,
              fontSize: '0.5rem',
              color: gold,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            Contadores Públicos
          </span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   Navbar Component
   ────────────────────────────────────────────────────── */
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio',         href: '#inicio'    },
    { name: 'Sobre Nosotros', href: '#nosotros'  },
    { name: 'Servicios',      href: '#servicios' },
    { name: 'Contacto',       href: '#contacto'  },
  ];

  return (
    <nav
      id="navbar"
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white border-b border-corporate-stroke shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">

          {/* ── Logo ── */}
          <a href="#inicio" className="flex-shrink-0" aria-label="PL Consulting & Tax SAS — Inicio">
            <LogoMark scrolled={isScrolled} />
          </a>

          {/* ── Desktop Navigation ── */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`
                  relative font-sans text-sm font-medium tracking-wide
                  transition-colors duration-200
                  after:content-[''] after:absolute after:-bottom-1 after:left-0
                  after:h-px after:w-0 after:bg-corporate-gold
                  after:transition-all after:duration-300
                  hover:after:w-full
                  ${isScrolled
                    ? 'text-corporate-blue hover:text-corporate-gold'
                    : 'text-white/90 hover:text-white'
                  }
                `}
              >
                {link.name}
              </a>
            ))}

            {/* CTA — WhatsApp button (Sharp = authority) */}
            <div className="flex flex-col gap-1 items-end">
              <a
                href="https://wa.me/573133961662"
                target="_blank"
                rel="noopener noreferrer"
                id="navbar-cta-whatsapp-1"
                className="btn-primary"
                style={{ borderRadius: 0, padding: '0.5rem 1rem', fontSize: '0.75rem' }}
              >
                <Phone size={13} strokeWidth={2.5} />
                <span>313 396 1662</span>
              </a>
              <a
                href="https://wa.me/573102172251"
                target="_blank"
                rel="noopener noreferrer"
                id="navbar-cta-whatsapp-2"
                className="btn-outline-gold"
                style={{ borderRadius: 0, padding: '0.5rem 1rem', fontSize: '0.75rem' }}
              >
                <Phone size={13} strokeWidth={2.5} />
                <span>310 217 2251</span>
              </a>
            </div>
          </div>

          {/* ── Mobile Menu Button ── */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menú de navegación"
            aria-expanded={mobileMenuOpen}
            className={`md:hidden p-2 transition-colors ${
              isScrolled ? 'text-corporate-blue' : 'text-white'
            }`}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-corporate-stroke shadow-lg">
          <nav className="px-4 py-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-2 py-4 font-sans font-medium text-corporate-blue border-b border-corporate-stroke/50 hover:text-corporate-gold hover:pl-4 transition-all duration-200"
              >
                {link.name}
                <span className="text-corporate-gold text-xs">›</span>
              </a>
            ))}

            <div className="py-4 flex flex-col gap-2">
              <a
                href="https://wa.me/573133961662"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full justify-center"
                style={{ borderRadius: 0 }}
              >
                <Phone size={16} />
                WhatsApp: 313 396 1662
              </a>
              <a
                href="https://wa.me/573102172251"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-gold w-full justify-center"
                style={{ borderRadius: 0 }}
              >
                <Phone size={16} />
                WhatsApp: 310 217 2251
              </a>
            </div>
          </nav>
        </div>
      </div>
    </nav>
  );
}
