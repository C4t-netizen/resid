-- Roles enum
create type public.app_role as enum ('super_admin', 'admin', 'editor', 'viewer');

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  puesto text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- User roles table (separate, to avoid privilege escalation)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer to check role (avoids RLS recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Get the highest role for a user (super_admin > admin > editor > viewer)
create or replace function public.get_user_role(_user_id uuid)
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles
  where user_id = _user_id
  order by case role
    when 'super_admin' then 1
    when 'admin' then 2
    when 'editor' then 3
    when 'viewer' then 4
  end
  limit 1
$$;

-- Helper: can edit (super_admin, admin, editor)
create or replace function public.can_edit(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('super_admin','admin','editor')
  )
$$;

-- Helper: is admin or above
create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('super_admin','admin')
  )
$$;

-- updated_at trigger fn
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- Auto-create profile + assign role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role public.app_role;
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );

  -- Assign super_admin to demo coordinator email, otherwise viewer
  if new.email = 'coordinador@nom019.demo' then
    assigned_role := 'super_admin';
  else
    assigned_role := 'viewer';
  end if;

  insert into public.user_roles (user_id, role) values (new.id, assigned_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Super admins can update any profile"
  on public.profiles for update
  using (public.has_role(auth.uid(), 'super_admin'));

-- RLS: user_roles
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select
  using (public.is_admin(auth.uid()));

create policy "Super admins can manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

-- CSH configuration table (one record per organization for now)
create table public.csh_config (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  rfc text,
  nombre_centro text,
  domicilio text,
  municipio text,
  estado text,
  cp text,
  telefono text,
  rama_actividad text,
  num_trabajadores integer,
  num_hombres integer,
  num_mujeres integer,
  representante_legal text,
  representante_patronal text,
  representante_trabajadores text,
  fecha_constitucion date,
  vigencia_anios integer default 2,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.csh_config enable row level security;

create policy "Anyone authenticated can view CSH config"
  on public.csh_config for select
  to authenticated
  using (true);

create policy "Editors and above can insert CSH config"
  on public.csh_config for insert
  to authenticated
  with check (public.can_edit(auth.uid()));

create policy "Editors and above can update CSH config"
  on public.csh_config for update
  to authenticated
  using (public.can_edit(auth.uid()));

create policy "Admins can delete CSH config"
  on public.csh_config for delete
  to authenticated
  using (public.is_admin(auth.uid()));

create trigger update_csh_config_updated_at
  before update on public.csh_config
  for each row execute function public.update_updated_at_column();