-- Incidentes / Accidentes
create table public.incidentes (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora time,
  area text not null,
  lugar text,
  tipo text not null default 'accidente', -- accidente, incidente, casi_accidente, enfermedad
  gravedad text not null default 'leve',  -- leve, moderado, grave, fatal
  persona_afectada text,
  puesto text,
  edad integer,
  descripcion text not null,
  causas text,
  consecuencias text,
  dias_incapacidad integer default 0,
  costo_estimado numeric default 0,
  estatus text not null default 'abierto', -- abierto, en_investigacion, cerrado
  reportado_por text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.incidentes enable row level security;
create policy "view incidentes" on public.incidentes for select to authenticated using (true);
create policy "edit insert incidentes" on public.incidentes for insert to authenticated with check (can_edit(auth.uid()));
create policy "edit update incidentes" on public.incidentes for update to authenticated using (can_edit(auth.uid()));
create policy "admin delete incidentes" on public.incidentes for delete to authenticated using (is_admin(auth.uid()));

create trigger trg_incidentes_updated before update on public.incidentes
  for each row execute function public.update_updated_at_column();

-- Acciones correctivas
create table public.acciones_correctivas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  origen text, -- recorrido, verificacion, incidente, otro
  origen_id uuid,
  responsable text,
  prioridad text not null default 'media', -- baja, media, alta, critica
  fecha_deteccion date not null default current_date,
  fecha_compromiso date,
  fecha_cierre date,
  avance integer not null default 0, -- 0..100
  estatus text not null default 'abierta', -- abierta, en_progreso, cerrada, vencida
  evidencia_url text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.acciones_correctivas enable row level security;
create policy "view acciones" on public.acciones_correctivas for select to authenticated using (true);
create policy "edit insert acciones" on public.acciones_correctivas for insert to authenticated with check (can_edit(auth.uid()));
create policy "edit update acciones" on public.acciones_correctivas for update to authenticated using (can_edit(auth.uid()));
create policy "admin delete acciones" on public.acciones_correctivas for delete to authenticated using (is_admin(auth.uid()));

create trigger trg_acciones_updated before update on public.acciones_correctivas
  for each row execute function public.update_updated_at_column();

-- Informes
create table public.informes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'mensual', -- mensual, trimestral, anual, especial
  periodo_inicio date not null,
  periodo_fin date not null,
  resumen text,
  total_recorridos integer default 0,
  total_hallazgos integer default 0,
  total_incidentes integer default 0,
  total_acciones integer default 0,
  cumplimiento_promedio numeric default 0,
  estatus text not null default 'borrador', -- borrador, publicado
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.informes enable row level security;
create policy "view informes" on public.informes for select to authenticated using (true);
create policy "edit insert informes" on public.informes for insert to authenticated with check (can_edit(auth.uid()));
create policy "edit update informes" on public.informes for update to authenticated using (can_edit(auth.uid()));
create policy "admin delete informes" on public.informes for delete to authenticated using (is_admin(auth.uid()));

create trigger trg_informes_updated before update on public.informes
  for each row execute function public.update_updated_at_column();