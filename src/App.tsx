import { useState, useEffect } from 'react'
import RecoveryAssistant from './components/RecoveryAssistant'
import './index.css'
import ClientesModule from './modules/Clientes'
import CotizacionesModule from './modules/Cotizaciones'
import ProveedoresModule from './modules/Proveedores'
import ProductosModule from './modules/Productos'
import InformesModule from './modules/Informes'
import OrdenesCompraModule from './modules/OrdenesCompra'
import LogisticaModule from './modules/Logistica'
import ConductoresModule from './modules/Conductores'
import ReparacionesModule from './modules/Reparaciones'
import AdminModule from './modules/Admin'
import Login from './modules/Login'
import VendedoresModule from './modules/Vendedores'
import AlquileresModule from './modules/Alquileres'
import FacturacionModule from './modules/Facturacion'
import VentasManualesModule from './modules/VentasManuales'
import LeadsWebModule, { type ClienteWeb } from './modules/LeadsWeb'
import RegistrosWeb, { type RegistroPendiente } from './modules/RegistrosWeb'
import AgenteInformesModule from './modules/AgenteInformes'
import RemisionesModule from './modules/Remisiones'
import ComisionesModule from './modules/Comisiones'
import CarteraModule from './modules/Cartera'
import PropuestasModule from './modules/Propuestas'
import { supabase } from './lib/supabaseClient'
import RegistrationForm from './modules/RegistrationForm';
import { logoBase64 } from './assets/logoBase64'
import AIAssistant from './components/AIAssistant'
import {
  LayoutDashboard, Sparkles, ClipboardList, FileText, FilePenLine, Users, Package, UserCheck,
  ShoppingCart, Factory, Truck, IdCard, FileStack, Wrench, Laptop, Receipt, Banknote, Wallet,
  Percent, ChartColumn, Bot, Settings, LogOut, CircleQuestionMark, Menu, X, ArrowRight, type LucideIcon,
} from 'lucide-react'

type MenuItem = { id: string; label: string; icon: LucideIcon; section: string; subtitle: string }
const MENU_SECTIONS = ['General', 'Comercial', 'Operaciones', 'Finanzas', 'Informes', 'Administración']
import {
  DEMO_USER, DEMO_USERS, DEMO_CLIENTES, DEMO_PROVEEDORES, DEMO_PRODUCTOS,
  DEMO_COTIZACIONES, DEMO_CONDUCTORES, DEMO_DESPACHOS, DEMO_VENTAS, DEMO_BUDGETS
} from './data/crmDemoData'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

// Types for shared data
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
  regimen?: 'Régimen Común' | 'Régimen Simplificado';
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
  regimen?: 'Régimen Común' | 'Régimen Simplificado';
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
  metadata?: {
    reminders?: {
      id: string;
      date: string;
      note: string;
      completed: boolean;
    }[];
  };
}

export interface Conductor {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  placaVehiculo: string;
  modeloVehiculo: string;
  tipoVehiculo: string;
  tarjetaPropiedad?: string; // Filename or Base64
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
  fechaFacturado?: string;  // Fecha en que se marcó como facturado en el módulo de Facturación
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
  mes: number; // 0-11
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
  costo?: number;
}

export interface PropuestaItem {
  id: string;
  descripcion: string;
  productoId?: string;
  numPart?: string;
  cantidad: number;
  valorUnitario: number;
}

export interface PersonalItem {
  id: string;
  nombre: string;
  cargo: string;
}

export interface VisitaItem {
  id: string;
  sede: string;
  horario: string;
}

