-- SOLUCIÓN DEFINITIVA PARA ERROR 401
-- Ejecuta esto en el SQL Editor de Supabase:

-- 1. Asegurar que la tabla existe
CREATE TABLE IF NOT EXISTS public.visitantes_web (
    id BIGSERIAL PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    path TEXT NOT NULL,
    device TEXT,
    location TEXT
);

-- 2. DESACTIVAR RLS (Esto elimina cualquier restricción de permiso para esta tabla)
ALTER TABLE public.visitantes_web DISABLE ROW LEVEL SECURITY;

-- 3. Habilitar Tiempo Real
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitantes_web;
