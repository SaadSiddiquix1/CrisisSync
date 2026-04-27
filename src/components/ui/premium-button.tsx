"use client";

import { motion } from "framer-motion";
import { Button, ButtonProps } from "./button";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

interface PremiumButtonProps extends ButtonProps {
  loading?: boolean;
  glowEffect?: boolean;
  shimmer?: boolean;
}

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ children, loading = false, glowEffect = false, shimmer = false, className = "", disabled, ...props }, ref) => {
    return (
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        className="relative inline-block"
      >
        <Button
          ref={ref}
          disabled={disabled || loading}
          className={`
            relative overflow-hidden
            ${glowEffect ? "shadow-lg hover:shadow-xl transition-shadow duration-300" : ""}
            ${shimmer ? "shimmer" : ""}
            ${className}
          `}
          {...props}
        >
          {shimmer && !loading && (
            <div className="absolute inset-0 shimmer opacity-30" />
          )}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.div>
          )}
          <span className={loading ? "opacity-0" : "opacity-100"}>
            {children}
          </span>
        </Button>
      </motion.div>
    );
  }
);

PremiumButton.displayName = "PremiumButton";
