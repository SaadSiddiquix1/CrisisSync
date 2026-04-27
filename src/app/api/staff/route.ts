import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiAuthContext } from "@/lib/auth";
import { getDemoStaffWithAvailability } from "@/lib/demo-data";

// GET all staff with availability
export async function GET() {
    try {
        const { user, profile } = await getApiAuthContext();
        if (!user || !profile || !["staff", "admin"].includes(profile.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createClient();

        let profilesQuery = supabase
            .from("profiles")
            .select("*")
            .in("role", ["staff", "admin"]);

        if (profile.organization_id) {
            profilesQuery = profilesQuery.eq("organization_id", profile.organization_id);
        }

        if (profile.organization_role !== "org_admin" && profile.allowed_venue_ids.length > 0) {
            profilesQuery = profilesQuery.in("default_venue_id", profile.allowed_venue_ids);
        }

        const { data: profiles, error } = await profilesQuery;

        if (error) {
            return NextResponse.json(getDemoStaffWithAvailability());
        }

        // Get availability for each staff member
        const staffIds = profiles?.map((p) => p.id) || [];
        const { data: availability } = await supabase
            .from("staff_availability")
            .select("*")
            .in("staff_id", staffIds);

        const enriched = profiles?.map((p) => ({
            profile: p,
            availability: availability?.find((a) => a.staff_id === p.id),
        }));

        if (!enriched || enriched.length === 0) {
            return NextResponse.json(getDemoStaffWithAvailability());
        }

        return NextResponse.json(enriched);
    } catch (error) {
        console.error("Staff fetch error:", error);
        return NextResponse.json(getDemoStaffWithAvailability());
    }
}

// PATCH staff availability
export async function PATCH(req: NextRequest) {
    try {
        const { user, profile } = await getApiAuthContext();
        if (!user || !profile || !["staff", "admin"].includes(profile.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { staff_id, status } = body;

        if (typeof staff_id !== "string" || !staff_id) {
            return NextResponse.json({ error: "staff_id is required" }, { status: 400 });
        }

        const supabase = await createClient();

        await supabase
            .from("staff_availability")
            .upsert(
                {
                    staff_id,
                    status,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "staff_id" }
            );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Staff availability update error:", error);
        return NextResponse.json(
            { error: "Failed to update availability" },
            { status: 500 }
        );
    }
}
