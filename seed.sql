-- ============================================================
-- CMMS - Tenant bootstrap (idempotente)
-- Ejecutar en el esquema PUBLIC de Supabase
-- ============================================================

-- =========[ 0) EXTENSIONES ]=========
create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists pgcrypto;

-- =========[ 1) ENUMS ]=========
-- location_enum
do $$
begin
  if not exists(select 1 from pg_type where typname='location_enum') then
    create type location_enum as enum (
      'Operadora de Servicios Alimenticios',
      'Adrian Tropical 27',
      'Adrian Tropical Malecón',
      'Adrian Tropical Lincoln',
      'Adrian Tropical San Vicente',
      'Atracciones el Lago',
      'M7',
      'E. Arturo Trading',
      'Edificio Comunitario'
    );
  end if;
end$$;

-- priority_enum (usado en reports y UI)
do $$
begin
  if not exists(select 1 from pg_type where typname='priority_enum') then
    create type priority_enum as enum ('Baja','Media','Alta');
  end if;
end$$;

-- permission_action (catálogo de acciones)
do $$
begin
  if not exists(select 1 from pg_type where typname='permission_action') then
    create type permission_action as enum (
      'create','read','read_own','update','delete',
      'work','import','export','approve','assign','disable',
      'manage_roles','manage_permissions','full_access','cancel'
    );
  else
    -- asegura valores faltantes sin romper si ya existen
    perform 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
      where t.typname='permission_action' and e.enumlabel='full_access';
    if not found then alter type permission_action add value 'full_access'; end if;

    perform 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
      where t.typname='permission_action' and e.enumlabel='cancel';
    if not found then alter type permission_action add value 'cancel'; end if;

    perform 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
      where t.typname='permission_action' and e.enumlabel='delete';
    if not found then alter type permission_action add value 'delete'; end if;
  end if;
end$$;

-- =========[ 2) TABLAS BASE RBAC ]=========
-- roles
create table if not exists public.roles (
  id serial primary key,
  name text not null,
  created_at timestamptz default now(),
  description varchar null,
  is_system boolean not null default false,
  constraint roles_nombre_key unique (name)
);

-- users (perfil público; FK a auth.users se añade al final del archivo)
create table if not exists public.users (
  id uuid primary key,
  rol_id bigint null references public.roles(id),
  name text not null,
  last_name text not null,
  location location_enum not null default 'Operadora de Servicios Alimenticios',
  email text,
  phone text,
  created_at timestamp default now() not null,
  is_active boolean not null default true,
  created_by uuid null default auth.uid(),
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

-- catálogo de permisos
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  resource text not null,
  action permission_action not null,
  code text not null unique,
  label text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- join rol-permiso
create table if not exists public.role_permissions (
  role_id int not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- join usuario-rol (usa auth.users)
create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id int not null references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- =========[ 3) TABLAS DE NEGOCIO ]=========
-- assignees (técnicos)
do $$
begin
  if not exists (select 1 from pg_type where typname='assignee_section_enum') then
    create type assignee_section_enum as enum ('SIN ASIGNAR','Internos','TERCEROS','OTROS');
  end if;
end$$;

create table if not exists public.assignees (
  id bigserial primary key,
  name text not null,
  last_name text not null,
  section assignee_section_enum not null default 'SIN ASIGNAR',
  user_id uuid references public.users(id),
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.users(id),
  updated_by uuid references public.users(id),
  constraint assignees_name_section_uk unique (name, section)
);

create index if not exists assignees_is_active_idx on public.assignees(is_active);
create index if not exists assignees_section_idx    on public.assignees(section);
create index if not exists assignees_user_id_idx    on public.assignees(user_id);

-- tickets
create table if not exists public.tickets (
  id bigserial primary key,
  title text not null,
  description text not null,
  is_accepted boolean not null default false,
  is_urgent boolean not null,
  priority priority_enum not null,
  requester text not null,
  location location_enum not null,
  assignee text not null, -- legado visible
  incident_date date not null,
  deadline_date date,
  image text not null,
  email text,
  phone text,
  comments text,
  created_at timestamp default now() not null,
  updated_at timestamptz,
  status text default 'Pendiente',
  created_by uuid,
  assignee_id bigint
);

-- FK creador (si existe users)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='tickets' and constraint_name='tickets_created_by_fkey'
  ) then
    alter table public.tickets
      add constraint tickets_created_by_fkey
      foreign key (created_by) references public.users(id);
  end if;
