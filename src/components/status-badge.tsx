"use client";

import { CrisisStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    Eye,
    UserCheck,
    ArrowRight,
    CheckCircle2,
    Play,
    XCircle,
    Search,
} from "lucide-react";

const statusConfig: Record<
    CrisisStatus,
    { label: string; color: string; bg: string; icon: React.ElementType }
> = {
    reported: {
        label: "Reported",
        color: "text-red-300",
        bg: "bg-red-500/10",
        icon: AlertCircle,
    },
    triaged: {
        label: "Triaged",
        color: "text-cyan-300",
        bg: "bg-cyan-500/10",
        icon: Search,
    },
    acknowledged: {
        label: "Acknowledged",
        color: "text-yellow-300",
        bg: "bg-yellow-500/10",
        icon: Eye,
    },
    assigned: {
        label: "Assigned",
        color: "text-blue-300",
        bg: "bg-blue-500/10",
        icon: UserCheck,
    },
    in_progress: {
        label: "In Progress",
        color: "text-purple-300",
        bg: "bg-purple-500/10",
        icon: Play,
    },
    responding: {
        label: "Responding",
        color: "text-purple-300",
        bg: "bg-purple-500/10",
        icon: ArrowRight,
    },
    resolved: {
        label: "Resolved",
        color: "text-green-300",
        bg: "bg-green-500/10",
        icon: CheckCircle2,
    },
    closed: {
        label: "Closed",
        color: "text-gray-300",
        bg: "bg-gray-500/10",
        icon: CheckCircle2,
    },
    dismissed: {
        label: "Dismissed",
        color: "text-gray-300",
        bg: "bg-gray-500/10",
        icon: XCircle,
    },
};

export function StatusBadge({ status }: { status: CrisisStatus }) {
    const config = statusConfig[status] ?? statusConfig.reported;
    const Icon = config.icon;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                config.color,
                config.bg
            )}
        >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
        </span>
    );
}
