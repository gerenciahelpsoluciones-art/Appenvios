"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaPrimaryHref: string;
  ctaSecondary: string;
  ctaSecondaryHref: string;
}

const HERO_SLIDES: Slide[] = [
  {
    image: "/images/premium_hero_1.png",
    title:
      "Expertos en Mantenimiento de Servidores e Infraestructura TI de Alto Impacto",
    subtitle:
      "12 años garantizando la continuidad de negocios en Colombia. Respondemos en menos de 2 horas — porque cada minuto de inactividad le cuesta a su empresa.",
    ctaPrimary: "Diagnóstico Gratuito",
    ctaPrimaryHref: "/agendar-cita",
    ctaSecondary: "Ver Servicios",
    ctaSecondaryHref: "#servicios",
  },
  {
    image: "/images/premium_hero_2.png",
    title: "Redes WiFi y Cableado Estructurado: Conectividad que no Falla",
    subtitle:
      "Cat6A certificado, fibra óptica y WiFi corporativo de alta densidad. Infraestructura diseñada para soportar el crecimiento de su empresa sin cuellos de botella.",
    ctaPrimary: "Cotizar Proyecto",
    ctaPrimaryHref: "/contactenos",
    ctaSecondary: "Ver Portafolio",
    ctaSecondaryHref: "#servicios",
  },
  {
    image: "/images/premium_about.png",
    title: "Soporte Técnico 24/7: Respuesta en Menos de 2 Horas",
    subtitle:
      "Ingenieros certificados listos para actuar — en sitio o de forma remota. Proteja su operación con el servicio de soporte TI más confiable de Bogotá.",
    ctaPrimary: "Contactar Ahora",
    ctaPrimaryHref: "/contactenos",
    ctaSecondary: "¿Cómo Trabajamos?",
    ctaSecondaryHref: "#nosotros",
  },
  {
    image: "/images/premium_rental.png",
    title: "Outsourcing TI: Tecnología Dell, HP y Lenovo sin Inversión Inicial",
    subtitle:
      "Acceda a equipos de última generación con mantenimiento incluido. Reduzca costos, elimine riesgos y enfóquese 100% en su negocio.",
    ctaPrimary: "Ver Planes",
    ctaPrimaryHref: "/contactenos",
    ctaSecondary: "Ver Equipos",
    ctaSecondaryHref: "/productos",
  },
];

const primaryBtnStyles =
  "inline-flex items-center justify-center rounded-xl font-bold font-display tracking-wide transition-all duration-500 focus:outline-none h-14 px-10 text-base bg-primary hover:bg-primary-hover text-white shadow-[0_10px_20px_-5px_rgba(37,99,234,0.4)] hover:scale-105 active:scale-95";
const secondaryBtnStyles =
  "inline-flex items-center justify-center rounded-xl font-bold font-display tracking-wide transition-all duration-500 focus:outline-none h-14 px-10 text-base glass-card hover:bg-black/5 text-zinc-900 border border-white/40 hover:scale-105 active:scale-95 shadow-lg";

const Hero: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full px-4 py-8 md:px-10 lg:pt-24 lg:pb-16 relative overflow-hidden mesh-gradient">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-blob pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-sky-400/10 rounded-full blur-[120px] animate-blob pointer-events-none [animation-delay:2s]" />
      
      <div className="rounded-3xl overflow-hidden relative min-h-[600px] flex flex-col items-center justify-center p-8 md:p-16 text-center glass-card border-white/20 group">
        {/* Background Carousel Layer */}
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-55 scale-100" : "opacity-0 scale-110"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover object-center"
              priority={index === 0}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 1536px) 80vw, 1200px"
              quality={85}
            />
          </div>
        ))}

        {/* Premium Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/20 to-white/80 z-10" />
        
        {/* Content Layer */}
        <div className="relative z-20 w-full max-w-[1000px] flex flex-col items-center gap-10">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`transition-all duration-1000 w-full flex flex-col items-center gap-6 col-start-1 row-start-1 ${
                index === currentImageIndex
                  ? "opacity-100 translate-y-0 relative z-10 blur-0"
                  : "opacity-0 translate-y-12 absolute pointer-events-none z-0 blur-xl"
              }`}
            >
              <div className="inline-block px-6 py-2 rounded-full glass-card border-white/50 text-primary text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-4 animate-float shadow-xl">
                12 Años de Excelencia Tecnológica
              </div>

              {/* Solo slide 0 usa <h1> real para SEO; el resto usa <div> con estilos idénticos */}
              {index === 0 ? (
                <h1 className="text-zinc-900 text-4xl md:text-6xl lg:text-7xl font-display font-black leading-[1.1] tracking-tight text-glow filter drop-shadow-sm selection:bg-primary/30">
                  {slide.title.split(': ').map((part, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <br className="hidden md:block" />}
                      <span className={i > 0 ? "text-primary block mt-2" : ""}>{part}</span>
                    </React.Fragment>
                  ))}
                </h1>
              ) : (
                <div role="heading" aria-level={2} className="text-zinc-900 text-4xl md:text-6xl lg:text-7xl font-display font-black leading-[1.1] tracking-tight text-glow filter drop-shadow-sm selection:bg-primary/30">
                  {slide.title.split(': ').map((part, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <br className="hidden md:block" />}
                      <span className={i > 0 ? "text-primary block mt-2" : ""}>{part}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              <p className="text-zinc-600 text-lg md:text-2xl font-medium leading-relaxed max-w-[800px] text-balance">
                {slide.subtitle}
              </p>

              <div className="flex flex-wrap justify-center gap-4 md:gap-8 pt-8 w-full">
                <Link href={slide.ctaPrimaryHref} className={primaryBtnStyles}>
                  {slide.ctaPrimary}
                </Link>
                <Link
                  href={slide.ctaSecondaryHref}
                  className={secondaryBtnStyles}
                >
                  {slide.ctaSecondary}
                </Link>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 pt-2 text-xs text-zinc-500 font-semibold tracking-wide">
                <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Respuesta en &lt;2 horas</span>
                <span className="hidden sm:block w-px h-3 bg-zinc-300" />
                <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Sin contratos forzosos</span>
                <span className="hidden sm:block w-px h-3 bg-zinc-300" />
                <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> +500 empresas atendidas</span>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Indicators */}
        <div className="absolute bottom-12 left-0 right-0 z-30 flex justify-center gap-3">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className="py-4 px-1 group transition-all duration-300"
              aria-label={`Ver diapositiva ${index + 1}`}
            >
              <div
                className={`h-2 rounded-full transition-all duration-700 ${
                  index === currentImageIndex
                    ? "w-12 bg-primary shadow-[0_0_15px_rgba(37,99,234,0.5)]"
                    : "w-3 bg-zinc-300 group-hover:bg-zinc-400"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