end$$;

-- FK assignee_id (NOT VALID + validate)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='tickets' and constraint_name='tickets_assignee_id_fkey'
  ) then
    alter table public.tickets
      add constraint tickets_assignee_id_fkey
      foreign key (assignee_id) references public.assignees(id)
      on delete set null
      not valid;
    alter table public.tickets validate constraint tickets_assignee_id_fkey;
  end if;
end$$;

-- índices tickets
create index if not exists idx_tickets_status        on public.tickets(status);
create index if not exists idx_tickets_isaccepted    on public.tickets(is_accepted);
create index if not exists idx_tickets_location      on public.tickets(location);
create index if not exists idx_tickets_created_by    on public.tickets(created_by);
create index if not exists idx_tickets_title_trgm     on public.tickets using gin (title gin_trgm_ops);
create index if not exists idx_tickets_requester_trgm on public.tickets using gin (requester gin_trgm_ops);
create index if not exists idx_tickets_pend_accepted_loc on public.tickets(status, location)
  where status='Pendiente' and is_accepted=true;
create index if not exists idx_tickets_not_pend_loc on public.tickets(status, location)
  where status <> 'Pendiente';

-- =========[ 4) TRIGGERS / AUDITORÍA ]=========
-- users updated_at / updated_by
create or replace function public.set_users_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end$$;
drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_users_updated_at();

-- bloqueo created_by (users y assignees)
create or replace function public.prevent_created_by_update()
returns trigger language plpgsql as $$
begin
  if tg_op='UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'No está permitido modificar created_by';
  end if;
  return new;
end$$;
drop trigger if exists trg_users_lock_created_by on public.users;
create trigger trg_users_lock_created_by
before update on public.users
for each row execute function public.prevent_created_by_update();

drop trigger if exists trg_assignees_lock_created_by on public.assignees;
create trigger trg_assignees_lock_created_by
before update on public.assignees
for each row execute function public.prevent_created_by_update();

-- assignees updated_at / updated_by
create or replace function public.set_assignees_updated_fields()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end$$;
drop trigger if exists trg_assignees_set_updated on public.assignees;
create trigger trg_assignees_set_updated
before update on public.assignees
for each row execute function public.set_assignees_updated_fields();

-- tickets: set created_by y updated_at
create or replace function public.tickets_set_created_by()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end$$;
drop trigger if exists trg_tickets_set_created_by on public.tickets;
create trigger trg_tickets_set_created_by
before insert on public.tickets
for each row execute function public.tickets_set_created_by();

create or replace function public.tickets_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;
drop trigger if exists trg_tickets_set_updated_at on public.tickets;
create trigger trg_tickets_set_updated_at
before update on public.tickets
for each row execute function public.tickets_set_updated_at();

-- Guardias de negocio
create or replace function public.guard_tickets_cancel()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by no es editable';
  end if;

  if new.status is distinct from old.status then
    if lower(new.status) in ('cancelada','cancelado','canceled','cancelled') then
      if not public.me_has_permission('work_orders:cancel') then
        raise exception 'No autorizado a cancelar (requiere work_orders:cancel)';
      end if;
    end if;
  end if;
  return new;
end$$;
drop trigger if exists trg_guard_tickets_cancel on public.tickets;
create trigger trg_guard_tickets_cancel
before update on public.tickets
for each row execute function public.guard_tickets_cancel();

