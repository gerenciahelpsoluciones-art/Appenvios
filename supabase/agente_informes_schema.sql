-- Table for storing contract metadata and extracted obligations
CREATE TABLE IF NOT EXISTS public.contratos_obligaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    nombre_contrato TEXT NOT NULL,
    archivo_url TEXT,
    obligaciones JSONB DEFAULT '[]'::jsonb,
    periodo_inicio DATE,
    periodo_fin DATE,
    usuario_id UUID REFERENCES public.app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for storing activity reports linked to contracts
CREATE TABLE IF NOT EXISTS public.informes_actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id UUID REFERENCES public.contratos_obligaciones(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL, -- 1-12
    anio INTEGER NOT NULL,
    actividades JSONB DEFAULT '[]'::jsonb, -- Each activity maps to an obligation
    logros TEXT,
    dificultades TEXT,
    proximos_pasos TEXT,
    estado TEXT DEFAULT 'Borrador', -- 'Borrador', 'Finalizado'
    usuario_id UUID REFERENCES public.app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add sample policies (RLS) - Basic public read/write for now to match current CRM style
ALTER TABLE public.contratos_obligaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informes_actividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON public.contratos_obligaciones
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON public.informes_actividades
    FOR ALL USING (true);
