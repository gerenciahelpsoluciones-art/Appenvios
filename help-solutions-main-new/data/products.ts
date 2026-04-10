export type Category = 
    | 'Ciberseguridad' 
    | 'Redes' 
    | 'Infraestructura' 
    | 'Servidores' 
    | 'CCTV' 
    | 'Computo' 
    | 'Accesorios' 
    | 'Gaming' 
    | 'Networking' 
    | 'Impresión y Suministros' 
    | 'Movilidad' 
    | 'Cámaras y Video' 
    | 'Monitores' 
    | 'Potencia' 
    | 'Servicios' 
    | 'Licenciamiento y Cloud' 
    | 'Energías Renovables';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number | null;
    promoPrice?: number;
    category: Category;
    image: string;
    features: string[];
    subcategory?: string;
    specifications?: Record<string, string>;
}

export const categories: Category[] = [
    'Ciberseguridad', 
    'Redes', 
    'Infraestructura', 
    'Servidores', 
    'CCTV', 
    'Computo',
    'Accesorios',
    'Gaming',
    'Networking',
    'Impresión y Suministros',
    'Movilidad',
    'Cámaras y Video',
    'Monitores',
    'Potencia',
    'Servicios',
    'Licenciamiento y Cloud',
    'Energías Renovables'
];

export const products: Product[] = [];
