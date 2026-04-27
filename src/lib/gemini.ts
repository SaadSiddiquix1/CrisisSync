import Groq from "groq-sdk";
import { AiTriageResult, CrisisType, Severity } from "@/types/database";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

type WebsiteAssistantPage =
    | "home"
    | "report"
    | "report-status"
    | "login"
    | "onboarding"
    | "unknown";

const websitePageDescriptions: Record<WebsiteAssistantPage, string> = {
    home: "Landing page for CrisisSync. Visitors can learn about the platform, open the report flow, go to staff login, or start onboarding.",
    report: "Guest reporting flow. Visitors can submit a crisis report by entering their name, room number, incident type, location details, and severity.",
    "report-status": "Guest-facing status experience for an individual incident report.",
    login: "Staff login portal. Staff and admins can sign in or use demo access to reach dashboards.",
    onboarding: "Venue onboarding flow. Prospects can configure a venue, choose crisis vectors, generate invite links, and launch the command center.",
    unknown: "A general page on the CrisisSync marketing or guest experience.",
};

export async function triageCrisis(
    crisisType: CrisisType,
    description: string,
    location: string,
    guestSeverity: string,
    image?: { mimeType: string; data: string }
): Promise<AiTriageResult> {
    const promptText = `You are an emergency triage AI for a hospitality venue (hotel/resort). Analyze this crisis report and respond with a JSON object.

CRISIS REPORT:
- Type: ${crisisType}
- Description: ${description}
- Location: ${location}
- Guest's severity assessment: ${guestSeverity}

Respond ONLY with valid JSON matching this exact structure (no markdown, no code fences):
{
  "severity": "critical" | "high" | "medium" | "low",
  "category_confirmed": "fire" | "medical" | "security" | "maintenance" | "other",
  "confidence_score": 0.0,
  "reasoning": ["reason 1", "reason 2", "reason 3"],
  "guest_instructions": ["instruction 1", "instruction 2", "instruction 3"],
  "staff_protocol": ["step 1", "step 2", "step 3", "step 4", "step 5"],
  "summary": "Brief 1-2 sentence summary of the situation and recommended priority",
  "visual_summary": "One sentence describing what the image suggests, or an empty string if no image was provided or the image is not useful.",
  "visual_risk_factors": ["visual clue 1", "visual clue 2"],
  "responder_focus": "One short sentence telling staff the most important thing to do first.",
  "prevention_recommendations": ["prevention idea 1", "prevention idea 2", "prevention idea 3"]
}

Rules:
- severity should be based on actual danger level, not just the guest's assessment
- confidence_score should be a number between 0.0 and 1.0
- reasoning should explain the AI's triage judgment in 2-4 concise bullets
- guest_instructions should be immediate safety actions for the guest (3-5 items)
- staff_protocol should be a response checklist for staff (4-6 items)
- visual_summary and visual_risk_factors should only mention visible evidence from the image
- responder_focus should be concise and action-oriented
- prevention_recommendations should be practical venue improvements or follow-ups
- If no image is provided, use visual_summary as "" and visual_risk_factors as []
- Be specific and actionable, not generic`;

    try {
        const content = image
            ? [
                  { type: "text", text: promptText },
                  {
                      type: "image_url",
                      image_url: {
                          url: `data:${image.mimeType};base64,${image.data}`,
                      },
                  },
              ]
            : promptText;

        const result = await groq.chat.completions.create({
            model: image ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages: [{ role: "user", content: content as any }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const text = result.choices[0]?.message?.content?.trim() || "{}";
        const cleanJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleanJson) as AiTriageResult;
        return parsed;
    } catch (error) {
        console.error("Groq triage error:", error);
        return {
            severity: (guestSeverity as Severity) || "medium",
            category_confirmed: crisisType,
            confidence_score: 0.58,
            reasoning: [
                "Severity defaults to the guest description because richer AI analysis was unavailable.",
                "The response should still be treated seriously until staff verify the scene.",
            ],
            guest_instructions: [
                "Stay calm and remain in a safe location",
                "Do not attempt to handle the situation yourself",
                "Wait for staff to arrive and provide assistance",
            ],
            staff_protocol: [
                "Acknowledge the crisis report immediately",
                "Proceed to the reported location",
                "Assess the situation and ensure guest safety",
                "Contact emergency services if needed",
                "Update crisis status in the system",
            ],
            summary: `${crisisType} incident reported. Requires immediate staff attention.`,
            visual_summary: image ? "Image attached, but visual analysis was unavailable." : "",
            visual_risk_factors: [],
            responder_focus: "Reach the reported location quickly, verify guest safety, and assess escalation risk.",
            prevention_recommendations: [
                "Review the incident location for recurring hazards or access issues.",
                "Capture a staff debrief after resolution to improve future response.",
            ],
        };
    }
}

export async function generateIncidentReport(
    crisisData: {
        crisis_type: string;
        description: string;
        location_description: string;
        severity: string;
        guest_name: string;
        room_number: string;
        created_at: string;
        resolved_at: string;
    },
    updates: { update_type: string; message: string; created_at: string }[],
    checklistItems: { item_text: string; is_completed: boolean }[]
): Promise<string> {
    const timelineStr = updates
        .map((u) => `- [${u.created_at}] ${u.update_type}: ${u.message}`)
        .join("\n");

    const checklistStr = checklistItems
        .map((c) => `- [${c.is_completed ? "✓" : "✗"}] ${c.item_text}`)
        .join("\n");

    const prompt = `You are a professional incident report writer for a hospitality venue. Generate a comprehensive incident report based on the following data.

INCIDENT DATA:
- Type: ${crisisData.crisis_type}
- Severity: ${crisisData.severity}
- Description: ${crisisData.description}
- Location: ${crisisData.location_description}
- Reporter: ${crisisData.guest_name} (Room ${crisisData.room_number})
- Reported at: ${crisisData.created_at}
- Resolved at: ${crisisData.resolved_at}

RESPONSE TIMELINE:
${timelineStr || "No timeline entries"}

CHECKLIST ACTIONS:
${checklistStr || "No checklist items"}

Write a professional incident report with these sections:
1. INCIDENT SUMMARY
2. RESPONSE TIMELINE
3. ACTIONS TAKEN
4. RESOLUTION
5. RECOMMENDATIONS FOR PREVENTION

Use professional, clear language. Be thorough but concise.`;

    try {
        const result = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });
        return result.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq report generation error:", error);
        return `# Incident Report\n\n## Summary\nA ${crisisData.crisis_type} incident (${crisisData.severity} severity) was reported by ${crisisData.guest_name} at ${crisisData.location_description}.\n\n## Description\n${crisisData.description}\n\n## Resolution\nIncident was resolved at ${crisisData.resolved_at}.\n\n---\n*Auto-generated fallback report*`;
    }
}

