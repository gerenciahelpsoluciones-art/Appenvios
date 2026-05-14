import { useState } from 'react';
import type { HistorialContrato } from '../../types/licitaciones.types';
import { buscarHistorialEntidad, buscarHistorialEntidadSecop1 } from '../../services/secopService';

function formatCOP(v: number): string {
  if (!v) return 'N/A';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
}

function HistorialCard({ contrato }: { contrato: HistorialContrato }) {
  const [expanded, setExpanded] = useState(false);
  const fechaStr = contrato.fecha_firma
    ? new Date(contrato.fecha_firma).toLocaleDateString('es-CO')
    : 'N/A';

  return (
    <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{
              padding: '0.1rem 0.45rem',
              background: contrato.fuente === 'SECOP_II' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
              border: `1px solid ${contrato.fuente === 'SECOP_II' ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`,
              borderRadius: '4px', fontSize: '0.62rem', fontWeight: 700,
              color: contrato.fuente === 'SECOP_II' ? '#3b82f6' : '#10b981',
            }}>
              {contrato.fuente}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>{contrato.modalidad}</span>
            <span style={{ padding: '0.1rem 0.45rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
              {contrato.estado}
            </span>
          </div>

          <p style={{
            margin: '0 0 0.35rem', fontSize: '0.85rem', color: 'hsl(var(--text-main))', lineHeight: 1.4,
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {contrato.descripcion || 'Sin descripción'}
          </p>

          {contrato.descripcion && contrato.descripcion.length > 120 && (
            <button onClick={() => setExpanded(!expanded)}
              style={{ background: 'none', border: 'none', color: 'hsl(var(--primary))', fontSize: '0.72rem', cursor: 'pointer', padding: 0, marginBottom: '0.25rem', boxShadow: 'none' }}>
              {expanded ? 'Ver menos ↑' : 'Ver más ↓'}
            </button>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.73rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
            <span>📅 {fechaStr}</span>
            <span>📍 {[contrato.departamento, contrato.municipio].filter(Boolean).join(' · ') || 'Sin ubicación'}</span>
            {contrato.id_proceso && <span>📋 {contrato.id_proceso}</span>}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
            {formatCOP(contrato.valor_contrato)}
          </p>
          {contrato.tipo_contrato && (
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
              {contrato.tipo_contrato}
            </p>
          )}
        </div>
      </div>

      {contrato.contratista_nombre && (
        <div style={{ marginTop: '0.65rem', padding: '0.5rem 0.75rem', background: 'rgba(139,92,246,0.1)', borderRadius: '6px', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem' }}>🏆</span>
          <div>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#a78bfa' }}>
              {contrato.contratista_nombre}
            </p>
            {contrato.contratista_nit && (
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                NIT: {contrato.contratista_nit}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function HistorialEntidad() {
  const [query, setQuery] = useState('');
  const [contratos, setContratos] = useState<HistorialContrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleBuscar = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setContratos([]);
    try {
      const [r2, r1] = await Promise.all([
        buscarHistorialEntidad(query),
        buscarHistorialEntidadSecop1(query),
      ]);
      const merged = [...r2, ...r1].sort((a, b) =>
        (b.fecha_firma || '').localeCompare(a.fecha_firma || '')
      );
      setContratos(merged);
      setSearched(true);
    } catch {
      setError('Error consultando historial. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  };

  const totalValor = contratos.reduce((s, c) => s + (c.valor_contrato || 0), 0);
  const contratistas = [...new Set(contratos.map(c => c.contratista_nombre).filter(Boolean))];
  const modalidades = contratos.reduce<Record<string, number>>((acc, c) => {
    if (c.modalidad) acc[c.modalidad] = (acc[c.modalidad] || 0) + 1;
    return acc;
  }, {});
  const topModalidad = Object.entries(modalidades).sort((a, b) => b[1] - a[1])[0];

  const cardStyle: React.CSSProperties = {
    background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
          🏛️ Historial de Contratación por Entidad
        </h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.825rem', color: 'hsl(var(--text-muted))' }}>
          Consulta el historial de contratos de una entidad pública y descubre quién ha ganado procesos similares.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            style={{ flex: 1, padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'hsl(var(--text-main))', fontSize: '0.875rem', outline: 'none' }}
            placeholder="Nombre de entidad o NIT (ej: Alcaldía de Bogotá, Ministerio de Educación...)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && void handleBuscar()}
          />
          <button onClick={() => void handleBuscar()} disabled={loading || !query.trim()}
            style={{ padding: '0.6rem 1.5rem', background: loading ? 'rgba(239,68,68,0.2)' : '#ef4444', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', fontSize: '0.875rem', flexShrink: 0, boxShadow: 'none' }}>
            {loading ? '⏳ Buscando...' : '🔍 Consultar Historial'}
          </button>
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
          💡 Busca por nombre parcial (ej: "Alcaldía Bogotá") o por NIT.
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '0.875rem', color: '#fca5a5' }}>
          ❌ {error}
        </div>
      )}

      {contratos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Contratos encontrados', value: contratos.length.toString(), color: '#3b82f6', icon: '📋' },
            { label: 'Valor total histórico', value: formatCOP(totalValor), color: '#10b981', icon: '💰' },
            { label: 'Contratistas únicos', value: contratistas.length.toString(), color: '#8b5cf6', icon: '🏆' },
            { label: 'Modalidad principal', value: topModalidad?.[0]?.substring(0, 20) || 'N/A', color: '#f59e0b', icon: '📌' },
          ].map(s => (
            <div key={s.label} style={{ background: `${s.color}12`, border: `1px solid ${s.color}30`, borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {contratistas.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700, color: '#a78bfa' }}>
            🏆 Contratistas que han ganado procesos
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {contratistas.slice(0, 20).map((c, i) => (
              <span key={i} style={{ padding: '0.3rem 0.7rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', fontSize: '0.78rem', color: '#c4b5fd' }}>
                {c}
              </span>
            ))}
            {contratistas.length > 20 && (
              <span style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>
                +{contratistas.length - 20} más
              </span>
            )}
          </div>
        </div>
      )}

      {contratos.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
            📊 {contratos.length} contratos históricos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {contratos.map((c, i) => (
              <HistorialCard key={`${c.id_proceso}-${i}`} contrato={c} />
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
          <p>Consultando historial en SECOP I y SECOP II...</p>
        </div>
      )}

      {!loading && searched && contratos.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔎</div>
          <p>No se encontraron contratos para <strong>"{query}"</strong>.</p>
          <p style={{ fontSize: '0.825rem' }}>Prueba con un nombre más general o verifica la ortografía.</p>
        </div>
      )}

      {!loading && !searched && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏛️</div>
          <p style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>Consulta el Historial de Entidades</p>
          <p style={{ fontSize: '0.875rem' }}>Descubre qué empresas han contratado con una entidad pública y qué valores han manejado.</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            {['Ministerio de Educación', 'SENA', 'Alcaldía Bogotá', 'ANI', 'DNP'].map(e => (
              <button key={e} onClick={() => setQuery(e)}
                style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '20px', color: 'hsl(var(--text-muted))', cursor: 'pointer', fontSize: '0.78rem', boxShadow: 'none' }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
