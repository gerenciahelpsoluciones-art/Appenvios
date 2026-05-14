import { useState, useEffect } from 'react';
import type { DocumentoBase } from '../../types/licitaciones.types';
import type { Licitacion } from '../../types/licitaciones.types';
import { generarDocumentoBase } from '../../services/licitacionesAI';
import { getLicitacionesGuardadas, getDocumentos, saveDocumento, deleteDocumento, getEmpresaPerfil } from './store';

const TIPOS: { id: DocumentoBase['tipo']; label: string; icon: string; desc: string }[] = [
  { id: 'carta_presentacion', label: 'Carta de Presentación', icon: '✉️', desc: 'Carta formal de presentación de la empresa' },
  { id: 'experiencia',        label: 'Experiencia Relevante', icon: '📋', desc: 'Listado de proyectos y contratos similares' },
  { id: 'propuesta_tecnica',  label: 'Propuesta Técnica',     icon: '⚙️', desc: 'Metodología, plan de trabajo y equipo' },
  { id: 'propuesta_economica',label: 'Propuesta Económica',   icon: '💰', desc: 'Estructura de costos y valor total' },
  { id: 'cronograma',         label: 'Cronograma',            icon: '📅', desc: 'Fases, actividades y entregables' },
];

export function DocumentosBase() {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoBase[]>([]);
  const [selectedLicitId, setSelectedLicitId] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<DocumentoBase['tipo']>('carta_presentacion');
  const [generating, setGenerating] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocumentoBase | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLicitaciones(getLicitacionesGuardadas());
    setDocumentos(getDocumentos());
  }, []);

  const handleGenerar = async () => {
    if (!selectedLicitId) { alert('Selecciona una licitación primero.'); return; }
    const licit = licitaciones.find(l => l.id === selectedLicitId);
    if (!licit) return;

    setGenerating(true);
    try {
      const perfil = getEmpresaPerfil();
      const contenido = await generarDocumentoBase(licit, perfil, selectedTipo);
      const tipoInfo = TIPOS.find(t => t.id === selectedTipo)!;
      const nuevo = saveDocumento({
        licitacion_id: licit.id,
        licitacion_nombre: licit.entidad_nombre + ' — ' + licit.descripcion.substring(0, 60),
        tipo: selectedTipo,
        titulo: `${tipoInfo.label} — ${licit.entidad_nombre}`,
        contenido,
      });
      setDocumentos(getDocumentos());
      setViewDoc(nuevo);
    } catch (e) {
      alert('Error generando documento: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    deleteDocumento(id);
    setDocumentos(getDocumentos());
    if (viewDoc?.id === id) setViewDoc(null);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'hsl(var(--text-main))',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    padding: '1.25rem',
  };

  const selectedLicit = licitaciones.find(l => l.id === selectedLicitId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Generator panel */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
          📄 Generador de Documentos IA
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.35rem' }}>
              Licitación
            </label>
            <select
              style={inputStyle}
              value={selectedLicitId}
              onChange={e => setSelectedLicitId(e.target.value)}
            >
              <option value="">Seleccionar proceso...</option>
              {licitaciones.map(l => (
                <option key={l.id} value={l.id}>
                  {l.entidad_nombre} — {l.numero_proceso || l.descripcion.substring(0, 40)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.35rem' }}>
              Tipo de Documento
            </label>
            <select
              style={inputStyle}
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value as DocumentoBase['tipo'])}
            >
              {TIPOS.map(t => (
                <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedLicit && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(59,130,246,0.08)',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            color: 'hsl(var(--text-muted))',
          }}>
            📋 <strong style={{ color: 'hsl(var(--text-main))' }}>{selectedLicit.entidad_nombre}</strong>
            {' '}— {selectedLicit.descripcion.substring(0, 120)}...
            {selectedLicit.presupuesto && (
              <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>
                💰 {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(selectedLicit.presupuesto)}
              </span>
            )}
          </div>
        )}

        {/* Tipo selector cards */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {TIPOS.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTipo(t.id)}
              style={{
                padding: '0.4rem 0.75rem',
                background: selectedTipo === t.id ? 'rgba(16,185,129,0.2)' : 'transparent',
                border: `1px solid ${selectedTipo === t.id ? 'rgba(16,185,129,0.5)' : 'var(--glass-border)'}`,
                borderRadius: '6px',
                color: selectedTipo === t.id ? '#10b981' : 'hsl(var(--text-muted))',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: selectedTipo === t.id ? 700 : 400,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerar}
          disabled={generating || !selectedLicitId}
          style={{
            padding: '0.65rem 2rem',
            background: generating || !selectedLicitId ? 'rgba(16,185,129,0.2)' : '#10b981',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 700,
            cursor: generating || !selectedLicitId ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {generating ? '⏳ Generando con Claude Opus...' : '✨ Generar Documento'}
        </button>
      </div>

      {/* Document viewer */}
      {viewDoc && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>
              📄 {viewDoc.titulo}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleCopy(viewDoc.contenido)}
                style={{
                  padding: '0.4rem 0.9rem',
                  background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: copied ? '#10b981' : 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                {copied ? '✅ Copiado' : '📋 Copiar'}
              </button>
              <button
                onClick={() => setViewDoc(null)}
                style={{
                  padding: '0.4rem 0.6rem',
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                ✕
              </button>
            </div>
          </div>
          <pre style={{
            margin: 0,
            padding: '1rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            fontSize: '0.82rem',
            color: 'hsl(var(--text-main))',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '500px',
            overflowY: 'auto',
            lineHeight: 1.6,
            fontFamily: 'Inter, sans-serif',
          }}>
            {viewDoc.contenido}
          </pre>
        </div>
      )}

      {/* Document library */}
      {documentos.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
            📚 Documentos Generados ({documentos.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {documentos.map(doc => {
              const tipoInfo = TIPOS.find(t => t.id === doc.tipo);
              return (
                <div key={doc.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>
                      {tipoInfo?.icon} {doc.titulo}
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                      {new Date(doc.generado_at).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => setViewDoc(doc)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: '6px',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      👁️ Ver
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        background: 'transparent',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '6px',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {documentos.length === 0 && !viewDoc && (
        <div style={{
          ...cardStyle,
          textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📄</div>
          <p>No hay documentos generados aún.</p>
          <p style={{ fontSize: '0.825rem' }}>Selecciona una licitación guardada y genera documentos base con IA.</p>
        </div>
      )}
    </div>
  );
}
