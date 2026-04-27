"use client";

import { CrisisUpdate } from "@/types/database";
import { motion } from "framer-motion";
import {
    AlertCircle,
    Eye,
    UserCheck,
    ArrowRight,
    CheckCircle2,
    MessageSquare,
    CheckSquare,
    Siren,
} from "lucide-react";
import { cn } from "@/lib/utils";

const updateIcons: Record<string, React.ElementType> = {
    created: AlertCircle,
    acknowledged: Eye,
    assigned: UserCheck,
    status_change: ArrowRight,
    resolved: CheckCircle2,
    comment: MessageSquare,
    checklist_completed: CheckSquare,
    escalated: Siren,
};

const updateColors: Record<string, string> = {
    created: "text-red-400 bg-red-500/10 border-red-500/30",
    acknowledged: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    assigned: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    status_change: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    resolved: "text-green-400 bg-green-500/10 border-green-500/30",
    comment: "text-gray-400 bg-gray-500/10 border-gray-500/30",
    checklist_completed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    escalated: "text-red-400 bg-red-500/10 border-red-500/30",
};

function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

export function Timeline({ updates }: { updates: CrisisUpdate[] }) {
    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-white/10 to-transparent" />

            <div className="space-y-4">
                {updates.map((update, index) => {
                    const Icon = updateIcons[update.update_type] || MessageSquare;
                    const colorClasses =
                        updateColors[update.update_type] || updateColors.comment;

                    return (
                        <motion.div
                            key={update.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            className="relative pl-10"
                        >
                            {/* Icon dot */}
                            <div
                                className={cn(
                                    "absolute left-1.5 w-5 h-5 rounded-full flex items-center justify-center border",
                                    colorClasses
                                )}
                            >
                                <Icon className="w-3 h-3" />
                            </div>

                            {/* Content */}
                            <div className="glass rounded-lg px-4 py-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm text-white font-medium">
                                        {update.message}
                                    </p>
                                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                                        <span>{formatTime(update.created_at)}</span>
                                        <span className="ml-1 opacity-50">
                                            {formatDate(update.created_at)}
                                        </span>
                                    </div>
                                </div>
                                {update.profile && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        by {update.profile.full_name}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
