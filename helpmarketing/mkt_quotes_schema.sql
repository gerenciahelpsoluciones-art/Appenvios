-- ============================================================
-- HELPMARKETING - NOVA CRM Sync
-- Prefijo: mkt_
-- ============================================================

-- 4. Cotizaciones generadas por el Bot (NOVA)
CREATE TABLE IF NOT EXISTS public.mkt_cotizaciones (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id     BIGINT REFERENCES public.mkt_telegram_auth(telegram_id),
    cliente_id      UUID, -- Referencia opcional a tabla clientes
    cliente_nombre  TEXT,
    total           NUMERIC DEFAULT 0,
    estado          TEXT DEFAULT 'Borrador', -- Borrador, Procesada, Cancelada
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    metadata        JSONB DEFAULT '{}' -- Para guardar el audio_url o prompt original
);

-- 5. Detalles de la cotización
CREATE TABLE IF NOT EXISTS public.mkt_cotizacion_detalles (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cotizacion_id   UUID REFERENCES public.mkt_cotizaciones(id) ON DELETE CASCADE,
    producto_id     UUID, -- Referencia opcional a tabla productos
    producto_nombre TEXT,
    cantidad        NUMERIC DEFAULT 1,
    precio_unitario NUMERIC DEFAULT 0,
    subtotal        NUMERIC GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- RLS
ALTER TABLE public.mkt_cotizaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_cotizaciones_all" ON public.mkt_cotizaciones FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mkt_cotizacion_detalles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_cotizacion_detalles_all" ON public.mkt_cotizacion_detalles FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime para mkt_cotizaciones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'mkt_cotizaciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mkt_cotizaciones;
  END IF;
END $$;
