"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BellRing,
  Bot,
  CheckCheck,
  Clock3,
  MapPin,
  QrCode,
  Radio,
  Shield,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const heroHighlights = [
  { icon: Bot, title: "AI triage", desc: "Structured severity and responder focus in seconds." },
  { icon: Radio, title: "Realtime dispatch", desc: "Updates land across teams without radio chaos." },
  { icon: Shield, title: "Role-safe control", desc: "Admin, operator, and staff views stay intentionally scoped." },
];

const heroMetrics = [
  { label: "First action", value: "< 90 sec", sub: "guided handoff from report to dispatch" },
  { label: "Touch-ready", value: "4 steps", sub: "mobile report flow with camera capture" },
  { label: "Coverage", value: "Multi-venue", sub: "one system across properties and teams" },
];

const builtForUrgency = [
  { icon: Clock3, label: "SLA timers", sub: "Acknowledge and resolve targets stay visible." },
  { icon: QrCode, label: "QR reporting", sub: "No install, no account, no extra training." },
  { icon: Smartphone, label: "Touch-first UI", sub: "Large targets, haptic-friendly flows, calm motion." },
];

const responseFlow = [
  { n: "01", title: "Guest report", desc: "Photo, location, and plain-language description." },
  { n: "02", title: "AI triage", desc: "Severity, guest instructions, and responder focus." },
  { n: "03", title: "Dispatch", desc: "Assign staff and update progress in realtime." },
  { n: "04", title: "Resolve", desc: "Close the loop with notes and incident reporting." },
];

