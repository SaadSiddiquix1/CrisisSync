-- ============================================================
-- CrisisSync — Full Database Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE crisis_type_enum AS ENUM ('fire', 'medical', 'security', 'maintenance', 'other');
CREATE TYPE severity_enum AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE crisis_status_enum AS ENUM ('reported', 'acknowledged', 'assigned', 'responding', 'resolved', 'dismissed');
CREATE TYPE user_role_enum AS ENUM ('guest', 'staff', 'admin');
CREATE TYPE staff_status_enum AS ENUM ('available', 'responding', 'off_duty');

-- ============================================================
-- TABLES
-- ============================================================

-- Venues
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  floor_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'staff',
  venue_id UUID REFERENCES venues(id),
  is_available BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crises (main table)
CREATE TABLE crises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id),
  guest_name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  crisis_type crisis_type_enum NOT NULL,
  description TEXT NOT NULL,
  location_description TEXT DEFAULT '',
  severity severity_enum NOT NULL DEFAULT 'medium',
  status crisis_status_enum NOT NULL DEFAULT 'reported',
  ai_triage_result JSONB,
  assigned_staff_id UUID REFERENCES profiles(id),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- Crisis Assignments
CREATE TABLE crisis_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crisis_id UUID REFERENCES crises(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id)
);

-- Crisis Updates (timeline entries)
CREATE TABLE crisis_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crisis_id UUID REFERENCES crises(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES profiles(id),
  update_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist Items (AI-generated response checklist)
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crisis_id UUID REFERENCES crises(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ
);

-- Incident Reports
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crisis_id UUID REFERENCES crises(id) ON DELETE CASCADE,
  report_content TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Availability
CREATE TABLE staff_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status staff_status_enum DEFAULT 'available',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_crises_venue ON crises(venue_id);
CREATE INDEX idx_crises_status ON crises(status);
CREATE INDEX idx_crises_severity ON crises(severity);
CREATE INDEX idx_crises_assigned ON crises(assigned_staff_id);
CREATE INDEX idx_crises_created ON crises(created_at DESC);
CREATE INDEX idx_updates_crisis ON crisis_updates(crisis_id);
CREATE INDEX idx_checklist_crisis ON checklist_items(crisis_id);
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_venue ON profiles(venue_id);
CREATE INDEX idx_staff_avail ON staff_availability(staff_id);

-- ============================================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role_enum
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crises ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;

-- Public read access for venues
CREATE POLICY "Venues are viewable by everyone" ON venues FOR SELECT USING (true);

-- Profiles: users can see their own, staff/admin can see all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all profiles" ON profiles FOR SELECT
  USING (public.get_my_role() IN ('staff', 'admin'));

-- Crises: anyone can insert (guest reporting), staff/admin can view and update
CREATE POLICY "Anyone can report a crisis" ON crises FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can view crises" ON crises FOR SELECT
  USING (public.get_my_role() IN ('staff', 'admin'));
CREATE POLICY "Guests can view their own crisis" ON crises FOR SELECT USING (true);
CREATE POLICY "Staff can update crises" ON crises FOR UPDATE
  USING (public.get_my_role() IN ('staff', 'admin'));

-- Crisis updates: staff can insert and view
CREATE POLICY "Anyone can view crisis updates" ON crisis_updates FOR SELECT USING (true);
CREATE POLICY "Staff can create updates" ON crisis_updates FOR INSERT WITH CHECK (true);

-- Checklist: staff can view and update
CREATE POLICY "Anyone can view checklist" ON checklist_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert checklist" ON checklist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update checklist" ON checklist_items FOR UPDATE USING (true);

-- Assignments
CREATE POLICY "Anyone can view assignments" ON crisis_assignments FOR SELECT USING (true);
CREATE POLICY "Anyone can create assignments" ON crisis_assignments FOR INSERT WITH CHECK (true);

-- Incident reports
CREATE POLICY "Anyone can view reports" ON incident_reports FOR SELECT USING (true);
CREATE POLICY "Anyone can create reports" ON incident_reports FOR INSERT WITH CHECK (true);

-- Staff availability
CREATE POLICY "Anyone can view availability" ON staff_availability FOR SELECT USING (true);
CREATE POLICY "Anyone can update availability" ON staff_availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update availability" ON staff_availability FOR UPDATE USING (true);

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE crises;
ALTER PUBLICATION supabase_realtime ADD TABLE crisis_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_availability;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert a demo venue
INSERT INTO venues (id, name, address, floor_count) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Grand Horizon Resort & Spa', '1200 Ocean Boulevard, Miami Beach, FL', 12);

-- Note: To seed staff/admin profiles, first create users in Supabase Auth,
-- then insert corresponding profile rows with the user_id from auth.users.
