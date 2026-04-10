import { supabase } from './supabase';
import { writeAgentLog, getAgentConfig, setAgentConfig } from './agentOrchestrator';
import type { Post, NewPost, SocialMetrics, SocialPlatform } from '../types/social.types';

// ─── Cola de posts (mkt_posts_queue) ─────────────────────────────────────────

export const schedulePost = async (post: NewPost): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('mkt_posts_queue')
    .insert({
      title:        post.title ?? null,
      copy:         post.copy,
      hashtags:     post.hashtags,
      platform:     post.platform,
      image_url:    post.image_url ?? null,
      image_prompt: post.image_prompt ?? null,
      status:       post.status ?? 'draft',
      scheduled_at: post.scheduled_at ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error encolando post:', error.message);
    return null;
  }

  await writeAgentLog(
    'POST_SOCIAL',
    'info',
    `Post guardado (${post.status ?? 'draft'}) para ${post.platform}: "${post.title ?? post.copy.slice(0, 40)}..."`,
    { platform: post.platform, status: post.status }
  );

  return data as Post;
};

export const approvePost = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('mkt_posts_queue')
    .update({ status: 'approved' })
    .eq('id', id);

  if (error) { console.error('Error aprobando post:', error.message); return false; }
  await writeAgentLog('POST_SOCIAL', 'success', `Post aprobado para publicación: ${id}`);
  return true;
};

export const rejectPost = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('mkt_posts_queue')
    .update({ status: 'failed' })
    .eq('id', id);

  if (error) { console.error('Error rechazando post:', error.message); return false; }
  return true;
};

export const getPosts = async (
  filters: { status?: Post['status']; platform?: SocialPlatform; limit?: number } = {}
): Promise<Post[]> => {
  let query = supabase
    .from('mkt_posts_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 50);

  if (filters.status)   query = query.eq('status', filters.status);
  if (filters.platform) query = query.eq('platform', filters.platform);

  const { data, error } = await query;
  if (error) { console.error('Error leyendo posts:', error.message); return []; }
  return (data ?? []) as Post[];
};

export const getPostCounts = async (): Promise<Record<Post['status'], number>> => {
  const { data } = await supabase
    .from('mkt_posts_queue')
    .select('status');

  const counts: Record<string, number> = { draft: 0, approved: 0, scheduled: 0, published: 0, failed: 0 };
  (data ?? []).forEach((r: { status: string }) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
  return counts as Record<Post['status'], number>;
};

// ─── Métricas de RRSS (mkt_social_metrics) ───────────────────────────────────

export const getSocialMetrics = async (): Promise<SocialMetrics[]> => {
  // Una fila por plataforma — la más reciente
  const platforms: SocialPlatform[] = ['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok'];
  const results: SocialMetrics[] = [];

  for (const platform of platforms) {
    const { data } = await supabase
      .from('mkt_social_metrics')
      .select('*')
      .eq('platform', platform)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (data) results.push(data as SocialMetrics);
  }

  return results;
};

export const getSocialMetricsHistory = async (
  platform: SocialPlatform,
  days = 30
): Promise<SocialMetrics[]> => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('mkt_social_metrics')
    .select('*')
    .eq('platform', platform)
    .gte('snapshot_date', since.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true });

  if (error) { console.error('Error leyendo historial de RRSS:', error.message); return []; }
  return (data ?? []) as SocialMetrics[];
};

// ─── Configuración de conexiones de RRSS ─────────────────────────────────────

export interface SocialConnection {
  platform: SocialPlatform;
  connected: boolean;
  account_name?: string;
  page_id?: string;
  token_hint?: string; // últimos 4 chars del token (no guardar el token completo aquí)
  configured_at?: string;
}

const CONFIG_KEY = 'social_connections';

export const getSocialConnections = async (): Promise<SocialConnection[]> => {
  const saved = await getAgentConfig<SocialConnection[]>(CONFIG_KEY);
  if (saved) return saved;

  // Estado por defecto — ninguna conectada
  return [
    { platform: 'linkedin',  connected: false },
    { platform: 'instagram', connected: false },
    { platform: 'facebook',  connected: false },
    { platform: 'twitter',   connected: false },
    { platform: 'tiktok',    connected: false },
  ];
};

export const saveSocialConnection = async (connection: SocialConnection): Promise<boolean> => {
  const current = await getSocialConnections();
  const updated = current.map((c) =>
    c.platform === connection.platform ? { ...connection, configured_at: new Date().toISOString() } : c
  );
  const ok = await setAgentConfig(CONFIG_KEY, updated);
  if (ok) {
    await writeAgentLog(
      'POST_SOCIAL',
      'info',
      `Conexión ${connection.connected ? 'activada' : 'desactivada'} para ${connection.platform}`,
    );
  }
  return ok;
};
