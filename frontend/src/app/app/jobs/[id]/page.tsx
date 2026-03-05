"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Loader2, CheckCircle, ArrowRight, Clock, Activity, Hourglass } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { api, Job } from "@/lib/api";

const PIPELINE_STEPS = [
    { id: "diffab", label: "DiffAb", sub: "Antibody Design", duration: 330000 }, // ~5.5 min
    { id: "rfdiffusion", label: "RFdiffusion", sub: "Scaffold Generation", duration: 300000 }, // ~5 min
    { id: "af2", label: "AlphaFold 2", sub: "Structure Prediction", duration: 360000 }, // ~6 min
];

/** Return only the steps relevant to the selected pipeline. */
function getActiveSteps(pipelineType?: string) {
    if (!pipelineType) return PIPELINE_STEPS;
    if (pipelineType.includes("diffab") && pipelineType.includes("rfdiffusion")) return PIPELINE_STEPS;
    if (pipelineType.includes("diffab")) return PIPELINE_STEPS.filter(s => s.id === "diffab");
    if (pipelineType.includes("rfdiffusion")) return PIPELINE_STEPS.filter(s => s.id === "rfdiffusion");
    if (pipelineType.includes("af2")) return PIPELINE_STEPS.filter(s => s.id === "af2");
    return PIPELINE_STEPS;
}

