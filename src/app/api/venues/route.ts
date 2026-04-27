import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() + "-" + Math.random().toString(36).slice(2, 6)
  );
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, address, city, country, phone, accent_color } = body;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data: venue, error } = await supabase
    .from("venues")
    .insert({
      name,
      slug: generateSlug(name),
      address,
      city,
      country,
      phone,
      accent_color: accent_color || "#3B82F6",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("venue_memberships").insert({
    venue_id: venue.id,
    user_id: user.id,
    role: "operator",
  });

  return NextResponse.json({ venue });
}

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memberships } = await supabase
    .from("venue_memberships")
    .select("*, venue:venues(*)")
    .eq("user_id", user.id);

  return NextResponse.json({ venues: memberships?.map((m) => ({ ...m.venue, role: m.role })) || [] });
}
