-- =====================================================================
-- Seguridad de las tablas · PARTE 3c (corrección de la 3b)
-- La base AppEnvios es compartida: además del CRM la usan 2rpits-app (trp_*),
-- helpmarketing (mkt_*, lectura de visitantes_web) y velia-app (velia_*, perfiles).
-- La 3b cerró y borró las políticas de TODAS las tablas. Esta parte:
--   1. Devuelve a las otras apps el acceso que tenían (velia con sus políticas
--      originales de velia-app/supabase; el resto abierto como estaba).
--   2. Reabre el formulario público de registro del CRM (registros_pendientes).
--   3. Solo un Admin del CRM crea, edita o borra usuarios.
--   4. La sincronización con Auth no puede pisar cuentas de otras apps.
--   5. Solo se aceptan propuestas en Borrador o Enviada.
-- =====================================================================

begin;

-- Tablas del CRM (src/**/*.tsx). Todo lo demás pertenece a otras apps.
create or replace function public.hs_tablas_crm()
returns text[]
language sql
immutable
as $$ select array[
  'alquileres','app_users','budgets','clientes','clientes_web','conductores',
  'contratos_obligaciones','cotizaciones','despachos','devoluciones',
  'mkt_remision_detalles','mkt_remisiones','ordenes_compra','productos','propuestas',
  'proveedores','registros_pendientes','reparaciones','ventas_manuales','visitantes_web'
]::text[] $$;

