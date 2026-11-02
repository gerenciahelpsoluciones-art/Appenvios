-- =====================================================================
-- Seguridad de las tablas · PARTE 3b de 3b
-- Correr DESPUÉS de que la app nueva (login con Supabase Auth) esté en
-- producción y alguien haya entrado con ella. La versión anterior de la app
-- deja de ver datos tras este script.
--
-- Resultado: solo un usuario del CRM con sesión iniciada lee o escribe
-- tablas. La llave pública (anon) solo puede:
--   · insertar visitas y leads de la web de Help (visitantes_web, clientes_web)
--   · ver y aceptar una propuesta por su folio (hs_propuesta_publica / hs_aceptar_propuesta)
-- Las tareas del servidor que usan la llave service_role no se ven afectadas.
-- =====================================================================

begin;

-- ¿Quien hace la consulta es un usuario del CRM? (una cuenta de Auth suelta no basta)
create or replace function public.hs_es_usuario()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_users where id::text = auth.uid()::text)
$$;
revoke all on function public.hs_es_usuario() from public, anon;
grant execute on function public.hs_es_usuario() to authenticated;

-- 1) Quitar todas las políticas anteriores del esquema public (algunas daban
--    lectura libre) para dejar un conjunto conocido.
do $$
declare r record;
begin
  for r in select tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 2) En cada tabla: RLS activo, acceso total para usuarios del CRM, nada para anon
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
    execute format(
      'create policy hs_usuarios_crm on public.%I for all to authenticated
         using ((select public.hs_es_usuario())) with check ((select public.hs_es_usuario()))',
      r.tablename);
    execute format('revoke all on public.%I from anon', r.tablename);
  end loop;
end $$;

-- 3) La web de Help solo inserta visitas y leads (no puede leerlos)
grant insert on public.visitantes_web, public.clientes_web to anon;
create policy hs_web_inserta on public.visitantes_web for insert to anon with check (true);
create policy hs_web_inserta on public.clientes_web for insert to anon with check (true);

-- 4) El login viejo ya no hace falta: se quita para que nadie pruebe claves por ahí
revoke execute on function public.hs_login(text, text) from anon, authenticated;

-- 5) Tablas que se creen en el futuro tampoco quedan abiertas a anon
alter default privileges in schema public revoke all on tables from anon;

commit;

-- Verificación: todas las filas deben decir rls = true y anon_lee = false
select c.relname as tabla,
       c.relrowsecurity as rls,
       has_table_privilege('anon', c.oid, 'select') as anon_lee
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by (c.relrowsecurity and not has_table_privilege('anon', c.oid, 'select')), c.relname;
