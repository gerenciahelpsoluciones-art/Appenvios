"use client"

import type React from "react"
import Link from "next/link"

interface Certification {
  name: string
  href: string
  logoUrl?: string
}

const certifications: Certification[] = [
  { name: "Dell",        href: "https://www.dell.com",              logoUrl: "/images/partners/dell.svg" },
  { name: "Lenovo",      href: "https://www.lenovo.com",            logoUrl: "/images/partners/lenovo.svg" },
  { name: "HP",          href: "https://www.hp.com",                logoUrl: "/images/partners/hp.svg" },
  { name: "Fortinet",    href: "https://www.fortinet.com",          logoUrl: "/images/partners/fortinet.svg" },
  { name: "Kaspersky",   href: "https://www.kaspersky.com",         logoUrl: "/images/partners/kaspersky.svg" },
  { name: "Bitdefender", href: "https://www.bitdefender.com",       logoUrl: "/images/partners/bitdefender.svg" },
  { name: "TP-Link",     href: "https://www.tp-link.com",           logoUrl: "/images/partners/tplink.svg" },
  { name: "MikroTik",    href: "https://mikrotik.com",              logoUrl: "/images/partners/mikrotik.svg" },
  { name: "Zebra",       href: "https://www.zebra.com",             logoUrl: "/images/partners/zebratechnologies.svg" },
  { name: "Acronis",     href: "https://www.acronis.com" },
  { name: "Logitech",    href: "https://www.logitech.com" },
  { name: "Nagios",      href: "/docs/Confirmation-of-Reseller-HELP-SOLUCIONES-INFORMATICAS-HSI-SAS.pdf" },
  { name: "Genius",      href: "https://global.geniusnet.com" },
]

const doubled = [...certifications, ...certifications]

const CertItem: React.FC<{ cert: Certification; index: number }> = ({ cert, index }) => (
  <Link
    key={index}
    href={cert.href}
    target={cert.href.startsWith("http") ? "_blank" : "_self"}
    rel={cert.href.startsWith("http") ? "noopener noreferrer" : undefined}
    className="flex-shrink-0 flex items-center justify-center px-8 py-5 rounded-xl border border-zinc-100 hover:border-primary/30 bg-white hover:bg-primary/5 transition-all duration-300 group shadow-sm hover:shadow-md min-w-[140px] h-[72px]"
    title={cert.name}
  >
    {cert.logoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cert.logoUrl}
        alt={`Logo ${cert.name}`}
        className="max-h-8 max-w-[110px] w-auto object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 select-none"
        loading="lazy"
      />
    ) : (
      <span className="text-zinc-400 group-hover:text-primary font-display font-bold text-lg tracking-[0.1em] uppercase transition-colors duration-300 select-none whitespace-nowrap">
        {cert.name}
      </span>
    )}
  </Link>
)

const Certifications: React.FC = () => {
  return (
    <section className="px-4 py-20 md:px-10 lg:py-32 w-screen relative left-1/2 -translate-x-1/2 overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10" />

      <div className="flex flex-col items-center gap-16 w-full mx-auto">
        <div className="flex flex-col gap-6 text-center max-w-[1200px] mx-auto">
          <div className="text-primary font-bold tracking-[0.2em] uppercase text-sm">Respaldo Global</div>
          <h2 className="text-zinc-900 font-display text-4xl md:text-5xl font-black leading-tight tracking-tight text-glow">
            Aliados de Clase <span className="text-primary">Mundial</span>
          </h2>
          <p className="text-zinc-600 text-lg md:text-xl max-w-[800px]">
            Trabajamos con los líderes de la industria para garantizar que su infraestructura cumpla con los estándares más exigentes.
          </p>
        </div>

        <div className="relative w-full overflow-hidden py-4">
          {/* Gradient edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="flex animate-marquee hover:[animation-play-state:paused] gap-4">
            {doubled.map((cert, index) => (
              <CertItem key={index} cert={cert} index={index} />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 45s linear infinite;
        }
      `}</style>
    </section>
  )
}

export default Certifications
