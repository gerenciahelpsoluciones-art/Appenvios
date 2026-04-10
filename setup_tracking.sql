-- SQL script to set up real-time visitor tracking
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/matyjysinegbibdwzhoq/sql/new)

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.visitantes_web (
    id BIGSERIAL PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    path TEXT NOT NULL,
    device TEXT,
    location TEXT,
    session_id TEXT -- Optional: for unique session tracking
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.visitantes_web ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy: Allow anyone (Anon) to INSERT visits
CREATE POLICY "Allow anon insert" 
ON public.visitantes_web 
FOR INSERT 
WITH CHECK (true);

-- 4. Create Policy: Allow anyone (Anon) to SELECT visits for the dashboard
CREATE POLICY "Allow anon select" 
ON public.visitantes_web 
FOR SELECT 
USING (true);

-- 5. Enable Realtime (optional, for live updates without polling)
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitantes_web;