export interface Propuesta {
  id: string;
  consecutivo: string;
  fecha: string;
  clienteId: string;
  clienteNombre: string;
  clienteNit?: string;
  clienteCiudad?: string;
  clienteContacto?: string;
  tipoServicioId: string;
  tipoServicioNombre: string;
  moneda: 'COP' | 'USD';
  valor: number;          // total calculado (sum of items)
  items: PropuestaItem[];
  incluyeIva: boolean;
  vigencia: string;
  observaciones: string;
  objetivo: string;
  personal: PersonalItem[];
  visitas: VisitaItem[];
  obligacionesCliente: string[];
  estado: 'Borrador' | 'Enviada' | 'Aceptada';
  comercialNombre: string;
  comercialTelefono: string;
  usuarioId: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // Shared state from Supabase
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([]);
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [ventasManuales, setVentasManuales] = useState<VentaManual[]>([]);
  const [budgets, setBudgets] = useState<SalesBudget[]>([]);
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [clientesWeb, setClientesWeb] = useState<ClienteWeb[]>([]);
  const [registros, setRegistros] = useState<RegistroPendiente[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('Desconectado');
  const [currentTrm, setCurrentTrm] = useState<number>(0);

  // Session state
  const [isLoggedIn, setIsLoggedIn] = useState(() => IS_DEMO || localStorage.getItem('hs_is_logged_in') === 'true');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    if (IS_DEMO) return DEMO_USER;
    const saved = localStorage.getItem('hs_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Helper para traer todos los registros sin límite de 1000 de Supabase
  const fetchAll = async (table: string) => {
    let allData: any[] = [];
    let from = 0;
    const step = 999;
    while (true) {
      const { data, error } = await supabase.from(table).select('*').range(from, from + step);
      if (error) {
        console.error(`Error fetching ${table}:`, error);
        break;
      }
      if (data) allData = allData.concat(data);
      if (!data || data.length <= step) break;
      from += step + 1;
    }
    return { data: allData, error: null };
  };

  const fetchInitialData = async () => {
    if (IS_DEMO) {
      setUsers(DEMO_USERS);
      setClientes(DEMO_CLIENTES);
      setProveedores(DEMO_PROVEEDORES);
      setProductos(DEMO_PRODUCTOS);
      setCotizaciones(DEMO_COTIZACIONES);
      setOrdenesCompra([]);
      setDespachos(DEMO_DESPACHOS);
      setConductores(DEMO_CONDUCTORES);
      setAlquileres([]);
      setReparaciones([]);
      setDevoluciones([]);
      setBudgets(DEMO_BUDGETS);
      setVentasManuales(DEMO_VENTAS);
      setClientesWeb([]);
      setRegistros([]);
      setCurrentTrm(4200);
      return;
    }
    try {
      console.log('Cargando datos iniciales de Supabase...');
      const { data: userData, error: userError } = await supabase.from('app_users').select('*');
      if (userError) console.error('Error cargando usuarios:', userError);
      if (userData) setUsers(userData as AppUser[]);

      const { data: clientData } = await fetchAll('clientes');
      if (clientData) {
        setClientes(clientData.map((c: any) => ({
          ...c,
          id: c.id,
          nombre: c.nombre,
          nit: c.nit,
          contacto: c.contacto,
          telefono: c.telefono,
          correo: c.correo,
          direccion: c.direccion,
          ciudad: c.ciudad || '',
          compradores: c.compradores || [],
          sedes: c.sedes || [],
          coordenadas: c.coordenadas,
          usuarioId: c.usuario_id,
          tesoreriaNombre: c.tesoreria_nombre || '',
          tesoreriaTelefono: c.tesoreria_telefono || '',
          tesoreriaEmail: c.tesoreria_email || '',
          contabilidadNombre: c.contabilidad_nombre || '',
          contabilidadTelefono: c.contabilidad_telefono || '',
          contabilidadEmail: c.contabilidad_email || '',
          poseeCredito: !!c.posee_credito,
          cupoCredito: c.cupo_credito || 0,
          regimen: c.regimen || 'Régimen Común'
        } as Cliente)));
      }

      const { data: providerData } = await fetchAll('proveedores');
      if (providerData) {
        setProveedores(providerData.map((p: any) => ({
          ...p,
          regimen: p.regimen || 'Régimen Común'
        } as Proveedor)));
      }

      const { data: productData, error: productError } = await fetchAll('productos');
      if (productError) console.error('Error cargando productos:', productError.message);
      if (productData) {
        // Map snake_case to camelCase for products
        setProductos(productData.map((p: any) => ({
          id: p.id,
          nombre: p.nombre || '',
          descripcion: p.descripcion || '',
          unidad: p.unidad || 'Und',
          history: p.history || [],
          numPart: p.num_part || '',
          precioCompra: p.precio_compra || 0,
          moneda: p.moneda || 'COP',
          trmReferencia: p.trm_referencia || undefined,
          tipo: p.tipo || 'Producto',
          exentoIva: !!p.exento_iva
        } as Producto)));
      }

      const { data: quoteData } = await fetchAll('cotizaciones');
      if (quoteData) {
        setCotizaciones(quoteData.map((c: any) => ({
          ...c,
          clienteId: c.cliente_id,
          clienteNombre: c.cliente_nombre,
          ejecutivoEmail: c.ejecutivo_email,
          ejecutivoTelefono: c.ejecutivo_telefono,
          compradorNombre: c.comprador_nombre || '',
          compradorTelefono: c.comprador_telefono || '',
          compradorEmail: c.comprador_email || '',
          usuarioId: c.usuario_id,
          direccion: c.direccion,
          coordenadas: c.coordenadas,
          usuario_id: c.usuario_id,
          contactoTesoreria: c.contacto_tesoreria,
          contactoContabilidad: c.contacto_contabilidad,
          poseeCredito: !!c.posee_credito,
          cupoCredito: c.cupo_credito,
          utilidadTotal: Number(c.utilidad_total || 0),
          ordenCompraCliente: c.orden_compra_cliente,
          ordenCompraUrl: c.orden_compra_url,
          observaciones: c.observaciones || '',
          condiciones: c.condiciones || '',
          trm: c.trm || 0,
          metadata: c.metadata || {}
        })));
      }

      const { data: ocData } = await fetchAll('ordenes_compra');
      if (ocData) {
        setOrdenesCompra(ocData.map((o: any) => ({
          ...o,
          proveedorId: o.proveedor_id,
          nombreProveedor: o.nombre_proveedor,
          condicionesComerciales: o.condiciones_comerciales,
          conductorId: o.conductor_id,
          conductorNombre: o.conductor_nombre,
          fotoEntrega: o.foto_entrega,
          fotoRemision: o.foto_remision,
          usuarioId: o.usuario_id,
          tipo: o.tipo || 'Recogida', // Default to Recogida for existing ones
          verificada: !!o.verificada,
          moneda: o.moneda || 'COP',
          trm: o.trm || 0
        })));
      }

      const { data: despachoData } = await fetchAll('despachos');
      if (despachoData) {
        setDespachos(despachoData.map((d: any) => ({
          ...d,
          cotizacionId: d.cotizacion_id,
          consecutivoCotizacion: d.consecutivo_cotizacion,
          fechaSolicitud: d.fecha_solicitud,
          clienteId: d.cliente_id,
          clienteNombre: d.cliente_nombre,
          ejecutivoEmail: d.ejecutivo_email,
          ejecutivoTelefono: d.ejecutivo_telefono,
          usuarioId: d.usuario_id,
          conductorId: d.conductor_id,
          conductorNombre: d.conductor_nombre,
          fotoEntrega: d.foto_entrega,
          fotoRemision: d.foto_remision,
          fechaFacturado: d.fecha_facturado || undefined,
        })));
      }

      const { data: conductorData } = await supabase.from('conductores').select('*');
      if (conductorData) {
        setConductores(conductorData.map((c: any) => ({
          ...c,
          placaVehiculo: c.placa_vehiculo,
          modeloVehiculo: c.modelo_vehiculo,
          tipoVehiculo: c.tipo_vehiculo,
          tarjetaPropiedad: c.tarjeta_propiedad
        })));
      }

      const { data: alquilerData, error: alquilerError } = await supabase.from('alquileres').select('*');
      if (alquilerError) console.error('Error fetching alquileres:', alquilerError.message);
      if (alquilerData) {
        console.log('Alquileres raw data:', alquilerData.length, 'records');
        setAlquileres(alquilerData.map((a: any) => ({
          ...a,
          fotoUrl: a.foto_url ?? a.fotoUrl ?? '',
          clienteId: a.cliente_id ?? a.clienteId ?? '',
          clienteNombre: a.cliente_nombre ?? a.clienteNombre ?? '',
          fechaInicio: a.fecha_inicio ?? a.fechaInicio ?? '',
          valorMensual: a.valor_mensual ?? a.valorMensual ?? 0,
          usuarioId: a.usuario_id ?? a.usuarioId ?? '',
          discoDuro: a.disco_duro ?? a.discoDuro ?? '',
          memoriaRam: a.memoria_ram ?? a.memoriaRam ?? '',
          procesador: a.procesador ?? '',
          generacion: a.generacion ?? ''
        })));
      }

      const { data: repairData } = await supabase.from('reparaciones').select('*');
      if (repairData) {
        setReparaciones(repairData.map((r: any) => ({
          ...r,
          clienteId: r.cliente_id,
          clienteNombre: r.cliente_nombre,
          tipoServicio: r.tipo_servicio,
          proveedorId: r.proveedor_id,
          proveedorNombre: r.proveedor_nombre,
          fechaIngreso: r.fecha_ingreso,
          conductorId: r.conductor_id,
          conductorNombre: r.conductor_nombre
        })));
      }

      const { data: devolucionData } = await supabase.from('devoluciones').select('*');
      if (devolucionData) {
        setDevoluciones(devolucionData.map((d: any) => ({
          ...d,
          proveedorId: d.proveedor_id,
          nombreProveedor: d.nombre_proveedor,
          usuarioId: d.usuario_id,
          conductorId: d.conductor_id,
          conductorNombre: d.conductor_nombre
        })));
      }

      const { data: budgetData } = await supabase.from('budgets').select('*');
      if (budgetData) {
        setBudgets(budgetData.map((b: any) => ({
          ...b,
          usuarioId: b.usuario_id,
          nombreVendedor: b.nombre_vendedor
        })));
      }

      const { data: vManualData } = await supabase.from('ventas_manuales').select('*');
      if (vManualData) {
        setVentasManuales(vManualData.map((v: any) => ({
          ...v,
          clienteId: v.cliente_id,
          clienteNombre: v.cliente_nombre,
          usuarioId: v.usuario_id,
          usuarioNombre: v.usuario_nombre,
          tipoVenta: v.tipo_venta || 'Venta',
          costo: v.costo || 0
        })));
      }

      const { data: leadsWebData } = await supabase.from('clientes_web').select('*').order('created_at', { ascending: false });
      if (leadsWebData) {
        setClientesWeb(leadsWebData as ClienteWeb[]);
      }

      const { data: registrosData } = await supabase.from('registros_pendientes').select('*').order('created_at', { ascending: false });
      if (registrosData) {
        setRegistros(registrosData as RegistroPendiente[]);
      }

      const { data: propuestasData } = await supabase.from('propuestas').select('*');
      if (propuestasData) {
        setPropuestas(propuestasData.map((p: any) => ({
          id: p.id,
          consecutivo: p.consecutivo,
          fecha: p.fecha,
          clienteId: p.cliente_id,
          clienteNombre: p.cliente_nombre,
          clienteNit: p.cliente_nit,
          clienteCiudad: p.cliente_ciudad,
          clienteContacto: p.cliente_contacto,
          tipoServicioId: p.tipo_servicio_id,
          tipoServicioNombre: p.tipo_servicio_nombre,
          moneda: p.moneda || 'COP',
          valor: p.valor || 0,
          items: p.items || [],
          incluyeIva: !!p.incluye_iva,
          vigencia: p.vigencia || '30 días',
          observaciones: p.observaciones || '',
          estado: p.estado || 'Borrador',
          comercialNombre: p.comercial_nombre || '',
          comercialTelefono: p.comercial_telefono || '',
          usuarioId: p.usuario_id,
          objetivo: p.objetivo || '',
          personal: p.personal || [],
          visitas: p.visitas || [],
          obligacionesCliente: p.obligaciones_cliente || [],
        } as Propuesta)));
      }

      // Fetch TRM
      try {
        const res = await fetch('https://co.dolarapi.com/v1/trm');
        const data = await res.json();
        if (data && data.valor) {
          setCurrentTrm(data.valor);
        }
      } catch (err) {
        console.error('Error fetching TRM in App:', err);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  useEffect(() => {
    if (IS_DEMO) return;
    let channel: any;

    const setupSubscription = () => {
      console.log('Suscribiéndo a canales de tiempo real...');
      setRealtimeStatus('Conectando...');

      channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, (p) => {
          console.log(`Cambio detectado en tabla: ${p.table}`, p);
          fetchInitialData();
          if (p.table === 'app_users' && currentUser && p.new && (p.new as any).id === currentUser.id) {
            setCurrentUser(p.new as AppUser);
          }
        })
        .subscribe((status) => {
          console.log('Estado de conexión Realtime:', status);
          setRealtimeStatus(status === 'SUBSCRIBED' ? 'En Línea' : status);
          if (status === 'SUBSCRIBED') fetchInitialData(); // Refrescar al conectar
        });
    };

    setupSubscription();

    const handleOnline = () => {
      console.log('Red recuperada, reintentando suscripción...');
      if (channel) supabase.removeChannel(channel);
      setupSubscription();
    };

    const handleOffline = () => {
      setRealtimeStatus('Sin Internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => { if (!IS_DEMO) localStorage.setItem('hs_is_logged_in', isLoggedIn ? 'true' : 'false'); }, [isLoggedIn]);
  useEffect(() => { if (!IS_DEMO) localStorage.setItem('hs_current_user', JSON.stringify(currentUser)); }, [currentUser]);

  // Update handlers
  const addCliente = async (c: Cliente) => {
    if (IS_DEMO) { setClientes(prev => [...prev, { ...c, id: crypto.randomUUID() }]); alert('Cliente añadido (modo demo).'); return; }
    if (!currentUser) {
      alert('Error: Debe iniciar sesión para añadir un cliente.');
      return;
    }

    // Explicitly build the payload for Supabase (snake_case)
    const dbClient = {
      nombre: c.nombre,
      nit: c.nit,
      contacto: c.contacto,
      telefono: c.telefono,
      correo: c.correo,
      direccion: c.direccion,
      ciudad: c.ciudad || '',
      coordenadas: c.coordenadas || '',
      usuario_id: currentUser.id,
      tesoreria_nombre: c.tesoreriaNombre || '',
      tesoreria_telefono: c.tesoreriaTelefono || '',
      tesoreria_email: c.tesoreriaEmail || '',
      contabilidad_nombre: c.contabilidadNombre || '',
      contabilidad_telefono: c.contabilidadTelefono || '',
      contabilidad_email: c.contabilidadEmail || '',
      posee_credito: c.poseeCredito || false,
      cupo_credito: c.cupoCredito || 0,
      compradores: c.compradores || [],
      sedes: c.sedes || [],
      regimen: c.regimen || 'Régimen Común'
    };

    console.log('Insertando cliente en Supabase:', dbClient);

    const { data: insertData, error: insertError } = await supabase.from('clientes').insert([dbClient]).select();

    if (insertError) {
      console.error('Error al añadir cliente:', insertError);
      alert(`Error al añadir cliente: ${insertError.message}. Código: ${insertError.code}`);
    } else if (insertData && insertData[0]) {
      const dbObj = insertData[0];
      setClientes(prev => [...prev, {
        ...dbObj,
        usuarioId: dbObj.usuario_id,
        ciudad: dbObj.ciudad,
        compradores: dbObj.compradores || [],
        sedes: dbObj.sedes || [],
        tesoreriaNombre: dbObj.tesoreria_nombre,
        tesoreriaTelefono: dbObj.tesoreria_telefono,
        tesoreriaEmail: dbObj.tesoreria_email,
        contabilidadNombre: dbObj.contabilidad_nombre,
        regimen: dbObj.regimen || 'Régimen Común',
        contabilidadTelefono: dbObj.contabilidad_telefono,
        contabilidadEmail: dbObj.contabilidad_email,
        poseeCredito: !!dbObj.posee_credito,
        cupoCredito: dbObj.cupo_credito
      } as Cliente]);
      alert('Cliente añadido correctamente.');
    }
  };

  const updateCliente = async (c: Cliente) => {
    if (IS_DEMO) { setClientes(prev => prev.map(i => i.id === c.id ? c : i)); alert('Cambios guardados (modo demo).'); return; }
    // Explicitly build the payload for Update (snake_case)
    const payload = {
      nombre: c.nombre,
      nit: c.nit,
      contacto: c.contacto,
      telefono: c.telefono,
      correo: c.correo,
      direccion: c.direccion,
      ciudad: c.ciudad || '',
      coordenadas: c.coordenadas || '',
      usuario_id: c.usuarioId,
      tesoreria_nombre: c.tesoreriaNombre || '',
      tesoreria_telefono: c.tesoreriaTelefono || '',
      tesoreria_email: c.tesoreriaEmail || '',
      contabilidad_nombre: c.contabilidadNombre || '',
      contabilidad_telefono: c.contabilidadTelefono || '',
      contabilidad_email: c.contabilidadEmail || '',
      posee_credito: c.poseeCredito || false,
      cupo_credito: c.cupoCredito || 0,
      compradores: c.compradores || [],
      sedes: c.sedes || [],
      regimen: c.regimen || 'Régimen Común'
    };

    console.log('Actualizando cliente en Supabase:', payload);

    const { error: updateError } = await supabase.from('clientes').update(payload).eq('id', c.id);

    if (updateError) {
      console.error('Error al actualizar cliente:', updateError);
      alert(`Error al actualizar cliente: ${updateError.message}`);
    } else {
      setClientes(prev => prev.map(item => item.id === c.id ? c : item));
      alert('Cambios guardados correctamente.');
    }
  };

  const deleteCliente = async (id: string) => {
    if (IS_DEMO) { setClientes(prev => prev.filter(c => c.id !== id)); return; }
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar cliente:', error);
      alert('Error al eliminar cliente: ' + error.message);
    } else {
      setClientes(clientes.filter(c => c.id !== id));
    }
  };

  const addProveedor = async (p: Proveedor) => {
    if (IS_DEMO) { setProveedores(prev => [...prev, { ...p, id: crypto.randomUUID() }]); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...newP } = p;
    const { data, error } = await supabase.from('proveedores').insert([newP]).select();
    if (error) {
      alert('Error al añadir proveedor: ' + error.message);
    } else if (data) {
      setProveedores([...proveedores, data[0] as Proveedor]);
    }
  };
  const updateProveedor = async (p: Proveedor) => {
    if (IS_DEMO) { setProveedores(prev => prev.map(i => i.id === p.id ? p : i)); return; }
    const { error } = await supabase.from('proveedores').update(p).eq('id', p.id);
    if (!error) {
      setProveedores(proveedores.map(item => item.id === p.id ? p : item));
    } else {
      console.error('Error al actualizar proveedor:', error);
      alert(`Error al actualizar proveedor: ${error.message}`);
    }
  };
  const deleteProveedor = async (id: string) => {
    if (IS_DEMO) { setProveedores(prev => prev.filter(p => p.id !== id)); return; }
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (!error) setProveedores(proveedores.filter(p => p.id !== id));
  };

  const addProducto = async (p: Producto) => {
    if (IS_DEMO) { setProductos(prev => [...prev, { ...p, id: crypto.randomUUID() }]); return; }
    // Explicitamente extraemos todos los campos camelCase para evitar enviar columnas inválidas a Supabase
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, numPart, precioCompra, exentoIva, moneda, trmReferencia, tipo, nombre, descripcion, unidad, history } = p;
    const { data, error } = await supabase.from('productos').insert([{
      nombre,
      descripcion: descripcion || '',
      unidad: unidad || 'Und',
      history: history || [],
      num_part: numPart || '',
      precio_compra: precioCompra || 0,
      moneda: moneda || 'COP',
      trm_referencia: trmReferencia || null,
      tipo: tipo || 'Producto',
      exento_iva: exentoIva || false
    }]).select();
    if (error) {
      alert('Error al añadir producto: ' + error.message);
    } else if (data) {
      const dbProd = data[0];
      setProductos([...productos, {
        ...dbProd,
        numPart: dbProd.num_part,
        precioCompra: dbProd.precio_compra,
        descripcion: dbProd.descripcion || '',
        moneda: dbProd.moneda || 'COP',
        trmReferencia: dbProd.trm_referencia,
        tipo: dbProd.tipo || 'Producto',
        exentoIva: !!dbProd.exento_iva,
        history: dbProd.history || []
      } as Producto]);
    }
  };
  const updateProducto = async (p: Producto) => {
    if (IS_DEMO) { setProductos(prev => prev.map(i => i.id === p.id ? p : i)); return; }
    // Explicitamente mapeamos todos los campos para evitar errores de schema cache
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, numPart, precioCompra, exentoIva, moneda, trmReferencia, tipo, nombre, descripcion, unidad, history } = p;
    const { error } = await supabase.from('productos').update({
      nombre,
      descripcion: descripcion || '',
      unidad: unidad || 'Und',
      history: history || [],
      num_part: numPart || '',
      precio_compra: precioCompra || 0,
      moneda: moneda || 'COP',
      trm_referencia: trmReferencia || null,
      tipo: tipo || 'Producto',
      exento_iva: exentoIva || false
    }).eq('id', p.id);
    if (!error) setProductos(productos.map(item => item.id === p.id ? p : item));
    else alert('Error al actualizar producto: ' + error.message);
  };
  const deleteProducto = async (id: string) => {
    if (IS_DEMO) { setProductos(prev => prev.filter(p => p.id !== id)); return; }
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (!error) setProductos(productos.filter(p => p.id !== id));
  };

  const updateDespacho = async (d: Despacho) => {
    if (IS_DEMO) { setDespachos(prev => prev.map(i => i.id === d.id ? d : i)); return; }
    const oldDespacho = despachos.find(item => item.id === d.id);

    console.log('Intentando actualizar despacho (mapa explícito):', d);

    // Explicit mapping to avoid invalid columns
    const payload = {
      cotizacion_id: d.cotizacionId,
      consecutivo_cotizacion: d.consecutivoCotizacion,
      fecha_solicitud: d.fechaSolicitud,
      cliente_id: d.clienteId,
      cliente_nombre: d.clienteNombre,
      direccion: d.direccion,
      items: d.items,
      total: d.total,
      ejecutivo_email: d.ejecutivoEmail,
      ejecutivo_telefono: d.ejecutivoTelefono,
      usuario_id: d.usuarioId,
      estado: d.estado,
      conductor_id: d.conductorId,
      conductor_nombre: d.conductorNombre,
      foto_entrega: d.fotoEntrega,
      foto_remision: d.fotoRemision,
      georeferencia: d.georeferencia,
      facturado: d.facturado || false,
      fecha_facturado: d.fechaFacturado || null
    };

    const { error } = await supabase.from('despachos').update(payload).eq('id', d.id);

    if (error) {
      console.error('Error crítico en Supabase (updateDespacho):', error);
      alert(`ERROR AL GUARDAR CAMBIOS: ${error.message}\nDetalle: ${error.details || 'Sin detalles'}\nCódigo: ${error.code}`);
      return;
    }

    console.log('Despacho actualizado con éxito en DB');
    setDespachos(despachos.map(item => item.id === d.id ? d : item));

    if (oldDespacho && oldDespacho.estado !== d.estado) {
      // Email FROM facturacion TO the person who created the quotation
      sendEmailNotification(
        d.ejecutivoEmail,
        `Cambio de Estado Pedido: ${d.consecutivoCotizacion}`,
        `Hola,\n\nLe informamos que el pedido asociado a la cotización ${d.consecutivoCotizacion} ha cambiado su estado:\n\n- Estado Anterior: ${oldDespacho.estado}\n- Nuevo Estado: ${d.estado}\n- Cliente: ${d.clienteNombre}\n- Dirección: ${d.direccion || 'N/A'}\n\nPor favor, tome las acciones correspondientes.`,
        undefined,
        'Área de Facturación',
        'facturacion@helpsoluciones.com.co'
      );

      // WhatsApp to the person who created the quotation
      if (d.ejecutivoTelefono) {
        sendWhatsAppNotification(
          d.ejecutivoTelefono,
          `📦 *Actualización de Pedido*\n\nCotización: ${d.consecutivoCotizacion}\nCliente: ${d.clienteNombre}\nEstado: ${oldDespacho.estado} → *${d.estado}*`
        );
      }
    }
  };
  const deleteDespacho = async (id: string) => {
    if (IS_DEMO) { setDespachos(prev => prev.filter(d => d.id !== id)); return; }
    const { error } = await supabase.from('despachos').delete().eq('id', id);
    if (!error) setDespachos(despachos.filter(d => d.id !== id));
  };

  const addReparacion = async (r: Reparacion) => {
    if (IS_DEMO) { setReparaciones(prev => [{ ...r, id: crypto.randomUUID() }, ...prev]); alert('Reparación registrada (modo demo).'); return; }
    // 1. Re-calculate the absolute maximum consecutive from the database to avoid collisions
    const { data: latestREPs, error: fetchError } = await supabase
      .from('reparaciones')
      .select('consecutivo')
      .ilike('consecutivo', 'REP-%')
      .order('consecutivo', { ascending: false })
      .limit(1);

    let finalConsecutivo = r.consecutivo;

    if (!fetchError && latestREPs && latestREPs.length > 0) {
      const dbMax = parseInt(latestREPs[0].consecutivo.replace('REP-', ''), 10);
      const proposed = parseInt(r.consecutivo.replace('REP-', ''), 10);
      
      // If the database has a higher or equal number, increment it
      if (!isNaN(dbMax) && dbMax >= proposed) {
        finalConsecutivo = `REP-${(dbMax + 1).toString().padStart(3, '0')}`;
        console.log(`Colisión detectada en Reparaciones. Cambiando ${r.consecutivo} a ${finalConsecutivo}`);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, clienteId, clienteNombre, tipoServicio, proveedorId, proveedorNombre, conductorId, conductorNombre, fechaIngreso, ...cleanR } = r;
    const { data, error } = await supabase.from('reparaciones').insert([{
      ...cleanR,
      consecutivo: finalConsecutivo,
      cliente_id: r.clienteId,
      cliente_nombre: r.clienteNombre,
      tipo_servicio: r.tipoServicio,
      proveedor_id: r.proveedorId,
      proveedor_nombre: r.proveedorNombre,
      conductor_id: r.conductorId,
      conductor_nombre: r.conductorNombre,
      fecha_ingreso: r.fechaIngreso
    }]).select();

    if (error) {
      console.error('Error al añadir reparación:', error);
      alert('Error al añadir reparación: ' + error.message);
    } else if (data) {
      const dbR = data[0];
      setReparaciones(prev => [{
        ...dbR,
        clienteId: dbR.cliente_id,
        clienteNombre: dbR.cliente_nombre,
        tipoServicio: dbR.tipo_servicio,
        proveedorId: dbR.proveedor_id,
        proveedorNombre: dbR.proveedor_nombre,
        conductorId: dbR.conductor_id,
        conductorNombre: dbR.conductor_nombre,
        fechaIngreso: dbR.fecha_ingreso
      } as Reparacion, ...prev]);
      alert('Reparación registrada con éxito.');
    }
  };
  const updateReparacion = async (r: Reparacion) => {
    if (IS_DEMO) { setReparaciones(prev => prev.map(i => i.id === r.id ? r : i)); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, clienteId, clienteNombre, tipoServicio, proveedorId, proveedorNombre, conductorId, conductorNombre, fechaIngreso, ...cleanR } = r;
    const { error } = await supabase.from('reparaciones').update({
      ...cleanR,
      cliente_id: r.clienteId,
      cliente_nombre: r.clienteNombre,
      tipo_servicio: r.tipoServicio,
      proveedor_id: r.proveedorId,
      proveedor_nombre: r.proveedorNombre,
      conductor_id: r.conductorId,
      conductor_nombre: r.conductorNombre,
      fecha_ingreso: r.fechaIngreso,
      foto: r.foto
    }).eq('id', r.id);
    if (!error) setReparaciones(prev => prev.map(item => item.id === r.id ? r : item));
  };
  const deleteReparacion = async (id: string) => {
    if (IS_DEMO) { setReparaciones(prev => prev.filter(r => r.id !== id)); return; }
    const { error } = await supabase.from('reparaciones').delete().eq('id', id);
    if (!error) setReparaciones(prev => prev.filter(r => r.id !== id));
  };

  const sendEmailNotification = async (to: string, subject: string, body: string, cc?: string, senderName?: string, senderEmail?: string) => {
    const fromName = senderName || currentUser?.nombre || 'Equipo Help Soluciones';
    const fromCargo = senderName ? '' : (currentUser?.cargo || 'Sistema de Gestión');
    const fromEmail = senderEmail || currentUser?.email || '';

    const header = `*** CRM HELP SOLUCIONES - NOTIFICACIÓN AUTOMÁTICA ***<br><br>`;
    const signature = `<br><br>Cordialmente,<br><br><strong>${fromName}</strong>${fromCargo ? '<br>' + fromCargo : ''}${fromEmail ? '<br>' + fromEmail : ''}<br>Help Soluciones Informáticas<br><br>---<br><small>Este mensaje fue generado automáticamente por el sistema de Appenvios.</small>`;

    // Format body as HTML (replacing newlines with <br>)
    const htmlContent = header + body.replace(/\n/g, '<br>') + signature;

    try {
      console.log('Enviando notificación automática...', { to, cc, subject });
      
      // If we have a CC, it's safer to send to an array in 'to' for corporate mail filters
      const recipients = cc ? [to, cc] : [to];

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to: recipients, subject, html: htmlContent }
      });

      if (error) throw error;
      
      if (data && data.error) {
        console.error('Error en servicio de correo:', data.error);
      } else {
        console.log('Notificación enviada con éxito');
      }
    } catch (err: any) {
      console.error('Error enviando notificación automática:', err);
    }
  };

  const sendWhatsAppNotification = (phone: string, message: string) => {
    const signature = `\n\n_Enviado por: ${currentUser?.nombre || 'Usuario'}_`;
    const fullMessage = message + signature;
    const encodedMsg = encodeURIComponent(fullMessage);
    const url = `https://wa.me/${phone.replace(/\s/g, '')}?text=${encodedMsg}`;
    window.open(url, '_blank');
  };

  const exportAllData = async () => {
    try {
      console.log('📦 Preparando copia de seguridad masiva...');
      const tables = [
        'productos', 'clientes', 'cotizaciones', 'ordenes_compra', 
        'proveedores', 'conductores', 'alquileres', 'despachos', 
        'reparaciones', 'devoluciones', 'ventas_manuales', 'app_users'
      ];
      
      const backup: any = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {}
      };

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (!error && data) {
          backup.data[table] = data;
        } else {
          console.error(`Error exportando tabla ${table}:`, error);
        }
      }

      // Convert to JSON and trigger download
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BACKUP_CRM_APPENVIOS_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ Copia de seguridad descargada con éxito.');
    } catch (err) {
      console.error('Error en exportación masiva:', err);
      alert('Hubo un error al generar la copia de seguridad.');
    }
  };

  const addCotizacion = async (c: Cotizacion) => {
    if (IS_DEMO) { setCotizaciones(prev => [{ ...c, id: crypto.randomUUID() }, ...prev]); setActiveTab('informes'); return; }
    const { data, error } = await supabase.from('cotizaciones').insert([{
      fecha: c.fecha,
      consecutivo: c.consecutivo,
      items: c.items,
      subtotal: c.subtotal,
      iva: c.iva,
      total: c.total,
      ejecutivo: c.ejecutivo,
      estado: c.estado,
      cliente_id: c.clienteId,
      cliente_nombre: c.clienteNombre,
      ejecutivo_email: c.ejecutivoEmail,
      ejecutivo_telefono: c.ejecutivoTelefono,
      usuario_id: c.usuarioId,
      utilidad_total: c.utilidadTotal,
      requiere_autorizacion: c.requiereAutorizacion || false,
      autorizada: c.autorizada || false,
      autorizado_por: c.autorizadoPor,
      fecha_autorizacion: c.fechaAutorizacion,
      observaciones: c.observaciones || '',
      condiciones: c.condiciones || '',
      trm: c.trm || 0,
      validez_oferta: c.validez_oferta || 3,
      comprador_nombre: c.compradorNombre || '',
      comprador_telefono: c.compradorTelefono || '',
      comprador_email: c.compradorEmail || '',
      metadata: c.metadata || {}
    }]).select();

    if (error) {
      alert('Error al añadir cotización: ' + error.message);
      throw error;
    } else if (data) {
      const dbC = data[0];
      setCotizaciones(prev => [{
        ...dbC,
        clienteId: dbC.cliente_id,
        clienteNombre: dbC.cliente_nombre,
        ejecutivoEmail: dbC.ejecutivo_email,
        ejecutivoTelefono: dbC.ejecutivo_telefono,
        compradorNombre: dbC.comprador_nombre || '',
        compradorTelefono: dbC.comprador_telefono || '',
        compradorEmail: dbC.comprador_email || '',
        usuarioId: dbC.usuario_id,
        utilidadTotal: Number(dbC.utilidad_total || 0),
        requiereAutorizacion: dbC.requiere_autorizacion,
        autorizada: dbC.autorizada,
        autorizadoPor: dbC.autorizado_por,
        fechaAutorizacion: dbC.fecha_autorizacion,
        observaciones: dbC.observaciones || '',
        condiciones: dbC.condiciones || '',
        trm: dbC.trm || 0,
        validez_oferta: dbC.validez_oferta || 3,
        ordenCompraCliente: dbC.orden_compra_cliente,
        ordenCompraUrl: dbC.orden_compra_url,
        metadata: dbC.metadata || {}
      } as Cotizacion, ...prev]);
      
      // Auto-navigate to Informes
      setActiveTab('informes');
    }
  };

  const updateCotizacion = async (c: Cotizacion) => {
    if (IS_DEMO) {
      const oldQuote = cotizaciones.find(q => q.id === c.id);
      setCotizaciones(prev => prev.map(i => i.id === c.id ? c : i));
      if (c.estado === 'Ganado' && !despachos.some(d => d.cotizacionId === c.id)) {
        const client = clientes.find(cli => cli.id === c.clienteId);
        setDespachos(prev => [...prev, {
          id: crypto.randomUUID(), cotizacionId: c.id, consecutivoCotizacion: c.consecutivo,
          fechaSolicitud: new Date().toISOString().split('T')[0], clienteId: c.clienteId,
          clienteNombre: c.clienteNombre, direccion: client?.direccion || 'N/A',
          items: (c.items || []).map(item => { const p = productos.find(x => x.id === item.productoId); return { productoId: item.productoId, nombreProducto: p?.nombre || 'Producto', numPart: p?.numPart || 'N/A', cantidad: item.cantidad }; }),
          total: c.total, ejecutivoEmail: c.ejecutivoEmail || '', ejecutivoTelefono: c.ejecutivoTelefono,
          usuarioId: c.usuarioId, estado: 'Pendiente'
        }]);
      } else if (oldQuote && oldQuote.estado === 'Ganado' && c.estado !== 'Ganado') {
        setDespachos(prev => prev.filter(d => d.cotizacionId !== c.id));
      }
      return;
    }
    // 1. Explicit mapping for Supabase Update
    const quotePayload = {
      fecha: c.fecha,
      cliente_id: c.clienteId,
      cliente_nombre: c.clienteNombre,
      consecutivo: c.consecutivo,
      items: c.items,
      subtotal: c.subtotal,
      iva: c.iva,
      total: c.total,
      ejecutivo: c.ejecutivo,
      ejecutivo_email: c.ejecutivoEmail,
      ejecutivo_telefono: c.ejecutivoTelefono,
      usuario_id: c.usuarioId,
      estado: c.estado,
      utilidad_total: c.utilidadTotal,
      requiere_autorizacion: c.requiereAutorizacion,
      autorizada: c.autorizada,
      autorizado_por: c.autorizadoPor,
      fecha_autorizacion: c.fechaAutorizacion,
      orden_compra_cliente: c.ordenCompraCliente,
      orden_compra_url: c.ordenCompraUrl,
      observaciones: c.observaciones,
      condiciones: c.condiciones,
      trm: c.trm,
      validez_oferta: c.validez_oferta,
      metadata: c.metadata || {}
    };

    const { error: updateError } = await supabase.from('cotizaciones').update(quotePayload).eq('id', c.id);

    if (updateError) {
      console.error('Error actualizando cotización:', updateError);
      alert('Error en base de datos: ' + updateError.message);
      return;
    }

    // 2. Update local state
    const oldQuote = cotizaciones.find(q => q.id === c.id);
    setCotizaciones(prev => prev.map(item => item.id === c.id ? c : item));

    // 3. Trigger Outlook Email & Logistics Automation if Won
    if (c.estado === 'Ganado') {
      // Outlook Integration via Template
      const emailSubject = `NUEVO PEDIDO GANADO - ${c.consecutivo}`;
      const emailBody = `Hola equipo de Logística/Facturación,\n\nSe ha confirmado una nueva venta ganada:\n\n- Cotización: ${c.consecutivo}\n- Cliente: ${c.clienteNombre}\n- Valor Total: $${Math.round(c.total).toLocaleString()}\n\nPor favor, proceder con el despacho y la facturación correspondiente.`;

      sendEmailNotification('logistica@helpsoluciones.com.co', emailSubject, emailBody, 'facturacion@helpsoluciones.com.co');

      // Create Logistics record if it doesn't exist
      if (!despachos.some(d => d.cotizacionId === c.id)) {
        const client = clientes.find(cli => cli.id === c.clienteId);
        const despachoItems = (c.items || []).map(item => {
          const prod = productos.find(p => p.id === item.productoId);
          return {
            productoId: item.productoId,
            nombreProducto: prod?.nombre || 'Producto Desconocido',
            numPart: prod?.numPart || 'N/A',
            cantidad: item.cantidad || 0
          };
        });

        const newDespacho: Despacho = {
          id: crypto.randomUUID(), // Temp ID
          cotizacionId: c.id,
          consecutivoCotizacion: c.consecutivo,
          fechaSolicitud: new Date().toISOString().split('T')[0],
          clienteId: c.clienteId,
          clienteNombre: c.clienteNombre,
          direccion: client?.direccion || 'N/A',
          items: despachoItems,
          total: c.total,
          ejecutivoEmail: c.ejecutivoEmail || '',
          ejecutivoTelefono: c.ejecutivoTelefono,
          usuarioId: c.usuarioId,
          estado: 'Pendiente'
        };

        const { data: despachoData, error: despachoError } = await supabase.from('despachos').insert([{
          cotizacion_id: newDespacho.cotizacionId,
          consecutivo_cotizacion: newDespacho.consecutivoCotizacion,
          fecha_solicitud: newDespacho.fechaSolicitud,
          cliente_id: newDespacho.clienteId,
          cliente_nombre: newDespacho.clienteNombre,
          direccion: newDespacho.direccion,
          items: newDespacho.items,
          total: newDespacho.total,
          ejecutivo_email: newDespacho.ejecutivoEmail,
          ejecutivo_telefono: newDespacho.ejecutivoTelefono,
          usuario_id: newDespacho.usuarioId,
          estado: newDespacho.estado
        }]).select();

        if (despachoError) {
          console.error('Error creando despacho:', despachoError);
        } else if (despachoData) {
          const dbD = despachoData[0];
          setDespachos(prev => [...prev, {
            ...dbD,
            cotizacionId: dbD.cotizacion_id,
            consecutivoCotizacion: dbD.consecutivo_cotizacion,
            fechaSolicitud: dbD.fecha_solicitud,
            clienteId: dbD.cliente_id,
            clienteNombre: dbD.cliente_nombre,
            ejecutivoEmail: dbD.ejecutivo_email,
            ejecutivoTelefono: dbD.ejecutivo_telefono,
            usuarioId: dbD.usuario_id
          } as Despacho]);
        }
      }
    } else if (oldQuote && oldQuote.estado === 'Ganado') {
      // If it was won and now it's not (since we're in the else block of c.estado === 'Ganado'), remove from logistics
      const { error: despachoDelError } = await supabase.from('despachos').delete().eq('cotizacion_id', c.id);
      if (!despachoDelError) {
        setDespachos(prev => prev.filter(d => d.cotizacionId !== c.id));
        console.log(`Despacho asociado a ${c.consecutivo} eliminado por cambio de estado.`);
      } else {
        console.error('Error eliminando despacho asociado:', despachoDelError);
      }
    }
  };

  const deleteCotizacion = async (id: string) => {
    if (IS_DEMO) { setCotizaciones(prev => prev.filter(c => c.id !== id)); setDespachos(prev => prev.filter(d => d.cotizacionId !== id)); return; }
    // 1. Delete associated despachos first due to foreign key constraint
    const { error: despachoError } = await supabase.from('despachos').delete().eq('cotizacion_id', id);
    if (despachoError) {
      console.error('Error eliminando despachos asociados:', despachoError);
      alert('Error al eliminar despachos relacionados: ' + despachoError.message);
      return;
    }

    // 2. Delete the quotation
    const { error } = await supabase.from('cotizaciones').delete().eq('id', id);
    if (error) {
      console.error('Error eliminando cotización:', error);
      alert('Error al eliminar cotización: ' + error.message);
      return;
    }
    
    // 3. Update local state
    setCotizaciones(prev => prev.filter(c => c.id !== id));
    setDespachos(prev => prev.filter(d => d.cotizacionId !== id));
  };

  const addOrdenCompra = async (oc: OrdenCompra): Promise<OrdenCompra | null> => {
    if (IS_DEMO) { const newOC = { ...oc, id: crypto.randomUUID() }; setOrdenesCompra(prev => [newOC, ...prev]); return newOC; }
    // 1. Re-calculate the absolute maximum consecutive from the database to avoid collisions
    const { data: latestOCs, error: fetchError } = await supabase
      .from('ordenes_compra')
      .select('consecutivo')
      .ilike('consecutivo', 'OC-%')
      .order('consecutivo', { ascending: false })
      .limit(1);

    let finalConsecutivo = oc.consecutivo;

    if (!fetchError && latestOCs && latestOCs.length > 0) {
      const dbMax = parseInt(latestOCs[0].consecutivo.replace('OC-', ''), 10);
      const proposed = parseInt(oc.consecutivo.replace('OC-', ''), 10);
      
      // If the database has a higher or equal number, increment it
      if (!isNaN(dbMax) && dbMax >= proposed) {
        finalConsecutivo = `OC-${(dbMax + 1).toString().padStart(4, '0')}`;
        console.log(`Colisión detectada. Cambiando ${oc.consecutivo} a ${finalConsecutivo}`);
      }
    }

    const payload = {
      consecutivo: finalConsecutivo,
      fecha: oc.fecha,
      proveedor_id: oc.proveedorId,
      nombre_proveedor: oc.nombreProveedor,
      items: oc.items,
      subtotal: oc.subtotal,
      iva: oc.iva,
      total: oc.total,
      moneda: oc.moneda || 'COP',
      trm: oc.trm || 0,
      condiciones_comerciales: oc.condicionesComerciales,
      observaciones: oc.observaciones,
      estado: oc.estado,
      conductor_id: oc.conductorId,
      conductor_nombre: oc.conductorNombre,
      foto_entrega: oc.fotoEntrega,
      foto_remision: oc.fotoRemision,
      georeferencia: oc.georeferencia,
      usuario_id: oc.usuarioId,
      tipo: oc.tipo || 'Recogida',
      verificada: oc.verificada || false
    };

    const { data, error } = await supabase.from('ordenes_compra').insert([payload]).select();
    if (error) {
      console.error('Error insertando Orden de Compra:', error);
      alert('Error en base de datos al añadir O.C.: ' + error.message);
      return null;
    } else if (data && data[0]) {
      const dbO = data[0];
      setOrdenesCompra(prev => [{
        ...dbO,
        proveedorId: dbO.proveedor_id,
        nombreProveedor: dbO.nombre_proveedor,
        condicionesComerciales: dbO.condiciones_comerciales,
        conductorId: dbO.conductor_id,
        conductorNombre: dbO.conductor_nombre,
        fotoEntrega: dbO.foto_entrega,
        fotoRemision: dbO.foto_remision,
        usuarioId: dbO.usuario_id,
        tipo: dbO.tipo,
        verificada: dbO.verificada,
        moneda: dbO.moneda || 'COP',
        trm: dbO.trm || 0
      } as OrdenCompra, ...prev]);

      // Trigger Email Notification for new Purchase Order
      const emailSubject = `NUEVA ORDEN DE COMPRA - ${dbO.consecutivo}`;
      const emailBody = `Hola equipo de Facturación,\n\nSe ha generado una nueva Orden de Compra:\n\n- Consecutivo: ${dbO.consecutivo}\n- Proveedor: ${dbO.nombre_proveedor}\n- Tipo: ${dbO.tipo}\n- Valor Total: $${Math.round(dbO.total).toLocaleString()}\n\nPor favor, realizar el seguimiento correspondiente.`;

      sendEmailNotification('facturacion@helpsoluciones.com.co', emailSubject, emailBody);

      return {
        ...dbO,
        proveedorId: dbO.proveedor_id,
        nombreProveedor: dbO.nombre_proveedor,
        condicionesComerciales: dbO.condiciones_comerciales,
        conductorId: dbO.conductor_id,
        conductorNombre: dbO.conductor_nombre,
        fotoEntrega: dbO.foto_entrega,
        fotoRemision: dbO.foto_remision,
        usuarioId: dbO.usuario_id,
        tipo: dbO.tipo,
        verificada: dbO.verificada,
        moneda: dbO.moneda || 'COP',
        trm: dbO.trm || 0
      } as OrdenCompra;
    }
    return null;
  };
  const updateOrdenCompra = async (oc: OrdenCompra): Promise<boolean> => {
    if (IS_DEMO) { setOrdenesCompra(prev => prev.map(i => i.id === oc.id ? oc : i)); return true; }
    console.log('Intentando actualizar OC (mapa explícito):', oc);

    // Explicit mapping to match database schema and avoid type/column issues
    const payload = {
      consecutivo: oc.consecutivo,
      fecha: oc.fecha,
      proveedor_id: oc.proveedorId,
      nombre_proveedor: oc.nombreProveedor,
      items: oc.items,
      subtotal: oc.subtotal,
      iva: oc.iva,
      total: oc.total,
      moneda: oc.moneda || 'COP',
      trm: oc.trm || 0,
      condiciones_comerciales: oc.condicionesComerciales,
      observaciones: oc.observaciones,
      estado: oc.estado,
      conductor_id: oc.conductorId,
      conductor_nombre: oc.conductorNombre,
      foto_entrega: oc.fotoEntrega,
      foto_remision: oc.fotoRemision,
      georeferencia: oc.georeferencia,
      usuario_id: oc.usuarioId,
      tipo: oc.tipo,
      verificada: oc.verificada
    };

    const { error } = await supabase.from('ordenes_compra').update(payload).eq('id', oc.id);

    if (error) {
      console.error('Error en updateOrdenCompra:', error);
      alert(`Error al actualizar Orden de Compra: ${error.message} (ID: ${oc.id})`);
      return false;
    }

    console.log('Orden de Compra actualizada con éxito:', oc.consecutivo);
    setOrdenesCompra(prev => prev.map(item => item.id === oc.id ? oc : item));
    return true;
    // Optional: alert('Estado actualizado correctamente.');
  };
  const deleteOrdenCompra = async (id: string) => {
    if (IS_DEMO) { setOrdenesCompra(prev => prev.filter(oc => oc.id !== id)); return; }
    const { error } = await supabase.from('ordenes_compra').delete().eq('id', id);
    if (!error) setOrdenesCompra(ordenesCompra.filter(oc => oc.id !== id));
  };

  const addConductor = async (c: Conductor) => {
    if (IS_DEMO) { setConductores(prev => [...prev, { ...c, id: crypto.randomUUID() }]); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, placaVehiculo, modeloVehiculo, tipoVehiculo, tarjetaPropiedad, ...cleanC } = c;
    const { data, error } = await supabase.from('conductores').insert([{
      ...cleanC,
      placa_vehiculo: c.placaVehiculo,
      modelo_vehiculo: c.modeloVehiculo,
      tipo_vehiculo: c.tipoVehiculo,
      tarjeta_propiedad: c.tarjetaPropiedad
    }]).select();
    if (error) {
      alert('Error al añadir conductor: ' + error.message);
    } else if (data) {
      const dbC = data[0];
      setConductores([...conductores, {
        ...dbC,
        placaVehiculo: dbC.placa_vehiculo,
        modeloVehiculo: dbC.modelo_vehiculo,
        tipoVehiculo: dbC.tipo_vehiculo,
        tarjetaPropiedad: dbC.tarjeta_propiedad
      } as Conductor]);
    }
  };
  const updateConductor = async (c: Conductor) => {
    if (IS_DEMO) { setConductores(prev => prev.map(i => i.id === c.id ? c : i)); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, placaVehiculo, modeloVehiculo, tipoVehiculo, tarjetaPropiedad, ...cleanC } = c;
    const { error } = await supabase.from('conductores').update({
      ...cleanC,
      placa_vehiculo: c.placaVehiculo,
      modelo_vehiculo: c.modeloVehiculo,
      tipo_vehiculo: c.tipoVehiculo,
      tarjeta_propiedad: c.tarjetaPropiedad
    }).eq('id', c.id);
    if (!error) setConductores(conductores.map(item => item.id === c.id ? c : item));
  };
  const deleteConductor = async (id: string) => {
    if (IS_DEMO) { setConductores(prev => prev.filter(c => c.id !== id)); return; }
    const { error } = await supabase.from('conductores').delete().eq('id', id);
    if (!error) setConductores(conductores.filter(c => c.id !== id));
  };

  const addUser = async (u: AppUser) => {
    if (IS_DEMO) { setUsers(prev => [...prev, { ...u, id: crypto.randomUUID() }]); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...newUser } = u;
    const { data, error } = await supabase.from('app_users').insert([newUser]).select();
    if (error) {
      alert('Error al añadir usuario: ' + error.message);
    } else if (data) {
      setUsers([...users, data[0] as AppUser]);
    }
  };
  const updateUser = async (u: AppUser) => {
    if (IS_DEMO) { setUsers(prev => prev.map(i => i.id === u.id ? u : i)); if (currentUser?.id === u.id) setCurrentUser(u); return; }
    const { error } = await supabase.from('app_users').update(u).eq('id', u.id);
    if (!error) {
      setUsers(users.map(item => item.id === u.id ? u : item));
      if (currentUser && currentUser.id === u.id) setCurrentUser(u);
    }
  };
  const deleteUser = async (id: string) => {
    if (IS_DEMO) { if (currentUser && id === currentUser.id) { alert('No puedes eliminar tu propio usuario.'); return; } setUsers(prev => prev.filter(u => u.id !== id)); return; }
    if (currentUser && id === currentUser.id) {
      alert('No puedes eliminar tu propio usuario.');
      return;
    }
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (!error) setUsers(users.filter(u => u.id !== id));
  };

  const addDevolucion = async (d: Devolucion): Promise<boolean> => {
    if (IS_DEMO) { setDevoluciones(prev => [...prev, { ...d, id: crypto.randomUUID() }]); return true; }
    const payload = {
      consecutivo: d.consecutivo,
      fecha: d.fecha,
      proveedor_id: d.proveedorId,
      nombre_proveedor: d.nombreProveedor,
      items: d.items,
      observaciones: d.observaciones,
      estado: d.estado,
      usuario_id: d.usuarioId,
      conductor_id: d.conductorId,
      conductor_nombre: d.conductorNombre
    };

    const { data, error } = await supabase.from('devoluciones').insert([payload]).select();
    if (error) {
      console.error('Error insertando devolución:', error);
      alert('Error en base de datos: ' + error.message);
      return false;
    }
    if (data && data[0]) {
      const dbD = data[0];
      setDevoluciones(prev => [...prev, {
        ...dbD,
        proveedorId: dbD.proveedor_id,
        nombreProveedor: dbD.nombre_proveedor,
        usuarioId: dbD.usuario_id,
        conductorId: dbD.conductor_id,
        conductorNombre: dbD.conductor_nombre
      } as Devolucion]);
    }
    return true;
  };

  const updateDevolucion = async (d: Devolucion) => {
    if (IS_DEMO) { setDevoluciones(prev => prev.map(i => i.id === d.id ? d : i)); return; }
    const payload = {
      proveedor_id: d.proveedorId,
      nombre_proveedor: d.nombreProveedor,
      items: d.items,
      observaciones: d.observaciones,
      estado: d.estado,
      conductor_id: d.conductorId,
      conductor_nombre: d.conductorNombre
    };

    const { error } = await supabase.from('devoluciones').update(payload).eq('id', d.id);
    if (error) {
      console.error('Error actualizando devolución:', error);
      alert('Error en base de datos: ' + error.message);
    } else {
      setDevoluciones(devoluciones.map(item => item.id === d.id ? d : item));
    }
  };

  const deleteDevolucion = async (id: string) => {
    if (IS_DEMO) { if (window.confirm('¿Está seguro de eliminar esta devolución?')) { setDevoluciones(prev => prev.filter(d => d.id !== id)); } return; }
    if (window.confirm('¿Está seguro de eliminar esta devolución?')) {
      const { error } = await supabase.from('devoluciones').delete().eq('id', id);
      if (error) {
        console.error('Error eliminando devolución:', error);
        alert('Error en base de datos: ' + error.message);
      } else {
        setDevoluciones(devoluciones.filter(d => d.id !== id));
      }
    }
  };

  const addBudget = async (b: SalesBudget) => {
    if (IS_DEMO) { setBudgets(prev => [...prev, { ...b, id: crypto.randomUUID() }]); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, usuarioId, nombreVendedor, ...cleanB } = b;
    const { error } = await supabase.from('budgets').insert([{
      ...cleanB,
      usuario_id: b.usuarioId,
      nombre_vendedor: b.nombreVendedor
    }]);
    if (!error) setBudgets([...budgets, b]);
  };
  const updateBudget = async (b: SalesBudget) => {
    if (IS_DEMO) { setBudgets(prev => prev.map(i => i.id === b.id ? b : i)); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, usuarioId, nombreVendedor, ...cleanB } = b;
    const { error } = await supabase.from('budgets').update({
      ...cleanB,
      usuario_id: b.usuarioId,
      nombre_vendedor: b.nombreVendedor
    }).eq('id', b.id);
    if (!error) setBudgets(budgets.map(item => item.id === b.id ? b : item));
  };
  const deleteBudget = async (id: string) => {
    if (IS_DEMO) { setBudgets(prev => prev.filter(b => b.id !== id)); return; }
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (!error) setBudgets(budgets.filter(b => b.id !== id));
  };

  const addVentaManual = async (v: VentaManual) => {
    if (IS_DEMO) { setVentasManuales(prev => [...prev, { ...v, id: crypto.randomUUID() }]); return; }
    const payload = {
      fecha: v.fecha,
      cliente_id: v.clienteId,
      cliente_nombre: v.clienteNombre,
      producto_id: v.productoId || null,
      producto_nombre: v.productoNombre || null,
      usuario_id: v.usuarioId,
      usuario_nombre: v.usuarioNombre,
      monto: v.monto,
      moneda: v.moneda || 'COP',
      tipo_venta: v.tipoVenta || 'Venta',
      descripcion: v.descripcion,
      costo: v.costo || 0
    };
    const { data, error } = await supabase.from('ventas_manuales').insert([payload]).select();
    if (error) {
      alert('Error al registrar venta manual: ' + error.message);
    } else if (data && data[0]) {
      const dbV = data[0];
      setVentasManuales(prev => [...prev, {
        ...dbV,
        clienteId: dbV.cliente_id,
        clienteNombre: dbV.cliente_nombre,
        usuarioId: dbV.usuario_id,
        usuarioNombre: dbV.usuario_nombre,
        tipoVenta: dbV.tipo_venta || 'Venta'
      } as VentaManual]);
    }
  };

  const addVentasManuales = async (ventasArr: VentaManual[]) => {
    if (IS_DEMO) { setVentasManuales(prev => [...prev, ...ventasArr.map(v => ({ ...v, id: v.id || crypto.randomUUID() }))]); return; }
    const payloads = ventasArr.map(v => ({
      fecha: v.fecha,
      cliente_id: v.clienteId,
      cliente_nombre: v.clienteNombre,
      producto_id: v.productoId || null,
      producto_nombre: v.productoNombre || null,
      usuario_id: v.usuarioId,
      usuario_nombre: v.usuarioNombre,
      monto: v.monto,
      moneda: v.moneda || 'COP',
      tipo_venta: v.tipoVenta || 'Venta',
      descripcion: v.descripcion,
      costo: v.costo || 0
    }));

    const { data, error } = await supabase.from('ventas_manuales').insert(payloads).select();
    if (error) {
      alert('Error al registrar lote de ventas: ' + error.message);
    } else if (data) {
      const dbVentas = data.map((dbV: any) => ({
        ...dbV,
        clienteId: dbV.cliente_id,
        clienteNombre: dbV.cliente_nombre,
        usuarioId: dbV.usuario_id,
        usuarioNombre: dbV.usuario_nombre
      } as VentaManual));
      setVentasManuales(prev => [...prev, ...dbVentas]);
    }
  };

  const updateVentaManual = async (v: VentaManual) => {
    if (IS_DEMO) { setVentasManuales(prev => prev.map(i => i.id === v.id ? v : i)); return; }
    const payload = {
      fecha: v.fecha,
      cliente_id: v.clienteId,
      cliente_nombre: v.clienteNombre,
      producto_id: v.productoId || null,
      producto_nombre: v.productoNombre || null,
      usuario_id: v.usuarioId,
      usuario_nombre: v.usuarioNombre,
      monto: v.monto,
      moneda: v.moneda || 'COP',
      tipo_venta: v.tipoVenta || 'Venta',
      descripcion: v.descripcion,
      costo: v.costo || 0
    };

    const { error } = await supabase.from('ventas_manuales').update(payload).eq('id', v.id);
    if (error) {
      alert('Error al actualizar venta manual: ' + error.message);
    } else {
      setVentasManuales(prev => prev.map(item => item.id === v.id ? v : item));
    }
  };

  const deleteVentaManual = async (id: string) => {
    if (IS_DEMO) { setVentasManuales(prev => prev.filter(v => v.id !== id)); return; }
    const { error } = await supabase.from('ventas_manuales').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar venta manual: ' + error.message);
    } else {
      setVentasManuales(prev => prev.filter(v => v.id !== id));
    }
  };

