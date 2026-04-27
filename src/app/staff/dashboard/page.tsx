"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Bell, CheckCircle2, Clock, Flame, Heart,
  MapPin, Shield, Building2, AlertTriangle, X,
  ArrowRight, Radio, Zap
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeCrises } from "@/hooks/use-realtime-crises";
import { Crisis, CrisisSeverity, CrisisType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { isActiveStatus } from "@/lib/crisis-status";
import { cn } from "@/lib/utils";
import { triggerTouchFeedback } from "@/lib/feedback";
import { getConfidenceValue, getCrisisAiTriage } from "@/lib/crisis-ai";

const crisisTypeIcons: Record<CrisisType, React.ElementType> = {
  fire: Flame, medical: Heart, security: Shield,
  maintenance: Building2, other: AlertTriangle,
};

const severityBar: Record<CrisisSeverity, string> = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-green-400",
};

function getEffectiveSeverity(c: Crisis): CrisisSeverity {
  return c.severity_assessment ?? c.severity ?? c.ai_severity ?? "medium";
}

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function StaffDashboard() {
  const supabase = createClient();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [onDuty, setOnDuty] = useState(false);
  const [selected, setSelected] = useState<Crisis | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { crises } = useRealtimeCrises(venueId);

  useEffect(() => {
    const bootstrap = async () => {
      const res = await fetch("/api/staff/context", { cache: "no-store" });
      if (res.ok) {
        const context = await res.json();
        if (context.default_venue_id) {
          setVenueId(context.default_venue_id);
        }
      }
      setOnDuty(true);
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
    };
    void bootstrap();
  }, [supabase]);

  const queue = useMemo(
    () => crises.filter((c) => isActiveStatus(c.status)),
    [crises]
  );

  const toggleDuty = async () => {
    const next = !onDuty;
    triggerTouchFeedback(next ? "success" : "tap");
    setOnDuty(next);
  };

  const claimCrisis = async (crisisId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await fetch(`/api/crisis/${crisisId}/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: auth.user.id, status: "assigned", note: "Claimed by responder" }),
    });
    triggerTouchFeedback("success");
  };

  const updateStatus = async (status: "responding" | "resolved") => {
    if (!selected) return;
    setLoading(true);
    await fetch(`/api/crisis/${selected.id}/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note: note || `Status changed to ${status}` }),
    });
    setNote("");
    setLoading(false);
    triggerTouchFeedback(status === "resolved" ? "success" : "tap");
    if (status === "resolved") setSelected(null);
  };

  return (
    <div className="min-h-screen space-y-5 p-4 sm:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Response Center</h1>
          <p className="mt-0.5 text-sm text-[#7F96B7]">Mobile command — stay ready</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-[#AFC0D8]">
              Touch quick actions
            </span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {queue.length} live incident{queue.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7F96B7]">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications on</span>
        </div>
      </motion.div>

      {/* Duty toggle — big and prominent */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onClick={() => void toggleDuty()}
        className={cn(
          "touch-card relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300",
          onDuty
            ? "border-green-500/30 bg-green-500/10"
            : "border-white/[0.08] bg-white/[0.03]"
        )}
      >
        <div
          className={cn(
            "aurora-pan pointer-events-none absolute inset-0 opacity-70",
            onDuty
              ? "bg-[radial-gradient(circle_at_top_left,rgba(61,220,151,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(104,176,255,0.14),transparent_30%)]"
              : "bg-[radial-gradient(circle_at_top_left,rgba(104,176,255,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]"
          )}
        />
        <div className={cn(
          "absolute inset-x-0 top-0 h-px transition-all",
          onDuty ? "bg-gradient-to-r from-transparent via-green-400/50 to-transparent" : "bg-transparent"
        )} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
              onDuty ? "bg-green-500/20" : "bg-white/[0.06]"
            )}>
              <Radio className={cn("h-6 w-6 transition-colors", onDuty ? "text-green-400" : "text-[#7F96B7]")} />
            </div>
            <div>
              <p className={cn("text-base font-semibold", onDuty ? "text-green-400" : "text-white")}>
                {onDuty ? "On Duty" : "Off Duty"}
              </p>
              <p className="text-xs text-[#7F96B7]">
                {onDuty ? "You are receiving crisis alerts" : "Tap to go on duty"}
              </p>
            </div>
          </div>
          {/* Toggle pill */}
          <div className={cn(
            "relative h-7 w-12 rounded-full border transition-all duration-300",
            onDuty ? "border-green-500/50 bg-green-500" : "border-white/[0.15] bg-white/[0.08]"
          )}>
            <motion.div
              animate={{ x: onDuty ? 22 : 2 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
            />
          </div>
        </div>
        {onDuty && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="mt-3 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">{queue.length} active incident{queue.length !== 1 ? "s" : ""} in your venue</span>
          </motion.div>
        )}
      </motion.button>

      {/* Crisis queue */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#7F96B7]">
          Active Incidents ({queue.length})
        </h2>
        <div className="space-y-3">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-12">
              <CheckCircle2 className="h-10 w-10 text-green-400/40" />
              <p className="mt-3 text-sm text-[#7F96B7]">No active incidents</p>
            </div>
          ) : (
            queue.map((crisis, i) => {
              const sev = getEffectiveSeverity(crisis);
              const Icon = crisisTypeIcons[crisis.crisis_type] || AlertTriangle;
              return (
                <motion.div
                  key={crisis.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="touch-card overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(4,9,17,0.5)]"
                >
                  {/* Severity color strip */}
                  <div className={cn("h-1 w-full", severityBar[sev])} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[#90A2BC]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <SeverityBadge severity={sev} size="sm" />
                          <span className="text-sm font-medium text-white capitalize">{crisis.crisis_type}</span>
                          <span className="ml-auto text-xs text-[#7F96B7]">{timeAgo(crisis.created_at)}</span>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-[#7F96B7] line-clamp-2">{crisis.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#7F96B7]">
                          {crisis.location_description && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{crisis.location_description}</span>
                          )}
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /><StatusBadge status={crisis.status} /></span>
                          {getConfidenceValue(getCrisisAiTriage(crisis)) > 0 && (
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />{Math.round(getConfidenceValue(getCrisisAiTriage(crisis)) * 100)}% AI conf.
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            className="h-9 flex-1 bg-[#68B0FF]/20 text-[#68B0FF] hover:bg-[#68B0FF]/30 border border-[#68B0FF]/30"
                            onClick={() => {
                              triggerTouchFeedback("tap");
                              void claimCrisis(crisis.id);
                            }}
                          >
                            Claim <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 border-white/[0.08] text-white hover:bg-white/[0.06]"
                            onClick={() => {
                              triggerTouchFeedback("tap");
                              setSelected(crisis);
                            }}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Crisis detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 48 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="w-full max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-white/[0.1] bg-[#080F1A] sm:max-w-lg sm:rounded-2xl sm:border"
            >
              {/* Drag handle (mobile) */}
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />

              {/* Header */}
              <div className="flex items-start justify-between px-5 pb-4 pt-5">
                <div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={getEffectiveSeverity(selected)} />
                    <span className="text-base font-semibold capitalize text-white">{selected.crisis_type}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#7F96B7]">
                    {selected.guest_name && `${selected.guest_name} · `}
                    {selected.room_number && `Room ${selected.room_number} · `}
                    {timeAgo(selected.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    triggerTouchFeedback("tap");
                    setSelected(null);
                  }}
                  className="rounded-lg p-1.5 text-[#7F96B7] hover:bg-white/[0.06]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 px-5 pb-8">
                <p className="text-sm leading-6 text-[#B9CAE0]">{selected.description}</p>

                {/* Guest instructions */}
                {getCrisisAiTriage(selected)?.guest_instructions?.length ? (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="mb-3 text-xs uppercase tracking-wide text-[#7F96B7]">Guest Instructions</p>
                    <ol className="space-y-2">
                      {getCrisisAiTriage(selected)?.guest_instructions?.map((ins, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#68B0FF]/20 text-[10px] font-bold text-[#68B0FF]">{i + 1}</span>
                          <span className="leading-5">{ins}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {/* AI focus */}
                {getCrisisAiTriage(selected)?.responder_focus && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#68B0FF]/20 bg-[#68B0FF]/10 p-4">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#68B0FF]" />
                    <div>
                      <p className="text-xs font-semibold text-[#68B0FF]">Responder Priority</p>
                      <p className="mt-1 text-sm text-white">{getCrisisAiTriage(selected)?.responder_focus}</p>
                    </div>
                  </div>
                )}

                {/* Checklist */}
                {getCrisisAiTriage(selected)?.staff_checklist?.length ? (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="mb-3 text-xs uppercase tracking-wide text-[#7F96B7]">Staff Checklist</p>
                    <div className="space-y-2.5">
                      {getCrisisAiTriage(selected)?.staff_checklist?.map((item, i) => (
                        <label key={i} className="flex cursor-pointer items-start gap-3 text-sm">
                          <input type="checkbox" defaultChecked={item.completed}
                            className="mt-0.5 h-4 w-4 accent-[#68B0FF]" />
                          <span className="text-white">{item.task}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Note */}
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="resize-none border-white/[0.08] bg-white/[0.03] text-white placeholder:text-[#7F96B7]"
                />

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="touch-card h-12 bg-[#68B0FF]/20 text-[#68B0FF] border border-[#68B0FF]/30 hover:bg-[#68B0FF]/30"
                    onClick={() => void updateStatus("responding")}
                    disabled={loading}
                  >
                    <Activity className="mr-2 h-4 w-4" />Responding
                  </Button>
                  <Button
                    className="touch-card h-12 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    onClick={() => void updateStatus("resolved")}
                    disabled={loading}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />Resolved
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="touch-card w-full text-[#7F96B7] hover:text-white"
                  onClick={() => {
                    triggerTouchFeedback("tap");
                    setSelected(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
