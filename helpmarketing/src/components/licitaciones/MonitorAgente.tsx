import { useState, useEffect, useRef } from 'react';
import type { Licitacion, LicitacionFiltros, TelegramLicitConfig } from '../../types/licitaciones.types';
import { DEPARTAMENTOS_CO, MODALIDADES } from '../../types/licitaciones.types';
import { buscarLicitacionesSecop2, buscarLicitacionesSecop1 } from '../../services/secopService';
import { calcularMatchScore } from '../../services/licitacionesAI';
import { notificarNuevaLicitacion, getConfig } from '../../services/telegramLicit';
import { getLicitacionesGuardadas, saveLicitacion, getEmpresaPerfil } from './store';

const FILTROS_DEFAULT: LicitacionFiltros = {
  keywords: 'tecnologia software sistemas',
  entidad: '',
  departamento: '',
  modalidad: '',
  estado: '',
  presupuestoMin: '',
  presupuestoMax: '',
  soloActivas: true,
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
      <span style={{ fontSize: '1rem' }}>
        {score >= 70 ? '🟢' : score >= 40 ? '🟡' : '🔴'}
      </span>
      {score}/100 · {label}
    </div>
  );
}

function LicitCard({
  licit,
  onMatch,
  onGuardar,
  onNotificar,
  isAnalyzing,
  isSaved,
}: {
  licit: Licitacion;
  onMatch: (l: Licitacion) => void;
  onGuardar: (l: Licitacion) => void;
  onNotificar: (l: Licitacion) => void;
  isAnalyzing: boolean;
  isSaved: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

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
      transition: 'border-color 0.2s',
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

          <h3 style={{
            margin: '0 0 0.25rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'hsl(var(--text-main))',
            lineHeight: 1.3,
          }}>
            {licit.entidad_nombre || 'Entidad sin nombre'}
          </h3>

          <p style={{
            margin: '0 0 0.5rem',
            fontSize: '0.82rem',
            color: 'hsl(var(--text-muted))',
            lineHeight: 1.5,
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
            <span style={{
              padding: '0.1rem 0.4rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '4px',
              fontSize: '0.7rem',
            }}>
              {licit.estado}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => onMatch(licit)}
          disabled={isAnalyzing}
          style={{
            padding: '0.4rem 0.8rem',
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '6px',
            color: '#a78bfa',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            opacity: isAnalyzing ? 0.6 : 1,
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
            borderRadius: '6px',
            color: isSaved ? '#10b981' : 'hsl(var(--text-muted))',
            cursor: isSaved ? 'default' : 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {isSaved ? '✅ Guardada' : '💾 Guardar'}
        </button>

        <button
          onClick={() => onNotificar(licit)}
          style={{
            padding: '0.4rem 0.8rem',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '6px',
            color: '#60a5fa',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          📬 Telegram
        </button>

        {licit.url_proceso && (
          <a
            href={licit.url_proceso}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '0.4rem 0.8rem',
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              borderRadius: '6px',
              color: 'hsl(var(--text-muted))',
              textDecoration: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            🔗 Ver SECOP
          </a>
        )}
      </div>
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
    try {
      const [r2, r1] = await Promise.all([
        buscarLicitacionesSecop2(filtros),
        buscarLicitacionesSecop1(filtros),
      ]);
      const merged = [...r2, ...r1].sort((a, b) =>
        (b.fecha_publicacion || '').localeCompare(a.fecha_publicacion || '')
      );
      setResultados(merged);
      setLastSearch(new Date().toLocaleString('es-CO'));
    } catch {
      setError('Error consultando SECOP. Verifica la conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (licit: Licitacion) => {
    setAnalyzingId(licit.id);
    try {
      const perfil = getEmpresaPerfil();
      const result = await calcularMatchScore(licit, perfil);
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
      setTelegramMsg('⚠️ Configura el bot de Telegram en la sección de Hitos o Match IA.');
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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'hsl(var(--text-muted))',
    marginBottom: '0.35rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filtros */}
      <div style={{
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '1.25rem',
      }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
          🔍 Filtros de Búsqueda
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Palabras clave</label>
            <input
              style={inputStyle}
              placeholder="tecnologia, software, redes, servidores..."
              value={filtros.keywords}
              onChange={e => setFiltro('keywords', e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Entidad</label>
            <input
              style={inputStyle}
              placeholder="Nombre de entidad..."
              value={filtros.entidad}
              onChange={e => setFiltro('entidad', e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Departamento</label>
            <select style={inputStyle} value={filtros.departamento} onChange={e => setFiltro('departamento', e.target.value)}>
              <option value="">Todos</option>
              {DEPARTAMENTOS_CO.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
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
            <input
              style={inputStyle}
              type="number"
              placeholder="ej. 50000000"
              value={filtros.presupuestoMin}
              onChange={e => setFiltro('presupuestoMin', e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Presupuesto máx. (COP)</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="ej. 500000000"
              value={filtros.presupuestoMax}
              onChange={e => setFiltro('presupuestoMax', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'hsl(var(--text-main))' }}>
            <input
              type="checkbox"
              checked={filtros.soloActivas}
              onChange={e => setFiltro('soloActivas', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'hsl(var(--primary))' }}
            />
            Solo procesos activos
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: autoSearch ? '#10b981' : 'hsl(var(--text-main))' }}>
            <input
              type="checkbox"
              checked={autoSearch}
              onChange={e => setAutoSearch(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#10b981' }}
            />
            🤖 Auto-búsqueda cada
          </label>

          {autoSearch && (
            <select
              value={autoInterval}
              onChange={e => setAutoInterval(Number(e.target.value))}
              style={{ ...inputStyle, width: 'auto', padding: '0.35rem 0.5rem' }}
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>1 hora</option>
              <option value={120}>2 horas</option>
            </select>
          )}

          <button
            onClick={handleBuscar}
            disabled={loading}
            style={{
              padding: '0.6rem 1.5rem',
              background: loading ? 'rgba(59,130,246,0.2)' : 'hsl(var(--primary))',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginLeft: 'auto',
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

      {/* Telegram feedback */}
      {telegramMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          background: telegramMsg.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
          border: `1px solid ${telegramMsg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: 'hsl(var(--text-main))',
        }}>
          {telegramMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#fca5a5',
        }}>
          ❌ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
          <p>Consultando SECOP I y SECOP II...</p>
        </div>
      )}

      {/* Results */}
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
            <LicitCard
              key={licit.id}
              licit={licit}
              onMatch={handleMatch}
              onGuardar={handleGuardar}
              onNotificar={handleNotificar}
              isAnalyzing={analyzingId === licit.id}
              isSaved={savedIds.has(licit.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && resultados.length === 0 && lastSearch && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          background: 'var(--glass)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          color: 'hsl(var(--text-muted))',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔎</div>
          <p>No se encontraron procesos con los filtros actuales.</p>
          <p style={{ fontSize: '0.825rem' }}>Prueba con palabras clave más generales o sin filtros de departamento.</p>
        </div>
      )}

      {!loading && resultados.length === 0 && !lastSearch && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          background: 'var(--glass)',
          border: '1px dashed var(--glass-border)',
          borderRadius: '12px',
          color: 'hsl(var(--text-muted))',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏗️</div>
          <p style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>Monitor de Licitaciones SECOP</p>
          <p style={{ fontSize: '0.875rem' }}>Configura los filtros y haz clic en <strong>Buscar en SECOP</strong> para encontrar oportunidades de negocio.</p>
        </div>
      )}
    </div>
  );
}