create or replace function public.guard_accept_requires_assignee()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.is_accepted=false and new.is_accepted=true then
    if not public.me_has_permission('work_requests:full_access') then
      raise exception 'No autorizado a aceptar solicitudes (requiere work_requests:full_access)';
    end if;
    if new.assignee_id is null then
      raise exception 'No se puede aceptar sin responsable (assignee_id).';
    end if;
    if not exists (select 1 from public.assignees a where a.id=new.assignee_id and a.is_active=true) then
      raise exception 'El responsable indicado no existe o está inactivo.';
    end if;
  end if;
  return new;
end$$;
drop trigger if exists trg_guard_accept_requires_assignee on public.tickets;
create trigger trg_guard_accept_requires_assignee
before update on public.tickets
for each row execute function public.guard_accept_requires_assignee();

create or replace function public.assignees_guard_cancel()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='UPDATE' and new.is_active is distinct from old.is_active then
    if not public.me_has_permission('assignees:cancel') then
      raise exception 'No autorizado: requiere assignees:cancel';
    end if;
  end if;
  return new;
end$$;
drop trigger if exists trg_assignees_guard_cancel on public.assignees;
create trigger trg_assignees_guard_cancel
before update on public.assignees
for each row execute function public.assignees_guard_cancel();

create or replace function public.users_guard_cancel()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='UPDATE' and new.is_active is distinct from old.is_active then
    if not public.me_has_permission('users:cancel') then
      raise exception 'No autorizado: requiere users:cancel';
    end if;
  end if;
  return new;
end$$;
drop trigger if exists trg_users_guard_cancel on public.users;
create trigger trg_users_guard_cancel
before update on public.users
for each row execute function public.users_guard_cancel();

create or replace function public.users_guard_role_change()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='UPDATE' and new.rol_id is distinct from old.rol_id then
    if not public.me_has_permission('rbac:manage_roles') then
      raise exception 'No autorizado: requiere rbac:manage_roles para cambiar rol';
    end if;
  end if;
  return new;
end$$;
drop trigger if exists trg_users_guard_role_change on public.users;
create trigger trg_users_guard_role_change
before update on public.users
for each row execute function public.users_guard_role_change();

-- =========[ 5) FUNCIONES RBAC / RPCs ]=========
create or replace function public.has_permission(u uuid, perm_code text)
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = u and p.code = perm_code and p.is_active
  );
$$;

create or replace function public.me_has_permission(perm_code text)
returns boolean language sql stable security definer set search_path=public as $$
  select public.has_permission(auth.uid(), perm_code);
$$;

create or replace function public.my_permissions()
returns table(code text) language sql stable security definer set search_path=public as $$
  select distinct p.code
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where ur.user_id = auth.uid() and p.is_active;
$$;

grant execute on function public.me_has_permission(text) to anon, authenticated;
grant execute on function public.my_permissions() to anon, authenticated;

-- is_admin helper
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select coalesce(
    public.me_has_permission('rbac:manage_roles')
    or public.me_has_permission('rbac:manage_permissions')
  , false);
$$;
grant execute on function public.is_admin() to authenticated;

