import { useEffect, useState } from 'react';
import {
  subscribeToAgentLogs,
  subscribeToAgentStatus,
  getAgentConfig,
  pauseAgent,
  resumeAgent,
} from '../../services/agentOrchestrator';
import type { AgentLog } from '../../types/agent.types';

const timeAgo = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'hace un momento';
  if (mins  < 60) return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
};

const statusColor: Record<AgentLog['status'], string> = {
  success: 'hsl(var(--success))',
  info:    'hsl(var(--primary))',
  warning: '#f59e0b',
  error:   '#ef4444',
};

export function TopBar() {
  const [isPaused,    setIsPaused]    = useState(false);
  const [lastLog,     setLastLog]     = useState<AgentLog | null>(null);
  const [pendingCount,setPendingCount]= useState(0);
  const [toggling,    setToggling]    = useState(false);

  // Cargar estado inicial
  useEffect(() => {
    getAgentConfig<{ paused: boolean }>('agent_paused').then((cfg) => {
      if (cfg) setIsPaused(cfg.paused);
    });
  }, []);

  // Escuchar cambios de estado del agente en tiempo real
  useEffect(() => {
    const unsub = subscribeToAgentStatus(setIsPaused);
    return unsub;
  }, []);

  // Escuchar logs en tiempo real
  useEffect(() => {
    const unsub = subscribeToAgentLogs((log) => {
      setLastLog(log);
      if (log.status === 'warning' || log.status === 'error') {
        setPendingCount((c) => c + 1);
      }
    });
    return unsub;
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    if (isPaused) {
      await resumeAgent();
    } else {
      await pauseAgent('Pausado manualmente desde el panel.');
    }
    setToggling(false);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 2rem',
      borderBottom: '1px solid var(--glass-border)',
      background: 'hsl(var(--surface))',
      flexShrink: 0,
    }}>
      {/* Estado del agente */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: isPaused ? '#ef4444' : 'hsl(var(--success))',
            boxShadow: isPaused ? 'none' : '0 0 8px hsl(var(--success))',
            display: 'inline-block',
            animation: isPaused ? 'none' : 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Agente: <strong style={{ color: isPaused ? '#ef4444' : 'hsl(var(--success))' }}>
              {isPaused ? 'PAUSADO' : 'ACTIVO'}
            </strong>
          </span>
        </div>

        <button
          onClick={handleToggle}
          disabled={toggling}
          style={{
            fontSize: '0.75rem',
            padding: '0.3rem 0.8rem',
            background: isPaused ? 'hsl(var(--success) / 0.15)' : 'rgba(239,68,68,0.15)',
            color: isPaused ? 'hsl(var(--success))' : '#ef4444',
            border: `1px solid ${isPaused ? 'hsl(var(--success) / 0.4)' : 'rgba(239,68,68,0.4)'}`,
            borderRadius: '6px',
            cursor: toggling ? 'wait' : 'pointer',
            opacity: toggling ? 0.6 : 1,
          }}
        >
          {toggling ? '...' : isPaused ? '▶ Activar' : '⏸ Pausar'}
        </button>
      </div>

      {/* Última acción */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {lastLog && (
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[lastLog.status], display: 'inline-block' }} />
            <span style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lastLog.message}
            </span>
            <span style={{ opacity: 0.5 }}>· {timeAgo(lastLog.created_at)}</span>
          </div>
        )}

        {/* Alertas pendientes */}
        {pendingCount > 0 && (
          <div
            style={{
              background: 'rgba(239,68,68,0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '20px',
              padding: '0.2rem 0.7rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={() => setPendingCount(0)}
            title="Clic para limpiar alertas"
          >
            ⚠ {pendingCount} {pendingCount === 1 ? 'alerta' : 'alertas'}
          </div>
        )}

        {/* Enlace al sitio */}
        <a
          href="https://helpsoluciones.com.co"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.8rem',
            color: 'hsl(var(--primary))',
            textDecoration: 'none',
            opacity: 0.8,
          }}
        >
          helpsoluciones.com.co ↗
        </a>
      </div>
    </div>
  );
}
