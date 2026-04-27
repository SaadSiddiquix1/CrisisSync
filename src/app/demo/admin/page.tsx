"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Building2, Shield, Users2 } from "lucide-react";

export const dynamic = "force-dynamic";

const adminHighlights = [
  {
    title: "Portfolio oversight",
    description: "See venue health, response load, and unresolved issues from one command surface.",
    icon: Building2,
  },
  {
    title: "Team control",
    description: "Invite admins, manage staff scopes, and keep access aligned to the property structure.",
    icon: Users2,
  },
  {
    title: "Operational confidence",
    description: "A cleaner audit trail makes reporting and follow-through easier when incidents stack up.",
    icon: Shield,
  },
];

export default function AdminDemoPage() {
  return (
    <div className="app-shell min-h-screen px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-border bg-card/40 p-6 backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Admin demo</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              The command-center side of CrisisSync is back in place.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              This walkthrough restores the executive and property-admin story: coordinated venues, team permissions, and a clearer incident picture.
            </p>

            <div className="mt-8 space-y-3">
              {adminHighlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-background/30 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-card/50 p-6 backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin workflow</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Live dashboards", "Track incidents, active responders, and venue status from a single overview."],
                ["Report review", "Open incident detail pages with triage context and follow-up notes already attached."],
                ["Team operations", "Manage invites and access without leaving the product."],
                ["Analytics", "Turn raw emergency events into patterns your teams can actually act on."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-border bg-background/30 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5"
              >
                Open admin login
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background/30 px-5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5"
              >
                Review onboarding
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
