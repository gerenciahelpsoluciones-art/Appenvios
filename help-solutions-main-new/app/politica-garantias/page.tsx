import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  MapPin,
  RotateCcw,
  FileText,
  ShieldCheck,
  ArrowLeft,
  Mail,
  Building
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Garantías',
  description: 'Política de garantías de Help Soluciones Informáticas para equipos, repuestos y servicios técnicos en Colombia.',
  alternates: { canonical: 'https://www.helpsoluciones.com.co/politica-garantias' },
  openGraph: {
    title: 'Política de Garantías | Help Soluciones',
    description: 'Política de garantías de Help Soluciones Informáticas para equipos, repuestos y servicios técnicos en Colombia.',
    url: 'https://www.helpsoluciones.com.co/politica-garantias',
  },
};

export default function PoliticaGarantias() {
  return (
    <div className="flex flex-col bg-zinc-50">
      <main className="flex-1 py-12 md:py-20 px-4 md:px-10">
        <div className="layout-container">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-12 group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Volver al Inicio</span>
          </Link>

          {/* Header Section */}
          <div className="flex flex-col gap-6 mb-16 max-w-[800px]">
            <h1 className="text-zinc-900 font-display text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Políticas de <span className="text-primary">Garantía</span>
            </h1>
            <p className="text-zinc-600 text-lg md:text-xl font-medium leading-relaxed">
              En Help Soluciones, nos comprometemos con la excelencia técnica y la transparencia. Aquí detallamos los términos para la gestión de garantías y devoluciones.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Section 1: ¿Cuándo hacer válida la garantía? */}
            <div className="glass-card p-10 flex flex-col gap-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="text-2xl font-display font-bold text-zinc-900">¿Cuándo hacer válida la garantía?</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 text-primary"><CheckCircle2 size={18} /></div>
                  <div>
                    <strong className="block text-zinc-900">Calidad</strong>
                    <p className="text-zinc-600 text-sm">Producto en perfecto estado físico, sin manipulación externa, golpes, humedad o uso indebido.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 text-primary"><CheckCircle2 size={18} /></div>
                  <div>
                    <strong className="block text-zinc-900">Disposición</strong>
                    <p className="text-zinc-600 text-sm">El producto debe funcionar correctamente de acuerdo al objetivo definido por el fabricante.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 text-primary"><CheckCircle2 size={18} /></div>
                  <div>
                    <strong className="block text-zinc-900">Seguridad</strong>
                    <p className="text-zinc-600 text-sm">El producto no debe presentar riesgos para la salud o integridad de las personas.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 text-primary"><CheckCircle2 size={18} /></div>
                  <div>
                    <strong className="block text-zinc-900">Límite de tiempo</strong>
                    <p className="text-zinc-600 text-sm">No exceder el tiempo de garantía pactado originalmente con el asesor comercial.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: ¿Dónde gestionar? & Devoluciones */}
            <div className="flex flex-col gap-8">
              
              {/* Donde gestionar */}
              <div className="glass-card p-8 flex flex-col gap-4 border-l-4 border-primary">
                <div className="flex items-center gap-3 text-zinc-900">
                  <MapPin size={22} className="text-primary" />
                  <h3 className="font-bold text-lg">¿Dónde debes gestionar la garantía?</h3>
                </div>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Dependiendo la marca de tu producto debes validar si la garantía la necesitas tramitar directamente con nosotros o con el centro de servicios autorizado de la marca.
                </p>
              </div>

              {/* Devoluciones */}
              <div className="glass-card p-8 flex flex-col gap-4 border-l-4 border-zinc-900">
                <div className="flex items-center gap-3 text-zinc-900">
                  <RotateCcw size={22} />
                  <h3 className="font-bold text-lg uppercase tracking-wider text-xs">Devoluciones</h3>
                </div>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Reclamos de mercancía recibida deben hacerse dentro de un tiempo máximo de <strong>tres días hábiles</strong>. El producto debe ser retornado a nuestras instalaciones asumiendo los gastos de envío.
                </p>
              </div>

            </div>

            {/* Section 3: Requisitos */}
            <div className="glass-card p-10 lg:col-span-2 !bg-zinc-900 text-white flex flex-col md:flex-row gap-12 items-center">
              <div className="flex flex-col gap-6 flex-1">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/10">
                    <FileText size={28} />
                  </div>
                  <h2 className="text-2xl font-display font-bold">¿Qué debes presentar?</h2>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <li className="flex items-center gap-3 text-zinc-400 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Descripción detallada de la falla
                  </li>
                  <li className="flex items-center gap-3 text-zinc-400 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Empaques originales en buen estado
                  </li>
                  <li className="flex items-center gap-3 text-zinc-400 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Sellos de seguridad intactos
                  </li>
                  <li className="flex items-center gap-3 text-zinc-400 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Factura de compra original
                  </li>
                </ul>
              </div>
              <div className="h-full w-px bg-white/10 hidden md:block" />
              <div className="flex flex-col gap-4 text-center md:text-left">
                <div className="text-primary text-5xl font-black font-display">8 Días</div>
                <p className="text-zinc-400 text-xs uppercase tracking-[0.2em] font-bold">Tiempo estimado de respuesta</p>
              </div>
            </div>

          </div>

          {/* Footer of the Page */}
          <div className="mt-20 pt-10 border-t border-zinc-200 flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
            <div className="flex flex-col gap-2">
              <h4 className="text-zinc-900 font-bold">Soporte Técnico Especializado</h4>
              <p className="text-zinc-500 text-sm">Una vez aprobada, entregamos documento de seguimiento.</p>
            </div>
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2 text-zinc-600 text-sm font-medium">
                <Building size={16} className="text-primary" />
                <span>Calle 6C # 82 A - 91 TO 6 OFC 2</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 text-sm font-medium">
                <Mail size={16} className="text-primary" />
                <span>garantias@helpsoluciones.com.co</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
