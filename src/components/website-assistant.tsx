"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
    ArrowUpRight,
    Bot,
    Loader2,
    MessageSquare,
    Send,
    Sparkles,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AssistantPage =
    | "home"
    | "report"
    | "report-status"
    | "login"
    | "onboarding"
    | "unknown";

type ChatMessage = {
    id: string;
    role: "assistant" | "user";
    content: string;
};

const quickActionsByPage: Record<AssistantPage, { label: string; prompt: string; href?: string }[]> = {
    home: [
        { label: "What can I do here?", prompt: "What can I do on this website?" },
        { label: "How do I report an incident?", prompt: "How do I report an incident?" },
        { label: "Where do staff sign in?", prompt: "Where do staff sign in?", href: "/login" },
    ],
    report: [
        { label: "Help me fill this form", prompt: "Can you guide me through this report form?" },
        { label: "What should I include?", prompt: "What details should I include in the report?" },
        { label: "Go to home", prompt: "Take me back to the main page.", href: "/" },
    ],
    "report-status": [
        { label: "What does this page mean?", prompt: "What should I expect on this status page?" },
        { label: "How do I get help faster?", prompt: "How can I get help faster from here?" },
        { label: "Open report page", prompt: "Take me to the report page.", href: "/report" },
    ],
    login: [
        { label: "Who should sign in here?", prompt: "Who is this sign-in page for?" },
        { label: "Can I access a demo?", prompt: "Can I access a demo from here?" },
        { label: "Open report page", prompt: "I need to report an incident instead.", href: "/report" },
    ],
    onboarding: [
        { label: "How does setup work?", prompt: "Can you explain the onboarding flow?" },
        { label: "What is this page for?", prompt: "What is this page for?" },
        { label: "Go to home", prompt: "Take me back to the main page.", href: "/" },
    ],
    unknown: [
        { label: "What can I do here?", prompt: "What can I do on this website?" },
        { label: "Report an incident", prompt: "How do I report an incident?", href: "/report" },
        { label: "Staff sign in", prompt: "Where do staff sign in?", href: "/login" },
    ],
};

const welcomeCopyByPage: Record<AssistantPage, string> = {
    home: "I can explain what CrisisSync does, where to report an incident, or where staff should sign in.",
    report: "I can guide you through the report form and help you understand what details to include.",
    "report-status": "I can explain what this incident status view means and what to do next.",
    login: "I can help you understand this sign-in page and point you to the right route.",
    onboarding: "I can walk you through the setup flow and explain what each onboarding step does.",
    unknown: "I can help you navigate the site and point you to the right page.",
};

function getAssistantPage(pathname: string): AssistantPage | null {
    if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) return null;
    if (pathname === "/") return "home";
    if (pathname === "/report") return "report";
    if (pathname.startsWith("/report/") && pathname.includes("/status")) return "report-status";
    if (pathname === "/login") return "login";
    if (pathname === "/onboarding") return "onboarding";
    return "unknown";
}

