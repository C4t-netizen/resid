CREATE TABLE public.verificacion_archivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verificacion_id UUID NOT NULL REFERENCES public.verificaciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  archivo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.verificacion_archivos TO authenticated;
GRANT ALL ON public.verificacion_archivos TO service_role;

ALTER TABLE public.verificacion_archivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view verificacion archivos" ON public.verificacion_archivos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert verificacion archivos" ON public.verificacion_archivos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "delete verificacion archivos" ON public.verificacion_archivos FOR DELETE TO authenticated USING (public.can_edit(auth.uid()));