  const updateLeadWeb = async (lead: ClienteWeb) => {
    if (IS_DEMO) { setClientesWeb(prev => prev.map(l => l.id === lead.id ? lead : l)); return; }
    const { error } = await supabase.from('clientes_web').update({ estado: lead.estado }).eq('id', lead.id);
    if (error) {
      alert('Error actualizando estado del Lead: ' + error.message);
    } else {
      setClientesWeb(prev => prev.map(l => l.id === lead.id ? lead : l));
    }
  };

  const onUpdateRegistroStatus = async (id: string, newStatus: RegistroPendiente['estado']) => {
    if (IS_DEMO) { setRegistros(prev => prev.map(r => r.id === id ? { ...r, estado: newStatus } : r)); return; }
    const { error } = await supabase.from('registros_pendientes').update({ estado: newStatus }).eq('id', id);
    if (error) {
      alert('Error actualizando estado del Registro: ' + error.message);
    } else {
      setRegistros(prev => prev.map(r => r.id === id ? { ...r, estado: newStatus } : r));
    }
  };

  const onDeleteRegistro = async (id: string) => {
    if (IS_DEMO) { setRegistros(prev => prev.filter(r => r.id !== id)); alert('Registro eliminado.'); return; }
    const { error } = await supabase.from('registros_pendientes').delete().eq('id', id);
    if (error) {
      alert('Error eliminando el Registro: ' + error.message);
    } else {
      setRegistros(prev => prev.filter(r => r.id !== id));
      alert('Registro eliminado correctamente.');
    }
  };

