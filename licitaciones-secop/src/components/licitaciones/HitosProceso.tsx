import { useState, useEffect } from 'react';
import type { HitoProceso, Licitacion } from '../../types/licitaciones.types';
import { getLicitacionesGuardadas, getHitos, saveHito, updateHito, deleteHito } from './store';

type HitoEstado = HitoProceso['estado'];

const ESTADO_CONFIG: Record<HitoEstado, { color: string; icon: string; label: string }> = {
  pendiente:   { color: '#6b7280', icon: '⏳', label: 'Pendiente' },
  en_progreso: { color: '#3b82f6', icon: '🔄', label: 'En Progreso' },
  completado:  { color: '#10b981', icon: '✅', label: 'Completado' },
  vencido:     { color: '#ef4444', icon: '❌', label: 'Vencido' },
};

const HITOS_SUGERIDOS = [
  'Descarga de pliegos de condiciones',
  'Visita al sitio (si aplica)',
  'Fecha límite para observaciones',
  'Respuesta a observaciones por entidad',
  'Fecha límite de presentación de oferta',
  'Audiencia de apertura de sobres',
  'Evaluación de ofertas',
  'Publicación de informe de evaluación',
  'Período de traslado del informe',
  'Acto de adjudicación',
  'Firma del contrato',
  'Acta de inicio',
];

