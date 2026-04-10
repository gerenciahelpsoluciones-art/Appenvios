'use client'
import React, { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import Button from './ui/Button';
import Link from 'next/link';
import Image from 'next/image';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Track which mobile submenu is open by its parent name
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const toggleMobileSubmenu = (name: string) => {
    setOpenMobileSubmenu(openMobileSubmenu === name ? null : name);
  };

  const navLinks = [
    { name: 'Inicio', href: '/' },
    { name: 'Sobre Nosotros', href: '/sobre-nosotros' },
    { name: 'Productos', href: '/productos' },
    { name: 'Blog', href: '/blog' },
    {
      name: 'Infraestructura TI',
      href: '#',
      submenu: [
        { name: 'Ciberseguridad', href: '/ciberseguridad' },
        { name: 'Redes de comunicación y cableado estructurado', href: '/redes-y-cableado' },
        { name: 'Networking', href: '/networking' },
        { name: 'CCTV', href: '/cctv' },
        { name: 'Datacenter', href: '/datacenter' },
        { name: 'Servidores', href: '/servidores' },
      ]
    },
    {
      name: 'Servicios',
      href: '#',
      submenu: [
        { name: 'Ingeniería social', href: '/ingenieria-social' },
        { name: 'Ciberseguridad', href: '/ciberseguridad' },
        { name: 'Mantenimiento preventivo y correctivo', href: '/mantenimiento' },
      ]
    },
    { name: 'Contactanos', href: '/contactenos' },
    { name: 'PQRS', href: '/pqrs' },
  ];

  return (
    <header className={`sticky top-0 w-full border-b border-zinc-100 bg-white/95 backdrop-blur-xl ${isMenuOpen ? 'z-[9999]' : 'z-[500]'} pointer-events-auto`}>
      <div className="layout-container h-20 md:h-24 flex items-center justify-between gap-8">
        {/* Logo Section - Safe width to prevent overlap */}
        <div className="flex-shrink-0 min-w-[240px] md:min-w-[300px]">
          <Link href="/" className="block">
            <Image 
              src="/logo.svg" 
              alt="Help Soluciones" 
              width={300}
              height={44}
              className="h-9 md:h-11 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation - Refined Spacing */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-8 flex-1 justify-end">
          <nav className="flex items-center gap-3 xl:gap-6">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group">
                {link.submenu ? (
                  <div className="flex items-center h-full gap-1.5 cursor-pointer text-zinc-900 text-[13px] xl:text-sm font-bold hover:text-primary transition-all py-4 whitespace-nowrap">
                    {link.name}
                    <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
                    {/* Centered Submenu */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-[100]">
                      <div className="glass-card border-black/10 shadow-2xl p-2 bg-white rounded-xl overflow-hidden">
                        {link.submenu.map((subLink) => (
                          <Link
                            key={subLink.name}
                            href={subLink.href}
                            className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-primary/5 hover:text-primary transition-colors rounded-lg font-semibold whitespace-normal"
                          >
                            {subLink.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className="flex items-center h-full text-zinc-900 text-[13px] xl:text-sm font-bold hover:text-primary transition-all py-4 relative after:absolute after:bottom-2 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full whitespace-nowrap"
                  >
                    {link.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
          <div className="flex-shrink-0 ml-2">
            <Link href="/agendar-cita">
              <Button className="!h-10 !px-5 xl:!px-6 !text-[13px] xl:!text-sm bg-primary hover:bg-primary-hover text-white rounded-full shadow-md font-extrabold tracking-tight whitespace-nowrap">
                Agendar Cita
              </Button>
            </Link>
          </div>
        </div>

        <div className={`lg:hidden relative ${isMenuOpen ? 'z-[10000]' : 'z-[510]'} pointer-events-auto`}>
          <button 
            onClick={toggleMenu} 
            className="p-2 text-zinc-900 focus:outline-none relative"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-[9999] pt-[80px] flex flex-col h-screen w-screen animate-in slide-in-from-right duration-300">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 pb-24">
            {navLinks.map((link) => (
              <div key={link.name} className="border-b border-zinc-100 pb-4 last:border-0 text-left">
                {link.submenu ? (
                  <>
                    <button
                      onClick={() => toggleMobileSubmenu(link.name)}
                      className="flex items-center justify-between w-full text-zinc-900 text-xl font-extrabold py-2"
                      aria-label={`Ver opciones de ${link.name}`}
                      aria-expanded={openMobileSubmenu === link.name}
                    >
                      {link.name}
                      <ChevronDown size={24} className={`transition-transform duration-300 ${openMobileSubmenu === link.name ? 'rotate-180' : ''}`} />
                    </button>
                    {openMobileSubmenu === link.name && (
                      <div className="mt-3 ml-4 flex flex-col gap-5 border-l-2 border-primary pl-4">
                        {link.submenu.map((subLink) => (
                          <Link
                            key={subLink.name}
                            href={subLink.href}
                            className="text-zinc-600 text-lg font-bold py-1 hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {subLink.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={link.href}
                    className="block text-zinc-900 text-xl font-extrabold py-2 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                )}
              </div>
            ))}
            <div className="mt-10 py-6">
              <Link href="/agendar-cita">
                <Button fullWidth onClick={() => setIsMenuOpen(false)} className="rounded-xl h-16 bg-primary text-white font-bold text-xl shadow-2xl">
                  Agendar Cita Ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;