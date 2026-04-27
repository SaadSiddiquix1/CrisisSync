"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Bot, CheckCircle2, ChevronRight, Clock,
  FileText, Flame, Heart, MapPin, QrCode, Radio, RefreshCw,
  Shield, User, Users, X, Zap, Activity, Building2
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Crisis, CrisisSeverity, CrisisType } from "@/types/database";
import { useRealtimeCrises } from "@/hooks/use-realtime-crises";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QrCodeModal } from "@/components/qr-code-modal";
import { StatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { isActiveStatus } from "@/lib/crisis-status";
import { cn } from "@/lib/utils";
import { triggerTouchFeedback } from "@/lib/feedback";
import { getConfidenceValue, getCrisisAiTriage, getReasoningText } from "@/lib/crisis-ai";

type MembershipWithVenue = {
  id: string;
  venue_id: string;
  user_id: string;
  role: string;
  is_on_duty: boolean;
  joined_at: string;
  venue: { name: string; slug: string };
};

const crisisTypeIcons: Record<CrisisType, React.ElementType> = {
  fire: Flame,
  medical: Heart,
  security: Shield,
  maintenance: Building2,
  other: AlertTriangle,
};

const crisisTypeColors: Record<CrisisType, string> = {
  fire: "text-red-400",
  medical: "text-pink-400",
  security: "text-blue-400",
  maintenance: "text-yellow-400",
  other: "text-gray-400",
};

const severityGlow: Record<CrisisSeverity, string> = {
  critical: "border-l-4 border-l-red-500",
  high: "border-l-4 border-l-orange-400",
  medium: "border-l-4 border-l-yellow-400",
  low: "border-l-4 border-l-green-400",
};

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function getEffectiveSeverity(c: Crisis): CrisisSeverity {
  return c.severity_assessment ?? c.severity ?? c.ai_severity ?? "medium";
}

function MetricCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="touch-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(4,9,17,0.6)] p-5"
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}88, transparent)` }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(circle at top right, ${color}16, transparent 34%)`,
        }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#7F96B7]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-[#7F96B7]">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18`, color }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "#3DDC97" : pct >= 60 ? "#FF9D42" : "#FF5A4F";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#7F96B7]">AI confidence</span>
        <span style={{ color }} className="font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [memberships, setMemberships] = useState<MembershipWithVenue[]>([]);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [venueSlug, setVenueSlug] = useState("");
  const [selected, setSelected] = useState<Crisis | null>(null);
  const [note, setNote] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { crises } = useRealtimeCrises(venueId);

  useEffect(() => {
    const init = async () => {
      const res = await fetch("/api/admin/context", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const rows = (data.venues || []).map((venue: { id: string; name: string; slug: string }) => ({
        id: venue.id,
        venue_id: venue.id,
        user_id: "current-user",
        role: "admin",
        is_on_duty: false,
        joined_at: new Date().toISOString(),
        venue: { name: venue.name, slug: venue.slug },
      }));
      setMemberships(rows);
      if (rows[0]) {
        setVenueId(rows[0].venue_id);
        setVenueSlug(rows[0].venue.slug);
      }
    };
    void init();
  }, []);

  const activeCrises = useMemo(() => crises.filter((c) => isActiveStatus(c.status)), [crises]);
  const avgConfidence = useMemo(() => {
    if (!crises.length) return 0;
    return Math.round((crises.reduce((a, b) => a + getConfidenceValue(getCrisisAiTriage(b)), 0) / crises.length) * 100);
  }, [crises]);
  const avgResponseMins = useMemo(() => {
    const resolved = crises.filter((c) => c.resolved_at && c.acknowledged_at);
    if (!resolved.length) return 0;
    const avg = resolved.reduce((a, c) => {
      return a + (new Date(c.resolved_at!).getTime() - new Date(c.acknowledged_at!).getTime()) / 60000;
    }, 0) / resolved.length;
    return Math.round(avg);
  }, [crises]);
  const onDutyCount = memberships.filter((m) => m.is_on_duty).length;

  const doAction = useCallback(async (fn: () => Promise<void>) => {
    setActionLoading(true);
    try { await fn(); } finally { setActionLoading(false); }
  }, []);

  const assignToSelf = async () => {
    if (!selected) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await fetch(`/api/crisis/${selected.id}/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: auth.user.id, note: "Assigned to self" }),
    });
    triggerTouchFeedback("success");
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    await fetch(`/api/crisis/${selected.id}/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    setNote("");
    triggerTouchFeedback(status === "resolved" ? "success" : "tap");
  };

  const retriage = async () => {
    if (!selected) return;
    await fetch(`/api/crisis/${selected.id}/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retriage: true, note: "AI retriage requested" }),
    });
    triggerTouchFeedback("tap");
  };

  const generateReport = async () => {
    if (!selected) return;
    const res = await fetch(`/api/crisis/${selected.id}/report`, { method: "POST" });
    const json = await res.json();
    if (json.report?.id) {
      triggerTouchFeedback("success");
      window.open(`/admin/reports/${json.report.id}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Command Center</h1>
          <p className="mt-1 text-sm text-[#7F96B7]">Real-time venue oversight with AI-assisted operations</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-[#AFC0D8]">
              Touch-optimized controls
            </span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Live AI queue
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {memberships.length > 1 && (
            <select
              className="h-9 rounded-lg border border-white/[0.08] bg-[rgba(4,9,17,0.6)] px-3 text-sm text-white"
              value={venueId || ""}
              onChange={(e) => {
                triggerTouchFeedback("tap");
                const id = e.target.value;
                setVenueId(id);
                const found = memberships.find((m) => m.venue_id === id);
                setVenueSlug(found?.venue.slug || "");
              }}
            >
              {memberships.map((m) => (
                <option key={m.venue_id} value={m.venue_id}>{m.venue?.name || m.venue_id}</option>
              ))}
            </select>
          )}
          <Button
            variant="outline"
            size="sm"
            className="touch-card h-9 border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08]"
            onClick={() => {
              triggerTouchFeedback("tap");
              setQrOpen(true);
            }}
          >
            <QrCode className="mr-2 h-4 w-4" /> QR Code
          </Button>
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Active Crises" value={activeCrises.length} sub="responding now" icon={AlertTriangle} color="#FF5A4F" />
        <MetricCard label="Avg Response" value={avgResponseMins ? `${avgResponseMins}m` : "—"} sub="today" icon={Clock} color="#FF9D42" />
        <MetricCard label="AI Confidence" value={`${avgConfidence}%`} sub="this week avg" icon={Bot} color="#68B0FF" />
        <MetricCard label="Staff On Duty" value={onDutyCount} sub={`of ${memberships.length} total`} icon={Users} color="#3DDC97" />
      </div>

      {/* Crisis queue */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(4,9,17,0.5)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-base font-semibold text-white">Live Queue</h2>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-[#7F96B7]">Real-time</span>
          </div>
        </div>

        {activeCrises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="h-12 w-12 text-green-400/40" />
            <p className="mt-3 text-sm text-[#7F96B7]">All clear — no active incidents</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {activeCrises.map((crisis, i) => {
              const sev = getEffectiveSeverity(crisis);
              const Icon = crisisTypeIcons[crisis.crisis_type] || AlertTriangle;
              return (
                <motion.button
                  key={crisis.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    triggerTouchFeedback("tap");
                    setSelected(crisis);
                  }}
                  className={cn(
                    "touch-card group w-full px-5 py-4 text-left transition-all hover:bg-white/[0.03]",
                    severityGlow[sev]
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]", crisisTypeColors[crisis.crisis_type])}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityBadge severity={sev} size="sm" />
                        <span className="text-sm font-medium text-white capitalize">{crisis.crisis_type}</span>
                        {crisis.guest_name && (
                          <span className="flex items-center gap-1 text-xs text-[#7F96B7]">
                            <User className="h-3 w-3" />{crisis.guest_name}
                            {crisis.room_number && ` · Rm ${crisis.room_number}`}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[#7F96B7]">{crisis.description}</p>
                    </div>
                    <div className="hidden shrink-0 items-center gap-3 sm:flex">
                      <StatusBadge status={crisis.status} />
                      <span className="flex items-center gap-1 text-xs text-[#7F96B7]">
                        <Clock className="h-3 w-3" />{timeAgo(crisis.created_at)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#7F96B7] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Crisis detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              className="relative my-4 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#080F1A]"
            >
              {/* Modal header */}
              <div className="flex items-start justify-between border-b border-white/[0.06] px-6 py-5">
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={getEffectiveSeverity(selected)} size="default" />
                  <div>
                    <h3 className="text-lg font-semibold capitalize text-white">
                      {selected.crisis_type} Emergency
                    </h3>
                    <p className="text-xs text-[#7F96B7]">
                      {selected.guest_name && `${selected.guest_name} · `}
                      {selected.room_number && `Room ${selected.room_number} · `}
                      {timeAgo(selected.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    triggerTouchFeedback("tap");
                    setSelected(null);
                  }}
                  className="rounded-lg p-1.5 text-[#7F96B7] hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 p-6">
                {/* Description */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wide text-[#7F96B7]">Description</p>
                  <p className="mt-2 text-sm leading-6 text-white">{selected.description}</p>
                  {selected.location_description && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[#7F96B7]">
                      <MapPin className="h-3.5 w-3.5" />{selected.location_description}
                    </p>
                  )}
                </div>

                {/* AI Assessment */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#7F96B7]">
                      <Bot className="h-3.5 w-3.5 text-[#68B0FF]" />AI Assessment
                    </p>
                    {getConfidenceValue(getCrisisAiTriage(selected)) > 0 && (
                      <ConfidenceBar value={getConfidenceValue(getCrisisAiTriage(selected))} />
                    )}
                    {getCrisisAiTriage(selected)?.severity && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#7F96B7]">AI Severity</span>
                        <SeverityBadge severity={getCrisisAiTriage(selected)?.severity ?? getEffectiveSeverity(selected)} size="sm" />
                      </div>
                    )}
                    {getCrisisAiTriage(selected)?.responder_focus && (
                      <div className="rounded-lg bg-[#68B0FF]/10 p-3 text-xs leading-5 text-[#68B0FF]">
                        <span className="font-semibold">Responder focus: </span>{getCrisisAiTriage(selected)?.responder_focus}
                      </div>
                    )}
                    {getReasoningText(getCrisisAiTriage(selected)?.reasoning) && (
                      <p className="text-xs leading-5 text-[#7F96B7]">{getReasoningText(getCrisisAiTriage(selected)?.reasoning)}</p>
                    )}
                  </div>

                  {/* Staff checklist */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="mb-3 text-xs uppercase tracking-wide text-[#7F96B7]">Staff Checklist</p>
                    <div className="space-y-2">
                      {(getCrisisAiTriage(selected)?.staff_checklist || []).map((item, i) => (
                        <label key={`${item.task}-${i}`} className="flex cursor-pointer items-start gap-2.5 text-sm">
                          <input
                            type="checkbox"
                            defaultChecked={item.completed}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 accent-[#68B0FF]"
                          />
                          <span className="leading-5 text-white">{item.task}</span>
                          <span className={cn("ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                            item.priority === "immediate" ? "bg-red-500/20 text-red-300" :
                            item.priority === "urgent" ? "bg-orange-500/20 text-orange-300" :
                            "bg-white/[0.06] text-[#7F96B7]"
                          )}>{item.priority}</span>
                        </label>
                      ))}
                      {!getCrisisAiTriage(selected)?.staff_checklist?.length && (
                        <p className="text-xs text-[#7F96B7]">No checklist available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photo */}
                {selected.photo_url && (
                  <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                    <p className="border-b border-white/[0.06] px-4 py-2 text-xs uppercase tracking-wide text-[#7F96B7]">Photo Evidence</p>
                    <Image src={selected.photo_url} alt="incident" width={1200} height={480} className="h-52 w-full object-cover" />
                  </div>
                )}

                {/* Note input */}
                <div>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add an operational note..."
                    className="resize-none border-white/[0.08] bg-white/[0.03] text-white placeholder:text-[#7F96B7] focus:border-[#68B0FF]/40"
                    rows={2}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => doAction(assignToSelf)} disabled={actionLoading}
                    className="touch-card bg-[#68B0FF]/20 text-[#68B0FF] hover:bg-[#68B0FF]/30 border border-[#68B0FF]/30">
                    <User className="mr-1.5 h-3.5 w-3.5" />Assign to me
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => doAction(() => updateStatus("responding"))} disabled={actionLoading}
                    className="touch-card border-white/[0.08] text-white hover:bg-white/[0.06]">
                    <Activity className="mr-1.5 h-3.5 w-3.5" />Responding
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => doAction(() => updateStatus("resolved"))} disabled={actionLoading}
                    className="touch-card border-green-500/30 text-green-400 hover:bg-green-500/10">
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Resolve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => doAction(retriage)} disabled={actionLoading}
                    className="touch-card border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Retriage AI
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => doAction(generateReport)} disabled={actionLoading}
                    className="touch-card border-white/[0.08] text-white hover:bg-white/[0.06]">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />Generate Report
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    triggerTouchFeedback("tap");
                    setSelected(null);
                  }}
                    className="touch-card ml-auto text-[#7F96B7] hover:text-white">
                    Close
                  </Button>
                </div>

                {/* Status strip */}
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-[#7F96B7]" />
                    <span className="text-sm text-[#7F96B7]">Current status:</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#7F96B7]">
                    <Zap className="h-3.5 w-3.5" />
                    {getCrisisAiTriage(selected)?.model_used ? `AI: ${getCrisisAiTriage(selected)?.model_used}` : "No AI data"}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <QrCodeModal open={qrOpen} onOpenChange={setQrOpen} slug={venueSlug || "venue"} />
    </div>
  );
}
