export interface Product {
  id: string;
  name: string;
  category: 'iphone' | 'mac' | 'repuesto';
  stock: number;
  price: number;
  purchasePrice: number;
  specs: string;
  imei?: string;
}

export interface Profile {
  id: string;
  name: string;
  role: 'admin' | 'tecnico' | 'vendedor' | 'preferencial';
  status: 'active' | 'inactive';
  username?: string;
  password?: string;
}

export interface Repair {
  id: string;
  consecutivoRecepcion?: string;
  imei: string;
  reference: string;
  color: string;
  capacity: string;
  repairType: string;
  clientName: string;
  clientType: 'regular' | 'preferencial';
  assignedTechId: string;
  status: 'recibido' | 'validado_fisico' | 'en_reparacion' | 'entregado' | 'no_reparado';
  physicalDetails?: string;
  photoUrl?: string;
  quotePrice?: number;
  quoteStatus?: 'pending' | 'approved' | 'declined';
  priceAdjustmentReason?: string;
  createdAt: string;
  partsCost?: number;
  paymentStatus?: 'pendiente' | 'pagado';
  commissionStatus?: 'pendiente' | 'pagado';
  commissionPaidAt?: string;
  commissionRate?: number;
}

export interface SaleRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  items: { name: string; qty: number; price: number }[];
  sellerId?: string;
  sellerName?: string;
  imei?: string;
  warrantyDays?: number;
}

export type UserRole = 'guest' | 'admin' | 'tecnico' | 'vendedor' | 'preferencial';
export type AdminTab = 'inicio' | 'inventario' | 'ingreso' | 'perfiles' | 'informes' | 'ventas' | 'comisiones';
export type PrefTab = 'equipos' | 'ingresar';

