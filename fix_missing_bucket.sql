-- 1. Crear el bucket 'documentos_registro'
-- Si ya existe, no hará nada gracias al ON CONFLICT
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos_registro', 'documentos_registro', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear política para permitir subidas (INSERT)
-- Nota: Si la política ya existe, este comando fallará. 
-- En ese caso, puedes ignorar el error o crearla manualmente en la UI de Storage.
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'documentos_registro');

-- 3. Crear política para permitir lectura (SELECT)
CREATE POLICY "Public View"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documentos_registro');
