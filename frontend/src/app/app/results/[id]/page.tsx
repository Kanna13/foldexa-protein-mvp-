"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import {
  Download,
  Activity,
  Dna,
  FileText
} from "lucide-react";
import { api, JobResult } from "@/lib/api";
import { useState, useEffect, use } from "react";
import { cn } from "@/lib/utils";
import { OutputDemo } from "@/components/results/OutputDemo";

import Link from "next/link";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [result, setResult] = useState<JobResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "sequence" | "measurements"
  >("overview");
  const [demoElapsed, setDemoElapsed] = useState(0);

  // Unwrap params Promise (Next.js 15+)
  const { id: jobId } = use(params);

  // 1-minute demo timer
  useEffect(() => {
    if (!loading && result) {
      const interval = setInterval(() => {
        setDemoElapsed((prev) => {
          if (prev >= 60) {
            clearInterval(interval);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading, result]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getJobResults(jobId);
        setResult(data);
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError("Could not load results. Job might not be complete.");
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchData();
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-[3px] border-neutral-100" />
            <div className="absolute inset-0 rounded-full border-[3px] border-neutral-900 border-t-transparent animate-spin flex items-center justify-center" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-neutral-500 font-mono text-[11px] uppercase tracking-widest font-bold">
            Compiling Analysis...
          </p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Results Not Found
          </h2>
          <p className="text-neutral-500 mb-8">
            {error || "Job analysis data is missing."}
          </p>
          <Link href="/app/new">
            <Button variant="primary">Start New Job</Button>
          </Link>
        </div>
      </div>
    );
  }

  // DEMO LOGIC: After 1 minute of viewing the page, show the new interactive Output html
  if (demoElapsed >= 60) {
    return <OutputDemo />;
  }

  // Logic: Extract metrics and Artifacts
  const rank =
    result.metrics.find((m) => m.metric_name === "rank")?.metric_value || 1;
  const plddt =
    result.metrics.find((m) => m.metric_name === "plddt_mean")?.metric_value ||
    0;
  const maxPlddt =
    result.metrics.find((m) => m.metric_name === "max_plddt")?.metric_value ||
    0;

  // Find the main PDB artifact for fallback, but prefer explicit download endpoint
  const pdbArtifact = result.artifacts.find(
    (a) => a.artifact_type === "pdb" || a.s3_key.endsWith(".pdb"),
  );

  const handleDownload = async () => {
    try {
      const url = await api.downloadJobResult(jobId);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to get download URL:", err);
      // Fallback
      if (pdbArtifact?.download_url) {
        window.open(pdbArtifact.download_url, "_blank");
      } else {
        alert("Download link not available yet.");
      }
    }
  };

  const formatTime = (seconds?: number | null) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return "--";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "sequence", label: "Sequence", icon: Dna },
    { id: "measurements", label: "Measurements", icon: FileText },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 font-sans selection:bg-emerald-100">
      {/* Header: Pro Style */}
      <Navbar variant="contrast" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-neutral-100 text-neutral-500 text-[10px] font-mono font-bold rounded-full uppercase tracking-[0.2em] border border-neutral-200">
                {result.status}
              </span>
              <span className="text-[11px] font-mono font-bold tracking-widest text-neutral-400">
                ID: {jobId.slice(0, 8)}
              </span>
            </div>

            {/* 3-Stage Pipeline Stepper */}
            <div className="mb-8 flex items-center gap-8 text-[11px] font-black tracking-[0.1em] uppercase text-neutral-400">
              <div className="flex items-center gap-2 text-neutral-500 opacity-60">
                <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-mono font-bold border border-neutral-200">✓</div>
                <span>Configure</span>
              </div>
              <div className="w-8 h-px bg-neutral-200" />
              <div className="flex items-center gap-2 text-neutral-500 opacity-60">
                <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-mono font-bold border border-neutral-200">✓</div>
                <span>Analyze</span>
              </div>
              <div className="w-8 h-px bg-neutral-200" />
              <div className="flex items-center gap-2 text-neutral-900">
                <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-mono shadow-md shadow-neutral-900/10">3</div>
                <span className="tracking-widest font-black">Result</span>
              </div>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-neutral-900 mb-3">
              Protein Structure Analysis
            </h1>
            <p className="text-neutral-500 text-[14px] flex items-center gap-2 font-medium">
              <span>Generating Demo Benchmark Report...</span>
              <span className="font-mono text-neutral-900 font-bold bg-neutral-100 px-2.5 py-0.5 rounded-md border border-neutral-200">
                00:{(60 - demoElapsed).toString().padStart(2, "0")}
              </span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 md:mt-20">
            <Button
              variant="secondary"
              className="border-neutral-200 shadow-sm hover:bg-neutral-50 text-neutral-700 h-11 px-5 rounded-2xl text-[13px] font-bold tracking-wide transition-all"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2 text-neutral-400" />
              Download Results
            </Button>
            <Button
              variant="primary"
              className="bg-neutral-900 text-white hover:bg-black h-11 px-6 rounded-2xl text-[13px] font-black tracking-wider shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] transition-all"
            >
              Share Report
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-8 border-b-2 border-neutral-100 mb-12 overflow-x-auto relative pb-px -mt-px pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-4 px-1 border-b-2 font-bold text-[13px] tracking-wide transition-all flex items-center gap-2.5 whitespace-nowrap relative z-10 -mb-[2px]",
                activeTab === tab.id
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-neutral-700"
              )}
            >
              <tab.icon
                className={cn(
                  "w-4 h-4",
                  activeTab === tab.id
                    ? "text-neutral-900"
                    : "text-neutral-300"
                )}
              />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Grid - Centered Layout */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Key Metrics Card */}
          <div className="bg-white rounded-[24px] border border-neutral-200/80 p-8 shadow-[0_2px_24px_-8px_rgba(0,0,0,0.06)]">
            <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-8">
              Key Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-neutral-100">
              <div className="pl-0">
                <p className="text-[12px] font-bold text-neutral-400 mb-2">Mean pLDDT</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-mono font-medium tracking-tight text-neutral-900">
                    {plddt.toFixed(1)}
                  </p>
                  <span className="text-sm font-mono text-neutral-300">/ 100</span>
                </div>
              </div>
              <div className="pl-8">
                <p className="text-[12px] font-bold text-neutral-400 mb-2">Max pLDDT</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-mono font-medium tracking-tight text-neutral-900 hover:text-emerald-500 transition-colors">
                    {maxPlddt.toFixed(1)}
                  </p>
                  <span className="text-sm font-mono text-neutral-300">/ 100</span>
                </div>
              </div>
              <div className="pl-8">
                <p className="text-[12px] font-bold text-neutral-400 mb-2">Candidate Rank</p>
                <p className="text-4xl font-mono font-medium tracking-tight text-neutral-900">
                  <span className="text-neutral-300 text-2xl mr-1">#</span>{rank}
                </p>
              </div>
              <div className="pl-8">
                <p className="text-[12px] font-bold text-neutral-400 mb-2">Compute Duration</p>
                <p className="text-3xl mt-1 font-mono font-medium tracking-tight text-neutral-900">
                  {formatTime(result.execution_time)}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="bg-white rounded-[24px] border border-neutral-200/80 overflow-hidden shadow-[0_2px_24px_-8px_rgba(0,0,0,0.06)]">
            <div className="px-8 py-5 border-b border-neutral-100 bg-neutral-50/30">
              <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                Quality Analysis Deep Dive
              </h3>
            </div>
            <div className="divide-y divide-neutral-100">
              {result.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center px-8 py-5 hover:bg-neutral-50/50 transition-colors cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
                    <span className="text-[13px] font-bold text-neutral-600 tracking-wide capitalize">
                      {metric.metric_name.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="font-mono text-[14px] font-medium tracking-tight text-neutral-900 bg-neutral-100/50 px-3 py-1 rounded-md border border-neutral-200/50">
                    {metric.metric_value.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
