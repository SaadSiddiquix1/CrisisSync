import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiAuthContext } from "@/lib/auth";

export async function PATCH(
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
        const { item_id, is_completed, completed_by } = body;

        const supabase = await createClient();

        const { error: checklistError } = await supabase
            .from("checklist_items")
            .update({
                is_completed,
                completed_by: completed_by || null,
                completed_at: is_completed ? new Date().toISOString() : null,
            })
            .eq("id", item_id);

        if (checklistError) {
            return NextResponse.json({ error: checklistError.message }, { status: 500 });
        }

        // Log timeline
        if (is_completed) {
            const { data: item } = await supabase
                .from("checklist_items")
                .select("item_text")
                .eq("id", item_id)
                .single();

            const { error: updateError } = await supabase.from("crisis_updates").insert({
                crisis_id: id,
                updated_by: completed_by || profile.id || null,
                update_type: "checklist_completed",
                message: `Checklist item completed: ${item?.item_text || "Unknown"}`,
            });

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Checklist update error:", error);
        return NextResponse.json(
            { error: "Failed to update checklist" },
            { status: 500 }
        );
    }
}
