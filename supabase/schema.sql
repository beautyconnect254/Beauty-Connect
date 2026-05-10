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

create type public.availability_status as enum (
  'available',
  'reserved',
  'hired'
);

create type public.verification_status as enum (
  'pending',
  'verified',
  'rejected'
);

create type public.work_type as enum (
  'full-time',
  'part-time',
  'contract',
  'freelance'
);

create type public.team_work_type as enum (
  'long-term-contract',
  'short-term-contract'
);

create type public.team_request_status as enum (
  'new',
  'reviewing',
  'staffing',
  'completed'
);

create type public.team_request_urgency as enum (
  'standard',
  'priority',
  'urgent'
);

create type public.document_status as enum (
  'pending',
  'verified',
  'rejected'
);

create type public.staffing_assignment_status as enum (
  'recommended',
  'reserved',
  'hired',
  'released'
);

create type public.booking_status as enum (
  'pending',
  'confirmed',
  'paid',
  'cancelled'
);

create type public.admin_activity_type as enum (
  'booking_confirmed',
  'worker_reserved',
  'payment_confirmed',
  'worker_released',
  'worker_status_updated'
);

create type public.payment_status as enum (
  'not_due',
  'deposit_due',
  'deposit_paid',
  'paid'
);

create type public.payment_verification_status as enum (
  'not_submitted',
  'submitted',
  'verified',
  'rejected'
);

create type public.hire_status as enum (
  'active',
  'completed'
);

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
  type text not null check (type in ('worker', 'team')),
  title text not null,
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'not_due',
  booking_date date not null,
  submitted_at timestamptz not null default now(),
  team_request_id text references public.team_requests(id) on delete set null,
  notes text not null default '',
  payment_instructions jsonb,
  updated_at timestamptz not null default now()
);

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
create index if not exists admin_notes_worker_idx on public.admin_notes (worker_id);
create index if not exists admin_notes_team_request_idx on public.admin_notes (team_request_id);
create index if not exists admin_notes_assignment_idx on public.admin_notes (staffing_assignment_id);
create index if not exists admin_activity_logs_booking_idx on public.admin_activity_logs (booking_id);
create index if not exists admin_activity_logs_worker_idx on public.admin_activity_logs (worker_id);
create index if not exists admin_activity_logs_created_idx on public.admin_activity_logs (created_at);

create unique index if not exists staffing_assignments_active_worker_idx
on public.staffing_assignments (worker_id)
where status in ('reserved', 'hired');

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
