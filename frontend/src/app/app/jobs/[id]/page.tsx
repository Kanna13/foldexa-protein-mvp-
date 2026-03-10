"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2, CheckCircle, ArrowRight, Clock, Activity, Hourglass } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { api, TERMINAL_STATUSES, type Job } from "@/lib/api";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────
// Constants & pure helpers (outside component — zero cost)
// ─────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
    { id: "diffab", label: "DiffAb", sub: "Antibody Design", duration: 330_000 },
    { id: "rfdiffusion", label: "RFdiffusion", sub: "Scaffold Generation", duration: 300_000 },
    { id: "af2", label: "AlphaFold 2", sub: "Structure Prediction", duration: 360_000 },
];

const QUOTES = [
    { text: "Science is magic that works.", author: "Kurt Vonnegut" },
    { text: "The most beautiful thing we can experience is the mysterious.", author: "Albert Einstein" },
    { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
    { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
];

const parseUTC = (s: string) => new Date(s.endsWith("Z") ? s : `${s}Z`);
const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const fmtDuration = (secs: number) => `${Math.floor(secs / 60)}m ${String(Math.round(secs % 60)).padStart(2, "0")}s`;

function getActiveSteps(pt?: string) {
    if (!pt) return PIPELINE_STEPS;
    if (pt.includes("diffab") && pt.includes("rfdiffusion")) return PIPELINE_STEPS;
    if (pt.includes("diffab")) return PIPELINE_STEPS.filter((s) => s.id === "diffab");
    if (pt.includes("rfdiffusion")) return PIPELINE_STEPS.filter((s) => s.id === "rfdiffusion");
    if (pt.includes("af2")) return PIPELINE_STEPS.filter((s) => s.id === "af2");
    return PIPELINE_STEPS;
}

// ─────────────────────────────────────────────────────────
// Isolated sub-components (prevent parent re-renders)
// ─────────────────────────────────────────────────────────

/** Quote carousel — self-contained, never triggers parent re-render */
function QuoteCarousel() {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setIdx((p) => (p + 1) % QUOTES.length), 6000);
        return () => clearInterval(id);
    }, []);
    const q = QUOTES[idx];
    return (
        <div className="mt-auto pt-10 h-32 flex flex-col justify-end">
            <AnimatePresence mode="wait">
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="text-center px-4"
                >
                    <p className="text-[#1D1D1F] text-lg font-medium tracking-tight mb-2 leading-relaxed">
                        &quot;{q.text}&quot;
                    </p>
                    <p className="text-[11px] font-semibold text-[#86868B] tracking-widest uppercase">
                        — {q.author}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Main page (wrapped in ErrorBoundary in the export below)
// ─────────────────────────────────────────────────────────

function JobPageInner({ jobId }: { jobId: string }) {
    const router = useRouter();

    // Wall-clock ticker: isolated to avoid ticking the whole tree
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const pageLoadTime = useMemo(() => new Date(), []);
    const redirectingRef = useRef(false);

    // ── React Query ────────────────────────────────────────
    const { data: job, isError, error } = useQuery<Job>({
        queryKey: ["job", jobId],
        queryFn: ({ signal }) => api.getJob(jobId, signal),
        // React Query handles AbortController internally via `signal`
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (!status || TERMINAL_STATUSES.has(status)) return false; // stop polling
            return 5_000;
        },
        refetchIntervalInBackground: false, // pause when tab hidden
        refetchOnWindowFocus: true,         // resume on tab focus
        enabled: !!jobId,
    });

    const isTerminal = job ? TERMINAL_STATUSES.has(job.status) : false;
    const isComplete = job?.status === "completed";
    const isFailed = job?.status === "failed";

    // Auto-redirect to results on completion (one-shot)
    useEffect(() => {
        if (!isComplete || redirectingRef.current) return;
        redirectingRef.current = true;
        const t = setTimeout(() => router.push(`/app/results/${jobId}`), 2500);
        return () => clearTimeout(t);
    }, [isComplete, jobId, router]);

    // ── Derived metrics (memoized — only recalculate when job/time changes) ──
    const elapsedSeconds = useMemo(() => {
        if (!job) return 0;
        if (isTerminal && job.execution_time) return job.execution_time;
        if (isTerminal && job.started_at && job.finished_at) {
            return Math.max(0, (parseUTC(job.finished_at).getTime() - parseUTC(job.started_at).getTime()) / 1000);
        }
        const start = job.started_at ? parseUTC(job.started_at).getTime() : pageLoadTime.getTime();
        return Math.max(0, (now.getTime() - start) / 1000);
    }, [job, isTerminal, now, pageLoadTime]);

    const activeSteps = useMemo(() => getActiveSteps(job?.pipeline_type), [job?.pipeline_type]);

    const totalEstimatedSecs = useMemo(
        () => activeSteps.reduce((a, s) => a + s.duration, 0) / 1000,
        [activeSteps],
    );

    const remainingSeconds = isTerminal ? 0 : Math.max(0, totalEstimatedSecs - elapsedSeconds);

    // Derived log message — no extra state needed
    const currentLog = useMemo(() => {
        if (!job) return "Initializing pipeline...";
        if (isComplete) return "Pipeline execution completed. Redirecting to results...";
        if (isFailed) return `Job failed: ${job.error_message ?? "Unknown error"}`;
        if (job.status === "running") return "Executing pipeline models on GPU cluster...";
        return `Status: ${job.status.toUpperCase()}`;
    }, [job, isComplete, isFailed]);

    // ── Stable callbacks ───────────────────────────────────
    const handleViewResults = useCallback(() => router.push(`/app/results/${jobId}`), [router, jobId]);

    const handleDownload = useCallback(async () => {
        try {
            const url = await api.downloadJobResult(jobId);
            window.open(url, "_blank");
        } catch {
            toast.error("Download link not available. Please try again.");
        }
    }, [jobId]);

    // ── Render ─────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] relative font-sans antialiased selection:bg-[#0066CC] selection:text-white pb-20">
            <Navbar variant="white" />

            <main className="max-w-5xl mx-auto px-6 pt-32 flex flex-col items-center justify-center min-h-[90vh]">

                <div className="text-center mb-16 space-y-4 pt-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E5EA] shadow-sm text-[11px] font-semibold tracking-widest text-[#86868B] uppercase">
                        <Activity className="w-3.5 h-3.5" />
                        Job {jobId}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F] pb-1">
                        {isComplete ? "Generation Complete." : "Folding Protein Structure."}
                    </h1>
                    <p className="text-[#86868B] max-w-lg mx-auto text-lg font-medium">
                        {isComplete
                            ? "Structure analysis finished. Design ready for review."
                            : "Running generative AI models on high-performance compute clusters."}
                    </p>
                </div>

                {isError && (
                    <div className="mb-8 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm w-full max-w-md text-center">
                        Failed to fetch status: {(error as Error)?.message ?? "Unknown error"}
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8 w-full">

                    {/* Metrics column */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-center border border-[#F5F5F7]">
                            <div className="flex items-center gap-2 mb-2 text-[#86868B]">
                                <Clock className="w-4 h-4" />
                                <p className="text-[11px] font-semibold uppercase tracking-wider">Elapsed Time</p>
                            </div>
                            <p className="text-3xl font-medium tracking-tight text-[#1D1D1F]">{fmtDuration(elapsedSeconds)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-center border border-[#F5F5F7]">
                            <div className="flex items-center gap-2 mb-2 text-[#86868B]">
                                <Hourglass className="w-4 h-4" />
                                <p className="text-[11px] font-semibold uppercase tracking-wider">Est. Remaining</p>
                            </div>
                            <p className="text-3xl font-medium tracking-tight text-[#1D1D1F]">
                                {isComplete ? "0m 00s" : `~${fmtDuration(remainingSeconds)}`}
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-5 border border-[#F5F5F7]">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#86868B] font-medium">Status</span>
                                <span className={cn("font-semibold px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider",
                                    isComplete ? "bg-[#e8f5e9] text-[#1b5e20]" :
                                        isFailed ? "bg-[#ffebee] text-[#b71c1c]" :
                                            "bg-[#e3f2fd] text-[#0d47a1]"
                                )}>
                                    {job?.status ?? "LOADING..."}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#86868B] font-medium">Started</span>
                                <span className="font-medium text-[#1D1D1F]">
                                    {job?.started_at ? fmtTime(parseUTC(job.started_at))
                                        : job?.created_at ? fmtTime(parseUTC(job.created_at))
                                            : "--"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#86868B] font-medium">{isComplete ? "Finished" : "Current"}</span>
                                <span className="font-medium text-[#1D1D1F]">
                                    {isTerminal && job?.finished_at ? fmtTime(parseUTC(job.finished_at)) : fmtTime(now)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main card */}
                    <div className="lg:col-span-2 w-full bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-[#E5E5EA] p-8 md:p-12 relative overflow-hidden flex flex-col justify-between min-h-[460px]">

                        {isComplete ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className="flex flex-col items-center justify-center h-full py-8 text-center"
                            >
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle className="w-14 h-14 text-[#1D1D1F]" strokeWidth={1.5} />
                                </div>
                                <h2 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] mb-3">Generation Complete</h2>
                                <p className="text-[#86868B] mb-10 max-w-sm text-lg leading-relaxed">
                                    All pipeline steps finished without errors. Proceed to view your results or download the outputs.
                                </p>
                                <div className="flex items-center gap-4">
                                    <Button size="lg" onClick={handleViewResults}
                                        className="bg-[#1D1D1F] hover:bg-[#333336] text-white shadow-md transition-all px-8 text-lg h-[52px] rounded-full font-medium">
                                        View Results <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                    {job?.output_s3_key && (
                                        <Button variant="outline" size="lg" onClick={handleDownload}
                                            className="bg-transparent hover:bg-[#F5F5F7] text-[#1D1D1F] border-[#D2D2D7] shadow-sm transition-all px-8 text-lg h-[52px] rounded-full font-medium">
                                            Download
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col h-full justify-center space-y-12">
                                <div className="space-y-6">
                                    {PIPELINE_STEPS.map((step, index) => {
                                        const type = job?.pipeline_type ?? "";
                                        const included =
                                            !(type === "diffab_only" && step.id !== "diffab") &&
                                            !(type === "rfdiffusion_only" && step.id !== "rfdiffusion") &&
                                            !(type === "af2_only" && step.id !== "af2");

                                        const status: "pending" | "active" | "completed" = !included
                                            ? "pending"
                                            : isComplete
                                                ? "completed"
                                                : job && ["running", "queued", "provisioning"].includes(job.status)
                                                    ? "active"
                                                    : "pending";

                                        return (
                                            <div key={step.id} className="flex items-center gap-4">
                                                <div className="relative">
                                                    <motion.div
                                                        animate={{ scale: status === "active" ? 1.05 : 1, borderColor: status !== "pending" ? "#0066CC" : "#e5e5e5" }}
                                                        className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors duration-500 bg-white z-10 relative", status !== "pending" && "border-[#0066CC]")}
                                                    >
                                                        {status === "completed" ? <CheckCircle className="w-4 h-4 text-[#0066CC]" />
                                                            : status === "active" ? <Loader2 className="w-4 h-4 text-[#0066CC] animate-spin" />
                                                                : <div className="w-2 h-2 rounded-full bg-neutral-200" />}
                                                    </motion.div>
                                                    {index !== PIPELINE_STEPS.length - 1 && (
                                                        <div className="absolute top-8 left-1/2 w-0.5 h-8 bg-neutral-100 -translate-x-1/2 -z-0" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={cn("font-medium text-base transition-colors tracking-tight", status === "pending" ? "text-neutral-400" : "text-[#1D1D1F]")}>{step.label}</p>
                                                    <p className="text-sm text-[#86868B]">{step.sub}</p>
                                                </div>
                                                <div className="ml-auto">
                                                    {status === "active" && <span className="text-[11px] font-semibold tracking-wider text-[#0066CC] uppercase bg-blue-50/50 px-2 py-0.5 rounded">Running</span>}
                                                    {status === "completed" && <span className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Done</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="bg-[#F5F5F7] rounded-xl px-4 py-3 border border-[#E5E5EA] flex items-center gap-3 text-sm font-medium">
                                    {isFailed
                                        ? <div className="w-2 h-2 rounded-full bg-[#FF3B30] shrink-0" />
                                        : <Loader2 className="w-4 h-4 animate-spin text-[#86868B] shrink-0" />}
                                    <span className={isFailed ? "text-[#FF3B30]" : "text-[#86868B]"}>{currentLog}</span>
                                </div>
                            </div>
                        )}

                        {/* Isolated quote carousel — won't cause parent re-renders */}
                        <QuoteCarousel />
                    </div>
                </div>
            </main>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Export — wrapped in ErrorBoundary
// ─────────────────────────────────────────────────────────

export default function JobPage({ params }: { params: { id: string } }) {
    const jobId = params.id;
    if (!jobId) return null;
    return (
        <ErrorBoundary>
            <JobPageInner jobId={jobId} />
        </ErrorBoundary>
    );
}
