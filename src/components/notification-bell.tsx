"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";

export function NotificationBell({
    count = 0,
    onClick,
}: {
    count?: number;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="relative p-2 rounded-lg glass-hover text-muted-foreground hover:text-white transition-colors"
        >
            <Bell className="w-5 h-5" />
            {count > 0 && (
                <>
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    >
                        {count > 9 ? "9+" : count}
                    </motion.span>
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full notification-ping" />
                </>
            )}
        </button>
    );
}
