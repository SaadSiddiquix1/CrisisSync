import { NextRequest, NextResponse } from "next/server";
import { websiteAssistantReply } from "@/lib/gemini";

type AssistantPage =
    | "home"
    | "report"
    | "report-status"
    | "login"
    | "onboarding"
    | "unknown";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const message = typeof body.message === "string" ? body.message.trim() : "";
        const page = (body.page || "unknown") as AssistantPage;

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const reply = await websiteAssistantReply(message, page);
        return NextResponse.json({ reply });
    } catch (error) {
        console.error("Website assistant route error:", error);
        return NextResponse.json(
            { error: "Failed to get assistant response" },
            { status: 500 }
        );
    }
}
