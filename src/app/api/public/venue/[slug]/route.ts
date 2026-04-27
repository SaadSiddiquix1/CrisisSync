import { NextResponse } from "next/server";
import { createPrivilegedClient } from "@/lib/supabase/privileged";
import { normalizeVenueSlug, shapeLegacyVenue } from "@/lib/compat";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const supabase = createPrivilegedClient();
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, address, floor_count, created_at");

  if (error || !data) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const venue = data.find(
    (item) => normalizeVenueSlug(item.name) === params.slug || item.id === params.slug
  );

  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  return NextResponse.json({ venue: shapeLegacyVenue(venue) });
}
