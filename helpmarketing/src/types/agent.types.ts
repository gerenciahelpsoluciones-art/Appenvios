export type AgentAction =
  | 'POST_SOCIAL'
  | 'SEO_AUDIT'
  | 'KEYWORD_CHECK'
  | 'UPTIME_CHECK'
  | 'LEAD_SCAN'
  | 'COMPETITOR_MONITOR'
  | 'GENERATE_CONTENT'
  | 'WEEKLY_REPORT'
  | 'SEO_ALERT'
  | 'UPTIME_ALERT';

export type AgentTaskStatus = 'pending' | 'running' | 'done' | 'failed';
export type AgentLogStatus  = 'success' | 'error' | 'warning' | 'info';

export interface AgentTask {
  id: string;
  action: AgentAction;
  payload: Record<string, unknown>;
  status: AgentTaskStatus;
  priority: number;
  scheduled_at: string | null;
  executed_at: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
}

export interface AgentLog {
  id: string;
  task_id: string | null;
  action: string;
  status: AgentLogStatus;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AgentConfig {
  agent_paused: { paused: boolean; reason: string | null };
  posting_schedule: Record<string, string>;
  auto_approve: { enabled: boolean; platforms: string[] };
  seo_keywords: string[];
  target_url: string;
  company_name: string;
  social_platforms: string[];
}
