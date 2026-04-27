-- ============================================================
-- CrisisSync SaaS Phase 2A
-- Multi-tenant foundations: organizations + memberships
-- ============================================================

-- Organizations
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  status text not null default 'trial',
  plan text not null default 'starter',
  feature_flags text[] default '{}',
  created_at timestamptz default now()
);

-- Organization memberships
create table if not exists organization_members (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('org_admin', 'venue_admin', 'manager', 'staff')),
  created_at timestamptz default now(),
  unique (organization_id, profile_id)
);

create table if not exists organization_admin_invites (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('org_admin', 'venue_admin', 'manager', 'staff')),
  assigned_venue_id uuid references venues(id) on delete set null,
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- Profiles gain platform and organization fields
alter table profiles
  add column if not exists platform_role text default 'none',
  add column if not exists organization_id uuid references organizations(id),
  add column if not exists organization_role text;

-- Venues belong to organizations
alter table venues
  add column if not exists organization_id uuid references organizations(id),
  add column if not exists slug text,
  add column if not exists mode text default 'hotel';

-- Crises should be organization scoped for safer tenancy
alter table crises
  add column if not exists organization_id uuid references organizations(id);

create index if not exists idx_organizations_slug on organizations(slug);
create index if not exists idx_org_members_org on organization_members(organization_id);
create index if not exists idx_org_members_profile on organization_members(profile_id);
create index if not exists idx_org_admin_invites_org on organization_admin_invites(organization_id);
create index if not exists idx_org_admin_invites_email on organization_admin_invites(email);
create index if not exists idx_org_admin_invites_venue on organization_admin_invites(assigned_venue_id);
create index if not exists idx_profiles_org on profiles(organization_id);
create index if not exists idx_venues_org on venues(organization_id);
create index if not exists idx_venues_slug on venues(slug);
create index if not exists idx_crises_org on crises(organization_id);

-- Seed a default organization for existing demo data
insert into organizations (id, name, slug, status, plan, feature_flags)
values (
  'b0000000-0000-0000-0000-000000000001',
  'Grand Horizon Hospitality',
  'grand-horizon-hospitality',
  'active',
  'pro',
  array['ai_triage', 'image_analysis', 'analytics', 'multi_venue_ready']
)
on conflict (id) do nothing;

update venues
set organization_id = 'b0000000-0000-0000-0000-000000000001'
where organization_id is null;

update profiles
set
  organization_id = 'b0000000-0000-0000-0000-000000000001',
  organization_role = case
    when role = 'admin' then 'org_admin'
    when role = 'staff' then 'staff'
    else organization_role
  end
where organization_id is null;

update crises
set organization_id = 'b0000000-0000-0000-0000-000000000001'
where organization_id is null;
