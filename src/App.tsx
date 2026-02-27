import { useState, useEffect } from 'react'
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
import { supabase } from './lib/supabaseClient'

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
export interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  coordenadas?: string;
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
  history: { date: string; price: number }[];
}

export interface OrdenCompraItem {
  id: string;
  productoId: string;
  nombreProducto: string;
  numPart: string;
  cantidad: number;
  precioUnitario: number;
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
  condicionesComerciales: string;
  observaciones: string;
  estado: 'Pendiente' | 'Recogido' | 'En Bodega';
  conductorId?: string;
  conductorNombre?: string;
  fotoEntrega?: string;
  fotoRemision?: string;
  georeferencia?: string;
  usuarioId: string;
}

export interface CotizacionItem {
  id: string;
  productoId: string;
  proveedorId: string;
  unidad: string;
  cantidad: number;
  costoUnitario: number;
  utilidad: number;
  iva: number;
}

export interface Cotizacion {
  id: string;
  fecha: string;
  clienteId: string;
  clienteNombre: string;
  consecutivo: string;
  items: CotizacionItem[];
  subtotal: number;
  iva: number;
  total: number;
  ejecutivo: string;
  ejecutivoEmail: string;
  ejecutivoTelefono?: string;
  usuarioId: string;
  estado: 'Seguimiento' | 'Ganado' | 'Perdido';
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
  foto?: string;
  fechaIngreso: string;
}

