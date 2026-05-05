-- Ejecuta este script en el Editor SQL de Supabase

-- Añadir columna a tabla clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS regimen TEXT DEFAULT 'Régimen Común';

-- Añadir columna a tabla proveedores
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS regimen TEXT DEFAULT 'Régimen Común';
