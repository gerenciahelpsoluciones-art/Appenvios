'use client'

import React, { useState, useMemo } from 'react';

import ProductCard from '../../components/ProductCard';
import { products as localProducts, categories, Category, Product } from '../../data/products';
import externalProductsRaw from '../../data/external_products.json';
import { Search, Filter, X, Check, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Image from 'next/image';

const externalProducts = (externalProductsRaw as any[]).map(p => ({
    ...p,
    features: p.features || ['Consulte disponibilidad'],
    category: p.category || 'Computo'
})) as Product[];

const allProducts = [...localProducts, ...externalProducts];

const ProductsPage = () => {
    const [selectedCategory, setSelectedCategory] = useState<Category | 'Todos'>('Todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Helper to normalize text (remove accents and lower case)
    const normalizeText = (text: string) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    // Filter products based on category and search query
    const filteredProducts = useMemo(() => {
        return allProducts.filter(product => {
            const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
            const normalizedSearch = normalizeText(searchQuery);

            // Check basic fields
            const matchesBasic = normalizeText(product.name).includes(normalizedSearch) ||
                normalizeText(product.description).includes(normalizedSearch) ||
                normalizeText(product.category).includes(normalizedSearch);

            // Check features array
            const matchesFeatures = product.features.some(feature =>
                normalizeText(feature).includes(normalizedSearch)
            );

            // Check specifications object (values and keys)
            const matchesSpecs = product.specifications ? Object.entries(product.specifications).some(([key, value]) =>
                normalizeText(key).includes(normalizedSearch) || normalizeText(value).includes(normalizedSearch)
            ) : false;

            const matchesSearch = matchesBasic || matchesFeatures || matchesSpecs;
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    // Handler to open product details
    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
    };

    // Handler to close modal
    const closeModal = () => {
        setSelectedProduct(null);
    };

    return (
        <main className="min-h-screen bg-slate-50">


            {/* Hero Section */}
            <section className="bg-slate-900 py-16 md:py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

                <div className="layout-container relative z-10 text-center px-4">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Catálogo de Soluciones Tecnológicas
                    </h1>
                    <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
                        Explore nuestra gama de productos y servicios de vanguardia diseñados para potenciar su infraestructura empresarial.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar productos, servicios o características..."
                            className="block w-full pl-11 pr-4 py-4 rounded-xl border-0 bg-white/10 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:bg-white/20 sm:text-sm backdrop-blur-md transition-all shadow-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="layout-container py-12 px-4 md:px-8">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar Filters (Desktop) */}
                    <aside className="hidden md:block w-64 flex-shrink-0 space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold text-lg">
                                <Filter size={20} />
                                <span>Categorías</span>
                            </div>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setSelectedCategory('Todos')}
                                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm font-medium ${selectedCategory === 'Todos' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-white hover:text-primary'}`}
                                >
                                    Todas las soluciones
                                </button>
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm font-medium ${selectedCategory === category ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-white hover:text-primary'}`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Mobile Filters (Horizontal Scroll) */}
                    <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4 flex gap-2 scrollbar-hide">
                        <button
                            onClick={() => setSelectedCategory('Todos')}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-colors ${selectedCategory === 'Todos' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-gray-200'}`}
                        >
                            Todos
                        </button>
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-colors ${selectedCategory === category ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-gray-200'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    <div className="flex-grow">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                {selectedCategory === 'Todos' ? 'Todas las soluciones' : selectedCategory}
                                <span className="ml-3 text-sm font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                    {filteredProducts.length} resultados
                                </span>
                            </h2>
                        </div>

                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProducts.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onClick={handleProductClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                <Search className="h-12 w-12 text-slate-200 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">No se encontraron productos</h3>
                                <p className="text-slate-500 text-sm mt-1">Prueba con otra búsqueda o categoría.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setSelectedCategory('Todos'); }}
                                    className="mt-6 text-primary font-medium hover:underline"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* Product Details Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={closeModal}
                    ></div>

                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
                        >
                            <X size={20} />
                        </button>

                        {/* Modal Image */}
                        <div className="md:w-1/2 relative min-h-[300px] bg-gray-100">
                            <Image
                                src={selectedProduct.image}
                                alt={selectedProduct.name}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Modal Content */}
                        <div className="md:w-1/2 p-6 md:p-8 md:overflow-y-auto">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
                                {selectedProduct.category}
                            </div>

                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                                {selectedProduct.name}
                            </h2>

                            <p className="text-slate-600 mb-6 leading-relaxed">
                                {selectedProduct.description}
                            </p>

                            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-600 font-medium">Información de Precio</span>
                                    {selectedProduct.price && selectedProduct.promoPrice && (
                                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase tracking-wider">
                                            Ahorras {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(selectedProduct.price - selectedProduct.promoPrice)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-3">
                                    {selectedProduct.price === null ? (
                                        <span className="text-2xl font-bold text-primary">
                                            Precio a convenir
                                        </span>
                                    ) : selectedProduct.promoPrice ? (
                                        <>
                                            <span className="text-3xl font-bold text-slate-900">
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(selectedProduct.promoPrice)}
                                            </span>
                                            <span className="text-lg text-slate-400 line-through font-medium">
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(selectedProduct.price)}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-3xl font-bold text-slate-900">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(selectedProduct.price)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    {selectedProduct.price ? '* Precios incluyen IVA. Sujetos a cambios.' : '* Contacte para obtener una cotización personalizada.'}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Características Clave</h3>
                                    <ul className="space-y-2">
                                        {selectedProduct.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <div className="mt-1 min-w-4 min-h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                                    <Check size={10} strokeWidth={3} />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {selectedProduct.specifications && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Especificaciones Técnicas</h3>
                                        <div className="bg-slate-50 rounded-xl p-4 grid gap-3">
                                            {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                                                <div key={key} className="flex justify-between border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                                                    <span className="text-sm text-slate-500 font-medium">{key}</span>
                                                    <span className="text-sm text-slate-900 font-semibold">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
                                <Button
                                    variant="primary"
                                    className="flex-1 justify-center py-3"
                                    onClick={() => {
                                        if (selectedProduct) {
                                            const phoneNumber = "573113522760";
                                            const message = `Hola, estoy interesado en el producto ${selectedProduct.name}. Me gustaría recibir una cotización.`;
                                            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                                            window.open(whatsappUrl, '_blank');
                                        }
                                    }}
                                >
                                    Solicitar Cotización
                                </Button>
                                <Button variant="outline" className="flex-1 justify-center py-3" onClick={closeModal}>
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ProductsPage;