export interface SalesBudget {
  id: string;
  usuarioId: string;
  nombreVendedor: string;
  anio: number;
  mes: number; // 0-11
  monto: number;
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
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [budgets, setBudgets] = useState<SalesBudget[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('Desconectado');

  // Session state
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('hs_is_logged_in') === 'true');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('hs_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      console.log('Cargando datos iniciales de Supabase...');
      const { data: userData, error: userError } = await supabase.from('app_users').select('*');
      if (userError) console.error('Error cargando usuarios:', userError);
      if (userData) setUsers(userData as AppUser[]);

      const { data: clientData } = await supabase.from('clientes').select('*');
      if (clientData) setClientes(clientData as Cliente[]);

      const { data: providerData } = await supabase.from('proveedores').select('*');
      if (providerData) setProveedores(providerData as Proveedor[]);

      const { data: productData } = await supabase.from('productos').select('*');
      if (productData) {
        // Map snake_case to camelCase for products
        setProductos(productData.map((p: any) => ({
          ...p,
          numPart: p.num_part,
          precioCompra: p.precio_compra
        })));
      }

      const { data: quoteData } = await supabase.from('cotizaciones').select('*');
      if (quoteData) {
        setCotizaciones(quoteData.map((c: any) => ({
          ...c,
          clienteId: c.cliente_id,
          clienteNombre: c.cliente_nombre,
          ejecutivoEmail: c.ejecutivo_email,
          ejecutivoTelefono: c.ejecutivo_telefono,
          usuarioId: c.usuario_id
        })));
      }

      const { data: ocData } = await supabase.from('ordenes_compra').select('*');
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
          usuarioId: o.usuario_id
        })));
      }

      const { data: despachoData } = await supabase.from('despachos').select('*');
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
          fotoRemision: d.foto_remision
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

      const { data: repairData } = await supabase.from('reparaciones').select('*');
      if (repairData) {
        setReparaciones(repairData.map((r: any) => ({
          ...r,
          clienteId: r.cliente_id,
          clienteNombre: r.cliente_nombre,
          tipoServicio: r.tipo_servicio,
          proveedorId: r.proveedor_id,
          proveedorNombre: r.proveedor_nombre,
          fechaIngreso: r.fecha_ingreso
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
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  useEffect(() => {
    console.log('Suscribiéndose a canales de tiempo real...');
    setRealtimeStatus('Conectando...');

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, (p) => {
        console.log('Cambio detectado en Usuarios:', p);
        fetchInitialData();
        // Sync current user if changed
        if (currentUser && p.new && (p.new as any).id === currentUser.id) {
          setCurrentUser(p.new as AppUser);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proveedores' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cotizaciones' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes_compra' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'despachos' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conductores' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reparaciones' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => fetchInitialData())
      .subscribe((status) => {
        console.log('Estado de conexión Realtime:', status);
        setRealtimeStatus(status === 'SUBSCRIBED' ? 'En Línea' : status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => { localStorage.setItem('hs_is_logged_in', isLoggedIn ? 'true' : 'false'); }, [isLoggedIn]);
  useEffect(() => { localStorage.setItem('hs_current_user', JSON.stringify(currentUser)); }, [currentUser]);

  // Update handlers
  const addCliente = async (c: Cliente) => {
    const { data, error } = await supabase.from('clientes').insert([{ ...c, id: undefined }]).select();
    if (error) {
      alert('Error al añadir cliente: ' + error.message);
    } else if (data) {
      setClientes([...clientes, data[0] as Cliente]);
    }
  };
  const updateCliente = async (c: Cliente) => {
    const { error } = await supabase.from('clientes').update(c).eq('id', c.id);
    if (!error) setClientes(clientes.map(item => item.id === c.id ? c : item));
  };
  const deleteCliente = async (id: string) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) setClientes(clientes.filter(c => c.id !== id));
  };

  const addProveedor = async (p: Proveedor) => {
    const { data, error } = await supabase.from('proveedores').insert([{ ...p, id: undefined }]).select();
    if (error) {
      alert('Error al añadir proveedor: ' + error.message);
    } else if (data) {
      setProveedores([...proveedores, data[0] as Proveedor]);
    }
  };
  const updateProveedor = async (p: Proveedor) => {
    const { error } = await supabase.from('proveedores').update(p).eq('id', p.id);
    if (!error) setProveedores(proveedores.map(item => item.id === p.id ? p : item));
  };
  const deleteProveedor = async (id: string) => {
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (!error) setProveedores(proveedores.filter(p => p.id !== id));
  };

  const addProducto = async (p: Producto) => {
    const { data, error } = await supabase.from('productos').insert([{
      ...p,
      id: undefined,
      num_part: p.numPart,
      precio_compra: p.precioCompra
    }]).select();
    if (error) {
      alert('Error al añadir producto: ' + error.message);
    } else if (data) {
      const newP = data[0];
      setProductos([...productos, {
        ...newP,
        numPart: newP.num_part,
        precioCompra: newP.precio_compra
      } as Producto]);
    }
  };
  const updateProducto = async (p: Producto) => {
    const { error } = await supabase.from('productos').update({
      ...p,
      num_part: p.numPart,
      precio_compra: p.precioCompra
    }).eq('id', p.id);
    if (!error) setProductos(productos.map(item => item.id === p.id ? p : item));
  };
  const deleteProducto = async (id: string) => {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (!error) setProductos(productos.filter(p => p.id !== id));
  };

  const updateDespacho = async (d: Despacho) => {
    const oldDespacho = despachos.find(item => item.id === d.id);
    const { error } = await supabase.from('despachos').update({
      ...d,
      cotizacion_id: d.cotizacionId,
      consecutivo_cotizacion: d.consecutivoCotizacion,
      fecha_solicitud: d.fechaSolicitud,
      cliente_id: d.clienteId,
      cliente_nombre: d.clienteNombre,
      ejecutivo_email: d.ejecutivoEmail,
      ejecutivo_telefono: d.ejecutivoTelefono,
      usuario_id: d.usuarioId,
      conductor_id: d.conductorId,
      conductor_nombre: d.conductorNombre,
      foto_entrega: d.fotoEntrega,
      foto_remision: d.fotoRemision
    }).eq('id', d.id);

    if (!error) {
      setDespachos(despachos.map(item => item.id === d.id ? d : item));
      if (oldDespacho && oldDespacho.estado !== d.estado) {
        sendEmailNotification(
          d.ejecutivoEmail,
          `Cambio de Estado Pedido: ${d.consecutivoCotizacion}`,
          `Hola, el pedido asociado a la cotización ${d.consecutivoCotizacion} ha cambiado su estado de "${oldDespacho.estado}" a "${d.estado}".`
        );
      }
    }
  };
  const deleteDespacho = async (id: string) => {
    const { error } = await supabase.from('despachos').delete().eq('id', id);
    if (!error) setDespachos(despachos.filter(d => d.id !== id));
  };

  const addReparacion = async (r: Reparacion) => {
    const { data, error } = await supabase.from('reparaciones').insert([{
      ...r,
      id: undefined,
      cliente_id: r.clienteId,
      cliente_nombre: r.clienteNombre,
      tipo_servicio: r.tipoServicio,
      proveedor_id: r.proveedorId,
      proveedor_nombre: r.proveedorNombre,
      fecha_ingreso: r.fechaIngreso
    }]).select();
    if (error) {
      alert('Error al añadir reparación: ' + error.message);
    } else if (data) {
      const newR = data[0];
      setReparaciones(prev => [{
        ...newR,
        clienteId: newR.cliente_id,
        clienteNombre: newR.cliente_nombre,
        tipoServicio: newR.tipo_servicio,
        proveedorId: newR.proveedor_id,
        proveedorNombre: newR.proveedor_nombre,
        fechaIngreso: newR.fecha_ingreso
      } as Reparacion, ...prev]);
    }
  };
  const updateReparacion = async (r: Reparacion) => {
    const { error } = await supabase.from('reparaciones').update({
      ...r,
      cliente_id: r.clienteId,
      cliente_nombre: r.clienteNombre,
      tipo_servicio: r.tipoServicio,
      proveedor_id: r.proveedorId,
      proveedor_nombre: r.proveedorNombre,
      fecha_ingreso: r.fechaIngreso
    }).eq('id', r.id);
    if (!error) setReparaciones(prev => prev.map(item => item.id === r.id ? r : item));
  };
  const deleteReparacion = async (id: string) => {
    const { error } = await supabase.from('reparaciones').delete().eq('id', id);
    if (!error) setReparaciones(prev => prev.filter(r => r.id !== id));
  };

  // Notification Helper (Simulated)
  const sendEmailNotification = (to: string, subject: string, body: string) => {
    console.log(`[EMAIL] To: ${to}\nSubject: ${subject}\nBody: ${body}`);
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const sendWhatsAppNotification = (phone: string, message: string) => {
    console.log(`[SIMULATED WHATSAPP] To: ${phone}\nMessage: ${message}`);
    const encodedMsg = encodeURIComponent(message);
    const url = `https://wa.me/${phone.replace(/\s/g, '')}?text=${encodedMsg}`;
    window.open(url, '_blank');
  };

  const addCotizacion = async (c: Cotizacion) => {
    const { data, error } = await supabase.from('cotizaciones').insert([{
      ...c,
      id: undefined,
      cliente_id: c.clienteId,
      cliente_nombre: c.clienteNombre,
      ejecutivo_email: c.ejecutivoEmail,
      ejecutivo_telefono: c.ejecutivoTelefono,
      usuario_id: c.usuarioId
    }]).select();
    if (error) {
      alert('Error al añadir cotización: ' + error.message);
    } else if (data) {
      const newC = data[0];
      setCotizaciones(prev => [{
        ...newC,
        clienteId: newC.cliente_id,
        clienteNombre: newC.cliente_nombre,
        ejecutivoEmail: newC.ejecutivo_email,
        ejecutivoTelefono: newC.ejecutivo_telefono,
        usuarioId: newC.usuario_id
      } as Cotizacion, ...prev]);
    }
  };

  const updateCotizacion = async (c: Cotizacion) => {
    const { error: updateError } = await supabase.from('cotizaciones').update({
      ...c,
      cliente_id: c.clienteId,
      cliente_nombre: c.clienteNombre,
      ejecutivo_email: c.ejecutivoEmail,
      ejecutivo_telefono: c.ejecutivoTelefono,
      usuario_id: c.usuarioId
    }).eq('id', c.id);

    if (updateError) return;

    setCotizaciones(prev => prev.map(item => item.id === c.id ? c : item));

    // Automation: If status is 'Ganado' and no despacho exists, create one
    if (c.estado === 'Ganado' && !despachos.some(d => d.cotizacionId === c.id)) {
      const client = clientes.find(cli => cli.id === c.clienteId);

      // Robust mapping for items
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
        id: Date.now().toString(),
        cotizacionId: c.id,
        consecutivoCotizacion: c.consecutivo,
        fechaSolicitud: new Date().toLocaleDateString(),
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

      const { error: despachoError } = await supabase.from('despachos').insert([{
        ...newDespacho,
        cotizacion_id: newDespacho.cotizacionId,
        consecutivo_cotizacion: newDespacho.consecutivoCotizacion,
        fecha_solicitud: newDespacho.fechaSolicitud,
        cliente_id: newDespacho.clienteId,
        cliente_nombre: newDespacho.clienteNombre,
        ejecutivo_email: newDespacho.ejecutivoEmail,
        ejecutivo_telefono: newDespacho.ejecutivoTelefono,
        usuario_id: newDespacho.usuarioId
      }]);

      if (!despachoError) {
        setDespachos(prev => [newDespacho, ...prev]);

        // Notify executive
        if (c.ejecutivoEmail) {
          sendEmailNotification(
            c.ejecutivoEmail,
            `Nuevo Pedido: ${c.consecutivo}`,
            `Hola, tu cotización ${c.consecutivo} ha sido marcada como GANADA y ya se encuentra en trámite de logística.`
          );
        }

        // Notify Logistics Team
        sendEmailNotification(
          'logistica@helpsoluciones.com.co',
          `NUEVO PEDIDO - Cotización ${c.consecutivo}`,
          `Se ha generado un nuevo pedido desde la cotización ${c.consecutivo} para el cliente ${c.clienteNombre}.\n\nPor favor iniciar el proceso de alistamiento y despacho.`
        );
      }
    }
  };

  const addOrdenCompra = async (oc: OrdenCompra) => {
    const { data, error } = await supabase.from('ordenes_compra').insert([{
      ...oc,
      id: undefined,
      proveedor_id: oc.proveedorId,
      nombre_proveedor: oc.nombreProveedor,
      condiciones_comerciales: oc.condicionesComerciales,
      conductor_id: oc.conductorId,
      conductor_nombre: oc.conductorNombre,
      foto_entrega: oc.fotoEntrega,
      foto_remision: oc.fotoRemision,
      usuario_id: oc.usuarioId
    }]).select();
    if (error) {
      alert('Error al añadir O.C.: ' + error.message);
    } else if (data) {
      const newO = data[0];
      setOrdenesCompra(prev => [{
        ...newO,
        proveedorId: newO.proveedor_id,
        nombreProveedor: newO.nombre_proveedor,
        condicionesComerciales: newO.condiciones_comerciales,
        conductorId: newO.conductor_id,
        conductorNombre: newO.conductor_nombre,
        fotoEntrega: newO.foto_entrega,
        fotoRemision: newO.foto_remision,
        usuarioId: newO.usuario_id
      } as OrdenCompra, ...prev]);
    }
  };
  const updateOrdenCompra = async (oc: OrdenCompra) => {
    const { error } = await supabase.from('ordenes_compra').update({
      ...oc,
      proveedor_id: oc.proveedorId,
      nombre_proveedor: oc.nombreProveedor,
      condiciones_comerciales: oc.condicionesComerciales,
      conductor_id: oc.conductorId,
      conductor_nombre: oc.conductorNombre,
      foto_entrega: oc.fotoEntrega,
      foto_remision: oc.fotoRemision,
      usuario_id: oc.usuarioId
    }).eq('id', oc.id);
    if (!error) setOrdenesCompra(ordenesCompra.map(item => item.id === oc.id ? oc : item));
  };
  const deleteOrdenCompra = async (id: string) => {
    const { error } = await supabase.from('ordenes_compra').delete().eq('id', id);
    if (!error) setOrdenesCompra(ordenesCompra.filter(oc => oc.id !== id));
  };

  const addConductor = async (c: Conductor) => {
    const { data, error } = await supabase.from('conductores').insert([{
      ...c,
      id: undefined,
      placa_vehiculo: c.placaVehiculo,
      modelo_vehiculo: c.modeloVehiculo,
      tipo_vehiculo: c.tipoVehiculo,
      tarjeta_propiedad: c.tarjetaPropiedad
    }]).select();
    if (error) {
      alert('Error al añadir conductor: ' + error.message);
    } else if (data) {
      const newC = data[0];
      setConductores([...conductores, {
        ...newC,
        placaVehiculo: newC.placa_vehiculo,
        modeloVehiculo: newC.modelo_vehiculo,
        tipoVehiculo: newC.tipo_vehiculo,
        tarjetaPropiedad: newC.tarjeta_propiedad
      } as Conductor]);
    }
  };
  const updateConductor = async (c: Conductor) => {
    const { error } = await supabase.from('conductores').update({
      ...c,
      placa_vehiculo: c.placaVehiculo,
      modelo_vehiculo: c.modeloVehiculo,
      tipo_vehiculo: c.tipoVehiculo,
      tarjeta_propiedad: c.tarjetaPropiedad
    }).eq('id', c.id);
    if (!error) setConductores(conductores.map(item => item.id === c.id ? c : item));
  };
  const deleteConductor = async (id: string) => {
    const { error } = await supabase.from('conductores').delete().eq('id', id);
    if (!error) setConductores(conductores.filter(c => c.id !== id));
  };

  const addUser = async (u: AppUser) => {
    const { data, error } = await supabase.from('app_users').insert([{ ...u, id: undefined }]).select();
    if (error) {
      alert('Error al añadir usuario: ' + error.message);
    } else if (data) {
      setUsers([...users, data[0] as AppUser]);
    }
  };
  const updateUser = async (u: AppUser) => {
    const { error } = await supabase.from('app_users').update(u).eq('id', u.id);
    if (!error) {
      setUsers(users.map(item => item.id === u.id ? u : item));
      if (currentUser && currentUser.id === u.id) setCurrentUser(u);
    }
  };
  const deleteUser = async (id: string) => {
    if (currentUser && id === currentUser.id) {
      alert('No puedes eliminar tu propio usuario.');
      return;
    }
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (!error) setUsers(users.filter(u => u.id !== id));
  };

  const addBudget = async (b: SalesBudget) => {
    const { error } = await supabase.from('budgets').insert([{
      ...b,
      usuario_id: b.usuarioId,
      nombre_vendedor: b.nombreVendedor
    }]);
    if (!error) setBudgets([...budgets, b]);
  };
  const updateBudget = async (b: SalesBudget) => {
    const { error } = await supabase.from('budgets').update({
      ...b,
      usuario_id: b.usuarioId,
      nombre_vendedor: b.nombreVendedor
    }).eq('id', b.id);
    if (!error) setBudgets(budgets.map(item => item.id === b.id ? b : item));
  };
  const deleteBudget = async (id: string) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (!error) setBudgets(budgets.filter(b => b.id !== id));
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: '📄' },
    { id: 'ordenes-compra', label: 'Ordenes de Compra', icon: '🛒' },
    { id: 'clientes', label: 'Clientes', icon: '👥' },
    { id: 'productos', label: 'Productos', icon: '📦' },
    { id: 'proveedores', label: 'Proveedores', icon: '🏭' },
    { id: 'conductores', label: 'Conductores', icon: '🆔' },
    { id: 'logistica', label: 'Logística', icon: '🚚' },
    { id: 'reparaciones', label: 'Reparaciones', icon: '🛠️' },
    { id: 'informes', label: 'Informes', icon: '📈' },
    { id: 'admin', label: 'Administración', icon: '⚙️' },
    { id: 'vendedores', label: 'Vendedores', icon: '👨‍💼' },
  ].filter(item => currentUser?.permisos.includes(item.id));

  const handleLogin = (user: AppUser) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem('hs_is_logged_in', 'true');
    localStorage.setItem('hs_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('hs_is_logged_in');
    localStorage.removeItem('hs_current_user');
  };

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'clientes':
        return <ClientesModule clientes={clientes} onAdd={addCliente} onUpdate={updateCliente} onDelete={deleteCliente} />;
      case 'cotizaciones':
        return <CotizacionesModule
          clientes={clientes}
          productos={productos}
          proveedores={proveedores}
          onAddQuote={addCotizacion}
          onSendWhatsApp={sendWhatsAppNotification}
          currentUser={currentUser}
        />;
      case 'ordenes-compra':
        const filteredOCsToModule = currentUser.rol === 'Admin'
          ? ordenesCompra
          : ordenesCompra.filter(oc => oc.usuarioId === currentUser.id);

        return <OrdenesCompraModule
          proveedores={proveedores}
          productos={productos}
          ordenesCompra={filteredOCsToModule}
          onAddOC={addOrdenCompra}
          onUpdateOC={updateOrdenCompra}
          onDeleteOC={deleteOrdenCompra}
          currentUser={currentUser}
        />;
      case 'productos':
        return <ProductosModule productos={productos} onAdd={addProducto} onUpdate={updateProducto} onDelete={deleteProducto} />;
      case 'proveedores':
        return <ProveedoresModule proveedores={proveedores} onAdd={addProveedor} onUpdate={updateProveedor} onDelete={deleteProveedor} />;
      case 'conductores':
        return <ConductoresModule
          conductores={conductores}
          despachos={despachos}
          ordenesCompra={ordenesCompra}
          proveedores={proveedores}
          clientes={clientes}
          onAdd={addConductor}
          onUpdate={updateConductor}
          onDelete={deleteConductor}
          onUpdateDespacho={updateDespacho}
          onUpdateOC={updateOrdenCompra}
          onSendWhatsApp={sendWhatsAppNotification}
        />;
      case 'logistica':
        const filteredDespachos = currentUser.rol === 'Admin' || currentUser.rol === 'Logistica'
          ? despachos
          : despachos.filter(d => d.usuarioId === currentUser.id);
        return <LogisticaModule
          despachos={filteredDespachos}
          ordenesCompra={ordenesCompra}
          conductores={conductores}
          onUpdateDespacho={updateDespacho}
          onDeleteDespacho={deleteDespacho}
          onUpdateOC={updateOrdenCompra}
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
      case 'informes':
        const restrictedQuotes = currentUser.rol === 'Admin'
          ? cotizaciones
          : cotizaciones.filter(c => c.usuarioId === currentUser.id);
        return <InformesModule
          cotizaciones={restrictedQuotes}
          budgets={budgets}
          currentUser={currentUser}
          onUpdateQuote={updateCotizacion}
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
        />;
      case 'vendedores':
        return <VendedoresModule
          users={users}
          budgets={budgets}
          onUpdateUser={updateUser}
          onAddUser={addUser}
        />;
      case 'dashboard':
        const now = new Date();
        const curMonth = now.getMonth();
        const curYear = now.getFullYear();

        const prevMonthDate = new Date(curYear, curMonth - 1, 1);
        const prevMonth = prevMonthDate.getMonth();
        const prevYear = prevMonthDate.getFullYear();

        const getMonthQuotes = (m: number, y: number) => cotizaciones.filter(c => {
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
        const completedTotal = despachos.filter(d => d.estado === 'Entregado').length;
        const activeLogistics = despachos.filter(d => d.estado !== 'Entregado').length;

        return (
          <div className="dashboard-grid">
            <div className="card stat-card">
              <h4>Cotizaciones de {now.toLocaleString('es-ES', { month: 'long' })}</h4>
              <p className="stat-value">{curMonthQuotes.length}</p>
              <span className={`stat-label ${growth >= 0 ? 'text-success' : 'text-error'}`}>
                {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(0)}% vs mes anterior
              </span>
            </div>
            <div className="card stat-card">
              <h4>Ventas Ganadas (Mes)</h4>
              <p className="stat-value">{wonQuotesMonth.length}</p>
              <span className="stat-label">
                ${wonQuotesMonth.reduce((acc, c) => acc + c.total, 0).toLocaleString()} en ingresos
              </span>
            </div>
            <div className="card stat-card">
              <h4>Envíos Realizados</h4>
              <p className="stat-value">{completedTotal}</p>
              <span className="stat-label">{activeLogistics} envíos en tránsito</span>
            </div>
            <div className="card wide-card">
              <h3>Actividad Reciente</h3>
              <ul className="activity-list">
                {cotizaciones.slice(-3).reverse().map(c => (
                  <li key={c.id}>
                    {c.estado === 'Ganado' ? '✅' : '📄'} Cotización <strong>{c.consecutivo}</strong> para {c.clienteNombre}
                  </li>
                ))}
                {despachos.slice(-2).reverse().map(d => (
                  <li key={d.id}>
                    🚚 Despacho de <strong>Cotización {d.consecutivoCotizacion}</strong> - {d.estado}
                  </li>
                ))}
              </ul>
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

  return isLoggedIn ? (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container">
          <div className="brand-box">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">CRM Appenvios</span>
            <div style={{
              fontSize: '0.65rem',
              color: realtimeStatus === 'En Línea' ? '#4ade80' : '#fb7185',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px',
              background: 'rgba(0,0,0,0.2)',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                background: realtimeStatus === 'En Línea' ? '#4ade80' : '#fb7185',
                borderRadius: '50%'
              }}></span>
              DB: {realtimeStatus}
            </div>
          </div>
        </div>
        <nav className="nav-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: '1rem' }}>
          <button className="nav-item" onClick={handleLogout} style={{ color: '#fca5a5' }}>
            <span className="nav-icon">🚪</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="header-left">
            <h1>{menuItems.find(i => i.id === activeTab)?.label || 'Dashboard'}</h1>
          </div>
          <div className="user-info">
            <span style={{ marginRight: '0.5rem' }}>{currentUser?.rol === 'Admin' ? '👑' : '👤'}</span>
            <span className="user-role">{currentUser?.rol}</span>
            <span className="user-name">{currentUser?.nombre}</span>
          </div>
        </header>
        <div className="content-area">
          {renderContent()}
        </div>
      </main>

      <style>{`
        .app-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        .sidebar {
          width: 280px;
          background-color: var(--primary-blue);
          color: white;
          display: flex;
          flex-direction: column;
          padding: 1.5rem 0;
        }

        .brand-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo-icon {
          font-size: 2.5rem;
          background: white;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
        }

        .logo-text {
          color: white;
          font-size: 1.25rem;
          text-align: center;
          line-height: 1.2;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 1rem;
          margin-top: 1rem;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          text-align: left;
          width: 100%;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-item.active {
          background: white;
          color: var(--primary-blue);
          font-weight: 600;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          background-color: var(--background-light);
        }

        .top-bar {
          background: white;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .user-info {
           display: flex;
           align-items: center;
           gap: 0.5rem;
        }

        .user-role {
          font-size: 0.75rem;
          background: var(--secondary-blue);
          color: var(--primary-blue);
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-weight: 700;
        }

        .content-area {
          padding: 2rem;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .stat-card {
          text-align: center;
          padding: 2rem;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary-blue);
          margin: 0.5rem 0;
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--success);
          font-weight: 500;
        }

        .wide-card {
          grid-column: span 3;
          margin-top: 1rem;
        }

        .activity-list {
          list-style: none;
          margin-top: 1.5rem;
        }

        .activity-list li {
          padding: 1rem 0;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-muted);
        }

        .activity-list li:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  ) : (
    <Login users={users} onLogin={handleLogin} />
  );
}

export default App