const QUOTES = [
    { text: "Science is magic that works.", author: "Kurt Vonnegut" },
    { text: "The most beautiful thing we can experience is the mysterious.", author: "Albert Einstein" },
    { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
    { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
];

export default function JobPage({ params }: { params: { id: string } }) {
    const [jobId, setJobId] = useState<string>("");
    const [isComplete, setIsComplete] = useState(false);
    const [currentLog, setCurrentLog] = useState<string>("Initializing pipeline...");

    // Jobs Data
    const [job, setJob] = useState<Job | null>(null);
    const [polling, setPolling] = useState(true);
    const redirectingRef = useRef(false);

    // Metrics — page load time is the fallback start for the visible timer
    const pageLoadTime = useMemo(() => new Date(), []);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    // Quotes
    const [quoteIndex, setQuoteIndex] = useState(0);

    const router = useRouter();

    useEffect(() => {
        const unwrapParams = async () => {
            const p = await params;
            setJobId(p.id);
        };
        unwrapParams();
    }, [params]);

    // Always tick every second — used by both the live timer and the completion display
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Quote Carousel Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % QUOTES.length);
        }, 6000); // Change every 6s
        return () => clearInterval(interval);
    }, []);

    // Poll for Job Status
    useEffect(() => {
        if (!jobId) return;

        let isMounted = true;

        const fetchStatus = async () => {
            try {
                const data = await api.getJob(jobId);
                if (!isMounted) return;

                setJob(data);

                // Map backend status to UI steps
                if (data.status === "completed") {
                    setIsComplete(true);
                    setPolling(false);
                    setCurrentLog("Pipeline execution completed successfully. Redirecting to results...");

                    // Prevent double-redirect if effect re-runs after setPolling(false)
                    if (!redirectingRef.current) {
                        redirectingRef.current = true;
                        setTimeout(() => {
                            if (isMounted) router.push(`/app/results/${jobId}`);
                        }, 2500);
                    }
                } else if (data.status === "failed") {
                    setIsComplete(false);
                    setPolling(false);
                    setCurrentLog(`Job failed: ${data.error_message || "Unknown error"}`);
                } else if (data.status === "running") {
                    setCurrentLog("Executing pipeline models on GPU cluster...");
                } else {
                    setCurrentLog(`Status: ${data.status.toUpperCase()}`);
                }

            } catch (err) {
                console.error("Failed to poll job:", err);
            }
        };

        // Initial fetch
        fetchStatus();

        // Poll every 5s
        const interval = polling ? setInterval(fetchStatus, 5000) : null;
        return () => {
            isMounted = false;
            if (interval) clearInterval(interval);
        };
    }, [jobId, polling, router]);

    const handleViewResults = () => {
        router.push(`/app/results/${jobId}`);
    };

    const handleDownload = async () => {
        try {
            const url = await api.downloadJobResult(jobId);
            window.open(url, '_blank');
        } catch (err) {
            console.error("Failed to fetch download link:", err);
            alert("Download link not available.");
        }
    };

    // Derived Metrics
    // Helper to parse backend naive UTC datetimes correctly by appending 'Z'
    const parseUTC = (dateStr: string) => new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`);

    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formatDuration = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const s = Math.round(secs % 60);
        return `${mins}m ${s.toString().padStart(2, '0')}s`;
    };

    const getElapsedSeconds = () => {
        // Once job is done, lock to the exact server-reported execution time
        if (job && (job.status === "completed" || job.status === "failed") && job.execution_time) {
            return job.execution_time;
        }

        // Only use the DB started_at if it's actually newer than the job's creation time 
        // to prevent crazy offsets if DB time is out of sync or if it was stuck queued.
        // Otherwise, trust the front-end pageLoadTime to give a clean 0s -> up experience.
        let startTime = pageLoadTime.getTime();
        if (job?.started_at) {
            const backendStart = parseUTC(job.started_at).getTime();
            // If backend start is reasonable (not somehow in the future or way in past), use it.
            if (backendStart < currentTime.getTime() + 10000) {
                startTime = backendStart;
            }
        }

        return Math.max(0, (currentTime.getTime() - startTime) / 1000);
    };

    const elapsedSeconds = getElapsedSeconds();

    // Estimated Total Duration (sum of steps) / Remaining
    const activeSteps = useMemo(() => getActiveSteps(job?.pipeline_type), [job?.pipeline_type]);
    const totalEstimatedDuration = useMemo(() => activeSteps.reduce((acc, s) => acc + s.duration, 0) / 1000, [activeSteps]);
    const remainingSeconds = Math.max(0, totalEstimatedDuration - elapsedSeconds);

    if (!jobId) return null;

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 relative font-sans">
            <Navbar variant="contrast" />

            <main className="max-w-5xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center justify-center min-h-[90vh]">

                {/* Header Section */}
                <div className="text-center mb-12 space-y-3">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-mono font-bold tracking-widest mb-4 shadow-lg shadow-neutral-200">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        JOB ID: {jobId}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
                        {isComplete ? "Generation Complete" : "Folding Protein Structure"}
                    </h1>
                    <p className="text-neutral-500 max-w-lg mx-auto text-lg">
                        {isComplete
                            ? "Structure analysis finished. Design ready for review."
                            : "Running generative AI models on high-performance compute clusters."
                        }
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 w-full">

                    {/* LEFT PANEL: Metrics Grid */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Metric Card: Time Elapsed */}
                        <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs text-neutral-400 uppercase tracking-widest font-mono mb-1">Elapsed</p>
                                <p className="text-2xl font-mono font-medium text-neutral-900">{formatDuration(elapsedSeconds)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>

                        {/* Metric Card: Remaining */}
                        <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs text-neutral-400 uppercase tracking-widest font-mono mb-1">Est. Remaining</p>
                                <p className="text-2xl font-mono font-medium text-neutral-900">{isComplete ? "0m 00s" : `~${formatDuration(remainingSeconds)}`}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                                <Hourglass className="w-5 h-5 text-purple-500" />
                            </div>
                        </div>

                        {/* Metric Card: Details */}
                        <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400">Status</span>
                                <span className={cn("font-medium px-2 py-0.5 rounded-full text-xs uppercase tracking-wider",
                                    job?.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                        job?.status === "failed" ? "bg-red-100 text-red-700" :
                                            "bg-blue-100 text-blue-700"
                                )}>
                                    {job?.status || "LOADING..."}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400">Started At</span>
                                <span className="font-mono text-neutral-900">{job?.started_at ? formatTime(parseUTC(job.started_at)) : (job?.created_at ? formatTime(parseUTC(job.created_at)) : "--")}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400">{isComplete ? "Finished At" : "Current Time"}</span>
                                <span className="font-mono text-neutral-900">
                                    {(isComplete || job?.status === "failed") && job?.finished_at
                                        ? formatTime(parseUTC(job.finished_at))
                                        : formatTime(currentTime)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Main Progress Card */}
                    <div className="lg:col-span-2 w-full bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-neutral-100 p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[400px]">

                        {isComplete ? (
                            // SUCCESS STATE
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center h-full py-8 text-center"
                            >
                                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-6 shadow-sm">
                                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Job Successfully Completed</h2>
                                <p className="text-neutral-500 mb-8 max-w-sm">All pipeline steps finished without errors. Proceed to view your results or download the outputs immediately.</p>

                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        onClick={handleViewResults}
                                        className="bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm hover:shadow-md transition-all px-8 text-lg h-14 rounded-full font-medium tracking-wide backdrop-blur-sm"
                                    >
                                        View Results <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>

                                    {job?.output_s3_key && (
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            onClick={handleDownload}
                                            className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 shadow-sm hover:shadow-md transition-all px-6 h-14 rounded-full font-medium"
                                        >
                                            Download
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            // LOADING STATE
                            <div className="flex flex-col h-full justify-center space-y-12">
                                {/* Steps */}
                                <div className="space-y-6">
                                    {PIPELINE_STEPS.map((step, index) => {
                                        // Compute visual status explicitely so skipped steps just stay gray.
                                        let status: "pending" | "active" | "completed" = "pending";

                                        const type = job?.pipeline_type || "";
                                        let isIncludedInPipeline = true;

                                        // For MVP single-model pipelines, only highlight the relevant step
                                        if (type === "diffab_only" && step.id !== "diffab") isIncludedInPipeline = false;
                                        if (type === "rfdiffusion_only" && step.id !== "rfdiffusion") isIncludedInPipeline = false;
                                        if (type === "af2_only" && step.id !== "af2") isIncludedInPipeline = false;

                                        if (isIncludedInPipeline) {
                                            if (isComplete) {
                                                status = "completed";
                                            } else if (!job || job?.status === "running" || job?.status === "queued" || job?.status === "provisioning") {
                                                status = "active";
                                            }
                                        }
                                        return (
                                            <div key={step.id} className="flex items-center gap-4">
                                                {/* Indicator */}
                                                <div className="relative">
                                                    <motion.div
                                                        animate={{
                                                            scale: status === "active" ? 1.1 : 1,
                                                            borderColor: status === "active" || status === "completed" ? "#10b981" : "#e5e5e5"
                                                        }}
                                                        className={cn(
                                                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-500 bg-white z-10 relative",
                                                            (status === "active" || status === "completed") && "border-emerald-500"
                                                        )}
                                                    >
                                                        {status === "completed" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                                                            status === "active" ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /> :
                                                                <div className="w-2 h-2 rounded-full bg-neutral-200" />}
                                                    </motion.div>
                                                    {/* Vertical Line */}
                                                    {index !== PIPELINE_STEPS.length - 1 && <div className="absolute top-8 left-1/2 w-0.5 h-8 bg-neutral-100 -translate-x-1/2 -z-0" />}
                                                </div>

                                                {/* Text */}
                                                <div>
                                                    <p className={cn("font-semibold text-sm transition-colors", status === "pending" ? "text-neutral-300" : "text-neutral-900")}>{step.label}</p>
                                                    <p className="text-xs text-neutral-400">{step.sub}</p>
                                                </div>

                                                {/* Status Label (Right aligned) */}
                                                <div className="ml-auto">
                                                    {status === "active" && <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md animate-pulse">RUNNING</span>}
                                                    {status === "completed" && <span className="text-xs font-mono text-neutral-400">DONE</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Minimal Log */}
                                <div className="bg-neutral-50 rounded-xl p-4 flex items-center gap-3 text-sm font-mono text-neutral-500 border border-neutral-100">
                                    {job?.status === "failed" ? (
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                    ) : (
                                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                    )}
                                    <span className={job?.status === "failed" ? "text-red-600 font-medium" : ""}>
                                        {currentLog}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Fading Quotes Bottom */}
                        <div className="mt-auto pt-10 border-t border-neutral-100/50 h-32 flex flex-col justify-end">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={quoteIndex}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.4 }}
                                    className="text-center px-4"
                                >
                                    <p className="text-neutral-600 italic font-medium text-lg mb-2 leading-relaxed">&quot;{QUOTES[quoteIndex].text}&quot;</p>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">— {QUOTES[quoteIndex].author}</p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
