import { useState, useEffect, useRef } from 'react';
import type { Licitacion, LicitacionFiltros, TelegramLicitConfig } from '../../types/licitaciones.types';
import { DEPARTAMENTOS_CO, MODALIDADES } from '../../types/licitaciones.types';
import { buscarLicitacionesSecop2 } from '../../services/secopService';
import { calcularMatchScore } from '../../services/licitacionesAI';
import { notificarNuevaLicitacion, getConfig } from '../../services/telegramLicit';
import { getLicitacionesGuardadas, saveLicitacion, getEmpresaPerfil, getRupData } from './store';

const FILTROS_DEFAULT: LicitacionFiltros = {
  keywords: 'tecnologia software sistemas',
  entidad: '',
  departamento: '',
  municipio: '',
  modalidad: '',
  estado: '',
  presupuestoMin: '',
  presupuestoMax: '',
  soloVigentes: false,
  soloPublicados: true,
  fechaDesde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  fechaHasta: '',
};

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined) return null;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Alto' : score >= 40 ? 'Medio' : 'Bajo';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.25rem 0.65rem',
      background: `${color}22`,
      border: `1px solid ${color}55`,
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 700,
      color,
    }}>
      <span>{score >= 70 ? '🟢' : score >= 40 ? '🟡' : '🔴'}</span>
      {score}/100 · {label}
    </div>
  );
}

function buildSecopUrl(licit: Licitacion): string {
  if (licit.url_proceso) return licit.url_proceso;
  if (licit.fuente === 'SECOP_II' && licit.numero_proceso)
    return `https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?Id=${encodeURIComponent(licit.numero_proceso)}`;
  if (licit.fuente === 'SECOP_I' && licit.numero_proceso)
    return `https://www.contratos.gov.co/consultas/detalleProceso.do?numConstancia=${encodeURIComponent(licit.numero_proceso)}`;
  return licit.fuente === 'SECOP_II'
    ? 'https://community.secop.gov.co'
    : 'https://www.contratos.gov.co';
}

