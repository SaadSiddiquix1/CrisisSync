export type PlatformRole = "platform_operator" | "none";

export type OrganizationRole = "org_admin" | "venue_admin" | "manager" | "staff";

export type VenueMode =
    | "hotel"
    | "resort"
    | "restaurant"
    | "event_venue"
    | "nightlife"
    | "mixed_use";

export type ZoneType =
    | "room"
    | "floor"
    | "lobby"
    | "corridor"
    | "kitchen"
    | "dining"
    | "ballroom"
    | "stage"
    | "entrance"
    | "pool"
    | "spa"
    | "parking"
    | "vip"
    | "staff_area"
    | "custom";

export const venueModeLabels: Record<VenueMode, string> = {
    hotel: "Hotel",
    resort: "Resort",
    restaurant: "Restaurant",
    event_venue: "Event Venue",
    nightlife: "Nightlife",
    mixed_use: "Mixed Use",
};

export const venueModeZoneDefaults: Record<VenueMode, ZoneType[]> = {
    hotel: ["room", "floor", "lobby", "corridor", "spa", "parking", "staff_area"],
    resort: ["room", "floor", "lobby", "pool", "spa", "parking", "staff_area"],
    restaurant: ["dining", "kitchen", "entrance", "parking", "staff_area", "custom"],
    event_venue: ["ballroom", "stage", "entrance", "parking", "vip", "staff_area", "custom"],
    nightlife: ["floor", "entrance", "vip", "parking", "staff_area", "custom"],
    mixed_use: ["room", "lobby", "entrance", "parking", "staff_area", "custom"],
};

export const venueModeIntakeHints: Record<VenueMode, string[]> = {
    hotel: ["Room number", "Floor", "Wing", "Nearby landmark"],
    resort: ["Villa or room", "Deck or pool area", "Nearby landmark"],
    restaurant: ["Table or section", "Dining room or kitchen", "Nearby staff station"],
    event_venue: ["Hall or gate", "Stage or backstage", "Crowd area"],
    nightlife: ["Bar, dance floor, VIP, entrance", "Floor level", "Nearby security point"],
    mixed_use: ["Zone type", "Zone label", "Nearest landmark"],
};
