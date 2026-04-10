-- ============================================================
-- HELPMARKETING - Schema de Supabase
-- Proyecto: helpmarketing (Agente Autónomo de Marketing)
-- Prefijo: mkt_ (TODAS las tablas usan este prefijo para
--          no interferir con otros proyectos en el mismo Supabase)
--
-- Tablas EXISTENTES en otros proyectos (NO tocar):
--   visitantes_web, clientes_web, registros_pendientes,
--   productos, cotizaciones
--
-- Ejecutar en: https://supabase.com/dashboard/project/matyjysinegbibdwzhoq/sql/new
-- ============================================================


-- ============================================================
-- 1. mkt_agent_config
--    Configuración global del agente autónomo
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_agent_config (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mkt_agent_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_agent_config_select" ON public.mkt_agent_config;
DROP POLICY IF EXISTS "mkt_agent_config_all"    ON public.mkt_agent_config;
CREATE POLICY "mkt_agent_config_select" ON public.mkt_agent_config FOR SELECT USING (true);
CREATE POLICY "mkt_agent_config_all"    ON public.mkt_agent_config FOR ALL    USING (true) WITH CHECK (true);

-- Valores por defecto
INSERT INTO public.mkt_agent_config (key, value, description) VALUES
  ('agent_paused',      '{"paused": false, "reason": null}',                              'Estado activo/pausado del agente'),
  ('posting_schedule',  '{"linkedin": "09:00", "instagram": "18:00", "facebook": "12:00"}','Hora óptima de publicación por plataforma'),
  ('auto_approve',      '{"enabled": false, "platforms": []}',                             'Aprobación automática de posts sin revisión'),
  ('seo_keywords',      '["soporte tecnico bogota", "mantenimiento servidores colombia", "ciberseguridad empresas bogota", "redes estructuradas colombia"]', 'Keywords a monitorear en Google'),
  ('target_url',        '"https://helpsoluciones.com.co"',                                 'URL principal del sitio a monitorear'),
  ('company_name',      '"Help Soluciones"',                                               'Nombre de la empresa'),
  ('social_platforms',  '["linkedin", "instagram", "facebook"]',                           'Plataformas de redes sociales activas')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- 2. mkt_agent_tasks
--    Cola de tareas que el agente debe ejecutar (via n8n)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_agent_tasks (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action       TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'running', 'done', 'failed')),
  priority     INT  NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  scheduled_at TIMESTAMPTZ,
  executed_at  TIMESTAMPTZ,
  result       JSONB,
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_agent_tasks_status   ON public.mkt_agent_tasks (status);
CREATE INDEX IF NOT EXISTS idx_mkt_agent_tasks_priority ON public.mkt_agent_tasks (priority, created_at);

