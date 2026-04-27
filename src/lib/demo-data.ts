import {
    AiTriageResult,
    ChecklistItem,
    Crisis,
    CrisisUpdate,
    IncidentReport,
    OrganizationAdminInvite,
    Organization,
    OrganizationMembership,
    Profile,
    StaffAvailability,
    Venue,
    VenueMembership,
} from "@/types/database";

const now = new Date("2026-03-29T19:45:00+05:30");

function minutesAgo(minutes: number) {
    return new Date(now.getTime() - minutes * 60_000).toISOString();
}

const fireTriage: AiTriageResult = {
    severity: "critical",
    category_confirmed: "fire",
    confidence_score: 0.95,
    reasoning: [
        "The report describes both smoke odor and visible haze in a confined guest corridor.",
        "The location near a service closet increases the chance of electrical or maintenance-related ignition.",
        "Guest evacuation risk is elevated because smoke spread in corridors can escalate quickly.",
    ],
    guest_instructions: [
        "Leave the area immediately if smoke is visible and use the nearest safe exit.",
        "Do not use elevators while staff is responding.",
        "Stay low if smoke is present and wait for staff direction at a safe point.",
    ],
    staff_protocol: [
        "Dispatch nearest responder and confirm fire alarm status.",
        "Clear adjacent rooms and corridor access immediately.",
        "Coordinate with security and call emergency services if fire is confirmed.",
        "Update command center with floor status and evacuation progress.",
        "Mark incident resolved only after physical verification.",
    ],
    summary: "Smoke reported near a guest corridor. Treat as critical until responders verify source and containment.",
    responder_focus: "Clear the corridor first, verify the source, and decide within minutes whether full evacuation is necessary.",
    prevention_recommendations: [
        "Inspect service closets on upper guest floors for electrical and housekeeping hazards.",
        "Audit smoke detector visibility and responder access on guest corridors.",
        "Run a post-incident drill review focused on corridor evacuation speed.",
    ],
};

const medicalTriage: AiTriageResult = {
    severity: "high",
    category_confirmed: "medical",
    confidence_score: 0.9,
    reasoning: [
        "A collapse in a public area indicates immediate risk to guest safety and bystander concern.",
        "Semi-responsive condition suggests possible urgent medical escalation.",
        "The lobby location supports fast staff access, which helps keep the severity high rather than critical until assessed.",
    ],
    guest_instructions: [
        "Stay with the affected person if it is safe to do so.",
        "Keep the area clear so staff can reach the location quickly.",
        "Do not move the guest unless there is immediate danger.",
    ],
    staff_protocol: [
        "Send the nearest trained responder with first-aid equipment.",
        "Assess consciousness and breathing on arrival.",
        "Call emergency medical services if symptoms are severe.",
        "Record care actions and guest status in the timeline.",
    ],
    summary: "A guest appears to have collapsed in a public area and requires urgent staff attention.",
    responder_focus: "Get a trained responder on scene immediately and assess airway, breathing, and consciousness.",
    prevention_recommendations: [
        "Review first-aid kit and AED positioning in lobby and concierge areas.",
        "Refresh responder training for collapse and fainting scenarios.",
        "Evaluate whether lobby staffing density is sufficient during peak check-in windows.",
    ],
};

export const demoCrises: Crisis[] = [
    {
        id: "demo-fire-001",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000001",
        guest_name: "Maya Chen",
        room_number: "712",
        crisis_type: "fire",
        description: "Smoke smell and visible haze outside Room 712 near the service closet.",
        location_description: "Floor 7 east corridor near service closet",
        severity: "critical",
        status: "responding",
        ai_triage_result: fireTriage,
        ai_severity: "critical",
        ai_confidence: 0.95,
        ai_reasoning: fireTriage.summary,
        ai_guest_instructions: fireTriage.guest_instructions,
        ai_staff_checklist: fireTriage.staff_checklist,
        ai_responder_focus: fireTriage.responder_focus,
        ai_prevention_insights: fireTriage.prevention_insights,
        ai_model_used: "gemini",
        assigned_staff_id: "demo-staff-001",
        created_at: minutesAgo(12),
        acknowledged_at: minutesAgo(10),
    },
    {
        id: "demo-medical-002",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000001",
        guest_name: "Daniel Brooks",
        room_number: "L1",
        crisis_type: "medical",
        description: "Guest fainted near concierge desk and is semi-responsive.",
        location_description: "Main lobby concierge",
        severity: "high",
        status: "assigned",
        ai_triage_result: medicalTriage,
        ai_severity: "high",
        ai_confidence: 0.9,
        ai_reasoning: medicalTriage.summary,
        ai_guest_instructions: medicalTriage.guest_instructions,
        ai_staff_checklist: medicalTriage.staff_checklist,
        ai_responder_focus: medicalTriage.responder_focus,
        ai_prevention_insights: medicalTriage.prevention_insights,
        ai_model_used: "gemini",
        assigned_staff_id: "demo-staff-002",
        created_at: minutesAgo(21),
        acknowledged_at: minutesAgo(19),
    },
    {
        id: "demo-maintenance-003",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000001",
        guest_name: "Aisha Patel",
        room_number: "305",
        crisis_type: "maintenance",
        description: "Water leak coming from ceiling above hallway light fitting.",
        location_description: "Floor 3 west hallway",
        severity: "medium",
        status: "reported",
        ai_triage_result: null,
        assigned_staff_id: null,
        created_at: minutesAgo(7),
    },
    {
        id: "demo-security-004",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000001",
        guest_name: "Noah Rivera",
        room_number: "118",
        crisis_type: "security",
        description: "Unknown person repeatedly attempting access to guest corridor door.",
        location_description: "Floor 1 north guest corridor",
        severity: "medium",
        status: "resolved",
        ai_triage_result: null,
        assigned_staff_id: "demo-staff-003",
        created_at: minutesAgo(85),
        acknowledged_at: minutesAgo(82),
        resolved_at: minutesAgo(46),
    },
];

