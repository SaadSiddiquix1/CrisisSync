import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDemoVenuesByOrganization } from "@/lib/demo-data";
import { venueModeZoneDefaults } from "@/lib/domain";
import { VenueMode } from "@/types/database";

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
}

function normalizeMode(input: unknown): VenueMode {
    return ["hotel", "resort", "restaurant", "event_venue", "nightlife", "mixed_use"].includes(String(input))
        ? (input as VenueMode)
        : "hotel";
}

export async function GET(req: NextRequest) {
    const { user, profile } = await getApiAuthContext();
    if (!user || !profile || profile.platform_role !== "platform_operator") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = req.nextUrl.searchParams.get("organization_id");
    const supabase = await createClient();

    try {
        let query = supabase
            .from("venues")
            .select("id, organization_id, name, slug, mode, address, floor_count, created_at")
            .order("created_at", { ascending: false });

        if (organizationId) {
            query = query.eq("organization_id", organizationId);
        }

        const { data, error } = await query;
        if (error || !data) {
            return NextResponse.json({ venues: getDemoVenuesByOrganization(organizationId), persistence: "demo" });
        }

        return NextResponse.json({
            venues: data.length > 0 ? data : getDemoVenuesByOrganization(organizationId),
            persistence: data.length > 0 ? "database" : "demo",
        });
    } catch {
        return NextResponse.json({ venues: getDemoVenuesByOrganization(organizationId), persistence: "demo" });
    }
}

export async function POST(req: NextRequest) {
    const { user, profile } = await getApiAuthContext();
    if (!user || !profile || profile.platform_role !== "platform_operator") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const organizationId = typeof body.organization_id === "string" ? body.organization_id : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const floorCount = Number(body.floor_count);
    const mode = normalizeMode(body.mode);

    if (!organizationId || !name || !address || !Number.isFinite(floorCount) || floorCount < 1) {
        return NextResponse.json(
            { error: "Organization, venue name, address, and floor count are required" },
            { status: 400 }
        );
    }

    const supabase = await createClient();
    const slug = slugify(name);

    try {
        const { data, error } = await supabase
            .from("venues")
            .insert({
                organization_id: organizationId,
                name,
                slug,
                mode,
                address,
                floor_count: floorCount,
            })
            .select("id, organization_id, name, slug, mode, address, floor_count, created_at")
            .single();

        if (error || !data) {
            return NextResponse.json(
                {
                    venue: {
                        id: `demo-venue-${Date.now()}`,
                        organization_id: organizationId,
                        name,
                        slug,
                        mode,
                        address,
                        floor_count: floorCount,
                        zone_summary: venueModeZoneDefaults[mode].map((zone) => zone.replace("_", " ")),
                        created_at: new Date().toISOString(),
                    },
                    persistence: "demo",
                },
                { status: 201 }
            );
        }

        return NextResponse.json(
            {
                venue: {
                    ...data,
                    zone_summary: venueModeZoneDefaults[mode].map((zone) => zone.replace("_", " ")),
                },
                persistence: "database",
            },
            { status: 201 }
        );
    } catch {
        return NextResponse.json(
            {
                venue: {
                    id: `demo-venue-${Date.now()}`,
                    organization_id: organizationId,
                    name,
                    slug,
                    mode,
                    address,
                    floor_count: floorCount,
                    zone_summary: venueModeZoneDefaults[mode].map((zone) => zone.replace("_", " ")),
                    created_at: new Date().toISOString(),
                },
                persistence: "demo",
            },
            { status: 201 }
        );
    }
}