ALTER TABLE public.mkt_agent_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_agent_tasks_all" ON public.mkt_agent_tasks;
CREATE POLICY "mkt_agent_tasks_all" ON public.mkt_agent_tasks FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 3. mkt_agent_logs
--    Historial de todas las acciones ejecutadas por el agente
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_agent_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    UUID REFERENCES public.mkt_agent_tasks(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning', 'info')),
  message    TEXT,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_agent_logs_created ON public.mkt_agent_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_agent_logs_status  ON public.mkt_agent_logs (status);

ALTER TABLE public.mkt_agent_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_agent_logs_all" ON public.mkt_agent_logs;
CREATE POLICY "mkt_agent_logs_all" ON public.mkt_agent_logs FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime para el log (el TopBar lo escucha en vivo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'mkt_agent_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mkt_agent_logs;
  END IF;
END $$;


-- ============================================================
-- 4. mkt_posts_queue
--    Posts generados, pendientes de aprobación y publicación
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_posts_queue (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title              TEXT,
  copy               TEXT NOT NULL,
  hashtags           TEXT[] DEFAULT '{}',
  platform           TEXT NOT NULL
                       CHECK (platform IN ('linkedin','instagram','facebook','twitter','tiktok')),
  image_url          TEXT,
  image_prompt       TEXT,
  status             TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','approved','scheduled','published','failed')),
  scheduled_at       TIMESTAMPTZ,
  published_at       TIMESTAMPTZ,
  n8n_execution_id   TEXT,
  engagement         JSONB,   -- {likes, comments, shares, reach} post-publicación
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_posts_status       ON public.mkt_posts_queue (status);
CREATE INDEX IF NOT EXISTS idx_mkt_posts_platform     ON public.mkt_posts_queue (platform);
CREATE INDEX IF NOT EXISTS idx_mkt_posts_scheduled_at ON public.mkt_posts_queue (scheduled_at);

ALTER TABLE public.mkt_posts_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_posts_all" ON public.mkt_posts_queue;
CREATE POLICY "mkt_posts_all" ON public.mkt_posts_queue FOR ALL USING (true) WITH CHECK (true);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.mkt_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mkt_posts_queue_updated_at ON public.mkt_posts_queue;
CREATE TRIGGER mkt_posts_queue_updated_at
  BEFORE UPDATE ON public.mkt_posts_queue
  FOR EACH ROW EXECUTE FUNCTION public.mkt_set_updated_at();


-- ============================================================
-- 5. mkt_seo_snapshots
--    Snapshots diarios de Core Web Vitals y score SEO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_seo_snapshots (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url                 TEXT NOT NULL DEFAULT 'https://helpsoluciones.com.co',
  device              TEXT NOT NULL DEFAULT 'mobile' CHECK (device IN ('mobile', 'desktop')),
  performance_score   INT  CHECK (performance_score BETWEEN 0 AND 100),
  seo_score           INT  CHECK (seo_score BETWEEN 0 AND 100),
  accessibility_score INT  CHECK (accessibility_score BETWEEN 0 AND 100),
  lcp_ms              INT,   -- Largest Contentful Paint en ms
  fid_ms              INT,   -- First Input Delay en ms
  cls_score           DECIMAL(6,4), -- Cumulative Layout Shift
  fcp_ms              INT,   -- First Contentful Paint
  ttfb_ms             INT,   -- Time to First Byte
  source              TEXT DEFAULT 'pagespeed',
  raw_data            JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_seo_created ON public.mkt_seo_snapshots (created_at DESC);

ALTER TABLE public.mkt_seo_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_seo_all" ON public.mkt_seo_snapshots;
CREATE POLICY "mkt_seo_all" ON public.mkt_seo_snapshots FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 6. mkt_keyword_rankings
--    Tracking de posición en Google por keyword
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_keyword_rankings (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword           TEXT NOT NULL,
  position          INT,
  previous_position INT,
  url               TEXT,   -- URL que rankea para esa keyword
  search_volume     INT,
  source            TEXT DEFAULT 'gsc' CHECK (source IN ('gsc', 'serpapi', 'manual')),
  location          TEXT DEFAULT 'Colombia',
  device            TEXT DEFAULT 'desktop',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_kw_keyword ON public.mkt_keyword_rankings (keyword, created_at DESC);

ALTER TABLE public.mkt_keyword_rankings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_kw_all" ON public.mkt_keyword_rankings;
CREATE POLICY "mkt_kw_all" ON public.mkt_keyword_rankings FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 7. mkt_backlinks
--    Monitoreo de backlinks hacia helpsoluciones.com.co
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_backlinks (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url       TEXT NOT NULL,
  source_domain    TEXT,
  target_url       TEXT NOT NULL DEFAULT 'https://helpsoluciones.com.co',
  anchor_text      TEXT,
  is_follow        BOOLEAN DEFAULT true,
  domain_authority INT,
  first_seen       TIMESTAMPTZ DEFAULT NOW(),
  last_seen        TIMESTAMPTZ DEFAULT NOW(),
  status           TEXT DEFAULT 'active' CHECK (status IN ('active', 'lost'))
);

CREATE INDEX IF NOT EXISTS idx_mkt_backlinks_domain ON public.mkt_backlinks (source_domain);
CREATE INDEX IF NOT EXISTS idx_mkt_backlinks_status ON public.mkt_backlinks (status);

ALTER TABLE public.mkt_backlinks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_backlinks_all" ON public.mkt_backlinks;
CREATE POLICY "mkt_backlinks_all" ON public.mkt_backlinks FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 8. mkt_social_metrics
--    Snapshot diario de métricas por plataforma de RRSS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_social_metrics (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform         TEXT NOT NULL
                     CHECK (platform IN ('linkedin','instagram','facebook','twitter','tiktok')),
  followers        INT DEFAULT 0,
  following        INT DEFAULT 0,
  posts_count      INT DEFAULT 0,
  engagement_rate  DECIMAL(7,4),
  reach_7d         INT DEFAULT 0,
  impressions_7d   INT DEFAULT 0,
  clicks_7d        INT DEFAULT 0,
  top_post_id      TEXT,
  snapshot_date    DATE DEFAULT CURRENT_DATE,
  raw_data         JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (platform, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_mkt_social_platform ON public.mkt_social_metrics (platform, snapshot_date DESC);

ALTER TABLE public.mkt_social_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_social_all" ON public.mkt_social_metrics;
CREATE POLICY "mkt_social_all" ON public.mkt_social_metrics FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 9. mkt_uptime_checks
--    Historial de disponibilidad del sitio web
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_uptime_checks (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url              TEXT NOT NULL DEFAULT 'https://helpsoluciones.com.co',
  status_code      INT,
  response_time_ms INT,
  is_up            BOOLEAN NOT NULL,
  error_message    TEXT,
  checked_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_uptime_checked ON public.mkt_uptime_checks (checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_uptime_is_up   ON public.mkt_uptime_checks (is_up, checked_at DESC);

ALTER TABLE public.mkt_uptime_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_uptime_all" ON public.mkt_uptime_checks;
CREATE POLICY "mkt_uptime_all" ON public.mkt_uptime_checks FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 10. mkt_leads
--     CRM básico de prospectos generados por el agente
--     (separado de clientes_web que es del chatbot)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mkt_leads (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company          TEXT,
  contact_name     TEXT,
  email            TEXT,
  phone            TEXT,
  sector           TEXT,
  location         TEXT,
  source           TEXT DEFAULT 'ledhunter'
                     CHECK (source IN ('ledhunter','manual','social','website','referral')),
  confidence_score INT CHECK (confidence_score BETWEEN 0 AND 100),
  status           TEXT DEFAULT 'new'
                     CHECK (status IN ('new','contacted','qualified','proposal','closed','lost')),
  notes            TEXT,
  ai_reason        TEXT,   -- Por qué la IA lo identificó como lead
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_leads_status ON public.mkt_leads (status);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_source ON public.mkt_leads (source);

ALTER TABLE public.mkt_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_leads_all" ON public.mkt_leads;
CREATE POLICY "mkt_leads_all" ON public.mkt_leads FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS mkt_leads_updated_at ON public.mkt_leads;
CREATE TRIGGER mkt_leads_updated_at
  BEFORE UPDATE ON public.mkt_leads
  FOR EACH ROW EXECUTE FUNCTION public.mkt_set_updated_at();


-- ============================================================
-- RESUMEN DE TABLAS CREADAS (prefijo mkt_)
-- ============================================================
-- mkt_agent_config      — Configuración global del agente
-- mkt_agent_tasks       — Cola de tareas para n8n
-- mkt_agent_logs        — Historial de acciones (Realtime activo)
-- mkt_posts_queue       — Posts pendientes / publicados
-- mkt_seo_snapshots     — Core Web Vitals diarios
-- mkt_keyword_rankings  — Posición en Google por keyword
-- mkt_backlinks         — Monitoreo de backlinks
-- mkt_social_metrics    — Métricas de RRSS por plataforma
-- mkt_uptime_checks     — Disponibilidad del sitio
-- mkt_leads             — CRM de prospectos del agente
--
-- TABLAS DE OTROS PROYECTOS (intactas, NO modificadas):
-- visitantes_web, clientes_web, registros_pendientes,
-- productos, cotizaciones
-- ============================================================
