create extension if not exists pgcrypto;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'worker-media',
  'worker-media',
  true,
  2097152,
  array[
    'image/avif',
    'image/webp',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  create policy "Worker media public read"
  on storage.objects
  for select
  using (bucket_id = 'worker-media');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'worker_role'
  ) then
    create type public.worker_role as enum (
      'Hair Stylist',
      'Barber',
      'Nail Technician',
      'Makeup Artist',
      'Spa Therapist',
      'Lash Technician',
      'Braider',
      'Wig Specialist'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'availability_status'
  ) then
    create type public.availability_status as enum (
      'available',
      'reserved',
      'hired'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'verification_status'
  ) then
    create type public.verification_status as enum (
      'pending',
      'verified',
      'rejected'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'work_type'
  ) then
    create type public.work_type as enum (
      'full-time',
      'part-time',
      'contract',
      'freelance'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'team_work_type'
  ) then
    create type public.team_work_type as enum (
      'long-term-contract',
      'short-term-contract'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'team_request_status'
  ) then
    create type public.team_request_status as enum (
      'new',
      'reviewing',
      'staffing',
      'completed'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'team_request_urgency'
  ) then
    create type public.team_request_urgency as enum (
      'standard',
      'priority',
      'urgent'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'document_status'
  ) then
    create type public.document_status as enum (
      'pending',
      'verified',
      'rejected'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'staffing_assignment_status'
  ) then
    create type public.staffing_assignment_status as enum (
      'recommended',
      'reserved',
      'hired',
      'released'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'booking_status'
  ) then
    create type public.booking_status as enum (
      'pending',
      'confirmed',
      'paid',
      'cancelled'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'admin_activity_type'
  ) then
    create type public.admin_activity_type as enum (
      'booking_confirmed',
      'worker_reserved',
      'payment_confirmed',
      'worker_released',
      'worker_status_updated'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'payment_status'
  ) then
    create type public.payment_status as enum (
      'not_due',
      'deposit_due',
      'deposit_paid',
      'paid'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'payment_verification_status'
  ) then
    create type public.payment_verification_status as enum (
      'not_submitted',
      'submitted',
      'verified',
      'rejected'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'hire_status'
  ) then
    create type public.hire_status as enum (
      'active',
      'completed'
    );
  end if;
end $$;

alter type public.worker_role add value if not exists 'Hair Stylist';
alter type public.worker_role add value if not exists 'Barber';
alter type public.worker_role add value if not exists 'Nail Technician';
alter type public.worker_role add value if not exists 'Makeup Artist';
alter type public.worker_role add value if not exists 'Spa Therapist';
alter type public.worker_role add value if not exists 'Lash Technician';
alter type public.worker_role add value if not exists 'Braider';
alter type public.worker_role add value if not exists 'Wig Specialist';

alter type public.availability_status add value if not exists 'available';
alter type public.availability_status add value if not exists 'reserved';
alter type public.availability_status add value if not exists 'hired';

alter type public.verification_status add value if not exists 'pending';
alter type public.verification_status add value if not exists 'verified';
alter type public.verification_status add value if not exists 'rejected';

alter type public.work_type add value if not exists 'full-time';
alter type public.work_type add value if not exists 'part-time';
alter type public.work_type add value if not exists 'contract';
alter type public.work_type add value if not exists 'freelance';

alter type public.team_work_type add value if not exists 'long-term-contract';
alter type public.team_work_type add value if not exists 'short-term-contract';

alter type public.team_request_status add value if not exists 'new';
alter type public.team_request_status add value if not exists 'reviewing';
alter type public.team_request_status add value if not exists 'staffing';
alter type public.team_request_status add value if not exists 'completed';

alter type public.team_request_urgency add value if not exists 'standard';
alter type public.team_request_urgency add value if not exists 'priority';
alter type public.team_request_urgency add value if not exists 'urgent';

alter type public.document_status add value if not exists 'pending';
alter type public.document_status add value if not exists 'verified';
alter type public.document_status add value if not exists 'rejected';

alter type public.staffing_assignment_status add value if not exists 'recommended';
alter type public.staffing_assignment_status add value if not exists 'reserved';
alter type public.staffing_assignment_status add value if not exists 'hired';
alter type public.staffing_assignment_status add value if not exists 'released';

alter type public.booking_status add value if not exists 'pending';
alter type public.booking_status add value if not exists 'confirmed';
alter type public.booking_status add value if not exists 'paid';
alter type public.booking_status add value if not exists 'cancelled';

alter type public.admin_activity_type add value if not exists 'booking_confirmed';
alter type public.admin_activity_type add value if not exists 'worker_reserved';
alter type public.admin_activity_type add value if not exists 'payment_confirmed';
alter type public.admin_activity_type add value if not exists 'worker_released';
alter type public.admin_activity_type add value if not exists 'worker_status_updated';

alter type public.payment_status add value if not exists 'not_due';
alter type public.payment_status add value if not exists 'deposit_due';
alter type public.payment_status add value if not exists 'deposit_paid';
alter type public.payment_status add value if not exists 'paid';

