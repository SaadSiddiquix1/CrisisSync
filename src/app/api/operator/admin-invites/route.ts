import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { demoOrganizationAdminInvites } from "@/lib/demo-data";
import { OrganizationRole } from "@/types/database";

export async function GET() {
    const { user, profile } = await getApiAuthContext();
    if (!user || !profile || profile.platform_role !== "platform_operator") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("organization_admin_invites")
            .select("id, organization_id, email, full_name, role, status, assigned_venue_id, assigned_venue_ids, default_venue_id, created_at")
            .order("created_at", { ascending: false });

        if (error || !data) {
            return NextResponse.json({ invites: demoOrganizationAdminInvites, persistence: "demo" });
        }

        return NextResponse.json({
            invites: data.length > 0 ? data : demoOrganizationAdminInvites,
            persistence: data.length > 0 ? "database" : "demo",
        });
    } catch {
        return NextResponse.json({ invites: demoOrganizationAdminInvites, persistence: "demo" });
    }
}

export async function POST(req: NextRequest) {
    const { user, profile } = await getApiAuthContext();
    if (!user || !profile || profile.platform_role !== "platform_operator") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const organizationId = typeof body.organization_id === "string" ? body.organization_id : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const assignedVenueIds = Array.isArray(body.assigned_venue_ids)
        ? body.assigned_venue_ids.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
        : [];
    const defaultVenueId =
        typeof body.default_venue_id === "string" && body.default_venue_id.length > 0 ? body.default_venue_id : null;
    const role: OrganizationRole = ["org_admin", "venue_admin", "manager", "staff"].includes(body.role)
        ? (body.role as OrganizationRole)
        : "org_admin";

    if (!organizationId || !email || !fullName) {
        return NextResponse.json({ error: "Organization, name, and email are required" }, { status: 400 });
    }

    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("organization_admin_invites")
            .insert({
                organization_id: organizationId,
                email,
                full_name: fullName,
                role,
                assigned_venue_id: defaultVenueId,
                assigned_venue_ids: assignedVenueIds,
                default_venue_id: defaultVenueId,
                status: "pending",
            })
            .select("id, organization_id, email, full_name, role, status, assigned_venue_id, assigned_venue_ids, default_venue_id, created_at")
            .single();

        if (error || !data) {
            return NextResponse.json(
                {
                    invite: {
                        id: `demo-invite-${Date.now()}`,
                        organization_id: organizationId,
                        email,
                        full_name: fullName,
                        role,
                        assigned_venue_id: defaultVenueId ?? undefined,
                        assigned_venue_ids: assignedVenueIds,
                        default_venue_id: defaultVenueId ?? undefined,
                        status: "pending",
                        created_at: new Date().toISOString(),
                    },
                    persistence: "demo",
                },
                { status: 201 }
            );
        }

        return NextResponse.json({ invite: data, persistence: "database" }, { status: 201 });
    } catch {
        return NextResponse.json(
            {
                invite: {
                    id: `demo-invite-${Date.now()}`,
                    organization_id: organizationId,
                        email,
                        full_name: fullName,
                        role,
                        assigned_venue_id: defaultVenueId ?? undefined,
                        assigned_venue_ids: assignedVenueIds,
                        default_venue_id: defaultVenueId ?? undefined,
                        status: "pending",
                        created_at: new Date().toISOString(),
                    },
                persistence: "demo",
            },
            { status: 201 }
        );
    }
}
