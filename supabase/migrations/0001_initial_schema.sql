-- ============================================================================
-- Site Log — initial schema (see SPEC.md §2 for the data model)
-- Run with `supabase db push`, or paste into the Supabase SQL editor.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type public.rfi_status as enum ('open', 'in_review', 'answered', 'closed');
create type public.submittal_status as enum ('open', 'in_review', 'approved', 'rejected');
create type public.change_order_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected');
create type public.activity_entity_type as enum ('rfi', 'submittal', 'change_order');

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  general_contractor text,
  pm_name text,
  created_at timestamptz not null default now()
);

create table public.rfis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  rfi_number text not null,
  description text not null,
  discipline text,
  assigned_to text,
  date_submitted date not null default current_date,
  due_date date not null,
  date_answered date,
  status public.rfi_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, rfi_number)
);
create index rfis_project_status_idx on public.rfis (project_id, status);

create table public.submittals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  submittal_number text not null,
  item text not null,
  supplier text,
  review_step int not null default 1,
  review_steps_total int not null default 3,
  due_date date not null,
  status public.submittal_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, submittal_number),
  check (review_step >= 0 and review_step <= review_steps_total)
);
create index submittals_project_status_idx on public.submittals (project_id, status);

create table public.change_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  pco_number text not null,
  description text not null,
  estimated_cost numeric(14, 2),
  status public.change_order_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, pco_number)
);
create index change_orders_project_status_idx on public.change_orders (project_id, status);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  entity_type public.activity_entity_type not null,
  entity_id uuid not null,
  entity_label text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index activity_log_project_created_idx on public.activity_log (project_id, created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger rfis_set_updated_at
  before update on public.rfis
  for each row execute function public.set_updated_at();

create trigger submittals_set_updated_at
  before update on public.submittals
  for each row execute function public.set_updated_at();

create trigger change_orders_set_updated_at
  before update on public.change_orders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-numbering (SPEC.md §4): the next per-project number is assigned on
-- insert whenever the client does not provide one. An advisory lock keyed on
-- (table, project) serializes concurrent inserts so numbers never collide.
-- RFIs start at RFI-101 on an empty project; submittals/PCOs at 001.
-- ----------------------------------------------------------------------------
create or replace function public.assign_rfi_number() returns trigger
language plpgsql as $$
declare
  next_num integer;
begin
  if new.rfi_number is null or btrim(new.rfi_number) = '' then
    perform pg_advisory_xact_lock(hashtextextended('rfis:' || new.project_id::text, 0));
    select coalesce(max(nullif(regexp_replace(rfi_number, '\D', '', 'g'), '')::integer), 100)
      into next_num
      from public.rfis
     where project_id = new.project_id;
    new.rfi_number := 'RFI-' || (next_num + 1)::text;
  end if;
  return new;
end;
$$;

create trigger rfis_assign_number
  before insert on public.rfis
  for each row execute function public.assign_rfi_number();

create or replace function public.assign_submittal_number() returns trigger
language plpgsql as $$
declare
  next_num integer;
begin
  if new.submittal_number is null or btrim(new.submittal_number) = '' then
    perform pg_advisory_xact_lock(hashtextextended('submittals:' || new.project_id::text, 0));
    select coalesce(max(nullif(regexp_replace(submittal_number, '\D', '', 'g'), '')::integer), 0)
      into next_num
      from public.submittals
     where project_id = new.project_id;
    new.submittal_number := 'SUB-' || lpad((next_num + 1)::text, 3, '0');
  end if;
  return new;
end;
$$;

create trigger submittals_assign_number
  before insert on public.submittals
  for each row execute function public.assign_submittal_number();

create or replace function public.assign_pco_number() returns trigger
language plpgsql as $$
declare
  next_num integer;
begin
  if new.pco_number is null or btrim(new.pco_number) = '' then
    perform pg_advisory_xact_lock(hashtextextended('change_orders:' || new.project_id::text, 0));
    select coalesce(max(nullif(regexp_replace(pco_number, '\D', '', 'g'), '')::integer), 0)
      into next_num
      from public.change_orders
     where project_id = new.project_id;
    new.pco_number := 'PCO-' || lpad((next_num + 1)::text, 3, '0');
  end if;
  return new;
end;
$$;

create trigger change_orders_assign_number
  before insert on public.change_orders
  for each row execute function public.assign_pco_number();

-- ----------------------------------------------------------------------------
-- Activity log (SPEC.md §2): every create/update on the three entities writes
-- a row to activity_log, which powers the "Recent Activity" panel with no
-- extra client logic.
-- ----------------------------------------------------------------------------
create or replace function public.log_rfi_activity() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_log (project_id, entity_type, entity_id, entity_label, message)
    values (new.project_id, 'rfi', new.id, new.rfi_number, 'created');
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into public.activity_log (project_id, entity_type, entity_id, entity_label, message)
      values (new.project_id, 'rfi', new.id, new.rfi_number,
              'status changed to ' || replace(new.status::text, '_', ' '));
    else
      insert into public.activity_log (project_id, entity_type, entity_id, entity_label, message)
      values (new.project_id, 'rfi', new.id, new.rfi_number, 'details updated');
    end if;
  end if;
  return null;
end;
$$;

create trigger rfis_log_activity
  after insert or update on public.rfis
  for each row execute function public.log_rfi_activity();

create or replace function public.log_submittal_activity() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_log (project_id, entity_type, entity_id, entity_label, message)
    values (new.project_id, 'submittal', new.id, new.submittal_number, 'created');
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into public.activity_log (project_id, entity_type, entity_id, entity_label, message)
      values (new.project_id, 'submittal', new.id, new.submittal_number,
              'status changed to ' || replace(new.status::text, '_', ' '));
    else
      insert into public.activity_log (project_id, entity_type, entity_id, entity_label, message)
      values (new.project_id, 'submittal', new.id, new.submittal_number, 'details updated');
    end if;
  end if;
  return null;
end;
$$;

create trigger submittals_log_activity
  after insert or update on public.submittals
  for each row execute function public.log_submittal_activity();

create or replace function public.log_change_order_activity() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_log (project_id, entity_type, entity_id, entity_label, message)
    values (new.project_id, 'change_order', new.id, new.pco_number, 'created');
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into public.activity_log (project_id, entity_type, entity_id, entity_label, message)
      values (new.project_id, 'change_order', new.id, new.pco_number,
              'status changed to ' || replace(new.status::text, '_', ' '));
    else
      insert into public.activity_log (project_id, entity_type, entity_id, entity_label, message)
      values (new.project_id, 'change_order', new.id, new.pco_number, 'details updated');
    end if;
  end if;
  return null;
end;
$$;

create trigger change_orders_log_activity
  after insert or update on public.change_orders
  for each row execute function public.log_change_order_activity();

-- ----------------------------------------------------------------------------
-- Row Level Security — the MVP has no auth (SPEC.md §5), so policies are
-- deliberately permissive for the anon key. Tighten before any real
-- multi-user deployment.
-- ----------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.rfis enable row level security;
alter table public.submittals enable row level security;
alter table public.change_orders enable row level security;
alter table public.activity_log enable row level security;

create policy "mvp full access" on public.projects
  for all to anon, authenticated using (true) with check (true);
create policy "mvp full access" on public.rfis
  for all to anon, authenticated using (true) with check (true);
create policy "mvp full access" on public.submittals
  for all to anon, authenticated using (true) with check (true);
create policy "mvp full access" on public.change_orders
  for all to anon, authenticated using (true) with check (true);
create policy "mvp full access" on public.activity_log
  for all to anon, authenticated using (true) with check (true);
