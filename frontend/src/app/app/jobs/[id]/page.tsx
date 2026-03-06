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
        <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] relative font-sans antialiased selection:bg-[#0066CC] selection:text-white pb-20">
            <Navbar variant="white" />

            <main className="max-w-5xl mx-auto px-6 pt-32 flex flex-col items-center justify-center min-h-[90vh]">

                {/* Header Section */}
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
                            : "Running generative AI models on high-performance compute clusters."
                        }
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 w-full">

                    {/* LEFT PANEL: Metrics Grid */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Metric Card: Time Elapsed */}
                        <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-center border border-[#F5F5F7]">
                            <div className="flex items-center gap-2 mb-2 text-[#86868B]">
                                <Clock className="w-4 h-4" />
                                <p className="text-[11px] font-semibold uppercase tracking-wider">Elapsed Time</p>
                            </div>
                            <p className="text-3xl font-medium tracking-tight text-[#1D1D1F]">{formatDuration(elapsedSeconds)}</p>
                        </div>

                        {/* Metric Card: Remaining */}
                        <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-center border border-[#F5F5F7]">
                            <div className="flex items-center gap-2 mb-2 text-[#86868B]">
                                <Hourglass className="w-4 h-4" />
                                <p className="text-[11px] font-semibold uppercase tracking-wider">Est. Remaining</p>
                            </div>
                            <p className="text-3xl font-medium tracking-tight text-[#1D1D1F]">{isComplete ? "0m 00s" : `~${formatDuration(remainingSeconds)}`}</p>
                        </div>

                        {/* Metric Card: Details */}
                        <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-5 border border-[#F5F5F7]">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#86868B] font-medium">Status</span>
                                <span className={cn("font-semibold px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider",
                                    job?.status === "completed" ? "bg-[#e8f5e9] text-[#1b5e20]" :
                                        job?.status === "failed" ? "bg-[#ffebee] text-[#b71c1c]" :
                                            "bg-[#e3f2fd] text-[#0d47a1]"
                                )}>
                                    {job?.status || "LOADING..."}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#86868B] font-medium">Started</span>
                                <span className="font-medium text-[#1D1D1F]">{job?.started_at ? formatTime(parseUTC(job.started_at)) : (job?.created_at ? formatTime(parseUTC(job.created_at)) : "--")}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#86868B] font-medium">{isComplete ? "Finished" : "Current"}</span>
                                <span className="font-medium text-[#1D1D1F]">
                                    {(isComplete || job?.status === "failed") && job?.finished_at
                                        ? formatTime(parseUTC(job.finished_at))
                                        : formatTime(currentTime)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Main Progress Card */}
                    <div className="lg:col-span-2 w-full bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-[#E5E5EA] p-8 md:p-12 relative overflow-hidden flex flex-col justify-between min-h-[460px]">

                        {isComplete ? (
                            // SUCCESS STATE
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
                                <p className="text-[#86868B] mb-10 max-w-sm text-lg leading-relaxed">All pipeline steps finished without errors. Proceed to view your results or download the outputs.</p>

                                <div className="flex items-center gap-4">
                                    <Button
                                        size="lg"
                                        onClick={handleViewResults}
                                        className="bg-[#1D1D1F] hover:bg-[#333336] text-white shadow-md transition-all px-8 text-lg h-[52px] rounded-full font-medium"
                                    >
                                        View Results <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>

                                    {job?.output_s3_key && (
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={handleDownload}
                                            className="bg-transparent hover:bg-[#F5F5F7] text-[#1D1D1F] border-[#D2D2D7] shadow-sm transition-all px-8 text-lg h-[52px] rounded-full font-medium"
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
                                                            scale: status === "active" ? 1.05 : 1,
                                                            borderColor: status === "active" || status === "completed" ? "#0066CC" : "#e5e5e5"
                                                        }}
                                                        className={cn(
                                                            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors duration-500 bg-white z-10 relative",
                                                            (status === "active" || status === "completed") && "border-[#0066CC]"
                                                        )}
                                                    >
                                                        {status === "completed" ? <CheckCircle className="w-4 h-4 text-[#0066CC]" /> :
                                                            status === "active" ? <Loader2 className="w-4 h-4 text-[#0066CC] animate-spin" /> :
                                                                <div className="w-2 h-2 rounded-full bg-neutral-200" />}
                                                    </motion.div>
                                                    {/* Vertical Line */}
                                                    {index !== PIPELINE_STEPS.length - 1 && <div className="absolute top-8 left-1/2 w-0.5 h-8 bg-neutral-100 -translate-x-1/2 -z-0" />}
                                                </div>

                                                {/* Text */}
                                                <div>
                                                    <p className={cn("font-medium text-base transition-colors tracking-tight", status === "pending" ? "text-neutral-400" : "text-[#1D1D1F]")}>{step.label}</p>
                                                    <p className="text-sm text-[#86868B]">{step.sub}</p>
                                                </div>

                                                {/* Status Label (Right aligned) */}
                                                <div className="ml-auto">
                                                    {status === "active" && <span className="text-[11px] font-semibold tracking-wider text-[#0066CC] uppercase bg-blue-50/50 px-2 py-0.5 rounded">Running</span>}
                                                    {status === "completed" && <span className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Done</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Minimal Log */}
                                <div className="bg-[#F5F5F7] rounded-xl px-4 py-3 border border-[#E5E5EA] flex items-center gap-3 text-sm font-medium text-[#1D1D1F]">
                                    {job?.status === "failed" ? (
                                        <div className="w-2 h-2 rounded-full bg-[#FF3B30] shrink-0" />
                                    ) : (
                                        <Loader2 className="w-4 h-4 animate-spin text-[#86868B] shrink-0" />
                                    )}
                                    <span className={job?.status === "failed" ? "text-[#FF3B30]" : "text-[#86868B]"}>
                                        {currentLog}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Fading Quotes Bottom */}
                        <div className="mt-auto pt-10 h-32 flex flex-col justify-end">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={quoteIndex}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                    className="text-center px-4"
                                >
                                    <p className="text-[#1D1D1F] text-lg font-medium tracking-tight mb-2 leading-relaxed">&quot;{QUOTES[quoteIndex].text}&quot;</p>
                                    <p className="text-[11px] font-semibold text-[#86868B] tracking-widest uppercase">— {QUOTES[quoteIndex].author}</p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
