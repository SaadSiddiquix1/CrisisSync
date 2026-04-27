import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { demoOrganizationAdminInvites } from "@/lib/demo-data";
import { normalizeAssignedVenueIds } from "@/lib/tenant";

type Params = { params: Promise<{ inviteId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    const { inviteId } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "You must be signed in to accept the invite." }, { status: 401 });
    }

    const body = await req.json();
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : user.user_metadata?.full_name ?? "Team Member";

    const demoInvite = demoOrganizationAdminInvites.find((invite) => invite.id === inviteId);
    if (demoInvite) {
        const appRole = demoInvite.role === "org_admin" || demoInvite.role === "venue_admin" ? "admin" : "staff";
        return NextResponse.json({
            success: true,
            role: appRole,
            redirect_to: appRole === "admin" ? "/admin/dashboard" : "/staff/dashboard",
            persistence: "demo",
        });
    }

    try {
        const { data: invite, error: inviteError } = await supabase
            .from("organization_admin_invites")
            .select("id, organization_id, email, full_name, role, status, assigned_venue_id, assigned_venue_ids, default_venue_id")
            .eq("id", inviteId)
            .maybeSingle();

        if (inviteError || !invite) {
            return NextResponse.json({ error: "Invite not found." }, { status: 404 });
        }

        if (invite.status !== "pending") {
            return NextResponse.json({ error: "This invite is no longer active." }, { status: 400 });
        }

        if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
            return NextResponse.json({ error: "Signed-in email does not match the invited address." }, { status: 403 });
        }

        const appRole = invite.role === "org_admin" || invite.role === "venue_admin" ? "admin" : "staff";
        const assignedVenueIds = normalizeAssignedVenueIds(invite);
        const defaultVenueId = invite.default_venue_id ?? assignedVenueIds[0] ?? "";

        const { error: profileError } = await supabase.from("profiles").upsert(
            {
                user_id: user.id,
                full_name: fullName || invite.full_name,
                role: appRole,
                organization_id: invite.organization_id,
                organization_role: invite.role,
                venue_id: defaultVenueId,
                default_venue_id: defaultVenueId,
                is_available: true,
            },
            { onConflict: "user_id" }
        );

        if (profileError) {
            return NextResponse.json({ error: "Failed to provision your workspace profile." }, { status: 500 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (profile?.id) {
            await supabase.from("organization_members").upsert(
                {
                    organization_id: invite.organization_id,
                    profile_id: profile.id,
                    role: invite.role,
                },
                { onConflict: "organization_id,profile_id" }
            );

            if (assignedVenueIds.length > 0) {
                await supabase.from("venue_memberships").upsert(
                    assignedVenueIds.map((venueId) => ({
                        organization_id: invite.organization_id,
                        venue_id: venueId,
                        profile_id: profile.id,
                        role: invite.role,
                        is_default: venueId === defaultVenueId,
                    })),
                    { onConflict: "venue_id,profile_id" }
                );
            }
        }

        await supabase
            .from("organization_admin_invites")
            .update({ status: "accepted" })
            .eq("id", inviteId);

        return NextResponse.json({
            success: true,
            role: appRole,
            redirect_to: appRole === "admin" ? "/admin/dashboard" : "/staff/dashboard",
            persistence: "database",
        });
    } catch {
        return NextResponse.json({ error: "Failed to accept invite." }, { status: 500 });
    }
}
