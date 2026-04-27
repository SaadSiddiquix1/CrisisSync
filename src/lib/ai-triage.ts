import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { AiTriageResult, CrisisType } from "@/types/database";

const CONFIDENCE_THRESHOLD = 0.65;
const GEMINI_TIMEOUT_MS = 8000;

const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

const buildTriagePrompt = (params: {
  crisis_type: CrisisType;
  description: string;
  location_description?: string;
  severity_assessment: string;
  guest_name?: string;
  room_number?: string;
  venue_name?: string;
  photo_description?: string;
}) => `
You are an emergency response AI for a hospitality venue called "${params.venue_name || "the venue"}".
Analyze this crisis report and return a JSON object only — no markdown, no explanation.

CRISIS REPORT:
- Type: ${params.crisis_type}
- Guest: ${params.guest_name || "Unknown"}, Room ${params.room_number || "Unknown"}
- Location: ${params.location_description || "Not specified"}
- Description: ${params.description}
- Guest-assessed severity: ${params.severity_assessment}
${params.photo_description ? `- Visual evidence: ${params.photo_description}` : ""}

Return exactly this JSON structure:
{
  "severity": "low" | "medium" | "high" | "critical",
  "confidence": 0.00-1.00 (how confident you are in this assessment),
  "reasoning": "2-3 sentence explanation of your assessment",
  "guest_instructions": ["instruction 1", "instruction 2", "instruction 3", "instruction 4"],
  "staff_checklist": [
    {"task": "task description", "priority": "immediate" | "urgent" | "standard", "completed": false},
    ...4-6 tasks total
  ],
  "responder_focus": "Single sentence: the most critical thing first responders must do",
  "prevention_insights": "Brief insight on preventing recurrence or escalation"
}

Guest instructions should be calm, clear, and actionable — written directly to the guest.
Staff checklist should be ordered by priority with the most critical first.
Be honest about confidence — if the description is vague, reflect that in a lower score.
`;

async function triageWithGemini(prompt: string, photoBase64?: string): Promise<AiTriageResult> {
  const model = geminiClient.getGenerativeModel({ model: "gemini-2.0-flash" });

  const content = {
    contents: [
      {
        role: "user",
        parts: [
          ...(photoBase64
            ? [
                {
                  inlineData: {
                    data: photoBase64,
                    mimeType: "image/jpeg" as const,
                  },
                },
              ]
            : []),
          { text: prompt },
        ],
      },
    ],
  };

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini timeout")), GEMINI_TIMEOUT_MS)
  );

  const result = await Promise.race([model.generateContent(content), timeoutPromise]);
  const text = result.response.text().replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(text);
  return { ...parsed, model_used: "gemini" };
}

async function triageWithGroq(prompt: string): Promise<AiTriageResult> {
  const completion = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are an emergency response AI. Always respond with valid JSON only, no markdown.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const text = completion.choices[0]?.message?.content || "";
  const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  return { ...parsed, model_used: "groq" };
}

export async function runAiTriage(params: {
  crisis_type: CrisisType;
  description: string;
  location_description?: string;
  severity_assessment: string;
  guest_name?: string;
  room_number?: string;
  venue_name?: string;
  photo_base64?: string;
}): Promise<AiTriageResult> {
  const prompt = buildTriagePrompt(params);

  try {
    const result = await triageWithGemini(prompt, params.photo_base64);
    if ((result.confidence ?? 0) >= CONFIDENCE_THRESHOLD) return result;

    try {
      const groqResult = await triageWithGroq(prompt);
      return (groqResult.confidence ?? 0) > (result.confidence ?? 0) ? groqResult : result;
    } catch {
      return result;
    }
  } catch (geminiError) {
    console.warn("Gemini triage failed, falling back to Groq:", geminiError);
    return triageWithGroq(prompt);
  }
}

export async function generateIncidentReport(crisis: {
  id: string;
  crisis_type: string;
  description: string;
  guest_name?: string;
  room_number?: string;
  location_description?: string;
  ai_severity?: string;
  ai_confidence?: number;
  ai_reasoning?: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  updates?: Array<{ content: string; created_at: string; author_name?: string; update_type: string }>;
  venue_name?: string;
}): Promise<{ markdown: string; data: Record<string, unknown> }> {
  const responseTimeMs = crisis.resolved_at
    ? new Date(crisis.resolved_at).getTime() - new Date(crisis.created_at).getTime()
    : null;
  const responseMinutes = responseTimeMs ? Math.round(responseTimeMs / 60000) : null;

  const prompt = `
Generate a professional post-incident report for a hospitality venue emergency.

INCIDENT DATA:
- Venue: ${crisis.venue_name || "The Venue"}
- Type: ${crisis.crisis_type}
- Severity: ${crisis.ai_severity || "Unknown"}
- Location: ${crisis.location_description || "Not specified"}
- Guest: ${crisis.guest_name || "Unknown"}, Room ${crisis.room_number || "Unknown"}
- Description: ${crisis.description}
- Status: ${crisis.status}
- Reported at: ${new Date(crisis.created_at).toLocaleString()}
- Resolved at: ${crisis.resolved_at ? new Date(crisis.resolved_at).toLocaleString() : "Not yet resolved"}
- Response time: ${responseMinutes ? `${responseMinutes} minutes` : "Ongoing"}
- AI Confidence: ${crisis.ai_confidence ? `${Math.round(crisis.ai_confidence * 100)}%` : "Unknown"}
- AI Assessment: ${crisis.ai_reasoning || "Not available"}

TIMELINE OF UPDATES:
${crisis.updates?.map((u) => `[${new Date(u.created_at).toLocaleTimeString()}] ${u.author_name || "System"}: ${u.content}`).join("\n") || "No updates recorded"}

Generate a professional incident report in markdown with these sections:
1. Executive Summary (2-3 sentences)
2. Incident Timeline (bullet points with times)
3. Response Assessment (what went well, what could improve)
4. AI System Performance (accuracy assessment)
5. Recommendations (3-5 actionable items for prevention)

Return JSON: {"markdown": "full markdown report", "response_time_minutes": ${responseMinutes || 0}, "recommendations": ["rec1", "rec2"]}
`;

  try {
    const model = geminiClient.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(text);
  } catch {
    return {
      markdown: `# Incident Report\n\n**Type:** ${crisis.crisis_type}\n**Status:** ${crisis.status}\n**Response Time:** ${responseMinutes || "N/A"} minutes\n\n*Report generation failed. Please review manually.*`,
      data: { response_time_minutes: responseMinutes || 0, recommendations: [] },
    };
  }
}