export const demoProfiles: Profile[] = [
    {
        id: "demo-staff-001",
        user_id: "demo-user-001",
        full_name: "Rina Alvarez",
        role: "staff",
        organization_id: "demo-org-001",
        organization_role: "staff",
        venue_id: "a0000000-0000-0000-0000-000000000001",
        default_venue_id: "a0000000-0000-0000-0000-000000000001",
        is_available: false,
        created_at: minutesAgo(1000),
    },
    {
        id: "demo-staff-002",
        user_id: "demo-user-002",
        full_name: "Marcus Hale",
        role: "staff",
        organization_id: "demo-org-001",
        organization_role: "venue_admin",
        venue_id: "a0000000-0000-0000-0000-000000000002",
        default_venue_id: "a0000000-0000-0000-0000-000000000002",
        is_available: false,
        created_at: minutesAgo(1000),
    },
    {
        id: "demo-staff-003",
        user_id: "demo-user-003",
        full_name: "Leila Moore",
        role: "staff",
        organization_id: "demo-org-001",
        organization_role: "manager",
        venue_id: "a0000000-0000-0000-0000-000000000001",
        default_venue_id: "a0000000-0000-0000-0000-000000000001",
        is_available: true,
        created_at: minutesAgo(1000),
    },
    {
        id: "demo-admin-001",
        user_id: "demo-user-004",
        full_name: "Sophie Grant",
        role: "admin",
        organization_id: "demo-org-001",
        organization_role: "org_admin",
        venue_id: "a0000000-0000-0000-0000-000000000001",
        default_venue_id: "a0000000-0000-0000-0000-000000000001",
        is_available: true,
        created_at: minutesAgo(1000),
    },
];

export const demoOrganizations: Organization[] = [
    {
        id: "demo-org-001",
        name: "Grand Horizon Hospitality",
        slug: "grand-horizon-hospitality",
        status: "active",
        plan: "pro",
        usage_snapshot: {
            venues: 3,
            staff: 4,
            incidents_this_month: 27,
        },
        feature_flags: { ai_triage: true, image_analysis: true, analytics: true, multi_venue_ready: true },
        created_at: minutesAgo(30000),
    },
    {
        id: "demo-org-002",
        name: "Harborline Events Group",
        slug: "harborline-events-group",
        status: "trial",
        plan: "starter",
        usage_snapshot: {
            venues: 1,
            staff: 0,
            incidents_this_month: 6,
        },
        feature_flags: { ai_triage: true, basic_reporting: true },
        created_at: minutesAgo(18000),
    },
];

export const demoOrganizationMemberships: OrganizationMembership[] = [
    {
        id: "demo-membership-001",
        organization_id: "demo-org-001",
        profile_id: "demo-admin-001",
        role: "org_admin",
        created_at: minutesAgo(20000),
    },
];

