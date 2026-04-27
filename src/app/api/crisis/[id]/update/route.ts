import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { runAiTriage } from "@/lib/ai-triage";
import { getConfidenceValue, getReasoningText, normalizeAiTriageResult } from "@/lib/crisis-ai";
import { normalizeStatusForDatabase } from "@/lib/crisis-status";
import { createPrivilegedClient } from "@/lib/supabase/privileged";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
  const supabase = createPrivilegedClient();

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, assigned_to, note, retriage } = body;
  const normalizedStatus = normalizeStatusForDatabase(status);

  const { data: crisis } = await supabase
    .from("crises")
    .select("*, venue:venues(name)")
    .eq("id", params.id)
    .single();

  if (!crisis) return NextResponse.json({ error: "Crisis not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  const timelineEntries: Array<{ content: string; update_type: string }> = [];
  const { data: actingProfile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (normalizedStatus) {
    updates.status = normalizedStatus;
    if ((normalizedStatus === "assigned" || normalizedStatus === "acknowledged" || normalizedStatus === "responding") && !crisis.acknowledged_at) {
      updates.acknowledged_at = new Date().toISOString();
    }
    if (normalizedStatus === "resolved" || normalizedStatus === "dismissed") updates.resolved_at = new Date().toISOString();
    timelineEntries.push({ content: `Status changed to ${normalizedStatus.replace(/_/g, " ")}`, update_type: "status_change" });
  }

  if (assigned_to !== undefined) {
    let assignedProfileId: string | null = null;

    if (assigned_to) {
      const { data: assignedProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", assigned_to)
        .maybeSingle();

      if (!assignedProfile?.id) {
        return NextResponse.json({ error: "Assigned staff profile not found" }, { status: 400 });
      }

      assignedProfileId = assignedProfile.id;
    }

    updates.assigned_staff_id = assignedProfileId;
    timelineEntries.push({ content: assignedProfileId ? "Crisis assigned to staff member" : "Assignment cleared", update_type: "assignment" });
  }

  if (note) timelineEntries.push({ content: note, update_type: "note" });

  if (retriage || normalizedStatus === "responding") {
    try {
      const newTriage = normalizeAiTriageResult(
        await runAiTriage({
        crisis_type: crisis.crisis_type,
        description: `${crisis.description}\n\nStatus update: ${note || normalizedStatus || "Responding"}`,
        location_description: crisis.location_description,
        severity_assessment: crisis.severity ?? "medium",
        venue_name: crisis.venue?.name,
        })
      );

      if (!newTriage) {
        throw new Error("AI retriage returned no result");
      }

      updates.ai_triage_result = newTriage;
      updates.severity = newTriage.severity ?? crisis.severity;

      timelineEntries.push({
        content: `AI re-assessed: ${(newTriage.severity ?? "medium").toUpperCase()} severity (${Math.round(getConfidenceValue(newTriage) * 100)}% confidence). ${getReasoningText(newTriage.reasoning)}`,
        update_type: "ai_retriage",
      });
    } catch (e) {
      console.warn("Re-triage failed:", e);
    }
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from("crises").update(updates).eq("id", params.id);
  }

  for (const entry of timelineEntries) {
    await supabase.from("crisis_updates").insert({
      crisis_id: params.id,
      updated_by: actingProfile?.id ?? null,
      update_type: entry.update_type,
      message: `${actingProfile?.full_name || user.email}: ${entry.content}`,
    });
  }

  const { data: updatedCrisis } = await supabase
    .from("crises")
    .select("*")
    .eq("id", params.id)
    .single();

  return NextResponse.json({ crisis: updatedCrisis });
}