function LicitDetailModal({ licit, onClose }: { licit: Licitacion; onClose: () => void }) {
  const fmt = (n?: number) => n
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
    : 'Sin especificar';
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const secopUrl = buildSecopUrl(licit);

  const row = (label: string, value: string) => value ? (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
      <span style={{ minWidth: 160, fontSize: '0.78rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-main))', flex: 1 }}>{value}</span>
    </div>
  ) : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: 'hsl(var(--bg-card, 220 20% 10%))',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        width: '100%', maxWidth: 720,
        maxHeight: '90vh', overflowY: 'auto',
        padding: '1.5rem',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                background: licit.fuente === 'SECOP_II' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                color: licit.fuente === 'SECOP_II' ? '#3b82f6' : '#10b981',
                border: `1px solid ${licit.fuente === 'SECOP_II' ? 'rgba(59,130,246,0.4)' : 'rgba(16,185,129,0.4)'}`,
              }}>{licit.fuente}</span>
              {licit.match_score !== undefined && <ScoreBadge score={licit.match_score} />}
            </div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
              {licit.entidad_nombre || 'Entidad sin nombre'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>
              {licit.numero_proceso || 'Sin número de proceso'}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)',
            borderRadius: '8px', color: 'hsl(var(--text-muted))', cursor: 'pointer',
            padding: '0.4rem 0.75rem', fontSize: '0.8rem', boxShadow: 'none', marginLeft: '1rem',
          }}>✕ Cerrar</button>
        </div>

        {/* Descripción completa */}
        <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Descripción del proceso</p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'hsl(var(--text-main))', lineHeight: 1.7 }}>{licit.descripcion || 'Sin descripción'}</p>
        </div>

        {/* Datos del proceso */}
        <div style={{ marginBottom: '1.25rem' }}>
          {row('Estado', licit.estado)}
          {row('Modalidad', licit.modalidad)}
          {row('Tipo de contrato', licit.tipo_contrato || '')}
          {row('Presupuesto oficial', fmt(licit.presupuesto))}
          {row('Fecha de publicación', fmtDate(licit.fecha_publicacion))}
          {row('Fecha límite', fmtDate(licit.fecha_limite))}
          {row('Departamento', licit.departamento || '')}
          {row('Municipio', licit.municipio || '')}
          {row('NIT entidad', licit.entidad_nit || '')}
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href={secopUrl} target="_blank" rel="noreferrer" style={{
            padding: '0.6rem 1.25rem',
            background: licit.fuente === 'SECOP_II' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
            border: `1px solid ${licit.fuente === 'SECOP_II' ? 'rgba(59,130,246,0.4)' : 'rgba(16,185,129,0.4)'}`,
            borderRadius: '8px', fontWeight: 700, fontSize: '0.825rem', textDecoration: 'none',
            color: licit.fuente === 'SECOP_II' ? '#3b82f6' : '#10b981',
          }}>
            🔗 Ver proceso en {licit.fuente === 'SECOP_II' ? 'SECOP II' : 'SECOP I'}
          </a>
          <a href={licit.fuente === 'SECOP_II'
              ? `https://www.datos.gov.co/resource/p6dx-8zbt.json?$where=referencia_del_proceso='${encodeURIComponent(licit.numero_proceso)}'`
              : `https://www.datos.gov.co/resource/jbjy-vk9h.json?$where=referencia_del_contrato='${encodeURIComponent(licit.numero_proceso)}'`}
            target="_blank" rel="noreferrer" style={{
              padding: '0.6rem 1.25rem', background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)', borderRadius: '8px',
              fontWeight: 600, fontSize: '0.825rem', textDecoration: 'none', color: 'hsl(var(--text-muted))',
            }}>
            📊 Ver en datos.gov.co
          </a>
          {licit.fuente === 'SECOP_II' && (
            <a href={`https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?Id=${encodeURIComponent(licit.numero_proceso)}`}
              target="_blank" rel="noreferrer" style={{
                padding: '0.6rem 1.25rem', background: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px',
                fontWeight: 600, fontSize: '0.825rem', textDecoration: 'none', color: '#a78bfa',
              }}>
              📄 Documentos del proceso
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function LicitCard({
  licit, onMatch, onGuardar, onNotificar, isAnalyzing, isSaved,
}: {
  licit: Licitacion;
  onMatch: (l: Licitacion) => void;
  onGuardar: (l: Licitacion) => void;
  onNotificar: (l: Licitacion) => void;
  isAnalyzing: boolean;
  isSaved: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const presupuesto = licit.presupuesto
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(licit.presupuesto)
    : 'Sin especificar';

  const fechaPub = licit.fecha_publicacion
    ? new Date(licit.fecha_publicacion).toLocaleDateString('es-CO')
    : 'N/A';

  return (
    <div style={{
      background: 'var(--glass)',
      border: '1px solid var(--glass-border)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <span style={{
              padding: '0.15rem 0.5rem',
              background: licit.fuente === 'SECOP_II' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
              border: `1px solid ${licit.fuente === 'SECOP_II' ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`,
              borderRadius: '4px',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: licit.fuente === 'SECOP_II' ? '#3b82f6' : '#10b981',
              letterSpacing: '0.05em',
            }}>
              {licit.fuente}
            </span>
            {licit.modalidad && (
              <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>
                {licit.modalidad}
              </span>
            )}
            {licit.match_score !== undefined && <ScoreBadge score={licit.match_score} />}
          </div>

          <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-main))', lineHeight: 1.3 }}>
            {licit.entidad_nombre || 'Entidad sin nombre'}
          </h3>

          <p style={{
            margin: '0 0 0.5rem', fontSize: '0.82rem', color: 'hsl(var(--text-muted))', lineHeight: 1.5,
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {licit.descripcion}
          </p>

          {licit.descripcion.length > 180 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'hsl(var(--primary))', fontSize: '0.75rem', padding: 0, marginBottom: '0.5rem',
                boxShadow: 'none',
              }}
            >
              {expanded ? 'Ver menos ↑' : 'Ver más ↓'}
            </button>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
            <span>📋 {licit.numero_proceso || 'Sin referencia'}</span>
            <span>💰 {presupuesto}</span>
            <span>📍 {[licit.departamento, licit.municipio].filter(Boolean).join(' · ') || 'Sin ubicación'}</span>
            <span>📅 {fechaPub}</span>
            <span style={{ padding: '0.1rem 0.4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.7rem' }}>
              {licit.estado}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => onMatch(licit)}
          disabled={isAnalyzing}
          style={{
            padding: '0.4rem 0.8rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '6px', color: '#a78bfa', cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            fontSize: '0.75rem', fontWeight: 600, opacity: isAnalyzing ? 0.6 : 1, boxShadow: 'none',
          }}
        >
          {isAnalyzing ? '⏳ Analizando...' : '🧠 Match IA'}
        </button>

        <button
          onClick={() => onGuardar(licit)}
          disabled={isSaved}
          style={{
            padding: '0.4rem 0.8rem',
            background: isSaved ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isSaved ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)'}`,
            borderRadius: '6px', color: isSaved ? '#10b981' : 'hsl(var(--text-muted))',
            cursor: isSaved ? 'default' : 'pointer', fontSize: '0.75rem', fontWeight: 600, boxShadow: 'none',
          }}
        >
          {isSaved ? '✅ Guardada' : '💾 Guardar'}
        </button>

        <button
          onClick={() => onNotificar(licit)}
          style={{
            padding: '0.4rem 0.8rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '6px', color: '#60a5fa', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, boxShadow: 'none',
          }}
        >
          📬 Telegram
        </button>

        <button
          onClick={() => setShowDetail(true)}
          style={{
            padding: '0.4rem 0.8rem', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '6px', color: '#fbbf24', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, boxShadow: 'none',
          }}
        >
          📋 Ver Detalle
        </button>
      </div>

      {showDetail && <LicitDetailModal licit={licit} onClose={() => setShowDetail(false)} />}
    </div>
  );
}

