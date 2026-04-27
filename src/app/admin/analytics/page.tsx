"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Crisis } from "@/types/database";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { AlertTriangle, Bot, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { getConfidenceValue, getCrisisAiTriage } from "@/lib/crisis-ai";

export const dynamic = "force-dynamic";

const COLORS = {
  fire: "#FF5A4F", medical: "#FF9D42", security: "#68B0FF",
  maintenance: "#3DDC97", other: "#9B8CFF",
};
const SEV_COLORS = { low: "#3DDC97", medium: "#68B0FF", high: "#FF9D42", critical: "#FF5A4F" };

const CHART_STYLE = {
  cartesianGrid: { stroke: "rgba(15,23,42,0.08)" },
  tooltip: {
    contentStyle: { background: "#ffffff", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 12, color: "#0f172a", fontSize: 12 },
    cursor: { fill: "rgba(15,23,42,0.04)" },
  },
};

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}18`, color }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState("7d");
  const [crises, setCrises] = useState<Crisis[]>([]);
  const [reportIdsByCrisis, setReportIdsByCrisis] = useState<Record<string, string>>({});
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    const load = async () => {
      const [{ data: crisisRows }, { data: reportRows }] = await Promise.all([
        supabase.from("crises").select("*").order("created_at", { ascending: false }),
        supabase
          .from("incident_reports")
          .select("id, crisis_id, generated_at")
          .order("generated_at", { ascending: false }),
      ]);

      setCrises((crisisRows || []) as Crisis[]);
      setReportIdsByCrisis(
        (reportRows || []).reduce<Record<string, string>>((acc, report) => {
          if (!acc[report.crisis_id]) {
            acc[report.crisis_id] = report.id;
          }
          return acc;
        }, {})
      );
    };
    void load();
  }, [supabase]);

  const inRange = useMemo(() => {
    const days = range === "30d" ? 30 : range === "90d" ? 90 : 7;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return crises.filter((c) => new Date(c.created_at).getTime() >= cutoff);
  }, [crises, range]);

  const summary = useMemo(() => {
    const total = inRange.length;
    const resolved = inRange.filter((c) => ["resolved", "closed"].includes(c.status)).length;
    const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;
    const avgConfidence = total ? Math.round((inRange.reduce((a, c) => a + getConfidenceValue(getCrisisAiTriage(c)), 0) / total) * 100) : 0;
    const avgResponseMins = (() => {
      const r = inRange.filter((c) => c.resolved_at && c.acknowledged_at);
      if (!r.length) return 0;
      return Math.round(r.reduce((a, c) => a + (new Date(c.resolved_at!).getTime() - new Date(c.acknowledged_at!).getTime()) / 60000, 0) / r.length);
    })();
    return { total, resolutionRate, avgConfidence, avgResponseMins };
  }, [inRange]);

  const volumeByDay = useMemo(() => {
    const map = new Map<string, { day: string; date: number; count: number }>();
    inRange.forEach((c) => {
      const created = new Date(c.created_at);
      const key = created.toISOString().slice(0, 10);
      const current = map.get(key);
      if (current) {
        current.count += 1;
        return;
      }

      map.set(key, {
        day: created.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        date: created.getTime(),
        count: 1,
      });
    });
    return Array.from(map.values())
      .sort((a, b) => a.date - b.date)
      .map(({ day, count }) => ({ day, count }));
  }, [inRange]);

  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    inRange.forEach((c) => { counts[c.crisis_type] = (counts[c.crisis_type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [inRange]);

  const sevBreakdown = useMemo(() =>
    ["low", "medium", "high", "critical"].map((s) => ({
      s, value: inRange.filter((c) => (c.severity_assessment ?? c.severity ?? getCrisisAiTriage(c)?.severity) === s).length
    })), [inRange]);

  const geminiCount = inRange.filter((c) => getCrisisAiTriage(c)?.model_used === "gemini").length;
  const groqCount = inRange.filter((c) => getCrisisAiTriage(c)?.model_used === "groq").length;

  const responseByDay = useMemo(() => {
    const resolved = inRange.filter((c) => c.resolved_at && c.acknowledged_at);
    const map = new Map<string, { day: string; date: number; totalMinutes: number; count: number }>();

    resolved.forEach((crisis) => {
      const resolvedAt = new Date(crisis.resolved_at!);
      const key = resolvedAt.toISOString().slice(0, 10);
      const minutes = (resolvedAt.getTime() - new Date(crisis.acknowledged_at!).getTime()) / 60000;
      const current = map.get(key);

      if (current) {
        current.totalMinutes += minutes;
        current.count += 1;
        return;
      }

      map.set(key, {
        day: resolvedAt.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        date: resolvedAt.getTime(),
        totalMinutes: minutes,
        count: 1,
      });
    });

    return Array.from(map.values())
      .sort((a, b) => a.date - b.date)
      .map(({ day, totalMinutes, count }) => ({
        day,
        sla: 5,
        minutes: Math.round(totalMinutes / count),
      }));
  }, [inRange]);

  const hasIncidentData = inRange.length > 0;
  const hasResponseTrend = responseByDay.length > 0;

  return (
    <div className="app-shell min-h-screen space-y-6 px-4 pb-12 pt-24 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Incident intelligence and response metrics</p>
        </div>
        <select
          className="h-10 w-fit rounded-xl border border-border bg-background px-3 text-sm text-foreground shadow-sm"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Incidents" value={summary.total} sub={`in ${range}`} icon={AlertTriangle} color="#FF5A4F" />
        <StatCard label="Resolution Rate" value={`${summary.resolutionRate}%`} sub="of all incidents" icon={CheckCircle2} color="#3DDC97" />
        <StatCard label="AI Confidence" value={`${summary.avgConfidence}%`} sub="average accuracy" icon={Bot} color="#9B8CFF" />
        <StatCard label="Avg Response" value={summary.avgResponseMins ? `${summary.avgResponseMins}m` : "—"} sub="to resolution" icon={Clock} color="#FF9D42" />
      </div>

      {/* AI Model split */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Gemini (Primary)", count: geminiCount, color: "#68B0FF" },
          { label: "Groq (Fallback)", count: groqCount, color: "#9B8CFF" },
        ].map((m) => (
          <div key={m.label} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${m.color}18`, color: m.color }}>
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">triage requests</p>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.count}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Crisis Volume Over Time">
          {hasIncidentData ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeByDay}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#68B0FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#68B0FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...CHART_STYLE.cartesianGrid} />
                  <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...CHART_STYLE.tooltip} />
                  <Area type="monotone" dataKey="count" stroke="#68B0FF" strokeWidth={2} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No incidents in this date range yet.</p>
          )}
        </ChartCard>

        <ChartCard title="Crisis Type Breakdown">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeBreakdown} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40} paddingAngle={3}>
                  {typeBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS] || "#999"} />
                  ))}
                </Pie>
                <Tooltip {...CHART_STYLE.tooltip} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#7F96B7" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Severity Distribution">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sevBreakdown} barSize={32}>
                <CartesianGrid {...CHART_STYLE.cartesianGrid} />
                <XAxis dataKey="s" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...CHART_STYLE.tooltip} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {sevBreakdown.map((entry) => (
                    <Cell key={entry.s} fill={SEV_COLORS[entry.s as keyof typeof SEV_COLORS] || "#666"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Response Time Trend (vs 5min SLA)">
          {hasResponseTrend ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseByDay}>
                  <CartesianGrid {...CHART_STYLE.cartesianGrid} />
                  <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} unit="m" />
                  <Tooltip {...CHART_STYLE.tooltip} />
                  <Line type="monotone" dataKey="minutes" stroke="#FF9D42" strokeWidth={2} dot={{ fill: "#FF9D42", r: 3 }} name="Response time" />
                  <Line type="monotone" dataKey="sla" stroke="#FF5A4F" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="SLA target (5m)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not enough resolved incidents yet to show a response-time trend.</p>
          )}
        </ChartCard>
      </div>

      {/* Recent resolved crises */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Recently Resolved</h3>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Severity</th>
                <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">AI Conf.</th>
                <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">Resolved</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {crises.filter((c) => ["resolved", "closed"].includes(c.status)).slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3 capitalize text-foreground">{c.crisis_type}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{
                      background: `${SEV_COLORS[(c.severity_assessment ?? c.severity) as keyof typeof SEV_COLORS] || "#666"}18`,
                      color: SEV_COLORS[(c.severity_assessment ?? c.severity) as keyof typeof SEV_COLORS] || "#666"
                    }}>{c.severity_assessment ?? c.severity}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{getConfidenceValue(getCrisisAiTriage(c)) ? `${Math.round(getConfidenceValue(getCrisisAiTriage(c)) * 100)}%` : "—"}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {c.resolved_at ? new Date(c.resolved_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {reportIdsByCrisis[c.id] ? (
                      <Link href={`/admin/reports/${reportIdsByCrisis[c.id]}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        View <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">Generate in dashboard</span>
                    )}
                  </td>
                </tr>
              ))}
              {crises.filter((c) => ["resolved", "closed"].includes(c.status)).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No resolved incidents yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
