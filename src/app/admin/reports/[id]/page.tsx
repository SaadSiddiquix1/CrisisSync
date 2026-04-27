"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { Crisis, CrisisSeverity, CrisisStatus } from "@/types/database";
import { Bot, Clock, Download, FileText, RefreshCw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getConfidenceValue, getCrisisAiTriage } from "@/lib/crisis-ai";

type ReportRecord = {
  id: string;
  generated_at: string;
  report_markdown?: string;
  crisis_id: string;
};

export default function IncidentReportViewerPage() {
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [crisis, setCrisis] = useState<Crisis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setGenerating(true);
    setError("");

    try {
      const { data: existingReport } = await supabase
        .from("incident_reports")
        .select("id, generated_at, crisis_id")
        .eq("id", params.id)
        .maybeSingle();

      let activeReport = existingReport as ReportRecord | null;
      let activeCrisisId = existingReport?.crisis_id ?? params.id;

      const res = await fetch(`/api/crisis/${activeCrisisId}/report`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to generate report.");
      }

      if (!activeReport) {
        activeReport = json.report as ReportRecord;
        activeCrisisId = activeReport.crisis_id;
      } else {
        activeReport = {
          ...activeReport,
          report_markdown: json.report?.report_markdown,
        };
      }

      if (!activeReport) {
        throw new Error("Failed to load report record.");
      }

      if (!existingReport) {
        activeReport = json.report as ReportRecord;
        activeCrisisId = activeReport.crisis_id;
      }

      setReport(activeReport);

      const { data: crisisData } = await supabase
        .from("crises")
        .select("*")
        .eq("id", activeCrisisId)
        .single();

      if (crisisData) {
        setCrisis(crisisData as Crisis);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load incident report.");
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const regenerate = async () => {
    if (!crisis?.id) return;

    setGenerating(true);
    setError("");

    try {
      const res = await fetch(`/api/crisis/${crisis.id}/report`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to regenerate report.");
      }

      setReport(json.report as ReportRecord);
    } catch (regenError) {
      setError(regenError instanceof Error ? regenError.message : "Failed to regenerate report.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#68B0FF] border-t-transparent" />
          <p className="text-sm text-[#7F96B7]">Generating AI incident report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-white/[0.08] bg-[rgba(4,9,17,0.6)] p-6 text-center">
          <h1 className="text-lg font-semibold text-white">Incident report unavailable</h1>
          <p className="mt-2 text-sm text-[#7F96B7]">
            {error || "We couldn't load this report yet."}
          </p>
          <Button className="mt-4" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const sev = (crisis?.severity_assessment ?? crisis?.severity ?? getCrisisAiTriage(crisis)?.severity ?? "medium") as CrisisSeverity;

  return (
    <div className="min-h-screen bg-[#030303] px-4 pb-16 pt-8 sm:px-6 print:bg-white print:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Action bar — hidden on print */}
        <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm" className="text-[#7F96B7] hover:text-white">← Back</Button>
          </Link>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/[0.08] text-white hover:bg-white/[0.06]"
              onClick={() => void regenerate()}
              disabled={generating}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
            <Button
              size="sm"
              className="bg-[#68B0FF]/20 text-[#68B0FF] hover:bg-[#68B0FF]/30 border border-[#68B0FF]/30"
              onClick={() => window.print()}
            >
              <Download className="mr-2 h-4 w-4" />
              Print / PDF
            </Button>
          </div>
        </div>

        {/* Report document */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(4,9,17,0.6)] print:border-0 print:bg-white print:rounded-none"
        >
          {/* Document header */}
          <div className="border-b border-white/[0.06] p-6 sm:p-8 print:border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#68B0FF]/10 print:bg-blue-50">
                  <FileText className="h-5 w-5 text-[#68B0FF] print:text-blue-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[#7F96B7] print:text-gray-500">Incident Report</p>
                  <h1 className="mt-0.5 text-xl font-bold text-white print:text-gray-900">
                    {crisis?.crisis_type ? `${crisis.crisis_type.charAt(0).toUpperCase() + crisis.crisis_type.slice(1)} Emergency` : "Incident Report"}
                  </h1>
                </div>
              </div>
              {report?.generated_at && (
                <p className="hidden text-xs text-[#7F96B7] sm:block print:text-gray-500">
                  Generated {new Date(report.generated_at).toLocaleString()}
                </p>
              )}
            </div>

            {error ? (
              <p className="mt-4 text-sm text-amber-300 print:hidden">{error}</p>
            ) : null}

            {/* Metadata chips */}
            {crisis && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <SeverityBadge severity={sev} />
                <StatusBadge status={(crisis.status ?? "reported") as CrisisStatus} />
                {getConfidenceValue(getCrisisAiTriage(crisis)) > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-[#7F96B7] print:border-gray-200">
                    <Bot className="h-3 w-3" />AI {Math.round(getConfidenceValue(getCrisisAiTriage(crisis)) * 100)}% confidence
                  </span>
                )}
                {crisis.resolved_at && crisis.acknowledged_at && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-[#7F96B7] print:border-gray-200">
                    <Clock className="h-3 w-3" />
                    {Math.round((new Date(crisis.resolved_at).getTime() - new Date(crisis.acknowledged_at).getTime()) / 60000)}m response
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Markdown report body */}
          <div className="p-6 sm:p-8 print:p-0">
            <article className="prose prose-sm prose-invert max-w-none
              prose-headings:text-white prose-headings:font-semibold prose-headings:tracking-tight
              prose-h1:text-xl prose-h2:text-base prose-h3:text-sm prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-[#68B0FF]
              prose-p:text-[#B9CAE0] prose-p:leading-7
              prose-li:text-[#B9CAE0] prose-li:leading-6
              prose-strong:text-white
              prose-hr:border-white/[0.08]
              print:prose-headings:text-gray-900 print:prose-p:text-gray-700 print:prose-li:text-gray-700">
              <ReactMarkdown>{report?.report_markdown || "*Report content unavailable. Click Regenerate above.*"}</ReactMarkdown>
            </article>
          </div>
        </motion.div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav, .print\\:hidden { display: none !important; }
          body { background: white; color: black; }
          @page { margin: 2cm; }
        }
      `}</style>
    </div>
  );
}
