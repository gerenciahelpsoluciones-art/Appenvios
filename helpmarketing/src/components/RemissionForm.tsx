import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Client, Product, RemissionDetail, RemissionStatus } from '../types/remission.types';

interface Props {
  onClose: () => void;
  onSaved: () => void;
  remissionId?: string; // If present, we are editing
}

export const RemissionForm = ({ onClose, onSaved }: Props) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Form State
  const [numero, setNumero] = useState(`REM-${Math.floor(Math.random() * 10000)}`);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [estado, setEstado] = useState<RemissionStatus>('borrador');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<RemissionDetail[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [clientsRes, productsRes] = await Promise.all([
        supabase.from('clientes_web').select('id, nombre, identificacion, email, telefono'),
        supabase.from('productos').select('id, nombre, descripcion, precio')
      ]);
      if (clientsRes.data) setClients(clientsRes.data as Client[]);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
    };
    fetchData();
  }, []);

  const addItem = () => {
    setItems([...items, { producto_id: null, descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
  };

  const updateItem = (index: number, field: keyof RemissionDetail, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'producto_id' && value) {
      const p = products.find(prod => prod.id === value);
      if (p) {
        item.descripcion = p.nombre;
        item.precio_unitario = p.precio;
      }
    }
    
    item.subtotal = item.cantidad * item.precio_unitario;
    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSave = async () => {
    if (!selectedClientId) return alert('Seleccione un cliente');
    if (items.length === 0) return alert('Añada al menos un producto');

    setLoading(true);
    try {
      // 1. Insert Remission Header
      const { data: rem, error: remErr } = await supabase
        .from('mkt_remisiones')
        .insert({
          numero,
          cliente_id: selectedClientId,
          total,
          estado,
          observaciones
        })
        .select()
        .single();

      if (remErr) throw remErr;

      // 2. Insert Details
      const detailsToInsert = items.map(item => ({
        remision_id: rem.id,
        producto_id: item.producto_id,
        descripcion: item.descripcion,
        cantidad:    item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal:    item.subtotal
      }));

      const { error: detErr } = await supabase.from('mkt_remision_detalles').insert(detailsToInsert);
      if (detErr) throw detErr;

      onSaved();
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-card animate-scale-in" style={{
        width: '900px', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', border: '1px solid hsla(var(--primary), 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>Generar Nueva Remisión</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '0.5rem' }}>NÚMERO DE REMISIÓN</label>
            <input 
              value={numero} 
              onChange={e => setNumero(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.8rem', borderRadius: '8px', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '0.5rem' }}>CLIENTE</label>
            <select 
              value={selectedClientId} 
              onChange={e => setSelectedClientId(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.8rem', borderRadius: '8px', color: '#fff' }}
            >
              <option value="">Seleccione un cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.identificacion})</option>)}
            </select>
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Productos / Servicios</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: '1rem', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.7rem' }}>Producto</label>
                <select 
                  value={item.producto_id || ''} 
                  onChange={e => updateItem(idx, 'producto_id', e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="">Seleccionar...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem' }}>Cantidad</label>
                <input 
                  type="number" 
                  value={item.cantidad} 
                  onChange={e => updateItem(idx, 'cantidad', parseFloat(e.target.value))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem' }}>Precio Unit.</label>
                <input 
                  type="number" 
                  value={item.precio_unitario} 
                  onChange={e => updateItem(idx, 'precio_unitario', parseFloat(e.target.value))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem' }}>Subtotal</label>
                <div style={{ padding: '0.5rem', fontWeight: 'bold' }}>${item.subtotal.toLocaleString()}</div>
              </div>
              <button onClick={() => removeItem(idx)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', height: '38px' }}>🗑</button>
            </div>
          ))}
          <button onClick={addItem} style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--glass-border)' }}>+ Añadir Item</button>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '50%' }}>
                <label style={{ fontSize: '0.8rem', opacity: 0.6 }}>OBSERVACIONES</label>
                <textarea 
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.8rem', borderRadius: '8px', color: '#fff', marginTop: '0.5rem' }}
                />
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', opacity: 0.6 }}>TOTAL</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>${total.toLocaleString()}</div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <select 
                        value={estado}
                        onChange={e => setEstado(e.target.value as RemissionStatus)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                    >
                        <option value="borrador">Borrador</option>
                        <option value="enviada">Enviada</option>
                        <option value="entregada">Entregada</option>
                    </select>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        style={{ height: '50px', padding: '0 2rem' }}
                    >
                        {loading ? 'Guardando...' : 'Confirmar y Guardar'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
