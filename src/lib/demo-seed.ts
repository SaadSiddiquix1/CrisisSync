import { normalizeAiTriageResult } from "@/lib/crisis-ai";
import { normalizeStatusForDatabase } from "@/lib/crisis-status";
import { createPrivilegedClient } from "@/lib/supabase/privileged";
import { CrisisSeverity, CrisisType } from "@/types/database";
import { normalizeVenueSlug } from "@/lib/compat";

const seedNow = Date.now();

function minutesAgo(minutes: number) {
  return new Date(seedNow - minutes * 60_000).toISOString();
}

async function ensureDemoUser(
  supabase: ReturnType<typeof createPrivilegedClient>,
  params: { email: string; password: string; fullName: string; role: "admin" | "staff"; venueId: string }
) {
  const { data: listedUsers } = await supabase.auth.admin.listUsers();
  const existing = listedUsers?.users?.find((user) => user.email?.toLowerCase() === params.email.toLowerCase());

  const user =
    existing ||
    (
      await supabase.auth.admin.createUser({
        email: params.email,
        password: params.password,
        email_confirm: true,
        user_metadata: { full_name: params.fullName },
      })
    ).data.user;

  if (!user) return null;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const profilePayload = {
    user_id: user.id,
    full_name: params.fullName,
    role: params.role,
    venue_id: params.venueId,
    avatar_url: null,
    is_available: true,
  };

  const profileResult = existingProfile
    ? await supabase.from("profiles").update(profilePayload).eq("id", existingProfile.id)
    : await supabase.from("profiles").insert(profilePayload);

  if (profileResult.error) {
    throw new Error(`Unable to seed profile for ${params.email}: ${profileResult.error.message}`);
  }

  return { id: user.id, email: params.email, password: params.password, role: params.role };
}

