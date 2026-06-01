import React from 'react';
import { Mail, Phone, Linkedin, Facebook, Instagram } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-black/5 bg-zinc-50 py-12 px-4 md:px-10 w-full flex justify-center text-zinc-900">
      <div className="flex flex-col items-center justify-center gap-8 max-w-[1200px] w-full">

        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between w-full gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-[300px]">
            <div className="flex items-center gap-3 text-zinc-900">
              <Link href="/">
                <Image src="/logo.svg" alt="Logo" width={200} height={100} className="cursor-pointer" />
              </Link>
            </div>
            <p className="text-zinc-600 text-sm">
              Su socio tecnológico de confianza para infraestructura, redes y mantenimiento empresarial.
            </p>
          </div>

          {/* Links Container */}
          <div className="flex gap-10 flex-wrap">

            {/* Links Column 1 */}
            <div className="flex flex-col gap-3">
              <h4 className="text-zinc-900 font-bold text-sm uppercase tracking-wider">Enlaces</h4>
              <Link className="text-zinc-600 text-sm hover:text-primary transition-colors" href="/">Inicio</Link>
              <Link className="text-zinc-600 text-sm hover:text-primary transition-colors" href="/contactenos">Contáctenos</Link>
              <Link className="text-zinc-600 text-sm hover:text-primary transition-colors" href="/pqrs">PQRS</Link>
            </div>

            {/* Links Column 2 */}
            <div className="flex flex-col gap-3">
              <h4 className="text-zinc-900 font-bold text-sm uppercase tracking-wider">Legal</h4>
              <Link className="text-zinc-600 text-sm hover:text-primary transition-colors" href="/politica-privacidad">Privacidad</Link>
              <Link className="text-zinc-600 text-sm hover:text-primary transition-colors" href="/terminos-condiciones">Términos</Link>
              <Link className="text-zinc-600 text-sm hover:text-primary transition-colors" href="/politica-garantias">Política de Garantías</Link>
            </div>

            {/* Links Column 3 (Contact) */}
            <div className="flex flex-col gap-3">
              <h4 className="text-zinc-900 font-bold text-sm uppercase tracking-wider">Contacto</h4>
              <div className="flex items-center gap-2 text-zinc-600 text-sm">
                <Mail size={16} />
                <span>gerencia@helpsoluciones.com.co</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 text-sm">
                <Phone size={16} />
                <span>+57 304 3358650</span>
              </div>
            </div>

          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-black/5"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-zinc-500 text-xs text-center md:text-left">
                    © {new Date().getFullYear()} Help Soluciones. Todos los derechos reservados.
                </p>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        Optimizado por <span className="text-primary">HelpMarketer IA</span>
                    </span>
                </div>
            </div>
          <div className="flex gap-4">
            <a className="text-zinc-600 hover:text-primary transition-colors" target="_blank" href="https://www.facebook.com/HelpSolucionesS.A.S" aria-label="Twitter">
              <Facebook size={20} />
            </a>
            <a className="text-zinc-600 hover:text-primary transition-colors" target="_blank" href="https://www.linkedin.com/company/helpsoluciones/about/" aria-label="LinkedIn">
              <Linkedin size={20} />
            </a>
            <a className="text-zinc-600 hover:text-primary transition-colors" target="_blank" href="https://www.instagram.com/helpsolucionesinformaticas?igsh=eHB6cW9lOGFyM2pw" aria-label="Twitter">
              <Instagram size={20} />
            </a>

          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;