"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Copy, Loader2, MailPlus, UserCog, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeAssignedVenueIds } from "@/lib/tenant";
import { Organization, OrganizationAdminInvite, Venue } from "@/types/database";

type AdminTeamControlProps = {
    organization: Organization | null;
    venues: Venue[];
    staff: { profile: { id: string; full_name: string; organization_role?: string; venue_id?: string } }[];
    initialInvites: OrganizationAdminInvite[];
};

export function AdminTeamControl({
    organization,
    venues,
    staff,
    initialInvites,
}: AdminTeamControlProps) {
    const [invites, setInvites] = useState(initialInvites);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"venue_admin" | "manager" | "staff">("staff");
    const [assignedVenueIds, setAssignedVenueIds] = useState<string[]>(venues[0]?.id ? [venues[0].id] : []);
    const [defaultVenueId, setDefaultVenueId] = useState(venues[0]?.id ?? "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setInvites(initialInvites);
    }, [initialInvites]);

    const venueMap = useMemo(() => new Map(venues.map((venue) => [venue.id, venue.name])), [venues]);
    const activeVenueCount = venues.length;
    const managerCount = staff.filter((member) => ["manager", "org_admin", "venue_admin"].includes(member.profile.organization_role ?? "")).length;
    const inviteBase = typeof window !== "undefined" ? window.location.origin : "";

    const inviteMember = async () => {
        if (!fullName.trim() || !email.trim()) return;
        setSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/admin/team-invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName,
                    email,
                    role,
                    assigned_venue_ids: assignedVenueIds,
                    default_venue_id: defaultVenueId || assignedVenueIds[0],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to invite teammate");

            setInvites((prev) => [data.invite, ...prev]);
            setFullName("");
            setEmail("");
            setRole("staff");
            setAssignedVenueIds(venues[0]?.id ? [venues[0].id] : []);
            setDefaultVenueId(venues[0]?.id ?? "");
            setMessage(
                data.persistence === "demo"
                    ? "Team invite created in demo mode. Run the SaaS migration to persist it."
                    : "Team invite created successfully."
            );
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Failed to invite teammate.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="panel-surface overflow-hidden">
            <div className="border-b border-white/8 px-5 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="eyebrow mb-2">Team control</div>
                        <h2 className="text-lg font-semibold text-white">Organization staffing</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8DA1BD]">
                            Invite managers and responders into {organization?.name ?? "your organization"}, assign their
                            default venue, and keep operating ownership inside the tenant.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="eyebrow mb-1">Managed venues</div>
                            <div className="text-sm font-medium text-white">{activeVenueCount}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="eyebrow mb-1">Leadership seats</div>
                            <div className="text-sm font-medium text-white">{managerCount}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="eyebrow mb-1">Pending invites</div>
                            <div className="text-sm font-medium text-white">{invites.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 p-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-5">
                    <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="mb-4 flex items-center gap-2">
                            <MailPlus className="h-4 w-4 text-[#9FD0FF]" />
                            <h3 className="text-sm font-semibold text-white">Invite team member</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="eyebrow mb-2 block">Full name</label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Layla Morgan"
                                    className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                                />
                            </div>
                            <div>
                                <label className="eyebrow mb-2 block">Email</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="layla@clientbrand.com"
                                    className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                                />
                            </div>
                            <div>
                                <label className="eyebrow mb-2 block">Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as "venue_admin" | "manager" | "staff")}
                                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none"
                                >
                                    <option value="venue_admin">Venue admin</option>
                                    <option value="staff">Responder / Staff</option>
                                    <option value="manager">Manager</option>
                                </select>
                            </div>
                            <div className="rounded-[1rem] border border-white/8 bg-[#09111D] px-4 py-3">
                                <label className="eyebrow mb-3 block">Venue access</label>
                                <div className="space-y-2">
                                    {venues.map((venue) => (
                                        <label key={venue.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white">
                                            <span>{venue.name}</span>
                                            <input
                                                type="checkbox"
                                                checked={assignedVenueIds.includes(venue.id)}
                                                onChange={(e) => {
                                                    setAssignedVenueIds((prev) =>
                                                        e.target.checked ? [...prev, venue.id] : prev.filter((id) => id !== venue.id)
                                                    );
                                                    if (!e.target.checked && defaultVenueId === venue.id) {
                                                        setDefaultVenueId("");
                                                    }
                                                }}
                                            />
                                        </label>
                                    ))}
                                </div>
                                {assignedVenueIds.length > 0 && (
                                    <div className="mt-3">
                                        <label className="eyebrow mb-2 block">Default venue</label>
                                        <select
                                            value={defaultVenueId}
                                            onChange={(e) => setDefaultVenueId(e.target.value)}
                                            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none"
                                        >
                                            <option value="">Choose default venue</option>
                                            {venues
                                                .filter((venue) => assignedVenueIds.includes(venue.id))
                                                .map((venue) => (
                                                    <option key={venue.id} value={venue.id}>
                                                        {venue.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <Button
                                type="button"
                                onClick={inviteMember}
                                disabled={saving || !fullName.trim() || !email.trim() || assignedVenueIds.length === 0}
                                className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#68B0FF] to-[#2C73FF] text-white"
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create invite
                            </Button>
                        </div>
                        {message && (
                            <div className="mt-4 rounded-[1rem] border border-[#68B0FF]/18 bg-[#68B0FF]/10 px-4 py-3 text-sm text-[#CFE3FF]">
                                {message}
                            </div>
                        )}
                    </div>

                    <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="mb-4 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[#9FD0FF]" />
                            <h3 className="text-sm font-semibold text-white">Venue staffing map</h3>
                        </div>
                        <div className="space-y-3">
                            {venues.map((venue) => (
                                <div key={venue.id} className="rounded-[1rem] border border-white/8 bg-[#09111D] px-4 py-3">
                                    <div className="text-sm font-medium text-white">{venue.name}</div>
                                    <div className="mt-1 text-xs text-[#7F96B7]">
                                        {staff.filter((member) => member.profile.venue_id === venue.id).length} assigned team members
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="mb-4 flex items-center gap-2">
                            <Users2 className="h-4 w-4 text-[#8CF2C4]" />
                            <h3 className="text-sm font-semibold text-white">Current team</h3>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            {staff.map((member) => (
                                <div key={member.profile.id} className="rounded-[1rem] border border-white/8 bg-[#09111D] px-4 py-3">
                                    <div className="text-sm font-medium text-white">{member.profile.full_name}</div>
                                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-[#7F96B7]">
                                        {member.profile.organization_role}
                                    </div>
                                    <div className="mt-3 text-xs text-[#9CB2CF]">
                                        {venueMap.get(member.profile.venue_id ?? "") ?? "Portfolio access"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="mb-4 flex items-center gap-2">
                            <UserCog className="h-4 w-4 text-[#FFB86B]" />
                            <h3 className="text-sm font-semibold text-white">Pending team invites</h3>
                        </div>
                        <div className="space-y-3">
                            {invites.length === 0 ? (
                                <div className="rounded-[1rem] border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-[#7F96B7]">
                                    No pending invites yet.
                                </div>
                            ) : (
                                invites.map((invite) => (
                                    <div key={invite.id} className="rounded-[1rem] border border-white/8 bg-[#09111D] px-4 py-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-medium text-white">{invite.full_name}</div>
                                                <div className="mt-1 text-xs text-[#8DA1BD]">{invite.email}</div>
                                            </div>
                                            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[#AFC0D8]">
                                                {invite.status}
                                            </span>
                                        </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#7F96B7]">
                                            <span>{invite.role}</span>
                                            <span>•</span>
                                            <span>
                                                {normalizeAssignedVenueIds(invite).length > 0
                                                    ? `${normalizeAssignedVenueIds(invite).length} venue assignments`
                                                    : "No venue access"}
                                            </span>
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
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