-- ---------------------------------------------------------------------
-- 1a) Otras apps sin login propio (2rpits, helpmarketing y demás): abiertas como antes
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select tablename from pg_tables
    where schemaname = 'public'
      and not (tablename = any (public.hs_tablas_crm()))
      and tablename not like 'velia\_%'
      and tablename <> 'perfiles'
  loop
    execute format('drop policy if exists hs_usuarios_crm on public.%I', r.tablename);
    execute format('drop policy if exists hs_restaurado_abierto on public.%I', r.tablename);
    execute format('create policy hs_restaurado_abierto on public.%I for all using (true) with check (true)', r.tablename);
    execute format('grant all on public.%I to anon, authenticated', r.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 1b) velia-app: sus políticas originales (velia-app/supabase/*.sql)
-- ---------------------------------------------------------------------
create or replace function public.velia_get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$ select rol from public.velia_perfiles where id = auth.uid() limit 1 $$;

do $$
declare t text;
begin
  foreach t in array array['velia_productos','velia_ventas','velia_detalles_venta','velia_proveedores','velia_clientes','velia_gastos'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists hs_usuarios_crm on public.%I', t);
      execute format('drop policy if exists %I on public.%I', 'Acceso total para autenticados en ' || t, t);
      execute format('create policy %I on public.%I for all using (auth.role() = ''authenticated'')', 'Acceso total para autenticados en ' || t, t);
      execute format('grant all on public.%I to anon, authenticated', t);
    end if;
  end loop;

  if to_regclass('public.velia_perfiles') is not null then
    drop policy if exists hs_usuarios_crm on public.velia_perfiles;
    drop policy if exists velia_perfiles_select on public.velia_perfiles;
    drop policy if exists velia_perfiles_insert on public.velia_perfiles;
    drop policy if exists velia_perfiles_update on public.velia_perfiles;
    drop policy if exists velia_perfiles_delete on public.velia_perfiles;
    create policy velia_perfiles_select on public.velia_perfiles for select using (auth.role() = 'authenticated');
    create policy velia_perfiles_insert on public.velia_perfiles for insert with check (public.velia_get_my_role() = 'admin');
    create policy velia_perfiles_update on public.velia_perfiles for update using (public.velia_get_my_role() = 'admin');
    create policy velia_perfiles_delete on public.velia_perfiles for delete using (public.velia_get_my_role() = 'admin');
    grant all on public.velia_perfiles to anon, authenticated;
    delete from public.velia_perfiles where email like '%@crm.helpsoluciones.com.co';
  end if;

  if to_regclass('public.perfiles') is not null then
    drop policy if exists hs_usuarios_crm on public.perfiles;
    drop policy if exists "Los perfiles son visibles por todos los autenticados" on public.perfiles;
    drop policy if exists "Solo administradores pueden insertar/actualizar perfiles" on public.perfiles;
    create policy "Los perfiles son visibles por todos los autenticados" on public.perfiles
      for select using (auth.role() = 'authenticated');
    create policy "Solo administradores pueden insertar/actualizar perfiles" on public.perfiles
      for all using ((select rol from public.perfiles where id = auth.uid()) = 'admin');
    grant all on public.perfiles to anon, authenticated;
    -- El trigger handle_new_user de velia pudo crear perfiles para los usuarios del CRM
    delete from public.perfiles where email like '%@crm.helpsoluciones.com.co';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) Accesos públicos que el CRM y helpmarketing necesitan
-- ---------------------------------------------------------------------
-- Formulario público de registro (/?form=registro)
grant insert on public.registros_pendientes to anon;
drop policy if exists hs_web_inserta on public.registros_pendientes;
create policy hs_web_inserta on public.registros_pendientes for insert to anon with check (true);

-- Analítica de visitas de helpmarketing (lee con la llave pública)
grant select on public.visitantes_web to anon;
drop policy if exists hs_marketing_lee on public.visitantes_web;
create policy hs_marketing_lee on public.visitantes_web for select to anon using (true);

-- ---------------------------------------------------------------------
-- 3) Usuarios del CRM: todos los ven, solo un Admin los crea, edita o borra
-- ---------------------------------------------------------------------
create or replace function public.hs_es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_users where id::text = auth.uid()::text and lower(rol) = 'admin')
$$;
revoke all on function public.hs_es_admin() from public, anon;
grant execute on function public.hs_es_admin() to authenticated;

drop policy if exists hs_usuarios_crm on public.app_users;
drop policy if exists hs_usuarios_leen on public.app_users;
drop policy if exists hs_admin_escribe on public.app_users;
create policy hs_usuarios_leen on public.app_users for select to authenticated
  using ((select public.hs_es_usuario()));
create policy hs_admin_escribe on public.app_users for all to authenticated
  using ((select public.hs_es_admin())) with check ((select public.hs_es_admin()));

-- ---------------------------------------------------------------------
-- 4) La sincronización solo toca cuentas del CRM y solo cuando cambia usuario o clave
-- ---------------------------------------------------------------------
create or replace function public.hs_sync_auth(p_id uuid, p_usuario text, p_hash text)
returns void
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  v_email text := public.hs_auth_email(p_usuario);
begin
  if p_hash is null or p_hash !~ '^\$2[aby]\$' then
    return;
  end if;

  -- Ese id ya es una cuenta de otra app: no se toca
  if exists (select 1 from auth.users where id = p_id and email not like '%@crm.helpsoluciones.com.co') then
    raise exception 'El id % ya pertenece a una cuenta que no es del CRM', p_id;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', v_email, p_hash, now(),
    '{"provider":"email","providers":["email"]}', '{"app":"helpicrm"}', now(), now(),
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
revoke all on function public.hs_sync_auth(uuid, text, text) from public, anon, authenticated;

create or replace function public.hs_app_users_a_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'DELETE' then
    delete from auth.users where id = old.id::uuid and email like '%@crm.helpsoluciones.com.co';
    return old;
  end if;
  if tg_op = 'UPDATE' and new.usuario is not distinct from old.usuario
     and new.password is not distinct from old.password then
    return new;
  end if;
  perform public.hs_sync_auth(new.id::uuid, new.usuario, new.password);
  return new;
end;
$$;
revoke all on function public.hs_app_users_a_auth() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5) Una propuesta solo se acepta si está en Borrador o Enviada
-- ---------------------------------------------------------------------
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
    and estado in ('Borrador', 'Enviada');
  get diagnostics n = row_count;
  return n > 0;
end;
$$;
revoke all on function public.hs_aceptar_propuesta(text) from public;
grant execute on function public.hs_aceptar_propuesta(text) to anon, authenticated;

commit;

-- Verificación: tablas que NO son del CRM deben salir con anon_lee = true
-- (como estaban); las del CRM con anon_lee = false salvo visitantes_web.
select c.relname as tabla,
       c.relname = any (public.hs_tablas_crm()) as es_crm,
       has_table_privilege('anon', c.oid, 'select') as anon_lee,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as politicas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 2, 1;
