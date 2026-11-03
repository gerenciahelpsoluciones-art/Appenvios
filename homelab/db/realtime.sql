-- Esquema propio del servicio realtime (sus tenants y migraciones)
\set pguser `echo "$POSTGRES_USER"`

create schema if not exists _realtime;
alter schema _realtime owner to :pguser;
