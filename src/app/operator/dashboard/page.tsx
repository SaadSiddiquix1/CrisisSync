import { Building2, ShieldCheck, Users, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { demoOrganizationAdminInvites, demoOrganizations, demoVenues } from "@/lib/demo-data";
import { OperatorConsole } from "@/components/operator-console";
import { Organization, OrganizationAdminInvite, Venue } from "@/types/database";

export default async function OperatorDashboardPage() {
    const supabase = await createClient();

    let organizations: Organization[] = demoOrganizations;
    let invites: OrganizationAdminInvite[] = demoOrganizationAdminInvites;
    let venues: Venue[] = demoVenues;

    try {
        const { data } = await supabase
            .from("organizations")
            .select("id, name, slug, status, plan, feature_flags, created_at")
            .order("created_at", { ascending: false });

        if (data && data.length > 0) {
            organizations = data as Organization[];
        }
    } catch {
        organizations = demoOrganizations;
    }

    try {
        const { data } = await supabase
            .from("organization_admin_invites")
            .select("id, organization_id, email, full_name, role, status, assigned_venue_id, assigned_venue_ids, default_venue_id, created_at")
            .order("created_at", { ascending: false });

        if (data && data.length > 0) {
            invites = data as OrganizationAdminInvite[];
        }
    } catch {
        invites = demoOrganizationAdminInvites;
    }

    try {
        const { data } = await supabase
            .from("venues")
            .select("id, organization_id, name, slug, mode, address, floor_count, created_at")
            .order("created_at", { ascending: false });

        if (data && data.length > 0) {
            venues = data as Venue[];
        }
    } catch {
        venues = demoVenues;
    }

    return (
        <div className="mx-auto max-w-[1600px] space-y-6">
            <section className="panel-surface overflow-hidden px-4 py-5 sm:px-5 lg:px-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <div className="eyebrow mb-3">Platform control</div>
                        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">Operator dashboard</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#90A2BC]">
                            This is the SaaS owner surface. It is where CrisisSync grows from a single
                            deployment into a multi-tenant hospitality platform with organizations,
                            venues, administrators, and plan controls.
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: "Organizations", value: organizations.length, color: "#68B0FF", icon: Building2 },
                        { label: "Live venues", value: venues.length, color: "#7FD8FF", icon: Building2 },
                        { label: "Pro+ plans", value: organizations.filter((org) => org.plan === "pro" || org.plan === "enterprise").length, color: "#3DDC97", icon: ShieldCheck },
                        { label: "Trial tenants", value: organizations.filter((org) => org.status === "trial").length, color: "#FF9D42", icon: Zap },
                        { label: "Pending invites", value: invites.length, color: "#9B8CFF", icon: Users },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 transition duration-200 hover:-translate-y-1 hover:border-white/12 hover:bg-white/[0.05]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="eyebrow mb-2">{stat.label}</div>
                                    <div className="text-3xl font-semibold text-white">{stat.value}</div>
                                </div>
                                <div
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                    style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                                >
                                    <stat.icon className="h-4.5 w-4.5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <OperatorConsole initialOrganizations={organizations} initialInvites={invites} initialVenues={venues} />
        </div>
    );
}
