# SaaS Architecture

## Product Direction

CrisisSync should evolve from a single-venue demo into a multi-tenant hospitality crisis coordination platform.

The platform model should be:

```text
Platform Operator -> Organization -> Venue -> Zone -> Incident
```

This gives the product a clean structure for:
- multiple client businesses
- multiple venues per business
- different hospitality operating modes
- staff scoped to the right business and venue
- platform-level management by the SaaS owner

## Role Model

### Platform Operator

This is the SaaS owner.

Responsibilities:
- create and manage organizations
- assign organization admins
- manage plans, limits, and billing
- monitor platform-wide usage
- oversee support and incident health across tenants

### Organization Admin

This is the client’s primary operator.

Responsibilities:
- manage one organization
- create or invite staff
- create and manage venues
- define escalation settings and crisis protocols
- monitor incidents across their organization

### Staff / Responder

This is the operational team inside the client organization.

Responsibilities:
- receive and acknowledge incidents
- claim response ownership
- execute AI-generated protocols
- update checklists and status
- resolve incidents

### Public Reporter

This is the distressed guest or visitor.

Responsibilities:
- submit a crisis report
- optionally upload media
- receive AI guidance and status updates

## Tenant Model

### Platform

Top-level SaaS ownership layer.

### Organization

A business using CrisisSync.

Examples:
- hotel group
- resort operator
- restaurant brand
- event company
- nightlife chain

### Venue

A physical operating location within an organization.

Examples:
- hotel property
- resort property
- restaurant branch
- event hall
- club
- lounge
- beach venue

### Zone

A structured location inside a venue.

Examples:
- room
- floor
- lobby
- kitchen
- dining section
- ballroom
- rooftop
- entrance
- pool deck
- corridor
- staff-only area

## Venue Modes

The product should not stay hardcoded to hotel + room number.

Instead, each venue should have a mode:

- `hotel`
- `resort`
- `restaurant`
- `event_venue`
- `nightlife`
- `mixed_use`

These modes should affect:
- intake fields
- zone labels
- crisis categories
- response playbooks
- analytics views

## Adaptive Intake by Venue Mode

### Hotel / Resort

Suggested fields:
- guest name
- room number
- floor
- wing
- location description

### Restaurant

Suggested fields:
- reporter name
- table / section
- kitchen / dining / storage
- location description

### Event Venue

Suggested fields:
- event name
- hall / stage / gate / backstage
- crowd density indicator
- location description

### Nightlife

Suggested fields:
- bar / dance floor / VIP / entrance
- floor
- crowd intensity
- location description

### Mixed Use

Suggested fields:
- zone type
- zone label
- freeform location description

## Recommended Core Data Model

### organizations

- id
- name
- slug
- status
- created_at

### organization_members

- id
- organization_id
- profile_id
- role
- created_at

### venues

- id
- organization_id
- name
- venue_mode
- address
- floor_count
- created_at

### venue_zones

- id
- venue_id
- zone_type
- label
- floor
- metadata

### profiles

- id
- user_id
- full_name
- platform_role
- organization_id optional for platform operator
- default_venue_id
- created_at

### incidents

- id
- organization_id
- venue_id
- zone_id nullable
- zone_label
- crisis_type
- description
- severity
- status
- reported_by_type
- assigned_staff_id
- ai_triage_result
- photo_url
- created_at
- acknowledged_at
- resolved_at

## Migration Strategy

### Current State

Current schema assumes:
- one demo venue
- room-number-centric crisis intake
- limited role separation

### Target State

Move to:
- platform operator
- organization admin
- staff membership per organization
- multiple venues per organization
- structured venue modes and zones

## Safe Migration Plan

### Step 1

Add `organizations` and `organization_members`.

### Step 2

Attach current venues and profiles to an organization.

### Step 3

Add `venue_mode`, `zone_type`, and `zone_label`.

### Step 4

Refactor intake to support venue-mode-specific fields.

### Step 5

Add platform operator console and organization admin management.

## Best Next Build Step

The strongest next implementation step is:

`Introduce organizations + organization roles without changing the full incident UI yet.`

Why:
- this is the smallest real SaaS boundary
- it unlocks platform operator and organization admin
- it sets up billing, tenancy, and scalable permissions
- it avoids prematurely breaking the current demo flow

## Practical Product Principle

Do not rebuild everything at once.

Instead:
- keep the current guest/staff/admin experience working
- add the tenant model underneath it
- then make venue-mode intake adaptive in a second pass

That path gives the product the best mix of momentum, safety, and long-term structure.
