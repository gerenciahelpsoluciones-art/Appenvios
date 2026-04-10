import { useState, useEffect } from 'react';
import {
  enqueueAgentTask,
  pauseAgent,
  resumeAgent,
  getAgentConfig,
  setAgentConfig,
  getRecentLogs,
  subscribeToAgentStatus,
} from '../../services/agentOrchestrator';
import type { AgentAction, AgentLog } from '../../types/agent.types';

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface QuickAction {
  action: AgentAction;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { action: 'SEO_AUDIT',           label: 'Auditoría SEO',        icon: '🔍', description: 'Analiza Core Web Vitals y posicionamiento',   color: 'hsl(var(--primary))' },
  { action: 'KEYWORD_CHECK',       label: 'Check Keywords',        icon: '📊', description: 'Actualiza posiciones en Google',              color: 'hsl(var(--accent))' },
  { action: 'POST_SOCIAL',         label: 'Generar Contenido',     icon: '✍️', description: 'Crea y agenda posts para hoy',                color: '#10b981' },
  { action: 'LEAD_SCAN',           label: 'Escanear Leads',        icon: '🎯', description: 'Busca nuevas oportunidades B2B',              color: '#f59e0b' },
  { action: 'COMPETITOR_MONITOR',  label: 'Monitor Competencia',   icon: '🕵️', description: 'Analiza movimientos de competidores',         color: '#8b5cf6' },
  { action: 'WEEKLY_REPORT',       label: 'Reporte Semanal',       icon: '📈', description: 'Genera informe de rendimiento de la semana',  color: '#ec4899' },
  { action: 'UPTIME_CHECK',        label: 'Check Uptime',          icon: '🌐', description: 'Verifica disponibilidad del sitio web',       color: '#06b6d4' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  success: '#10b981',
  error:   '#ef4444',
  warning: '#f59e0b',
  info:    'hsl(var(--primary))',
};

const statusIcon: Record<string, string> = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// ─── Componente principal ─────────────────────────────────────────────────────

export function AgentController() {
  const [isPaused, setIsPaused]         = useState(false);
  const [recentLogs, setRecentLogs]     = useState<AgentLog[]>([]);
  const [triggeringAction, setTriggering] = useState<string | null>(null);
  const [togglingPause, setTogglingPause] = useState(false);
  const [toastMsg, setToastMsg]          = useState<string | null>(null);

  // Config editable
  const [targetUrl, setTargetUrl]   = useState('https://helpsoluciones.com.co');
  const [keywords, setKeywords]     = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // ── Cargar estado inicial ──
  useEffect(() => {
    loadInitialState();
    const unsub = subscribeToAgentStatus(setIsPaused);
    return unsub;
  }, []);

  const loadInitialState = async () => {
    const [pauseConf, urlConf, kwConf, logs] = await Promise.all([
      getAgentConfig<{ paused: boolean }>('agent_paused'),
      getAgentConfig<string>('target_url'),
      getAgentConfig<string[]>('seo_keywords'),
      getRecentLogs(10),
    ]);

    if (pauseConf)  setIsPaused(pauseConf.paused);
    if (urlConf)    setTargetUrl(urlConf);
    if (kwConf)     setKeywords(kwConf);
    setRecentLogs(logs);
  };

  // ── Toast ──
  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ── Disparar acción manual ──
  const triggerAction = async (qa: QuickAction) => {
    setTriggering(qa.action);
    const task = await enqueueAgentTask(qa.action, { source: 'manual_trigger' }, { priority: 8 });
    setTriggering(null);

    if (task) {
      toast(`Tarea "${qa.label}" encolada — n8n la ejecutará en breve`);
      // Refrescar logs
      setTimeout(async () => {
        const logs = await getRecentLogs(10);
        setRecentLogs(logs);
      }, 1500);
    } else {
      toast('Error al encolar la tarea. Revisa la conexión con Supabase.');
    }
  };

  // ── Pausar / reanudar ──
  const togglePause = async () => {
    setTogglingPause(true);
    if (isPaused) {
      await resumeAgent();
      toast('Agente reactivado');
    } else {
      await pauseAgent('Pausado desde el Controlador');
      toast('Agente pausado');
    }
    setTogglingPause(false);
  };

  // ── Guardar configuración ──
  const saveConfig = async () => {
    setSavingConfig(true);
    const [a, b] = await Promise.all([
      setAgentConfig('target_url', targetUrl),
      setAgentConfig('seo_keywords', keywords),
    ]);
    setSavingConfig(false);
    toast(a && b ? 'Configuración guardada' : 'Error guardando configuración');
  };

  const addKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords(prev => [...prev, kw]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(prev => prev.filter(k => k !== kw));
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary))',
          borderRadius: '8px', padding: '0.75rem 1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          color: 'hsl(var(--text-primary))', fontSize: '0.875rem',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header con estado del agente */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Controlador del Agente</h1>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem' }}>
            Panel de control y supervisión del agente autónomo HelpMarketer
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Estado */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '999px',
            background: isPaused ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: `1px solid ${isPaused ? '#ef4444' : '#10b981'}`,
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isPaused ? '#ef4444' : '#10b981',
              boxShadow: isPaused ? '0 0 6px #ef4444' : '0 0 6px #10b981',
              animation: isPaused ? 'none' : 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isPaused ? '#ef4444' : '#10b981' }}>
              {isPaused ? 'PAUSADO' : 'ACTIVO'}
            </span>
          </div>

          {/* Botón pausar/reanudar */}
          <button
            className="btn btn-primary"
            onClick={togglePause}
            disabled={togglingPause}
            style={{
              background: isPaused ? 'hsl(var(--primary))' : 'rgba(239,68,68,0.2)',
              borderColor: isPaused ? 'hsl(var(--primary))' : '#ef4444',
              color: isPaused ? 'white' : '#ef4444',
            }}
          >
            {togglingPause ? '...' : isPaused ? '▶ Reanudar' : '⏸ Pausar'}
          </button>
        </div>
      </div>

      {/* Grid: Acciones rápidas + Últimos logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Acciones rápidas */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'hsl(var(--text-muted))', letterSpacing: '0.08em' }}>
            DISPARAR ACCIÓN MANUAL
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {QUICK_ACTIONS.map(qa => (
              <button
                key={qa.action}
                onClick={() => triggerAction(qa)}
                disabled={!!triggeringAction || isPaused}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: '8px',
                  background: triggeringAction === qa.action ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid rgba(255,255,255,0.08)`,
                  cursor: isPaused || triggeringAction ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  opacity: isPaused ? 0.5 : 1,
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (!isPaused && !triggeringAction)
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{qa.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: qa.color }}>
                    {triggeringAction === qa.action ? 'Encolando...' : qa.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '1px' }}>
                    {qa.description}
                  </div>
                </div>
                <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>→</span>
              </button>
            ))}
          </div>
          {isPaused && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#f59e0b', textAlign: 'center' }}>
              ⚠️ El agente está pausado. Reactívalo para disparar acciones.
            </p>
          )}
        </div>

        {/* Últimos logs */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'hsl(var(--text-muted))', letterSpacing: '0.08em' }}>
            ÚLTIMAS ACTIVIDADES
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentLogs.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                Sin actividad registrada aún
              </p>
            ) : (
              recentLogs.map(log => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                    padding: '0.6rem 0.75rem', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.02)',
                    borderLeft: `3px solid ${statusColor[log.status]}`,
                  }}
                >
                  <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>{statusIcon[log.status]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: statusColor[log.status] }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '1px', wordBreak: 'break-word' }}>
                      {log.message}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', flexShrink: 0, marginTop: '2px' }}>
                    {formatTime(log.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Configuración del agente */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: 'hsl(var(--text-muted))', letterSpacing: '0.08em' }}>
          CONFIGURACIÓN DEL AGENTE
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

          {/* URL objetivo */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              URL del Sitio Web
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              placeholder="https://helpsoluciones.com.co"
              style={{
                width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'hsl(var(--text-primary))', fontSize: '0.875rem', boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '0.4rem' }}>
              El agente monitoreará este dominio para SEO y uptime.
            </p>
          </div>

          {/* Keywords */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Keywords a Monitorear
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addKeyword()}
                placeholder="ej: mantenimiento servidores bogotá"
                style={{
                  flex: 1, padding: '0.6rem 0.75rem', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'hsl(var(--text-primary))', fontSize: '0.875rem',
                }}
              />
              <button
                className="btn btn-primary"
                onClick={addKeyword}
                style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
              >
                + Agregar
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '80px', overflowY: 'auto' }}>
              {keywords.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Sin keywords configuradas</span>
              ) : (
                keywords.map(kw => (
                  <span
                    key={kw}
                    onClick={() => removeKeyword(kw)}
                    title="Click para eliminar"
                    style={{
                      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem',
                      background: 'rgba(var(--primary-rgb),0.15)', border: '1px solid hsl(var(--primary))',
                      color: 'hsl(var(--primary))', cursor: 'pointer',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {kw} ×
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={saveConfig}
            disabled={savingConfig}
          >
            {savingConfig ? 'Guardando...' : '💾 Guardar Configuración'}
          </button>
        </div>
      </div>

      {/* Info pipelines */}
      <div className="glass-card" style={{ background: 'rgba(var(--primary-rgb),0.05)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'hsl(var(--text-muted))', letterSpacing: '0.08em' }}>
          PIPELINES ACTIVOS EN N8N
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { name: 'SEO Diario',          cron: 'Cada 24h',   icon: '🔍', status: 'activo' },
            { name: 'Uptime Monitor',      cron: 'Cada 5 min', icon: '🌐', status: 'activo' },
            { name: 'Social Publisher',    cron: 'Cada 2h',    icon: '📲', status: 'activo' },
            { name: 'Keyword Tracker',     cron: 'Cada 12h',   icon: '📊', status: 'activo' },
            { name: 'Lead Scanner',        cron: 'Lunes 9am',  icon: '🎯', status: 'activo' },
            { name: 'Reporte Semanal',     cron: 'Viernes 6pm',icon: '📈', status: 'activo' },
          ].map(p => (
            <div
              key={p.name}
              style={{
                padding: '0.75rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span>{p.icon}</span>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{p.name}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>{p.cron}</div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: isPaused ? '#ef4444' : '#10b981' }}>
                ● {isPaused ? 'pausado' : p.status}
              </div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
          Los workflows se ejecutan en n8n. El agente lee <code>mkt_agent_paused</code> antes de cada ejecución.
        </p>
      </div>

    </div>
  );
}
