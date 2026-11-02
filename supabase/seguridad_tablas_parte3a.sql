-- =====================================================================
-- Seguridad de las tablas · PARTE 3a de 3b
-- Correr ANTES de desplegar la versión de la app que inicia sesión con
-- Supabase Auth. Es compatible con la app actual: no bloquea nada.
--
-- Crea una cuenta de Supabase Auth por cada usuario del CRM, con el mismo id
-- y la MISMA contraseña (se copia el hash bcrypt de la Parte 2), y la mantiene
-- sincronizada cuando se crea, edita o borra un usuario en el módulo Usuarios.
-- El correo de la cuenta es interno: <usuario>@crm.helpsoluciones.com.co
-- =====================================================================

begin;

-- Correo interno de cada usuario. Debe coincidir con AUTH_EMAIL_DOMAIN en src/modules/Login.tsx
create or replace function public.hs_auth_email(p_usuario text)
returns text
language sql
immutable
as $$ select lower(trim(p_usuario)) || '@crm.helpsoluciones.com.co' $$;

-- Crea o actualiza la cuenta de Auth de un usuario del CRM
create or replace function public.hs_sync_auth(p_id uuid, p_usuario text, p_hash text)
returns void
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  v_email text := public.hs_auth_email(p_usuario);
begin
  -- Sin contraseña cifrada no hay con qué iniciar sesión
  if p_hash is null or p_hash !~ '^\$2[aby]\$' then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', v_email, p_hash, now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', '', '', '', '', ''
  )
  on conflict (id) do update
    set email = excluded.email,
        encrypted_password = excluded.encrypted_password,
        updated_at = now();

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), p_id, p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  )
  on conflict (provider_id, provider) do update
    set identity_data = excluded.identity_data,
        updated_at = now();
end;
$$;

-- Corre después de hs_hash_password, así que la contraseña ya llega cifrada
create or replace function public.hs_app_users_a_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'DELETE' then
    delete from auth.users where id = old.id::uuid;
    return old;
  end if;
  perform public.hs_sync_auth(new.id::uuid, new.usuario, new.password);
  return new;
end;
$$;

drop trigger if exists trg_hs_app_users_a_auth on public.app_users;
create trigger trg_hs_app_users_a_auth
after insert or update or delete on public.app_users
for each row execute function public.hs_app_users_a_auth();

-- Solo los triggers usan estas funciones: nadie las llama desde afuera
revoke all on function public.hs_sync_auth(uuid, text, text) from public, anon, authenticated;
revoke all on function public.hs_app_users_a_auth() from public, anon, authenticated;

-- Crear las cuentas de los usuarios que ya existen
select public.hs_sync_auth(id::uuid, usuario, password) from public.app_users;

-- ---------------------------------------------------------------------
-- Propuesta pública: el cliente ve y acepta UNA propuesta por su folio,
-- sin poder leer la tabla completa.
-- ---------------------------------------------------------------------
create or replace function public.hs_propuesta_publica(p_folio text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select to_json(p)
  from public.propuestas p
  where p.consecutivo = trim(p_folio) or p.id::text = trim(p_folio)
  limit 1
$$;

create or replace function public.hs_aceptar_propuesta(p_folio text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update public.propuestas
  set estado = 'Aceptada'
  where (consecutivo = trim(p_folio) or id::text = trim(p_folio))
    and estado is distinct from 'Aceptada';
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.hs_propuesta_publica(text) from public;
revoke all on function public.hs_aceptar_propuesta(text) from public;
grant execute on function public.hs_propuesta_publica(text) to anon, authenticated;
grant execute on function public.hs_aceptar_propuesta(text) to anon, authenticated;

commit;

-- Verificación: usuarios_crm y cuentas_auth deben ser iguales
select
  (select count(*) from public.app_users where password ~ '^\$2[aby]\$') as usuarios_crm,
  (select count(*) from auth.users u join public.app_users a on a.id::uuid = u.id) as cuentas_auth;
