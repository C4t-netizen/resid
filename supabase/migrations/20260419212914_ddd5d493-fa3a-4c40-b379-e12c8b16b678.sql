-- Comité de Seguridad e Higiene: integrantes
create table public.comite_miembros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  puesto text,
  representacion text not null check (representacion in ('patronal','trabajadores')),
  cargo_csh text not null check (cargo_csh in ('coordinador','secretario','vocal')),
  email text,
  telefono text,
  fecha_designacion date,
  activo boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.comite_miembros enable row level security;

-- Acta de constitución
create table public.acta_constitucion (
  id uuid primary key default gen_random_uuid(),
  lugar text,
  fecha_acta date not null,
  hora time,
  vigencia_inicio date,
  vigencia_fin date,
  observaciones text,
  patron_firma text,
  representante_trabajadores_firma text,
  testigo_stps text,
  estatus text not null default 'borrador' check (estatus in ('borrador','firmada','vigente','vencida')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.acta_constitucion enable row level security;

-- Programa anual de actividades
create table public.programa_anual (
  id uuid primary key default gen_random_uuid(),
  anio integer not null,
  mes integer not null check (mes between 1 and 12),
  actividad text not null,
  tipo text check (tipo in ('recorrido','verificacion','capacitacion','reunion','simulacro','otro')),
  responsable text,
  fecha_programada date,
  fecha_realizada date,
  estatus text not null default 'programada' check (estatus in ('programada','en_proceso','realizada','cancelada')),
  observaciones text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.programa_anual enable row level security;

-- Recorridos
create table public.recorridos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  area text not null,
  tipo text default 'ordinario' check (tipo in ('ordinario','extraordinario','especial')),
  integrantes text,
  observaciones_generales text,
  estatus text not null default 'borrador' check (estatus in ('borrador','cerrado')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.recorridos enable row level security;

-- Hallazgos por recorrido
create table public.recorrido_hallazgos (
  id uuid primary key default gen_random_uuid(),
  recorrido_id uuid not null references public.recorridos(id) on delete cascade,
  descripcion text not null,
  ubicacion text,
  nivel_riesgo text default 'medio' check (nivel_riesgo in ('bajo','medio','alto','critico')),
  foto_url text,
  recomendacion text,
  estatus text not null default 'abierto' check (estatus in ('abierto','en_proceso','resuelto')),
  created_at timestamptz not null default now()
);
alter table public.recorrido_hallazgos enable row level security;

-- Verificaciones (listas)
create table public.verificaciones (
  id uuid primary key default gen_random_uuid(),
  norma text not null,
  titulo text not null,
  area text,
  fecha date not null,
  responsable text,
  porcentaje_cumplimiento numeric(5,2),
  estatus text not null default 'borrador' check (estatus in ('borrador','cerrada')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.verificaciones enable row level security;

-- Items por verificación
create table public.verificacion_items (
  id uuid primary key default gen_random_uuid(),
  verificacion_id uuid not null references public.verificaciones(id) on delete cascade,
  numero integer,
  descripcion text not null,
  cumple text not null default 'na' check (cumple in ('si','no','na')),
  observaciones text,
  evidencia_url text,
  created_at timestamptz not null default now()
);
alter table public.verificacion_items enable row level security;

-- Indexes
create index idx_programa_anual_anio on public.programa_anual(anio);
create index idx_recorrido_hallazgos_recorrido on public.recorrido_hallazgos(recorrido_id);
create index idx_verificacion_items_verificacion on public.verificacion_items(verificacion_id);

-- Reusable updated_at triggers
create trigger update_comite_miembros_updated_at before update on public.comite_miembros for each row execute function public.update_updated_at_column();
create trigger update_acta_constitucion_updated_at before update on public.acta_constitucion for each row execute function public.update_updated_at_column();
create trigger update_programa_anual_updated_at before update on public.programa_anual for each row execute function public.update_updated_at_column();
create trigger update_recorridos_updated_at before update on public.recorridos for each row execute function public.update_updated_at_column();
create trigger update_verificaciones_updated_at before update on public.verificaciones for each row execute function public.update_updated_at_column();

-- ============== RLS POLICIES ==============
-- Pattern: authenticated can SELECT; editor+ can INSERT/UPDATE; admin+ can DELETE

-- comite_miembros
create policy "view comite" on public.comite_miembros for select to authenticated using (true);
create policy "edit insert comite" on public.comite_miembros for insert to authenticated with check (public.can_edit(auth.uid()));
create policy "edit update comite" on public.comite_miembros for update to authenticated using (public.can_edit(auth.uid()));
create policy "admin delete comite" on public.comite_miembros for delete to authenticated using (public.is_admin(auth.uid()));

-- acta_constitucion
create policy "view acta" on public.acta_constitucion for select to authenticated using (true);
create policy "edit insert acta" on public.acta_constitucion for insert to authenticated with check (public.can_edit(auth.uid()));
create policy "edit update acta" on public.acta_constitucion for update to authenticated using (public.can_edit(auth.uid()));
create policy "admin delete acta" on public.acta_constitucion for delete to authenticated using (public.is_admin(auth.uid()));

-- programa_anual
create policy "view programa" on public.programa_anual for select to authenticated using (true);
create policy "edit insert programa" on public.programa_anual for insert to authenticated with check (public.can_edit(auth.uid()));
create policy "edit update programa" on public.programa_anual for update to authenticated using (public.can_edit(auth.uid()));
create policy "admin delete programa" on public.programa_anual for delete to authenticated using (public.is_admin(auth.uid()));

-- recorridos
create policy "view recorridos" on public.recorridos for select to authenticated using (true);
create policy "edit insert recorridos" on public.recorridos for insert to authenticated with check (public.can_edit(auth.uid()));
create policy "edit update recorridos" on public.recorridos for update to authenticated using (public.can_edit(auth.uid()));
create policy "admin delete recorridos" on public.recorridos for delete to authenticated using (public.is_admin(auth.uid()));

-- recorrido_hallazgos
create policy "view hallazgos" on public.recorrido_hallazgos for select to authenticated using (true);
create policy "edit insert hallazgos" on public.recorrido_hallazgos for insert to authenticated with check (public.can_edit(auth.uid()));
create policy "edit update hallazgos" on public.recorrido_hallazgos for update to authenticated using (public.can_edit(auth.uid()));
create policy "admin delete hallazgos" on public.recorrido_hallazgos for delete to authenticated using (public.is_admin(auth.uid()));

-- verificaciones
create policy "view verificaciones" on public.verificaciones for select to authenticated using (true);
create policy "edit insert verificaciones" on public.verificaciones for insert to authenticated with check (public.can_edit(auth.uid()));
create policy "edit update verificaciones" on public.verificaciones for update to authenticated using (public.can_edit(auth.uid()));
create policy "admin delete verificaciones" on public.verificaciones for delete to authenticated using (public.is_admin(auth.uid()));

-- verificacion_items
create policy "view items" on public.verificacion_items for select to authenticated using (true);
create policy "edit insert items" on public.verificacion_items for insert to authenticated with check (public.can_edit(auth.uid()));
create policy "edit update items" on public.verificacion_items for update to authenticated using (public.can_edit(auth.uid()));
create policy "admin delete items" on public.verificacion_items for delete to authenticated using (public.is_admin(auth.uid()));