export function WebsiteAssistant() {
    const pathname = usePathname();
    const router = useRouter();
    const page = useMemo(() => getAssistantPage(pathname), [pathname]);
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!page) return;

        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content: welcomeCopyByPage[page],
            },
        ]);
    }, [page]);

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, open, loading]);

    if (!page) return null;

    const quickActions = quickActionsByPage[page];

    const sendMessage = async (message: string) => {
        const trimmed = message.trim();
        if (!trimmed || loading) return;

        const nextMessages: ChatMessage[] = [
            ...messages,
            { id: `user-${Date.now()}`, role: "user", content: trimmed },
        ];
        setMessages(nextMessages);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed, page }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Assistant unavailable");
            }

            setMessages([
                ...nextMessages,
                {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: data.reply,
                },
            ]);
        } catch (error) {
            const fallback =
                error instanceof Error ? error.message : "I couldn't answer that right now.";
            setMessages([
                ...nextMessages,
                {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: fallback,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {!open && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        className="fixed bottom-5 right-5 z-50"
                    >
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="group flex max-w-[320px] items-center gap-3 rounded-[1.6rem] border border-white/12 bg-[linear-gradient(180deg,rgba(11,20,35,0.94),rgba(8,15,27,0.92))] px-4 py-3 text-left text-white shadow-[0_24px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition hover:border-[#68B0FF]/25 hover:shadow-[0_30px_70px_rgba(22,52,100,0.35)]"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#68B0FF] via-[#4F8CFF] to-[#8AD8FF] text-white shadow-[0_12px_30px_rgba(79,140,255,0.3)]">
                                <Bot className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="eyebrow mb-1 block">Website assistant</span>
                                <span className="block text-sm font-medium">Ask Astra for guidance</span>
                                <span className="mt-1 block text-xs text-[#8DA1BD]">Page-aware Gemini concierge</span>
                            </span>
                            <MessageSquare className="h-4 w-4 text-[#9FD0FF] transition group-hover:translate-x-0.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {open && (
                    <motion.section
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.98 }}
                        className="fixed bottom-5 right-5 z-50 flex h-[min(82vh,760px)] w-[min(92vw,420px)] flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,31,0.96),rgba(5,10,18,0.96))] shadow-[0_36px_90px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
                    >
                        <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(104,176,255,0.18),transparent_40%)] px-5 py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#68B0FF] via-[#4F8CFF] to-[#8AD8FF] text-white shadow-[0_12px_30px_rgba(79,140,255,0.25)]">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="eyebrow mb-1">Astra</div>
                                        <h2 className="text-base font-semibold text-white">Customer assistant</h2>
                                        <p className="mt-1 text-sm text-[#8DA1BD]">
                                            Premium website guidance powered by Gemini.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-[#AFC0D8] transition hover:bg-white/[0.06]"
                                >
                                    <X className="h-4.5 w-4.5" />
                                </button>
                            </div>
                        </div>

                        <div className="border-b border-white/8 px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                                {quickActions.map((action) => (
                                    <button
                                        key={action.label}
                                        type="button"
                                        onClick={() => {
                                            if (action.href) router.push(action.href);
                                            void sendMessage(action.prompt);
                                        }}
                                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#C3D3E8] transition hover:border-[#68B0FF]/24 hover:bg-[#68B0FF]/10 hover:text-white"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-[1.3rem] px-4 py-3 text-sm leading-6 ${
                                            message.role === "user"
                                                ? "bg-gradient-to-r from-[#68B0FF] to-[#2C73FF] text-white shadow-[0_16px_35px_rgba(44,115,255,0.25)]"
                                                : "border border-white/8 bg-white/[0.04] text-[#D7E2F2]"
                                        }`}
                                    >
                                        {message.content}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-2 rounded-[1.3rem] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-[#C3D3E8]">
                                        <Loader2 className="h-4 w-4 animate-spin text-[#9FD0FF]" />
                                        Astra is thinking
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-white/8 px-4 py-4">
                            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-2">
                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about this page, where to go next, or how to use the site."
                                    className="min-h-[96px] resize-none border-0 bg-transparent px-3 py-3 text-sm text-white placeholder:text-[#6F84A2] shadow-none focus-visible:ring-0"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            void sendMessage(input);
                                        }
                                    }}
                                />
                                <div className="flex items-center justify-between gap-3 px-3 pb-2">
                                    <div className="flex items-center gap-2 text-xs text-[#6F84A2]">
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                        Knows your current page context
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => void sendMessage(input)}
                                        disabled={loading || !input.trim()}
                                        className="h-10 rounded-2xl bg-gradient-to-r from-[#68B0FF] to-[#2C73FF] px-4 text-sm text-white shadow-[0_14px_30px_rgba(44,115,255,0.22)]"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>
        </>
    );
}
