export type UserRole = "operator" | "admin" | "staff" | "guest" | "org_admin" | "venue_admin" | "manager";
export type CrisisStatus =
  | "reported"
  | "triaged"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "acknowledged"
  | "responding"
  | "dismissed";
export type CrisisSeverity = "low" | "medium" | "high" | "critical";
export type Severity = CrisisSeverity;
export type CrisisType = "fire" | "medical" | "security" | "maintenance" | "other";
export type Plan = "trial" | "starter" | "pro" | "enterprise";
export type OrganizationPlan = "starter" | "pro" | "enterprise";
export type ShowcaseRole = "staff" | "admin" | "operator";
export type ShowcaseLocale = "en" | "hi";
export type ScenarioType = "fire" | "medical" | "security" | "vip_panic" | "kitchen_hazard";
export type ScenarioPhase = "reported" | "triaged" | "assigned" | "responding" | "resolved" | "all_clear";

export interface Venue {
  id: string;
  name: string;
  slug: string;
  organization_id?: string;
  mode?: VenueMode;
  address?: string;
  floor_count?: number;
  zone_summary?: string[];
  city?: string;
  country?: string;
  phone?: string;
  logo_url?: string;
  accent_color?: string;
  plan?: Plan;
  trial_ends_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  crises_this_month?: number;
  monthly_crisis_limit?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  platform_role?: PlatformRole;
  organization_role?: OrganizationRole;
  allowed_venue_ids?: string[];
  default_venue_id?: string;
  organization_id?: string;
  venue_id?: string;
  is_available?: boolean;
  created_at: string;
}

export interface VenueMembership {
  id: string;
  venue_id: string;
  user_id?: string;
  role: UserRole | OrganizationRole;
  is_on_duty?: boolean;
  joined_at?: string;
  created_at?: string;
  organization_id?: string;
  profile_id?: string;
  is_default?: boolean;
  profile?: Profile;
  venue?: Venue;
}

export interface ChecklistItem {
  task?: string;
  priority?: "immediate" | "urgent" | "standard" | "critical" | "high" | "medium" | "low";
  completed?: boolean;
  id?: string;
  crisis_id?: string;
  item_text?: string;
  is_completed?: boolean;
  completed_by?: string | null;
  completed_at?: string | null;
}

export interface Crisis {
  id: string;
  venue_id: string;
  guest_name?: string;
  room_number?: string;
  crisis_type: CrisisType;
  description: string;
  location_description?: string;
  severity_assessment?: CrisisSeverity;
  severity?: CrisisSeverity;
  status: CrisisStatus;
  assigned_to?: string;
  assigned_staff_id?: string | null;
  photo_url?: string;
  organization_id?: string;
  ai_triage_result?: AiTriageResult | null;
  ai_severity?: CrisisSeverity;
  ai_confidence?: number;
  ai_reasoning?: string;
  ai_guest_instructions?: string[];
  ai_staff_checklist?: ChecklistItem[];
  ai_responder_focus?: string;
  ai_prevention_insights?: string;
  ai_model_used?: string;
  response_started_at?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at?: string;
  assigned_profile?: Profile;
  assigned_staff?: Profile;
  venue?: Venue;
}

export interface CrisisUpdate {
  id: string;
  crisis_id: string;
  author_id?: string;
  author_name?: string;
  content?: string;
  message?: string;
  updated_by?: string | null;
  profile?: Profile;
  update_type: "note" | "status_change" | "assignment" | "ai_retriage" | "created" | "assigned" | "resolved" | string;
  created_at: string;
}

export interface AiTriageResult {
  severity?: CrisisSeverity;
  category_confirmed?: CrisisType;
  confidence?: number;
  confidence_score?: number;
  summary?: string;
  reasoning: string | string[];
  guest_instructions?: string[];
  staff_protocol?: string[];
  staff_checklist?: ChecklistItem[];
  responder_focus?: string;
  prevention_insights?: string;
  prevention_recommendations?: string[];
  visual_summary?: string;
  visual_risk_factors?: string[];
  model_used?: string;
}

export interface IncidentReport {
  id: string;
  crisis_id: string;
  venue_id?: string;
  generated_at: string;
  report_markdown?: string;
  report_content?: string;
  report_data?: {
    title: string;
    timeline: Array<{ time: string; event: string }>;
    response_time_minutes: number;
    ai_accuracy_score?: number;
    recommendations: string[];
  };
}

export interface ShowcaseGuestStatus {
  headline: string;
  subline: string;
  eta: string;
  advisory: string;
  accent: "warning" | "active" | "success";
}

export interface ShowcaseEvent {
  id: string;
  phase: ScenarioPhase;
  offsetMs: number;
  title: string;
  description: string;
  actor: string;
  tone: "primary" | "warning" | "success";
}

export interface ShowcaseReplayFrame {
  phase: ScenarioPhase;
  offsetMs: number;
  title: string;
  summary: string;
  operatorNote: string;
  guestNote: string;
  statusLabel: string;
  respondersLabel: string;
  spotlight: string;
}

export interface ShowcaseScenario {
  id: string;
  crisisId: string;
  reportId: string;
  type: ScenarioType;
  venueId: string;
  venueName: string;
  startedAt: string;
  title: string;
  shortLabel: string;
  locationLabel: string;
  roomNumber: string;
  crisisType: CrisisType;
  guestName: string;
  severity: CrisisSeverity;
  description: string;
  aiSummary: string;
  responderFocus: string;
  guestInstructions: string[];
  checklist: ChecklistItem[];
  evidence: Array<{ label: string; value: string }>;
  replayFrames: ShowcaseReplayFrame[];
  events: ShowcaseEvent[];
  guestStatuses: Record<ScenarioPhase, ShowcaseGuestStatus>;
  reportSections: {
    overview: string;
    timeline: string[];
    actions: string[];
    recommendations: string[];
  };
  highlightMetrics: Array<{ label: string; value: string; detail: string }>;
}

export interface Invitation {
  id: string;
  venue_id: string;
  email: string;
  role: UserRole;
  token: string;
  invited_by?: string;
  accepted_at?: string;
  expires_at: string;
  created_at: string;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  profile_id?: string;
  user_id?: string;
  role: OrganizationRole;
  created_at: string;
  organization?: Organization;
}

export interface StaffAvailability {
  id: string;
  staff_id: string;
  venue_id?: string;
  status: "available" | "responding" | "off_duty" | "busy" | "offline";
  updated_at: string;
  profile?: Profile;
}

// Compatibility types used by existing routes/components
export type PlatformRole = "platform_operator" | "none";
export type OrganizationRole = "org_admin" | "venue_admin" | "manager" | "staff";
export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";
export type InviteRole = "org_admin" | "venue_admin" | "manager" | "staff";
export type VenueMode = "hotel" | "resort" | "restaurant" | "event_venue" | "nightlife" | "mixed_use";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: "trial" | "active" | "suspended";
  plan: "starter" | "pro" | "enterprise";
  feature_flags?: Record<string, boolean>;
  usage_snapshot?: {
    venues: number;
    staff: number;
    incidents_this_month: number;
  };
  created_at: string;
}

export interface OrganizationAdminInvite {
  id: string;
  organization_id: string;
  email: string;
  full_name?: string | null;
  role: InviteRole;
  status: InviteStatus;
  assigned_venue_id?: string | null;
  assigned_venue_ids?: string[] | null;
  default_venue_id?: string | null;
  token?: string | null;
  invited_by?: string | null;
  accepted_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}
