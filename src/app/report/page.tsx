"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AiTriageResult, CrisisSeverity, CrisisType } from "@/types/database";
import { triggerTouchFeedback } from "@/lib/feedback";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Flame,
  HeartPulse,
  Loader2,
  MapPin,
  ShieldAlert,
  Upload,
  Wrench,
  Zap,
} from "lucide-react";

type VenueBranding = { name: string; accent_color: string };

const crisisTypes: Array<{ value: CrisisType; label: string }> = [
  { value: "fire", label: "Fire / Smoke" },
  { value: "medical", label: "Medical" },
  { value: "security", label: "Security" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

const stepMeta = [
  { id: 1, label: "You", title: "Who is reporting?" },
  { id: 2, label: "Incident", title: "What is happening?" },
  { id: 3, label: "Evidence", title: "Photo and severity" },
  { id: 4, label: "Routing", title: "Live handoff" },
] as const;

const severityCards: Array<{
  value: CrisisSeverity;
  title: string;
  desc: string;
  icon: React.ElementType;
  tone: string;
}> = [
  {
    value: "low",
    title: "Low",
    desc: "Contained issue that still needs staff awareness.",
    icon: Wrench,
    tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  {
    value: "medium",
    title: "Medium",
    desc: "Needs follow-up soon and could escalate.",
    icon: AlertTriangle,
    tone: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  },
  {
    value: "high",
    title: "High",
    desc: "Urgent response needed from venue staff.",
    icon: ShieldAlert,
    tone: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  {
    value: "critical",
    title: "Critical",
    desc: "Immediate danger or rapid escalation risk.",
    icon: Flame,
    tone: "border-red-500/20 bg-red-500/10 text-red-300",
  },
];

const crisisIcons: Record<CrisisType, React.ElementType> = {
  fire: Flame,
  medical: HeartPulse,
  security: ShieldAlert,
  maintenance: Wrench,
  other: AlertTriangle,
};

export default function ReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const venueSlug = searchParams.get("venue") || "";
  const [venueBranding, setVenueBranding] = useState<VenueBranding | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [triage, setTriage] = useState<AiTriageResult | null>(null);
  const [submittedCrisisId, setSubmittedCrisisId] = useState("");

  const [form, setForm] = useState({
    guest_name: "",
    room_number: "",
    crisis_type: "medical" as CrisisType,
    description: "",
    location_description: "",
    severity_assessment: "medium" as CrisisSeverity,
  });

  useEffect(() => {
    const fetchBranding = async () => {
      if (!venueSlug) return;
      const res = await fetch(`/api/public/venue/${venueSlug}`);
      if (res.ok) {
        const data = await res.json();
        setVenueBranding(data.venue);
      }
    };
    void fetchBranding();
  }, [venueSlug]);

  const activeStep = Math.min(step, 4);
  const CrisisTypeIcon = crisisIcons[form.crisis_type] || AlertTriangle;
  const previewChips = useMemo(
    () =>
      [
        form.room_number ? `Room ${form.room_number}` : null,
        form.location_description || null,
        crisisTypes.find((item) => item.value === form.crisis_type)?.label ?? null,
        form.severity_assessment,
      ].filter(Boolean) as string[],
    [form.crisis_type, form.location_description, form.room_number, form.severity_assessment]
  );

  const goToStep = (nextStep: 1 | 2 | 3, feedback: "tap" | "success" | "warning" = "tap") => {
    triggerTouchFeedback(feedback);
    setError("");
    setStep(nextStep);
  };

  const onPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerTouchFeedback("tap");
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setError("");
    setLoading(true);
    setStep(4);
    try {
      const data = new FormData();
      data.append("venue_slug", venueSlug);
      data.append("guest_name", form.guest_name);
      data.append("room_number", form.room_number);
      data.append("crisis_type", form.crisis_type);
      data.append("description", form.description);
      data.append("location_description", form.location_description);
      data.append("severity_assessment", form.severity_assessment);
      if (photo) data.append("photo", photo);

      const res = await fetch("/api/crisis/report", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");
      setTriage(json.triage);
      setSubmittedCrisisId(json.crisis_id);
      setStep(5);
      triggerTouchFeedback("success");
      window.setTimeout(() => {
        router.push(`/report/${json.crisis_id}/status`);
      }, 700);
    } catch (e) {
      triggerTouchFeedback("warning");
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="app-shell min-h-screen px-4 pb-14 pt-24 sm:px-6"
      style={{ ["--venue-accent" as string]: venueBranding?.accent_color || "#3B82F6" }}
    >
      <div className="mx-auto max-w-xl">
        <div className="mb-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Guest report</p>
              <h1 className="text-2xl font-semibold text-foreground">
                {venueBranding?.name || "CrisisSync reporting"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Share what happened and we will route help immediately.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <span className="status-wave h-2 w-2 rounded-full bg-primary/60" />
              Live routing active
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {stepMeta.map((item) => {
              const isActive = item.id === activeStep;
              const isComplete = item.id < activeStep || step === 5;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border px-3 py-3 transition-all ${
                    isActive
                      ? "border-primary/30 bg-primary/10"
                      : isComplete
                        ? "border-emerald-500/20 bg-emerald-500/10"
                        : "border-border bg-card/40"
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{item.id}</p>
                </div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[1.6rem] border border-border bg-card/50 p-4 backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <CrisisTypeIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dispatch snapshot</p>
                <p className="text-sm text-foreground">
                  {form.description
                    ? form.description
                    : "As you fill this out, responders will see a structured summary take shape."}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {previewChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground"
                >
                  {chip}
                </span>
              ))}
              {!previewChips.length && (
                <span className="rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground">
                  Waiting for incident details
                </span>
              )}
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.98 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 1 && (
              <div className="space-y-5 rounded-[1.8rem] border border-border bg-card/60 p-5 backdrop-blur sm:p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 1</p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">Who are you?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Give staff just enough context to identify and find you quickly.
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    placeholder="Full name"
                    value={form.guest_name}
                    onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                  <Input
                    placeholder="Room number"
                    value={form.room_number}
                    onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                </div>

                <Button className="h-12 w-full rounded-2xl touch-card" onClick={() => goToStep(2)}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 rounded-[1.8rem] border border-border bg-card/60 p-5 backdrop-blur sm:p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 2</p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">What is happening?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A short, specific description helps staff act faster than a perfect one.
                  </p>
                </div>

                <div className="space-y-4">
                  <select
                    className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm"
                    value={form.crisis_type}
                    onChange={(e) => setForm({ ...form, crisis_type: e.target.value as CrisisType })}
                  >
                    {crisisTypes.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <Input
                    placeholder="Location description"
                    value={form.location_description}
                    onChange={(e) => setForm({ ...form, location_description: e.target.value })}
                    className="h-12 rounded-2xl"
                  />

                  <Textarea
                    placeholder="Describe the situation in a sentence or two"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="min-h-28 rounded-2xl"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="h-12 rounded-2xl touch-card" onClick={() => goToStep(1)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button className="h-12 flex-1 rounded-2xl touch-card" onClick={() => goToStep(3)}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 rounded-[1.8rem] border border-border bg-card/60 p-5 backdrop-blur sm:p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 3</p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">Photo and severity</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add evidence if you can. Your severity choice is a fast signal, and AI will review it after submission.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="touch-card flex h-24 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/40 text-sm text-foreground">
                    <Upload className="h-4 w-4" />
                    Upload photo
                    <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
                  </label>
                  <label className="touch-card flex h-24 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-background/40 text-sm text-foreground">
                    <Camera className="h-4 w-4" />
                    Capture on mobile
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhotoChange} />
                  </label>
                </div>

                {photoPreview && (
                  <div className="overflow-hidden rounded-2xl border border-border">
                    <Image
                      src={photoPreview}
                      alt="Incident preview"
                      width={800}
                      height={300}
                      className="h-44 w-full object-cover"
                      unoptimized
                    />
                  </div>
                )}

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">How serious does this feel right now?</p>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary capitalize">
                      {form.severity_assessment}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {severityCards.map((severity) => {
                      const Icon = severity.icon;
                      const selected = form.severity_assessment === severity.value;
                      return (
                        <motion.button
                          key={severity.value}
                          type="button"
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                          onClick={() => {
                            triggerTouchFeedback("tap");
                            setForm({ ...form, severity_assessment: severity.value });
                          }}
                          className={`touch-card rounded-2xl border p-4 text-left ${
                            selected
                              ? `${severity.tone} shadow-[0_18px_40px_rgba(3,8,15,0.22)]`
                              : "border-border bg-background/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/6">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{severity.title}</p>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">{severity.desc}</p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="h-12 rounded-2xl touch-card" onClick={() => goToStep(2)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button className="h-12 flex-1 rounded-2xl touch-card" onClick={() => void submit()}>
                    Submit report
                    <Zap className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="relative overflow-hidden rounded-[1.8rem] border border-border bg-card/70 p-8 text-center backdrop-blur sm:p-10">
                <div className="aurora-pan absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(106,169,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,138,107,0.14),transparent_30%)] opacity-90" />
                <div className="relative space-y-5">
                  <div className="relative mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center">
                    <span className="status-wave absolute inset-0 rounded-full bg-primary/18" />
                    <span className="status-wave absolute inset-2 rounded-full bg-primary/12" />
                    <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-primary/25 bg-primary/10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-foreground">AI is triaging this incident</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                      {loading
                        ? "Analyzing severity, generating guidance, and preparing responder context for the venue team."
                        : "Finalizing the report handoff."}
                    </p>
                  </div>

                  <div className="grid gap-3 text-left sm:grid-cols-3">
                    {[
                      { title: "Assessing risk", desc: "Comparing your report with the selected severity." },
                      { title: "Drafting guidance", desc: "Creating guest instructions and responder focus." },
                      { title: "Routing live", desc: "Preparing the status page and dispatch queue." },
                    ].map((item) => (
                      <div key={item.title} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[#AFC0D8]">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && triage && (
              <div className="space-y-4 rounded-[1.8rem] border border-emerald-500/20 bg-card/70 p-5 backdrop-blur sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Report submitted successfully</h2>
                    <p className="text-sm text-muted-foreground">Opening live status tracking now.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">AI severity</p>
                  <p className="mt-2 text-base font-semibold capitalize text-foreground">{triage.severity}</p>
                </div>

                <div className="rounded-2xl border border-border bg-background/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Responder focus</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{triage.responder_focus}</p>
                </div>

                <div className="rounded-2xl border border-border bg-background/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Guest instructions</p>
                  <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-foreground">
                    {(triage.guest_instructions ?? []).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ol>
                </div>

                {submittedCrisisId ? (
                  <Link href={`/report/${submittedCrisisId}/status`} className="inline-block w-full">
                    <Button className="h-12 w-full rounded-2xl touch-card">Track live status</Button>
                  </Link>
                ) : null}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          Staff will see location, severity, and your live status handoff as one coordinated record.
        </div>
      </div>
    </div>
  );
}
