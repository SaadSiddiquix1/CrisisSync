"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Radio, ShieldCheck, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

const highlights = [
  {
    title: "Live incident feed",
    description: "Responders see priority, location, and owner status without hunting through messages.",
    icon: Radio,
  },
  {
    title: "SLA-aware action",
    description: "Timers and triage keep the team focused on the next move instead of the whole mess at once.",
    icon: Clock3,
  },
  {
    title: "Role-safe access",
    description: "Staff views stay tight and operational while admin controls remain separate.",
    icon: ShieldCheck,
  },
];

export default function StaffDemoPage() {
  return (
    <div className="app-shell min-h-screen px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-border bg-card/50 p-6 backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Staff demo</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Frontline response, rebuilt to feel calm under pressure.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              This restores the staff-side walkthrough: triaged incidents, clear ownership, and fast escalation paths for on-the-ground teams.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-background/30 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5"
              >
                Open staff login
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/report"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background/30 px-5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5"
              >
                Test guest report
                <Zap className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-card/40 p-6 backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">What this demo shows</p>
            <div className="mt-5 space-y-3">
              {[
                ["01", "Incident intake", "A guest report lands with structured location, type, and severity signals."],
                ["02", "AI triage", "Suggested responder focus and urgency appear immediately for the operator flow."],
                ["03", "Responder handoff", "Staff members can move with just the details they need on the ground."],
              ].map(([step, title, description]) => (
                <div key={step} className="flex gap-4 rounded-2xl border border-border bg-background/30 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-semibold text-foreground">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