function HitoForm({ licitId, licitNombre, hito, onSave, onCancel }: {
  licitId: string;
  licitNombre: string;
  hito?: HitoProceso;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState(hito?.nombre || '');
  const [descripcion, setDescripcion] = useState(hito?.descripcion || '');
  const [fechaEstimada, setFechaEstimada] = useState(hito?.fecha_estimada || '');
  const [fechaReal, setFechaReal] = useState(hito?.fecha_real || '');
  const [estado, setEstado] = useState<HitoEstado>(hito?.estado || 'pendiente');
  const [responsable, setResponsable] = useState(hito?.responsable || '');
  const [notas, setNotas] = useState(hito?.notas || '');
  const [useSugerido, setUseSugerido] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem',
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
    borderRadius: '8px', color: 'hsl(var(--text-main))', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.3rem',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !fechaEstimada) return;
    if (hito) {
      updateHito(hito.id, { nombre, descripcion, fecha_estimada: fechaEstimada, fecha_real: fechaReal || undefined, estado, responsable, notas });
    } else {
      saveHito({ licitacion_id: licitId, licitacion_nombre: licitNombre, nombre, descripcion, fecha_estimada: fechaEstimada, fecha_real: fechaReal || undefined, estado, responsable, notas });
    }
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '1.25rem' }}>
      <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24' }}>
        {hito ? '✏️ Editar Hito' : '➕ Nuevo Hito'}
      </h4>

      {!hito && (
        <div style={{ marginBottom: '0.75rem' }}>
          <button type="button" onClick={() => setUseSugerido(!useSugerido)}
            style={{ padding: '0.3rem 0.75rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', color: '#fbbf24', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, boxShadow: 'none' }}>
            📋 {useSugerido ? 'Ocultar' : 'Ver'} hitos sugeridos
          </button>
          {useSugerido && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
              {HITOS_SUGERIDOS.map(s => (
                <button key={s} type="button" onClick={() => setNombre(s)}
                  style={{ padding: '0.25rem 0.6rem', background: nombre === s ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: nombre === s ? '#fbbf24' : 'hsl(var(--text-muted))', fontSize: '0.72rem', cursor: 'pointer', boxShadow: 'none' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Nombre del hito *</label>
          <input style={inputStyle} value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Fecha límite de presentación" />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Descripción</label>
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Detalles adicionales..." />
        </div>
        <div>
          <label style={labelStyle}>Fecha estimada *</label>
          <input type="date" style={inputStyle} value={fechaEstimada} onChange={e => setFechaEstimada(e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Fecha real (si ya ocurrió)</label>
          <input type="date" style={inputStyle} value={fechaReal} onChange={e => setFechaReal(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Estado</label>
          <select style={inputStyle} value={estado} onChange={e => setEstado(e.target.value as HitoEstado)}>
            {Object.entries(ESTADO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Responsable</label>
          <input style={inputStyle} value={responsable} onChange={e => setResponsable(e.target.value)} placeholder="Nombre o cargo..." />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Notas</label>
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={notas} onChange={e => setNotas(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="submit"
          style={{ padding: '0.5rem 1.5rem', background: '#f59e0b', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: 'none' }}>
          💾 {hito ? 'Actualizar' : 'Agregar'} Hito
        </button>
        <button type="button" onClick={onCancel}
          style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'hsl(var(--text-muted))', cursor: 'pointer', fontSize: '0.85rem', boxShadow: 'none' }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function HitosProceso() {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([]);
  const [hitos, setHitos] = useState<HitoProceso[]>([]);
  const [selectedLicitId, setSelectedLicitId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingHito, setEditingHito] = useState<HitoProceso | undefined>();

  useEffect(() => {
    const lics = getLicitacionesGuardadas();
    setLicitaciones(lics);
    if (lics.length > 0 && !selectedLicitId) setSelectedLicitId(lics[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setHitos(selectedLicitId ? getHitos(selectedLicitId) : getHitos());
  }, [selectedLicitId]);

  const handleSaved = () => {
    setShowForm(false);
    setEditingHito(undefined);
    setHitos(selectedLicitId ? getHitos(selectedLicitId) : getHitos());
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este hito?')) return;
    deleteHito(id);
    setHitos(selectedLicitId ? getHitos(selectedLicitId) : getHitos());
  };

  const handleEstadoChange = (hito: HitoProceso, estado: HitoEstado) => {
    updateHito(hito.id, { estado });
    setHitos(selectedLicitId ? getHitos(selectedLicitId) : getHitos());
  };

  const selectedLicit = licitaciones.find(l => l.id === selectedLicitId);
  const hitosOrdenados = [...hitos].sort((a, b) => a.fecha_estimada.localeCompare(b.fecha_estimada));
  const stats = {
    total: hitos.length,
    completados: hitos.filter(h => h.estado === 'completado').length,
    vencidos: hitos.filter(h => h.estado === 'vencido').length,
    enProgreso: hitos.filter(h => h.estado === 'en_progreso').length,
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem',
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
    borderRadius: '8px', color: 'hsl(var(--text-main))', fontSize: '0.85rem', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.35rem' }}>
            Proceso
          </label>
          <select style={selectStyle} value={selectedLicitId} onChange={e => setSelectedLicitId(e.target.value)}>
            <option value="">Todos los procesos</option>
            {licitaciones.map(l => (
              <option key={l.id} value={l.id}>
                {l.entidad_nombre} — {l.numero_proceso || l.descripcion.substring(0, 40)}
              </option>
            ))}
          </select>
        </div>
        <button onClick={() => { setEditingHito(undefined); setShowForm(!showForm); }} disabled={!selectedLicitId}
          style={{
            padding: '0.55rem 1.25rem',
            background: selectedLicitId ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${selectedLicitId ? 'rgba(245,158,11,0.4)' : 'var(--glass-border)'}`,
            borderRadius: '8px', color: selectedLicitId ? '#fbbf24' : 'hsl(var(--text-muted))',
            fontWeight: 700, cursor: selectedLicitId ? 'pointer' : 'not-allowed', fontSize: '0.85rem', boxShadow: 'none',
          }}>
          ➕ Nuevo Hito
        </button>
      </div>

      {hitos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {[
            { label: 'Total', value: stats.total, color: '#6b7280' },
            { label: 'Completados', value: stats.completados, color: '#10b981' },
            { label: 'En progreso', value: stats.enProgreso, color: '#3b82f6' },
            { label: 'Vencidos', value: stats.vencidos, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: `${s.color}15`, border: `1px solid ${s.color}33`, borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '0.1rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {showForm && selectedLicit && (
        <HitoForm licitId={selectedLicit.id} licitNombre={selectedLicit.entidad_nombre}
          hito={editingHito} onSave={handleSaved}
          onCancel={() => { setShowForm(false); setEditingHito(undefined); }} />
      )}

      {hitosOrdenados.length > 0 ? (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
            📅 Línea de Tiempo — {selectedLicit ? selectedLicit.entidad_nombre : 'Todos los procesos'}
          </h3>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'var(--glass-border)' }} />
            {hitosOrdenados.map((hito, idx) => {
              const cfg = ESTADO_CONFIG[hito.estado];
              const isOverdue = hito.estado === 'pendiente' && new Date(hito.fecha_estimada) < new Date();
              return (
                <div key={hito.id} style={{ display: 'flex', gap: '1rem', marginBottom: idx < hitosOrdenados.length - 1 ? '1.5rem' : 0, paddingLeft: '3rem', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 10, top: 4, width: 22, height: 22, borderRadius: '50%', background: isOverdue ? '#ef4444' : cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', boxShadow: `0 0 0 4px ${isOverdue ? '#ef444420' : cfg.color + '20'}` }}>
                    {isOverdue ? '⚠️' : cfg.icon}
                  </div>
                  <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--glass-border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: isOverdue ? '#f87171' : 'hsl(var(--text-main))' }}>
                          {hito.nombre}
                        </p>
                        {hito.descripcion && <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>{hito.descripcion}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <select value={hito.estado} onChange={e => handleEstadoChange(hito, e.target.value as HitoEstado)} onClick={e => e.stopPropagation()}
                          style={{ padding: '0.2rem 0.4rem', background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`, borderRadius: '4px', color: cfg.color, fontSize: '0.72rem', fontWeight: 600, outline: 'none' }}>
                          {Object.entries(ESTADO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                        </select>
                        <button onClick={() => { setEditingHito(hito); setShowForm(true); }}
                          style={{ padding: '0.2rem 0.4rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '4px', color: '#60a5fa', cursor: 'pointer', fontSize: '0.72rem', boxShadow: 'none' }}>
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(hito.id)}
                          style={{ padding: '0.2rem 0.4rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', color: '#f87171', cursor: 'pointer', fontSize: '0.72rem', boxShadow: 'none' }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.72rem', color: 'hsl(var(--text-muted))', flexWrap: 'wrap' }}>
                      <span>📅 Estimado: {new Date(hito.fecha_estimada + 'T12:00').toLocaleDateString('es-CO')}</span>
                      {hito.fecha_real && <span>✅ Real: {new Date(hito.fecha_real + 'T12:00').toLocaleDateString('es-CO')}</span>}
                      {hito.responsable && <span>👤 {hito.responsable}</span>}
                      {!selectedLicitId && <span style={{ color: '#a78bfa' }}>🏛️ {hito.licitacion_nombre.substring(0, 40)}</span>}
                    </div>
                    {hito.notas && <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>💬 {hito.notas}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📅</div>
          <p>No hay hitos registrados{selectedLicit ? ` para ${selectedLicit.entidad_nombre}` : ''}.</p>
          <p style={{ fontSize: '0.825rem' }}>Agrega hitos del proceso para hacer seguimiento de las fechas importantes.</p>
        </div>
      )}
    </div>
  );
}
