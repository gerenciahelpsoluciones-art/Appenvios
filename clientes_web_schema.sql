CREATE TABLE public.clientes_web (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nombre TEXT NOT NULL,
    empresa TEXT,
    email TEXT,
    telefono TEXT NOT NULL,
    requerimiento TEXT NOT NULL,
    historial_chat JSONB,
    borrador_cotizacion JSONB,
    estado TEXT DEFAULT 'Nuevo' CHECK (estado IN ('Nuevo', 'Cotizando', 'Cerrado', 'Perdido'))
);

-- Configurar RLS (Row Level Security) si es necesario para permitir a n8n insertar y a Appenvios leer/editar
-- ALTER TABLE public.clientes_web ENABLE ROW LEVEL SECURITY;
