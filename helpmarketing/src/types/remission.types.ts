export type RemissionStatus = 'borrador' | 'enviada' | 'entregada' | 'anulada';

export interface Client {
  id: string;
  nombre: string;
  identificacion: string;
  email: string;
  telefono: string;
  direccion?: string;
  ciudad?: string;
}

export interface Product {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock?: number;
}

export interface Remission {
  id: string;
  numero: string;
  fecha: string;
  cliente_id: string;
  total: number;
  estado: RemissionStatus;
  observaciones: string;
  created_at: string;
  updated_at: string;
  // Joins
  cliente?: Client;
  detalles?: RemissionDetail[];
}

export interface RemissionDetail {
  id?: string;
  remision_id?: string;
  producto_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at?: string;
}
