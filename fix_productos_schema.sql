-- EJECUTA ESTO EN EL SQL EDITOR DE SUPABASE (https://matyjysinegbibdwzhoq.supabase.co/dashboard/project/matyjysinegbibdwzhoq/sql/new)

-- 1. Crear tabla productos si no existe
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Asegurar que todas las columnas necesarias existen
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='num_part') THEN
        ALTER TABLE public.productos ADD COLUMN num_part TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='descripcion') THEN
        ALTER TABLE public.productos ADD COLUMN descripcion TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='unidad') THEN
        ALTER TABLE public.productos ADD COLUMN unidad TEXT DEFAULT 'Und';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='precio_compra') THEN
        ALTER TABLE public.productos ADD COLUMN precio_compra NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='moneda') THEN
        ALTER TABLE public.productos ADD COLUMN moneda TEXT DEFAULT 'COP';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='trm_referencia') THEN
        ALTER TABLE public.productos ADD COLUMN trm_referencia NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='tipo') THEN
        ALTER TABLE public.productos ADD COLUMN tipo TEXT DEFAULT 'Producto';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='exento_iva') THEN
        ALTER TABLE public.productos ADD COLUMN exento_iva BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='history') THEN
        ALTER TABLE public.productos ADD COLUMN history JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. TRUCO PARA RECARGAR EL CACHE DEL ESQUEMA (SÓLO SI PERSISTE EL ERROR)
-- Agregamos y eliminamos una columna temporal para forzar a PostgREST a re-escanear la tabla
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS _temp_refresh_cache TEXT;
ALTER TABLE public.productos DROP COLUMN IF EXISTS _temp_refresh_cache;

-- 4. Configurar RLS (Row Level Security)
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can select products" ON public.productos;
CREATE POLICY "Public can select products" ON public.productos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert products" ON public.productos;
CREATE POLICY "Public can insert products" ON public.productos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update products" ON public.productos;
CREATE POLICY "Public can update products" ON public.productos FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete products" ON public.productos;
CREATE POLICY "Public can delete products" ON public.productos FOR DELETE USING (true);

-- 5. Habilitar Realtime
-- Eliminamos primero para evitar error si ya está
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'productos') THEN
        NULL; -- Ya existe
    ELSE
        ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
    END IF;
END $$;
