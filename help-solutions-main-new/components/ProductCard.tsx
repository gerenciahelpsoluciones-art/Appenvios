import React from 'react';
import Image from 'next/image';
import { Product } from '@/data/products';
import { ChevronRight, Shield, Server, Wifi, Video, Box, Tag, Laptop, Mouse, Gamepad2, Network, Printer, Smartphone, Camera, Monitor, Zap, Settings, Cloud, Sun } from 'lucide-react';
import Button from './ui/Button';

interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Ciberseguridad': return <Shield size={16} />;
        case 'Redes': return <Wifi size={16} />;
        case 'Servidores': return <Server size={16} />;
        case 'CCTV': return <Video size={16} />;
        case 'Infraestructura': return <Box size={16} />;
        case 'Computo': return <Laptop size={16} />;
        case 'Accesorios': return <Mouse size={16} />;
        case 'Gaming': return <Gamepad2 size={16} />;
        case 'Networking': return <Network size={16} />;
        case 'Impresión y Suministros': return <Printer size={16} />;
        case 'Movilidad': return <Smartphone size={16} />;
        case 'Cámaras y Video': return <Camera size={16} />;
        case 'Monitores': return <Monitor size={16} />;
        case 'Potencia': return <Zap size={16} />;
        case 'Servicios': return <Settings size={16} />;
        case 'Licenciamiento y Cloud': return <Cloud size={16} />;
        case 'Energías Renovables': return <Sun size={16} />;
        default: return <Tag size={16} />;
    }
};

const formatPrice = (price: number | null) => {
    if (price === null) return 'Solicitar Cotización';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
    return (
        <div
            onClick={() => onClick(product)}
            className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-primary shadow-sm flex items-center gap-1.5">
                    {getCategoryIcon(product.category)}
                    {product.category}
                </div>

                {product.promoPrice && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        OFERTA
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                {product.subcategory && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60 mb-1 block">
                        {product.subcategory}
                    </span>
                )}
                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                </h3>

                <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">
                    {product.description}
                </p>

                {/* Pricing */}
                <div className="mb-4">
                    {product.price === null ? (
                        <div className="text-lg font-bold text-primary">
                            Solicitar Cotización
                        </div>
                    ) : product.promoPrice ? (
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-sm line-through decoration-slate-400">
                                {formatPrice(product.price)}
                            </span>
                            <span className="text-xl font-bold text-slate-900">
                                {formatPrice(product.promoPrice)}
                            </span>
                        </div>
                    ) : (
                        <div className="text-xl font-bold text-slate-900">
                            {formatPrice(product.price)}
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex gap-2">
                        {product.features.slice(0, 2).map((feature, idx) => (
                            <span key={idx} className="bg-slate-50 text-slate-500 text-[10px] px-2 py-1 rounded-md truncate max-w-[80px]">
                                {feature}
                            </span>
                        ))}
                    </div>

                    <button
                        onClick={() => onClick(product)}
                        className="text-primary font-medium text-sm flex items-center gap-1 group/btn hover:underline"
                        aria-label={`Ver detalles técnicos de ${product.name}`}
                    >
                        Ver más <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
