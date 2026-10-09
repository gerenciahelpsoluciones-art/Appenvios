-- =====================================================================
-- Seguridad del login · PARTE 1 de 2
-- Correr ANTES de desplegar la versión de la app que usa hs_login.
-- Es compatible con la app actual: solo agrega una función, no cambia datos.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- Valida usuario y contraseña en el servidor y devuelve el usuario SIN la
-- contraseña. Acepta claves todavía en texto plano o ya cifradas con bcrypt,
-- para que nadie quede por fuera durante la transición.
create or replace function public.hs_login(p_usuario text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  u public.app_users%rowtype;
begin
  if p_usuario is null or p_password is null or p_password = '' then
    return null;
  end if;

  select * into u
  from public.app_users
  where lower(usuario) = lower(trim(p_usuario))
  limit 1;

  if not found or u.password is null or u.password = '' then
    return null;
  end if;

  if u.password ~ '^\$2[aby]\$' then
    if extensions.crypt(p_password, u.password) <> u.password then
      return null;
    end if;
  elsif u.password <> p_password then
    return null;
  end if;

  return (to_jsonb(u) - 'password')::json;
end;
$$;

revoke all on function public.hs_login(text, text) from public;
grant execute on function public.hs_login(text, text) to anon, authenticated;

-- Verificación: debe devolver una fila con hs_login
select proname from pg_proc where proname = 'hs_login';
