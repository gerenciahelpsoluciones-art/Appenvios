import { supabase } from './supabase';
import type { SeoSnapshot, UptimeCheck } from '../types/seo.types';

const PAGESPEED_API_KEY = import.meta.env.VITE_PAGESPEED_API_KEY as string | undefined;
const TARGET_URL = 'https://helpsoluciones.com.co';

// ─── PageSpeed Insights API ──────────────────────────────────────────────────

export interface PageSpeedResult {
  url: string;
  device: 'mobile' | 'desktop';
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  lcp_ms: number | null;
  fid_ms: number | null;
  cls_score: number | null;
  fcp_ms: number | null;
  ttfb_ms: number | null;
  opportunities: PageSpeedOpportunity[];
}

export interface PageSpeedOpportunity {
  id: string;
  title: string;
  description: string;
  savings_ms: number | null;
  score: number;
}

const scoreToInt = (val: number | null): number | null =>
  val == null ? null : Math.round(val * 100);

const auditMs = (audit: { numericValue?: number } | undefined): number | null =>
  audit?.numericValue != null ? Math.round(audit.numericValue) : null;

export const runPageSpeedAudit = async (
  device: 'mobile' | 'desktop' = 'mobile',
  url: string = TARGET_URL
): Promise<PageSpeedResult> => {
  const params = new URLSearchParams({
    url,
    strategy: device,
    category: 'performance',
    category_1: 'seo',
    category_2: 'accessibility',
    ...(PAGESPEED_API_KEY ? { key: PAGESPEED_API_KEY } : {}),
  });

  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message ?? `PageSpeed API error ${response.status}`);
  }

  const data = await response.json();
  const cats    = data.lighthouseResult?.categories ?? {};
  const audits  = data.lighthouseResult?.audits ?? {};

  // Extraer Core Web Vitals
  const lcp  = auditMs(audits['largest-contentful-paint']);
  const fid  = auditMs(audits['max-potential-fid']);
  const fcp  = auditMs(audits['first-contentful-paint']);
  const ttfb = auditMs(audits['server-response-time']);
  const cls  = audits['cumulative-layout-shift']?.numericValue != null
    ? Math.round(audits['cumulative-layout-shift'].numericValue * 10000) / 10000
    : null;

  // Oportunidades de mejora (las más importantes)
  const opportunityAudits = ['render-blocking-resources', 'uses-optimized-images',
    'uses-responsive-images', 'unused-css-rules', 'unused-javascript',
    'efficient-animated-content', 'uses-text-compression'];

  const opportunities: PageSpeedOpportunity[] = opportunityAudits
    .map((id) => {
      const a = audits[id];
      if (!a || a.score === 1) return null;
      return {
        id,
        title:       a.title as string,
        description: a.description as string,
        savings_ms:  a.details?.overallSavingsMs != null ? Math.round(a.details.overallSavingsMs) : null,
        score:       a.score as number,
      };
    })
    .filter(Boolean) as PageSpeedOpportunity[];

  return {
    url,
    device,
    performanceScore: scoreToInt(cats.performance?.score) ?? 0,
    seoScore:         scoreToInt(cats.seo?.score) ?? 0,
    accessibilityScore: scoreToInt(cats.accessibility?.score) ?? 0,
    lcp_ms:   lcp,
    fid_ms:   fid,
    cls_score: cls,
    fcp_ms:   fcp,
    ttfb_ms:  ttfb,
    opportunities,
  };
};

// ─── Guardar snapshot en Supabase ────────────────────────────────────────────

export const savePageSpeedSnapshot = async (
  result: PageSpeedResult
): Promise<SeoSnapshot | null> => {
  const { data, error } = await supabase
    .from('mkt_seo_snapshots')
    .insert({
      url:                result.url,
      device:             result.device,
      performance_score:  result.performanceScore,
      seo_score:          result.seoScore,
      accessibility_score: result.accessibilityScore,
      lcp_ms:             result.lcp_ms,
      fid_ms:             result.fid_ms,
      cls_score:          result.cls_score,
      fcp_ms:             result.fcp_ms,
      ttfb_ms:            result.ttfb_ms,
      source:             'pagespeed',
      raw_data:           { opportunities: result.opportunities },
    })
    .select()
    .single();

  if (error) {
    console.error('Error guardando snapshot SEO:', error.message);
    return null;
  }
  return data as SeoSnapshot;
};

// ─── Leer historial de snapshots ─────────────────────────────────────────────

export const getSeoHistory = async (
  device: 'mobile' | 'desktop' = 'mobile',
  days = 30
): Promise<SeoSnapshot[]> => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('mkt_seo_snapshots')
    .select('*')
    .eq('device', device)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    console.error('Error leyendo historial SEO:', error.message);
    return [];
  }
  return (data ?? []) as SeoSnapshot[];
};

// ─── Uptime checks ───────────────────────────────────────────────────────────
// El check real lo hace n8n (evita CORS). Este método es para leer el historial.

export const getUptimeHistory = async (limit = 50): Promise<UptimeCheck[]> => {
  const { data, error } = await supabase
    .from('mkt_uptime_checks')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error leyendo uptime:', error.message);
    return [];
  }
  return (data ?? []) as UptimeCheck[];
};

export const getUptimeStats = async () => {
  const since24h = new Date(Date.now() - 86_400_000).toISOString();

  const { data } = await supabase
    .from('mkt_uptime_checks')
    .select('is_up, response_time_ms, checked_at')
    .gte('checked_at', since24h)
    .order('checked_at', { ascending: false });

  if (!data || data.length === 0) return null;

  const total   = data.length;
  const upCount = data.filter((r) => r.is_up).length;
  const avgMs   = data
    .filter((r) => r.response_time_ms != null)
    .reduce((sum, r) => sum + r.response_time_ms, 0) / (total || 1);

  return {
    uptimePercent:  Math.round((upCount / total) * 10000) / 100,
    upCount,
    totalChecks:    total,
    avgResponseMs:  Math.round(avgMs),
    lastCheck:      data[0],
  };
};