-- sync_permissions (desde FE)
create or replace function public.sync_permissions(perms jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.has_permission(auth.uid(), 'rbac:manage_permissions') then
    raise exception 'forbidden';
  end if;

  insert into public.permissions(resource, action, code, label, description, is_active)
  select lower(p->>'resource'),
         (p->>'action')::permission_action,
         lower((p->>'resource')||':'||(p->>'action')),
         coalesce(p->>'label', initcap(p->>'resource')||' '||(p->>'action')),
         p->>'description',
         coalesce((p->>'is_active')::boolean, true)
  from jsonb_array_elements(perms) p
  on conflict (code) do update
    set label = excluded.label,
        description = excluded.description,
        is_active = excluded.is_active;

  update public.permissions set is_active=false
  where code not in (
    select lower((p->>'resource')||':'||(p->>'action'))
    from jsonb_array_elements(perms) p
  );
end;
$$;

-- set_role_permissions
create or replace function public.set_role_permissions(p_role_id integer, p_perm_codes text[])
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.has_permission(auth.uid(), 'rbac:manage_roles') then
    raise exception 'forbidden';
  end if;

  insert into public.role_permissions(role_id, permission_id)
  select p_role_id, id
  from public.permissions
  where code = any(p_perm_codes)
  on conflict do nothing;

  delete from public.role_permissions rp
  where rp.role_id = p_role_id
    and rp.permission_id not in (select id from public.permissions where code = any(p_perm_codes));
end;
$$;

-- create_user_in_public (opcional desde FE)
create or replace function public.create_user_in_public (
  p_id uuid,
  p_email text,
  p_name text,
  p_last_name text,
  p_location location_enum,
  p_rol_id integer default null
) returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.me_has_permission('users:create') then
    raise exception 'forbidden: users:create required';
  end if;

  insert into public.users(id, email, name, last_name, location)
  values (p_id, p_email, p_name, p_last_name, p_location)
  on conflict (id) do update
    set email     = excluded.email,
        name      = excluded.name,
        last_name = excluded.last_name,
        location  = excluded.location;

  if p_rol_id is not null then
    if not public.me_has_permission('rbac:manage_roles') then
      raise exception 'forbidden: rbac:manage_roles required to assign roles';
    end if;

    update public.users set rol_id = p_rol_id where id = p_id;

    insert into public.user_roles(user_id, role_id)
    values (p_id, p_rol_id)
    on conflict do nothing;
  end if;
end;
$$;
grant execute on function public.create_user_in_public(uuid, text, text, text, location_enum, integer) to authenticated;

-- RPC: conteos
create or replace function public.ticket_counts(
  p_location text default null,
  p_term     text default null
)
returns table(status text, total bigint)
language sql stable security invoker set search_path=public
as $$
  select t.status, count(*)::bigint as total
  from public.tickets t
  where
    (t.status <> 'Pendiente' or t.is_accepted = true)
    and (p_location is null or t.location = p_location::location_enum)
    and (
      p_term is null
      or t.title ilike '%'||p_term||'%'
      or t.requester ilike '%'||p_term||'%'
      or (p_term ~ '^[0-9]+$' and t.id = p_term::bigint)
    )
  group by t.status
  order by t.status;
$$;
grant execute on function public.ticket_counts(text, text) to authenticated;

-- =========[ 6) RLS ]=========
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='roles' and policyname='roles readable') then
    create policy "roles readable" on public.roles for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='role_permissions' and policyname='rbac role_permissions rw') then
    create policy "rbac role_permissions rw"
    on public.role_permissions for all
    using (public.me_has_permission('rbac:manage_roles'))
    with check (public.me_has_permission('rbac:manage_roles'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_roles' and policyname='rbac user_roles rw') then
    create policy "rbac user_roles rw"
    on public.user_roles for all
    using (public.me_has_permission('rbac:manage_roles'))
    with check (public.me_has_permission('rbac:manage_roles'));
  end if;
end $$;

-- user_roles self read
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_roles' and policyname='user_roles self read') then
    create policy "user_roles self read" on public.user_roles for select using (user_id = auth.uid());
  end if;
end $$;

-- users
alter table public.users enable row level security;

drop policy if exists users_select_rbac       on public.users;
drop policy if exists users_insert_rbac       on public.users;
drop policy if exists users_update_rbac       on public.users;
drop policy if exists users_update_self_profile on public.users;
drop policy if exists users_delete_rbac       on public.users;

create policy users_select_rbac
on public.users for select to authenticated
using ( public.me_has_permission('users:read') or public.me_has_permission('users:full_access') );

create policy users_insert_rbac
on public.users for insert to authenticated
with check ( public.me_has_permission('users:full_access') );

create policy users_update_rbac
on public.users for update to authenticated
using ( public.me_has_permission('users:full_access') )
with check ( public.me_has_permission('users:full_access') );

create policy users_update_self_profile
on public.users for update to authenticated
using ( id = auth.uid() )
with check ( id = auth.uid() );

create policy users_delete_rbac
on public.users for delete to authenticated
using ( public.me_has_permission('users:delete') );

-- assignees
alter table public.assignees enable row level security;
drop policy if exists assignees_select_rbac on public.assignees;
drop policy if exists assignees_insert_rbac on public.assignees;
drop policy if exists assignees_update_rbac on public.assignees;
drop policy if exists assignees_delete_rbac on public.assignees;

create policy assignees_select_rbac
on public.assignees for select to authenticated
using ( public.me_has_permission('assignees:read') or public.me_has_permission('assignees:full_access') );

create policy assignees_insert_rbac
on public.assignees for insert to authenticated
with check ( public.me_has_permission('assignees:full_access') );

create policy assignees_update_rbac
on public.assignees for update to authenticated
using ( public.me_has_permission('assignees:full_access') )
with check ( public.me_has_permission('assignees:full_access') );

create policy assignees_delete_rbac
on public.assignees for delete to authenticated
using ( public.me_has_permission('assignees:delete') );

-- tickets (separando solicitudes vs OT)
alter table public.tickets enable row level security;

drop policy if exists tickets_insert_rbac         on public.tickets;
drop policy if exists tickets_select_requests     on public.tickets;
drop policy if exists tickets_select_work_orders  on public.tickets;
drop policy if exists tickets_update_requests     on public.tickets;
drop policy if exists tickets_update_work_orders  on public.tickets;
drop policy if exists tickets_delete_requests     on public.tickets;
drop policy if exists tickets_delete_work_orders  on public.tickets;

create policy tickets_insert_rbac
on public.tickets for insert to authenticated
with check ( public.me_has_permission('work_orders:create') and created_by = auth.uid() );

create policy tickets_select_requests
on public.tickets for select to authenticated
using (
  is_accepted=false and (
    public.me_has_permission('work_requests:read')
    or public.me_has_permission('work_requests:full_access')
    or created_by = auth.uid()
  )
);

create policy tickets_select_work_orders
on public.tickets for select to authenticated
using (
  is_accepted=true and (
    public.me_has_permission('work_orders:read')
    or public.me_has_permission('work_orders:full_access')
    or (public.me_has_permission('work_orders:read_own') and created_by = auth.uid())
  )
);

create policy tickets_update_requests
on public.tickets for update to authenticated
using (
  is_accepted=false and (
    public.me_has_permission('work_requests:full_access')
    or (public.me_has_permission('work_orders:create') and created_by = auth.uid())
  )
)
with check (
  is_accepted=false and (
    public.me_has_permission('work_requests:full_access')
    or (public.me_has_permission('work_orders:create') and created_by = auth.uid())
  )
);

create policy tickets_update_work_orders
on public.tickets for update to authenticated
using (
  is_accepted=true and (
    public.me_has_permission('work_orders:full_access')
    or (public.me_has_permission('work_orders:create') and created_by = auth.uid())
  )
)
with check (
  is_accepted=true and (
    public.me_has_permission('work_orders:full_access')
    or (public.me_has_permission('work_orders:create') and created_by = auth.uid())
  )
);

create policy tickets_delete_requests
on public.tickets for delete to authenticated
using ( is_accepted=false and public.me_has_permission('work_requests:delete') );

create policy tickets_delete_work_orders
on public.tickets for delete to authenticated
using ( is_accepted=true  and public.me_has_permission('work_orders:delete') );

-- =========[ 7) PERMISOS SEED / ROL ADMIN ]=========
DO $$
DECLARE
  v_admin_role_id int;
BEGIN
  INSERT INTO public.roles(name, description, is_system)
  SELECT 'Administrator','Acceso total', true
  WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name='Administrator');

  SELECT id INTO v_admin_role_id FROM public.roles WHERE name='Administrator' LIMIT 1;

  WITH perms_src(resource, action, code, label, description) AS (
    VALUES
      ('rbac','manage_permissions','rbac:manage_permissions','Sincronizar permisos','Puede sincronizar y administrar permisos'),
      ('rbac','manage_roles','rbac:manage_roles','Gestionar roles','Puede crear/editar roles y asignar permisos'),
      ('work_orders','read','work_orders:read','Ver OT',NULL),
      ('work_orders','read_own','work_orders:read_own','Ver mis OT',NULL),
      ('work_orders','create','work_orders:create','Crear OT',NULL),
      ('work_orders','update','work_orders:update','Editar OT',NULL),
      ('work_orders','delete','work_orders:delete','Eliminar OT',NULL),
      ('work_orders','work','work_orders:work','Trabajar OT',NULL),
      ('work_orders','approve','work_orders:approve','Aprobar/Rechazar OT',NULL),
      ('work_orders','full_access','work_orders:full_access','Acceso total OT',NULL),
      ('work_orders','cancel','work_orders:cancel','Cancelar OT',NULL),
      ('work_requests','read','work_requests:read','Ver solicitudes',NULL),
      ('work_requests','create','work_requests:create','Crear solicitudes',NULL),
      ('work_requests','update','work_requests:update','Editar solicitudes',NULL),
      ('work_requests','delete','work_requests:delete','Eliminar solicitudes',NULL),
      ('work_requests','work','work_requests:work','Trabajar solicitudes',NULL),
      ('work_requests','approve','work_requests:approve','Aprobar/Rechazar solicitudes',NULL),
      ('work_requests','full_access','work_requests:full_access','Acceso total solicitudes',NULL),
      ('work_requests','cancel','work_requests:cancel','Cancelar solicitudes',NULL),
      ('reports','read','reports:read','Ver reportes',NULL),
      ('users','read','users:read','Ver usuarios',NULL),
      ('users','create','users:create','Crear usuarios',NULL),
      ('users','update','users:update','Editar usuarios',NULL),
      ('users','delete','users:delete','Eliminar usuarios',NULL),
      ('users','full_access','users:full_access','Acceso total usuarios',NULL),
      ('users','cancel','users:cancel','Activar/Desactivar usuarios',NULL),
      ('assignees','read','assignees:read','Ver técnicos',NULL),
      ('assignees','create','assignees:create','Crear técnicos',NULL),
      ('assignees','update','assignees:update','Editar técnicos',NULL),
      ('assignees','delete','assignees:delete','Eliminar técnicos',NULL),
      ('assignees','full_access','assignees:full_access','Acceso total técnicos',NULL),
      ('assignees','cancel','assignees:cancel','Activar/Desactivar técnicos',NULL),
      ('home','read','home:read','Dashboard/Home',NULL)
  )
  INSERT INTO public.permissions(id, resource, action, code, label, description, is_active, created_at)
  SELECT gen_random_uuid(), s.resource, s.action::permission_action, s.code, s.label, s.description, TRUE, NOW()
  FROM perms_src s
  ON CONFLICT (code) DO UPDATE SET
    resource=EXCLUDED.resource, action=EXCLUDED.action, label=EXCLUDED.label,
    description=EXCLUDED.description, is_active=TRUE;

  INSERT INTO public.role_permissions(role_id, permission_id)
  SELECT v_admin_role_id, p.id FROM public.permissions p
  ON CONFLICT DO NOTHING;
