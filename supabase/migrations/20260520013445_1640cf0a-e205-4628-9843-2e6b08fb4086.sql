ALTER TABLE public.recorridos
  ADD COLUMN IF NOT EXISTS fecha_inicio date,
  ADD COLUMN IF NOT EXISTS fecha_fin date,
  ADD COLUMN IF NOT EXISTS hora_inicio time without time zone,
  ADD COLUMN IF NOT EXISTS hora_fin time without time zone;