export function MonitorAgente() {
  const [filtros, setFiltros] = useState<LicitacionFiltros>(FILTROS_DEFAULT);
  const [resultados, setResultados] = useState<Licitacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [telegramMsg, setTelegramMsg] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [autoSearch, setAutoSearch] = useState(false);
  const [autoInterval, setAutoInterval] = useState(30);
  const [lastSearch, setLastSearch] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevResultIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const saved = getLicitacionesGuardadas();
    setSavedIds(new Set(saved.map(l => l.id)));
  }, []);

  useEffect(() => {
    if (autoSearch) {
      intervalRef.current = setInterval(() => handleBuscar(), autoInterval * 60 * 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSearch, autoInterval, filtros]);

  const handleBuscar = async () => {
    setLoading(true);
    setError('');
    setResultados([]);
    const errors: string[] = [];

    // Solo SECOP II — contiene procesos abiertos para presentar propuestas
    // SECOP I (jbjy-vk9h) es dataset de contratos ya ejecutados, no sirve para buscar licitaciones abiertas
    const [res2] = await Promise.allSettled([
      buscarLicitacionesSecop2(filtros, 100),
    ]);

    const r2 = res2.status === 'fulfilled' ? res2.value : (errors.push('SECOP II: ' + (res2.reason as Error).message), []);

    let merged = [...r2].sort((a, b) =>
      (b.fecha_publicacion || '').localeCompare(a.fecha_publicacion || '')
    );

    if (filtros.soloVigentes) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const tope = new Date(hoy); tope.setDate(tope.getDate() + 5); tope.setHours(23, 59, 59, 999);
      merged = merged.filter(l => {
        if (!l.fecha_limite) return true;
        const d = new Date(l.fecha_limite);
        return !isNaN(d.getTime()) && d >= hoy && d <= tope;
      });
    }

    // soloPublicados ya se filtra server-side con estado_de_apertura_del_proceso = 'Abierto'

    setResultados(merged);
    setLastSearch(new Date().toLocaleString('es-CO'));
    if (errors.length > 0) setError(errors.join(' | '));

    // Auto-notificar nuevos resultados por Telegram
    const cfg = getConfig();
    if (cfg.activo && cfg.notificar_nuevas && cfg.bot_token && cfg.chat_id && merged.length > 0) {
      const nuevos = merged.filter(l => !prevResultIdsRef.current.has(l.id));
      if (nuevos.length > 0) {
        let notificados = 0;
        for (const licit of nuevos.slice(0, 5)) {
          const ok = await notificarNuevaLicitacion(licit, cfg);
          if (ok) notificados++;
        }
        if (notificados > 0) {
          setTelegramMsg(`✅ ${notificados} nueva${notificados !== 1 ? 's' : ''} licitación${notificados !== 1 ? 'es' : ''} notificada${notificados !== 1 ? 's' : ''} por Telegram`);
          setTimeout(() => setTelegramMsg(''), 5000);
        }
      }
    }
    prevResultIdsRef.current = new Set(merged.map(l => l.id));

    setLoading(false);
  };

  const handleMatch = async (licit: Licitacion) => {
    setAnalyzingId(licit.id);
    try {
      const perfil = getEmpresaPerfil();
      const rup = getRupData();
      const result = await calcularMatchScore(licit, perfil, rup);
      const updated: Licitacion = { ...licit, match_score: result.score, match_result: result };
      setResultados(prev => prev.map(r => r.id === licit.id ? updated : r));
    } catch (e) {
      setError('Error en análisis IA: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleGuardar = (licit: Licitacion) => {
    saveLicitacion(licit);
    setSavedIds(prev => new Set([...prev, licit.id]));
  };

  const handleNotificar = async (licit: Licitacion) => {
    const cfg: TelegramLicitConfig = getConfig();
    if (!cfg.bot_token || !cfg.chat_id) {
      setTelegramMsg('⚠️ Configura el bot de Telegram en la pestaña Match IA.');
      setTimeout(() => setTelegramMsg(''), 4000);
      return;
    }
    const ok = await notificarNuevaLicitacion({ ...licit, match_score: licit.match_score ?? undefined }, cfg);
    setTelegramMsg(ok ? '✅ Notificación enviada por Telegram' : '❌ No se pudo enviar. Verifica la configuración.');
    setTimeout(() => setTelegramMsg(''), 4000);
  };

  const setFiltro = <K extends keyof LicitacionFiltros>(key: K, value: LicitacionFiltros[K]) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem',
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
    borderRadius: '8px', color: 'hsl(var(--text-main))', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 600,
    color: 'hsl(var(--text-muted))', marginBottom: '0.35rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filtros */}
      <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
          🔍 Filtros de Búsqueda
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Palabras clave</label>
            <input style={inputStyle} placeholder="tecnologia, software, redes, servidores..."
              value={filtros.keywords} onChange={e => setFiltro('keywords', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Entidad</label>
            <input style={inputStyle} placeholder="Nombre de entidad..."
              value={filtros.entidad} onChange={e => setFiltro('entidad', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Departamento</label>
            <select style={inputStyle} value={filtros.departamento} onChange={e => setFiltro('departamento', e.target.value)}>
              <option value="">Todos</option>
              {DEPARTAMENTOS_CO.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ciudad / Municipio</label>
            <input style={inputStyle} placeholder="ej. Bogotá, Medellín, Cali..."
              value={filtros.municipio} onChange={e => setFiltro('municipio', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Modalidad</label>
            <select style={inputStyle} value={filtros.modalidad} onChange={e => setFiltro('modalidad', e.target.value)}>
              <option value="">Todas</option>
              {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Presupuesto mín. (COP)</label>
            <input style={inputStyle} type="number" placeholder="ej. 50000000"
              value={filtros.presupuestoMin} onChange={e => setFiltro('presupuestoMin', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Presupuesto máx. (COP)</label>
            <input style={inputStyle} type="number" placeholder="ej. 500000000"
              value={filtros.presupuestoMax} onChange={e => setFiltro('presupuestoMax', e.target.value)} />
          </div>
        </div>

        {/* Fechas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Publicado desde</label>
            <input type="date" style={inputStyle}
              value={filtros.fechaDesde} onChange={e => setFiltro('fechaDesde', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Publicado hasta</label>
            <input type="date" style={inputStyle}
              value={filtros.fechaHasta} onChange={e => setFiltro('fechaHasta', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: filtros.soloVigentes ? '#10b981' : 'hsl(var(--text-main))' }}>
            <input type="checkbox" checked={filtros.soloVigentes} onChange={e => setFiltro('soloVigentes', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#10b981' }} />
            🟢 Solo vigentes — cierre en los próximos 5 días
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: filtros.soloPublicados ? '#3b82f6' : 'hsl(var(--text-main))' }}>
            <input type="checkbox" checked={filtros.soloPublicados} onChange={e => setFiltro('soloPublicados', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#3b82f6' }} />
            📢 Solo procesos Abiertos (para presentar propuesta)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: autoSearch ? '#10b981' : 'hsl(var(--text-main))' }}>
            <input type="checkbox" checked={autoSearch} onChange={e => setAutoSearch(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#10b981' }} />
            🤖 Auto-búsqueda cada
          </label>

          {autoSearch && (
            <select value={autoInterval} onChange={e => setAutoInterval(Number(e.target.value))}
              style={{ ...inputStyle, width: 'auto', padding: '0.35rem 0.5rem' }}>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>1 hora</option>
              <option value={120}>2 horas</option>
            </select>
          )}

          <button onClick={handleBuscar} disabled={loading}
            style={{
              padding: '0.6rem 1.5rem', background: loading ? 'rgba(59,130,246,0.2)' : 'hsl(var(--primary))',
              border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer', marginLeft: 'auto', boxShadow: 'none',
            }}
          >
            {loading ? '⏳ Buscando...' : '🔍 Buscar en SECOP'}
          </button>
        </div>

        {lastSearch && (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
            Última búsqueda: {lastSearch} · {resultados.length} resultados
            {autoSearch && ` · Próxima en ${autoInterval} min`}
          </p>
        )}
      </div>

      {telegramMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          background: telegramMsg.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
          border: `1px solid ${telegramMsg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
          borderRadius: '8px', fontSize: '0.875rem', color: 'hsl(var(--text-main))',
        }}>
          {telegramMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '0.875rem', color: '#fca5a5' }}>
          ❌ {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
          <p>Consultando SECOP I y SECOP II...</p>
        </div>
      )}

      {!loading && resultados.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
              📊 {resultados.length} procesos encontrados
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
              {resultados.filter(r => r.fuente === 'SECOP_II').length} SECOP II · {resultados.filter(r => r.fuente === 'SECOP_I').length} SECOP I
            </span>
          </div>
          {resultados.map(licit => (
            <LicitCard key={licit.id} licit={licit}
              onMatch={handleMatch} onGuardar={handleGuardar} onNotificar={handleNotificar}
              isAnalyzing={analyzingId === licit.id} isSaved={savedIds.has(licit.id)} />
          ))}
        </div>
      )}

      {!loading && resultados.length === 0 && lastSearch && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'hsl(var(--text-muted))' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔎</div>
          <p>No se encontraron procesos con los filtros actuales.</p>
        </div>
      )}

      {!loading && resultados.length === 0 && !lastSearch && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--glass)', border: '1px dashed var(--glass-border)', borderRadius: '12px', color: 'hsl(var(--text-muted))' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏗️</div>
          <p style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>Monitor de Licitaciones SECOP</p>
          <p style={{ fontSize: '0.875rem' }}>Configura los filtros y haz clic en <strong>Buscar en SECOP</strong> para encontrar oportunidades.</p>
        </div>
      )}
    </div>
  );
}