END$$;

-- =========[ 8) PLACEHOLDERS Y LIMPIEZA DE LEGADO ]=========
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.assignees
    WHERE name='SIN ASIGNAR' AND section='SIN ASIGNAR'
  ) THEN
    INSERT INTO public.assignees(name, last_name, section, is_active)
    VALUES ('SIN ASIGNAR', '', 'SIN ASIGNAR', true);
  END IF;
END$$;

update public.tickets t
set assignee_id = a.id
from public.assignees a
where t.assignee_id is null
  and nullif(trim(t.assignee),'') is not null
  and upper(trim(t.assignee)) = upper(trim(a.name||' '||a.last_name));

-- =========[ 9) REALTIME + STORAGE ]=========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='tickets'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets';
  END IF;
END$$;

ALTER TABLE public.tickets REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attachments') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('attachments', 'attachments', true);
  END IF;
END$$;

-- =========[ 10) FK ENTRE AUTH.USERS Y PUBLIC.USERS ]=========
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema='public' and table_name='users' and constraint_name='users_id_fkey'
  ) then
    alter table public.users
      add constraint users_id_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end$$;

-- =========[ 10-bis) GRANTS PARA SERVICIO DE AUTH ]=========
-- En algunos proyectos nuevos, el rol interno de GoTrue puede no tener todo
-- lo necesario para "queryear el schema". Estos GRANTs son seguros.
do $$
begin
  -- schema
  execute 'grant usage on schema auth to supabase_auth_admin, supabase_authenticator';
  -- tablas existentes
  execute 'grant select, insert, update, delete on all tables in schema auth to supabase_auth_admin';
  execute 'grant select on all tables in schema auth to supabase_authenticator';
  -- secuencias (por si las usa)
  execute 'grant usage, select, update on all sequences in schema auth to supabase_auth_admin';
  -- default privileges futuros
  execute 'alter default privileges in schema auth grant select, insert, update, delete on tables to supabase_auth_admin';
  execute 'alter default privileges in schema auth grant select on tables to supabase_authenticator';
