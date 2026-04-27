import { Crisis, CrisisType, Severity } from "@/types/database";

type SlaTargets = {
    acknowledgeMinutes: number;
    resolveMinutes: number;
};

const severityResolveTargets: Record<Severity, number> = {
    critical: 12,
    high: 20,
    medium: 45,
    low: 90,
};

const crisisAcknowledgeTargets: Record<CrisisType, number> = {
    fire: 1,
    medical: 2,
    security: 3,
    maintenance: 8,
    other: 5,
};

export function getSlaTargets(crisis: Crisis): SlaTargets {
    return {
        acknowledgeMinutes: crisisAcknowledgeTargets[crisis.crisis_type] ?? 5,
        resolveMinutes: severityResolveTargets[crisis.severity_assessment ?? crisis.severity ?? crisis.ai_severity ?? "medium"] ?? 45,
    };
}

export function getSlaSnapshot(crisis: Crisis, now = Date.now()) {
    const createdAt = new Date(crisis.created_at).getTime();
    const acknowledgedAt = crisis.acknowledged_at ? new Date(crisis.acknowledged_at).getTime() : null;
    const resolvedAt = crisis.resolved_at ? new Date(crisis.resolved_at).getTime() : null;
    const targets = getSlaTargets(crisis);

    const acknowledgeDueAt = createdAt + targets.acknowledgeMinutes * 60_000;
    const resolveBase = acknowledgedAt ?? createdAt;
    const resolveDueAt = resolveBase + targets.resolveMinutes * 60_000;

    const activeAcknowledge = !acknowledgedAt && !["resolved", "dismissed"].includes(crisis.status);
    const activeResolve =
        !resolvedAt && !["resolved", "dismissed"].includes(crisis.status) && ["acknowledged", "assigned", "responding"].includes(crisis.status);

    const acknowledgeRemainingMs = acknowledgeDueAt - now;
    const resolveRemainingMs = resolveDueAt - now;

    return {
        targets,
        acknowledgeDueAt,
        resolveDueAt,
        activeAcknowledge,
        activeResolve,
        acknowledgeRemainingMs,
        resolveRemainingMs,
        acknowledgeState: getTimerState(acknowledgeRemainingMs),
        resolveState: getTimerState(resolveRemainingMs),
    };
}

type TimerState = "on_track" | "at_risk" | "overdue";

function getTimerState(remainingMs: number): TimerState {
    if (remainingMs <= 0) return "overdue";
    if (remainingMs <= 60_000) return "at_risk";
    return "on_track";
}

export function formatTimer(ms: number) {
    const absolute = Math.abs(ms);
    const totalSeconds = Math.floor(absolute / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const label = `${minutes}:${String(seconds).padStart(2, "0")}`;
    return ms < 0 ? `-${label}` : label;
}

export function timerTone(state: "on_track" | "at_risk" | "overdue") {
    if (state === "overdue") return "border-[#FF5A4F]/24 bg-[#FF5A4F]/12 text-[#FFC3BC]";
    if (state === "at_risk") return "border-[#FF9D42]/24 bg-[#FF9D42]/12 text-[#FFD6A8]";
    return "border-[#68B0FF]/18 bg-[#68B0FF]/10 text-[#CFE3FF]";
}
