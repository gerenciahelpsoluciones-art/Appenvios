-- ============================================================
-- FIX: Infinite recursion en políticas RLS de velia_perfiles
-- El problema: la política "all" hacía SELECT a velia_perfiles
-- dentro de la misma política, causando recursión infinita.
-- Solución: usar una función SECURITY DEFINER que bypasea RLS
-- para obtener el rol del usuario actual.
-- ============================================================

-- PASO 1: Eliminar las políticas conflictivas
DROP POLICY IF EXISTS "Los perfiles de Velia son visibles por autenticados" ON public.velia_perfiles;
DROP POLICY IF EXISTS "Administradores de Velia gestionan todos los perfiles Velia" ON public.velia_perfiles;

-- PASO 2: Crear función helper que NO dispara RLS (SECURITY DEFINER)
-- Esta función obtiene el rol del usuario SIN recursión
CREATE OR REPLACE FUNCTION public.velia_get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.velia_perfiles WHERE id = auth.uid() LIMIT 1;
$$;

-- PASO 3: Política SELECT — cualquier usuario autenticado puede ver perfiles
CREATE POLICY "velia_perfiles_select"
  ON public.velia_perfiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- PASO 4: Política INSERT — solo admins (via función helper, sin recursión)
CREATE POLICY "velia_perfiles_insert"
  ON public.velia_perfiles
  FOR INSERT
  WITH CHECK (public.velia_get_my_role() = 'admin');

-- PASO 5: Política UPDATE — solo admins
CREATE POLICY "velia_perfiles_update"
  ON public.velia_perfiles
  FOR UPDATE
  USING (public.velia_get_my_role() = 'admin');

-- PASO 6: Política DELETE — solo admins
CREATE POLICY "velia_perfiles_delete"
  ON public.velia_perfiles
  FOR DELETE
  USING (public.velia_get_my_role() = 'admin');

-- PASO 7: Verificar que el usuario admin@velia.com tenga su perfil
-- (por si el trigger no lo creó por falta del metadato 'app')
-- Ejecutar SOLO si admin@velia.com NO aparece en velia_perfiles:
/*
INSERT INTO public.velia_perfiles (id, nombre, email, rol, estado)
SELECT 
  au.id,
  'Admin VELIA',
  'admin@velia.com',
  'admin',
  'activo'
FROM auth.users au
WHERE au.email = 'admin@velia.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.velia_perfiles vp WHERE vp.id = au.id
  );
*/
