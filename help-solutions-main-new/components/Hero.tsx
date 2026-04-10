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
      "Garantice la continuidad radical de su negocio. Optimizamos su núcleo tecnológico para un rendimiento imparable en toda Colombia.",
    ctaPrimary: "Asesoría Estratégica",
    ctaPrimaryHref: "/agendar-cita",
    ctaSecondary: "Nuestra Ingeniería",
    ctaSecondaryHref: "/ingenieria-social",
  },
  {
    image: "/images/premium_hero_2.png",
    title: "Conectividad de Próxima Generación: Redes WiFi y Cableado Estructurado",
    subtitle:
      "Infraestructura robusta para la era digital. Implementamos soluciones estables, seguras y escalables para empresas que no se detienen.",
    ctaPrimary: "Cotizar Proyecto",
    ctaPrimaryHref: "/contactenos",
    ctaSecondary: "Ver Portafolio",
    ctaSecondaryHref: "/ingenieria-social",
  },
  {
    image: "/images/premium_about.png",
    title: "Soporte Técnico de Élite con Respuesta Inmediata",
    subtitle:
      "Diagnóstico experto en hardware y software. Más de una década redefiniendo el soporte técnico para las empresas líderes de la región.",
    ctaPrimary: "Solicitar Soporte",
    ctaPrimaryHref: "/contactenos",
    ctaSecondary: "Explorar Más",
    ctaSecondaryHref: "/contactenos",
  },
  {
    image: "/images/premium_rental.png",
    title: "Outsourcing Tecnológico: Potencia tu Infraestructura sin Límites",
    subtitle:
      "Equipamiento de última generación (Dell, HP, Lenovo). Alquiler flexible con gestión integral incluida para una operatividad total.",
    ctaPrimary: "Solicitar Propuesta",
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
              index === currentImageIndex ? "opacity-30 scale-100" : "opacity-0 scale-110"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover object-center"
              priority={index === 0}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 1536px) 80vw, 1200px"
              quality={60}
            />
          </div>
        ))}

        {/* Premium Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/40 to-white/90 z-10" />
        
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

              <h1 className="text-zinc-900 text-4xl md:text-6xl lg:text-7xl font-display font-black leading-[1.1] tracking-tight text-glow filter drop-shadow-sm selection:bg-primary/30">
                {slide.title.split(': ').map((part, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br className="hidden md:block" />}
                    <span className={i > 0 ? "text-primary block mt-2" : ""}>{part}</span>
                  </React.Fragment>
                ))}
              </h1>

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