export async function seedDemoData() {
  const supabase = createPrivilegedClient();

  const { data: existingVenues, error: venueLookupError } = await supabase
    .from("venues")
    .select("id, name, address, floor_count, created_at")
    .eq("name", "Grand Meridian Hotel");

  if (venueLookupError) {
    return { ok: false, error: venueLookupError.message };
  }

  const venue =
    existingVenues && existingVenues[0]
      ? existingVenues[0]
      : (
          await supabase
            .from("venues")
            .insert({
              name: "Grand Meridian Hotel",
              address: "1 Meridian Square, London",
              floor_count: 12,
            })
            .select()
            .single()
        ).data;

  if (!venue) return { ok: false, error: "Unable to create demo venue." };

  const { data: existingCrises, error: existingCrisesError } = await supabase
    .from("crises")
    .select("id")
    .eq("venue_id", venue.id);

  if (existingCrisesError) {
    return { ok: false, error: existingCrisesError.message };
  }

  const existingCrisisIds = (existingCrises || []).map((row) => row.id);

  if (existingCrisisIds.length > 0) {
    const { error: reportsCleanupError } = await supabase
      .from("incident_reports")
      .delete()
      .in("crisis_id", existingCrisisIds);

    if (reportsCleanupError) {
      return { ok: false, error: reportsCleanupError.message };
    }

    const { error: updatesCleanupError } = await supabase
      .from("crisis_updates")
      .delete()
      .in("crisis_id", existingCrisisIds);

    if (updatesCleanupError) {
      return { ok: false, error: updatesCleanupError.message };
    }
  }

  const { error: cleanupError } = await supabase.from("crises").delete().eq("venue_id", venue.id);

  if (cleanupError) {
    return { ok: false, error: cleanupError.message };
  }

  const demoUsers = await Promise.all([
    ensureDemoUser(supabase, {
      email: "admin@crisissync.demo",
      password: "DemoPass123!",
      fullName: "CrisisSync Demo Admin",
      role: "admin",
      venueId: venue.id,
    }),
    ensureDemoUser(supabase, {
      email: "staff@crisissync.demo",
      password: "DemoPass123!",
      fullName: "CrisisSync Demo Staff",
      role: "staff",
      venueId: venue.id,
    }),
  ]);

  const incidents: Array<{
    crisis_type: CrisisType;
    description: string;
    status: string;
    severity_assessment: CrisisSeverity;
    created_at: string;
    response_started_at?: string;
    resolved_at?: string;
  }> = [
    { crisis_type: "medical", description: "Guest fainted near lobby desk", status: "resolved", severity_assessment: "high", created_at: minutesAgo(180), response_started_at: minutesAgo(176), resolved_at: minutesAgo(168) },
    { crisis_type: "medical", description: "Possible allergic reaction in restaurant", status: "responding", severity_assessment: "high", created_at: minutesAgo(95), response_started_at: minutesAgo(92) },
    { crisis_type: "fire", description: "Smoke smell detected on floor 6", status: "assigned", severity_assessment: "critical", created_at: minutesAgo(70) },
    { crisis_type: "fire", description: "Toaster fire in breakfast kitchen", status: "resolved", severity_assessment: "medium", created_at: minutesAgo(330), response_started_at: minutesAgo(324), resolved_at: minutesAgo(314) },
    { crisis_type: "security", description: "Unauthorized access attempt at service elevator", status: "reported", severity_assessment: "medium", created_at: minutesAgo(40) },
    { crisis_type: "security", description: "Aggressive behavior in bar lounge", status: "assigned", severity_assessment: "high", created_at: minutesAgo(58) },
    { crisis_type: "maintenance", description: "Water leakage near room 214 corridor", status: "responding", severity_assessment: "medium", created_at: minutesAgo(120), response_started_at: minutesAgo(112) },
    { crisis_type: "other", description: "Power fluctuation in meeting hall", status: "reported", severity_assessment: "low", created_at: minutesAgo(22) },
  ];

  const inserted = await supabase
    .from("crises")
    .insert(
      incidents.map((incident, index) => {
        const triage = normalizeAiTriageResult({
          severity: incident.severity_assessment,
          confidence: 0.86,
          confidence_score: 0.86,
          reasoning: `Demo AI assessment generated for ${incident.crisis_type} incident ${index + 1}.`,
          guest_instructions: ["Stay calm", "Move to a safe area", "Wait for staff"],
          staff_checklist: [
            { task: "Acknowledge incident", priority: "immediate", completed: true },
            { task: "Dispatch nearest responder", priority: "urgent", completed: false },
            { task: "Log timeline update", priority: "standard", completed: false },
          ],
          responder_focus: "Secure safety perimeter first.",
          prevention_insights: "Increase routine patrols and sensor checks.",
          summary: `Seeded ${incident.crisis_type} scenario for live demo rehearsals.`,
          model_used: "gemini",
        });

        return {
          venue_id: venue.id,
          guest_name: "Demo Guest",
          room_number: "101",
          location_description: "Main area",
          crisis_type: incident.crisis_type,
          description: incident.description,
          created_at: incident.created_at,
          resolved_at: incident.resolved_at ?? null,
          acknowledged_at: incident.response_started_at ?? null,
          severity: triage?.severity ?? incident.severity_assessment,
          status: normalizeStatusForDatabase(incident.status) ?? "reported",
          ai_triage_result: triage,
          assigned_staff_id: null,
          photo_url: null,
        };
      })
    )
    .select();

  if (inserted.error) {
    return { ok: false, error: inserted.error.message };
  }

  for (const crisis of inserted.data || []) {
    await supabase.from("crisis_updates").insert([
      { crisis_id: crisis.id, updated_by: null, message: "Incident reported and triaged.", update_type: "created" },
      { crisis_id: crisis.id, updated_by: null, message: "Responder dispatched.", update_type: "assignment" },
      { crisis_id: crisis.id, updated_by: null, message: "On site and assessing.", update_type: "note" },
    ]);
  }

  const resolved = (inserted.data || []).filter((c) => c.status === "resolved").slice(0, 2);
  for (const crisis of resolved) {
    await supabase.from("incident_reports").insert({
      crisis_id: crisis.id,
      report_content: `# Incident Report\n\n## Summary\nResolved ${crisis.crisis_type} incident for demo rehearsals.\n\n## Outcome\nThe response was completed safely and logged for post-incident review.`,
    });
  }

  return {
    ok: true,
    venue_id: venue.id,
    venue_slug: normalizeVenueSlug(venue.name),
    seeded_crises: inserted.data?.length || 0,
    demo_users: demoUsers.filter(Boolean),
  };
}
