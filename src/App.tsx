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
import { logoBase64 } from './assets/logoBase64'

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
  tipo: 'Recogida' | 'Inventario';
  verificada: boolean;
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
  condiciones?: string;
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
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
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
          cupoCredito: c.cupo_credito || 0
        } as Cliente)));
      }

      const { data: providerData } = await supabase.from('proveedores').select('*');
      if (providerData) setProveedores(providerData as Proveedor[]);

      const { data: productData } = await supabase.from('productos').select('*');
      if (productData) {
        // Map snake_case to camelCase for products
        setProductos(productData.map((p: any) => ({
          ...p,
          numPart: p.num_part,
          precioCompra: p.precio_compra,
          exentoIva: !!p.exento_iva
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
          usuarioId: c.usuario_id,
          direccion: c.direccion,
          coordenadas: c.coordenadas,
          usuario_id: c.usuario_id,
          contactoTesoreria: c.contacto_tesoreria,
          contactoContabilidad: c.contacto_contabilidad,
          poseeCredito: !!c.posee_credito,
          cupoCredito: c.cupo_credito,
          utilidadTotal: Number(c.utilidad_total || 0)
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
          usuarioId: o.usuario_id,
          tipo: o.tipo || 'Recogida', // Default to Recogida for existing ones
          verificada: !!o.verificada
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

      const { data: devolucionData } = await supabase.from('devoluciones').select('*');
      if (devolucionData) {
        setDevoluciones(devolucionData.map((d: any) => ({
          ...d,
          proveedorId: d.proveedor_id,
          nombreProveedor: d.nombre_proveedor,
          usuarioId: d.usuario_id
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
    let channel: any;

    const setupSubscription = () => {
      console.log('Suscribiéndo a canales de tiempo real...');
      setRealtimeStatus('Conectando...');

      channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, (p) => {
          console.log('Cambio detectado en Usuarios:', p);
          fetchInitialData();
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'devoluciones' }, () => fetchInitialData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => fetchInitialData())
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

  useEffect(() => { localStorage.setItem('hs_is_logged_in', isLoggedIn ? 'true' : 'false'); }, [isLoggedIn]);
  useEffect(() => { localStorage.setItem('hs_current_user', JSON.stringify(currentUser)); }, [currentUser]);

  // Update handlers
  const addCliente = async (c: Cliente) => {
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
      cupo_credito: c.cupoCredito || 0
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
        contabilidadTelefono: dbObj.contabilidad_telefono,
        contabilidadEmail: dbObj.contabilidad_email,
        poseeCredito: !!dbObj.posee_credito,
        cupoCredito: dbObj.cupo_credito
      } as Cliente]);
      alert('Cliente añadido correctamente.');
    }
  };

  const updateCliente = async (c: Cliente) => {
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
      cupo_credito: c.cupoCredito || 0
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
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar cliente:', error);
      alert('Error al eliminar cliente: ' + error.message);
    } else {
      setClientes(clientes.filter(c => c.id !== id));
    }
  };

  const addProveedor = async (p: Proveedor) => {
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
    const { error } = await supabase.from('proveedores').update(p).eq('id', p.id);
    if (!error) setProveedores(proveedores.map(item => item.id === p.id ? p : item));
  };
  const deleteProveedor = async (id: string) => {
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (!error) setProveedores(proveedores.filter(p => p.id !== id));
  };

  const addProducto = async (p: Producto) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, numPart, precioCompra, exentoIva, ...cleanProd } = p;
    const { data, error } = await supabase.from('productos').insert([{
      ...cleanProd,
      num_part: p.numPart,
      precio_compra: p.precioCompra,
      exento_iva: p.exentoIva || false
    }]).select();
    if (error) {
      alert('Error al añadir producto: ' + error.message);
    } else if (data) {
      const dbProd = data[0];
      setProductos([...productos, {
        ...dbProd,
        numPart: dbProd.num_part,
        precioCompra: dbProd.precio_compra,
        exentoIva: !!dbProd.exento_iva
      } as Producto]);
    }
  };
  const updateProducto = async (p: Producto) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, numPart, precioCompra, exentoIva, ...cleanProd } = p;
    const { error } = await supabase.from('productos').update({
      ...cleanProd,
      num_part: p.numPart,
      precio_compra: p.precioCompra,
      exento_iva: p.exentoIva || false
    }).eq('id', p.id);
    if (!error) setProductos(productos.map(item => item.id === p.id ? p : item));
  };
  const deleteProducto = async (id: string) => {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (!error) setProductos(productos.filter(p => p.id !== id));
  };

  const updateDespacho = async (d: Despacho) => {
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
      georeferencia: d.georeferencia
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
    const { error } = await supabase.from('despachos').delete().eq('id', id);
    if (!error) setDespachos(despachos.filter(d => d.id !== id));
  };

  const addReparacion = async (r: Reparacion) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, clienteId, clienteNombre, tipoServicio, proveedorId, proveedorNombre, fechaIngreso, ...cleanR } = r;
    const { data, error } = await supabase.from('reparaciones').insert([{
      ...cleanR,
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
      const dbR = data[0];
      setReparaciones(prev => [{
        ...dbR,
        clienteId: dbR.cliente_id,
        clienteNombre: dbR.cliente_nombre,
        tipoServicio: dbR.tipo_servicio,
        proveedorId: dbR.proveedor_id,
        proveedorNombre: dbR.proveedor_nombre,
        fechaIngreso: dbR.fecha_ingreso
      } as Reparacion, ...prev]);
    }
  };
  const updateReparacion = async (r: Reparacion) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, clienteId, clienteNombre, tipoServicio, proveedorId, proveedorNombre, fechaIngreso, ...cleanR } = r;
    const { error } = await supabase.from('reparaciones').update({
      ...cleanR,
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

  const sendEmailNotification = (to: string, subject: string, body: string, cc?: string, senderName?: string, senderEmail?: string) => {
    const fromName = senderName || currentUser?.nombre || 'Equipo Help Soluciones';
    const fromCargo = senderName ? '' : (currentUser?.cargo || 'Sistema de Gestión');
    const fromEmail = senderEmail || currentUser?.email || '';

    const header = `*** CRM HELP SOLUCIONES - NOTIFICACIÓN AUTOMÁTICA ***\n\n`;
    const signature = `\n\nCordialmente,\n\n${fromName}${fromCargo ? '\n' + fromCargo : ''}${fromEmail ? '\n' + fromEmail : ''}\nHelp Soluciones Informáticas\n\n---\nEste mensaje fue generado automáticamente por el sistema de Appenvios.`;

    const fullBody = header + body + signature;

    // If senderEmail is provided, add it as a hint for Outlook to select the sending account
    let mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
    if (cc) mailtoUrl += `&cc=${encodeURIComponent(cc)}`;
    if (senderEmail) mailtoUrl += `&from=${encodeURIComponent(senderEmail)}`;

    window.open(mailtoUrl, '_blank');
  };

  const sendWhatsAppNotification = (phone: string, message: string) => {
    const signature = `\n\n_Enviado por: ${currentUser?.nombre || 'Usuario'}_`;
    const fullMessage = message + signature;
    const encodedMsg = encodeURIComponent(fullMessage);
    const url = `https://wa.me/${phone.replace(/\s/g, '')}?text=${encodedMsg}`;
    window.open(url, '_blank');
  };

  const addCotizacion = async (c: Cotizacion) => {
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
      fecha_autorizacion: c.fechaAutorizacion
    }]).select();
    if (error) {
      alert('Error al añadir cotización: ' + error.message);
    } else if (data) {
      const dbC = data[0];
      setCotizaciones(prev => [{
        ...dbC,
        clienteId: dbC.cliente_id,
        clienteNombre: dbC.cliente_nombre,
        ejecutivoEmail: dbC.ejecutivo_email,
        ejecutivoTelefono: dbC.ejecutivo_telefono,
        usuarioId: dbC.usuario_id,
        utilidadTotal: Number(dbC.utilidad_total || 0),
        requiereAutorizacion: dbC.requiere_autorizacion,
        autorizada: dbC.autorizada,
        autorizadoPor: dbC.autorizado_por,
        fechaAutorizacion: dbC.fecha_autorizacion
      } as Cotizacion, ...prev]);
    }
  };

  const updateCotizacion = async (c: Cotizacion) => {
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
      fecha_autorizacion: c.fechaAutorizacion
    };

    const { error: updateError } = await supabase.from('cotizaciones').update(quotePayload).eq('id', c.id);

    if (updateError) {
      console.error('Error actualizando cotización:', updateError);
      alert('Error en base de datos: ' + updateError.message);
      return;
    }

    // 2. Update local state
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
          id: Date.now().toString(), // Temp ID
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
    }
  };

  const deleteCotizacion = async (id: string) => {
    const { error } = await supabase.from('cotizaciones').delete().eq('id', id);
    if (error) {
      console.error('Error eliminando cotización:', error);
      alert('Error al eliminar cotización: ' + error.message);
      return;
    }
    setCotizaciones(prev => prev.filter(c => c.id !== id));
  };

  const addOrdenCompra = async (oc: OrdenCompra): Promise<boolean> => {
    const payload = {
      consecutivo: oc.consecutivo,
      fecha: oc.fecha,
      proveedor_id: oc.proveedorId,
      nombre_proveedor: oc.nombreProveedor,
      items: oc.items,
      subtotal: oc.subtotal,
      iva: oc.iva,
      total: oc.total,
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
      alert('Error al añadir O.C.: ' + error.message);
      return false;
    } else if (data) {
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
        verificada: dbO.verificada
      } as OrdenCompra, ...prev]);
      return true;
    }
    return false;
  };
  const updateOrdenCompra = async (oc: OrdenCompra): Promise<boolean> => {
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
    const { error } = await supabase.from('ordenes_compra').delete().eq('id', id);
    if (!error) setOrdenesCompra(ordenesCompra.filter(oc => oc.id !== id));
  };

  const addConductor = async (c: Conductor) => {
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
    const { error } = await supabase.from('conductores').delete().eq('id', id);
    if (!error) setConductores(conductores.filter(c => c.id !== id));
  };

  const addUser = async (u: AppUser) => {
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

  const addDevolucion = async (d: Devolucion): Promise<boolean> => {
    const payload = {
      consecutivo: d.consecutivo,
      fecha: d.fecha,
      proveedor_id: d.proveedorId,
      nombre_proveedor: d.nombreProveedor,
      items: d.items,
      observaciones: d.observaciones,
      estado: d.estado,
      usuario_id: d.usuarioId
    };

    const { error } = await supabase.from('devoluciones').insert([payload]);
    if (error) {
      console.error('Error insertando devolución:', error);
      alert('Error en base de datos: ' + error.message);
      return false;
    }
    return true;
  };

  const updateDevolucion = async (d: Devolucion) => {
    const payload = {
      proveedor_id: d.proveedorId,
      nombre_proveedor: d.nombreProveedor,
      items: d.items,
      observaciones: d.observaciones,
      estado: d.estado
    };

    const { error } = await supabase.from('devoluciones').update(payload).eq('id', d.id);
    if (error) {
      console.error('Error actualizando devolución:', error);
      alert('Error en base de datos: ' + error.message);
    }
  };

  const deleteDevolucion = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta devolución?')) {
      const { error } = await supabase.from('devoluciones').delete().eq('id', id);
      if (error) {
        console.error('Error eliminando devolución:', error);
        alert('Error en base de datos: ' + error.message);
      }
    }
  };

  const addBudget = async (b: SalesBudget) => {
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

    // Filter clients: Admins see all, Comercials see only theirs (or clients without user for backward compatibility if desired, but here we strictly match)
    const filteredClientes = currentUser.rol === 'Admin'
      ? clientes
      : clientes.filter(c => c.usuarioId === currentUser.id);

    switch (activeTab) {
      case 'clientes':
        return <ClientesModule clientes={filteredClientes} onAdd={addCliente} onUpdate={updateCliente} onDelete={deleteCliente} />;
      case 'cotizaciones':
        return <CotizacionesModule
          clientes={filteredClientes}
          productos={productos}
          proveedores={proveedores}
          cotizaciones={cotizaciones}
          onAddQuote={addCotizacion}
          onUpdateQuote={updateCotizacion}
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
          totalOrdenes={ordenesCompra.length}
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
        return <LogisticaModule
          despachos={despachos}
          ordenesCompra={ordenesCompra}
          devoluciones={devoluciones}
          conductores={conductores}
          proveedores={proveedores}
          productos={productos}
          currentUser={currentUser!}
          onUpdateDespacho={updateDespacho}
          onDeleteDespacho={deleteDespacho}
          onUpdateOC={updateOrdenCompra}
          onAddOC={addOrdenCompra}
          onAddDevolucion={addDevolucion}
          onUpdateDevolucion={updateDevolucion}
          onDeleteDevolucion={deleteDevolucion}
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
          onDeleteQuote={deleteCotizacion}
          clientes={clientes}
          productos={productos}
          proveedores={proveedores}
          despachos={despachos}
          ordenesCompra={ordenesCompra}
          users={users}
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
        />;
      case 'dashboard':
        const dashQuotes = currentUser.rol === 'Admin'
          ? cotizaciones
          : cotizaciones.filter(c => c.usuarioId === currentUser.id);

        const dashDespachos = currentUser.rol === 'Admin'
          ? despachos
          : despachos.filter(d => d.usuarioId === currentUser.id);

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
                {dashQuotes.slice(-3).reverse().map(c => (
                  <li key={c.id}>
                    {c.estado === 'Ganado' ? '✅' : '📄'} Cotización <strong>{c.consecutivo}</strong> para {c.clienteNombre}
                  </li>
                ))}
                {dashDespachos.slice(-2).reverse().map(d => (
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

  const [showHelpModal, setShowHelpModal] = useState(false);

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
            <h2 style={{ margin: 0, color: 'var(--primary-blue)' }}>{content.title} ❓</h2>
            <button onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
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

  return isLoggedIn ? (
    <div className="app-container">
      <HelpModal />
      <aside className="sidebar">
        <div className="logo-container">
          <div className="brand-box">
            <img src={logoBase64} alt="CRM HELP SOLUCIONES" style={{ width: '80%', maxWidth: '160px', borderRadius: '8px', objectFit: 'contain', background: 'white', padding: '10px' }} />
            <span className="logo-text" style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>CRM HELP SOLUCIONES</span>
            <div
              title="Click para reconectar"
              onClick={() => window.location.reload()}
              style={{
                fontSize: '0.65rem',
                color: realtimeStatus === 'En Línea' ? '#4ade80' : '#fb7185',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '4px',
                background: 'rgba(0,0,0,0.2)',
                padding: '2px 8px',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              <span style={{
                width: '6px',
                height: '6px',
                background: realtimeStatus === 'En Línea' ? '#4ade80' : '#fb7185',
                borderRadius: '50%'
              }}></span>
              DB: {realtimeStatus} 🔄
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
            <button
              className="btn-help"
              onClick={() => setShowHelpModal(true)}
              title="Ayuda / Manual"
            >
              ❓
            </button>
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

        .btn-help {
          background: var(--secondary-blue);
          border: 1px solid var(--primary-blue);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          cursor: pointer;
          margin-right: 1rem;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .btn-help:hover {
          background: white;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
          position: relative;
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