alter type public.payment_verification_status add value if not exists 'not_submitted';
alter type public.payment_verification_status add value if not exists 'submitted';
alter type public.payment_verification_status add value if not exists 'verified';
alter type public.payment_verification_status add value if not exists 'rejected';

alter type public.hire_status add value if not exists 'active';
alter type public.hire_status add value if not exists 'completed';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.workers (
  id text primary key,
  full_name text not null,
  id_number text not null default '',
  primary_role text not null,
  profile_photo text not null,
  location text not null,
  years_of_experience integer not null check (years_of_experience >= 0),
  bio text not null,
  availability_status public.availability_status not null default 'available',
  verification_status public.verification_status not null default 'pending',
  salary_expectation integer not null check (salary_expectation >= 0),
  work_type public.work_type not null default 'full-time',
  whatsapp_number text not null,
  headline text not null default '',
  featured boolean not null default false,
  listed_publicly boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workers
add column if not exists id_number text not null default '';

create table if not exists public.worker_references (
  id text primary key,
  worker_id text not null references public.workers(id) on delete cascade,
  contact_name text not null,
  contact_phone text not null,
  relationship text not null default '',
  previous_workplace text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id text primary key,
  name text not null unique,
  role text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.worker_roles (
  id text primary key,
  name text not null unique,
  description text not null default '',
  typical_team_use text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_specialties (
  id text primary key,
  role_id text not null references public.worker_roles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (role_id, name)
);

create table if not exists public.worker_skills (
  id text primary key,
  worker_id text not null references public.workers(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete cascade,
  proficiency_level text not null default 'core',
  created_at timestamptz not null default now(),
  unique (worker_id, skill_id)
);

create table if not exists public.portfolio_images (
  id text primary key,
  worker_id text not null references public.workers(id) on delete cascade,
  image_url text not null,
  caption text not null default '',
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.team_requests (
  id text primary key,
  salon_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_whatsapp text not null,
  location text not null,
  verified_only boolean not null default true,
  work_type public.team_work_type not null default 'long-term-contract',
  urgency public.team_request_urgency not null default 'priority',
  status public.team_request_status not null default 'new',
  notes text not null default '',
  target_start_date date not null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'team_requests'
      and column_name = 'work_type'
      and udt_schema = 'public'
      and udt_name = 'work_type'
  ) then
    alter table public.team_requests
    alter column work_type drop default;

    alter table public.team_requests
    alter column work_type type public.team_work_type
    using case
      when work_type::text in ('long-term-contract', 'short-term-contract') then work_type::text::public.team_work_type
      else 'long-term-contract'::public.team_work_type
    end;

    alter table public.team_requests
    alter column work_type set default 'long-term-contract'::public.team_work_type;
  end if;
end $$;

create table if not exists public.team_request_roles (
  id text primary key,
  team_request_id text not null references public.team_requests(id) on delete cascade,
  role text not null,
  quantity integer not null check (quantity > 0),
  min_experience integer not null default 0 check (min_experience >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.team_request_role_specialties (
  id text primary key,
  team_request_role_id text not null references public.team_request_roles(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete cascade,
  unique (team_request_role_id, skill_id)
);

create table if not exists public.bookings (
  id text primary key,
  tracking_token text not null unique,
  type text not null check (type in ('worker', 'team')),
  title text not null,
  status public.booking_status not null,
  payment_status public.payment_status not null default 'not_due',
  booking_date date not null,
  submitted_at timestamptz not null default now(),
  team_request_id text references public.team_requests(id) on delete set null,
  notes text not null default '',
  request_details jsonb not null default '{}'::jsonb,
  payment_instructions jsonb,
  updated_at timestamptz not null default now()
);

alter table public.bookings
add column if not exists tracking_token text;

alter table public.bookings
add column if not exists request_details jsonb not null default '{}'::jsonb;

update public.bookings
set tracking_token = replace(gen_random_uuid()::text, '-', '')
where tracking_token is null or tracking_token = '';

alter table public.bookings
alter column tracking_token set not null;

create table if not exists public.booking_workers (
  booking_id text not null references public.bookings(id) on delete cascade,
  worker_id text not null references public.workers(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (booking_id, worker_id)
);

create table if not exists public.payment_verifications (
  id text primary key,
  booking_id text not null references public.bookings(id) on delete cascade,
  status public.payment_verification_status not null default 'not_submitted',
  submitted_reference text,
  verified_by text,
  verified_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hires (
  id text primary key,
  booking_id text not null references public.bookings(id) on delete restrict,
  title text not null,
  status public.hire_status not null default 'active',
  payment_status public.payment_status not null default 'paid',
  hire_date date not null,
  payment_reference text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hire_workers (
  hire_id text not null references public.hires(id) on delete cascade,
  worker_id text not null references public.workers(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (hire_id, worker_id)
);

create table if not exists public.verification_documents (
  id text primary key,
  worker_id text not null references public.workers(id) on delete cascade,
  document_type text not null,
  status public.document_status not null default 'pending',
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.staffing_assignments (
  id text primary key,
  team_request_id text not null references public.team_requests(id) on delete cascade,
  team_request_role_id text references public.team_request_roles(id) on delete set null,
  worker_id text not null references public.workers(id) on delete cascade,
  status public.staffing_assignment_status not null default 'recommended',
  assigned_by text not null,
  assigned_at timestamptz not null default now(),
  notes text not null default ''
);

create table if not exists public.admin_email_whitelist (
  email text primary key,
  active boolean not null default true,
  added_by text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email = lower(trim(email))),
  check (position('@' in email) > 1)
);

create table if not exists public.admin_notes (
  id text primary key,
  worker_id text references public.workers(id) on delete cascade,
  team_request_id text references public.team_requests(id) on delete cascade,
  staffing_assignment_id text references public.staffing_assignments(id) on delete cascade,
  author text not null,
  note text not null,
  created_at timestamptz not null default now(),
  check (
    worker_id is not null or
    team_request_id is not null or
    staffing_assignment_id is not null
  )
);

create table if not exists public.admin_activity_logs (
  id text primary key,
  type public.admin_activity_type not null,
  actor text not null,
  message text not null,
  booking_id text references public.bookings(id) on delete set null,
  worker_id text references public.workers(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists workers_role_idx on public.workers (primary_role);
create index if not exists worker_roles_name_idx on public.worker_roles (name);
create index if not exists role_specialties_role_idx on public.role_specialties (role_id);
create index if not exists workers_location_idx on public.workers (location);
create index if not exists workers_availability_idx on public.workers (availability_status);
create index if not exists workers_verification_idx on public.workers (verification_status);
create index if not exists worker_references_worker_idx on public.worker_references (worker_id);
create index if not exists worker_skills_worker_idx on public.worker_skills (worker_id);
create index if not exists worker_skills_skill_idx on public.worker_skills (skill_id);
create index if not exists portfolio_images_worker_idx on public.portfolio_images (worker_id);
create index if not exists team_requests_status_idx on public.team_requests (status);
create index if not exists team_requests_urgency_idx on public.team_requests (urgency);
create index if not exists team_request_roles_request_idx on public.team_request_roles (team_request_id);
create index if not exists team_request_role_specialties_role_idx on public.team_request_role_specialties (team_request_role_id);
create index if not exists bookings_status_idx on public.bookings (status);
create unique index if not exists bookings_tracking_token_idx on public.bookings (tracking_token);
create index if not exists bookings_payment_status_idx on public.bookings (payment_status);
create index if not exists bookings_team_request_idx on public.bookings (team_request_id);
create index if not exists booking_workers_worker_idx on public.booking_workers (worker_id);
create index if not exists payment_verifications_booking_idx on public.payment_verifications (booking_id);
create index if not exists payment_verifications_status_idx on public.payment_verifications (status);
create index if not exists hires_booking_idx on public.hires (booking_id);
create index if not exists hires_status_idx on public.hires (status);
create index if not exists hire_workers_worker_idx on public.hire_workers (worker_id);
create index if not exists verification_documents_worker_idx on public.verification_documents (worker_id);
create index if not exists staffing_assignments_request_idx on public.staffing_assignments (team_request_id);
create index if not exists staffing_assignments_worker_idx on public.staffing_assignments (worker_id);
create index if not exists admin_email_whitelist_active_idx on public.admin_email_whitelist (active);
create index if not exists admin_notes_worker_idx on public.admin_notes (worker_id);
create index if not exists admin_notes_team_request_idx on public.admin_notes (team_request_id);
create index if not exists admin_notes_assignment_idx on public.admin_notes (staffing_assignment_id);
create index if not exists admin_activity_logs_booking_idx on public.admin_activity_logs (booking_id);
create index if not exists admin_activity_logs_worker_idx on public.admin_activity_logs (worker_id);
create index if not exists admin_activity_logs_created_idx on public.admin_activity_logs (created_at);

create unique index if not exists staffing_assignments_active_worker_idx
on public.staffing_assignments (worker_id)
where status in (
  'reserved'::public.staffing_assignment_status,
  'hired'::public.staffing_assignment_status
);

drop trigger if exists workers_set_updated_at on public.workers;
create trigger workers_set_updated_at
before update on public.workers
for each row
execute function public.set_updated_at();

drop trigger if exists worker_roles_set_updated_at on public.worker_roles;
create trigger worker_roles_set_updated_at
before update on public.worker_roles
for each row
execute function public.set_updated_at();

drop trigger if exists team_requests_set_updated_at on public.team_requests;
create trigger team_requests_set_updated_at
before update on public.team_requests
for each row
execute function public.set_updated_at();

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();

drop trigger if exists payment_verifications_set_updated_at on public.payment_verifications;
create trigger payment_verifications_set_updated_at
before update on public.payment_verifications
for each row
execute function public.set_updated_at();

drop trigger if exists hires_set_updated_at on public.hires;
create trigger hires_set_updated_at
before update on public.hires
for each row
execute function public.set_updated_at();

drop trigger if exists admin_email_whitelist_set_updated_at on public.admin_email_whitelist;
create trigger admin_email_whitelist_set_updated_at
before update on public.admin_email_whitelist
for each row
execute function public.set_updated_at();
