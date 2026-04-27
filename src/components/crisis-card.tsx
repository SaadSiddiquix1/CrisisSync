"use client";

import { Crisis, CrisisSeverity } from "@/types/database";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
    Flame,
    Heart,
    Shield,
    Wrench,
    AlertTriangle,
    MapPin,
    Clock,
    DoorOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const crisisIcons: Record<string, React.ElementType> = {
    fire: Flame,
    medical: Heart,
    security: Shield,
    maintenance: Wrench,
    other: AlertTriangle,
};

const crisisColors: Record<string, string> = {
    fire: "text-red-400",
    medical: "text-pink-400",
    security: "text-blue-400",
    maintenance: "text-yellow-400",
    other: "text-gray-400",
};

function timeAgo(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

function getEffectiveSeverity(crisis: Crisis): CrisisSeverity {
    return crisis.severity_assessment ?? crisis.severity ?? crisis.ai_severity ?? "medium";
}

export function CrisisCard({
    crisis,
    onClick,
    compact = false,
}: {
    crisis: Crisis;
    onClick?: () => void;
    compact?: boolean;
}) {
    const Icon = crisisIcons[crisis.crisis_type] || AlertTriangle;
    const iconColor = crisisColors[crisis.crisis_type] || "text-gray-400";
    const severity = getEffectiveSeverity(crisis);

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            <Card
                className={cn(
                    "glass cursor-pointer transition-all duration-200 hover:bg-white/[0.08] hover:border-white/20 group",
                    severity === "critical" && "border-red-500/30 animate-glow-red",
                    severity === "high" && "border-amber-500/20"
                )}
                onClick={onClick}
            >
                <div className={cn("p-4", compact ? "p-3" : "p-4")}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                            <div
                                className={cn(
                                    "p-2 rounded-lg bg-white/5 shrink-0",
                                    iconColor
                                )}
                            >
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-white text-sm capitalize group-hover:text-blue-200 transition-colors">
                                    {crisis.crisis_type} Emergency
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {crisis.description}
                                </p>
                            </div>
                        </div>
                        <SeverityBadge severity={severity} size="sm" />
                    </div>

                    {!compact && (
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <DoorOpen className="w-3.5 h-3.5" />
                                Room {crisis.room_number || "—"}
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {crisis.location_description || "Unknown"}
                            </span>
                            <span className="flex items-center gap-1 ml-auto">
                                <Clock className="w-3.5 h-3.5" />
                                {timeAgo(crisis.created_at)}
                            </span>
                        </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                        <StatusBadge status={crisis.status} />
                        {crisis.assigned_staff && (
                            <span className="text-xs text-muted-foreground">
                                → {crisis.assigned_staff.full_name}
                            </span>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
