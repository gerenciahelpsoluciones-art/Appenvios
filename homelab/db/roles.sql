-- Contraseña de los roles internos de Supabase = POSTGRES_PASSWORD (la usan rest, auth y storage)
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
-- (supabase_functions_admin no existe en esta imagen: si se lista aquí, la base corta su inicialización)