export const demoVenueMemberships: VenueMembership[] = [
    {
        id: "demo-vm-001",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000001",
        profile_id: "demo-admin-001",
        role: "org_admin",
        is_default: true,
        created_at: minutesAgo(20000),
    },
    {
        id: "demo-vm-002",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000002",
        profile_id: "demo-admin-001",
        role: "org_admin",
        is_default: false,
        created_at: minutesAgo(19000),
    },
    {
        id: "demo-vm-003",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000003",
        profile_id: "demo-admin-001",
        role: "org_admin",
        is_default: false,
        created_at: minutesAgo(18000),
    },
    {
        id: "demo-vm-004",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000001",
        profile_id: "demo-staff-001",
        role: "staff",
        is_default: true,
        created_at: minutesAgo(17000),
    },
    {
        id: "demo-vm-005",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000002",
        profile_id: "demo-staff-001",
        role: "staff",
        is_default: false,
        created_at: minutesAgo(16000),
    },
    {
        id: "demo-vm-006",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000002",
        profile_id: "demo-staff-002",
        role: "venue_admin",
        is_default: true,
        created_at: minutesAgo(15000),
    },
    {
        id: "demo-vm-007",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000003",
        profile_id: "demo-staff-003",
        role: "manager",
        is_default: false,
        created_at: minutesAgo(14000),
    },
    {
        id: "demo-vm-008",
        organization_id: "demo-org-001",
        venue_id: "a0000000-0000-0000-0000-000000000001",
        profile_id: "demo-staff-003",
        role: "manager",
        is_default: true,
        created_at: minutesAgo(13000),
    },
];

export const demoOrganizationAdminInvites: OrganizationAdminInvite[] = [
    {
        id: "demo-invite-001",
        organization_id: "demo-org-002",
        email: "ops@harborlineevents.com",
        full_name: "Nadia Foster",
        role: "org_admin",
        status: "pending",
        assigned_venue_ids: [],
        created_at: minutesAgo(240),
    },
    {
        id: "demo-invite-002",
        organization_id: "demo-org-001",
        email: "lead.responders@grandhorizon.com",
        full_name: "Imran Cole",
        role: "manager",
        assigned_venue_id: "a0000000-0000-0000-0000-000000000001",
        assigned_venue_ids: ["a0000000-0000-0000-0000-000000000001", "a0000000-0000-0000-0000-000000000003"],
        default_venue_id: "a0000000-0000-0000-0000-000000000001",
        status: "pending",
        created_at: minutesAgo(90),
    },
    {
        id: "demo-invite-003",
        organization_id: "demo-org-001",
        email: "frontdesk.shift@grandhorizon.com",
        full_name: "Sara Lim",
        role: "staff",
        assigned_venue_id: "a0000000-0000-0000-0000-000000000001",
        assigned_venue_ids: ["a0000000-0000-0000-0000-000000000001"],
        default_venue_id: "a0000000-0000-0000-0000-000000000001",
        status: "pending",
        created_at: minutesAgo(48),
    },
];

export const demoVenues: Venue[] = [
    {
        id: "a0000000-0000-0000-0000-000000000001",
        organization_id: "demo-org-001",
        name: "Grand Horizon Downtown",
        slug: "grand-horizon-downtown",
        mode: "hotel",
        address: "14 Marina Avenue, Dubai",
        floor_count: 18,
        zone_summary: ["Rooms", "Lobby", "Corridors", "Spa", "Parking"],
        created_at: minutesAgo(28000),
        updated_at: minutesAgo(28000),
    },
    {
        id: "a0000000-0000-0000-0000-000000000002",
        organization_id: "demo-org-001",
        name: "Grand Horizon Marina",
        slug: "grand-horizon-marina",
        mode: "resort",
        address: "23 Palm Crescent, Dubai",
        floor_count: 11,
        zone_summary: ["Rooms", "Pool", "Lobby", "Spa", "Parking"],
        created_at: minutesAgo(22000),
        updated_at: minutesAgo(22000),
    },
    {
        id: "a0000000-0000-0000-0000-000000000003",
        organization_id: "demo-org-001",
        name: "Grand Horizon Supper Club",
        slug: "grand-horizon-supper-club",
        mode: "restaurant",
        address: "8 Skyline Row, Dubai",
        floor_count: 2,
        zone_summary: ["Dining", "Kitchen", "Entrance", "VIP"],
        created_at: minutesAgo(20000),
        updated_at: minutesAgo(20000),
    },
    {
        id: "a0000000-0000-0000-0000-000000000004",
        organization_id: "demo-org-002",
        name: "Harborline Pavilion",
        slug: "harborline-pavilion",
        mode: "event_venue",
        address: "88 Waterfront Promenade, Dubai",
        floor_count: 4,
        zone_summary: ["Ballroom", "Stage", "Entrance", "VIP", "Parking"],
        created_at: minutesAgo(15000),
        updated_at: minutesAgo(15000),
    },
];

export const demoAvailability: StaffAvailability[] = [
    { id: "avail-1", staff_id: "demo-staff-001", status: "responding", updated_at: minutesAgo(11) },
    { id: "avail-2", staff_id: "demo-staff-002", status: "responding", updated_at: minutesAgo(18) },
    { id: "avail-3", staff_id: "demo-staff-003", status: "available", updated_at: minutesAgo(5) },
    { id: "avail-4", staff_id: "demo-admin-001", status: "available", updated_at: minutesAgo(2) },
];

