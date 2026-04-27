import { OrganizationAdminInvite, Venue } from "@/types/database";

export function normalizeAssignedVenueIds(invite: Pick<OrganizationAdminInvite, "assigned_venue_id" | "assigned_venue_ids">) {
    const venueIds = Array.isArray(invite.assigned_venue_ids) ? invite.assigned_venue_ids : [];
    if (venueIds.length > 0) return Array.from(new Set(venueIds.filter(Boolean)));
    return invite.assigned_venue_id ? [invite.assigned_venue_id] : [];
}

export function buildInviteVenueSnapshot(invite: OrganizationAdminInvite, venues: Venue[]) {
    const assignedIds = normalizeAssignedVenueIds(invite);
    return venues.filter((venue) => assignedIds.includes(venue.id));
}
