"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { Siren, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Venues", href: "/#venues" },
  { label: "Staff Demo", href: "/demo/staff" },
  { label: "Admin Demo", href: "/demo/admin" },
];

export function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progressX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 30,
    mass: 0.25,
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const shouldShow = !pathname.startsWith("/staff") && !pathname.startsWith("/admin") && !pathname.startsWith("/operator");
  const onHome = pathname === "/";

  if (!shouldShow) return null;

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed left-1/2 top-3 z-[100] w-[calc(100%-1.25rem)] max-w-5xl -translate-x-1/2 sm:w-[calc(100%-2rem)]"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.4rem] border px-3 shadow-sm backdrop-blur-xl transition-all duration-300 sm:px-4",
            scrolled
              ? "border-primary/15 bg-background/92 py-1.5 shadow-[0_24px_60px_rgba(4,12,24,0.45)]"
              : "border-border/70 bg-background/84 py-2.5"
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(106,169,255,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,138,107,0.12),transparent_30%)]" />
          <div className="relative flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2.5 touch-manipulation">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-[0_16px_32px_rgba(106,169,255,0.26)]">
                <motion.span
                  aria-hidden="true"
                  animate={
                    prefersReducedMotion
                      ? { opacity: [0.55, 0.95, 0.55] }
                      : { scale: [1, 1.16, 1], opacity: [0.4, 1, 0.4] }
                  }
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-xl bg-primary/25"
                />
                <Siren className="relative h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                CrisisSync
              </span>
              {onHome && (
                <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary sm:inline-flex">
                  Live demo
                </span>
              )}
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="touch-card rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/demo/staff"
                className="hidden rounded-xl px-3 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-accent sm:block"
              >
                Staff
              </Link>
              <Link
                href="/demo/admin"
                className="hidden rounded-xl px-3 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-accent sm:block"
              >
                Admin
              </Link>
              <Link
                href="/login"
                className="group touch-card flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-[0_16px_32px_rgba(106,169,255,0.24)] transition-all hover:opacity-95"
              >
                Log in
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
                className="touch-card flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-foreground md:hidden"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {onHome && (
            <motion.div
              style={{ scaleX: progressX }}
              className="absolute inset-x-3 bottom-0 h-px origin-left rounded-full bg-[linear-gradient(90deg,rgba(106,169,255,0.12),rgba(106,169,255,0.9),rgba(255,138,107,0.75))]"
            />
          )}
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 overflow-hidden rounded-2xl border border-border bg-background/95 shadow-[0_24px_50px_rgba(3,8,15,0.4)] backdrop-blur-xl"
            >
              <div className="space-y-1 p-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="touch-card block rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-border pt-2">
                  <Link
                    href="/demo/staff"
                    onClick={() => setMobileOpen(false)}
                    className="touch-card block rounded-xl px-4 py-2.5 text-sm text-primary transition-colors hover:bg-accent"
                  >
                    Staff Demo
                  </Link>
                  <Link
                    href="/demo/admin"
                    onClick={() => setMobileOpen(false)}
                    className="touch-card block rounded-xl px-4 py-2.5 text-sm text-primary transition-colors hover:bg-accent"
                  >
                    Admin Demo
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="touch-card block rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/report"
                    onClick={() => setMobileOpen(false)}
                    className="touch-card block rounded-xl px-4 py-2.5 text-sm text-primary transition-colors hover:bg-accent"
                  >
                    Report Emergency
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {!onHome && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="fixed bottom-5 left-5 z-40 hidden sm:block"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/85 px-4 py-2.5 text-sm text-muted-foreground shadow-sm backdrop-blur-xl transition-colors hover:text-foreground"
          >
            <Siren className="h-4 w-4 text-primary" />
            Back to website
          </Link>
        </motion.div>
      )}
    </>
  );
}
