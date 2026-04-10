-- ============================================================
-- HELPMARKETING - Módulo de Remisiones
-- Prefijo: mkt_
-- Dependencias: clientes_web, productos (legacy)
-- ============================================================

-- 1. Tabla de Remisiones (Cabecera)
CREATE TABLE IF NOT EXISTS public.mkt_remisiones (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero        TEXT NOT NULL UNIQUE,
    fecha         TIMESTAMPTZ DEFAULT NOW(),
    cliente_id    UUID REFERENCES public.clientes_web(id) ON DELETE SET NULL,
    total         DECIMAL(15,2) DEFAULT 0.00,
    estado        TEXT NOT NULL DEFAULT 'borrador' 
                    CHECK (estado IN ('borrador', 'enviada', 'entregada', 'anulada')),
    observaciones TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexación para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_mkt_remisiones_numero ON public.mkt_remisiones(numero);
CREATE INDEX IF NOT EXISTS idx_mkt_remisiones_cliente ON public.mkt_remisiones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mkt_remisiones_estado ON public.mkt_remisiones(estado);

-- RLS para mkt_remisiones
ALTER TABLE public.mkt_remisiones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_remisiones_all" ON public.mkt_remisiones;
CREATE POLICY "mkt_remisiones_all" ON public.mkt_remisiones FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at (reutilizando la función mkt_set_updated_at si existe, o creándola)
CREATE OR REPLACE FUNCTION public.mkt_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mkt_remisiones_updated_at ON public.mkt_remisiones;
CREATE TRIGGER mkt_remisiones_updated_at
  BEFORE UPDATE ON public.mkt_remisiones
  FOR EACH ROW EXECUTE FUNCTION public.mkt_set_updated_at();


-- 2. Tabla de Detalles de Remisión (Líneas)
CREATE TABLE IF NOT EXISTS public.mkt_remision_detalles (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    remision_id     UUID NOT NULL REFERENCES public.mkt_remisiones(id) ON DELETE CASCADE,
    producto_id     UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    descripcion     TEXT NOT NULL, -- Nombre/descripción del producto en el momento de la remisión
    cantidad        NUMERIC(15,2) NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    subtotal        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_remision_detalles_remision ON public.mkt_remision_detalles(remision_id);

-- RLS para mkt_remision_detalles
ALTER TABLE public.mkt_remision_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mkt_remision_detalles_all" ON public.mkt_remision_detalles;
CREATE POLICY "mkt_remision_detalles_all" ON public.mkt_remision_detalles FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime (Opcional, para ver actualizaciones en vivo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'mkt_remisiones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mkt_remisiones;
  END IF;
END $$;
