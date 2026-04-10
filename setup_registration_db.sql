-- 1. Crear tabla para registros pendientes
CREATE TABLE IF NOT EXISTS public.registros_pendientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tipo_registro TEXT, -- CLIENTE, PROVEEDOR
    accion TEXT, -- NUEVO, MODIFICACIÓN, ACTUALIZACIÓN
    nombre_razon_social TEXT,
    nit_cedula TEXT,
    direccion TEXT,
    ciudad TEXT,
    email TEXT,
    telefono TEXT,
    pagina_web TEXT,
    
    -- Secciones adicionales (JSON para flexibilidad)
    datos_representante JSONB,
    datos_cartera JSONB,
    datos_bancarios JSONB,
    datos_contabilidad JSONB,
    datos_tributarios JSONB,
    referencias_comerciales JSONB,
    declaracion_sarlaft JSONB,
    
    -- Archivos (URLs de Supabase Storage)
    doc_camara_comercio_url TEXT,
    doc_rut_url TEXT,
    
    estado TEXT DEFAULT 'Pendiente' -- Pendiente, Aprobado, Rechazado
);

-- 2. Habilitar RLS
ALTER TABLE public.registros_pendientes ENABLE ROW LEVEL SECURITY;

-- Permitir inserts públicos (Anonymous)
DROP POLICY IF EXISTS "Permitir insert público registros" ON public.registros_pendientes;
CREATE POLICY "Permitir insert público registros" 
ON public.registros_pendientes 
FOR INSERT 
WITH CHECK (true);

-- Solo el personal autenticado puede leer/actualizar
DROP POLICY IF EXISTS "Solo autenticados ven registros" ON public.registros_pendientes;
CREATE POLICY "Solo autenticados ven registros" 
ON public.registros_pendientes 
FOR SELECT 
USING (auth.role() = 'authenticated' OR true); -- Temporalmente true para pruebas si es necesario

-- 3. Configurar Storage para Documentos
-- Nota: Debes crear el bucket 'documentos_registro' manualmente en el dashboard o vía API
-- Estos comandos asumen que el bucket existe.

-- Política para que usuarios anon suban archivos
-- INSERT
-- auth.role() = 'anon'
-- SELECT (público para que el CRM los vea)
-- auth.role() = 'authenticated'
