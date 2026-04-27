"use client";

import { Profile, StaffAvailability } from "@/types/database";
import { cn } from "@/lib/utils";
import { User, Radio, Moon, Zap, WifiOff } from "lucide-react";

const statusConfig: Record<
    string,
    { label: string; color: string; bg: string; dot: string; icon: React.ElementType }
> = {
    available: {
        label: "Available",
        color: "text-green-400",
        bg: "bg-green-500/10",
        dot: "bg-green-400",
        icon: User,
    },
    responding: {
        label: "Responding",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        dot: "bg-amber-400 animate-pulse",
        icon: Radio,
    },
    off_duty: {
        label: "Off Duty",
        color: "text-gray-400",
        bg: "bg-gray-500/10",
        dot: "bg-gray-400",
        icon: Moon,
    },
    busy: {
        label: "Busy",
        color: "text-red-400",
        bg: "bg-red-500/10",
        dot: "bg-red-400",
        icon: Zap,
    },
    offline: {
        label: "Offline",
        color: "text-gray-500",
        bg: "bg-gray-500/10",
        dot: "bg-gray-500",
        icon: WifiOff,
    },
};

const defaultStatusConfig = statusConfig.available;

interface StaffWithAvailability {
    profile: Profile;
    availability?: StaffAvailability;
}

export function StaffPanel({
    staff,
    onAssign,
}: {
    staff: StaffWithAvailability[];
    onAssign?: (staffId: string) => void;
}) {
    return (
        <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Staff Availability
            </h3>

            <div className="space-y-2">
                {staff.map((s) => {
                    const status = s.availability?.status || "available";
                    const config = statusConfig[status] ?? defaultStatusConfig;

                    return (
                        <div
                            key={s.profile.id}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all",
                                onAssign && status === "available" && "cursor-pointer hover:bg-white/[0.05]"
                            )}
                            onClick={() => {
                                if (onAssign && status === "available") {
                                    onAssign(s.profile.id);
                                }
                            }}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                {(s.profile.full_name || "?")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {s.profile.full_name || "Unknown"}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                                    <span className={cn("text-xs", config.color)}>
                                        {config.label}
                                    </span>
                                </div>
                            </div>
                            {onAssign && status === "available" && (
                                <span className="text-xs text-blue-400 font-medium">Assign</span>
                            )}
                        </div>
                    );
                })}

                {staff.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                        No staff members found
                    </p>
                )}
            </div>
        </div>
    );
}
