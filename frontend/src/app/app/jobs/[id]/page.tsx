"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Loader2, CheckCircle, ArrowRight, Quote, Clock, Activity, Calendar, Hourglass } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const PIPELINE_STEPS = [
    { id: "diffab", label: "DiffAb", sub: "Antibody Design", duration: 3000 },
    { id: "rfdiffusion", label: "RFdiffusion", sub: "Scaffold Generation", duration: 5000 },
    { id: "af2", label: "AlphaFold 2", sub: "Structure Prediction", duration: 6000 },
];

const QUOTES = [
    { text: "Science is magic that works.", author: "Kurt Vonnegut" },
    { text: "The most beautiful thing we can experience is the mysterious.", author: "Albert Einstein" },
    { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
    { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
];

export default function JobPage({ params }: { params: { id: string } }) {
    const [jobId, setJobId] = useState<string>("");
    const [currentStep, setCurrentStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [currentLog, setCurrentLog] = useState<string>("Initializing pipeline...");

    // Metrics
    const [startTime] = useState<Date>(new Date());
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Quotes
    const [quoteIndex, setQuoteIndex] = useState(0);

    const router = useRouter();

    useEffect(() => {
        const unwrapParams = async () => {
            // @ts-ignore
            const p = await params;
            setJobId(p.id);
        };
        unwrapParams();
    }, [params]);

    // Timer Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
            setElapsedSeconds(prev => prev + 1);
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

    const [job, setJob] = useState<any>(null);
    const [polling, setPolling] = useState(true);

    // Poll for Job Status
    useEffect(() => {
        if (!jobId) return;

        const fetchStatus = async () => {
            try {
                const data = await api.getJob(jobId);
                setJob(data);

                // Map backend status to UI steps
                // Since the backend is simple 'RUNNING', we'll infer progress based on time or keep it looping
                if (data.status === "completed") {
                    setIsComplete(true);
                    setPolling(false);
                    setCurrentStep(3); // All done
                    setCurrentLog("Pipeline execution completed successfully.");
                } else if (data.status === "failed") {
                    setPolling(false);
                    setCurrentLog(`Job failed: ${data.error_message || "Unknown error"}`);
                } else if (data.status === "running") {
                    setCurrentLog("Executing pipeline models on GPU cluster...");
                    // We can cycle steps visually or just show them all pending/active
                } else {
                    setCurrentLog(`Status: ${data.status.toUpperCase()}`);
                }

            } catch (err) {
                console.error("Failed to poll job:", err);
            }
        };

        // Initial fetch
        fetchStatus();

        // Poll every 3s
        const interval = polling ? setInterval(fetchStatus, 3000) : null;
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [jobId, polling]);

    const handleViewResults = () => {
        router.push(`/app/results/${jobId}`);
    };

    // Derived Metrics
    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formatDuration = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins}m ${s.toString().padStart(2, '0')}s`;
    };

    // Estimated Total Duration (sum of steps) / Remaining
    const totalEstimatedDuration = useMemo(() => PIPELINE_STEPS.reduce((acc, s) => acc + s.duration, 0) / 1000, []);
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
                                <span className={cn("font-medium px-2 py-0.5 rounded-full text-xs", isComplete ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                                    {isComplete ? "COMPLETED" : "RUNNING"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400">Started At</span>
                                <span className="font-mono text-neutral-900">{formatTime(startTime)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400">Current Time</span>
                                <span className="font-mono text-neutral-900">{formatTime(currentTime)}</span>
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
                                <p className="text-neutral-500 mb-8 max-w-sm">All pipeline steps finished without errors. Proceed to view your results.</p>

                                <Button
                                    variant="ghost"
                                    size="lg"
                                    onClick={handleViewResults}
                                    className="bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm hover:shadow-md transition-all px-8 text-lg h-14 rounded-full font-medium tracking-wide backdrop-blur-sm"
                                >
                                    View Results <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </motion.div>
                        ) : (
                            // LOADING STATE
                            <div className="flex flex-col h-full justify-center space-y-12">
                                {/* Steps */}
                                <div className="space-y-6">
                                    {PIPELINE_STEPS.map((step, index) => {
                                        const status = index < currentStep ? "completed" : index === currentStep ? "active" : "pending";
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
                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                    <span>{currentLog}</span>
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
                                    <p className="text-neutral-600 italic font-medium text-lg mb-2 leading-relaxed">"{QUOTES[quoteIndex].text}"</p>
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
