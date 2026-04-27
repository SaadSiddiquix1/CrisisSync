import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createPrivilegedClient } from "@/lib/supabase/privileged";
import { shapeLegacyVenue } from "@/lib/compat";

export async function GET() {
  const cookieStore = cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createPrivilegedClient();
  const [{ data: profile }, { data: venues, error: venueError }] = await Promise.all([
    supabase.from("profiles").select("id, user_id, full_name, role, created_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("venues").select("id, name, address, floor_count, created_at").order("created_at", { ascending: true }),
  ]);

  if (venueError) {
    return NextResponse.json({ error: venueError.message }, { status: 500 });
  }

  if (!profile || !["staff", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shapedVenues = (venues || []).map(shapeLegacyVenue);
  const sortedVenues = [...shapedVenues].sort((a, b) => {
    if (a.slug === "grand-meridian") return -1;
    if (b.slug === "grand-meridian") return 1;
    return 0;
  });

  return NextResponse.json({
    venues: sortedVenues,
    allowed_venue_ids: sortedVenues.map((venue) => venue.id),
    default_venue_id: sortedVenues[0]?.id ?? null,
    role: profile.role,
  });
}
