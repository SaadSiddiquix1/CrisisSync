"use client";

import Link from "next/link";
import { Globe2, Languages, MonitorPlay, Sparkles } from "lucide-react";
import { useShowcase } from "@/components/showcase-provider";
import { tShowcase } from "@/lib/showcase-i18n";

export function ShowcaseLocaleToggle() {
  const { locale, setLocale } = useShowcase();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 p-1 backdrop-blur">
      {(["en", "hi"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            locale === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tShowcase(locale, value === "en" ? "locale.en" : "locale.hi")}
        </button>
      ))}
    </div>
  );
}

export function ShowcaseModeToggle() {
  const { locale, showcaseMode, setShowcaseMode } = useShowcase();

  return (
    <button
      type="button"
      onClick={() => setShowcaseMode(!showcaseMode)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
        showcaseMode
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-border bg-background/70 text-muted-foreground"
      }`}
    >
      <MonitorPlay className="h-3.5 w-3.5" />
      {tShowcase(locale, "showcase.mode")}
    </button>
  );
}

export function ShowcaseStatusLinks() {
  const { locale, activeScenario } = useShowcase();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/status-board"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary/20 hover:text-primary"
      >
        <Globe2 className="h-3.5 w-3.5" />
        {tShowcase(locale, "showcase.statusBoard")}
      </Link>
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
        <Sparkles className="h-3.5 w-3.5" />
        {activeScenario ? tShowcase(locale, "showcase.live") : tShowcase(locale, "showcase.presenter")}
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
        <Languages className="h-3.5 w-3.5" />
        {tShowcase(locale, "showcase.locale")}
      </div>
    </div>
  );
}
