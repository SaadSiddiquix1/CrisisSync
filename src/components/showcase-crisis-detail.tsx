"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  MapPin,
  Play,
  Shield,
  Sparkles,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { getCrisisAiTriage, getConfidenceValue, getReasoningText } from "@/lib/crisis-ai";
import { getPhaseLabel, tShowcase } from "@/lib/showcase-i18n";
import { Crisis, ShowcaseLocale, ShowcaseScenario } from "@/types/database";

type ShowcaseBundle = {
  scenario: ShowcaseScenario;
  phase: ShowcaseScenario["replayFrames"][number]["phase"];
  crisis: Crisis;
  guestStatus: ShowcaseScenario["guestStatuses"][keyof ShowcaseScenario["guestStatuses"]];
  timeline: ReturnType<typeof Timeline> extends never ? never : Array<{
    id: string;
    crisis_id: string;
    updated_by?: string | null;
    update_type: string;
    message: string;
    created_at: string;
  }>;
  events: ShowcaseScenario["events"];
};

export function ShowcaseCrisisDetail({
  crisis,
  locale,
  bundle,
  note,
  onNoteChange,
  footer,
  titleSuffix,
}: {
  crisis: Crisis;
  locale: ShowcaseLocale;
  bundle?: ShowcaseBundle | null;
  note?: string;
  onNoteChange?: (value: string) => void;
  footer?: React.ReactNode;
  titleSuffix?: string;
}) {
  const triage = getCrisisAiTriage(crisis);
  const [replayIndex, setReplayIndex] = useState(
    bundle ? bundle.scenario.replayFrames.findIndex((frame) => frame.phase === bundle.phase) : 0
  );
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!bundle) return;
    const currentIndex = bundle.scenario.replayFrames.findIndex((frame) => frame.phase === bundle.phase);
    setReplayIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [bundle]);

  useEffect(() => {
    if (!bundle || !playing) return;
    const interval = window.setInterval(() => {
      setReplayIndex((current) => {
        const next = Math.min(current + 1, bundle.scenario.replayFrames.length - 1);
        if (next === bundle.scenario.replayFrames.length - 1) {
          window.clearInterval(interval);
          setPlaying(false);
        }
        return next;
      });
    }, 2200);

    return () => window.clearInterval(interval);
  }, [bundle, playing]);

  const activeFrame = useMemo(() => {
    if (!bundle) return null;
    return bundle.scenario.replayFrames[replayIndex] ?? bundle.scenario.replayFrames[0];
  }, [bundle, replayIndex]);

  const checklist = useMemo(
    () =>
      (triage?.staff_checklist || []).map((item) => ({
        task: item.task ?? item.item_text ?? "Checklist item",
        priority: item.priority ?? "standard",
        completed: Boolean(item.completed ?? item.is_completed),
      })),
    [triage?.staff_checklist]
  );

  const confidence = getConfidenceValue(triage);
  const reasoning = getReasoningText(triage?.reasoning);

  return (
    <div className="space-y-4 px-5 pb-8">
      <div className="overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,25,42,0.92),rgba(7,12,20,0.94))]">
        <div className="aurora-pan bg-[radial-gradient(circle_at_top_left,rgba(106,169,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,138,107,0.18),transparent_30%)] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={crisis.severity_assessment ?? crisis.severity ?? triage?.severity ?? "medium"} size="default" />
            <StatusBadge status={crisis.status} />
            {bundle && (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {getPhaseLabel(locale, bundle.phase)}
              </span>
            )}
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {bundle?.scenario.title || `${crisis.crisis_type} Emergency`}
            {titleSuffix ? ` ${titleSuffix}` : ""}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#C5D3E8]">
            {bundle?.scenario.description || crisis.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#9CB2CF]">
            {bundle?.scenario.venueName ? (
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">{bundle.scenario.venueName}</span>
            ) : null}
            {crisis.location_description ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {crisis.location_description}
              </span>
            ) : null}
            {bundle?.scenario.roomNumber ? (
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">Zone {bundle.scenario.roomNumber}</span>
            ) : null}
          </div>
        </div>
      </div>

      {bundle && (
        <div className="grid gap-3 sm:grid-cols-3">
          {bundle.scenario.highlightMetrics.map((metric) => (
            <div key={metric.label} className="rounded-[1.3rem] border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#7F96B7]">{metric.label}</p>
              <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
              <p className="mt-1 text-xs leading-5 text-[#AFC0D8]">{metric.detail}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-primary" />
              {tShowcase(locale, "showcase.incidentCommander")}
            </div>
            <p className="mt-3 text-sm leading-6 text-[#D3DDF0]">{bundle?.scenario.responderFocus || triage?.responder_focus}</p>
            {reasoning ? <p className="mt-3 text-xs leading-5 text-[#8FA5C2]">{reasoning}</p> : null}
            {confidence > 0 ? (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-[#7F96B7]">AI confidence</span>
                  <span className="font-semibold text-[#9FD0FF]">{Math.round(confidence * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(confidence * 100)}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#68B0FF] to-[#8AD8FF]"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {bundle && activeFrame ? (
            <div className="rounded-[1.4rem] border border-primary/15 bg-primary/8 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#AFCBFF]">{tShowcase(locale, "showcase.replay")}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{activeFrame.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#D3DDF0]">{activeFrame.summary}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="touch-card border-primary/20 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  onClick={() => setPlaying((current) => !current)}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {playing ? tShowcase(locale, "showcase.pause") : tShowcase(locale, "showcase.play")}
                </Button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7F96B7]">Ops note</p>
                  <p className="mt-2 text-sm leading-6 text-white">{activeFrame.operatorNote}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7F96B7]">{tShowcase(locale, "showcase.guestStatus")}</p>
                  <p className="mt-2 text-sm leading-6 text-white">{activeFrame.guestNote}</p>
                </div>
              </div>

              <div className="mt-4">
                <input
                  type="range"
                  min={0}
                  max={bundle.scenario.replayFrames.length - 1}
                  value={replayIndex}
                  onChange={(event) => {
                    setPlaying(false);
                    setReplayIndex(Number(event.target.value));
                  }}
                  className="w-full accent-[#68B0FF]"
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="touch-card text-[#AFC0D8] hover:text-white"
                    onClick={() => {
                      setPlaying(false);
                      setReplayIndex((current) => Math.max(0, current - 1));
                    }}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {tShowcase(locale, "showcase.previous")}
                  </Button>
                  <p className="text-xs text-[#9CB2CF]">{activeFrame.statusLabel}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="touch-card text-[#AFC0D8] hover:text-white"
                    onClick={() => {
                      setPlaying(false);
                      setReplayIndex((current) => Math.min(bundle.scenario.replayFrames.length - 1, current + 1));
                    }}
                  >
                    {tShowcase(locale, "showcase.next")}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Bot className="h-4 w-4 text-primary" />
              {tShowcase(locale, "showcase.ai")}
            </div>
            <p className="mt-3 text-sm leading-6 text-[#D3DDF0]">{bundle?.scenario.aiSummary || triage?.summary || crisis.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(bundle?.scenario.guestInstructions || triage?.guest_instructions || []).map((item) => (
                <div key={item} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-[#BFD1EA]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <ClipboardList className="h-4 w-4 text-primary" />
              {tShowcase(locale, "showcase.actions")}
            </div>
            <div className="space-y-2.5">
              {checklist.map((item, index) => (
                <div key={`${item.task}-${index}`} className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                  <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${item.completed ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[0.06] text-[#7F96B7]"}`}>
                    {item.completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white">{item.task}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#7F96B7]">{item.priority}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {bundle ? (
            <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Shield className="h-4 w-4 text-primary" />
                {tShowcase(locale, "showcase.guestStatus")}
              </div>
              <p className="mt-3 text-base font-semibold text-white">{bundle.guestStatus.headline}</p>
              <p className="mt-2 text-sm leading-6 text-[#D3DDF0]">{bundle.guestStatus.subline}</p>
              <div className="mt-4 space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#7F96B7]">{bundle.guestStatus.eta}</p>
                <p className="text-sm text-[#BFD1EA]">{bundle.guestStatus.advisory}</p>
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-primary" />
              {tShowcase(locale, "showcase.evidence")}
            </div>
            <div className="space-y-2.5">
              {(bundle?.scenario.evidence || []).map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7F96B7]">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-white">{item.value}</p>
                </div>
              ))}
              {!bundle?.scenario.evidence?.length && crisis.photo_url && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-sm text-white">Photo evidence available for this incident.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Activity className="h-4 w-4 text-primary" />
              {tShowcase(locale, "showcase.timeline")}
            </div>
            <Timeline updates={(bundle?.timeline || []).map((item) => ({ ...item, profile: undefined }))} />
          </div>

          {bundle ? (
            <Link
              href={`/admin/reports/${bundle.scenario.reportId}`}
              className="touch-card inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary"
            >
              <FileText className="h-4 w-4" />
              {tShowcase(locale, "showcase.report")}
            </Link>
          ) : null}

          {typeof note === "string" && onNoteChange ? (
            <Textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Add an operational note..."
              className="min-h-24 resize-none border-white/[0.08] bg-white/[0.03] text-white placeholder:text-[#7F96B7]"
            />
          ) : null}
        </div>
      </div>

      {footer}
    </div>
  );
}
