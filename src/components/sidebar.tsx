"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PersonaSwitcher } from "@/components/persona-switcher";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Siren,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  hint: string;
}

const navByRole: Record<"staff" | "admin" | "operator", NavItem[]> = {
  staff: [
    {
      label: "Operations",
      href: "/staff/dashboard",
      icon: LayoutDashboard,
      hint: "Live queue and incident handling",
    },
    {
      label: "Guest Intake",
      href: "/report",
      icon: ClipboardList,
      hint: "Submit a manual incident report",
    },
  ],
  admin: [
    {
      label: "Command Center",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      hint: "Venue-wide response oversight",
    },
    {
      label: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      hint: "Operational trends and incident data",
    },
  ],
  operator: [
    {
      label: "Portfolio",
      href: "/operator/dashboard",
      icon: LayoutDashboard,
      hint: "Organizations, plans, and platform health",
    },
  ],
};

const roleCopy: Record<"staff" | "admin" | "operator", { badge: string; subtitle: string; status: string }> = {
  admin: {
    badge: "Admin Control",
    subtitle: "Venue-wide coordination",
    status: "Strategic oversight online",
  },
  staff: {
    badge: "Field Operations",
    subtitle: "Responder workspace",
    status: "Frontline responders connected",
  },
  operator: {
    badge: "Platform Operator",
    subtitle: "Multi-tenant control plane",
    status: "Tenant portfolio under watch",
  },
};

export function Sidebar({ role }: { role: "staff" | "admin" | "operator" }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = navByRole[role];
  const copy = roleCopy[role];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-5">
        <Link href={`/${role}/dashboard`} className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <Siren className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="eyebrow mb-1">{copy.badge}</div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">CrisisSync</h1>
            <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>
        </Link>
      </div>

      <div className="px-4 py-4">
        <div className="rounded-2xl border border-border bg-accent px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live system status
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">{copy.status}</p>
        </div>
      </div>

      <nav className="flex-1 px-3">
        <div className="eyebrow px-3 pb-3 pt-2">Workspace</div>
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-start gap-3 rounded-2xl border px-3 py-3 transition-all duration-200",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-foreground shadow-sm"
                    : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                    isActive
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive && <Activity className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border px-4 py-4">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-between rounded-2xl border border-border bg-accent px-4 py-3 text-sm text-foreground transition hover:border-primary/30"
        >
          <div>
            <div className="font-medium">Public site</div>
            <div className="text-xs text-muted-foreground">Return to the marketing experience</div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-primary" />
        </Link>

        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {role === "operator" ? "Platform Operator" : role === "admin" ? "Administrator" : "Responder"}
            </p>
            <p className="text-xs text-muted-foreground">
              {role === "operator" ? "Cross-organization control" : "Authenticated workspace"}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <PersonaSwitcher role={role} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background/90 text-foreground backdrop-blur-xl lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[288px] border-r border-border bg-sidebar/95 backdrop-blur-2xl lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="fixed left-0 top-0 z-[60] h-screen w-[88vw] max-w-[320px] border-r border-border bg-sidebar backdrop-blur-2xl lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
