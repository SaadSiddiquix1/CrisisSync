"use client";

import { Activity, Bot, CheckCircle2, Clock3, Flame, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useShowcase } from "@/components/showcase-provider";
import { ScenarioLauncher } from "@/components/scenario-launcher";
import {
  ShowcaseLocaleToggle,
  ShowcaseModeToggle,
  ShowcaseStatusLinks,
} from "@/components/showcase-controls";
import { getPhaseLabel, getScenarioLabel, tShowcase } from "@/lib/showcase-i18n";

export function ShowcaseDashboardTools({
  venueId,
  venueName,
}: {
  venueId: string | null;
  venueName?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ShowcaseLocaleToggle />
      <ShowcaseModeToggle />
      <ScenarioLauncher venueId={venueId} venueName={venueName} compact />
    </div>
  );
}

export function ShowcaseActivePanel() {
  const { activeScenario, activePhase, activeGuestStatus, showcaseMode, locale } = useShowcase();

  const metrics = useMemo(() => {
    if (!activeScenario) {
      return [
        { label: "Mode", value: showcaseMode ? "Showcase" : "Standard", icon: Sparkles },
        { label: "Launcher", value: "Ready", icon: Flame },
        { label: "Status board", value: "Standby", icon: CheckCircle2 },
      ];
    }

    return activeScenario.highlightMetrics.map((item, index) => ({
      label: item.label,
      value: item.value,
      icon: [Activity, Clock3, Bot][index] ?? Sparkles,
      detail: item.detail,
    }));
  }, [activeScenario, showcaseMode]);

  return (
    <div className="space-y-4">
      <ShowcaseStatusLinks />
      <div className="overflow-hidden rounded-[1.7rem] border border-primary/18 bg-[linear-gradient(180deg,rgba(18,28,44,0.95),rgba(8,12,20,0.96))]">
        <div className="aurora-pan bg-[radial-gradient(circle_at_top_left,rgba(106,169,255,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,138,107,0.12),transparent_32%)] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {showcaseMode ? tShowcase(locale, "showcase.mode") : "Live demo"}
            </span>
            {activeScenario && activePhase ? (
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white">
                {getScenarioLabel(locale, activeScenario.type)} · {getPhaseLabel(locale, activePhase)}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#AFCBFF]">{tShowcase(locale, "showcase.active")}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {activeScenario ? activeScenario.title : tShowcase(locale, "showcase.none")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#D3DDF0]">
                {activeScenario ? activeScenario.description : tShowcase(locale, "showcase.noneSub")}
              </p>
              {activeGuestStatus ? (
                <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">{activeGuestStatus.headline}</p>
                  <p className="mt-1 text-sm leading-6 text-[#BFD1EA]">{activeGuestStatus.subline}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#7F96B7]">{activeGuestStatus.eta}</p>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#7F96B7]">{metric.label}</p>
                    <metric.icon className="h-4 w-4 text-[#9FD0FF]" />
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">{metric.value}</p>
                  {"detail" in metric && metric.detail ? (
                    <p className="mt-1 text-xs leading-5 text-[#AFC0D8]">{metric.detail}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
