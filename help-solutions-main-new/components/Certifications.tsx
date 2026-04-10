"use client"

import type React from "react"
import Link from "next/link"

// Define el tipo para cada certificación
interface Certification {
    name: string
    href: string
}

const Certifications: React.FC = () => {
    const certifications: Certification[] = [
        { name: "NAGIOS", href: "/docs/Confirmation-of-Reseller-HELP-SOLUCIONES-INFORMATICAS-HSI-SAS.pdf" },
        { name: "LENOVO", href: "https://www.lenovo.com" },
        { name: "DELL", href: "https://www.dell.com" },
        { name: "HP", href: "https://www.hp.com" },
        { name: "LOGITECH", href: "https://www.logitech.com" },
        { name: "ACRONIS", href: "https://www.acronis.com" },
        { name: "KASPERSKY", href: "https://www.kaspersky.com" },
        { name: "BITDEFENDER", href: "https://www.bitdefender.com" },
        { name: "TP-LINK", href: "https://www.tp-link.com" },
        { name: "FORTINET", href: "https://www.fortinet.com" },
        { name: "MIKROTIK", href: "https://mikrotik.com" },
        { name: "GENIUS", href: "https://global.geniusnet.com" },
        { name: "ZEBRA", href: "https://www.zebra.com" },
    ]

    // Double the items for seamless loop
    const doubledCertifications = [...certifications, ...certifications]

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

                {/* Infinite Marquee Carousel */}
                <div className="relative w-full overflow-hidden py-10">
                    {/* Gradient Overlays for smooth edges */}
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                    <div className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap gap-6 py-4">
                        {doubledCertifications.map((cert, index) => (
                            <Link
                                key={index}
                                href={cert.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 flex items-center justify-center px-8 py-4 rounded-xl border border-black/5 hover:border-primary/20 transition-all duration-500 group relative backdrop-blur-sm"
                            >
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-colors" />
                                <span className="relative text-zinc-400 group-hover:text-primary font-display font-bold text-xl md:text-2xl tracking-[0.15em] transition-all duration-500 select-none group-hover:drop-shadow-[0_0_12px_rgba(37,99,234,0.15)]">
                                    {cert.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    display: flex;
                    width: max-content;
                    animation: marquee 50s linear infinite;
                }
            `}</style>
        </section>
    )
}

export default Certifications
