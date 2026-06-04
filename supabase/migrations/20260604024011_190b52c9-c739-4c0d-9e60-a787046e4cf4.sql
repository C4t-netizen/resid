ALTER TABLE public.verificaciones 
  ADD COLUMN IF NOT EXISTS observaciones text,
  ADD COLUMN IF NOT EXISTS fecha_inicio timestamptz,
  ADD COLUMN IF NOT EXISTS fecha_fin timestamptz;