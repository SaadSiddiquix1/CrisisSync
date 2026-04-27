-- ============================================================
-- CrisisSync SaaS Phase 2B
-- Multi-venue entitlements, venue admins, and richer invite payloads
-- ============================================================

alter table profiles
  add column if not exists default_venue_id uuid references venues(id);

alter table organization_admin_invites
  add column if not exists assigned_venue_ids uuid[] default '{}',
  add column if not exists default_venue_id uuid references venues(id);

update organization_admin_invites
set assigned_venue_ids = case
  when assigned_venue_id is not null and cardinality(coalesce(assigned_venue_ids, '{}')) = 0
    then array[assigned_venue_id]
  else coalesce(assigned_venue_ids, '{}')
end
where true;

update profiles
set default_venue_id = coalesce(default_venue_id, venue_id)
where venue_id is not null;

create table if not exists venue_memberships (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('org_admin', 'venue_admin', 'manager', 'staff')),
  is_default boolean not null default false,
  created_at timestamptz default now(),
  unique (venue_id, profile_id)
);

create index if not exists idx_venue_memberships_org on venue_memberships(organization_id);
create index if not exists idx_venue_memberships_venue on venue_memberships(venue_id);
create index if not exists idx_venue_memberships_profile on venue_memberships(profile_id);

insert into venue_memberships (organization_id, venue_id, profile_id, role, is_default)
select
  p.organization_id,
  p.venue_id,
  p.id,
  coalesce(p.organization_role, case when p.role = 'admin' then 'org_admin' else 'staff' end),
  true
from profiles p
where p.organization_id is not null
  and p.venue_id is not null
on conflict (venue_id, profile_id) do nothing;
