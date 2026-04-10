-- SQL Script to fix missing columns in the 'cotizaciones' table
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/matyjysinegbibdwzhoq/sql/new

-- 1. Add missing 'validez_oferta' column
ALTER TABLE public.cotizaciones 
ADD COLUMN IF NOT EXISTS validez_oferta INTEGER DEFAULT 3;

-- 2. Add missing buyer contact columns
ALTER TABLE public.cotizaciones 
ADD COLUMN IF NOT EXISTS comprador_nombre TEXT,
ADD COLUMN IF NOT EXISTS comprador_telefono TEXT,
ADD COLUMN IF NOT EXISTS comprador_email TEXT;

-- 3. Verify the changes (optional)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'cotizaciones';
