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
      'payment_pending',
      'paid',
      'expired',
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
alter type public.booking_status add value if not exists 'payment_pending';
alter type public.booking_status add value if not exists 'paid';
alter type public.booking_status add value if not exists 'expired';
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
  experience_months integer not null default 0 check (experience_months >= 0),
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

alter table public.workers
add column if not exists experience_months integer not null default 0 check (experience_months >= 0);

update public.workers
set experience_months = greatest(years_of_experience, 0) * 12
where experience_months = 0
  and years_of_experience > 0;

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
  user_id uuid references auth.users(id) on delete set null,
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

alter table public.team_requests
add column if not exists user_id uuid references auth.users(id) on delete set null;

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
  min_experience_months integer not null default 0 check (min_experience_months >= 0),
  created_at timestamptz not null default now()
);

alter table public.team_request_roles
add column if not exists min_experience_months integer not null default 0 check (min_experience_months >= 0);

update public.team_request_roles
set min_experience_months = greatest(min_experience, 0) * 12
where min_experience_months = 0
  and min_experience > 0;

create table if not exists public.team_request_role_specialties (
  id text primary key,
  team_request_role_id text not null references public.team_request_roles(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete cascade,
  unique (team_request_role_id, skill_id)
);

create table if not exists public.bookings (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
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
  payment_lock_id text,
  payment_started_at timestamptz,
  payment_lock_expires_at timestamptz,
  payment_completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.bookings
add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.bookings
add column if not exists tracking_token text;

alter table public.bookings
add column if not exists request_details jsonb not null default '{}'::jsonb;

alter table public.bookings
add column if not exists payment_lock_id text;

alter table public.bookings
add column if not exists payment_started_at timestamptz;

alter table public.bookings
add column if not exists payment_lock_expires_at timestamptz;

alter table public.bookings
add column if not exists payment_completed_at timestamptz;

update public.bookings
set tracking_token = replace(gen_random_uuid()::text, '-', '')
where tracking_token is null or tracking_token = '';

alter table public.bookings
alter column tracking_token set not null;

create table if not exists public.booking_workers (
  booking_id text not null references public.bookings(id) on delete cascade,
  worker_id text not null references public.workers(id) on delete restrict,
  compensation_type text not null default 'monthly',
  salary_expectation text not null default '',
  commission_percentage numeric(5,2),
  created_at timestamptz not null default now(),
  primary key (booking_id, worker_id)
);

alter table public.booking_workers
add column if not exists compensation_type text not null default 'monthly';

alter table public.booking_workers
add column if not exists salary_expectation text not null default '';

alter table public.booking_workers
add column if not exists commission_percentage numeric(5,2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_workers_compensation_type_check'
      and conrelid = 'public.booking_workers'::regclass
  ) then
    alter table public.booking_workers
    add constraint booking_workers_compensation_type_check
    check (compensation_type in ('monthly', 'commission'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_workers_commission_percentage_check'
      and conrelid = 'public.booking_workers'::regclass
  ) then
    alter table public.booking_workers
    add constraint booking_workers_commission_percentage_check
    check (
      commission_percentage is null or
      (commission_percentage >= 0 and commission_percentage <= 100)
    );
  end if;
end $$;

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

create table if not exists public.mpesa_payments (
  id text primary key,
  booking_id text not null references public.bookings(id) on delete cascade,
  payment_lock_id text not null,
  merchant_request_id text,
  checkout_request_id text unique,
  phone_number text not null,
  amount integer not null check (amount > 0),
  account_reference text not null,
  transaction_desc text not null,
  status text not null default 'initiated' check (
    status in (
      'initiated',
      'pending',
      'succeeded',
      'failed',
      'init_failed',
      'callback_error'
    )
  ),
  result_code integer,
  result_description text,
  mpesa_receipt_number text unique,
  transaction_date text,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb,
  callback_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mpesa_payments
add column if not exists payment_lock_id text not null default '';

alter table public.mpesa_payments
add column if not exists merchant_request_id text;

alter table public.mpesa_payments
add column if not exists checkout_request_id text;

alter table public.mpesa_payments
add column if not exists phone_number text not null default '';

alter table public.mpesa_payments
add column if not exists amount integer not null default 1;

alter table public.mpesa_payments
add column if not exists account_reference text not null default '';

alter table public.mpesa_payments
add column if not exists transaction_desc text not null default '';

alter table public.mpesa_payments
add column if not exists status text not null default 'initiated';

alter table public.mpesa_payments
add column if not exists result_code integer;

alter table public.mpesa_payments
add column if not exists result_description text;

alter table public.mpesa_payments
add column if not exists mpesa_receipt_number text;

alter table public.mpesa_payments
add column if not exists transaction_date text;

alter table public.mpesa_payments
add column if not exists request_payload jsonb not null default '{}'::jsonb;

alter table public.mpesa_payments
add column if not exists response_payload jsonb;

alter table public.mpesa_payments
add column if not exists callback_payload jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mpesa_payments_amount_check'
      and conrelid = 'public.mpesa_payments'::regclass
  ) then
    alter table public.mpesa_payments
    add constraint mpesa_payments_amount_check
    check (amount > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'mpesa_payments_status_check'
      and conrelid = 'public.mpesa_payments'::regclass
  ) then
    alter table public.mpesa_payments
    add constraint mpesa_payments_status_check
    check (
      status in (
        'initiated',
        'pending',
        'succeeded',
        'failed',
        'init_failed',
        'callback_error'
      )
    );
  end if;
end $$;

create unique index if not exists mpesa_payments_checkout_request_unique
on public.mpesa_payments (checkout_request_id)
where checkout_request_id is not null;

create unique index if not exists mpesa_payments_receipt_unique
on public.mpesa_payments (mpesa_receipt_number)
where mpesa_receipt_number is not null;

create unique index if not exists mpesa_payments_one_success_per_booking
on public.mpesa_payments (booking_id)
where status = 'succeeded';

create table if not exists public.hires (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  booking_id text not null references public.bookings(id) on delete restrict,
  title text not null,
  status public.hire_status not null default 'active',
  payment_status public.payment_status not null default 'paid',
  hire_date date not null,
  payment_reference text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hires
add column if not exists user_id uuid references auth.users(id) on delete set null;

update public.hires hire
set user_id = booking.user_id
from public.bookings booking
where hire.booking_id = booking.id
  and hire.user_id is null
  and booking.user_id is not null;

create or replace function public.set_hire_user_id_from_booking()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null then
    select user_id
    into new.user_id
    from public.bookings
    where id = new.booking_id;
  end if;

  return new;
end;
$$;

create table if not exists public.hire_workers (
  hire_id text not null references public.hires(id) on delete cascade,
  worker_id text not null references public.workers(id) on delete restrict,
  compensation_type text not null default 'monthly',
  salary_expectation text not null default '',
  commission_percentage numeric(5,2),
  created_at timestamptz not null default now(),
  primary key (hire_id, worker_id)
);

alter table public.hire_workers
add column if not exists compensation_type text not null default 'monthly';

alter table public.hire_workers
add column if not exists salary_expectation text not null default '';

alter table public.hire_workers
add column if not exists commission_percentage numeric(5,2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hire_workers_compensation_type_check'
      and conrelid = 'public.hire_workers'::regclass
  ) then
    alter table public.hire_workers
    add constraint hire_workers_compensation_type_check
    check (compensation_type in ('monthly', 'commission'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'hire_workers_commission_percentage_check'
      and conrelid = 'public.hire_workers'::regclass
  ) then
    alter table public.hire_workers
    add constraint hire_workers_commission_percentage_check
    check (
      commission_percentage is null or
      (commission_percentage >= 0 and commission_percentage <= 100)
    );
  end if;
end $$;

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

create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.admin_settings (key, value)
values ('max_active_bookings_per_worker', '1'::jsonb)
on conflict (key) do nothing;

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
create index if not exists team_requests_user_idx on public.team_requests (user_id);
create index if not exists team_requests_urgency_idx on public.team_requests (urgency);
create index if not exists team_request_roles_request_idx on public.team_request_roles (team_request_id);
create index if not exists team_request_role_specialties_role_idx on public.team_request_role_specialties (team_request_role_id);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_user_idx on public.bookings (user_id);
create unique index if not exists bookings_tracking_token_idx on public.bookings (tracking_token);
create index if not exists bookings_payment_status_idx on public.bookings (payment_status);
create index if not exists bookings_payment_lock_expires_idx on public.bookings (payment_lock_expires_at);
create index if not exists bookings_team_request_idx on public.bookings (team_request_id);
create index if not exists booking_workers_worker_idx on public.booking_workers (worker_id);
create index if not exists payment_verifications_booking_idx on public.payment_verifications (booking_id);
create index if not exists payment_verifications_status_idx on public.payment_verifications (status);
create index if not exists mpesa_payments_booking_idx on public.mpesa_payments (booking_id);
create index if not exists mpesa_payments_status_idx on public.mpesa_payments (status);
create index if not exists mpesa_payments_lock_idx on public.mpesa_payments (payment_lock_id);
create index if not exists hires_booking_idx on public.hires (booking_id);
create index if not exists hires_user_idx on public.hires (user_id);
create index if not exists hires_status_idx on public.hires (status);
create index if not exists hire_workers_worker_idx on public.hire_workers (worker_id);
create index if not exists verification_documents_worker_idx on public.verification_documents (worker_id);
create index if not exists staffing_assignments_request_idx on public.staffing_assignments (team_request_id);
create index if not exists staffing_assignments_worker_idx on public.staffing_assignments (worker_id);
create index if not exists admin_email_whitelist_active_idx on public.admin_email_whitelist (active);
create index if not exists admin_settings_updated_idx on public.admin_settings (updated_at);
create index if not exists admin_notes_worker_idx on public.admin_notes (worker_id);
create index if not exists admin_notes_team_request_idx on public.admin_notes (team_request_id);
create index if not exists admin_notes_assignment_idx on public.admin_notes (staffing_assignment_id);
create index if not exists admin_activity_logs_booking_idx on public.admin_activity_logs (booking_id);
create index if not exists admin_activity_logs_worker_idx on public.admin_activity_logs (worker_id);
create index if not exists admin_activity_logs_created_idx on public.admin_activity_logs (created_at);

drop index if exists public.staffing_assignments_active_worker_idx;

create or replace function public.max_active_bookings_per_worker()
returns integer
language sql
stable
as $$
  select greatest(
    coalesce(
      (
        select case
          when jsonb_typeof(value) = 'number' then (value #>> '{}')::integer
          when jsonb_typeof(value) = 'object' then nullif(value->>'limit', '')::integer
          else null
        end
        from public.admin_settings
        where key = 'max_active_bookings_per_worker'
      ),
      1
    ),
    1
  );
$$;

create or replace function public.enforce_booking_worker_rules()
returns trigger
language plpgsql
as $$
declare
  target_booking public.bookings%rowtype;
  active_count integer;
  capacity_limit integer;
begin
  select *
  into target_booking
  from public.bookings
  where id = new.booking_id;

  if not found or target_booking.status not in (
    'pending'::public.booking_status,
    'confirmed'::public.booking_status,
    'payment_pending'::public.booking_status,
    'paid'::public.booking_status
  ) then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.worker_id));

  if target_booking.type = 'worker'
    and target_booking.user_id is not null
    and exists (
      select 1
      from public.booking_workers existing_worker
      join public.bookings existing_booking
        on existing_booking.id = existing_worker.booking_id
      where existing_worker.worker_id = new.worker_id
        and existing_worker.booking_id <> new.booking_id
        and existing_booking.user_id = target_booking.user_id
        and existing_booking.type = 'worker'
        and existing_booking.status in (
          'pending'::public.booking_status,
          'confirmed'::public.booking_status,
          'payment_pending'::public.booking_status,
          'paid'::public.booking_status
        )
    )
  then
    raise exception 'You already requested this worker.';
  end if;

  capacity_limit := public.max_active_bookings_per_worker();

  select count(*)
  into active_count
  from public.booking_workers existing_worker
  join public.bookings existing_booking
    on existing_booking.id = existing_worker.booking_id
  where existing_worker.worker_id = new.worker_id
    and existing_worker.booking_id <> new.booking_id
    and existing_booking.status in (
      'payment_pending'::public.booking_status,
      'paid'::public.booking_status
    )
    and (
      existing_booking.status = 'paid'::public.booking_status or
      existing_booking.payment_lock_expires_at > now()
    );

  if active_count >= capacity_limit then
    raise exception 'Worker has reached the active booking capacity limit.';
  end if;

  return new;
end;
$$;

create or replace function public.expire_stale_payment_locks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_booking record;
  expired_count integer := 0;
begin
  for expired_booking in
    select id
    from public.bookings
    where status = 'payment_pending'::public.booking_status
      and payment_lock_expires_at is not null
      and payment_lock_expires_at <= now()
  loop
    perform pg_advisory_xact_lock(hashtext(expired_booking.id));

    update public.workers worker
    set availability_status = 'available'::public.availability_status
    where worker.id in (
      select booking_worker.worker_id
      from public.booking_workers booking_worker
      where booking_worker.booking_id = expired_booking.id
    )
      and worker.availability_status = 'reserved'::public.availability_status
      and not exists (
        select 1
        from public.booking_workers other_booking_worker
        join public.bookings other_booking
          on other_booking.id = other_booking_worker.booking_id
        where other_booking_worker.worker_id = worker.id
          and other_booking_worker.booking_id <> expired_booking.id
          and (
            other_booking.status = 'paid'::public.booking_status or
            (
              other_booking.status = 'payment_pending'::public.booking_status
              and other_booking.payment_lock_expires_at > now()
            )
          )
      );

    update public.bookings
    set
      status = 'confirmed'::public.booking_status,
      payment_lock_id = null,
      payment_started_at = null,
      payment_lock_expires_at = null,
      updated_at = now()
    where id = expired_booking.id
      and status = 'payment_pending'::public.booking_status
      and payment_lock_expires_at <= now();

    if found then
      expired_count := expired_count + 1;
    end if;
  end loop;

  return expired_count;
end;
$$;

create or replace function public.release_booking_payment_lock(
  target_booking_id text,
  target_lock_id text default null,
  target_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_booking public.bookings%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext(target_booking_id));

  select *
  into target_booking
  from public.bookings
  where id = target_booking_id
  for update;

  if not found then
    return jsonb_build_object('released', false, 'reason', 'booking_not_found');
  end if;

  if target_booking.status <> 'payment_pending'::public.booking_status then
    return jsonb_build_object(
      'released', false,
      'booking_id', target_booking.id,
      'status', target_booking.status,
      'reason', 'not_payment_pending'
    );
  end if;

  if target_lock_id is not null
    and target_booking.payment_lock_id is distinct from target_lock_id
  then
    return jsonb_build_object(
      'released', false,
      'booking_id', target_booking.id,
      'status', target_booking.status,
      'reason', 'lock_mismatch'
    );
  end if;

  update public.workers worker
  set availability_status = 'available'::public.availability_status
  where worker.id in (
    select booking_worker.worker_id
    from public.booking_workers booking_worker
    where booking_worker.booking_id = target_booking.id
  )
    and worker.availability_status = 'reserved'::public.availability_status
    and not exists (
      select 1
      from public.booking_workers other_booking_worker
      join public.bookings other_booking
        on other_booking.id = other_booking_worker.booking_id
      where other_booking_worker.worker_id = worker.id
        and other_booking_worker.booking_id <> target_booking.id
        and (
          other_booking.status = 'paid'::public.booking_status or
          (
            other_booking.status = 'payment_pending'::public.booking_status
            and other_booking.payment_lock_expires_at > now()
          )
        )
    );

  update public.bookings
  set
    status = 'confirmed'::public.booking_status,
    payment_status = 'deposit_due'::public.payment_status,
    payment_lock_id = null,
    payment_started_at = null,
    payment_lock_expires_at = null,
    updated_at = now()
  where id = target_booking.id;

  return jsonb_build_object(
    'released', true,
    'booking_id', target_booking.id,
    'status', 'confirmed',
    'reason', target_reason
  );
end;
$$;

create or replace function public.process_mpesa_stk_callback(
  target_checkout_request_id text,
  target_result_code integer,
  target_result_description text,
  target_mpesa_receipt_number text,
  target_transaction_date text,
  target_amount numeric,
  target_callback_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_payment public.mpesa_payments%rowtype;
  target_booking public.bookings%rowtype;
  target_hire_id text;
  existing_receipt_payment_id text;
  amount_is_valid boolean := true;
begin
  if target_checkout_request_id is null or trim(target_checkout_request_id) = '' then
    raise exception 'CheckoutRequestID is required.';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_checkout_request_id));

  select *
  into target_payment
  from public.mpesa_payments
  where checkout_request_id = target_checkout_request_id
  for update;

  if not found then
    raise exception 'M-Pesa payment not found.';
  end if;

  if target_payment.status = 'succeeded' then
    return jsonb_build_object(
      'processed', false,
      'already_processed', true,
      'status', target_payment.status,
      'booking_id', target_payment.booking_id
    );
  end if;

  perform pg_advisory_xact_lock(hashtext(target_payment.booking_id));

  if target_result_code is distinct from 0 then
    update public.mpesa_payments
    set
      status = 'failed',
      result_code = target_result_code,
      result_description = target_result_description,
      callback_payload = target_callback_payload,
      updated_at = now()
    where id = target_payment.id;

    if exists (
      select 1
      from public.bookings booking
      where booking.id = target_payment.booking_id
        and booking.status = 'paid'::public.booking_status
    ) or exists (
      select 1
      from public.mpesa_payments other_payment
      where other_payment.booking_id = target_payment.booking_id
        and other_payment.id <> target_payment.id
        and other_payment.status = 'succeeded'
    ) then
      return jsonb_build_object(
        'processed', true,
        'status', 'failed',
        'booking_id', target_payment.booking_id,
        'ignored_after_paid', true,
        'result_code', target_result_code
      );
    end if;

    insert into public.payment_verifications (
      id,
      booking_id,
      status,
      submitted_reference,
      verified_by,
      verified_at,
      notes
    )
    values (
      'verification-' || target_payment.booking_id,
      target_payment.booking_id,
      'rejected'::public.payment_verification_status,
      target_payment.checkout_request_id,
      'Daraja',
      now(),
      coalesce(target_result_description, 'M-Pesa payment failed or expired.')
    )
    on conflict (id) do update
    set
      status = excluded.status,
      submitted_reference = excluded.submitted_reference,
      verified_by = excluded.verified_by,
      verified_at = excluded.verified_at,
      notes = excluded.notes,
      updated_at = now();

    perform public.release_booking_payment_lock(
      target_payment.booking_id,
      target_payment.payment_lock_id,
      target_result_description
    );

    return jsonb_build_object(
      'processed', true,
      'status', 'failed',
      'booking_id', target_payment.booking_id,
      'result_code', target_result_code
    );
  end if;

  if target_mpesa_receipt_number is null or trim(target_mpesa_receipt_number) = '' then
    update public.mpesa_payments
    set
      status = 'callback_error',
      result_code = target_result_code,
      result_description = coalesce(target_result_description, 'Successful callback missing M-Pesa receipt.'),
      callback_payload = target_callback_payload,
      updated_at = now()
    where id = target_payment.id;

    perform public.release_booking_payment_lock(
      target_payment.booking_id,
      target_payment.payment_lock_id,
      'Successful M-Pesa callback missing receipt.'
    );

    return jsonb_build_object(
      'processed', false,
      'status', 'callback_error',
      'booking_id', target_payment.booking_id,
      'reason', 'missing_receipt'
    );
  end if;

  if target_amount is not null and target_amount < target_payment.amount then
    amount_is_valid := false;
  end if;

  if not amount_is_valid then
    update public.mpesa_payments
    set
      status = 'callback_error',
      result_code = target_result_code,
      result_description = 'M-Pesa amount is lower than expected platform fee.',
      callback_payload = target_callback_payload,
      updated_at = now()
    where id = target_payment.id;

    if exists (
      select 1
      from public.bookings booking
      where booking.id = target_payment.booking_id
        and booking.status = 'paid'::public.booking_status
    ) or exists (
      select 1
      from public.mpesa_payments other_payment
      where other_payment.booking_id = target_payment.booking_id
        and other_payment.id <> target_payment.id
        and other_payment.status = 'succeeded'
    ) then
      return jsonb_build_object(
        'processed', false,
        'status', 'callback_error',
        'booking_id', target_payment.booking_id,
        'reason', 'amount_mismatch_after_paid'
      );
    end if;

    insert into public.payment_verifications (
      id,
      booking_id,
      status,
      submitted_reference,
      verified_by,
      verified_at,
      notes
    )
    values (
      'verification-' || target_payment.booking_id,
      target_payment.booking_id,
      'rejected'::public.payment_verification_status,
      target_mpesa_receipt_number,
      'Daraja',
      now(),
      'M-Pesa amount is lower than expected platform fee.'
    )
    on conflict (id) do update
    set
      status = excluded.status,
      submitted_reference = excluded.submitted_reference,
      verified_by = excluded.verified_by,
      verified_at = excluded.verified_at,
      notes = excluded.notes,
      updated_at = now();

    perform public.release_booking_payment_lock(
      target_payment.booking_id,
      target_payment.payment_lock_id,
      'M-Pesa amount is lower than expected platform fee.'
    );

    return jsonb_build_object(
      'processed', false,
      'status', 'callback_error',
      'booking_id', target_payment.booking_id,
      'reason', 'amount_mismatch'
    );
  end if;

  select id
  into existing_receipt_payment_id
  from public.mpesa_payments
  where mpesa_receipt_number = target_mpesa_receipt_number
    and id <> target_payment.id
    and status = 'succeeded'
  limit 1;

  if existing_receipt_payment_id is not null then
    update public.mpesa_payments
    set
      status = 'callback_error',
      result_code = target_result_code,
      result_description = 'Duplicate M-Pesa receipt received.',
      callback_payload = target_callback_payload,
      updated_at = now()
    where id = target_payment.id;

    perform public.release_booking_payment_lock(
      target_payment.booking_id,
      target_payment.payment_lock_id,
      'Duplicate M-Pesa receipt received.'
    );

    return jsonb_build_object(
      'processed', false,
      'status', 'callback_error',
      'booking_id', target_payment.booking_id,
      'reason', 'duplicate_receipt'
    );
  end if;

  select *
  into target_booking
  from public.bookings
  where id = target_payment.booking_id
  for update;

  if not found then
    raise exception 'Booking not found for payment.';
  end if;

  select id
  into existing_receipt_payment_id
  from public.mpesa_payments
  where booking_id = target_payment.booking_id
    and id <> target_payment.id
    and status = 'succeeded'
  limit 1;

  if existing_receipt_payment_id is not null
    or target_booking.status = 'paid'::public.booking_status
  then
    update public.mpesa_payments
    set
      status = 'callback_error',
      result_code = target_result_code,
      result_description = 'Booking already has a successful M-Pesa payment.',
      mpesa_receipt_number = target_mpesa_receipt_number,
      transaction_date = target_transaction_date,
      callback_payload = target_callback_payload,
      updated_at = now()
    where id = target_payment.id;

    return jsonb_build_object(
      'processed', false,
      'status', 'callback_error',
      'booking_id', target_payment.booking_id,
      'reason', 'booking_already_paid'
    );
  end if;

  update public.mpesa_payments
  set
    status = 'succeeded',
    result_code = target_result_code,
    result_description = target_result_description,
    mpesa_receipt_number = target_mpesa_receipt_number,
    transaction_date = target_transaction_date,
    callback_payload = target_callback_payload,
    updated_at = now()
  where id = target_payment.id;

  update public.bookings
  set
    status = 'paid'::public.booking_status,
    payment_status = 'deposit_paid'::public.payment_status,
    payment_lock_id = null,
    payment_started_at = null,
    payment_lock_expires_at = null,
    payment_completed_at = now(),
    updated_at = now()
  where id = target_booking.id;

  update public.workers
  set
    availability_status = 'hired'::public.availability_status,
    listed_publicly = false
  where id in (
    select booking_worker.worker_id
    from public.booking_workers booking_worker
    where booking_worker.booking_id = target_booking.id
  );

  target_hire_id := 'hire-' || target_booking.id;

  insert into public.hires (
    id,
    user_id,
    booking_id,
    title,
    status,
    payment_status,
    hire_date,
    payment_reference
  )
  values (
    target_hire_id,
    target_booking.user_id,
    target_booking.id,
    target_booking.title || ' hire',
    'active'::public.hire_status,
    'paid'::public.payment_status,
    target_booking.booking_date,
    target_mpesa_receipt_number
  )
  on conflict (id) do update
  set
    user_id = excluded.user_id,
    title = excluded.title,
    status = excluded.status,
    payment_status = excluded.payment_status,
    hire_date = excluded.hire_date,
    payment_reference = excluded.payment_reference,
    updated_at = now();

  insert into public.hire_workers (
    hire_id,
    worker_id,
    compensation_type,
    salary_expectation,
    commission_percentage
  )
  select
    target_hire_id,
    booking_worker.worker_id,
    booking_worker.compensation_type,
    booking_worker.salary_expectation,
    booking_worker.commission_percentage
  from public.booking_workers booking_worker
  where booking_worker.booking_id = target_booking.id
  on conflict (hire_id, worker_id) do update
  set
    compensation_type = excluded.compensation_type,
    salary_expectation = excluded.salary_expectation,
    commission_percentage = excluded.commission_percentage;

  insert into public.payment_verifications (
    id,
    booking_id,
    status,
    submitted_reference,
    verified_by,
    verified_at,
    notes
  )
  values (
    'verification-' || target_booking.id,
    target_booking.id,
    'verified'::public.payment_verification_status,
    target_mpesa_receipt_number,
    'Daraja',
    now(),
    coalesce(target_result_description, 'M-Pesa payment confirmed.')
  )
  on conflict (id) do update
  set
    status = excluded.status,
    submitted_reference = excluded.submitted_reference,
    verified_by = excluded.verified_by,
    verified_at = excluded.verified_at,
    notes = excluded.notes,
    updated_at = now();

  insert into public.admin_activity_logs (
    id,
    type,
    actor,
    message,
    booking_id,
    worker_id
  )
  values (
    'activity-' || gen_random_uuid()::text,
    'payment_confirmed'::public.admin_activity_type,
    'Daraja',
    target_booking.title || ' paid via M-Pesa receipt ' || target_mpesa_receipt_number || '.',
    target_booking.id,
    null
  );

  return jsonb_build_object(
    'processed', true,
    'status', 'succeeded',
    'booking_id', target_booking.id,
    'hire_id', target_hire_id,
    'mpesa_receipt_number', target_mpesa_receipt_number
  );
end;
$$;

create or replace function public.start_booking_payment_lock(
  target_booking_id text,
  target_user_id uuid,
  target_lock_id text,
  target_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_booking public.bookings%rowtype;
  target_worker_ids text[];
  target_worker_id text;
  unavailable_count integer;
  blocking_count integer;
  locked_at timestamptz := now();
begin
  perform public.expire_stale_payment_locks();
  perform pg_advisory_xact_lock(hashtext(target_booking_id));

  select *
  into target_booking
  from public.bookings
  where id = target_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if target_user_id is not null and target_booking.user_id is distinct from target_user_id then
    raise exception 'Booking not found.';
  end if;

  if target_booking.status = 'payment_pending'::public.booking_status
    and target_booking.payment_lock_expires_at > now()
  then
    return jsonb_build_object(
      'booking_id', target_booking.id,
      'status', target_booking.status,
      'lock_id', target_booking.payment_lock_id,
      'expires_at', target_booking.payment_lock_expires_at,
      'worker_count', (
        select count(*)
        from public.booking_workers
        where booking_id = target_booking.id
      )
    );
  end if;

  if target_booking.status <> 'confirmed'::public.booking_status then
    raise exception 'Booking must be confirmed before payment starts.';
  end if;

  select array_agg(worker_id order by worker_id)
  into target_worker_ids
  from public.booking_workers
  where booking_id = target_booking.id;

  if target_worker_ids is null or array_length(target_worker_ids, 1) = 0 then
    raise exception 'No workers are assigned to this booking.';
  end if;

  foreach target_worker_id in array target_worker_ids
  loop
    perform pg_advisory_xact_lock(hashtext(target_worker_id));
  end loop;

  select count(*)
  into blocking_count
  from public.booking_workers booking_worker
  join public.bookings booking
    on booking.id = booking_worker.booking_id
  where booking_worker.worker_id = any(target_worker_ids)
    and booking_worker.booking_id <> target_booking.id
    and (
      booking.status = 'paid'::public.booking_status or
      (
        booking.status = 'payment_pending'::public.booking_status
        and booking.payment_lock_expires_at > now()
      )
    );

  if blocking_count > 0 then
    raise exception 'One or more workers are no longer available.';
  end if;

  select count(*)
  into unavailable_count
  from public.workers
  where id = any(target_worker_ids)
    and availability_status <> 'available'::public.availability_status;

  if unavailable_count > 0 then
    raise exception 'One or more workers are no longer available.';
  end if;

  update public.bookings
  set
    status = 'payment_pending'::public.booking_status,
    payment_status = 'deposit_due'::public.payment_status,
    payment_lock_id = target_lock_id,
    payment_started_at = locked_at,
    payment_lock_expires_at = target_expires_at,
    updated_at = now()
  where id = target_booking.id;

  update public.workers
  set availability_status = 'reserved'::public.availability_status
  where id = any(target_worker_ids);

  return jsonb_build_object(
    'booking_id', target_booking.id,
    'status', 'payment_pending',
    'lock_id', target_lock_id,
    'expires_at', target_expires_at,
    'worker_count', array_length(target_worker_ids, 1)
  );
end;
$$;

drop trigger if exists booking_workers_enforce_rules on public.booking_workers;
create trigger booking_workers_enforce_rules
before insert or update of booking_id, worker_id on public.booking_workers
for each row
execute function public.enforce_booking_worker_rules();

update public.workers worker
set availability_status = 'available'::public.availability_status
where worker.availability_status = 'reserved'::public.availability_status
  and exists (
    select 1
    from public.booking_workers booking_worker
    join public.bookings booking
      on booking.id = booking_worker.booking_id
    where booking_worker.worker_id = worker.id
      and booking.status::text = 'confirmed'
  )
  and not exists (
    select 1
    from public.booking_workers booking_worker
    join public.bookings booking
      on booking.id = booking_worker.booking_id
    where booking_worker.worker_id = worker.id
      and (
        booking.status::text = 'paid' or
        (
          booking.status::text = 'payment_pending'
          and booking.payment_lock_expires_at > now()
        )
      )
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

drop trigger if exists admin_settings_set_updated_at on public.admin_settings;
create trigger admin_settings_set_updated_at
before update on public.admin_settings
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

drop trigger if exists mpesa_payments_set_updated_at on public.mpesa_payments;
create trigger mpesa_payments_set_updated_at
before update on public.mpesa_payments
for each row
execute function public.set_updated_at();

drop trigger if exists hires_set_updated_at on public.hires;
create trigger hires_set_updated_at
before update on public.hires
for each row
execute function public.set_updated_at();

drop trigger if exists hires_set_user_id_from_booking on public.hires;
create trigger hires_set_user_id_from_booking
before insert or update of booking_id, user_id on public.hires
for each row
execute function public.set_hire_user_id_from_booking();

drop trigger if exists admin_email_whitelist_set_updated_at on public.admin_email_whitelist;
create trigger admin_email_whitelist_set_updated_at
before update on public.admin_email_whitelist
for each row
execute function public.set_updated_at();