  const addPropuesta = async (p: Omit<Propuesta, 'id' | 'consecutivo'>) => {
    if (IS_DEMO) {
      const newP: Propuesta = { id: crypto.randomUUID(), consecutivo: `P-${String(propuestas.length + 1).padStart(3, '0')}`, ...p };
      setPropuestas(prev => [newP, ...prev]);
      alert('Propuesta guardada (modo demo).');
      return;
    }
    const { data: lastP } = await supabase
      .from('propuestas')
      .select('consecutivo')
      .order('consecutivo', { ascending: false })
      .limit(1);
    const parsed = lastP && lastP.length > 0 ? parseInt(lastP[0].consecutivo.replace('P-', ''), 10) : 0;
    const nextNum = isNaN(parsed) ? 1 : parsed + 1;
    const consecutivo = `P-${String(nextNum).padStart(3, '0')}`;

    const { data, error } = await supabase.from('propuestas').insert([{
      consecutivo,
      fecha: p.fecha,
      cliente_id: p.clienteId,
      cliente_nombre: p.clienteNombre,
      cliente_nit: p.clienteNit,
      cliente_ciudad: p.clienteCiudad,
      cliente_contacto: p.clienteContacto,
      tipo_servicio_id: p.tipoServicioId,
      tipo_servicio_nombre: p.tipoServicioNombre,
      moneda: p.moneda,
      valor: p.valor,
      items: p.items || [],
      incluye_iva: p.incluyeIva,
      vigencia: p.vigencia,
      observaciones: p.observaciones,
      estado: p.estado,
      comercial_nombre: p.comercialNombre,
      comercial_telefono: p.comercialTelefono,
      usuario_id: p.usuarioId,
      objetivo: p.objetivo || '',
      personal: p.personal || [],
      visitas: p.visitas || [],
      obligaciones_cliente: p.obligacionesCliente || [],
    }]).select();

    if (error) {
      alert('Error al guardar propuesta: ' + error.message);
      return;
    }
    if (data) {
      const dbP = data[0];
      setPropuestas(prev => [{
        id: dbP.id, consecutivo: dbP.consecutivo, fecha: dbP.fecha,
        clienteId: dbP.cliente_id, clienteNombre: dbP.cliente_nombre,
        clienteNit: dbP.cliente_nit, clienteCiudad: dbP.cliente_ciudad,
        clienteContacto: dbP.cliente_contacto,
        tipoServicioId: dbP.tipo_servicio_id, tipoServicioNombre: dbP.tipo_servicio_nombre,
        moneda: dbP.moneda, valor: dbP.valor,
        items: dbP.items || [],
        incluyeIva: !!dbP.incluye_iva,
        vigencia: dbP.vigencia, observaciones: dbP.observaciones,
        estado: dbP.estado, comercialNombre: dbP.comercial_nombre,
        comercialTelefono: dbP.comercial_telefono, usuarioId: dbP.usuario_id,
        objetivo: dbP.objetivo || '',
        personal: dbP.personal || [],
        visitas: dbP.visitas || [],
        obligacionesCliente: dbP.obligaciones_cliente || [],
      } as Propuesta, ...prev]);
      alert(`Propuesta ${dbP.consecutivo} guardada correctamente.`);
    }
  };

