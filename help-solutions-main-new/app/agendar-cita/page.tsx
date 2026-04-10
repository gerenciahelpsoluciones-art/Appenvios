'use client'

import React from 'react';
import Button from '../../components/ui/Button';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

const SchedulePage = () => {

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">

            <section className="bg-slate-900 py-16 md:py-24 relative overflow-hidden flex-grow flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                <div className="layout-container relative z-10 text-center px-4 max-w-3xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Agendar Cita
                    </h1>
                    <p className="text-slate-300 text-lg mb-10">
                        Haga clic en el botón a continuación para abrir nuestro calendario y seleccionar el horario que mejor se adapte a su disponibilidad. Uno de nuestros expertos estará encantado de atenderle.
                    </p>

                    <div className="flex justify-center">
                        <Link href="https://calendly.com/ventasonline-helpsoluciones" target="_blank" rel="noopener noreferrer">
                            <Button variant="primary" className="!px-8 !py-4 !text-lg flex items-center gap-3">
                                <Calendar size={24} />
                                Agendar en Calendly
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default SchedulePage;