exception when others then
  -- En supabase cloud casi siempre funciona; si no, continuamos sin romper la semilla.
  raise notice 'No se pudieron aplicar todos los GRANTs de auth: %', sqlerrm;
end$$;



-- (opcional pero útil) Permisos generales de esquema
grant usage on schema public  to anon, authenticated;
grant usage on schema storage to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- =========[ LISTO ]=========
-- Fin de semilla



//TODO: Actualizar semilla
-- 1.1) Nueva columna para archivo y fecha de finalización
alter table public.tickets
  add column if not exists is_archived boolean not null default false,
  add column if not exists finalized_at timestamp null;

-- 1.2) Trigger: setea finalized_at cuando pasa a "Finalizadas"
create or replace function public.set_finalized_at() 
returns trigger
language plpgsql
as $$
begin
  -- si pasa a Finalizadas y no tenía timestamp, lo marcamos
  if new.status = 'Finalizadas' and (old.status is distinct from new.status) then
    if new.finalized_at is null then
      new.finalized_at := now();
    end if;
  end if;

  -- si sale de Finalizadas, limpiamos finalized_at y forzamos unarchived
  if old.status = 'Finalizadas' and new.status <> 'Finalizadas' then
    new.finalized_at := null;
    new.is_archived := false;
  end if;

  return new;
