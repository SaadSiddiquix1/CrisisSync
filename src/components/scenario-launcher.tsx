"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, HeartPulse, PlayCircle, ShieldAlert, Sparkles, UtensilsCrossed } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useShowcase } from "@/components/showcase-provider";
import { ScenarioType } from "@/types/database";
import { getScenarioLabel, tShowcase } from "@/lib/showcase-i18n";

const scenarioOptions: Array<{
  type: ScenarioType;
  icon: React.ElementType;
  color: string;
  description: string;
}> = [
  {
    type: "fire",
    icon: Flame,
    color: "from-red-500/25 to-orange-500/20 text-red-300",
    description: "Smoke, corridor isolation, dual dispatch, and dramatic all-clear.",
  },
  {
    type: "medical",
    icon: HeartPulse,
    color: "from-rose-500/25 to-orange-500/15 text-rose-200",
    description: "Lobby collapse with public-safe updates and fast medical routing.",
  },
  {
    type: "security",
    icon: ShieldAlert,
    color: "from-sky-500/25 to-indigo-500/20 text-sky-200",
    description: "Restricted-area access breach with route lock and reassurance.",
  },
  {
    type: "vip_panic",
    icon: Sparkles,
    color: "from-amber-400/25 to-orange-500/15 text-amber-100",
    description: "Crowd surge control at a VIP lane with hospitality-grade comms.",
  },
  {
    type: "kitchen_hazard",
    icon: UtensilsCrossed,
    color: "from-emerald-500/25 to-cyan-500/15 text-emerald-100",
    description: "Back-of-house hazard containment plus service continuity story.",
  },
];

export function ScenarioLauncher({
  venueId,
  venueName,
  compact = false,
}: {
  venueId: string | null;
  venueName?: string;
  compact?: boolean;
}) {
  const { locale, activeScenario, launchScenario } = useShowcase();
  const [open, setOpen] = useState(false);

  const triggerCopy = useMemo(
    () => (compact ? tShowcase(locale, "showcase.launcher") : getScenarioLabel(locale, activeScenario?.type ?? "fire")),
    [activeScenario?.type, compact, locale]
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={`touch-card inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary shadow-[0_14px_36px_rgba(106,169,255,0.16)] ${
          compact ? "" : "w-full justify-center sm:w-auto"
        }`}
      >
        <PlayCircle className="h-4 w-4" />
        {compact ? triggerCopy : tShowcase(locale, "showcase.launcher")}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88vh] rounded-t-[2rem] border-t border-border bg-[rgba(6,10,18,0.96)] px-0 pb-8 pt-0 text-white backdrop-blur-3xl">
        <SheetHeader className="border-b border-white/6 px-5 pb-4 pt-5">
          <SheetTitle className="text-lg text-white">{tShowcase(locale, "showcase.launcher")}</SheetTitle>
          <SheetDescription className="text-[#9CB2CF]">
            {tShowcase(locale, "showcase.launcherSub")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-5 pt-5">
          {activeScenario && (
            <div className="rounded-[1.5rem] border border-primary/20 bg-primary/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#AFCBFF]">{tShowcase(locale, "showcase.active")}</p>
              <p className="mt-2 text-lg font-semibold text-white">{activeScenario.title}</p>
              <p className="mt-1 text-sm text-[#BFD1EA]">{activeScenario.locationLabel}</p>
            </div>
          )}

          <div className="grid gap-3">
            {scenarioOptions.map((scenario) => {
              const Icon = scenario.icon;
              return (
                <motion.button
                  key={scenario.type}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  disabled={!venueId}
                  onClick={() => {
                    if (!venueId) return;
                    launchScenario(scenario.type, { venueId, venueName });
                    setOpen(false);
                  }}
                  className="touch-card overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/16 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${scenario.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold text-white">{getScenarioLabel(locale, scenario.type)}</p>
                        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[#9CB2CF]">
                          Mobile-first
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#AFC0D8]">{scenario.description}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
