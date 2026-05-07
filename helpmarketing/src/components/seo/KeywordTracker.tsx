import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { writeAgentLog, getAgentConfig } from '../../services/agentOrchestrator';
import type { KeywordRanking } from '../../types/seo.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const positionDelta = (current: number | null, prev: number | null) => {
  if (current == null || prev == null) return null;
  return prev - current; // positivo = subió, negativo = bajó
};

const DeltaBadge = ({ delta }: { delta: number | null }) => {
  if (delta == null) return <span style={{ opacity: 0.35, fontSize: '0.75rem' }}>—</span>;
  if (delta === 0)   return <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>→</span>;
  const up = delta > 0;
  return (
    <span style={{
      fontSize: '0.75rem', fontWeight: 700,
      color: up ? 'hsl(var(--success))' : '#ef4444',
    }}>
      {up ? `↑ +${delta}` : `↓ ${delta}`}
    </span>
  );
};

const positionColor = (pos: number | null): string => {
  if (pos == null)  return 'hsl(var(--text-muted))';
  if (pos <= 3)     return 'hsl(var(--success))';
  if (pos <= 10)    return '#f59e0b';
  if (pos <= 20)    return 'hsl(var(--primary))';
  return 'hsl(var(--text-muted))';
};

// ─── Componente principal ────────────────────────────────────────────────────

