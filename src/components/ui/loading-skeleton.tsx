"use client";

import { motion } from "framer-motion";

interface LoadingSkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  lines?: number;
  variant?: "text" | "circular" | "rectangular";
}

export function LoadingSkeleton({ 
  className = "", 
  height = "h-4", 
  width = "w-full", 
  lines = 1,
  variant = "text" 
}: LoadingSkeletonProps) {
  const baseClasses = "bg-gradient-to-r from-white/[0.08] via-white/[0.15] to-white/[0.08] bg-[length:200%_100%] animate-shimmer rounded";
  
  if (variant === "circular") {
    return (
      <div className={`${baseClasses} rounded-full h-10 w-10 ${className}`} />
    );
  }
  
  if (variant === "rectangular") {
    return (
      <div className={`${baseClasses} ${height} ${width} ${className}`} />
    );
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${height} ${width} ${i === lines - 1 ? "w-3/4" : ""}`}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mobile-card"
    >
      <div className="flex items-start gap-4">
        <LoadingSkeleton variant="circular" />
        <div className="flex-1 space-y-3">
          <LoadingSkeleton height="h-5" width="w-3/4" />
          <LoadingSkeleton height="h-4" lines={2} />
        </div>
      </div>
    </motion.div>
  );
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
