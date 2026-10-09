-- =====================================================================
-- Seguridad del login · PARTE 2 de 2
-- Correr DESPUÉS de que la app nueva (login con hs_login) esté en producción.
-- La versión anterior de la app deja de poder iniciar sesión tras este script.
-- =====================================================================

-- 1) Cifrar con bcrypt las contraseñas que siguen en texto plano.
update public.app_users
set password = extensions.crypt(password, extensions.gen_salt('bf'))
where password is not null
  and password <> ''
  and password !~ '^\$2[aby]\$';

-- 2) Cifrar automáticamente toda contraseña nueva o editada.
--    Si al editar un usuario la contraseña llega vacía, se conserva la anterior.
create or replace function public.hs_hash_password()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if tg_op = 'UPDATE' and (new.password is null or new.password = '') then
    new.password := old.password;
  elsif new.password is not null and new.password <> '' and new.password !~ '^\$2[aby]\$' then
    new.password := extensions.crypt(new.password, extensions.gen_salt('bf'));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hs_hash_password on public.app_users;
create trigger trg_hs_hash_password
before insert or update on public.app_users
for each row execute function public.hs_hash_password();

-- 3) Nadie puede volver a LEER la columna password desde la app/navegador.
--    (Se sigue pudiendo escribirla para crear o cambiar contraseñas.)
revoke select on public.app_users from anon, authenticated;
grant select (id, nombre, usuario, cargo, email, telefono, rol, permisos, created_at)
  on public.app_users to anon, authenticated;

-- Verificación: las dos columnas deben dar 0
select
  count(*) filter (where password !~ '^\$2[aby]\$') as sin_cifrar,
  (select count(*) from information_schema.column_privileges
     where table_name = 'app_users' and column_name = 'password'
       and grantee in ('anon', 'authenticated') and privilege_type = 'SELECT') as lectura_password_publica
from public.app_users;
