"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const HERO_SLIDES = [
  {
    image: "/images/pexels-field-engineer-147254-442151.jpg",
    title: "Expertos en Mantenimiento de Servidores e Infraestructura TI",
    titleAccent: "de Alto Impacto",
    subtitle:
      "12 años garantizando la continuidad TI en Colombia. Respondemos en menos de 2 horas, porque cada minuto de inactividad cuesta.",
    ctaPrimary: "Diagnóstico Gratuito",
    ctaPrimaryHref: "/agendar-cita",
    ctaSecondary: "Ver Servicios",
    ctaSecondaryHref: "#servicios",
  },
  {
    image: "/images/pexels-brett-sayles-2881229.jpg",
    title: "Redes WiFi y Cableado Estructurado",
    titleAccent: "Conectividad que no Falla",
    subtitle:
      "Cat6A certificado, fibra óptica y WiFi corporativo de alta densidad. Infraestructura diseñada para soportar el crecimiento sin cuellos de botella.",
    ctaPrimary: "Cotizar Proyecto",
    ctaPrimaryHref: "/contactenos",
    ctaSecondary: "Ver Portafolio",
    ctaSecondaryHref: "#servicios",
  },
  {
    image: "/images/pexels-field-engineer-147254-442152.jpg",
    title: "Soporte Técnico 24/7",
    titleAccent: "Respuesta en Menos de 2 Horas",
    subtitle:
      "Ingenieros certificados listos para actuar en sitio o de forma remota, con el soporte TI más confiable de Bogotá.",
    ctaPrimary: "Contactar Ahora",
    ctaPrimaryHref: "/contactenos",
    ctaSecondary: "Como Trabajamos",
    ctaSecondaryHref: "#nosotros",
  },
  {
    image: "/images/pexels-field-engineer-147254-442150.jpg",
    title: "Outsourcing TI: Tecnología Dell, HP y Lenovo",
    titleAccent: "sin Inversión Inicial",
    subtitle:
      "Acceda a equipos de última generación con mantenimiento incluido. Reduzca costos, elimine riesgos y enfóquese en su negocio.",
    ctaPrimary: "Ver Planes",
    ctaPrimaryHref: "/contactenos",
    ctaSecondary: "Ver Equipos",
    ctaSecondaryHref: "/productos",
  },
];

const Hero = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full px-4 py-10 md:px-10 lg:pt-20 lg:pb-14 bg-gradient-to-br from-slate-50 to-blue-50/40">
      <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[560px]">

        {/* LEFT: Text content */}
        <div className="flex flex-col gap-6 relative min-h-[320px] lg:min-h-[400px]">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`transition-all duration-700 flex flex-col gap-5 ${
                index === current
                  ? "opacity-100 translate-y-0 relative z-10"
                  : "opacity-0 translate-y-3 absolute inset-0 pointer-events-none z-0"
              }`}
            >
              {/* Eyebrow solo en slide 0 */}
              {index === 0 && (
                <div className="inline-block self-start px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-[0.2em] uppercase">
                  12 Años de Excelencia Tecnológica
                </div>
              )}

              {index === 0 ? (
                <h1 className="text-zinc-900 text-4xl md:text-5xl lg:text-[3.25rem] font-display font-black leading-[1.1] tracking-tight">
                  {slide.title}{" "}
                  <span className="text-primary">{slide.titleAccent}</span>
                </h1>
              ) : (
                <div
                  role="heading"
                  aria-level={2}
                  className="text-zinc-900 text-4xl md:text-5xl lg:text-[3.25rem] font-display font-black leading-[1.1] tracking-tight"
                >
                  {slide.title}{" "}
                  <span className="text-primary">{slide.titleAccent}</span>
                </div>
              )}

              <p className="text-zinc-600 text-lg md:text-xl font-medium leading-relaxed max-w-[520px]">
                {slide.subtitle}
              </p>

              <div className="flex flex-wrap gap-4 pt-1">
                <Link
                  href={slide.ctaPrimaryHref}
                  className="inline-flex items-center justify-center rounded-xl font-bold font-display tracking-wide transition-all duration-300 focus:outline-none h-14 px-8 text-base bg-primary hover:bg-primary-hover text-white shadow-[0_8px_16px_-4px_rgba(37,99,234,0.35)] hover:scale-105 active:scale-95"
                >
                  {slide.ctaPrimary}
                </Link>
                <Link
                  href={slide.ctaSecondaryHref}
                  className="inline-flex items-center justify-center rounded-xl font-bold font-display tracking-wide transition-all duration-300 focus:outline-none h-14 px-8 text-base border border-zinc-200 bg-white text-zinc-800 hover:border-primary hover:text-primary hover:scale-105 active:scale-95 shadow-sm"
                >
                  {slide.ctaSecondary}
                </Link>
              </div>
            </div>
          ))}

          {/* Indicadores debajo del texto */}
          <div className="absolute bottom-0 left-0 flex gap-2 pt-4">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                aria-label={`Ver diapositiva ${index + 1}`}
                className="py-2 px-0.5 group"
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === current
                      ? "w-8 bg-primary"
                      : "w-2 bg-zinc-300 group-hover:bg-zinc-400"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Image carousel */}
        <div className="relative h-[340px] sm:h-[420px] lg:h-[520px] rounded-2xl overflow-hidden shadow-xl">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={slide.image}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === current ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover object-center"
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={85}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

      </div>
    </section>
  );
};

export default Hero;
