import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { demoOrganizations, demoOrganizationAdminInvites, demoVenues } from "@/lib/demo-data";
import { buildInviteVenueSnapshot } from "@/lib/tenant";

type Params = { params: Promise<{ inviteId: string }> };

export async function GET(_: Request, { params }: Params) {
    const { inviteId } = await params;
    const supabase = await createClient();

    const demoInvite = demoOrganizationAdminInvites.find((invite) => invite.id === inviteId);
    if (demoInvite) {
        return NextResponse.json({
            invite: {
                ...demoInvite,
                organization: demoOrganizations.find((org) => org.id === demoInvite.organization_id) ?? null,
                venue: demoVenues.find((venue) => venue.id === demoInvite.assigned_venue_id) ?? null,
                venues: buildInviteVenueSnapshot(demoInvite, demoVenues),
            },
            persistence: "demo",
        });
    }

    try {
        const { data, error } = await supabase
            .from("organization_admin_invites")
            .select("id, organization_id, email, full_name, role, status, assigned_venue_id, assigned_venue_ids, default_venue_id, created_at")
            .eq("id", inviteId)
            .maybeSingle();

        if (error || !data) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        const assignedVenueIds = Array.isArray(data.assigned_venue_ids)
            ? data.assigned_venue_ids.filter(Boolean)
            : data.assigned_venue_id
              ? [data.assigned_venue_id]
              : [];

        const [{ data: organization }, { data: venue }, { data: venues }] = await Promise.all([
            supabase
                .from("organizations")
                .select("id, name, slug, status, created_at")
                .eq("id", data.organization_id)
                .maybeSingle(),
            data.assigned_venue_id
                ? supabase
                    .from("venues")
                    .select("id, organization_id, name, slug, mode, address, floor_count, created_at")
                    .eq("id", data.assigned_venue_id)
                    .maybeSingle()
                : Promise.resolve({ data: null }),
            assignedVenueIds.length > 0
                ? supabase
                    .from("venues")
                    .select("id, organization_id, name, slug, mode, address, floor_count, created_at")
                    .in("id", assignedVenueIds)
                : Promise.resolve({ data: [] }),
        ]);

        return NextResponse.json({
            invite: {
                ...data,
                organization: organization ?? null,
                venue: venue ?? null,
                venues: venues ?? [],
            },
            persistence: "database",
        });
    } catch {
        return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
}
