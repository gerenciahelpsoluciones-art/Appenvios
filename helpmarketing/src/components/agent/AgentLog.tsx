import { useState, useEffect, useRef } from 'react';
import {
  getRecentLogs,
  subscribeToAgentLogs,
} from '../../services/agentOrchestrator';
import type { AgentLog, AgentLogStatus } from '../../types/agent.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AgentLogStatus, { color: string; bg: string; icon: string; label: string }> = {
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: '✅', label: 'Éxito'     },
  error:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: '❌', label: 'Error'     },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '⚠️', label: 'Alerta'   },
  info:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: 'ℹ️', label: 'Info'     },
};

const ACTION_LABELS: Record<string, string> = {
  SEO_AUDIT:          'Auditoría SEO',
  KEYWORD_CHECK:      'Check Keywords',
  POST_SOCIAL:        'Publicación Social',
  LEAD_SCAN:          'Escaneo de Leads',
  COMPETITOR_MONITOR: 'Monitor Competencia',
  WEEKLY_REPORT:      'Reporte Semanal',
  UPTIME_CHECK:       'Check Uptime',
  GENERATE_CONTENT:   'Generación de Contenido',
  AGENT_PAUSED:       'Agente Pausado',
  AGENT_RESUMED:      'Agente Reactivado',
  SEO_ALERT:          'Alerta SEO',
  UPTIME_ALERT:       'Alerta Uptime',
  TELEGRAM_MSG:       'Mensaje Telegram',
  QUOTE_EXTRACTED:    'Extracción Cotización',
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('es-CO', {
    month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function AgentLog() {
  const [logs, setLogs]               = useState<AgentLog[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<AgentLogStatus | 'all'>('all');
  const [autoScroll, setAutoScroll]   = useState(true);
  const [newCount, setNewCount]       = useState(0);
  const [searchTerm, setSearchTerm]   = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  // ── Carga inicial ──
  useEffect(() => {
    getRecentLogs(100).then(data => {
      setLogs(data.reverse()); // más recientes al final
      setLoading(false);
    });
  }, []);

  // ── Suscripción Realtime ──
  useEffect(() => {
    const unsub = subscribeToAgentLogs(newLog => {
      setLogs(prev => [...prev, newLog]);
      setNewCount(prev => prev + 1);
      setTimeout(() => setNewCount(prev => Math.max(0, prev - 1)), 5000);
    });
    return unsub;
  }, []);

  // ── Auto-scroll ──
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // ── Filtrado ──
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.status === filter;
    const matchesSearch = !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.message ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // ── Estadísticas ──
  const stats = {
    total:   logs.length,
    success: logs.filter(l => l.status === 'success').length,
    error:   logs.filter(l => l.status === 'error').length,
    warning: logs.filter(l => l.status === 'warning').length,
    info:    logs.filter(l => l.status === 'info').length,
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>
            Registro del Agente
            {newCount > 0 && (
              <span style={{
                marginLeft: '0.75rem', padding: '0.1rem 0.6rem',
                background: 'hsl(var(--primary))', borderRadius: '999px',
                fontSize: '0.7rem', fontWeight: 700, color: 'white',
                animation: 'pulse 1s infinite',
              }}>
                +{newCount} nuevo{newCount !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem' }}>
            Feed en tiempo real de todas las acciones del agente autónomo
          </p>
        </div>

        {/* Auto-scroll toggle */}
        <button
          onClick={() => setAutoScroll(prev => !prev)}
          style={{
            padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.8rem',
            background: autoScroll ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${autoScroll ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
            color: autoScroll ? '#10b981' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
          }}
        >
          {autoScroll ? '↓ Auto-scroll ON' : '↓ Auto-scroll OFF'}
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
        {[
          { label: 'Total', value: stats.total, color: 'hsl(var(--text-primary))' },
          { label: 'Éxito',  value: stats.success, color: '#10b981' },
          { label: 'Errores', value: stats.error, color: '#ef4444' },
          { label: 'Alertas', value: stats.warning, color: '#f59e0b' },
          { label: 'Info',   value: stats.info,    color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ textAlign: 'center', padding: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros + búsqueda */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Filtros de estado */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['all', 'success', 'error', 'warning', 'info'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.775rem',
                cursor: 'pointer', transition: 'all 0.15s',
                background: filter === f
                  ? (f === 'all' ? 'hsl(var(--primary))' : STATUS_CONFIG[f as AgentLogStatus]?.bg)
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === f
                  ? (f === 'all' ? 'hsl(var(--primary))' : STATUS_CONFIG[f as AgentLogStatus]?.color)
                  : 'rgba(255,255,255,0.08)'}`,
                color: filter === f
                  ? (f === 'all' ? 'white' : STATUS_CONFIG[f as AgentLogStatus]?.color)
                  : 'hsl(var(--text-muted))',
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f === 'all' ? 'Todos' : STATUS_CONFIG[f as AgentLogStatus].label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar en logs..."
          style={{
            flex: 1, minWidth: '180px', padding: '0.4rem 0.75rem',
            borderRadius: '8px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'hsl(var(--text-primary))', fontSize: '0.8rem',
          }}
        />

        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap' }}>
          {filteredLogs.length} resultado{filteredLogs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Log feed */}
      <div
        ref={listRef}
        className="glass-card"
        style={{
          flex: 1, overflowY: 'auto', padding: '1rem',
          maxHeight: '60vh', display: 'flex', flexDirection: 'column', gap: '0.4rem',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        }}
        onScroll={e => {
          const el = e.currentTarget;
          const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
          setAutoScroll(isAtBottom);
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
            Cargando registros...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
            {searchTerm || filter !== 'all'
              ? 'Sin resultados para este filtro'
              : 'Sin registros aún. El agente escribirá aquí cuando ejecute tareas.'}
          </div>
        ) : (
          filteredLogs.map((log, i) => {
            const cfg = STATUS_CONFIG[log.status];
            return (
              <div
                key={log.id}
                style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                  padding: '0.55rem 0.75rem', borderRadius: '6px',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  borderLeft: `3px solid ${cfg.color}`,
                  transition: 'background 0.1s',
                }}
              >
                {/* Timestamp */}
                <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', flexShrink: 0, width: '80px', paddingTop: '2px' }}>
                  {formatRelative(log.created_at)}
                </span>

                {/* Icono + Status */}
                <span style={{ flexShrink: 0, fontSize: '0.875rem' }}>{cfg.icon}</span>

                {/* Acción */}
                <span style={{
                  flexShrink: 0, width: '160px', fontSize: '0.775rem',
                  fontWeight: 700, color: cfg.color, paddingTop: '2px',
                }}>
                  {ACTION_LABELS[log.action] ?? log.action}
                </span>

                {/* Mensaje */}
                <span style={{
                  flex: 1, fontSize: '0.775rem',
                  color: 'hsl(var(--text-primary))', wordBreak: 'break-word',
                  paddingTop: '2px',
                }}>
                  {log.message ?? '—'}
                </span>

                {/* Metadata (si hay) */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <details style={{ flexShrink: 0 }}>
                    <summary style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                      meta
                    </summary>
                    <pre style={{
                      fontSize: '0.65rem', color: 'hsl(var(--text-muted))',
                      background: 'rgba(0,0,0,0.3)', padding: '0.4rem',
                      borderRadius: '4px', marginTop: '0.25rem',
                      maxWidth: '300px', overflow: 'auto',
                    }}>
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Fecha completa al hover via title */}
                <span
                  title={formatDateTime(log.created_at)}
                  style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)', flexShrink: 0, paddingTop: '3px', cursor: 'default' }}
                >
                  🕐
                </span>
              </div>
            );
          })
        )}

        {/* Ancla para auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#10b981', boxShadow: '0 0 6px #10b981',
          animation: 'pulse 2s infinite',
        }} />
        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
          Conectado en tiempo real · Supabase Realtime
        </span>
      </div>

    </div>
  );
}
