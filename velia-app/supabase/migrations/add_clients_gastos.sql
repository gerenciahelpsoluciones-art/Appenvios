-- Migration: Add Clients and Expenses to Velia

-- 1. Create Clientes Table
create table if not exists public.velia_clientes (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    telefono text,
    email text,
    notas text,
    total_comprado numeric(12,2) default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Gastos Table
create table if not exists public.velia_gastos (
    id uuid primary key default gen_random_uuid(),
    descripcion text not null,
    categoria text not null, -- 'Arriendo', 'Servicios', 'Marketing', 'Insumos', 'Sueldos', 'Otros'
    monto numeric(12,2) not null,
    fecha timestamp with time zone default timezone('utc'::text, now()) not null,
    usuario_id uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Modify Velia Ventas to include cliente_id
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name='velia_ventas' and column_name='cliente_id') then
        alter table public.velia_ventas add column cliente_id uuid references public.velia_clientes(id) on delete set null;
    end if;
end $$;

-- 4. Enable RLS
alter table public.velia_clientes enable row level security;
alter table public.velia_gastos enable row level security;

-- 5. Policies
create policy "Acceso total para autenticados en velia_clientes" on public.velia_clientes for all using (auth.role() = 'authenticated');
create policy "Acceso total para autenticados en velia_gastos" on public.velia_gastos for all using (auth.role() = 'authenticated');
