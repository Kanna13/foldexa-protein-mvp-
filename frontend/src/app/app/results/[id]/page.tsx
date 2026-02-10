"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { Download, Share2, X, ChevronRight, FileText, Activity, Dna } from "lucide-react";
import { api, JobResult } from "@/lib/api";
import { useState, useEffect, use } from "react";
import { cn } from "@/lib/utils";
import { ProteinViewer } from "@/components/protein/ProteinViewer";
import Link from "next/link";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const [result, setResult] = useState<JobResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"overview" | "sequence" | "measurements">("overview");

    // Unwrap params Promise (Next.js 15+)
    const { id: jobId } = use(params);

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
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-neutral-500 font-mono text-sm">Loading analysis...</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Results Not Found</h2>
                    <p className="text-neutral-500 mb-8">{error || "Job analysis data is missing."}</p>
                    <Link href="/app/new">
                        <Button variant="primary">Start New Job</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Logic: Extract metrics and Artifacts
    const rank = result.metrics.find(m => m.metric_name === "rank")?.metric_value || 1;
    const plddt = result.metrics.find(m => m.metric_name === "plddt_mean")?.metric_value || 0;
    const maxPlddt = result.metrics.find(m => m.metric_name === "max_plddt")?.metric_value || 0;

    // Find the main PDB artifact
    const pdbArtifact = result.artifacts.find(a => a.artifact_type === "pdb" || a.s3_key.endsWith(".pdb"));
    const downloadUrl = pdbArtifact?.download_url || "#";

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
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12 border-b border-neutral-100 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-mono font-bold rounded uppercase tracking-wider">
                                {result.status}
                            </span>
                            <span className="text-sm font-mono text-neutral-400">ID: {jobId.slice(0, 8)}</span>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-2">Protein Structure Analysis</h1>
                        <p className="text-neutral-500 text-lg">Generated via Foldexa Pipeline</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="secondary" className="border-neutral-200 shadow-sm hover:bg-neutral-50 text-neutral-700">
                                <Download className="w-4 h-4 mr-2" />
                                Download PDB
                            </Button>
                        </Link>
                        <Button variant="primary" className="shadow-lg shadow-emerald-500/20">
                            Share Report
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-8 border-b border-neutral-100 mb-10 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "pb-4 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap",
                                activeTab === tab.id
                                    ? "border-emerald-500 text-neutral-900"
                                    : "border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-200"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-emerald-500" : "text-neutral-400")} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Dashboard Grid */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Metrics & Data */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Key Metrics Card */}
                        <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-6">Key Metrics</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs text-neutral-400 mb-1">Mean pLDDT</p>
                                    <p className="text-3xl font-mono font-medium text-neutral-900">{plddt.toFixed(1)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400 mb-1">Max pLDDT</p>
                                    <p className="text-3xl font-mono font-medium text-emerald-600">{maxPlddt.toFixed(1)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Stats */}
                        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-neutral-50 bg-neutral-50/50">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">Quality Analysis</h3>
                            </div>
                            <div className="divide-y divide-neutral-50">
                                {result.metrics.map((metric, idx) => (
                                    <div key={idx} className="flex justify-between items-center px-6 py-4 hover:bg-neutral-50 transition-colors">
                                        <span className="text-sm text-neutral-600 capitalize">{metric.metric_name.replace(/_/g, " ")}</span>
                                        <span className="font-mono text-sm font-medium text-neutral-900">{metric.metric_value.toFixed(3)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Visualization */}
                    <div className="lg:col-span-2">
                        <div className="bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl relative h-[600px] border border-neutral-800 group">
                            <ProteinViewer
                                pdbUrl={downloadUrl}
                                className="w-full h-full opacity-90 transition-opacity group-hover:opacity-100"
                            />

                            {/* Overlay Controls */}
                            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto">
                                    <p className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Interactive Viewer Live
                                    </p>
                                </div>
                                <div className="pointer-events-auto">
                                    <Button size="sm" variant="secondary" className="bg-white/10 text-white border-white/10 hover:bg-white/20 backdrop-blur-md">
                                        Reset View
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
