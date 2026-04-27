"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  Crisis,
  ScenarioPhase,
  ScenarioType,
  ShowcaseEvent,
  ShowcaseGuestStatus,
  ShowcaseLocale,
  ShowcaseScenario,
} from "@/types/database";
import {
  buildShowcaseCrisis,
  buildShowcaseTimelineUpdates,
  createShowcaseScenario,
  getScenarioPhaseAtTime,
  getShowcaseGuestStatus,
  getShowcaseScenarioByCrisisId,
  getShowcaseScenarioByReportId,
  isScenarioComplete,
  SHOWCASE_PHASES,
  SHOWCASE_STORAGE_KEY,
} from "@/lib/showcase";
import { getPhaseLabel, getScenarioLabel, tShowcase } from "@/lib/showcase-i18n";

type ShowcaseStorageState = {
  showcaseMode: boolean;
  locale: ShowcaseLocale;
  activeScenario: ShowcaseScenario | null;
  archivedScenarios: ShowcaseScenario[];
};

type ShowcaseScenarioBundle = {
  scenario: ShowcaseScenario;
  phase: ScenarioPhase;
  crisis: Crisis;
  guestStatus: ShowcaseGuestStatus;
  timeline: ReturnType<typeof buildShowcaseTimelineUpdates>;
  events: ShowcaseEvent[];
};

type ShowcaseContextValue = ShowcaseStorageState & {
  hydrated: boolean;
  now: number;
  activePhase: ScenarioPhase | null;
  activeCrisis: Crisis | null;
  activeGuestStatus: ShowcaseGuestStatus | null;
  activeTimeline: ReturnType<typeof buildShowcaseTimelineUpdates>;
  setLocale: (locale: ShowcaseLocale) => void;
  setShowcaseMode: (value: boolean) => void;
  launchScenario: (type: ScenarioType, venue: { venueId: string; venueName?: string }) => void;
  clearActiveScenario: () => void;
  getScenarioBundleByCrisisId: (crisisId?: string | null) => ShowcaseScenarioBundle | null;
  getScenarioBundleByReportId: (reportId?: string | null) => ShowcaseScenarioBundle | null;
  overlayCrises: (realCrises: Crisis[]) => Crisis[];
};

const defaultState: ShowcaseStorageState = {
  showcaseMode: true,
  locale: "en",
  activeScenario: null,
  archivedScenarios: [],
};

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null);

