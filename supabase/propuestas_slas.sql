-- SLA por propuesta (Mesa de Ayuda): estándar o importados del RFP del cliente.
-- Solo agrega una columna; no modifica ni borra datos existentes.
alter table public.propuestas add column if not exists slas jsonb;
