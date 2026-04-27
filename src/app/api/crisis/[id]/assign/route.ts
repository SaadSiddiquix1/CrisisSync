import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canAccessVenue, getApiAuthContext } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, profile } = await getApiAuthContext();
        if (!user || !profile || !["staff", "admin"].includes(profile.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { staff_id, assigned_by } = body;

        const supabase = await createClient();
        const { data: crisis } = await supabase
            .from("crises")
            .select("id, venue_id")
            .eq("id", id)
            .maybeSingle();

        if (!crisis || !canAccessVenue(profile, crisis.venue_id)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Update crisis
        const { error: crisisUpdateError } = await supabase
            .from("crises")
            .update({
                assigned_staff_id: staff_id,
                status: "assigned",
                acknowledged_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (crisisUpdateError) {
            return NextResponse.json({ error: crisisUpdateError.message }, { status: 500 });
        }

        // Create assignment record
        const { error: assignmentError } = await supabase.from("crisis_assignments").insert({
            crisis_id: id,
            staff_id,
            assigned_by: assigned_by || profile.id || staff_id,
        });

        if (assignmentError) {
            return NextResponse.json({ error: assignmentError.message }, { status: 500 });
        }

        // Log timeline
        const { error: updateError } = await supabase.from("crisis_updates").insert({
            crisis_id: id,
            updated_by: profile.id || staff_id,
            update_type: "assigned",
            message: "Crisis assigned to staff member",
        });

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Update staff availability
        const { error: availabilityError } = await supabase
            .from("staff_availability")
            .upsert({
                staff_id,
                status: "responding",
                updated_at: new Date().toISOString(),
            }, { onConflict: "staff_id" });

        if (availabilityError) {
            return NextResponse.json({ error: availabilityError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Assignment error:", error);
        return NextResponse.json(
            { error: "Failed to assign crisis" },
            { status: 500 }
        );
    }
}
