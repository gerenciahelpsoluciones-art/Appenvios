import { Client } from './remission.types';

export type QuoteStatus = 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida';

export interface Quote {
  id: string;
  numero: string;
  fecha: string;
  cliente_id?: string;
  comprador_nombre?: string;
  comprador_telefono?: string;
  comprador_email?: string;
  total: number;
  estado: QuoteStatus;
  validez_oferta: number; // Días
  observaciones?: string;
  created_at: string;
  updated_at: string;
  // Joins
  cliente?: Client;
  detalles?: QuoteDetail[];
}

export interface QuoteDetail {
  id?: string;
  cotizacion_id?: string;
  producto_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at?: string;
}
