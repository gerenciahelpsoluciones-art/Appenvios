'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ArrowRight, Calendar, User, Mail } from 'lucide-react';
import { blogPosts } from '@/data/blog';

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const featuredPost = blogPosts.find(post => post.featured) || blogPosts[0];
  const regularPosts = blogPosts.filter(post => post.id !== featuredPost.id && 
    (searchQuery === '' || 
     post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     post.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      
      {/* Search Header Banner */}
      <div className="bg-[#0f172a] pt-36 pb-20 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#38bdf8]/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Blog <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#38bdf8]">Tecnológico</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
            Insights, novedades e informes técnicos para líderes empresariales. Manténgase a la vanguardia.
          </p>
          
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 rounded-full py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white/15 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md"
              placeholder="Buscar temas, como 'Ciberseguridad', 'Nube'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Featured Hero Article */}
      {searchQuery === '' && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-display text-slate-900 border-l-4 border-primary pl-4">Artículo Destacado</h2>
            </div>
            
            <Link href={`/blog/${featuredPost.slug}`} className="group relative block overflow-hidden rounded-3xl grid grid-cols-1 lg:grid-cols-2 bg-slate-50 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
              <div className="relative aspect-video lg:aspect-auto h-full overflow-hidden">
                <Image
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {featuredPost.category}
                  </span>
                  <span className="text-slate-400 flex items-center text-sm font-medium">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    {featuredPost.date}
                  </span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-display font-bold text-[#0f172a] mb-6 leading-tight group-hover:text-primary transition-colors line-clamp-3">
                  {featuredPost.title}
                </h3>
                <p className="text-slate-600 text-lg mb-8 line-clamp-3 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <Image 
                        src={featuredPost.author.avatar} 
                        alt={featuredPost.author.name} 
                        fill 
                        className="rounded-full object-cover shadow-sm bg-slate-200" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-bold text-sm tracking-tight">{featuredPost.author.name}</span>
                      <span className="text-slate-500 text-xs font-medium uppercase">{featuredPost.author.role}</span>
                    </div>
                  </div>
                  <span className="flex items-center text-primary font-bold text-sm group-hover:translate-x-1 transition-transform">
                    Leer más <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold font-display text-slate-900">
              {searchQuery ? 'Resultados de búsqueda' : 'Últimas Noticias'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative h-full">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-[#0f172a] shadow-sm tracking-widest">
                    {post.category}
                  </div>
                </div>
                
                <div className="p-6 md:p-8 flex flex-col flex-grow">
                  <div className="flex items-center text-slate-400 text-xs font-semibold mb-4 tracking-wide">
                    <span>{post.date}</span>
                    <span className="mx-2 opacity-30">•</span>
                    <span>{post.readTime}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold font-display text-slate-900 mb-4 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h3>
                  
                  <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed flex-grow">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-3 pt-6 mt-auto border-t border-slate-50">
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <Image 
                        src={post.author.avatar} 
                        alt={post.author.name} 
                        fill 
                        className="rounded-full border-2 border-white shadow-sm" 
                      />
                    </div>
                    <span className="text-slate-700 text-sm font-bold">{post.author.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {regularPosts.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No se encontraron artículos</h3>
              <p className="text-slate-500">Prueba ajustando tu búsqueda o intenta con otra categoría.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section approved by user */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0f172a] transform -skew-y-2 scale-110 z-0 origin-bottom-left"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 text-white mb-8 shadow-[0_0_30px_theme('colors.primary.DEFAULT')]">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
              Suscríbete a nuestro <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#38bdf8]">Boletín B2B</span>
            </h2>
            <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
              Recibe las últimas noticias tecnológicas, casos de éxito y tendencias en infraestructura corporativa directamente en tu email mensual. No te enviaremos spam.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                required
                placeholder="Tu correo corporativo" 
                className="flex-grow bg-white/10 border border-white/20 text-white placeholder:text-slate-400 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white/15 transition-all w-full backdrop-blur-sm"
              />
              <button 
                type="submit" 
                className="bg-primary hover:bg-[#38bdf8] text-white font-bold px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_theme('colors.primary.DEFAULT')] hover:shadow-[0_0_30px_theme('colors.sky.400')] hover:-translate-y-1 transform whitespace-nowrap"
              >
                Suscribirme
              </button>
            </form>
            <p className="text-slate-500 text-xs mt-6 font-medium tracking-wide">
              Al suscribirte aceptas nuestra <Link href="/politica-privacidad" className="underline hover:text-white transition-colors">Política de Privacidad</Link>.
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
