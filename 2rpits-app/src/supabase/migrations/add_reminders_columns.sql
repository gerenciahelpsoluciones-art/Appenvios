-- Add maintenance tracking columns to trp_motos
ALTER TABLE trp_motos 
ADD COLUMN IF NOT EXISTS last_service_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_service_km INTEGER DEFAULT 0;

-- Update existing data to have a baseline
UPDATE trp_motos 
SET last_service_date = created_at, 
    last_service_km = kilometraje
WHERE last_service_date IS NULL;