export async function websiteAssistantReply(
    message: string,
    page: WebsiteAssistantPage
): Promise<string> {
    const prompt = `You are "Astra", a premium concierge-style website assistant for CrisisSync.

Your job:
- Help visitors understand and navigate the CrisisSync website
- Answer questions about what this product does and where to go next
- Guide users to the correct page or action inside this website
- Be concise, polished, confident, and helpful

Important constraints:
- Only describe capabilities that are actually present on this website
- Do not invent pricing, integrations, or setup flows not mentioned below
- If asked something outside the site, gently steer back to what the site can help with
- Keep answers short, usually 2-5 sentences
- Use a premium, calm tone with no emojis

Known site structure:
- Home (/): explains CrisisSync, links to report crisis, login, and onboarding
- Report (/report): guest emergency reporting flow
- Login (/login): staff/admin sign-in and demo access
- Onboarding (/onboarding): venue setup flow
- Staff dashboard (/staff/dashboard): responder workspace
- Admin dashboard (/admin/dashboard): command center
- Admin analytics (/admin/analytics): operational analytics

Current page:
- Page key: ${page}
- Page description: ${websitePageDescriptions[page]}

User message:
${message}

Respond as Astra. If helpful, mention the exact page name the visitor should open next.`;

    try {
        const result = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
        });
        return result.choices[0]?.message?.content?.trim() || "";
    } catch (error) {
        console.error("Groq website assistant error:", error);
        return page === "report"
            ? "I can help you through this report. Start by entering your name and room number, then choose the incident type, add the location details, and submit the alert."
            : "I can help you navigate CrisisSync. You can report an incident from the Report Crisis page, sign in from the Staff Portal, or start setup from the onboarding flow.";
    }
}
