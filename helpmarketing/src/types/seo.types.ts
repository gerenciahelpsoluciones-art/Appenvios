export interface SeoSnapshot {
  id: string;
  url: string;
  device: 'mobile' | 'desktop';
  performance_score: number | null;
  seo_score: number | null;
  accessibility_score: number | null;
  lcp_ms: number | null;
  fid_ms: number | null;
  cls_score: number | null;
  fcp_ms: number | null;
  ttfb_ms: number | null;
  source: string;
  created_at: string;
}

export interface KeywordRanking {
  id: string;
  keyword: string;
  position: number | null;
  previous_position: number | null;
  url: string | null;
  search_volume: number | null;
  source: 'gsc' | 'serpapi' | 'manual';
  location: string;
  device: string;
  created_at: string;
}

export interface Backlink {
  id: string;
  source_url: string;
  source_domain: string | null;
  target_url: string;
  anchor_text: string | null;
  is_follow: boolean;
  domain_authority: number | null;
  first_seen: string;
  last_seen: string;
  status: 'active' | 'lost';
}

export interface UptimeCheck {
  id: string;
  url: string;
  status_code: number | null;
  response_time_ms: number | null;
  is_up: boolean;
  error_message: string | null;
  checked_at: string;
}

export type VitalStatus = 'good' | 'needs-improvement' | 'poor';

export interface VitalThresholds {
  good: number;
  poor: number;
}

export const VITAL_THRESHOLDS: Record<string, VitalThresholds> = {
  lcp:  { good: 2500,  poor: 4000  },
  fid:  { good: 100,   poor: 300   },
  cls:  { good: 0.1,   poor: 0.25  },
  fcp:  { good: 1800,  poor: 3000  },
  ttfb: { good: 800,   poor: 1800  },
};

export const getVitalStatus = (metric: string, value: number): VitalStatus => {
  const t = VITAL_THRESHOLDS[metric];
  if (!t) return 'good';
  if (value <= t.good) return 'good';
  if (value <= t.poor) return 'needs-improvement';
  return 'poor';
};
