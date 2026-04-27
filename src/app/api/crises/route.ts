import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createPrivilegedClient } from "@/lib/supabase/privileged";

export async function GET(req: NextRequest) {
  const venueId = req.nextUrl.searchParams.get("venue_id");
  if (!venueId) {
    return NextResponse.json({ error: "venue_id is required" }, { status: 400 });
  }

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
  const { data, error } = await supabase
    .from("crises")
    .select("*")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ crises: data || [] });
}
