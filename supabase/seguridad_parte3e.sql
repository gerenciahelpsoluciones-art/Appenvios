-- =====================================================================
-- PARTE 3e: consecutivos comparados como número
-- La app buscaba el último consecutivo ordenando el texto: desde 1000
-- ('REP-999' > 'REP-1000') repetía números. Esta función devuelve el mayor
-- número usado. La app la usa si existe; si no, sigue con el método anterior.
-- =====================================================================

create or replace function public.hs_max_consecutivo(p_tabla text, p_prefijo text)
returns integer
language plpgsql
stable
security invoker  -- respeta RLS: solo usuarios del CRM
set search_path = public
as $$
declare
  v integer;
begin
  if p_tabla not in ('reparaciones', 'ordenes_compra', 'propuestas', 'cotizaciones')
     or p_prefijo not in ('REP-', 'OC-', 'P-') then
    raise exception 'Consecutivo no permitido: % %', p_tabla, p_prefijo;
  end if;

  execute format(
    'select coalesce(max(substring(consecutivo from %s)::int), 0) from public.%I where consecutivo ~ %L',
    length(p_prefijo) + 1, p_tabla, '^' || p_prefijo || '[0-9]+$'
  ) into v;
  return v;
end;
$$;

revoke all on function public.hs_max_consecutivo(text, text) from public, anon;
grant execute on function public.hs_max_consecutivo(text, text) to authenticated;

-- Verificación: el mayor número de cada consecutivo
select
  (select max(substring(consecutivo from 5)::int) from public.reparaciones where consecutivo ~ '^REP-[0-9]+$') as max_rep,
  (select max(substring(consecutivo from 4)::int) from public.ordenes_compra where consecutivo ~ '^OC-[0-9]+$') as max_oc,
  (select max(substring(consecutivo from 3)::int) from public.propuestas where consecutivo ~ '^P-[0-9]+$') as max_p;
