import { NextResponse } from "next/server";
import { createPrivilegedClient } from "@/lib/supabase/privileged";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createPrivilegedClient();
    const { data, error } = await supabase
      .from("crises")
      .select(`
        id,
        crisis_type,
        description,
        guest_name,
        room_number,
        location_description,
        severity,
        status,
        ai_triage_result,
        created_at,
        acknowledged_at,
        resolved_at
      `)
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Crisis not found" }, { status: 404 });
    }

    return NextResponse.json({ crisis: data });
  } catch (error) {
    console.error("Public crisis status error:", error);
    return NextResponse.json({ error: "Failed to load crisis status" }, { status: 500 });
  }
}