end
$$;

drop trigger if exists trg_set_finalized_at on public.tickets;
create trigger trg_set_finalized_at
before update on public.tickets
for each row
when (old.status is distinct from new.status)
execute function public.set_finalized_at();

-- 1.3) JOB nocturno para archivar automáticamente a los 14 días
-- Requiere pg_cron (disponible en Supabase). Si no está:
create extension if not exists pg_cron;

-- Corre todos los días a las 03:00 AM GMT (ajusta si quieres)
select
  cron.schedule(
    'archive_finalized_tickets',
    '0 3 * * *',
    $sql$
      update public.tickets
         set is_archived = true
       where is_archived = false
         and status = 'Finalizadas'
         and coalesce(finalized_at, created_at) < now() - interval '14 days';
    $sql$
  );

-- 1.4) Índices que ayudan a tus listas y conteos
create index if not exists ix_tickets_status_archived_created
  on public.tickets (status, is_archived, created_at desc);

create index if not exists ix_tickets_accepted_archived_status_loc_assignee_created
  on public.tickets (is_accepted, is_archived, status, location, assignee_id, created_at desc);

ALTER TABLE public.users
  ALTER COLUMN created_at
  SET DEFAULT (now() AT TIME ZONE 'America/Santo_Domingo');


  SELECT
  id,
  created_at AS old_created_at,
  (created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Santo_Domingo' AS fixed_created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 50;

UPDATE public.users
SET created_at = (created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Santo_Domingo';
