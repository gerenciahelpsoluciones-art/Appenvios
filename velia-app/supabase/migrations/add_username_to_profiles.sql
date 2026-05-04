-- Migration: Add Username to Velia Profiles
alter table public.velia_perfiles add column if not exists usuario text unique;

-- Update existing profiles with a default username based on email
update public.velia_perfiles 
set usuario = split_part(email, '@', 1) 
where usuario is null;

-- Make username mandatory for future records
alter table public.velia_perfiles alter column usuario set not null;

-- Add a policy to allow public lookup of emails by username (Necessary for login mapping)
-- Or better, we'll use an API route with service role to avoid public exposure.