export function ShowcaseProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<ShowcaseStorageState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(Date.now());
  const lastPhaseRef = useRef<ScenarioPhase | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SHOWCASE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ShowcaseStorageState;
        setState({
          showcaseMode: parsed.showcaseMode ?? true,
          locale: parsed.locale ?? "en",
          activeScenario: parsed.activeScenario ?? null,
          archivedScenarios: parsed.archivedScenarios?.slice(0, 3) ?? [],
        });
      }
    } catch {
      setState(defaultState);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!state.activeScenario) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [state.activeScenario]);

  const activePhase = useMemo(
    () => (state.activeScenario ? getScenarioPhaseAtTime(state.activeScenario, now) : null),
    [now, state.activeScenario]
  );

  const activeCrisis = useMemo(
    () => (state.activeScenario ? buildShowcaseCrisis(state.activeScenario, now) : null),
    [now, state.activeScenario]
  );

  const activeGuestStatus = useMemo(
    () => (state.activeScenario && activePhase ? getShowcaseGuestStatus(state.activeScenario, activePhase) : null),
    [activePhase, state.activeScenario]
  );

  const activeTimeline = useMemo(
    () =>
      state.activeScenario && activePhase
        ? buildShowcaseTimelineUpdates(state.activeScenario, activePhase)
        : [],
    [activePhase, state.activeScenario]
  );

  useEffect(() => {
    if (!state.activeScenario || !activePhase) {
      lastPhaseRef.current = null;
      return;
    }

    if (!lastPhaseRef.current) {
      lastPhaseRef.current = activePhase;
      return;
    }

    if (lastPhaseRef.current !== activePhase) {
      const label = getPhaseLabel(state.locale, activePhase);
      toast.success(`${getScenarioLabel(state.locale, state.activeScenario.type)} · ${label}`, {
        description: state.activeScenario.replayFrames.find((frame) => frame.phase === activePhase)?.summary,
      });
      lastPhaseRef.current = activePhase;
    }
  }, [activePhase, state.activeScenario, state.locale]);

  const setLocale = useCallback((locale: ShowcaseLocale) => {
    setState((current) => ({ ...current, locale }));
  }, []);

  const setShowcaseMode = useCallback((value: boolean) => {
    setState((current) => ({ ...current, showcaseMode: value }));
  }, []);

  const clearActiveScenario = useCallback(() => {
    setState((current) => ({ ...current, activeScenario: null }));
  }, []);

  const launchScenario = useCallback(
    (type: ScenarioType, venue: { venueId: string; venueName?: string }) => {
      setState((current) => {
        const nextScenario = createShowcaseScenario(type, venue);
        const archivedScenarios = current.activeScenario
          ? isScenarioComplete(current.activeScenario)
            ? [current.activeScenario, ...current.archivedScenarios].slice(0, 3)
            : current.archivedScenarios
          : current.archivedScenarios;

        return {
          ...current,
          activeScenario: nextScenario,
          archivedScenarios,
        };
      });

      setNow(Date.now());
      lastPhaseRef.current = null;
      toast.success(tShowcase(state.locale, "showcase.launcher"), {
        description: getScenarioLabel(state.locale, type),
      });
    },
    [state.locale]
  );

  const buildBundle = useCallback(
    (scenario: ShowcaseScenario | null) => {
      if (!scenario) return null;

      const phase =
        state.activeScenario?.id === scenario.id
          ? getScenarioPhaseAtTime(scenario, now)
          : SHOWCASE_PHASES[SHOWCASE_PHASES.length - 1];

      return {
        scenario,
        phase,
        crisis: buildShowcaseCrisis(
          scenario,
          state.activeScenario?.id === scenario.id ? now : new Date(scenario.startedAt).getTime() + 999_999
        ),
        guestStatus: getShowcaseGuestStatus(scenario, phase),
        timeline: buildShowcaseTimelineUpdates(scenario, phase),
        events: scenario.events,
      } satisfies ShowcaseScenarioBundle;
    },
    [now, state.activeScenario]
  );

  const getScenarioBundleByCrisisId = useCallback(
    (crisisId?: string | null) => {
      const scenarios = [state.activeScenario, ...state.archivedScenarios].filter(Boolean) as ShowcaseScenario[];
      return buildBundle(getShowcaseScenarioByCrisisId(scenarios, crisisId));
    },
    [buildBundle, state.activeScenario, state.archivedScenarios]
  );

  const getScenarioBundleByReportId = useCallback(
    (reportId?: string | null) => {
      const scenarios = [state.activeScenario, ...state.archivedScenarios].filter(Boolean) as ShowcaseScenario[];
      return buildBundle(getShowcaseScenarioByReportId(scenarios, reportId));
    },
    [buildBundle, state.activeScenario, state.archivedScenarios]
  );

  const overlayCrises = useCallback(
    (realCrises: Crisis[]) => {
      if (!activeCrisis) return realCrises;
      return [activeCrisis, ...realCrises.filter((crisis) => crisis.id !== activeCrisis.id)];
    },
    [activeCrisis]
  );

  const value = useMemo<ShowcaseContextValue>(
    () => ({
      ...state,
      hydrated,
      now,
      activePhase,
      activeCrisis,
      activeGuestStatus,
      activeTimeline,
      setLocale,
      setShowcaseMode,
      launchScenario,
      clearActiveScenario,
      getScenarioBundleByCrisisId,
      getScenarioBundleByReportId,
      overlayCrises,
    }),
    [
      state,
      hydrated,
      now,
      activePhase,
      activeCrisis,
      activeGuestStatus,
      activeTimeline,
      setLocale,
      setShowcaseMode,
      launchScenario,
      clearActiveScenario,
      getScenarioBundleByCrisisId,
      getScenarioBundleByReportId,
      overlayCrises,
    ]
  );

  return <ShowcaseContext.Provider value={value}>{children}</ShowcaseContext.Provider>;
}

export function useShowcase() {
  const context = useContext(ShowcaseContext);
  if (!context) {
    throw new Error("useShowcase must be used within ShowcaseProvider");
  }

  return context;
}

export function useShowcaseCrises(realCrises: Crisis[]) {
  const { overlayCrises } = useShowcase();
  return useMemo(() => overlayCrises(realCrises), [overlayCrises, realCrises]);
}
