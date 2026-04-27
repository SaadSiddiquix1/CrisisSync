import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { generateIncidentReport } from "@/lib/ai-triage";
import { createPrivilegedClient } from "@/lib/supabase/privileged";
import { getCrisisAiTriage, getConfidenceValue, getReasoningText } from "@/lib/crisis-ai";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
  const supabase = createPrivilegedClient();

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: crisis } = await supabase
    .from("crises")
    .select("*, venue:venues(name), updates:crisis_updates(*)")
    .eq("id", params.id)
    .single();

  if (!crisis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const triage = getCrisisAiTriage(crisis);
  const report = await generateIncidentReport({
    id: crisis.id,
    crisis_type: crisis.crisis_type,
    description: crisis.description,
    guest_name: crisis.guest_name,
    room_number: crisis.room_number,
    location_description: crisis.location_description,
    ai_severity: triage?.severity ?? crisis.severity,
    ai_confidence: getConfidenceValue(triage),
    ai_reasoning: getReasoningText(triage?.reasoning),
    status: crisis.status,
    created_at: crisis.created_at,
    resolved_at: crisis.resolved_at,
    venue_name: crisis.venue?.name,
    updates: (crisis.updates ?? []).map((update: { message?: string; created_at: string; updated_by?: string | null; update_type: string }) => ({
      content: update.message ?? "",
      created_at: update.created_at,
      author_name: update.updated_by ?? "System",
      update_type: update.update_type,
    })),
  });

  const { data: existingReport } = await supabase
    .from("incident_reports")
    .select("id, generated_at")
    .eq("crisis_id", crisis.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    crisis_id: crisis.id,
    report_content: report.markdown,
  };

  const { data: saved } = existingReport
    ? await supabase
        .from("incident_reports")
        .update(payload)
        .eq("id", existingReport.id)
        .select()
        .single()
    : await supabase
        .from("incident_reports")
        .insert(payload)
        .select()
        .single();

  return NextResponse.json({
    report: {
      ...(saved ?? {}),
      crisis_id: crisis.id,
      report_markdown: report.markdown,
    },
  });
}
