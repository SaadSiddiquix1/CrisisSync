"use client";

import { Severity } from "@/types/database";
import { cn } from "@/lib/utils";

const severityConfig: Record<
    Severity,
    { label: string; color: string; bg: string; ring: string; animate?: string }
> = {
    critical: {
        label: "Critical",
        color: "text-red-100",
        bg: "bg-red-500/20",
        ring: "ring-red-500/50",
        animate: "animate-pulse-red",
    },
    high: {
        label: "High",
        color: "text-amber-100",
        bg: "bg-amber-500/20",
        ring: "ring-amber-500/50",
    },
    medium: {
        label: "Medium",
        color: "text-blue-100",
        bg: "bg-blue-500/20",
        ring: "ring-blue-500/50",
    },
    low: {
        label: "Low",
        color: "text-green-100",
        bg: "bg-green-500/20",
        ring: "ring-green-500/50",
    },
};

export function SeverityBadge({
    severity,
    size = "default",
}: {
    severity: Severity;
    size?: "sm" | "default" | "lg";
}) {
    const config = severityConfig[severity];

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 font-semibold ring-1 ring-inset rounded-full",
                config.color,
                config.bg,
                config.ring,
                config.animate,
                size === "sm" && "px-2 py-0.5 text-xs",
                size === "default" && "px-2.5 py-1 text-xs",
                size === "lg" && "px-3 py-1.5 text-sm"
            )}
        >
            <span
                className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    severity === "critical" && "bg-red-400",
                    severity === "high" && "bg-amber-400",
                    severity === "medium" && "bg-blue-400",
                    severity === "low" && "bg-green-400"
                )}
            />
            {config.label}
        </span>
    );
}
