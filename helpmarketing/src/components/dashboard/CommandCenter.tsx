import { useEffect, useState } from 'react';
import { getDashboardMetrics, getRecentLogs } from '../../services/agentOrchestrator';
import type { AgentLog } from '../../types/agent.types';
import type { Tab } from '../../App';

interface Metrics {
  seoScore:      number | null;
  postsThisWeek: number;
  newLeads:      number;
  siteIsUp:      boolean | null;
  responseTime:  number | null;
  lastSeoCheck:  string | null;
}

const timeAgo = (isoDate: string): string => {
  const diff  = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'ahora mismo';
  if (mins  < 60) return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
};

const logStatusIcon: Record<AgentLog['status'], string> = {
  success: '✓',
  info:    'ℹ',
  warning: '⚠',
  error:   '✗',
};

const logStatusColor: Record<AgentLog['status'], string> = {
  success: 'hsl(var(--success))',
  info:    'hsl(var(--primary))',
  warning: '#f59e0b',
  error:   '#ef4444',
};

interface Props {
  onNavigate: (tab: Tab) => void;
}

export function CommandCenter({ onNavigate }: Props) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [logs,    setLogs]    = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [m, l] = await Promise.all([
        getDashboardMetrics(),
        getRecentLogs(8),
      ]);
      setMetrics(m);
      setLogs(l);
      setLoading(false);
    };
    load();

    // Refrescar métricas cada 60 segundos
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const seoColor = (score: number | null) => {
    if (score === null) return 'hsl(var(--text-muted))';
    if (score >= 80)   return 'hsl(var(--success))';
    if (score >= 60)   return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.2rem' }}>Agent Command Center</h1>
      <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
        Monitoreando <strong style={{ color: 'hsl(var(--primary))' }}>helpsoluciones.com.co</strong>
      </p>

      {/* ── Métricas principales ─────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {/* SEO Score */}
        <div className="glass-card stat-item">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>SEO SCORE</span>
          {loading ? (
            <span className="stat-value" style={{ color: 'hsl(var(--text-muted))' }}>—</span>
          ) : (
            <span className="stat-value" style={{ color: seoColor(metrics?.seoScore ?? null) }}>
              {metrics?.seoScore ?? '—'}
            </span>
          )}
          {metrics?.lastSeoCheck && (
            <span style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem' }}>
              {timeAgo(metrics.lastSeoCheck)}
            </span>
          )}
          {!metrics?.lastSeoCheck && !loading && (
            <span style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem' }}>Sin datos aún</span>
          )}
        </div>

        {/* Posts esta semana */}
        <div className="glass-card stat-item">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>POSTS / SEMANA</span>
          <span className="stat-value">
            {loading ? '—' : metrics?.postsThisWeek ?? 0}
          </span>
          <span style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem' }}>publicados</span>
        </div>

        {/* Leads nuevos */}
        <div className="glass-card stat-item">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>LEADS NUEVOS</span>
          <span className="stat-value" style={{ color: metrics?.newLeads ? 'hsl(var(--primary))' : undefined }}>
            {loading ? '—' : metrics?.newLeads ?? 0}
          </span>
          <span style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem' }}>sin contactar</span>
        </div>

        {/* Estado del sitio */}
        <div className="glass-card stat-item">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>SITIO WEB</span>
          {loading ? (
            <span className="stat-value" style={{ color: 'hsl(var(--text-muted))' }}>—</span>
          ) : metrics?.siteIsUp === null ? (
            <span className="stat-value" style={{ color: 'hsl(var(--text-muted))' }}>Sin datos</span>
          ) : (
            <span className="stat-value" style={{ color: metrics?.siteIsUp ? 'hsl(var(--success))' : '#ef4444', fontSize: '1.2rem' }}>
              {metrics?.siteIsUp ? '● EN LÍNEA' : '● CAÍDO'}
            </span>
          )}
          {metrics?.responseTime != null && (
            <span style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem' }}>
              {metrics.responseTime}ms
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* ── Acciones rápidas ─────────────────────────────────────── */}
        <div className="glass-card" style={{ textAlign: 'left' }}>
          <h3 style={{ marginBottom: '1.2rem' }}>⚡ Acciones Rápidas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button onClick={() => onNavigate('studio')} style={{ textAlign: 'left' }}>
              ✍ Crear contenido para redes
            </button>
            <button onClick={() => onNavigate('leads')} style={{ textAlign: 'left' }}>
              🎯 Buscar nuevos leads
            </button>
            <button onClick={() => onNavigate('seo')} style={{ textAlign: 'left' }}>
              🔍 Auditar SEO del sitio
            </button>
            <button onClick={() => onNavigate('vitals')} style={{ textAlign: 'left', opacity: 0.6, cursor: 'not-allowed' }} disabled>
              📊 Ver Web Vitals — Próximamente
            </button>
          </div>
        </div>

        {/* ── Últimas acciones del agente ───────────────────────────── */}
        <div className="glass-card" style={{ textAlign: 'left' }}>
          <h3 style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🤖 Últimas Acciones del Agente</span>
            <span
              style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', cursor: 'pointer', fontWeight: 400 }}
              onClick={() => onNavigate('agentlog')}
            >
              Ver todo →
            </span>
          </h3>

          {loading && (
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem' }}>Cargando...</p>
          )}

          {!loading && logs.length === 0 && (
            <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💤</div>
              <p>El agente aún no ha ejecutado acciones.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Configúralo en <strong>Controlador del Agente</strong>.</p>
            </div>
          )}

          {!loading && logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--glass-border)',
              }}
            >
              <span style={{
                color: logStatusColor[log.status],
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
                marginTop: '1px',
              }}>
                {logStatusIcon[log.status]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.82rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.message ?? log.action}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                  {log.action} · {timeAgo(log.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Estado del sistema ──────────────────────────────────── */}
      <div className="glass-card" style={{ textAlign: 'left' }}>
        <h3 style={{ marginBottom: '1rem' }}>📡 Estado del Sistema</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Base de datos',    ok: true,  note: 'Supabase conectado' },
            { label: 'IA Generativa',    ok: true,  note: 'Gemini Flash activo' },
            { label: 'Automatización',   ok: false, note: 'n8n — configurar webhook' },
            { label: 'RRSS',             ok: false, note: 'Pendiente Fase 3' },
            { label: 'SEO Monitor',      ok: false, note: 'Pendiente Fase 2' },
            { label: 'Uptime Monitor',   ok: false, note: 'Pendiente Fase 2' },
          ].map(({ label, ok, note }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: ok ? 'hsl(var(--success))' : 'hsl(var(--text-muted))',
                flexShrink: 0,
              }} />
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>{label}</p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>{note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
