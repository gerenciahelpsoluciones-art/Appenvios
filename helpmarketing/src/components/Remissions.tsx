import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { RemissionForm } from './RemissionForm';
import { generateRemissionPDF } from '../services/remissionPdf';
import type { Remission } from '../types/remission.types';

export const Remissions = () => {
  const [remissions, setRemissions] = useState<Remission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRemissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mkt_remisiones')
      .select('*, cliente:clientes_web(*)')
      .order('created_at', { ascending: false });

    if (error) console.error('Error:', error);
    else setRemissions(data as Remission[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRemissions();
  }, []);

  const handleDownloadPDF = async (remission: Remission) => {
    // Fetch details for this remission
    const { data: details, error } = await supabase
      .from('mkt_remision_detalles')
      .select('*')
      .eq('remision_id', remission.id);

    if (error) { console.error('Error al cargar detalles para el PDF:', error); return; }
    generateRemissionPDF(remission, details);
  };

  const statusColors: Record<string, string> = {
    borrador: 'hsl(var(--text-muted))',
    enviada: 'hsl(var(--primary))',
    entregada: 'hsl(var(--success))',
    anulada: 'hsl(var(--destructive))',
  };

  const filtered = remissions.filter(r => 
    r.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Gestión de Remisiones</h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Control de entrega y logística para clientes CRM.</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ height: '50px', padding: '0 2rem' }}>
          + Nueva Remisión
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
          <input
            id="remissions-search"
            name="search"
            type="search"
            autoComplete="off"
            aria-label="Buscar remisiones"
            placeholder="Buscar por número o cliente…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none' }}
            onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
            onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'hsla(var(--primary), 0.05)', fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1.5rem' }}>Número</th>
              <th style={{ padding: '1.5rem' }}>Cliente</th>
              <th style={{ padding: '1.5rem' }}>Fecha</th>
              <th style={{ padding: '1.5rem' }}>Estado</th>
              <th style={{ padding: '1.5rem' }}>Total</th>
              <th style={{ padding: '1.5rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>Cargando remisiones...</td></tr>
            ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No se encontraron remisiones.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="table-row-hover">
                <td style={{ padding: '1.2rem 1.5rem', fontWeight: 'bold' }}>#{r.numero}</td>
                <td style={{ padding: '1.2rem 1.5rem' }}>{r.cliente?.nombre || 'Desconocido'}</td>
                <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.9rem', opacity: 0.8 }}>{new Date(r.fecha).toLocaleDateString()}</td>
                <td style={{ padding: '1.2rem 1.5rem' }}>
                  <span className="badge" style={{ 
                    background: `hsla(${statusColors[r.estado].split('(')[1].split(')')[0]}, 0.1)`, 
                    color: statusColors[r.estado],
                    border: `1px solid hsla(${statusColors[r.estado].split('(')[1].split(')')[0]}, 0.2)`
                  }}>
                    {r.estado.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1.2rem 1.5rem', fontWeight: 'bold' }}>${r.total.toLocaleString()}</td>
                <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleDownloadPDF(r)}
                    style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                    title="Bajar PDF"
                  >
                    📄 PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <RemissionForm 
          onClose={() => setShowForm(false)} 
          onSaved={() => {
            setShowForm(false);
            fetchRemissions();
          }}
        />
      )}

      <style>{`
        .table-row-hover:hover {
          background: hsla(var(--primary), 0.03);
        }
        .animate-scale-in {
            animation: scaleIn 0.3s ease-out;
        }
        @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
