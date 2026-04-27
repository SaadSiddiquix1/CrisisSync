import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export default async function StatusPage() {
  let supabaseOk = false;
  let geminiOk = false;
  let groqOk = false;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("venues").select("id").limit(1);
    supabaseOk = !error;
  } catch {}

  try {
    const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
    await model.generateContent("ping");
    geminiOk = true;
  } catch {}

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 4,
    });
    groqOk = true;
  } catch {}

  const rows = [
    { label: "Supabase", ok: supabaseOk },
    { label: "Gemini API", ok: geminiOk },
    { label: "Groq API", ok: groqOk },
  ];

  return (
    <div className="app-shell min-h-screen px-4 pb-12 pt-24 sm:px-6">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold text-foreground">System health</h1>
        <p className="mt-1 text-sm text-muted-foreground">Integration status for demo verification.</p>
        <div className="mt-4 space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
              <span>{r.label}</span>
              <span className={r.ok ? "text-emerald-600" : "text-destructive"}>{r.ok ? "Online" : "Offline"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
