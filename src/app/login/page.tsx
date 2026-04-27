"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Siren,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { ShowcaseLocaleToggle, ShowcaseModeToggle } from "@/components/showcase-controls";
import { useShowcase } from "@/components/showcase-provider";
import { tShowcase } from "@/lib/showcase-i18n";

type LoginTab = "staff" | "admin" | "operator";
type SessionRole = "staff" | "admin" | "operator" | null;

const seededDemoAccounts = {
  admin: { email: "admin@crisissync.demo", password: "DemoPass123!" },
  staff: { email: "staff@crisissync.demo", password: "DemoPass123!" },
} as const;

function isAllowedNext(next: string | null, role: SessionRole) {
  if (!next || !role) return false;
  if (role === "operator") return next.startsWith("/operator");
  if (role === "admin") return next.startsWith("/admin");
  return next.startsWith("/staff");
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { locale } = useShowcase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<LoginTab>("staff");
  const [sessionRole, setSessionRole] = useState<SessionRole>(null);
  const [sessionEmail, setSessionEmail] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  const requestedRole = (searchParams.get("role") as LoginTab | null) ?? null;
  const nextParam = searchParams.get("next");

  useEffect(() => {
    if (requestedRole && ["staff", "admin", "operator"].includes(requestedRole)) {
      setTab(requestedRole);
    }
  }, [requestedRole]);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSessionRole(null);
        setSessionEmail("");
        setSessionChecked(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, platform_role")
        .eq("user_id", user.id)
        .maybeSingle();

      const resolvedRole: SessionRole =
        profile?.platform_role === "platform_operator"
          ? "operator"
          : profile?.role === "admin"
            ? "admin"
            : profile?.role === "staff"
              ? "staff"
              : null;

      setSessionRole(resolvedRole);
      setSessionEmail(user.email || "");
      setSessionChecked(true);
    };

    void loadSession();
  }, [supabase]);

  const dashboardHref = useMemo(() => {
    if (sessionRole === "operator") return "/operator/dashboard";
    if (sessionRole === "admin") return "/admin/dashboard";
    if (sessionRole === "staff") return "/staff/dashboard";
    return "/";
  }, [sessionRole]);

  const resolveRedirect = (role: SessionRole) => {
    if (isAllowedNext(nextParam, role)) return nextParam as string;
    if (role === "operator") return "/operator/dashboard";
    if (role === "admin") return "/admin/dashboard";
    return "/staff/dashboard";
  };

  const routeAuthenticatedUser = async (userEmail?: string | null) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, platform_role")
      .eq("user_id", user.id)
      .single();

    const resolvedRole: SessionRole =
      profile?.platform_role === "platform_operator"
        ? "operator"
        : profile?.role === "admin"
          ? "admin"
          : "staff";

    setSessionRole(resolvedRole);
    setSessionEmail(userEmail || user.email || "");
    router.push(resolveRedirect(resolvedRole));
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw new Error(authError.message);
      await routeAuthenticatedUser(data.user?.email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: "staff" | "admin") => {
    setError("");
    setLoading(true);
    try {
      await supabase.auth.signOut();
      const creds = seededDemoAccounts[role];
      const { data, error: authError } = await supabase.auth.signInWithPassword(creds);
      if (authError) throw new Error(authError.message);
      await routeAuthenticatedUser(data.user?.email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Demo login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signOutToPortal = async (prefillRole?: LoginTab) => {
    setLoading(true);
    setError("");
    try {
      await supabase.auth.signOut();
      setSessionRole(null);
      setSessionEmail("");
      if (prefillRole) {
        setTab(prefillRole);
        if (prefillRole !== "operator") {
          setEmail(seededDemoAccounts[prefillRole].email);
          setPassword(seededDemoAccounts[prefillRole].password);
        } else {
          setEmail("");
          setPassword("");
        }
      } else {
        setEmail("");
        setPassword("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell relative min-h-[100svh] overflow-hidden px-4 pb-16 pt-24 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora-pan absolute left-1/2 top-0 h-[52vh] w-[110%] -translate-x-1/2 bg-[radial-gradient(ellipse_54%_44%_at_50%_0%,rgba(51,109,255,0.18),transparent)]" />
        <div className="absolute bottom-0 right-0 h-[34vh] w-[54%] bg-[radial-gradient(circle_at_100%_100%,rgba(255,122,89,0.14),transparent)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#68B0FF] via-[#4F8CFF] to-[#FF7A59] shadow-[0_16px_40px_rgba(79,140,255,0.3)]">
              <Siren className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">CrisisSync</p>
              <p className="text-xs text-muted-foreground">{tShowcase(locale, "login.badge")}</p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <ShowcaseLocaleToggle />
            <ShowcaseModeToggle />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[2rem] border border-border bg-card/60 p-6 backdrop-blur-xl sm:p-8"
          >
            <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {tShowcase(locale, "login.badge")}
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {tShowcase(locale, "login.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {tShowcase(locale, "login.subtitle")}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: tShowcase(locale, "login.admin"),
                  description: "Command center, analytics, dossier, and judge-ready scenario controls.",
                },
                {
                  icon: UserCheck,
                  title: tShowcase(locale, "login.staff"),
                  description: "Mobile-first response surface with live queue, replay, and action focus.",
                },
                {
                  icon: Sparkles,
                  title: tShowcase(locale, "login.operator"),
                  description: "Platform-level oversight for organizations, venues, and SaaS story depth.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-primary">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#AFC0D8]">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.7rem] border border-primary/18 bg-primary/10 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#AFCBFF]">{tShowcase(locale, "login.seeded")}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">{tShowcase(locale, "login.admin")}</p>
                  <p className="mt-2 font-mono text-sm text-[#CFE3FF]">{seededDemoAccounts.admin.email}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">{tShowcase(locale, "login.staff")}</p>
                  <p className="mt-2 font-mono text-sm text-[#CFE3FF]">{seededDemoAccounts.staff.email}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#AFC0D8]">
                {tShowcase(locale, "login.passwordLabel")}: <span className="font-mono">DemoPass123!</span>
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(13,18,28,0.94),rgba(7,10,18,0.94))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8"
          >
            {sessionChecked && sessionRole ? (
              <div className="space-y-4">
                <div className="rounded-[1.6rem] border border-primary/18 bg-primary/10 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#AFCBFF]">{tShowcase(locale, "login.session")}</p>
                  <p className="mt-3 text-lg font-semibold text-white">{sessionEmail}</p>
                  <p className="mt-1 text-sm text-[#BFD1EA]">
                    {sessionRole === "admin"
                      ? tShowcase(locale, "login.admin")
                      : sessionRole === "staff"
                        ? tShowcase(locale, "login.staff")
                        : tShowcase(locale, "login.operator")}
                  </p>
                </div>

                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(isAllowedNext(nextParam, sessionRole) ? (nextParam as string) : dashboardHref)}
                    className="touch-card rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-white/16 hover:bg-white/[0.05]"
                  >
                    <p className="text-sm font-semibold text-white">{tShowcase(locale, "login.continue")}</p>
                    <p className="mt-1 text-sm text-[#AFC0D8]">{dashboardHref}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => void signOutToPortal(tab)}
                    className="touch-card rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-white/16 hover:bg-white/[0.05]"
                  >
                    <p className="text-sm font-semibold text-white">{tShowcase(locale, "login.switch")}</p>
                    <p className="mt-1 text-sm text-[#AFC0D8]">Sign out and reopen the role portal on the selected tab.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => void signOutToPortal()}
                    className="touch-card rounded-[1.5rem] border border-red-500/20 bg-red-500/10 px-4 py-4 text-left transition hover:bg-red-500/14"
                  >
                    <p className="text-sm font-semibold text-white">{tShowcase(locale, "login.signout")}</p>
                    <p className="mt-1 text-sm text-[#F5C6C2]">Clear the session completely and sign in again manually.</p>
                  </button>
                </div>
              </div>
            ) : (
              <Tabs value={tab} onValueChange={(value) => setTab(value as LoginTab)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white/[0.04] p-1">
                  <TabsTrigger value="staff" className="rounded-[1rem] text-sm">
                    {tShowcase(locale, "login.staff")}
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="rounded-[1rem] text-sm">
                    {tShowcase(locale, "login.admin")}
                  </TabsTrigger>
                  <TabsTrigger value="operator" className="rounded-[1rem] text-sm">
                    {tShowcase(locale, "login.operator")}
                  </TabsTrigger>
                </TabsList>

                {(["staff", "admin", "operator"] as const).map((role) => (
                  <TabsContent key={role} value={role} className="mt-5">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#7F96B7]">
                          {role === "operator" ? tShowcase(locale, "login.manual") : tShowcase(locale, "login.demo")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {role === "operator"
                            ? tShowcase(locale, "login.operator")
                            : role === "admin"
                              ? tShowcase(locale, "login.admin")
                              : tShowcase(locale, "login.staff")}
                        </p>
                      </div>

                      {role !== "operator" && (
                        <Button
                          type="button"
                          disabled={loading}
                          className="h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(106,169,255,0.22)]"
                          onClick={() => void handleDemoLogin(role)}
                        >
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {role === "admin" ? tShowcase(locale, "login.quickAdmin") : tShowcase(locale, "login.quickStaff")}
                        </Button>
                      )}

                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#7F96B7]">
                            <Mail className="h-3.5 w-3.5" />
                            {tShowcase(locale, "login.email")}
                          </label>
                          <Input
                            type="email"
                            required
                            placeholder="you@venue.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] px-4 text-white placeholder:text-[#6F84A2]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#7F96B7]">
                            <Lock className="h-3.5 w-3.5" />
                            {tShowcase(locale, "login.password")}
                          </label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              required
                              placeholder="••••••••"
                              value={password}
                              onChange={(event) => setPassword(event.target.value)}
                              className="h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] px-4 pr-11 text-white placeholder:text-[#6F84A2]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((current) => !current)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7F96B7] transition-colors hover:text-white"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {error ? (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-[#FFB4AA]"
                          >
                            {error}
                          </motion.div>
                        ) : null}

                        <Button
                          type="submit"
                          disabled={loading}
                          className="h-12 w-full rounded-2xl bg-white text-sm font-semibold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing in…
                            </>
                          ) : (
                            <>
                              {tShowcase(locale, "login.submit")}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}

            <div className="mt-6 space-y-3">
              <Link
                href="/report"
                className="touch-card flex w-full items-center justify-center gap-2 rounded-2xl border border-[#FF7A59]/20 bg-[#FF7A59]/10 py-3 text-sm font-medium text-[#FFC2B3] transition-colors hover:bg-[#FF7A59]/14"
              >
                Report an Emergency
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/status-board"
                className="touch-card flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-[#C5D3E8] transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                View guest status board
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
