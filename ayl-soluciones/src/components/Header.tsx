"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, Phone } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Inicio', href: '#inicio' },
    { name: 'Nosotros', href: '#nosotros' },
    {
      name: 'Servicios',
      href: '#servicios',
      submenu: [
        { name: 'Eventos y Convenciones', href: '#servicios' },
        { name: 'Marketing Experiencial', href: '#servicios' },
        { name: 'Catering', href: '#servicios' },
        { name: 'Suministros', href: '#productos' },
        { name: 'Venta de Tecnología', href: '#servicios' },
      ]
    },
    { name: 'Productos', href: '#productos' },
    { name: 'Experiencia', href: '#proyectos' },
    { name: 'Contacto', href: '#contacto' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'py-3 bg-emerald-deep/80 backdrop-blur-xl border-b border-white/10' 
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="layout-container flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
             <span className="text-3xl font-bold tracking-tighter text-white group-hover:text-accent transition-colors">
              A&L
            </span>
            <span className="block text-[10px] tracking-[0.2em] font-medium text-accent uppercase -mt-1">
              Soluciones
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <div key={link.name} className="relative group/item">
              <Link 
                href={link.href}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors flex items-center gap-1"
              >
                {link.name}
                {link.submenu && <ChevronDown size={14} className="group-hover/item:rotate-180 transition-transform" />}
              </Link>
              
              {link.submenu && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 p-3 rounded-2xl glass-dark opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-500 transform translate-y-4 group-hover/item:translate-y-0 border-accent/20">
                  <div className="flex flex-col gap-1 items-center text-center">
                    {link.submenu.map((sub) => (
                      <Link 
                        key={sub.name}
                        href={sub.href}
                        className="w-full px-4 py-3 text-sm text-white/70 hover:text-accent hover:bg-white/5 rounded-xl transition-all duration-300 font-medium tracking-wide"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <Link 
            href="#contacto"
            className="ml-4 px-6 py-2 bg-accent text-emerald-deep font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <Phone size={16} />
            Agendar Cita
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`lg:hidden fixed inset-0 top-[72px] bg-emerald-deep/95 backdrop-blur-2xl transition-all duration-500 ${
          isMenuOpen ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible translate-x-full'
        }`}
      >
        <div className="flex flex-col p-6 gap-6">
          {navLinks.map((link) => (
            <div key={link.name} className="flex flex-col gap-2">
              <Link 
                href={link.href}
                className="text-2xl font-bold text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
              {link.submenu && (
                <div className="flex flex-col pl-4 border-l border-accent/30 gap-3 mt-2">
                  {link.submenu.map((sub) => (
                    <Link 
                      key={sub.name}
                      href={sub.href}
                      className="text-white/60 text-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