export function getDemoVenuesByOrganization(organizationId?: string | null) {
    if (!organizationId) return demoVenues;
    return demoVenues.filter((venue) => venue.organization_id === organizationId);
}

export function getDemoVenueMembershipsByProfile(profileId?: string | null) {
    if (!profileId) return [];
    return demoVenueMemberships.filter((membership) => membership.profile_id === profileId);
}

export const demoChecklistByCrisis: Record<string, ChecklistItem[]> = {
    "demo-fire-001": (fireTriage.staff_protocol ?? []).map((item, index) => ({
        id: `demo-fire-check-${index + 1}`,
        crisis_id: "demo-fire-001",
        item_text: item,
        is_completed: index < 2,
        completed_by: index < 2 ? "demo-staff-001" : null,
        completed_at: index < 2 ? minutesAgo(8 - index) : null,
    })),
    "demo-medical-002": (medicalTriage.staff_protocol ?? []).map((item, index) => ({
        id: `demo-med-check-${index + 1}`,
        crisis_id: "demo-medical-002",
        item_text: item,
        is_completed: index < 1,
        completed_by: index < 1 ? "demo-staff-002" : null,
        completed_at: index < 1 ? minutesAgo(15) : null,
    })),
};

export const demoUpdatesByCrisis: Record<string, CrisisUpdate[]> = {
    "demo-fire-001": [
        {
            id: "upd-fire-1",
            crisis_id: "demo-fire-001",
            updated_by: null,
            update_type: "created",
            message: "Guest reported smoke near the east corridor service closet.",
            created_at: minutesAgo(12),
        },
        {
            id: "upd-fire-2",
            crisis_id: "demo-fire-001",
            updated_by: "demo-staff-001",
            update_type: "assigned",
            message: "Responder dispatched to Floor 7 with security support requested.",
            created_at: minutesAgo(10),
        },
        {
            id: "upd-fire-3",
            crisis_id: "demo-fire-001",
            updated_by: "demo-staff-001",
            update_type: "status_change",
            message: "Corridor cleared and source inspection in progress.",
            created_at: minutesAgo(6),
        },
    ],
    "demo-medical-002": [
        {
            id: "upd-med-1",
            crisis_id: "demo-medical-002",
            updated_by: null,
            update_type: "created",
            message: "Guest fainted near concierge and requires urgent assessment.",
            created_at: minutesAgo(21),
        },
        {
            id: "upd-med-2",
            crisis_id: "demo-medical-002",
            updated_by: "demo-staff-002",
            update_type: "assigned",
            message: "Medical responder assigned and first-aid kit en route.",
            created_at: minutesAgo(19),
        },
    ],
    "demo-security-004": [
        {
            id: "upd-sec-1",
            crisis_id: "demo-security-004",
            updated_by: null,
            update_type: "created",
            message: "Unauthorized access attempt reported by guest.",
            created_at: minutesAgo(85),
        },
        {
            id: "upd-sec-2",
            crisis_id: "demo-security-004",
            updated_by: "demo-staff-003",
            update_type: "resolved",
            message: "Security cleared corridor and escorted individual off premises.",
            created_at: minutesAgo(46),
        },
    ],
};

export const demoReportsByCrisis: Record<string, IncidentReport> = {
    "demo-security-004": {
        id: "report-security-004",
        crisis_id: "demo-security-004",
        generated_at: minutesAgo(44),
        report_content: `INCIDENT SUMMARY

An unauthorized access attempt was reported on Floor 1 north guest corridor. Security responded, verified there was no active threat to guests, and restored controlled access.

RESPONSE TIMELINE

- Guest report received and logged by command center
- Security responder dispatched to corridor entry point
- Individual identified and escorted away from restricted access door
- Corridor cleared and guest reassurance completed

ACTIONS TAKEN

- Access point checked for tampering
- Nearby guests informed that the area was secure
- Security presence increased temporarily in the zone

RESOLUTION

Incident resolved without guest harm or property damage.

RECOMMENDATIONS FOR PREVENTION

- Add clearer restricted-access signage
- Increase camera review coverage near corridor entries during peak hours`,
    },
};

export function getDemoStaffWithAvailability() {
    return demoProfiles
        .filter((profile) => profile.role === "staff" || profile.role === "admin")
        .map((profile) => ({
            profile,
            availability: demoAvailability.find((item) => item.staff_id === profile.id),
        }));
}

export function isDemoId(id: string) {
    return id.startsWith("demo-");
}
