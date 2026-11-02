-- =====================================================================
-- Seguridad · PARTE 3d: propuestas públicas y documentos de registro
--   1. Los enlaces nuevos de propuestas usan el id (UUID). El folio (P-001…)
--      solo sigue sirviendo para las propuestas que ya existían, para no romper
--      los enlaces que ya tienen los clientes.
--   2. El bucket documentos_registro (RUT, Cámara de Comercio) deja de ser
--      público: el formulario sube, solo usuarios del CRM pueden abrirlos.
-- Se puede correr antes o después de desplegar la app.
-- =====================================================================

begin;

-- 1) Propuestas
alter table public.propuestas add column if not exists permite_folio_publico boolean not null default false;
update public.propuestas set permite_folio_publico = true;  -- solo las que existen hoy

create or replace function public.hs_propuesta_publica(p_folio text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select to_json(p)
  from public.propuestas p
  where p.id::text = trim(p_folio)
     or (p.consecutivo = trim(p_folio) and p.permite_folio_publico)
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
  where (id::text = trim(p_folio) or (consecutivo = trim(p_folio) and permite_folio_publico))
    and estado in ('Borrador', 'Enviada');
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.hs_propuesta_publica(text) from public;
revoke all on function public.hs_aceptar_propuesta(text) from public;
grant execute on function public.hs_propuesta_publica(text) to anon, authenticated;
grant execute on function public.hs_aceptar_propuesta(text) to anon, authenticated;

-- 2) Documentos de registro: bucket privado, máximo 10 MB, solo PDF o imagen
update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
where id = 'documentos_registro';

-- Quitar las políticas anteriores de ese bucket
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') like '%documentos_registro%' or coalesce(with_check, '') like '%documentos_registro%')
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;

-- El formulario público solo sube (no lista, no descarga, no reemplaza)
create policy hs_registro_sube on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'documentos_registro');
-- Solo usuarios del CRM abren los documentos (enlace firmado)
create policy hs_registro_crm_lee on storage.objects for select to authenticated
  using (bucket_id = 'documentos_registro' and (select public.hs_es_usuario()));

commit;

-- Verificación: publico = false y 2 políticas
select
  (select public from storage.buckets where id = 'documentos_registro') as publico,
  (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects'
     and (coalesce(qual, '') like '%documentos_registro%' or coalesce(with_check, '') like '%documentos_registro%')) as politicas,
  (select count(*) from public.propuestas where permite_folio_publico) as propuestas_con_folio;
