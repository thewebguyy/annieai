// Architectural Layer: Component
// Dependencies: lucide-react, framer-motion, src/stores/projectStore.ts, src/lib/ui/toast.ts

"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { toast } from "@/lib/ui/toast";
import { ShieldCheck, Download, RefreshCw, BarChart3, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReportData {
  complianceStatus: "Standard" | "Warning: High AI Contribution";
  metrics: {
    totalChars: number;
    humanChars: number;
    aiChars: number;
    aiPercentage: string;
  };
  modelBreakdown: Record<string, number>;
}

export function CompliancePanel() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const [report, setReport] = useState<ReportData | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchReport = useCallback(async () => {
    if (!activeProject) return;

    try {
      const res = await fetch("/api/v1/compliance/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProject.id }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || "Failed to generate compliance report.");
      }

      const json = await res.json();
      if (json.data) {
        setReport(json.data);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load report data.");
    }
  }, [activeProject]);

  useEffect(() => {
    if (activeProject) {
      startTransition(() => {
        fetchReport();
      });
    }
  }, [activeProject, fetchReport]);

  const handleDownloadReport = () => {
    if (!report || !activeProject) return;

    const reportContent = `
======================================================================
                  WGA COMPLIANCE & CONTRIBUTION REPORT
======================================================================
Project Title:   ${activeProject.title}
Genre:           ${activeProject.genre || "N/A"}
Logline:         ${activeProject.logline || "N/A"}
Generated At:    ${new Date().toLocaleString()}
Status:          ${report.complianceStatus}
----------------------------------------------------------------------
METRICS SUMMARY:
----------------------------------------------------------------------
Total Keystroke Chars:    ${report.metrics.totalChars}
Human Written Chars:      ${report.metrics.humanChars}
AI Generated Chars:       ${report.metrics.aiChars}
AI Contribution Ratio:    ${report.metrics.aiPercentage}
----------------------------------------------------------------------
MODEL CONTRIBUTION BREAKDOWN:
----------------------------------------------------------------------
${
  Object.keys(report.modelBreakdown).length > 0
    ? Object.entries(report.modelBreakdown)
        .map(([model, chars]) => `- ${model.toUpperCase()}: ${chars} characters`)
        .join("\n")
    : "No AI contributions logged."
}
======================================================================
              ANNIE AI CREATIVE ORCHESTRATOR CERTIFICATION
======================================================================
`;

    const blob = new Blob([reportContent.trim()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeProject.title.replace(/\s+/g, "_")}_WGA_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("WGA report downloaded successfully.");
  };

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] text-gray-500 font-mono text-xs">
        <ShieldCheck size={48} className="text-gray-700 mb-4 stroke-1" />
        <p>No active project selected. Choose one to verify WGA compliance.</p>
      </div>
    );
  }

  const aiPercentageVal = report ? parseFloat(report.metrics.aiPercentage) : 0;
  const humanPercentageVal = 100 - aiPercentageVal;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-8 md:p-12 custom-scrollbar relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.03),transparent)] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 z-10 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <ShieldCheck size={16} />
              <span className="text-xs font-mono tracking-widest uppercase">Guild Regulations</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">WGA Compliance Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1">
              Tracking contribution logs for <span className="text-white font-medium">&ldquo;{activeProject.title}&rdquo;</span>.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => startTransition(fetchReport)}
              disabled={isPending}
              className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
              Recalculate
            </button>
            <button
              onClick={handleDownloadReport}
              disabled={!report}
              className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Download size={14} />
              Download Report
            </button>
          </div>
        </div>

        {isPending ? (
          <div className="h-[300px] flex items-center justify-center text-xs font-mono text-purple-400 animate-pulse">
            AUDITING SCRIPTLOGS DATABASE...
          </div>
        ) : report ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Overall Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2 bg-[#111] border border-white/5 p-6 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-6">
                  Contribution Proportions
                </h3>
                
                {/* Ratios progress bar */}
                <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden flex mb-6">
                  <div
                    style={{ width: `${humanPercentageVal}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    title={`Human: ${humanPercentageVal.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${aiPercentageVal}%` }}
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
                    title={`AI: ${aiPercentageVal.toFixed(1)}%`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-[10px] text-gray-500 uppercase font-mono">Human Input Ratio</span>
                    <p className="text-2xl font-black text-white mt-1">
                      {humanPercentageVal.toFixed(1)}%
                    </p>
                    <span className="text-[10px] text-gray-600 block mt-1">
                      {report.metrics.humanChars.toLocaleString()} characters
                    </span>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-[10px] text-gray-500 uppercase font-mono">AI Generative Ratio</span>
                    <p className="text-2xl font-black text-pink-400 mt-1">
                      {report.metrics.aiPercentage}
                    </p>
                    <span className="text-[10px] text-gray-600 block mt-1">
                      {report.metrics.aiChars.toLocaleString()} characters
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase font-mono">Audit Result</span>
                <span
                  className={cn(
                    "text-[10px] font-mono font-bold px-2 py-1 rounded",
                    report.complianceStatus === "Standard"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                  )}
                >
                  {report.complianceStatus.toUpperCase()}
                </span>
              </div>
            </motion.div>

            {/* Right: Model Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111] border border-white/5 p-6 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 size={14} className="text-purple-400" />
                  <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                    Model Breakdown
                  </h3>
                </div>

                <div className="space-y-4">
                  {Object.keys(report.modelBreakdown).length > 0 ? (
                    Object.entries(report.modelBreakdown).map(([model, val]) => {
                      const share = report.metrics.aiChars > 0 ? (val / report.metrics.aiChars) * 100 : 0;
                      return (
                        <div key={model} className="space-y-1">
                          <div className="flex justify-between text-[11px] text-gray-300">
                            <span className="font-bold font-mono capitalize">{model}</span>
                            <span className="text-gray-500">{share.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${share}%` }}
                              className="h-full bg-pink-500 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-600 font-mono text-[10px] py-8">
                      No AI model writes logged
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5">
                <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase">
                  <span>Keystroke Count</span>
                  <span className="text-white font-bold">
                    {report.metrics.totalChars.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-xs font-mono text-gray-500">
            <HelpCircle size={32} className="mb-2 opacity-35" />
            No compliance log records found. Try editing the screenplay script first.
          </div>
        )}
      </div>
    </div>
  );
}