  const updatePropuesta = async (p: Propuesta) => {
    if (IS_DEMO) { setPropuestas(prev => prev.map(i => i.id === p.id ? p : i)); return; }
    const { error } = await supabase.from('propuestas').update({
      fecha: p.fecha,
      cliente_id: p.clienteId, cliente_nombre: p.clienteNombre,
      cliente_nit: p.clienteNit, cliente_ciudad: p.clienteCiudad,
      cliente_contacto: p.clienteContacto,
      tipo_servicio_id: p.tipoServicioId, tipo_servicio_nombre: p.tipoServicioNombre,
      moneda: p.moneda, valor: p.valor,
      items: p.items || [],
      incluye_iva: p.incluyeIva,
      vigencia: p.vigencia, observaciones: p.observaciones,
      estado: p.estado, comercial_nombre: p.comercialNombre,
      comercial_telefono: p.comercialTelefono,
      objetivo: p.objetivo || '',
      personal: p.personal || [],
      visitas: p.visitas || [],
      obligaciones_cliente: p.obligacionesCliente || [],
    }).eq('id', p.id);

    if (error) { alert('Error al actualizar propuesta: ' + error.message); return; }
    setPropuestas(prev => prev.map(item => item.id === p.id ? p : item));
  };

  const deletePropuesta = async (id: string) => {
    if (IS_DEMO) { setPropuestas(prev => prev.filter(p => p.id !== id)); return; }
    const { error } = await supabase.from('propuestas').delete().eq('id', id);
    if (!error) setPropuestas(prev => prev.filter(p => p.id !== id));
  };

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'General', subtitle: 'Resumen del mes' },
    { id: 'leads-web', label: 'Leads Web', icon: Sparkles, section: 'Comercial', subtitle: 'Prospectos que llegan desde la web' },
    { id: 'registros-web', label: 'Registros Web', icon: ClipboardList, section: 'Comercial', subtitle: 'Solicitudes de registro pendientes' },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText, section: 'Comercial', subtitle: 'Crear y enviar cotizaciones' },
    { id: 'propuestas', label: 'Propuestas', icon: FilePenLine, section: 'Comercial', subtitle: 'Propuestas de servicio' },
    { id: 'clientes', label: 'Clientes', icon: Users, section: 'Comercial', subtitle: 'Directorio de clientes, sedes y contactos' },
    { id: 'productos', label: 'Productos', icon: Package, section: 'Comercial', subtitle: 'Catálogo local e inventario Siigo' },
    { id: 'vendedores', label: 'Vendedores', icon: UserCheck, section: 'Comercial', subtitle: 'Metas y cumplimiento por asesor' },
    { id: 'ordenes-compra', label: 'Órdenes de Compra', icon: ShoppingCart, section: 'Operaciones', subtitle: 'Compras a proveedores' },
    { id: 'proveedores', label: 'Proveedores', icon: Factory, section: 'Operaciones', subtitle: 'Directorio de proveedores' },
    { id: 'logistica', label: 'Logística', icon: Truck, section: 'Operaciones', subtitle: 'Despachos, recogidas y devoluciones' },
    { id: 'conductores', label: 'Conductores', icon: IdCard, section: 'Operaciones', subtitle: 'Conductores y vehículos' },
    { id: 'remisiones', label: 'Remisiones', icon: FileStack, section: 'Operaciones', subtitle: 'Remisiones de entrega' },
    { id: 'reparaciones', label: 'Reparaciones', icon: Wrench, section: 'Operaciones', subtitle: 'Equipos en servicio técnico' },
    { id: 'alquileres', label: 'Alquileres', icon: Laptop, section: 'Operaciones', subtitle: 'Equipos en alquiler' },
    { id: 'facturacion', label: 'Facturación', icon: Receipt, section: 'Finanzas', subtitle: 'Despachos por facturar' },
    { id: 'ventas-manuales', label: 'Ventas Manuales', icon: Banknote, section: 'Finanzas', subtitle: 'Ventas registradas fuera de cotización' },
    { id: 'cartera', label: 'Cartera', icon: Wallet, section: 'Finanzas', subtitle: 'Facturas con saldo pendiente (Siigo)' },
    { id: 'comisiones', label: 'Comisiones', icon: Percent, section: 'Finanzas', subtitle: 'Utilidad y comisiones por vendedor' },
    { id: 'informes', label: 'Informes', icon: ChartColumn, section: 'Informes', subtitle: 'Rendimiento comercial del periodo' },
    { id: 'agente-informes', label: 'Agente de Informes', icon: Bot, section: 'Informes', subtitle: 'Informes generados con IA' },
    { id: 'admin', label: 'Administración', icon: Settings, section: 'Administración', subtitle: 'Usuarios, permisos y presupuestos' },
  ].filter(item => {
    if (item.id === 'productos') return true; // Everyone can see/edit products
    if (item.id === 'cartera' && (currentUser?.rol === 'Admin' || currentUser?.rol === 'Comercial')) return true;
    if ((item.id === 'facturacion' || item.id === 'ventas-manuales' || item.id === 'leads-web' || item.id === 'registros-web' || item.id === 'vendedores' || item.id === 'informes' || item.id === 'remisiones' || item.id === 'comisiones' || item.id === 'propuestas' || item.id === 'ordenes-compra') && currentUser?.rol === 'Admin') return true;
    if (item.id === 'propuestas' && (currentUser?.rol === 'Admin' || currentUser?.rol?.toLowerCase() === 'admin' || currentUser?.rol === 'Comercial' || currentUser?.rol?.toLowerCase() === 'comercial' || currentUser?.permisos.includes('propuestas'))) return true;
    if (item.id === 'leads-web' && (currentUser?.rol === 'Comercial' || currentUser?.rol?.toLowerCase() === 'comercial')) return true;
    return currentUser?.permisos.includes(item.id);
  });

  const handleLogin = (user: AppUser) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem('hs_is_logged_in', 'true');
    localStorage.setItem('hs_current_user', JSON.stringify(user));
  };

  const handleAddAlquiler = async (a: Alquiler) => {
    if (IS_DEMO) { setAlquileres(prev => [...prev, { ...a, id: crypto.randomUUID() }]); return true; }
    const payload = {
      descripcion: a.descripcion,
      serial: a.serial,
      foto_url: a.fotoUrl,
      estado: a.estado,
      cliente_id: a.clienteId,
      fecha_inicio: a.fechaInicio,
      valor_mensual: a.valorMensual,
      usuario_id: a.usuarioId,
      disco_duro: a.discoDuro,
      memoria_ram: a.memoriaRam,
      procesador: a.procesador,
      generacion: a.generacion
    };
    const { data, error } = await supabase.from('alquileres').insert([payload]).select();
    if (error) { alert('Error guardando equipo: ' + error.message); return false; }
    if (data && data[0]) {
      const dbA = data[0];
      setAlquileres(prev => [...prev, {
        ...dbA,
        clienteId: dbA.cliente_id || dbA.clienteId,
        clienteNombre: dbA.cliente_nombre || dbA.clienteNombre,
        fechaInicio: dbA.fecha_inicio || dbA.fechaInicio,
        valorMensual: dbA.valor_mensual || dbA.valorMensual,
        usuarioId: dbA.usuario_id || dbA.usuarioId,
        discoDuro: dbA.disco_duro || dbA.discoDuro,
        memoriaRam: dbA.memoria_ram || dbA.memoriaRam
      } as Alquiler]);
    }
    return true;
  }

  const handleUpdateAlquiler = async (a: Alquiler) => {
    if (IS_DEMO) { setAlquileres(prev => prev.map(i => i.id === a.id ? a : i)); return true; }
    const payload = {
      descripcion: a.descripcion,
      serial: a.serial,
      foto_url: a.fotoUrl,
      estado: a.estado,
      cliente_id: a.clienteId,
      fecha_inicio: a.fechaInicio,
      valor_mensual: a.valorMensual,
      usuario_id: a.usuarioId,
      disco_duro: a.discoDuro,
      memoria_ram: a.memoriaRam,
      procesador: a.procesador,
      generacion: a.generacion
    };
    const { error } = await supabase.from('alquileres').update(payload).eq('id', a.id);
    if (error) { alert('Error actualizando equipo: ' + error.message); return false; }
    fetchInitialData(); // Re-fetch all data to update state
    return true;
  }

  const handleDeleteAlquiler = async (id: string) => {
    if (IS_DEMO) { setAlquileres(prev => prev.filter(i => i.id !== id)); return; }
    const { error } = await supabase.from('alquileres').delete().eq('id', id);
    if (error) alert('Error eliminando equipo: ' + error.message);
    else fetchInitialData(); // Re-fetch all data to update state
  }

  const handleLogout = () => {
    if (IS_DEMO) return;
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('hs_is_logged_in');
    localStorage.removeItem('hs_current_user');
  };

  const renderContent = () => {
    if (!currentUser) return null;

    // Filter clients: Admins see all, Comercials see only theirs (or clients without user for backward compatibility if desired, but here we strictly match)
    const filteredClientes = currentUser.rol === 'Admin'
      ? clientes
      : clientes.filter(c => c.usuarioId === currentUser.id);

    switch (activeTab) {
      case 'agente-informes':
        return <AgenteInformesModule clientes={clientes} currentUser={currentUser} />;
      case 'leads-web':
        return <LeadsWebModule leads={clientesWeb} onUpdateLead={updateLeadWeb} currentUser={currentUser} />;
      case 'registros-web':
        return <RegistrosWeb registros={registros} onUpdateStatus={onUpdateRegistroStatus} onDelete={onDeleteRegistro} currentUser={currentUser} />;
      case 'clientes':
        return <ClientesModule clientes={filteredClientes} onAdd={addCliente} onUpdate={updateCliente} onDelete={deleteCliente} userRole={currentUser?.rol || ''} />;
      case 'cotizaciones':
        return <CotizacionesModule
          clientes={filteredClientes}
          productos={productos}
          cotizaciones={cotizaciones}
          onAddQuote={addCotizacion}
          onSendWhatsApp={sendWhatsAppNotification}
          currentUser={currentUser}
          currentTrm={currentTrm}
        />;
      case 'propuestas':
        const filteredPropuestas = currentUser.rol === 'Admin'
          ? propuestas
          : propuestas.filter(p => p.usuarioId === currentUser.id);
        return <PropuestasModule
          propuestas={filteredPropuestas}
          clientes={clientes}
          productos={productos}
          currentUser={currentUser}
          onAdd={addPropuesta}
          onUpdate={updatePropuesta}
          onDelete={deletePropuesta}
        />;
      case 'ordenes-compra':
        const filteredOCsToModule = currentUser.rol === 'Admin'
          ? ordenesCompra
          : ordenesCompra.filter(oc => oc.usuarioId === currentUser.id);

        return <OrdenesCompraModule
          proveedores={proveedores}
          productos={productos}
          alquileres={alquileres}
          ordenesCompra={filteredOCsToModule}
          allOrdenesCompra={ordenesCompra}
          onAddOC={addOrdenCompra}
          onUpdateOC={updateOrdenCompra}
          onDeleteOC={deleteOrdenCompra}
          currentUser={currentUser}
          currentTrm={currentTrm}
        />;
      case 'productos':
        return <ProductosModule productos={productos} onAdd={addProducto} onUpdate={updateProducto} onDelete={deleteProducto} currentTrm={currentTrm} />;
      case 'proveedores':
        return <ProveedoresModule proveedores={proveedores} onAdd={addProveedor} onUpdate={updateProveedor} onDelete={deleteProveedor} />;
      case 'conductores':
        return <ConductoresModule
          conductores={conductores}
          despachos={despachos}
          ordenesCompra={ordenesCompra}
          devoluciones={devoluciones}
          reparaciones={reparaciones}
          proveedores={proveedores}
          clientes={clientes}
          onAdd={addConductor}
          onUpdate={updateConductor}
          onDelete={deleteConductor}
          onUpdateDespacho={updateDespacho}
          onUpdateOC={updateOrdenCompra}
          onUpdateDevolucion={updateDevolucion}
          onUpdateReparacion={updateReparacion}
          onSendWhatsApp={sendWhatsAppNotification}
        />;
      case 'alquileres':
        return <AlquileresModule
          alquileres={alquileres}
          clientes={clientes}
          onAddAlquiler={handleAddAlquiler}
          onUpdateAlquiler={handleUpdateAlquiler}
          onDeleteAlquiler={handleDeleteAlquiler}
          currentUser={currentUser}
        />;
      case 'logistica':
        return <LogisticaModule
          despachos={despachos}
          ordenesCompra={ordenesCompra}
          devoluciones={devoluciones}
          conductores={conductores}
          proveedores={proveedores}
          clientes={clientes}
          productos={productos}
          currentUser={currentUser!}
          onUpdateDespacho={updateDespacho}
          onDeleteDespacho={deleteDespacho}
          onUpdateOC={updateOrdenCompra}
          onAddOC={addOrdenCompra}
          onAddDevolucion={addDevolucion}
          onUpdateDevolucion={updateDevolucion}
          onDeleteDevolucion={deleteDevolucion}
          reparaciones={reparaciones}
          onUpdateReparacion={updateReparacion}
          onDeleteOC={deleteOrdenCompra}
          users={users}
          cotizaciones={cotizaciones}
        />;
      case 'reparaciones':
        return <ReparacionesModule
          reparaciones={reparaciones}
          clientes={clientes}
          proveedores={proveedores}
          onAdd={addReparacion}
          onUpdate={updateReparacion}
          onDelete={deleteReparacion}
        />;
      case 'facturacion':
        return <FacturacionModule
          despachos={despachos}
          cotizaciones={cotizaciones}
          clientes={clientes}
          productos={productos}
          onUpdateDespacho={updateDespacho}
          onUpdateQuote={updateCotizacion}
        />;
      case 'ventas-manuales':
        return <VentasManualesModule
          ventas={ventasManuales}
          clientes={clientes}
          productos={productos}
          users={users}
          currentUser={currentUser}
          onAdd={addVentaManual}
          onAddBulk={addVentasManuales}
          onUpdate={updateVentaManual}
          onDelete={deleteVentaManual}
        />;
      case 'remisiones':
        return <RemisionesModule 
          clientes={clientes} 
          productos={productos} 
          currentUser={currentUser} 
        />;
      case 'cartera':
        return <CarteraModule currentUser={currentUser!} clientes={clientes} />;
      case 'comisiones':
        return <ComisionesModule
          users={users}
          cotizaciones={cotizaciones}
          despachos={despachos}
          ventasManuales={ventasManuales}
          alquileres={alquileres}
        />;
      case 'informes':
        const restrictedQuotes = currentUser.rol === 'Admin'
          ? cotizaciones
          : cotizaciones.filter(c => c.usuarioId === currentUser.id);
        const restrictedManualSales = currentUser.rol === 'Admin'
          ? ventasManuales
          : ventasManuales.filter(v => v.usuarioId === currentUser.id);
        return <InformesModule
          cotizaciones={restrictedQuotes}
          ventasManuales={restrictedManualSales}
          budgets={budgets}
          currentUser={currentUser}
          onUpdateQuote={updateCotizacion}
          onDeleteQuote={deleteCotizacion}
          clientes={clientes}
          productos={productos}
          proveedores={proveedores}
          despachos={despachos}
          ordenesCompra={ordenesCompra}
          users={users}
          alquileres={alquileres}
        />;
      case 'admin':
        return <AdminModule
          users={users}
          currentUser={currentUser}
          onAdd={addUser}
          onUpdate={updateUser}
          onDelete={deleteUser}
          onSwitchUser={setCurrentUser}
          budgets={budgets}
          onAddBudget={addBudget}
          onUpdateBudget={updateBudget}
          onDeleteBudget={deleteBudget}
          onExportAll={exportAllData}
        />;
      case 'vendedores':
        return <VendedoresModule
          users={users}
          budgets={budgets}
          cotizaciones={cotizaciones}
          ventasManuales={ventasManuales}
          despachos={despachos}
          ordenesCompra={ordenesCompra}
          currentUser={currentUser}
        />;
      case 'dashboard':
        const dashQuotes = currentUser.rol === 'Admin'
          ? cotizaciones
          : cotizaciones.filter(c => c.usuarioId === currentUser.id);

        const dashDespachos = currentUser.rol === 'Admin'
          ? despachos
          : despachos.filter(d => {
              const isOwner = d.usuarioId === currentUser.id;
              const cot = cotizaciones.find(c => c.id === d.cotizacionId);
              const isQuoteOwner = cot?.usuarioId === currentUser.id;
              return isOwner || isQuoteOwner;
          });

        const now = new Date();
        const curMonth = now.getMonth();
        const curYear = now.getFullYear();

        const prevMonthDate = new Date(curYear, curMonth - 1, 1);
        const prevMonth = prevMonthDate.getMonth();
        const prevYear = prevMonthDate.getFullYear();

        const getMonthQuotes = (m: number, y: number) => dashQuotes.filter(c => {
          if (!c.fecha) return false;
          const [quoteY, quoteM] = c.fecha.split('-').map(Number);
          return quoteY === y && (quoteM - 1) === m;
        });

        const curMonthQuotes = getMonthQuotes(curMonth, curYear);
        const prevMonthQuotes = getMonthQuotes(prevMonth, prevYear);

        const growth = prevMonthQuotes.length > 0
          ? ((curMonthQuotes.length - prevMonthQuotes.length) / prevMonthQuotes.length) * 100
          : (curMonthQuotes.length > 0 ? 100 : 0);

        const wonQuotesMonth = curMonthQuotes.filter(c => c.estado === 'Ganado');
        const completedTotal = dashDespachos.filter(d => d.estado === 'Entregado').length;
        const activeLogistics = dashDespachos.filter(d => d.estado !== 'Entregado').length;

        const monthLabel = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
        const ingresosMes = wonQuotesMonth.reduce((acc, c) => acc + c.total, 0);
        const fmtCOP = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;

        const activities: { id: string; date: string; tipo: 'Cotización' | 'Venta' | 'Factura' | 'Envío'; titulo: string; detalle: string; valor?: number }[] = [];
        curMonthQuotes.forEach(c => {
          if (c.fecha) activities.push({
            id: 'q-' + c.id, date: c.fecha,
            tipo: c.estado === 'Ganado' ? 'Venta' : 'Cotización',
            titulo: `${c.estado === 'Ganado' ? 'Venta cerrada' : 'Cotización'} ${c.consecutivo}`,
            detalle: c.clienteNombre, valor: c.total,
          });
        });
        dashDespachos.forEach(d => {
          if (d.facturado && d.fechaFacturado) {
            const [y, m] = d.fechaFacturado.split('-').map(Number);
            if (y === curYear && (m - 1) === curMonth) activities.push({ id: 'f-' + d.id, date: d.fechaFacturado, tipo: 'Factura', titulo: `Factura ${d.consecutivoCotizacion}`, detalle: d.clienteNombre, valor: d.total });
          }
          if (d.fechaSolicitud) {
            const [y, m] = d.fechaSolicitud.split('-').map(Number);
            if (y === curYear && (m - 1) === curMonth) activities.push({ id: 's-' + d.id, date: d.fechaSolicitud, tipo: 'Envío', titulo: `Envío ${d.consecutivoCotizacion}`, detalle: `${d.clienteNombre} · ${d.estado}` });
          }
        });
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const TIPO_PILL: Record<string, string> = { 'Venta': 'pill pill-success', 'Factura': 'pill pill-success', 'Cotización': 'pill pill-info', 'Envío': 'pill pill-warning' };

        const kpis = [
          { label: 'Cotizaciones del mes', value: String(curMonthQuotes.length), trend: `${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth).toFixed(0)}% vs mes anterior`, color: growth >= 0 ? 'var(--success)' : 'var(--error)' },
          { label: 'Ventas cerradas', value: fmtCOP(ingresosMes), trend: `${wonQuotesMonth.length} cotizaci${wonQuotesMonth.length === 1 ? 'ón ganada' : 'ones ganadas'}`, color: 'var(--success)' },
          { label: 'Envíos entregados', value: String(completedTotal), trend: 'Histórico', color: 'var(--primary-blue)' },
          { label: 'Envíos en curso', value: String(activeLogistics), trend: activeLogistics ? 'Pendientes de entrega' : 'Todo entregado', color: activeLogistics ? 'var(--warning)' : 'var(--success)' },
        ];

        const shortcuts = [
          { id: 'cotizaciones', icon: FileText, label: 'Cotizaciones', value: `${curMonthQuotes.length} este mes`, cta: 'Nueva cotización' },
          { id: 'logistica', icon: Truck, label: 'Logística', value: `${activeLogistics} envío${activeLogistics === 1 ? '' : 's'} en curso`, cta: 'Ver despachos' },
        ].filter(s => menuItems.some(m => m.id === s.id));

        return (
          <div className="dashboard-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)' }}>Hola, {currentUser.nombre.split(' ')[0]}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 2 }}>Este es el resumen de {monthLabel}.</p>
            </div>

            <div className="stats-grid">
              {kpis.map(k => (
                <div key={k.label} className="kpi-tile">
                  <span className="kpi-stripe" style={{ background: k.color }} />
                  <p className="kpi-label">{k.label}</p>
                  <p className="kpi-value">{k.value}</p>
                  <p className="kpi-trend" style={{ color: k.color }}>{k.trend}</p>
                </div>
              ))}
            </div>

            {shortcuts.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {shortcuts.map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.id} className="shortcut-card">
                      <div className="shortcut-icon"><Icon size={22} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="kpi-label">{s.label}</span>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>{s.value}</div>
                      </div>
                      <button className="shortcut-link" onClick={() => setActiveTab(s.id)}>{s.cta} <ArrowRight size={14} /></button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="card table-card">
              <div className="panel-head">
                <div>
                  <h3>Movimientos recientes</h3>
                  <p>Cotizaciones, facturas y envíos de {monthLabel}</p>
                </div>
              </div>
              {activities.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No hay movimientos registrados este mes.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Fecha</th><th>Movimiento</th><th>Cliente</th><th>Tipo</th><th className="num">Valor</th></tr>
                  </thead>
                  <tbody>
                    {activities.slice(0, 10).map(a => (
                      <tr key={a.id}>
                        <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{a.date}</td>
                        <td style={{ fontWeight: 600 }}>{a.titulo}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{a.detalle}</td>
                        <td><span className={TIPO_PILL[a.tipo]}>{a.tipo}</span></td>
                        <td className="num" style={{ fontWeight: 700 }}>{a.valor !== undefined ? fmtCOP(a.valor) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="card">
            <h3>Módulo {menuItems.find(i => i.id === activeTab)?.label}</h3>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              Este módulo está en proceso de construcción.
            </p>
          </div>
        );
    }
  }

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function HelpModal() {
    if (!showHelpModal) return null;

    const roleContent: Record<string, { title: string, steps: string[] }> = {
      'Admin': {
        title: 'Manual de Administrador',
        steps: [
          'Gestión de Usuarios: Cree y asigne permisos a módulos específicos.',
          'Dashboard Global: Monitoree el crecimiento y actividad de toda la empresa.',
          'Autorización: Apruebe cotizaciones con margen inferior al 10% en el módulo de Informes.',
          'Base de Datos: Verifique el estado de conexión en tiempo real en el sidebar.'
        ]
      },
      'Comercial': {
        title: 'Manual de Asesor Comercial',
        steps: [
          'Clientes: Cree y gestione sus propios clientes (visibilidad restringida).',
          'Cotizaciones: Genere PDFs profesionales y envíe recordatorios por WhatsApp.',
          'Margen: Si su cotización tiene <10% de utilidad, solicite aprobación al gerente.',
          'Dashboard: Vea sus metas de ventas y cumplimiento mensual.'
        ]
      },
      'Logistica': {
        title: 'Manual de Operaciones Logísticas',
        steps: [
          'Hoja de Ruta: Asigne pedidos y recogidas a conductores disponibles.',
          'Recogidas Manuales: Registre mercancía que llega sin cita previa.',
          'Seguimiento: Monitoree en tiempo real las fotos de entrega y remisiones subidas por los conductores.',
          'Informes: Filtre operaciones por asesor para medir efectividad.'
        ]
      },
      'Tecnico': {
        title: 'Manual de Servicio Técnico',
        steps: [
          'Reparaciones: Registre el ingreso de equipos con fotos y seriales.',
          'Estado: Actualice el progreso de la reparación para informar al cliente.',
          'Historial: Consulte reparaciones previas por cliente o equipo.'
        ]
      }
    };

    const content = roleContent[currentUser?.rol || 'Comercial'];

    return (
      <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
        <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>{content.title}</h2>
            <button onClick={() => setShowHelpModal(false)} className="btn-action" aria-label="Cerrar"><X size={18} /></button>
          </div>
          <ul style={{ paddingLeft: '1.2rem', lineHeight: '1.6' }}>
            {content.steps.map((s, i) => <li key={i} style={{ marginBottom: '0.8rem' }}>{s}</li>)}
          </ul>
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button className="btn-success" onClick={() => setShowHelpModal(false)}>Entendido</button>
          </div>
        </div>
      </div>
    );
  }

  // Detect Public Form Mode
  const urlParams = new URLSearchParams(window.location.search);
  const isPublicForm = urlParams.get('form') === 'registro';

  if (isPublicForm) {
    return (
      <div className="public-form-container" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
        <RegistrationForm />
      </div>
    );
  }

  const activeItem = menuItems.find(i => i.id === activeTab) || menuItems[0];
  const ROL_LABEL: Record<string, string> = { Admin: 'Administrador', Comercial: 'Comercial', Logistica: 'Logística', Tecnico: 'Técnico' };
  const initials = (currentUser?.nombre || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const isOnline = IS_DEMO || realtimeStatus === 'En Línea';

  const goTo = (id: string) => {
    setActiveTab(id);
    setMenuOpen(false);
  };

  return isLoggedIn ? (
    <div className="app-container hs">
      <HelpModal />

      {menuOpen && <div className="sb-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Menú principal">
        <div className="sb-brand">
          <div className="sb-plate"><img src={logoBase64} alt="Help Soluciones" /></div>
          <div style={{ minWidth: 0 }}>
            <div className="sb-name">HelpiCRM</div>
            <button
              className="sb-status"
              title="Click para reconectar"
              onClick={() => window.location.reload()}
            >
              <span className="sb-dot" style={{ background: isOnline ? '#4ade80' : '#fb7185' }} />
              {IS_DEMO ? 'Modo demo' : (isOnline ? 'En línea' : `DB: ${realtimeStatus}`)} · v2.1
            </button>
          </div>
          <button className="sb-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><X size={18} /></button>
        </div>

        <nav className="nav-menu">
          {MENU_SECTIONS.map(section => {
            const items = menuItems.filter(i => i.section === section);
            if (items.length === 0) return null;
            return (
              <div key={section}>
                {section !== 'General' && <div className="sb-title">{section}</div>}
                <div className="sb-items">
                  {items.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => goTo(item.id)}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="sb-user-name">{currentUser?.nombre}</div>
              <div className="sb-user-role">{ROL_LABEL[currentUser?.rol || ''] || currentUser?.rol}</div>
            </div>
          </div>
          <div className="sb-actions">
            <button onClick={() => setShowHelpModal(true)}><CircleQuestionMark size={14} /> Ayuda</button>
            <button onClick={handleLogout}><LogOut size={14} /> Salir</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {IS_DEMO && (
          <div className="demo-banner">
            Modo demo — datos de ejemplo. Help Soluciones Informáticas HSI SAS · licitacioneshsi@helpsoluciones.com.co · 304 335 8650
          </div>
        )}
        <div className="mobile-bar">
          <button className="mb-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><Menu size={20} /></button>
          <div className="sb-plate"><img src={logoBase64} alt="" /></div>
          <div className="mb-app">
            <span className="mb-name">HelpiCRM</span>
            <span className="mb-ver">v2.1</span>
          </div>
          <div className="mb-company">
            <span className="mb-company-name">Help Soluciones</span>
            <span className="mb-company-sub">Informáticas</span>
          </div>
        </div>
        <header className="top-bar">
          <div style={{ minWidth: 0 }}>
            <h1>{activeItem?.label || 'Dashboard'}</h1>
            {activeItem?.subtitle && <p className="page-sub">{activeItem.subtitle}</p>}
          </div>
          <div className="user-info">
            <span className="user-role">{ROL_LABEL[currentUser?.rol || ''] || currentUser?.rol}</span>
            <span className="user-name" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{currentUser?.nombre}</span>
          </div>
        </header>
        <div className="content-area">
          {renderContent()}
        </div>
        <AIAssistant />
      </main>
    </div>
  ) : (
    <Login users={users} onLogin={handleLogin} />
  );
}

export default App
