"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Crisis, CrisisStatus, CrisisSeverity } from "@/types/database";
import { StatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { demoCrises } from "@/lib/demo-data";
import { getCrisisAiTriage, getReasoningText } from "@/lib/crisis-ai";
import {
    Siren,
    CheckCircle2,
    AlertTriangle,
    Info,
    Shield,
} from "lucide-react";
import Link from "next/link";

const statusSteps: CrisisStatus[] = [
    "reported",
    "triaged",
    "acknowledged",
    "assigned",
    "in_progress",
    "responding",
    "resolved",
    "closed",
    "dismissed",
];

const stepLabels: Record<CrisisStatus, string> = {
    reported: "Reported",
    triaged: "Triaged",
    acknowledged: "Acknowledged",
    assigned: "Staff Assigned",
    in_progress: "In Progress",
    responding: "Responding",
    resolved: "Resolved",
    closed: "Closed",
    dismissed: "Dismissed",
};

function getEffectiveSeverity(crisis: Crisis): CrisisSeverity {
    return crisis.severity_assessment ?? crisis.severity ?? crisis.ai_severity ?? "medium";
}

export default function CrisisStatusPage() {
    const params = useParams();
    const crisisId = params.id as string;
    const [crisis, setCrisis] = useState<Crisis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCrisis = async () => {
            try {
                const res = await fetch(`/api/public/crisis/${crisisId}`, { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setCrisis(data.crisis as Crisis);
                    setError("");
                    setLoading(false);
                    return;
                }
            } catch (fetchError) {
                console.error("Status polling error:", fetchError);
            }

            const demoCrisis = demoCrises.find((item) => item.id === crisisId);
            if (demoCrisis) setCrisis(demoCrisis);
            else setError("We could not load this live status page right now.");
            setLoading(false);
        };

        void fetchCrisis();
        const poll = window.setInterval(() => {
            void fetchCrisis();
        }, 6000);

        return () => {
            window.clearInterval(poll);
        };
    }, [crisisId]);

    if (loading) {
        return (
            <div className="app-shell min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!crisis) {
        return (
            <div className="app-shell min-h-screen flex items-center justify-center text-foreground">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
                    <h1 className="text-xl font-bold">Crisis Not Found</h1>
                    <p className="text-muted-foreground mt-2">
                        {error || "The crisis report could not be located."}
                    </p>
                    <Link
                        href="/report"
                        className="text-blue-400 hover:underline mt-4 inline-block"
                    >
                        Submit a new report
                    </Link>
                </div>
            </div>
        );
    }

    const currentStepIdx = statusSteps.indexOf(crisis.status);
    const triage = getCrisisAiTriage(crisis);
    const severity = getEffectiveSeverity(crisis);
    const summary = triage?.summary || getReasoningText(triage?.reasoning);

    return (
        <div className="app-shell min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-border bg-background/90 backdrop-blur-2xl">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#68B0FF] via-[#4F8CFF] to-[#FF7A59] flex items-center justify-center shadow-[0_12px_30px_rgba(79,140,255,0.2)]">
                            <Siren className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-base font-bold text-foreground">CrisisSync</span>
                    </Link>
                    <StatusBadge status={crisis.status} />
                </div>
            </header>

            {/* Status content */}
            <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                >
                    {/* Status header */}
                    <div className="panel-surface px-5 py-6 text-center sm:px-6">
                        {crisis.status === "resolved" ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 12 }}
                            >
                                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            </motion.div>
                        ) : (
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                <div className="w-4 h-4 rounded-full bg-blue-400 animate-pulse" />
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-white">
                            {crisis.status === "resolved"
                                ? "Crisis Resolved"
                                : "Help is on the way"}
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-[#90A2BC]">
                            Your report has been received and is being handled by our team.
                        </p>
                        {error ? (
                            <p className="mt-3 text-xs text-amber-300">
                                Live updates are delayed. Showing the latest available incident state.
                            </p>
                        ) : null}
                        <div className="mt-3">
                            <SeverityBadge severity={severity} size="lg" />
                        </div>
                    </div>

                    {/* Progress stepper */}
                    <div className="panel-surface p-5 sm:p-6 transition duration-200 hover:-translate-y-1">
                        <h3 className="text-sm font-semibold text-white mb-4">
                            Response Progress
                        </h3>
                        <div className="space-y-3">
                            {statusSteps.map((step, i) => {
                                const isCompleted = i <= currentStepIdx;
                                const isCurrent = i === currentStepIdx;

                                return (
                                    <div key={step} className="flex items-center gap-3">
                                        <div className="relative">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCompleted
                                                        ? "bg-green-500/20 border border-green-500/50"
                                                        : "bg-white/5 border border-white/10"
                                                    } ${isCurrent ? "ring-2 ring-blue-500/50 ring-offset-2 ring-offset-[#08111F]" : ""}`}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-white/20" />
                                                )}
                                            </div>
                                            {i < statusSteps.length - 1 && (
                                                <div
                                                    className={`absolute top-8 left-1/2 -translate-x-1/2 w-px h-3 ${isCompleted ? "bg-green-500/50" : "bg-white/10"
                                                        }`}
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p
                                                className={`text-sm font-medium ${isCompleted ? "text-white" : "text-[#7F96B7]"
                                                    }`}
                                            >
                                                {stepLabels[step]}
                                            </p>
                                        </div>
                                        {isCurrent && (
                                            <span className="text-xs text-blue-400 font-medium">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* AI Instructions */}
                    {triage && triage.guest_instructions && (
                        <div className="panel-surface p-5 sm:p-6 transition duration-200 hover:-translate-y-1">
                            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-400" />
                                Safety Instructions
                            </h3>
                            <div className="space-y-2">
                                {triage.guest_instructions.map((instruction: string, i: number) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5"
                                    >
                                        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                            <p className="text-sm text-[#AFC0D8]">
                                                {instruction}
                                            </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    {summary && (
                        <div className="panel-surface p-5 sm:p-6 transition duration-200 hover:-translate-y-1">
                            <h3 className="text-sm font-semibold text-white mb-2">
                                AI Assessment
                            </h3>
                            <p className="text-sm text-[#AFC0D8]">{summary}</p>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
