-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
create type user_role_enum as enum ('operator', 'admin', 'staff');
create type crisis_status_enum as enum ('reported', 'triaged', 'assigned', 'in_progress', 'resolved', 'closed');
create type crisis_severity_enum as enum ('low', 'medium', 'high', 'critical');
create type crisis_type_enum as enum ('fire', 'medical', 'security', 'maintenance', 'other');
create type plan_enum as enum ('trial', 'starter', 'pro', 'enterprise');

-- Venues (tenant root)
create table venues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  address text,
  city text,
  country text,
  phone text,
  logo_url text,
  accent_color text default '#3B82F6',
  plan plan_enum not null default 'trial',
  trial_ends_at timestamptz default now() + interval '14 days',
  stripe_customer_id text,
  stripe_subscription_id text,
  crises_this_month integer default 0,
  monthly_crisis_limit integer default 50,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz default now()
);

-- Venue memberships (many users → many venues)
create table venue_memberships (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid references venues(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role user_role_enum not null default 'staff',
  is_on_duty boolean default false,
  joined_at timestamptz default now(),
  unique(venue_id, user_id)
);

-- Invitations
create table invitations (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid references venues(id) on delete cascade,
  email text not null,
  role user_role_enum not null default 'staff',
  token text unique default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid references auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz default now() + interval '7 days',
  created_at timestamptz default now()
);

-- Crises
create table crises (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid references venues(id) on delete cascade,
  guest_name text,
  room_number text,
  crisis_type crisis_type_enum not null,
  description text not null,
  location_description text,
  severity_assessment crisis_severity_enum not null default 'medium',
  status crisis_status_enum not null default 'reported',
  assigned_to uuid references auth.users(id),
  photo_url text,
  ai_severity crisis_severity_enum,
  ai_confidence numeric(3,2),
  ai_reasoning text,
  ai_guest_instructions jsonb,
  ai_staff_checklist jsonb,
  ai_responder_focus text,
  ai_prevention_insights text,
  ai_model_used text,
  response_started_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Crisis updates (timeline)
create table crisis_updates (
  id uuid primary key default uuid_generate_v4(),
  crisis_id uuid references crises(id) on delete cascade,
  author_id uuid references auth.users(id),
  author_name text,
  content text not null,
  update_type text default 'note',
  created_at timestamptz default now()
);

-- Incident reports (post-resolution AI-generated)
create table incident_reports (
  id uuid primary key default uuid_generate_v4(),
  crisis_id uuid references crises(id) on delete cascade,
  venue_id uuid references venues(id),
  generated_at timestamptz default now(),
  report_markdown text,
  report_data jsonb
);

-- RLS
alter table venues enable row level security;
alter table profiles enable row level security;
alter table venue_memberships enable row level security;
alter table invitations enable row level security;
alter table crises enable row level security;
alter table crisis_updates enable row level security;
alter table incident_reports enable row level security;

create or replace function get_my_venue_ids()
returns uuid[]
language sql
security definer
as $$
  select array_agg(venue_id) from venue_memberships where user_id = auth.uid();
$$;

create or replace function get_my_role_in_venue(p_venue_id uuid)
returns user_role_enum
language sql
security definer
as $$
  select role from venue_memberships
  where user_id = auth.uid() and venue_id = p_venue_id
  limit 1;
$$;

create policy "Users see their own profile" on profiles for all using (user_id = auth.uid());
create policy "Members see their venues" on venues for select using (id = any(get_my_venue_ids()));
create policy "Admins update their venue" on venues for update using (get_my_role_in_venue(id) in ('admin', 'operator'));
create policy "Members see memberships" on venue_memberships for select using (venue_id = any(get_my_venue_ids()));
create policy "Admins manage memberships" on venue_memberships for all using (get_my_role_in_venue(venue_id) in ('admin', 'operator'));
create policy "Members see crises" on crises for select using (venue_id = any(get_my_venue_ids()));
create policy "Staff create crises" on crises for insert with check (venue_id = any(get_my_venue_ids()));
create policy "Staff update crises" on crises for update using (venue_id = any(get_my_venue_ids()));
create policy "Anyone insert crisis (guest reporting)" on crises for insert with check (true);
create policy "Members see updates" on crisis_updates for select using (crisis_id in (select id from crises where venue_id = any(get_my_venue_ids())));
create policy "Members add updates" on crisis_updates for insert with check (true);
create policy "Members see reports" on incident_reports for select using (venue_id = any(get_my_venue_ids()));

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger venues_updated_at before update on venues for each row execute function update_updated_at();
create trigger crises_updated_at before update on crises for each row execute function update_updated_at();

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
