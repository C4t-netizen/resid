
-- Add hora to programa_anual
ALTER TABLE public.programa_anual ADD COLUMN IF NOT EXISTS hora time;

-- Storage bucket for documents (actas and programas)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-csh', 'documentos-csh', true)
ON CONFLICT (id) DO NOTHING;

-- Public read; authenticated upload/update/delete
DROP POLICY IF EXISTS "doc public read" ON storage.objects;
CREATE POLICY "doc public read" ON storage.objects FOR SELECT
USING (bucket_id = 'documentos-csh');

DROP POLICY IF EXISTS "doc auth insert" ON storage.objects;
CREATE POLICY "doc auth insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos-csh');

DROP POLICY IF EXISTS "doc auth update" ON storage.objects;
CREATE POLICY "doc auth update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documentos-csh');

DROP POLICY IF EXISTS "doc auth delete" ON storage.objects;
CREATE POLICY "doc auth delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documentos-csh');

-- Archivos para actas
CREATE TABLE IF NOT EXISTS public.acta_archivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acta_id uuid NOT NULL,
  nombre text NOT NULL,
  archivo_url text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.acta_archivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view acta archivos" ON public.acta_archivos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert acta archivos" ON public.acta_archivos FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY "delete acta archivos" ON public.acta_archivos FOR DELETE TO authenticated USING (can_edit(auth.uid()));

-- Archivos para programa anual (por año)
CREATE TABLE IF NOT EXISTS public.programa_archivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anio int NOT NULL,
  nombre text NOT NULL,
  archivo_url text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.programa_archivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view programa archivos" ON public.programa_archivos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert programa archivos" ON public.programa_archivos FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY "delete programa archivos" ON public.programa_archivos FOR DELETE TO authenticated USING (can_edit(auth.uid()));
