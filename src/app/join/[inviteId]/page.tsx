"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, Loader2, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { OrganizationAdminInvite } from "@/types/database";

type InvitePayload = OrganizationAdminInvite & {
    organization?: { name: string; status?: string } | null;
    venue?: { name: string; mode?: string } | null;
    venues?: { id: string; name: string; mode?: string }[] | null;
};

export default function JoinInvitePage() {
    const params = useParams<{ inviteId: string }>();
    const router = useRouter();
    const inviteId = String(params.inviteId ?? "");

    const [invite, setInvite] = useState<InvitePayload | null>(null);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loadingInvite, setLoadingInvite] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadInvite = async () => {
            try {
                const res = await fetch(`/api/invites/${inviteId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Invite not found.");
                setInvite(data.invite);
                setFullName(data.invite.full_name ?? "");
                setEmail(data.invite.email ?? "");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Invite not found.");
            } finally {
                setLoadingInvite(false);
            }
        };

        if (inviteId) {
            loadInvite();
        }
    }, [inviteId]);

    const roleLabel = useMemo(() => {
        if (!invite) return "team member";
        if (invite.role === "org_admin") return "organization administrator";
        if (invite.role === "venue_admin") return "venue administrator";
        if (invite.role === "manager") return "operations manager";
        return "responder";
    }, [invite]);

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invite) return;

        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            const supabase = createClient();

            let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            let user = signInData.user ?? null;

            if (signInError) {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName },
                    },
                });

                if (signUpError) {
                    throw new Error(signUpError.message);
                }

                user = signUpData.user ?? null;

                const retry = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                signInData = retry.data;
                signInError = retry.error;
                user = retry.data.user ?? user;
            }

            if (!user || signInError) {
                throw new Error(
                    "Account created, but your session was not ready yet. Try signing in once more to finish accepting the invite."
                );
            }

            const acceptRes = await fetch(`/api/invites/${inviteId}/accept`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: fullName }),
            });
            const acceptData = await acceptRes.json();

            if (!acceptRes.ok) {
                throw new Error(acceptData.error || "Failed to accept invite.");
            }

            setSuccess("Workspace access activated. Redirecting you now...");
            router.push(acceptData.redirect_to ?? "/staff/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to accept invite.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="app-shell relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[10%] top-[10%] h-72 w-72 rounded-full bg-[#68B0FF]/15 blur-[120px]" />
                <div className="absolute bottom-[10%] right-[10%] h-80 w-80 rounded-full bg-[#3DDC97]/10 blur-[140px]" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-[1280px] flex-col justify-center px-5 py-10 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <section className="panel-surface relative overflow-hidden px-6 py-8 lg:px-10 lg:py-10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(61,220,151,0.12),transparent_36%)]" />
                        <div className="relative">
                            <Link href="/" className="inline-flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#68B0FF] via-[#4F8CFF] to-[#3DDC97]">
                                    <ShieldCheck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <div className="eyebrow mb-1">Secure invite</div>
                                    <div className="text-xl font-semibold tracking-tight text-white">CrisisSync</div>
                                </div>
                            </Link>

                            <div className="mt-12">
                                <div className="eyebrow mb-4">Tenant onboarding</div>
                            <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
                                    Join your hospitality response workspace with the right role on day one.
                                </h1>
                                <p className="mt-5 max-w-xl text-base leading-7 text-[#9CB0CB]">
                                    This flow assigns invited teammates to the correct organization, venue, and
                                    responder permissions automatically, so operations stay clean as you scale.
                                </p>
                            </div>

                            <div className="mt-10 grid gap-4">
                                {loadingInvite ? (
                                    <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5 text-sm text-[#8DA1BD]">
                                        Loading invite context...
                                    </div>
                                ) : invite ? (
                                    <>
                                        <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5">
                                            <div className="flex items-start gap-3">
                                                <Building2 className="mt-1 h-5 w-5 text-[#9FD0FF]" />
                                                <div>
                                                    <div className="eyebrow mb-2">Organization</div>
                                                    <div className="text-lg font-semibold text-white">
                                                        {invite.organization?.name ?? "Assigned organization"}
                                                    </div>
                                                    <div className="mt-2 text-sm text-[#8DA1BD]">
                                                        Joining as {roleLabel}.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5">
                                            <div className="flex items-start gap-3">
                                                <UserPlus className="mt-1 h-5 w-5 text-[#8CF2C4]" />
                                                <div>
                                                    <div className="eyebrow mb-2">Default venue</div>
                                                    <div className="text-lg font-semibold text-white">
                                                        {invite.venues && invite.venues.length > 0
                                                            ? invite.venues.map((venue) => venue.name).join(" • ")
                                                            : invite.venue?.name ?? "Portfolio-wide access"}
                                                    </div>
                                                    <div className="mt-2 text-sm text-[#8DA1BD]">
                                                        {invite.venue?.mode
                                                            ? `Primary mode: ${invite.venue.mode.replace("_", " ")}`
                                                            : invite.venues && invite.venues.length > 1
                                                              ? `${invite.venues.length} venues assigned with one default workspace`
                                                              : "Venue assignment will follow your role."}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-[1.35rem] border border-[#FF5A4F]/18 bg-[#FF5A4F]/10 p-5 text-sm text-[#FFC9C3]">
                                        This invite is unavailable or has already expired.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="panel-surface flex flex-col justify-between px-6 py-8 lg:px-8 lg:py-9">
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="eyebrow mb-2">Accept invite</div>
                                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">Activate workspace access</h2>
                                </div>
                                <div className="rounded-full border border-[#3DDC97]/25 bg-[#3DDC97]/10 px-3 py-1 text-xs font-medium text-[#8CF2C4]">
                                    Guided setup
                                </div>
                            </div>

                            <p className="mt-3 text-sm leading-6 text-[#90A2BC]">
                                Use the invited email to sign in or create your account. We’ll attach your
                                organization membership and route you straight into the right workspace.
                            </p>

                            <form onSubmit={handleAccept} className="mt-8 space-y-4">
                                <div className="space-y-2">
                                    <label className="eyebrow block">Full name</label>
                                    <Input
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="eyebrow flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-[#68B0FF]" />
                                        Invited email
                                    </label>
                                    <Input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="eyebrow block">Password</label>
                                    <Input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Use your workspace password"
                                        className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                                    />
                                </div>

                                {error && (
                                    <div className="rounded-2xl border border-[#FF5A4F]/20 bg-[#FF5A4F]/10 px-4 py-3 text-sm text-[#FFC9C3]">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="rounded-2xl border border-[#3DDC97]/20 bg-[#3DDC97]/10 px-4 py-3 text-sm text-[#D5FCEA]">
                                        {success}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={submitting || !invite}
                                    className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#68B0FF] via-[#4F8CFF] to-[#2C73FF] text-white"
                                >
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                    {submitting ? "Provisioning access..." : "Join workspace"}
                                </Button>
                            </form>
                        </div>

                        <div className="mt-8 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
                            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                                <CheckCircle2 className="h-4 w-4 text-[#8CF2C4]" />
                                What happens next
                            </div>
                            <div className="space-y-2 text-sm text-[#8DA1BD]">
                                <p>Your profile is attached to the invited organization.</p>
                                <p>Your role becomes {roleLabel} with the right dashboard access.</p>
                                <p>Your venue access list and default venue are saved for routing and staffing views.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
