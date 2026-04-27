import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { demoOrganizations } from "@/lib/demo-data";
import { OrganizationPlan } from "@/types/database";

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
}

export async function GET() {
    const { user, profile } = await getApiAuthContext();
    if (!user || !profile || profile.platform_role !== "platform_operator") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("organizations")
            .select("id, name, slug, status, plan, feature_flags, created_at")
            .order("created_at", { ascending: false });

        if (error || !data) {
            return NextResponse.json({ organizations: demoOrganizations, persistence: "demo" });
        }

        return NextResponse.json({
            organizations: data.length > 0 ? data : demoOrganizations,
            persistence: data.length > 0 ? "database" : "demo",
        });
    } catch {
        return NextResponse.json({ organizations: demoOrganizations, persistence: "demo" });
    }
}

export async function POST(req: NextRequest) {
    const { user, profile } = await getApiAuthContext();
    if (!user || !profile || profile.platform_role !== "platform_operator") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const status = typeof body.status === "string" ? body.status : "trial";
    const plan = ["starter", "pro", "enterprise"].includes(body.plan) ? (body.plan as OrganizationPlan) : "starter";

    const featureFlagsByPlan: Record<OrganizationPlan, string[]> = {
        starter: ["basic_reporting", "ai_triage"],
        pro: ["basic_reporting", "ai_triage", "image_analysis", "analytics", "team_invites"],
        enterprise: ["basic_reporting", "ai_triage", "image_analysis", "analytics", "team_invites", "multi_venue_ready", "compliance_exports"],
    };

    if (!name) {
        return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const slug = slugify(name);

    try {
        const { data, error } = await supabase
            .from("organizations")
            .insert({
                name,
                slug,
                status,
                plan,
                feature_flags: featureFlagsByPlan[plan],
            })
            .select("id, name, slug, status, plan, feature_flags, created_at")
            .single();

        if (error || !data) {
            return NextResponse.json(
                {
                    organization: {
                        id: `demo-org-${Date.now()}`,
                        name,
                        slug,
                        status,
                        plan,
                        feature_flags: featureFlagsByPlan[plan],
                        created_at: new Date().toISOString(),
                    },
                    persistence: "demo",
                },
                { status: 201 }
            );
        }

        return NextResponse.json({ organization: data, persistence: "database" }, { status: 201 });
    } catch {
        return NextResponse.json(
            {
                organization: {
                    id: `demo-org-${Date.now()}`,
                    name,
                    slug,
                    status,
                    plan,
                    feature_flags: featureFlagsByPlan[plan],
                    created_at: new Date().toISOString(),
                },
                persistence: "demo",
            },
            { status: 201 }
        );
    }
}
