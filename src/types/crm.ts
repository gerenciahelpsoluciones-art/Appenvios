export interface AppUser {
  id: string;
  nombre: string;
  usuario: string;
  cargo: string;
  email: string;
  telefono: string;
  rol: 'Admin' | 'Comercial' | 'Logistica' | 'Tecnico';
  permisos: string[]; // List of module IDs
  password?: string;
  color?: string;
}

export interface Comprador {
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  correo: string;
}

export interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  ciudad?: string;
  compradores?: Comprador[];
  sedes?: Sede[];
  coordenadas?: string;
  usuarioId?: string;
  tesoreriaNombre?: string;
  tesoreriaTelefono?: string;
  tesoreriaEmail?: string;
  contabilidadNombre?: string;
  contabilidadTelefono?: string;
  contabilidadEmail?: string;
  poseeCredito: boolean;
  cupoCredito?: number;
}

export interface Proveedor {
  id: string;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  coordenadas: string;
}

export interface Producto {
  id: string;
  nombre: string;
  numPart: string;
  descripcion: string;
  unidad: string;
  precioCompra: number;
  moneda: 'COP' | 'USD';
  trmReferencia?: number;
  tipo: 'Producto' | 'Servicio';
  exentoIva?: boolean;
  history: { date: string; price: number }[];
}

export interface OrdenCompraItem {
  id: string;
  productoId: string;
  nombreProducto: string;
  numPart: string;
  cantidad: number;
  precioUnitario: number;
  exentoIva?: boolean;
}

export interface OrdenCompra {
  id: string;
  consecutivo: string;
  fecha: string;
  proveedorId: string;
  nombreProveedor: string;
  items: OrdenCompraItem[];
  subtotal: number;
  iva: number;
  total: number;
  moneda: 'COP' | 'USD';
  trm?: number;
  condicionesComerciales: string;
  observaciones: string;
  estado: 'Pendiente' | 'Recogido' | 'En Bodega';
  conductorId?: string;
  conductorNombre?: string;
  fotoEntrega?: string;
  fotoRemision?: string;
  georeferencia?: string;
  usuarioId: string;
  tipo: 'Recogida' | 'Inventario' | 'Oficina' | 'Licenciamiento (virtual)';
  verificada: boolean;
}

export interface Alquiler {
  id: string;
  descripcion: string;
  serial: string;
  fotoUrl?: string;
  estado: 'Bodega' | 'Alquilado';
  clienteId?: string;
  clienteNombre?: string;
  fechaInicio?: string;
  valorMensual: number;
  usuarioId: string;
  discoDuro?: string;
  memoriaRam?: string;
  procesador?: string;
  generacion?: string;
}

export interface CotizacionItem {
  id: string;
  productoId: string;
  proveedorId: string;
  unidad: string;
  cantidad: number;
  costoUnitario: number;
  precioVenta: number;
  utilidad: number;
  iva: number;
  moneda?: 'COP' | 'USD';
}

export interface Cotizacion {
  id: string;
  fecha: string;
  clienteId: string;
  clienteNombre: string;
  consecutivo: string;
  compradorNombre?: string;
  compradorTelefono?: string;
  compradorEmail?: string;
  items: CotizacionItem[];
  subtotal: number;
  iva: number;
  total: number;
  utilidadTotal: number;
  ejecutivo: string;
  ejecutivoEmail: string;
  ejecutivoTelefono?: string;
  usuarioId: string;
  estado: 'Seguimiento' | 'Ganado' | 'Perdido';
  requiereAutorizacion?: boolean;
  autorizada?: boolean;
  autorizadoPor?: string;
  fechaAutorizacion?: string;
  observaciones?: string;
  condiciones?: string;
  ordenCompraCliente?: string;
  ordenCompraUrl?: string;
  trm?: number;
  validez_oferta?: string;
}

export interface Conductor {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  placaVehiculo: string;
  modeloVehiculo: string;
  tipoVehiculo: string;
  tarjetaPropiedad?: string;
  soat?: string;
  tecnomecanica?: string;
}

export interface DespachoItem {
  productoId: string;
  nombreProducto: string;
  numPart: string;
  cantidad: number;
}

export interface Despacho {
  id: string;
  cotizacionId: string;
  consecutivoCotizacion: string;
  fechaSolicitud: string;
  clienteId: string;
  clienteNombre: string;
  direccion: string;
  items: DespachoItem[];
  total: number;
  ejecutivoEmail: string;
  ejecutivoTelefono?: string;
  usuarioId: string;
  estado: 'Pendiente' | 'Preparando' | 'Despachado' | 'Entregado' | 'Entrega Parcial';
  conductorId?: string;
  conductorNombre?: string;
  fotoEntrega?: string;
  fotoRemision?: string;
  georeferencia?: string;
  facturado?: boolean;
  fechaFacturado?: string;
  fechaDespacho?: string;
}

export interface Reparacion {
  id: string;
  consecutivo: string;
  clienteId: string;
  clienteNombre: string;
  marca: string;
  tipo: string;
  serial: string;
  observaciones: string;
  estado: 'Recibido' | 'En Diagnóstico' | 'En Reparación' | 'Esperando Repuestos' | 'Reparado' | 'Entregado' | 'Cerrado';
  tipoServicio: 'HELP SOLUCIONES' | 'Proveedor';
  proveedorId?: string;
  proveedorNombre?: string;
  conductorId?: string;
  conductorNombre?: string;
  foto?: string;
  fechaIngreso: string;
}

export interface DevolucionItem {
  id: string;
  productoId: string;
  nombreProducto: string;
  numPart: string;
  serial: string;
  cantidad: number;
}

export interface Devolucion {
  id: string;
  consecutivo: string;
  fecha: string;
  proveedorId: string;
  nombreProveedor: string;
  items: DevolucionItem[];
  observaciones: string;
  estado: 'Pendiente' | 'Enviado' | 'Completado' | 'Anulado';
  usuarioId: string;
  conductorId?: string;
  conductorNombre?: string;
}

export interface SalesBudget {
  id: string;
  usuarioId: string;
  nombreVendedor: string;
  anio: number;
  mes: number;
  monto: number;
}

export interface VentaManual {
  id: string;
  fecha: string;
  clienteId: string;
  clienteNombre: string;
  productoId?: string;
  productoNombre?: string;
  usuarioId: string;
  usuarioNombre: string;
  monto: number;
  moneda?: 'COP' | 'USD';
  tipoVenta?: 'Venta' | 'Contrato' | 'Alquiler' | 'Licencia' | 'Licitacion';
  descripcion: string;
}

export interface SiigoInvoice {
  id: number;
  document: { id: number; name: string };
  number: number;
  date: string;
  customer: { id: string; name: string[] };
  seller: number;
  total: number;
  cost: number;
  items: any[];
}

export interface SiigoSeller {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}
