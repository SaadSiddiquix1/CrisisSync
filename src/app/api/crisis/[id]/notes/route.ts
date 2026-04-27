import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiAuthContext } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, profile } = await getApiAuthContext();
        if (!user || !profile || !["staff", "admin"].includes(profile.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const message = typeof body.message === "string" ? body.message.trim() : "";

        if (!message) {
            return NextResponse.json({ error: "Note message is required" }, { status: 400 });
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("crisis_updates")
            .insert({
                crisis_id: id,
                updated_by: profile.id || null,
                update_type: "internal_note",
                message,
            })
            .select("*")
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
        }

        return NextResponse.json({ note: data }, { status: 201 });
    } catch (error) {
        console.error("Note create error:", error);
        return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
    }
}