const venues = [
  "Hotels and resorts",
  "Restaurants and kitchens",
  "Events and conferences",
  "Nightlife and venues",
  "Mixed-use properties",
  "Multi-venue portfolios",
];

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="app-shell min-h-screen overflow-x-hidden text-foreground selection:bg-primary/20">
      <section className="relative px-5 pb-12 pt-28 sm:pt-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { x: [0, 18, 0], y: [0, -18, 0], scale: [1, 1.05, 1] }
            }
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-0 h-[540px] w-[840px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(106,169,255,0.18),transparent_60%)] blur-3xl"
          />
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { x: [0, -24, 0], y: [0, 16, 0], scale: [1, 1.08, 1] }
            }
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[-160px] top-[110px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,138,107,0.13),transparent_62%)] blur-3xl"
          />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp}>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Emergency coordination, designed for calm under pressure.
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-6">
                <h1 className="max-w-4xl text-balance text-[clamp(2.6rem,6.3vw,4.8rem)] font-semibold leading-[1.01] tracking-[-0.045em]">
                  Calm, fast response when the situation is anything but.
                </h1>
                <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                  CrisisSync turns guest reports into triage, dispatch, and live follow-through for hospitality teams
                  that cannot afford confusion.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="touch-card inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_18px_42px_rgba(106,169,255,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(106,169,255,0.3)]"
                >
                  Log in
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/report"
                  className="touch-card inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card/40 px-5 text-sm font-semibold text-foreground backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-card/60"
                >
                  Try guest report
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/#demo"
                  className="touch-card inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  See it live
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>

              <motion.div
                variants={stagger}
                className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-3"
              >
                {heroHighlights.map((item) => (
                  <motion.div key={item.title} variants={fadeUp} className="touch-card rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease }}
              className="relative"
            >
              <motion.div
                animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(17,20,26,0.96),rgba(9,13,20,0.92))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-6"
              >
                <div className="aurora-pan absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(106,169,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,138,107,0.16),transparent_28%)] opacity-90" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/90">Live command preview</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Response loop</h2>
                    </div>
                    <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                      Realtime sync
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {heroMetrics.map((metric, index) => (
                      <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.08, duration: 0.55, ease }}
                        className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"
                      >
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#7F96B7]">{metric.label}</p>
                        <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
                        <p className="mt-1 text-xs leading-5 text-[#A8B9D2]">{metric.sub}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[1.6rem] border border-white/8 bg-[rgba(7,11,18,0.78)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF5A4F]/12 text-[#FF8A80]">
                          <span className="status-wave absolute inset-1 rounded-[1rem] bg-[#FF5A4F]/20" />
                          <BellRing className="relative h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Security incident reported</p>
                          <p className="text-xs text-[#8EA4C3]">East elevator foyer · critical</p>
                        </div>
                      </div>
                      <div className="rounded-full border border-[#68B0FF]/20 bg-[#68B0FF]/10 px-3 py-1 text-xs font-semibold text-[#9FD0FF]">
                        14 sec ago
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-[#7F96B7]">Responder focus</p>
                            <p className="mt-2 text-sm leading-6 text-white">
                              Secure guest area, block elevator access, and route nearest supervisor to the scene.
                            </p>
                          </div>
                          <Bot className="h-4 w-4 shrink-0 text-[#68B0FF]" />
                        </div>

                        <div className="mt-4 space-y-2">
                          {[
                            { icon: CheckCheck, label: "Guest updated", sub: "AI safety guidance delivered" },
                            { icon: Activity, label: "Dispatch live", sub: "2 responders pinged instantly" },
                            { icon: MapPin, label: "Location tagged", sub: "Venue map synced across staff" },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] text-[#9FD0FF]">
                                <item.icon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{item.label}</p>
                                <p className="text-xs text-[#7F96B7]">{item.sub}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-[#7F96B7]">Touch moments</p>
                        <div className="mt-4 space-y-3">
                          {[
                            "Tap severity cards",
                            "Camera-first reporting",
                            "One-thumb quick actions",
                          ].map((item) => (
                            <div key={item} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 text-sm text-white">
                              <Sparkles className="h-3.5 w-3.5 text-[#FFB499]" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="float-soft absolute -bottom-4 left-4 hidden rounded-2xl border border-border bg-background/85 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:block"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#7F96B7]">Standout detail</p>
                <p className="mt-1 text-sm font-semibold text-white">Mobile reporting now feels native, not form-like.</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <motion.section
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="px-5 py-14 sm:py-20"
      >
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
          <motion.div variants={fadeUp} className="touch-card rounded-3xl border border-border bg-card/40 p-6 backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Built for urgency</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Make the next step obvious.</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Every view is designed to reduce cognitive load: what happened, where it is, who owns it, and what to do next.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {builtForUrgency.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-background/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} id="how-it-works" className="touch-card rounded-3xl border border-border bg-card/40 p-6 backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">End-to-end flow</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Report, triage, dispatch, resolve.</h2>
            <div className="mt-6 space-y-3">
              {responseFlow.map((step) => (
                <div key={step.n} className="rounded-2xl border border-border bg-background/30 p-4">
                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-xs font-semibold text-foreground">
                      {step.n}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="venues"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        variants={stagger}
        className="px-5 pb-4 pt-2 sm:pb-10"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div variants={fadeUp} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hospitality-first</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">One workspace for every property.</h2>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Hotels, resorts, restaurants, and events all keep the same calm response language while each venue stays scoped and organized.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <motion.div key={venue} variants={fadeUp} className="touch-card rounded-2xl border border-border bg-card/40 p-4 backdrop-blur">
                <p className="text-sm font-semibold">{venue}</p>
                <p className="mt-1 text-sm text-muted-foreground">Triage, dispatch, and audit trail in a single operating surface.</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="demo"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.22 }}
        variants={fadeUp}
        className="px-5 pb-16 pt-10 sm:pb-24"
      >
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-card/40 p-6 backdrop-blur sm:p-10">
          <div className="aurora-pan absolute inset-0 hidden bg-[radial-gradient(circle_at_top_left,rgba(106,169,255,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,138,107,0.14),transparent_30%)] opacity-80" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Demo</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Try the full guest-to-response loop.</h2>
              <p className="mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
                Start with the guest report, then jump into the staff and admin experiences to feel the motion, triage, and live coordination in context.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/demo/staff"
                className="touch-card inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(106,169,255,0.22)] transition-all hover:-translate-y-0.5"
              >
                Open staff demo
                <Zap className="h-4 w-4" />
              </Link>
              <Link
                href="/demo/admin"
                className="touch-card inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background/30 px-5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-background/45"
              >
                Open admin demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
