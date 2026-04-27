"use client";

import { useMemo, useState } from "react";
import { Building2, Copy, Loader2, MailPlus, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { venueModeLabels, venueModeZoneDefaults } from "@/lib/domain";
import { normalizeAssignedVenueIds } from "@/lib/tenant";
import { Organization, OrganizationAdminInvite, OrganizationPlan, Venue, VenueMode } from "@/types/database";

type OperatorConsoleProps = {
    initialOrganizations: Organization[];
    initialInvites: OrganizationAdminInvite[];
    initialVenues: Venue[];
};

export function OperatorConsole({
    initialOrganizations,
    initialInvites,
    initialVenues,
}: OperatorConsoleProps) {
    const [organizations, setOrganizations] = useState(initialOrganizations);
    const [invites, setInvites] = useState(initialInvites);
    const [venues, setVenues] = useState(initialVenues);
    const [orgName, setOrgName] = useState("");
    const [orgStatus, setOrgStatus] = useState<"trial" | "active" | "inactive">("trial");
    const [orgPlan, setOrgPlan] = useState<OrganizationPlan>("starter");
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminRole, setAdminRole] = useState<"org_admin" | "venue_admin" | "manager">("org_admin");
    const [selectedOrganizationId, setSelectedOrganizationId] = useState(initialOrganizations[0]?.id || "");
    const [inviteVenueIds, setInviteVenueIds] = useState<string[]>([]);
    const [inviteDefaultVenueId, setInviteDefaultVenueId] = useState("");
    const [venueOrganizationId, setVenueOrganizationId] = useState(initialOrganizations[0]?.id || "");
    const [venueName, setVenueName] = useState("");
    const [venueAddress, setVenueAddress] = useState("");
    const [venueMode, setVenueMode] = useState<VenueMode>("hotel");
    const [venueFloors, setVenueFloors] = useState("12");
    const [savingOrg, setSavingOrg] = useState(false);
    const [savingInvite, setSavingInvite] = useState(false);
    const [savingVenue, setSavingVenue] = useState(false);
    const [message, setMessage] = useState("");

    const organizationOptions = useMemo(() => organizations, [organizations]);
    const organizationMap = useMemo(
        () => new Map(organizations.map((organization) => [organization.id, organization])),
        [organizations]
    );
    const inviteBase = typeof window !== "undefined" ? window.location.origin : "";
    const planLabels: Record<OrganizationPlan, string> = {
        starter: "Starter",
        pro: "Pro",
        enterprise: "Enterprise",
    };
    const planFeatures: Record<OrganizationPlan, string[]> = {
        starter: ["Basic reporting", "AI triage", "Single venue launch"],
        pro: ["Image analysis", "Advanced analytics", "Team invites"],
        enterprise: ["Multi-property readiness", "Compliance exports", "Custom workflows"],
    };
    const portfolioSignals = useMemo(
        () =>
            organizations.map((organization) => {
                const venueCount = venues.filter((venue) => venue.organization_id === organization.id).length;
                const inviteCount = invites.filter((invite) => invite.organization_id === organization.id && invite.status === "pending").length;
                const usage = organization.usage_snapshot ?? {
                    venues: venueCount,
                    staff: inviteCount + 1,
                    incidents_this_month: venueCount * 8 + inviteCount * 3,
                };
                return { organization, venueCount, inviteCount, usage };
            }),
        [organizations, venues, invites]
    );
    const inviteVenueOptions = useMemo(
        () => venues.filter((venue) => venue.organization_id === selectedOrganizationId),
        [selectedOrganizationId, venues]
    );

    const createOrganization = async () => {
        if (!orgName.trim()) return;
        setSavingOrg(true);
        setMessage("");

        try {
            const res = await fetch("/api/operator/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: orgName, status: orgStatus, plan: orgPlan }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create organization");

            setOrganizations((prev) => [data.organization, ...prev]);
            setSelectedOrganizationId(data.organization.id);
            setVenueOrganizationId(data.organization.id);
            setOrgName("");
            setOrgPlan("starter");
            setMessage(
                data.persistence === "demo"
                    ? "Organization created in demo mode. Run the SaaS migration to persist it."
                    : "Organization created successfully."
            );
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Failed to create organization.");
        } finally {
            setSavingOrg(false);
        }
    };

    const inviteAdmin = async () => {
        if (!selectedOrganizationId || !adminName.trim() || !adminEmail.trim()) return;
        setSavingInvite(true);
        setMessage("");

        try {
            const res = await fetch("/api/operator/admin-invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organization_id: selectedOrganizationId,
                    full_name: adminName,
                    email: adminEmail,
                    role: adminRole,
                    assigned_venue_ids: adminRole === "org_admin" ? [] : inviteVenueIds,
                    default_venue_id: adminRole === "org_admin" ? undefined : inviteDefaultVenueId || inviteVenueIds[0],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create invite");

            setInvites((prev) => [data.invite, ...prev]);
            setAdminName("");
            setAdminEmail("");
            setAdminRole("org_admin");
            setInviteVenueIds([]);
            setInviteDefaultVenueId("");
            setMessage(
                data.persistence === "demo"
                    ? "Invite created in demo mode. Add the invite table migration to persist it."
                    : "Admin invite created successfully."
            );
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Failed to create invite.");
        } finally {
            setSavingInvite(false);
        }
    };

    const createVenue = async () => {
        if (!venueOrganizationId || !venueName.trim() || !venueAddress.trim() || !venueFloors.trim()) return;
        setSavingVenue(true);
        setMessage("");

        try {
            const res = await fetch("/api/operator/venues", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organization_id: venueOrganizationId,
                    name: venueName,
                    address: venueAddress,
                    mode: venueMode,
                    floor_count: Number(venueFloors),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create venue");

            setVenues((prev) => [data.venue, ...prev]);
            setVenueName("");
            setVenueAddress("");
            setVenueMode("hotel");
            setVenueFloors("12");
            setMessage(
                data.persistence === "demo"
                    ? "Venue created in demo mode. Run the SaaS migration to persist it."
                    : "Venue created successfully."
            );
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Failed to create venue.");
        } finally {
            setSavingVenue(false);
        }
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="panel-surface overflow-hidden">
                <div className="border-b border-white/8 px-5 py-4">
                    <div className="eyebrow mb-2">Tenant portfolio</div>
                    <h2 className="text-lg font-semibold text-white">Organizations</h2>
                </div>

                <div className="space-y-3 px-4 py-4">
                    {organizations.map((organization) => (
                        <div
                            key={organization.id}
                            className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 transition duration-200 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05]"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="text-lg font-semibold text-white">{organization.name}</div>
                                    <div className="mt-1 text-sm text-[#8DA1BD]">{organization.slug}</div>
                                </div>
                                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#AFC0D8]">
                                    {organization.status} • {planLabels[organization.plan ?? "starter"]}
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-[#7F96B7]">
                                Created {new Date(organization.created_at).toLocaleDateString()}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {(Array.isArray(organization.feature_flags) ? organization.feature_flags : Object.keys(organization.feature_flags ?? {})).slice(0, 4).map((feature: string) => (
                                    <span
                                        key={feature}
                                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-[#B9CAE0]"
                                    >
                                        {feature.replace(/_/g, " ")}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 grid gap-2 rounded-[1rem] border border-white/8 bg-black/10 p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-[0.24em] text-[#7F96B7]">
                                        Venues
                                    </span>
                                    <span className="text-xs text-[#C8D6EA]">
                                        {venues.filter((venue) => venue.organization_id === organization.id).length}
                                    </span>
                                </div>
                                {venues
                                    .filter((venue) => venue.organization_id === organization.id)
                                    .slice(0, 3)
                                    .map((venue) => (
                                        <div
                                            key={venue.id}
                                            className="rounded-[0.95rem] border border-white/8 bg-white/[0.03] px-3 py-2"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-medium text-white">{venue.name}</div>
                                                    <div className="mt-1 text-xs text-[#8DA1BD]">
                                                        {venue.mode ? venueModeLabels[venue.mode] : "Venue"} • {venue.floor_count} floors
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs text-[#7F96B7]">
                                                    {venue.address}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            <div className="mt-4 grid gap-2 md:grid-cols-2">
                                <div className="rounded-[1rem] border border-white/8 bg-black/10 px-3 py-3">
                                    <div className="eyebrow mb-1">Delegated admins</div>
                                    <div className="text-sm font-medium text-white">
                                        {invites.filter((invite) => invite.organization_id === organization.id && ["org_admin", "venue_admin"].includes(invite.role)).length}
                                    </div>
                                </div>
                                <div className="rounded-[1rem] border border-white/8 bg-black/10 px-3 py-3">
                                    <div className="eyebrow mb-1">Feature pack</div>
                                    <div className="text-sm font-medium text-white">
                                        {(Array.isArray(organization.feature_flags) ? organization.feature_flags : Object.keys(organization.feature_flags ?? {})).slice(0, 2).join(", ") || "Base"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <aside className="space-y-6">
                <div className="panel-surface p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#9FD0FF]" />
                        <h3 className="text-lg font-semibold text-white">Create organization</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="eyebrow mb-2 block">Organization name</label>
                            <Input
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="Grand Horizon Hospitality"
                                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                            />
                        </div>
                        <div>
                            <label className="eyebrow mb-2 block">Status</label>
                            <select
                                value={orgStatus}
                                onChange={(e) => setOrgStatus(e.target.value as "trial" | "active" | "inactive")}
                                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none"
                            >
                                <option value="trial">Trial</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label className="eyebrow mb-2 block">Plan</label>
                            <select
                                value={orgPlan}
                                onChange={(e) => setOrgPlan(e.target.value as OrganizationPlan)}
                                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none"
                            >
                                <option value="starter">Starter</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[#9CB2CF]">
                            Included: {planFeatures[orgPlan].join(", ")}
                        </div>
                        <Button
                            type="button"
                            onClick={createOrganization}
                            disabled={savingOrg || !orgName.trim()}
                            className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#68B0FF] to-[#2C73FF] text-white"
                        >
                            {savingOrg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create organization
                        </Button>
                    </div>
                </div>

                <div className="panel-surface p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <MailPlus className="h-4 w-4 text-[#9FD0FF]" />
                        <h3 className="text-lg font-semibold text-white">Invite org admin</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="eyebrow mb-2 block">Organization</label>
                            <select
                                value={selectedOrganizationId}
                                onChange={(e) => setSelectedOrganizationId(e.target.value)}
                                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none"
                            >
                                <option value="">Select organization</option>
                                {organizationOptions.map((organization) => (
                                    <option key={organization.id} value={organization.id}>
                                        {organization.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="eyebrow mb-2 block">Admin name</label>
                            <Input
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                placeholder="Sophie Grant"
                                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                            />
                        </div>
                        <div>
                            <label className="eyebrow mb-2 block">Admin email</label>
                            <Input
                                type="email"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                placeholder="admin@clientbrand.com"
                                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                            />
                        </div>
                        <div>
                            <label className="eyebrow mb-2 block">Delegation role</label>
                            <select
                                value={adminRole}
                                onChange={(e) => setAdminRole(e.target.value as "org_admin" | "venue_admin" | "manager")}
                                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none"
                            >
                                <option value="org_admin">Portfolio admin</option>
                                <option value="venue_admin">Venue admin</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>
                        {adminRole !== "org_admin" && (
                            <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                                <div className="eyebrow mb-3">Venue assignments</div>
                                <div className="space-y-2">
                                    {inviteVenueOptions.map((venue) => (
                                        <label key={venue.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/10 px-3 py-2 text-sm text-white">
                                            <span>{venue.name}</span>
                                            <input
                                                type="checkbox"
                                                checked={inviteVenueIds.includes(venue.id)}
                                                onChange={(e) => {
                                                    setInviteVenueIds((prev) =>
                                                        e.target.checked ? [...prev, venue.id] : prev.filter((id) => id !== venue.id)
                                                    );
                                                    if (!e.target.checked && inviteDefaultVenueId === venue.id) {
                                                        setInviteDefaultVenueId("");
                                                    }
                                                }}
                                            />
                                        </label>
                                    ))}
                                </div>
                                {inviteVenueIds.length > 0 && (
                                    <div className="mt-3">
                                        <label className="eyebrow mb-2 block">Default venue</label>
                                        <select
                                            value={inviteDefaultVenueId}
                                            onChange={(e) => setInviteDefaultVenueId(e.target.value)}
                                            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none"
                                        >
                                            <option value="">Choose default venue</option>
                                            {inviteVenueOptions
                                                .filter((venue) => inviteVenueIds.includes(venue.id))
                                                .map((venue) => (
                                                    <option key={venue.id} value={venue.id}>
                                                        {venue.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                        <Button
                            type="button"
                            onClick={inviteAdmin}
                            disabled={
                                savingInvite ||
                                !selectedOrganizationId ||
                                !adminName.trim() ||
                                !adminEmail.trim() ||
                                (adminRole !== "org_admin" && inviteVenueIds.length === 0)
                            }
                            className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#8B8CFF] to-[#5B5CFF] text-white"
                        >
                            {savingInvite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create admin invite
                        </Button>
                    </div>
                </div>

                <div className="panel-surface p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <MapPinned className="h-4 w-4 text-[#9FD0FF]" />
                        <h3 className="text-lg font-semibold text-white">Create venue</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="eyebrow mb-2 block">Organization</label>
                            <select
                                value={venueOrganizationId}
                                onChange={(e) => setVenueOrganizationId(e.target.value)}
                                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none"
                            >
                                <option value="">Select organization</option>
                                {organizationOptions.map((organization) => (
                                    <option key={organization.id} value={organization.id}>
                                        {organization.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="eyebrow mb-2 block">Venue name</label>
                            <Input
                                value={venueName}
                                onChange={(e) => setVenueName(e.target.value)}
                                placeholder="Grand Horizon Downtown"
                                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                            />
                        </div>
                        <div>
                            <label className="eyebrow mb-2 block">Venue mode</label>
                            <select
                                value={venueMode}
                                onChange={(e) => setVenueMode(e.target.value as VenueMode)}
                                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none"
                            >
                                {Object.entries(venueModeLabels).map(([mode, label]) => (
                                    <option key={mode} value={mode}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="eyebrow mb-2 block">Address</label>
                            <Input
                                value={venueAddress}
                                onChange={(e) => setVenueAddress(e.target.value)}
                                placeholder="14 Marina Avenue, Dubai"
                                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                            />
                        </div>
                        <div>
                            <label className="eyebrow mb-2 block">Floor count</label>
                            <Input
                                type="number"
                                min="1"
                                value={venueFloors}
                                onChange={(e) => setVenueFloors(e.target.value)}
                                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                            />
                        </div>
                        <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[#9CB2CF]">
                            Default zones: {venueModeZoneDefaults[venueMode].map((zone) => zone.replace("_", " ")).join(", ")}
                        </div>
                        <Button
                            type="button"
                            onClick={createVenue}
                            disabled={savingVenue || !venueOrganizationId || !venueName.trim() || !venueAddress.trim()}
                            className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#7FD8FF] to-[#2C73FF] text-white"
                        >
                            {savingVenue ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create venue
                        </Button>
                    </div>
                </div>

                <div className="panel-surface p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#FFD27A]" />
                        <h3 className="text-lg font-semibold text-white">SaaS readiness</h3>
                    </div>
                    <div className="space-y-3">
                        {portfolioSignals.slice(0, 4).map(({ organization, venueCount, inviteCount, usage }) => (
                            <div key={organization.id} className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-medium text-white">{organization.name}</div>
                                        <div className="mt-1 text-xs text-[#8DA1BD]">
                                            {planLabels[organization.plan ?? "starter"]} plan
                                        </div>
                                    </div>
                                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[#AFC0D8]">
                                        {organization.status}
                                    </span>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[#9CB2CF]">
                                    <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                                        <div className="eyebrow mb-1">Venues</div>
                                        <div className="text-sm font-medium text-white">{usage.venues || venueCount}</div>
                                    </div>
                                    <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                                        <div className="eyebrow mb-1">Staff</div>
                                        <div className="text-sm font-medium text-white">{usage.staff}</div>
                                    </div>
                                    <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                                        <div className="eyebrow mb-1">Monthly</div>
                                        <div className="text-sm font-medium text-white">{usage.incidents_this_month}</div>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-[#7F96B7]">
                                    {inviteCount} pending teammate invite{inviteCount === 1 ? "" : "s"}.
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="panel-surface p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[#8CF2C4]" />
                        <h3 className="text-lg font-semibold text-white">Pending admin invites</h3>
                    </div>
                    <div className="space-y-3">
                        {invites.map((invite) => (
                            <div key={invite.id} className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                                <div className="text-sm font-medium text-white">{invite.full_name}</div>
                                <div className="mt-1 text-xs text-[#8DA1BD]">{invite.email}</div>
                                <div className="mt-2 text-xs text-[#7F96B7]">
                                    {organizationMap.get(invite.organization_id)?.name ?? "Organization pending"}
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-[#7F96B7]">{invite.role}</span>
                                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 uppercase tracking-[0.2em] text-[#AFC0D8]">
                                        {invite.status}
                                    </span>
                                </div>
                                <div className="mt-2 text-xs text-[#7F96B7]">
                                    {normalizeAssignedVenueIds(invite).length > 0
                                        ? `${normalizeAssignedVenueIds(invite).length} venue assignments`
                                        : "Portfolio-wide access"}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(`${inviteBase}/join/${invite.id}`)}
                                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#CFE3FF] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy invite link
                                </button>
                            </div>
                        ))}
                    </div>
                    {message && (
                        <div className="mt-4 rounded-[1rem] border border-[#68B0FF]/18 bg-[#68B0FF]/10 px-4 py-3 text-sm text-[#CFE3FF]">
                            {message}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
