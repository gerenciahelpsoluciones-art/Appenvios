#!/usr/bin/env bash
# Carga el respaldo de Supabase (pg_dump -Fc) en la base nueva del homelab.
#
# Qué se restaura:
#   · public completo: tablas, datos, funciones, triggers, políticas, permisos y publicación realtime
#   · auth: solo los usuarios y sus identidades (mismas contraseñas)
#   · storage: los buckets y las políticas de storage.objects (los archivos se suben aparte)
# Lo interno de auth/storage/realtime lo crea cada servicio en su versión al arrancar.
#
# Uso:  ./restaurar.sh /ruta/appenvios.dump     (con .env ya creado)
set -euo pipefail
cd "$(dirname "$0")"
DUMP="$(realpath "${1:?Falta la ruta del respaldo .dump}")"

echo "1/6 Arrancando la base y creando los esquemas internos (auth, storage)..."
docker compose up -d db
until docker exec crm-db pg_isready -U postgres -h localhost >/dev/null 2>&1; do sleep 2; done
docker compose up -d rest auth storage
# auth y storage crean sus tablas al arrancar
for i in $(seq 1 60); do
  a=$(docker exec crm-db psql -U supabase_admin -d postgres -tAc "select to_regclass('auth.identities') is not null and to_regclass('storage.objects') is not null")
  [ "$a" = "t" ] && break; sleep 2
done
[ "$a" = "t" ] || { echo "auth/storage no crearon sus tablas"; docker compose logs --tail 30 auth storage; exit 1; }
docker compose stop rest auth storage

# La imagen trae permisos por defecto: cada tabla o función nueva en public queda abierta a anon y
# authenticated. Si se dejan, se SUMAN a los del respaldo (p. ej. hs_sync_auth quedaría ejecutable
# sin sesión). Se quitan antes de restaurar; el respaldo trae los permisos exactos de la nube,
# incluidos sus propios permisos por defecto.
docker exec crm-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -qc "
  alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, service_role;
  alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role;
  alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role;
  alter default privileges for role supabase_admin in schema public revoke all on tables from anon, authenticated, service_role;
  alter default privileges for role supabase_admin in schema public revoke all on sequences from anon, authenticated, service_role;
  alter default privileges for role supabase_admin in schema public revoke all on functions from anon, authenticated, service_role;
  alter default privileges for role postgres in schema public revoke execute on functions from public;
  alter default privileges for role supabase_admin in schema public revoke execute on functions from public;"

echo "2/6 Preparando la lista de lo que se restaura..."
docker cp "$DUMP" crm-db:/tmp/respaldo.dump
docker exec crm-db pg_restore -l /tmp/respaldo.dump > /tmp/toc-completo.txt
# Primero los usuarios: perfiles, velia_perfiles e identities tienen llaves foráneas hacia auth.users
grep -E 'TABLE DATA auth (users|identities) ' /tmp/toc-completo.txt > /tmp/toc-usuarios.txt
{
  grep -E '^[0-9]+; [0-9]+ [0-9]+ [A-Z ]+ public ' /tmp/toc-completo.txt | grep -vE ' SCHEMA - public '
  grep -E 'TABLE DATA storage buckets ' /tmp/toc-completo.txt
  grep -E 'POLICY storage objects ' /tmp/toc-completo.txt
} > /tmp/toc.txt
docker cp /tmp/toc-usuarios.txt crm-db:/tmp/toc-usuarios.txt
docker cp /tmp/toc.txt crm-db:/tmp/toc.txt
echo "   $(wc -l < /tmp/toc.txt) elementos + usuarios"

echo "3/6 Restaurando (los avisos de 'ya existe' son normales)..."
docker exec crm-db pg_restore -U supabase_admin -d postgres --disable-triggers \
  -L /tmp/toc-usuarios.txt /tmp/respaldo.dump 2> /tmp/restaurar-errores.txt || true
docker exec crm-db pg_restore -U supabase_admin -d postgres --disable-triggers \
  -L /tmp/toc.txt /tmp/respaldo.dump 2>> /tmp/restaurar-errores.txt || true
echo "   avisos/errores: $(grep -c 'error' /tmp/restaurar-errores.txt || true) (detalle en /tmp/restaurar-errores.txt)"

echo "4/6 Recargando el esquema de la API..."
docker exec crm-db psql -U supabase_admin -d postgres -c "notify pgrst, 'reload schema';" >/dev/null

echo "5/6 Conteo de filas por tabla (base nueva):"
docker exec crm-db psql -U supabase_admin -d postgres -tAc "
  select format('   %-30s %s', relname, n_live_tup) from pg_stat_user_tables
  where schemaname = 'public' order by relname" || true
docker exec crm-db psql -U supabase_admin -d postgres -tAc "analyze" >/dev/null
docker exec crm-db psql -U supabase_admin -d postgres -tAc "
  select '   usuarios auth: ' || count(*) from auth.users;
  select '   buckets: ' || string_agg(id || case when public then ' (público)' else ' (privado)' end, ', ') from storage.buckets;
  select '   tablas en realtime: ' || count(*) from pg_publication_tables where pubname = 'supabase_realtime';"
docker exec crm-db rm -f /tmp/respaldo.dump

echo "6/6 Arrancando todo..."
docker compose up -d
echo "Listo. Falta subir los archivos: python3 subir-storage.py <carpeta storage>"
