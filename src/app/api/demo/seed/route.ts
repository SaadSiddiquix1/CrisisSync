import { NextRequest, NextResponse } from "next/server";
import { seedDemoData } from "@/lib/demo-seed";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-demo-seed-secret");
  if (!secret || secret !== process.env.DEMO_SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedDemoData();
    if (!result.ok) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Demo seed failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Demo seeding failed. Confirm Supabase permissions and SUPABASE_SERVICE_ROLE_KEY for reset-safe demo setup.",
      },
      { status: 500 }
    );
  }
}
