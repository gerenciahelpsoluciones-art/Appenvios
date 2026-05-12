import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Client, Product, RemissionDetail, RemissionStatus } from '../types/remission.types';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const emptyItem = (): RemissionDetail => ({ producto_id: null, descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 });

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
  padding: '0.75rem 0.9rem', borderRadius: '10px', color: '#fff', fontFamily: 'inherit',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
};

export const RemissionForm = ({ onClose, onSaved }: Props) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [estado, setEstado] = useState<RemissionStatus>('borrador');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<RemissionDetail[]>([emptyItem()]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('clientes_web').select('id, nombre, identificacion, email, telefono').order('nombre'),
      supabase.from('productos').select('id, nombre, descripcion, precio'),
    ]).then(([clientsRes, productsRes]) => {
      if (clientsRes.data) setClients(clientsRes.data as Client[]);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
    });
  }, []);

  const filteredClients = clientSearch
    ? clients.filter(c => c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) || c.identificacion?.includes(clientSearch))
    : clients.slice(0, 8);

  const updateItem = (index: number, field: keyof RemissionDetail, value: string | number | null) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'producto_id' && value) {
        const p = products.find(prod => prod.id === value);
        if (p) { updated.descripcion = p.nombre; updated.precio_unitario = p.precio; }
      }
      if (field === 'cantidad' || field === 'precio_unitario') {
        updated.subtotal = Number(updated.cantidad) * Number(updated.precio_unitario);
      }
      return updated;
    }));
  };

  const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  const handleSave = async () => {
    if (!selectedClient) { setError('Selecciona un cliente'); return; }
    if (items.some(d => !d.descripcion.trim())) { setError('Completa la descripción de todos los ítems'); return; }
    if (total === 0) { setError('Agrega al menos un ítem con valor'); return; }

    setLoading(true);
    setError('');
    try {
      const { count } = await supabase.from('mkt_remisiones').select('*', { count: 'exact', head: true });
      const numero = `REM-${String((count || 0) + 1).padStart(4, '0')}`;

      const { data: rem, error: remErr } = await supabase
        .from('mkt_remisiones')
        .insert({ numero, fecha, cliente_id: selectedClient.id, total, estado, observaciones })
        .select().single();

      if (remErr) throw remErr;

      const { error: detErr } = await supabase.from('mkt_remision_detalles').insert(
        items.map(item => ({ ...item, remision_id: rem.id }))
      );
      if (detErr) throw detErr;

      onSaved();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la remisión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto', padding: '2.5rem', margin: 0, border: '1px solid hsla(var(--primary), 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>Nueva Remisión</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--glass-border)', boxShadow: 'none', padding: '0.4rem 0.85rem', width: 'auto', fontSize: '1.1rem', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Fecha</label>
            <input type="date" style={inputStyle} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Estado</label>
            <select style={{ ...inputStyle, background: 'rgba(30,30,50,0.9)', cursor: 'pointer' }} value={estado} onChange={(e) => setEstado(e.target.value as RemissionStatus)}>
              <option value="borrador">Borrador</option>
              <option value="enviada">Enviada</option>
              <option value="entregada">Entregada</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Cliente</label>
          <input
            style={inputStyle}
            placeholder="Buscar por nombre o NIT..."
            value={clientSearch}
            onChange={(e) => { setClientSearch(e.target.value); setSelectedClient(null); setShowClientList(true); }}
            onFocus={() => setShowClientList(true)}
            onBlur={() => setTimeout(() => setShowClientList(false), 200)}
          />
          {showClientList && filteredClients.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'hsl(220 20% 10%)', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '4px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
              {filteredClients.map(c => (
                <div key={c.id} onMouseDown={() => { setSelectedClient(c); setClientSearch(c.nombre); setShowClientList(false); }} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', fontSize: '0.88rem' }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'hsla(var(--primary), 0.08)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ fontWeight: '600' }}>{c.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{c.identificacion}</div>
                </div>
              ))}
            </div>
          )}
          {selectedClient && <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'hsl(var(--success))' }}>✓ {selectedClient.nombre} · {selectedClient.identificacion}</div>}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Ítems</label>
            <button onClick={() => setItems(prev => [...prev, emptyItem()])} style={{ width: 'auto', padding: '0.35rem 0.8rem', fontSize: '0.78rem', boxShadow: 'none', background: 'hsla(var(--primary), 0.12)', border: '1px solid hsla(var(--primary), 0.3)' }}>+ Ítem</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '0.4rem', marginBottom: '0.4rem', padding: '0 0.1rem' }}>
            {['Descripción / Producto', 'Cant.', 'Precio unit.', 'Subtotal', ''].map((h, i) => (
              <div key={i} style={{ fontSize: '0.68rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 120px 110px 32px', gap: '0.4rem', alignItems: 'center' }}>
                <div>
                  {products.length > 0 ? (
                    <select style={{ ...inputStyle, marginBottom: item.producto_id ? '0.3rem' : 0 }} value={item.producto_id || ''} onChange={(e) => updateItem(idx, 'producto_id', e.target.value || null)}>
                      <option value="">Descripción manual...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  ) : null}
                  {(!item.producto_id) && (
                    <input style={inputStyle} placeholder="Descripción del ítem" value={item.descripcion} onChange={(e) => updateItem(idx, 'descripcion', e.target.value)} />
                  )}
                </div>
                <input type="number" min={1} style={inputStyle} value={item.cantidad} onChange={(e) => updateItem(idx, 'cantidad', Number(e.target.value))} />
                <input type="number" min={0} style={inputStyle} placeholder="0" value={item.precio_unitario || ''} onChange={(e) => updateItem(idx, 'precio_unitario', Number(e.target.value))} />
                <div style={{ textAlign: 'right', fontWeight: '700', color: 'hsl(var(--primary))', fontSize: '0.9rem', padding: '0 0.25rem' }}>${(item.subtotal || 0).toLocaleString('es-CO')}</div>
                <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} disabled={items.length === 1} aria-label="Eliminar ítem" style={{ background: 'transparent', border: '1px solid var(--glass-border)', boxShadow: 'none', padding: '0.35rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: items.length === 1 ? 0.3 : 1, cursor: items.length === 1 ? 'not-allowed' : 'pointer' }}>
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Observaciones</label>
          <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Condiciones de entrega, notas adicionales..." />
        </div>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>Total:</span>
          <span style={{ fontSize: '2rem', fontWeight: '800', color: 'hsl(var(--primary))' }}>${total.toLocaleString('es-CO')}</span>
        </div>

        {error && <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'hsla(0,80%,60%,0.1)', borderRadius: '10px', color: 'hsl(0 80% 70%)', fontSize: '0.88rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleSave} disabled={loading} style={{ flex: 1 }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <svg aria-hidden="true" className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Guardando…
              </span>
            ) : 'Guardar Remisión'}
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--glass-border)', boxShadow: 'none', width: 'auto', padding: '0 1.5rem' }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};
