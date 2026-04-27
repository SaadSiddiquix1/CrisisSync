import { NextRequest, NextResponse } from "next/server";
import { runAiTriage } from "@/lib/ai-triage";
import { normalizeVenueSlug } from "@/lib/compat";
import { getConfidenceValue, normalizeAiTriageResult } from "@/lib/crisis-ai";
import { createPrivilegedClient } from "@/lib/supabase/privileged";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const venueSlug = formData.get("venue_slug") as string;
    const guestName = formData.get("guest_name") as string;
    const roomNumber = formData.get("room_number") as string;
    const crisisType = formData.get("crisis_type") as string;
    const description = formData.get("description") as string;
    const locationDescription = formData.get("location_description") as string;
    const severityAssessment = formData.get("severity_assessment") as string;
    const photoFile = formData.get("photo") as File | null;

    if (!crisisType || !description) {
      return NextResponse.json({ error: "crisis_type and description are required" }, { status: 400 });
    }

    const supabase = createPrivilegedClient();

    let venueId: string | null = null;
    let venueName: string | undefined;

    if (venueSlug) {
      const { data: venues } = await supabase
        .from("venues")
        .select("id, name, address, floor_count, created_at");

      const venue = venues?.find(
        (item) => normalizeVenueSlug(item.name) === venueSlug || item.id === venueSlug
      );

      if (venue) {
        venueId = venue.id;
        venueName = venue.name;
      }
    }

    let photoUrl: string | undefined;
    let photoBase64: string | undefined;

    if (photoFile && photoFile.size > 0) {
      const bytes = await photoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      photoBase64 = buffer.toString("base64");

      if (venueId) {
        const safeName = photoFile.name.replace(/[^a-z0-9.]/gi, "_");
        const fileName = `${venueId}/${Date.now()}-${safeName}`;
        const { data: uploadData } = await supabase.storage
          .from("crisis-photos")
          .upload(fileName, buffer, { contentType: photoFile.type });

        if (uploadData) {
          const { data: urlData } = supabase.storage.from("crisis-photos").getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }
    }

    const triage = normalizeAiTriageResult(
      await runAiTriage({
      crisis_type: crisisType as Parameters<typeof runAiTriage>[0]["crisis_type"],
      description,
      location_description: locationDescription,
      severity_assessment: severityAssessment,
      guest_name: guestName,
      room_number: roomNumber,
      venue_name: venueName,
      photo_base64: photoBase64,
      })
    );

    if (!triage) {
      throw new Error("AI triage returned no result");
    }

    const { data: crisis, error } = await supabase
      .from("crises")
      .insert({
        venue_id: venueId,
        guest_name: guestName || null,
        room_number: roomNumber || null,
        crisis_type: crisisType,
        description,
        location_description: locationDescription || null,
        severity: triage.severity || severityAssessment || "medium",
        photo_url: photoUrl || null,
        ai_triage_result: triage,
        status: "reported",
      })
      .select()
      .single();

    if (error) throw error;
    await supabase.from("crisis_updates").insert({
      crisis_id: crisis.id,
      updated_by: null,
      message: `Crisis reported. AI assessed severity as ${(triage.severity ?? "medium").toUpperCase()} with ${Math.round(getConfidenceValue(triage) * 100)}% confidence.`,
      update_type: "created",
    });

    return NextResponse.json({
      crisis_id: crisis.id,
      triage,
      message: "Crisis reported successfully",
    });
  } catch (error) {
    console.error("Crisis report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
