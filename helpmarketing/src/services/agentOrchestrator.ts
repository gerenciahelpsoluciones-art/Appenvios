import { supabase } from './supabase';
import type { AgentAction, AgentLog, AgentTask } from '../types/agent.types';

// ─── Encolar tarea para que n8n la ejecute ───────────────────────────────────

export const enqueueAgentTask = async (
  action: AgentAction,
  payload: Record<string, unknown> = {},
  options: { priority?: number; scheduled_at?: Date } = {}
): Promise<AgentTask | null> => {
  const { data, error } = await supabase
    .from('mkt_agent_tasks')
    .insert({
      action,
      payload,
      status: 'pending',
      priority: options.priority ?? 5,
      scheduled_at: options.scheduled_at?.toISOString() ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error encolando tarea del agente:', error.message);
    return null;
  }
  return data as AgentTask;
};

// ─── Escribir un log directamente desde la UI ────────────────────────────────

export const writeAgentLog = async (
  action: string,
  status: AgentLog['status'],
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> => {
  const { error } = await supabase.from('mkt_agent_logs').insert({
    action,
    status,
    message,
    metadata: metadata ?? null,
  });
  if (error) console.error('Error escribiendo log del agente:', error.message);
};

// ─── Suscripción en tiempo real al log (para TopBar y AgentLog) ──────────────

export const subscribeToAgentLogs = (
  callback: (log: AgentLog) => void
) => {
  const channel = supabase
    .channel('mkt_agent_logs_realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mkt_agent_logs' },
      (payload) => callback(payload.new as AgentLog)
    )
    .subscribe();

  // Devuelve función de limpieza
  return () => { supabase.removeChannel(channel); };
};

// ─── Leer los últimos N logs ─────────────────────────────────────────────────

export const getRecentLogs = async (limit = 50): Promise<AgentLog[]> => {
  const { data, error } = await supabase
    .from('mkt_agent_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error leyendo logs del agente:', error.message);
    return [];
  }
  return (data ?? []) as AgentLog[];
};

// ─── Leer configuración del agente ───────────────────────────────────────────

export const getAgentConfig = async <T>(key: string): Promise<T | null> => {
  const { data, error } = await supabase
    .from('mkt_agent_config')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) return null;
  return data.value as T;
};

// ─── Actualizar configuración del agente ─────────────────────────────────────

export const setAgentConfig = async (
  key: string,
  value: unknown
): Promise<boolean> => {
  const { error } = await supabase
    .from('mkt_agent_config')
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) {
    console.error('Error actualizando configuración del agente:', error.message);
    return false;
  }
  return true;
};

// ─── Pausar / reactivar el agente ────────────────────────────────────────────

export const pauseAgent = async (reason?: string): Promise<boolean> => {
  const ok = await setAgentConfig('agent_paused', { paused: true, reason: reason ?? null });
  if (ok) await writeAgentLog('AGENT_PAUSED', 'warning', reason ?? 'Agente pausado manualmente.');
  return ok;
};

export const resumeAgent = async (): Promise<boolean> => {
  const ok = await setAgentConfig('agent_paused', { paused: false, reason: null });
  if (ok) await writeAgentLog('AGENT_RESUMED', 'info', 'Agente reactivado manualmente.');
  return ok;
};

// ─── Suscripción al estado del agente (paused/active) ────────────────────────

export const subscribeToAgentStatus = (
  callback: (paused: boolean) => void
) => {
  const channel = supabase
    .channel('mkt_agent_config_status')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mkt_agent_config',
        filter: 'key=eq.agent_paused',
      },
      (payload) => {
        const val = payload.new.value as { paused: boolean };
        callback(val.paused);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};

// ─── Métricas para el dashboard ──────────────────────────────────────────────

export const getDashboardMetrics = async () => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const weekStartISO = weekStart.toISOString();

  const [seoResult, postsResult, leadsResult, uptimeResult] = await Promise.all([
    // Último score SEO
    supabase
      .from('mkt_seo_snapshots')
      .select('performance_score, seo_score, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    // Posts publicados esta semana
    supabase
      .from('mkt_posts_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', weekStartISO),

    // Leads nuevos
    supabase
      .from('mkt_leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new'),

    // Último check de uptime
    supabase
      .from('mkt_uptime_checks')
      .select('is_up, response_time_ms, checked_at')
      .order('checked_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  return {
    seoScore:      seoResult.data?.performance_score ?? null,
    postsThisWeek: postsResult.count ?? 0,
    newLeads:      leadsResult.count ?? 0,
    siteIsUp:      uptimeResult.data?.is_up ?? null,
    responseTime:  uptimeResult.data?.response_time_ms ?? null,
    lastSeoCheck:  seoResult.data?.created_at ?? null,
  };
};
