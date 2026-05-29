"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-zinc-100 last:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group transition-all"
      >
        <span className="text-zinc-800 font-display font-bold text-lg md:text-xl group-hover:text-primary transition-colors">
          {question}
        </span>
        <div className={`text-primary p-2 rounded-full bg-primary/5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={20} />
        </div>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-zinc-600 text-base md:text-lg leading-relaxed max-w-[900px]">
          {answer}
        </p>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "¿Por qué es vital el mantenimiento preventivo de servidores para mi empresa?",
      answer: "El mantenimiento preventivo garantiza la continuidad de su negocio al detectar fallas potenciales antes de que causen una interrupción. En Help Soluciones realizamos limpieza física, optimización de software, revisión de backups y actualizaciones de seguridad críticas para asegurar un uptime del 99.9%."
    },
    {
      question: "¿Qué beneficios ofrece un cableado estructurado certificado?",
      answer: "Un cableado certificado (Categoría 6A o superior) elimina los cuellos de botella en la transferencia de datos, reduce interferencias y cumple con normativas internacionales. Esto asegura que su infraestructura soporte tecnologías de alta demanda como videollamadas 4K, VoIP y grandes transferencias de archivos sin latencia."
    },
    {
      question: "¿Brindan soporte técnico remoto y presencial en toda Colombia?",
      answer: "Sí, contamos con un equipo de ingenieros capacitados para brindar soporte técnico remoto inmediato para problemas de software y configuración. Para requerimientos de hardware o infraestructura física, ofrecemos cobertura presencial en Bogotá y las principales ciudades de Colombia."
    },
    {
      question: "¿Cómo funciona el servicio de Outsourcing Tecnológico?",
      answer: "A través del outsourcing (o alquiler de equipos), su empresa puede acceder a hardware de última generación (servidores, laptops, redes) sin realizar una gran inversión inicial. Nosotros nos encargamos del mantenimiento, las garantías y la actualización tecnológica, permitiéndole enfocarse al 100% en su negocio."
    },
    {
      question: "¿Sus soluciones de ciberseguridad protegen contra Ransomware?",
      answer: "Implementamos capas de seguridad robustas que incluyen firewalls de próxima generación, sistemas de detección de intrusos (IDS) y estrategias de respaldo inmutable. Nuestro enfoque es prevenir ataques y asegurar que, en caso de cualquier incidente, su información pueda ser recuperada en tiempo récord."
    }
  ];

  return (
    <section className="px-4 py-24 md:px-10 lg:py-40 relative overflow-hidden bg-white" id="faq">
      <div className="layout-container max-w-4xl mx-auto">
        <div className="flex flex-col gap-6 text-center mb-16">
          <div className="flex items-center justify-center gap-3 text-primary font-bold tracking-[0.3em] uppercase text-xs">
             <HelpCircle size={16} /> Resuelva sus dudas
          </div>
          <h2 className="text-zinc-900 font-display text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Preguntas <span className="text-primary">Frecuentes</span>
          </h2>
          <p className="text-zinc-600 text-lg font-medium max-w-2xl mx-auto">
            Todo lo que necesita saber sobre nuestra ingeniería y servicios tecnológicos para potenciar su infraestructura empresarial.
          </p>
        </div>

        <div className="glass-card p-4 md:p-8 border-zinc-100 shadow-xl rounded-3xl">
          {faqs.map((faq, index) => (
            <FAQItem key={index} {...faq} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-zinc-500 font-medium mb-6">¿Tiene una pregunta diferente?</p>
          <a 
            href="https://wa.me/573043358650" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold py-4 px-10 rounded-2xl shadow-lg hover:bg-primary-hover hover:scale-105 transition-all"
          >
            Hablar con un Experto
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
