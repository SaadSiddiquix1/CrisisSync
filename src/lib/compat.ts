import { Venue } from "@/types/database";

export function normalizeVenueSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(?:-hotel|-resort(?:-spa)?|-spa)+$/, "");
}

export function shapeLegacyVenue(
  venue: Partial<Venue> & { id: string; name: string; address?: string; floor_count?: number; created_at?: string }
) {
  return {
    id: venue.id,
    name: venue.name,
    slug: normalizeVenueSlug(venue.name),
    address: venue.address,
    floor_count: venue.floor_count,
    accent_color: "#3B82F6",
    created_at: venue.created_at ?? new Date().toISOString(),
  };
}