export function KeywordTracker() {
  const [keywords,    setKeywords]    = useState<KeywordRanking[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [newKw,       setNewKw]       = useState('');
  const [newPos,      setNewPos]      = useState('');
  const [newVol,      setNewVol]      = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [defaultKws,  setDefaultKws]  = useState<string[]>([]);

  const loadKeywords = async () => {
    setLoading(true);
    // Obtener el último registro de cada keyword
    const { data, error } = await supabase
      .from('mkt_keyword_rankings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando keywords:', error.message);
      setLoading(false);
      return;
    }

    // Deduplicar: una fila por keyword (la más reciente)
    const seen = new Set<string>();
    const unique = (data ?? []).filter((r: KeywordRanking) => {
      if (seen.has(r.keyword)) return false;
      seen.add(r.keyword);
      return true;
    }) as KeywordRanking[];

    setKeywords(unique);
    setLoading(false);
  };

  useEffect(() => {
    loadKeywords();
    // Cargar keywords por defecto desde agent_config para sugerirlas
    getAgentConfig<string[]>('seo_keywords').then((kws) => {
      if (kws) setDefaultKws(kws);
    });
  }, []);

  const handleAdd = async () => {
    if (!newKw.trim()) return;
    setSaving(true);

    const pos = newPos ? parseInt(newPos) : null;
    const vol = newVol ? parseInt(newVol) : null;

    const { error } = await supabase.from('mkt_keyword_rankings').insert({
      keyword:           newKw.trim().toLowerCase(),
      position:          pos,
      previous_position: null,
      search_volume:     vol,
      source:            'manual',
      location:          'Colombia',
      device:            'desktop',
    });

    if (error) {
      console.error('Error guardando keyword:', error.message);
    } else {
      await writeAgentLog('KEYWORD_CHECK', 'info', `Keyword agregada manualmente: "${newKw.trim()}"`, { position: pos });
      setNewKw('');
      setNewPos('');
      setNewVol('');
      setShowForm(false);
      await loadKeywords();
    }
    setSaving(false);
  };

  const handleAddDefault = async (kw: string) => {
    const alreadyAdded = keywords.some((k) => k.keyword === kw.toLowerCase());
    if (alreadyAdded) return;
    setNewKw(kw);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('mkt_keyword_rankings').delete().eq('id', id);
    setKeywords((prev) => prev.filter((k) => k.id !== id));
  };

  // Agrupar: top 3, posiciones 4-10, >10
  const top3   = keywords.filter((k) => k.position != null && k.position <= 3);
  const page1  = keywords.filter((k) => k.position != null && k.position > 3 && k.position <= 10);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.3rem' }}>Keyword Tracker</h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>
            Posicionamiento en Google Colombia — actualizado manualmente o vía n8n
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Agregar Keyword'}
        </button>
      </div>

      {/* ── Formulario para agregar keyword ────────────────────── */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid hsl(var(--primary))' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Nueva Keyword</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.78rem', opacity: 0.6, display: 'block', marginBottom: '0.3rem' }}>KEYWORD</label>
              <input
                value={newKw}
                onChange={(e) => setNewKw(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="ej: soporte técnico bogotá"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)', borderRadius: '10px',
                  color: 'white', padding: '0.7rem 1rem', fontSize: '0.9rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', opacity: 0.6, display: 'block', marginBottom: '0.3rem' }}>POSICIÓN</label>
              <input
                type="number" value={newPos} onChange={(e) => setNewPos(e.target.value)}
                placeholder="ej: 5"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)', borderRadius: '10px',
                  color: 'white', padding: '0.7rem 1rem', fontSize: '0.9rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', opacity: 0.6, display: 'block', marginBottom: '0.3rem' }}>VOLUMEN/MES</label>
              <input
                type="number" value={newVol} onChange={(e) => setNewVol(e.target.value)}
                placeholder="ej: 1200"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)', borderRadius: '10px',
                  color: 'white', padding: '0.7rem 1rem', fontSize: '0.9rem',
                }}
              />
            </div>
            <button onClick={handleAdd} disabled={saving || !newKw.trim()}>
              {saving ? '...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* ── Keywords sugeridas desde config ────────────────────── */}
      {defaultKws.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.78rem', opacity: 0.5, marginBottom: '0.5rem' }}>
            KEYWORDS CONFIGURADAS EN EL AGENTE — Haz clic para agregar:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {defaultKws.map((kw) => {
              const added = keywords.some((k) => k.keyword === kw.toLowerCase());
              return (
                <button
                  key={kw}
                  onClick={() => handleAddDefault(kw)}
                  disabled={added}
                  style={{
                    fontSize: '0.78rem', padding: '0.3rem 0.8rem',
                    background: added ? 'rgba(255,255,255,0.05)' : 'hsl(var(--primary) / 0.15)',
                    color: added ? 'hsl(var(--text-muted))' : 'hsl(var(--primary))',
                    border: `1px solid ${added ? 'var(--glass-border)' : 'hsl(var(--primary) / 0.3)'}`,
                    borderRadius: '20px', cursor: added ? 'default' : 'pointer', boxShadow: 'none',
                  }}
                >
                  {added ? '✓ ' : '+ '}{kw}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tabla de keywords ──────────────────────────────────── */}
      {loading && <p style={{ opacity: 0.5 }}>Cargando keywords...</p>}

      {!loading && keywords.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔑</div>
          <p style={{ color: 'hsl(var(--text-muted))' }}>
            Aún no tienes keywords registradas.
          </p>
          <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '0.5rem' }}>
            Agrega manualmente la posición actual de tus palabras clave para empezar a trackear su evolución.
          </p>
          <button onClick={() => setShowForm(true)} style={{ marginTop: '1.5rem' }}>
            + Agregar primera keyword
          </button>
        </div>
      )}

      {!loading && keywords.length > 0 && (
        <>
          {/* Métricas resumen */}
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-card stat-item">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>TOP 3</span>
              <span className="stat-value" style={{ color: 'hsl(var(--success))' }}>{top3.length}</span>
            </div>
            <div className="glass-card stat-item">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>EN PÁGINA 1</span>
              <span className="stat-value" style={{ color: '#f59e0b' }}>{page1.length}</span>
            </div>
            <div className="glass-card stat-item">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>TOTAL KEYWORDS</span>
              <span className="stat-value">{keywords.length}</span>
            </div>
          </div>

          {/* Tabla */}
          <div className="glass-card">
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 90px 90px 100px 80px 40px',
              gap: '0.5rem', padding: '0.5rem 0 0.75rem',
              fontSize: '0.7rem', fontWeight: 700, opacity: 0.5, letterSpacing: '0.06em',
              borderBottom: '1px solid var(--glass-border)',
            }}>
              <span>KEYWORD</span>
              <span style={{ textAlign: 'center' }}>POSICIÓN</span>
              <span style={{ textAlign: 'center' }}>CAMBIO</span>
              <span style={{ textAlign: 'center' }}>VOLUMEN</span>
              <span style={{ textAlign: 'center' }}>FUENTE</span>
              <span />
            </div>

            {keywords.map((kw) => {
              const delta = positionDelta(kw.position, kw.previous_position);
              return (
                <div
                  key={kw.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 90px 90px 100px 80px 40px',
                    gap: '0.5rem', padding: '0.7rem 0',
                    borderBottom: '1px solid var(--glass-border)',
                    alignItems: 'center', fontSize: '0.88rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{kw.keyword}</span>

                  <span style={{
                    textAlign: 'center', fontWeight: 800, fontSize: '1.1rem',
                    color: positionColor(kw.position),
                  }}>
                    {kw.position != null ? `#${kw.position}` : '—'}
                  </span>

                  <span style={{ textAlign: 'center' }}>
                    <DeltaBadge delta={delta} />
                  </span>

                  <span style={{ textAlign: 'center', opacity: 0.7, fontSize: '0.82rem' }}>
                    {kw.search_volume != null ? kw.search_volume.toLocaleString('es-CO') : '—'}
                  </span>

                  <span style={{
                    textAlign: 'center', fontSize: '0.72rem',
                    opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {kw.source}
                  </span>

                  <button
                    onClick={() => handleDelete(kw.id)}
                    title="Eliminar keyword"
                    style={{
                      padding: '0.2rem 0.4rem', fontSize: '0.75rem',
                      background: 'transparent', border: 'none',
                      color: 'hsl(var(--text-muted))', cursor: 'pointer',
                      boxShadow: 'none', opacity: 0.5,
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: '0.78rem', opacity: 0.45, marginTop: '1rem', textAlign: 'right' }}>
            Las posiciones se actualizan automáticamente cuando configures el workflow <strong>n8n Daily SEO Monitor</strong>.
          </p>
        </>
      )}
    </div>
  );
}
