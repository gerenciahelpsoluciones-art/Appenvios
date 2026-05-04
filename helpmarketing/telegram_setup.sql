-- ============================================================
-- HELPMARKETING - Módulo Telegram
-- Prefijo: mkt_
-- ============================================================

-- 1. Usuarios autorizados para usar el Bot
CREATE TABLE IF NOT EXISTS public.mkt_telegram_auth (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id   BIGINT UNIQUE NOT NULL,
    username      TEXT,
    full_name     TEXT,
    is_admin      BOOLEAN DEFAULT false,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Registro de sesiones (para flujos multi-paso)
CREATE TABLE IF NOT EXISTS public.mkt_telegram_sessions (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id   BIGINT REFERENCES public.mkt_telegram_auth(telegram_id) ON DELETE CASCADE,
    last_action   TEXT, -- ej: 'awaiting_products', 'confirming_quote'
    context       JSONB DEFAULT '{}', -- Datos temporales de la cotización
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cola de entrada (Inbound Queue) - Actúa como puente para evitar túneles
CREATE TABLE IF NOT EXISTS public.mkt_telegram_inbound (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id   BIGINT NOT NULL,
    raw_message   JSONB NOT NULL,
    status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.mkt_telegram_auth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_telegram_auth_all" ON public.mkt_telegram_auth FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mkt_telegram_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_telegram_sessions_all" ON public.mkt_telegram_sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mkt_telegram_inbound ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_telegram_inbound_all" ON public.mkt_telegram_inbound FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime para la cola (n8n puede usar esto)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'mkt_telegram_inbound'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mkt_telegram_inbound;
  END IF;
END $$;

-- Insertar usuario inicial (Jefe) - Debes actualizar con tu ID de Telegram real
-- INSERT INTO public.mkt_telegram_auth (telegram_id, username, full_name, is_admin)
-- VALUES (TU_ID_AQUI, 'carlo_helpsoluciones', 'Carlos', true);
