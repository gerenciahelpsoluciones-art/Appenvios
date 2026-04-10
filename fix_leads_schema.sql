-- EJECUTA ESTO EN EL SQL EDITOR DE SUPABASE (https://matyjysinegbibdwzhoq.supabase.co/dashboard/project/matyjysinegbibdwzhoq/sql/new)

-- 1. Asegurar que la tabla existe y añadir columna 'asesor'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes_web' AND column_name='asesor') THEN
        ALTER TABLE public.clientes_web ADD COLUMN asesor TEXT;
    END IF;
END $$;

-- 2. Asegurar que la columna 'borrador_cotizacion' existe (para la IA)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes_web' AND column_name='borrador_cotizacion') THEN
        ALTER TABLE public.clientes_web ADD COLUMN borrador_cotizacion JSONB;
    END IF;
END $$;

-- 3. Configurar Permisos RLS (Row Level Security)
-- Permitir que CUALQUIER USUARIO (Anon) pueda INSERTAR leads desde el chatbot
ALTER TABLE public.clientes_web ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert leads" ON public.clientes_web;
CREATE POLICY "Allow anon insert leads" 
ON public.clientes_web 
FOR INSERT 
WITH CHECK (true);

-- Permitir que todos puedan LEER (para el CRM)
DROP POLICY IF EXISTS "Allow public select leads" ON public.clientes_web;
CREATE POLICY "Allow public select leads" 
ON public.clientes_web 
FOR SELECT 
USING (true);

-- Permitir UPDATES (para que los asesores cambien el estado en el CRM)
DROP POLICY IF EXISTS "Allow public update leads" ON public.clientes_web;
CREATE POLICY "Allow public update leads" 
ON public.clientes_web 
FOR UPDATE 
USING (true);

-- 4. Habilitar Tiempo Real (Sync inmediato con el Dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes_web;
