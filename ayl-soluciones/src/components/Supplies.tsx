import { ShoppingBag, Star, Package, Check, ShieldCheck } from 'lucide-react';

const products = [
  {
    name: 'Kits Corporativos Premium',
    category: 'Merchandising',
    price: 'Desde $45k',
    image: 'https://images.unsplash.com/photo-1712903276151-25b35dd61a92?q=80&w=2070',
    tags: ['Personalizable', 'Eco-friendly']
  },
  {
    name: 'Sistemas Audiovisuales 4K',
    category: 'Tecnología',
    price: 'Cotización Especial',
    image: 'https://images.unsplash.com/photo-1582192730841-2a682d7375f9?q=80&w=2070',
    tags: ['Alquiler', 'Soporte Técnico']
  },
  {
    name: 'Mobiliario para Ferias',
    category: 'Logística',
    price: 'Desde $120k/día',
    image: 'https://images.unsplash.com/photo-1766802981817-776406db6807?q=80&w=2070',
    tags: ['Diseño', 'Montaje']
  },
  {
    name: 'Material Publicitario BTL',
    category: 'Publicidad',
    price: 'Según Volumen',
    image: 'https://images.unsplash.com/photo-1712903276879-9de15f1b9e81?q=80&w=2070',
    tags: ['Alta Calidad', 'Entrega Rápida']
  }
];

const Supplies = () => {
  return (
    <section id="productos" className="py-32 bg-emerald-deep relative overflow-hidden mesh-green">
      {/* Visual Dynamic Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-emerald-light/5 blur-[120px] rounded-full" />
      
      <div className="layout-container relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
          <div className="max-w-3xl">
            <h2 className="text-xs font-bold tracking-[0.4em] text-accent uppercase mb-6">
              Suministros & Productos
            </h2>
            <h3 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight">
              Todo lo que su evento <span className="text-accent italic">necesita</span>
            </h3>
          </div>
          <a href="#contacto" className="px-8 py-4 glass border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all">
            Ver Catálogo Completo
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.name} className="group relative rounded-3xl overflow-hidden glass-dark border-white/5 hover:border-accent/30 transition-all duration-500">
              <div className="h-64 overflow-hidden relative">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-accent/90 text-emerald-deep text-[10px] font-bold uppercase tracking-wider">
                  {product.category}
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-bold text-white group-hover:text-accent transition-colors underline-offset-4 group-hover:underline">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-1 text-accent">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-bold text-white/50">4.9</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {product.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-white/40 border border-white/10 px-2 py-0.5 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-accent font-bold">{product.price}</span>
                  <button className="p-3 rounded-xl bg-white/5 hover:bg-accent hover:text-emerald-deep text-white transition-all shadow-xl">
                    <ShoppingBag size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Brand Trust */}
        <div className="mt-20 p-8 rounded-3xl glass-dark border-white/5 flex flex-wrap items-center justify-center gap-12 opacity-50 bg-white/[0.02]">
           <div className="flex items-center gap-2 text-white/70">
             <ShieldCheck size={20} className="text-accent" />
             <span className="text-sm font-medium">Garantía de Calidad</span>
           </div>
           <div className="flex items-center gap-2 text-white/70">
             <Package size={20} className="text-accent" />
             <span className="text-sm font-medium">Logística Nacional</span>
           </div>
           <div className="flex items-center gap-2 text-white/70">
             <Check size={20} className="text-accent" />
             <span className="text-sm font-medium">Gestión Simplificada</span>
           </div>
        </div>
      </div>
    </section>
  );
};

export default Supplies;
