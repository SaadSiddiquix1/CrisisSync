import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
    OrganizationRole,
    PlatformRole,
    Profile,
    UserRole,
    Venue,
    VenueMembership,
} from "@/types/database";

export type AuthProfile = Profile & {
    platform_role: PlatformRole;
    organization_role?: OrganizationRole;
    allowed_venue_ids: string[];
    default_venue_id?: string;
    venue_memberships: VenueMembership[];
};

export type AuthContext = {
    supabase: Awaited<ReturnType<typeof createClient>>;
    user: { id: string; email?: string | null } | null;
    profile: AuthProfile | null;
    allowedVenues: Venue[];
};

function derivePlatformRole(profile: Record<string, unknown> | null, userEmail?: string | null): PlatformRole {
    if (typeof profile?.platform_role === "string" && profile.platform_role === "platform_operator") {
        return "platform_operator";
    }

    const configuredOperatorEmail = process.env.PLATFORM_OPERATOR_EMAIL?.toLowerCase();
    if (configuredOperatorEmail && userEmail?.toLowerCase() === configuredOperatorEmail) {
        return "platform_operator";
    }

    return "none";
}

function deriveOrganizationRole(profile: Record<string, unknown> | null): OrganizationRole | undefined {
    if (
        typeof profile?.organization_role === "string" &&
        ["org_admin", "venue_admin", "manager", "staff"].includes(profile.organization_role)
    ) {
        return profile.organization_role as OrganizationRole;
    }

    if (profile?.role === "admin") return "org_admin";
    if (profile?.role === "staff") return "staff";
    return undefined;
}

function normalizeProfile(raw: Record<string, unknown> | null, userEmail?: string | null): AuthProfile | null {
    if (!raw) return null;

    const defaultVenueId =
        typeof raw.default_venue_id === "string" && raw.default_venue_id
            ? raw.default_venue_id
            : typeof raw.venue_id === "string" && raw.venue_id
              ? raw.venue_id
              : undefined;

    return {
        id: String(raw.id ?? ""),
        user_id: String(raw.user_id ?? ""),
        full_name: String(raw.full_name ?? ""),
        role: (raw.role as UserRole) || "staff",
        platform_role: derivePlatformRole(raw, userEmail),
        organization_id: raw.organization_id ? String(raw.organization_id) : undefined,
        organization_role: deriveOrganizationRole(raw),
        venue_id: String(raw.venue_id ?? ""),
        default_venue_id: defaultVenueId,
        allowed_venue_ids: [],
        venue_memberships: [],
        is_available: typeof raw.is_available === "boolean" ? raw.is_available : true,
        avatar_url: typeof raw.avatar_url === "string" ? raw.avatar_url : undefined,
        created_at: String(raw.created_at ?? ""),
    };
}

function dedupe(values: string[]) {
    return Array.from(new Set(values.filter(Boolean)));
}

export async function getCurrentAuthContext(): Promise<AuthContext> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { supabase, user: null, profile: null, allowedVenues: [] };
    }

    const { data: profileRaw } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

    const profile = normalizeProfile(profileRaw as Record<string, unknown> | null, user.email);

    if (!profile) {
        return { supabase, user: { id: user.id, email: user.email }, profile: null, allowedVenues: [] };
    }

    let venueMemberships: VenueMembership[] = [];
    let allowedVenues: Venue[] = [];

    if (profile.organization_id) {
        try {
            const { data: membershipRows } = await supabase
                .from("venue_memberships")
                .select("id, organization_id, venue_id, profile_id, role, is_default, created_at")
                .eq("profile_id", profile.id)
                .eq("organization_id", profile.organization_id);

            if (membershipRows && membershipRows.length > 0) {
                venueMemberships = membershipRows as VenueMembership[];
            }
        } catch {
            venueMemberships = [];
        }

        try {
            if (profile.organization_role === "org_admin") {
                const { data: venueRows } = await supabase
                    .from("venues")
                    .select("id, organization_id, name, slug, mode, address, floor_count, created_at")
                    .eq("organization_id", profile.organization_id)
                    .order("created_at", { ascending: false });

                allowedVenues = (venueRows as Venue[]) ?? [];
            } else if (venueMemberships.length > 0) {
                const venueIds = venueMemberships.map((membership) => membership.venue_id);
                const { data: venueRows } = await supabase
                    .from("venues")
                    .select("id, organization_id, name, slug, mode, address, floor_count, created_at")
                    .in("id", venueIds)
                    .order("created_at", { ascending: false });

                allowedVenues = (venueRows as Venue[]) ?? [];
            } else if (profile.default_venue_id) {
                const { data: venueRows } = await supabase
                    .from("venues")
                    .select("id, organization_id, name, slug, mode, address, floor_count, created_at")
                    .eq("id", profile.default_venue_id);

                allowedVenues = (venueRows as Venue[]) ?? [];
            }
        } catch {
            allowedVenues = [];
        }
    }

    const membershipDefaultVenueId = venueMemberships.find((membership) => membership.is_default)?.venue_id;
    const allowedVenueIds = dedupe([
        ...venueMemberships.map((membership) => membership.venue_id),
        ...allowedVenues.map((venue) => venue.id),
        profile.default_venue_id ?? "",
        profile.venue_id ?? "",
    ]);

    profile.venue_memberships = venueMemberships;
    profile.allowed_venue_ids = allowedVenueIds;
    profile.default_venue_id = membershipDefaultVenueId ?? profile.default_venue_id;
    profile.venue_id = profile.default_venue_id ?? profile.venue_id;

    return {
        supabase,
        user: { id: user.id, email: user.email },
        profile,
        allowedVenues,
    };
}

export function canAccessVenue(profile: AuthProfile | null, venueId?: string | null) {
    if (!profile || !venueId) return false;
    if (profile.platform_role === "platform_operator") return true;
    if (profile.organization_role === "org_admin") return true;
    return profile.allowed_venue_ids.includes(venueId);
}

export function getHighestTenantRole(profile: AuthProfile | null): OrganizationRole | undefined {
    if (!profile) return undefined;
    return profile.organization_role;
}

export async function requireRole(allowedRoles: UserRole[], redirectTo?: string) {
    const { user, profile } = await getCurrentAuthContext();

    if (!user) {
        redirect(redirectTo ? `/login?next=${encodeURIComponent(redirectTo)}` : "/login");
    }

    if (!profile || !allowedRoles.includes(profile.role)) {
        if (profile?.platform_role === "platform_operator") {
            redirect("/operator/dashboard");
        }

        if (profile?.role === "admin") {
            redirect("/admin/dashboard");
        }

        if (profile?.role === "staff") {
            redirect("/staff/dashboard");
        }

        redirect("/login?error=unauthorized");
    }

    return { user, profile };
}

export async function requirePlatformOperator() {
    const { user, profile } = await getCurrentAuthContext();

    if (!user) {
        redirect("/login?next=/operator/dashboard");
    }

    if (!profile || profile.platform_role !== "platform_operator") {
        if (profile?.role === "admin") {
            redirect("/admin/dashboard");
        }
        if (profile?.role === "staff") {
            redirect("/staff/dashboard");
        }
        redirect("/login?error=unauthorized");
    }

    return { user, profile };
}

export async function getApiAuthContext() {
    return getCurrentAuthContext();
}
