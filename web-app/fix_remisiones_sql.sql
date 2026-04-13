-- Corrección de Referencia: Módulo de Remisiones
-- Cambia la referencia de 'clientes_web' (leads) a 'clientes' (clientes oficiales)

ALTER TABLE public.mkt_remisiones 
DROP CONSTRAINT IF EXISTS mkt_remisiones_cliente_id_fkey;

ALTER TABLE public.mkt_remisiones
ADD CONSTRAINT mkt_remisiones_cliente_id_fkey 
FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;

-- Asegurar que los permisos RLS estén activos
ALTER TABLE public.mkt_remisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mkt_remision_detalles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mkt_remisiones_all" ON public.mkt_remisiones;
CREATE POLICY "mkt_remisiones_all" ON public.mkt_remisiones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "mkt_remision_detalles_all" ON public.mkt_remision_detalles;
CREATE POLICY "mkt_remision_detalles_all" ON public.mkt_remision_detalles FOR ALL USING (true) WITH CHECK (true);
