"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
    Cpu,
    Database,
    Layers,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Terminal,
    Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { api, Job } from "@/lib/api";
import { cn } from "@/lib/utils";

// --- CONFIG & CONSTANTS ---

const ANALYSIS_SUB_STAGES = [
    { id: "upload", label: "Upload", icon: Database },
    { id: "preprocessing", label: "Preprocessing", icon: Cpu },
    { id: "diffusion", label: "Diffusion Sampling", icon: RefreshCw },
    { id: "optimization", label: "Structure Optimization", icon: Layers },
    { id: "finalizing", label: "Finalizing", icon: CheckCircle2 },
];

const QUOTES = [
    "Diffusion models are reshaping protein design.",
    "Designing antibodies through generative diffusion.",
    "Exploring the protein landscape.",
    "Simulating molecular intelligence.",
    "Engineering next-generation therapeutics.",
];

// --- COMPONENTS ---

/** Live Log Stream (Light Minimal Theme) */
function LogStream({ logs }: { logs: string[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-white border border-neutral-200/60 rounded-[16px] p-6 w-full h-[280px] flex flex-col font-mono shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-3 text-neutral-400">
                <Terminal className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">System Logs</span>
            </div>
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-3 scrollbar-none pb-2"
            >
                {logs.map((log, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i}
                        className="text-[12px] text-neutral-600 flex gap-4 leading-relaxed"
                    >
                        <span className="text-neutral-300 shrink-0 select-none">
                            [{new Date().toLocaleTimeString([], { hour12: false })}]
                        </span>
                        <span>{log}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// --- MAIN PAGE ---

export default function AnalyzingPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [jobId, setJobId] = useState<string>("");
    const [job, setJob] = useState<Job | null>(null);
    const [statusText, setStatusText] = useState("INITIALIZING ENGINE...");
    const [activeSubStage, setActiveSubStage] = useState(0);
    const [logs, setLogs] = useState<string[]>(["Connection established with Railway primary node.", "Awaiting handshake from RunPod worker..."]);
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    // Initial setup
    useEffect(() => {
        const unwrap = async () => {
            const p = await params;
            setJobId(p.id);
        };
        unwrap();
    }, [params]);

    // Quotes Rotation
    useEffect(() => {
        const timer = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % QUOTES.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    // Polling Logic
    useEffect(() => {
        if (!jobId) return;

        const poll = async () => {
            try {
                const data = await api.getJob(jobId);
                setJob(data);

                // Inline logical assignments to avoid cascading render effects
                if (data.status === "queued" || data.status === "provisioning") {
                    setActiveSubStage(1);
                    setStatusText("PREPARING STRUCTURE");
                    setLogs(prev => {
                        const newLogs = ["Resource allocated on execution cluster.", "Scaling container environment...", "Uploading structure to storage..."];
                        return prev.includes(newLogs[0]) ? prev : [...prev, ...newLogs];
                    });
                }
                else if (data.status === "running") {
                    setActiveSubStage(2);
                    setStatusText("DIFFUSION SAMPLING");
                    setLogs(prev => {
                        const newLogs = ["Loading model weights into VRAM...", "Diffusion step 1 initialized.", "Batch sampling started..."];
                        return prev.includes(newLogs[0]) ? prev : [...prev, ...newLogs];
                    });
                }
                else if (data.status === "completed") {
                    setActiveSubStage(4);
                    setStatusText("PROCESSING COMPLETE");
                    setProgress(100);
                    setLogs(prev => {
                        const newLogs = ["Validation metrics passed.", "Result artifact uploaded successfully.", "Synthesized PDB ready for download."];
                        return prev.includes(newLogs[0]) ? prev : [...prev, ...newLogs];
                    });
                    setTimeout(() => router.push(`/app/results/${jobId}`), 2000);
                } else if (data.status === "failed") {
                    // Handled inside component
                }
            } catch (err) {
                console.error("Poll error:", err);
            }
        };

        poll();
        const intervalId = setInterval(poll, 4000);

        if (job?.status === "completed" || job?.status === "failed") {
            clearInterval(intervalId);
        }

        return () => clearInterval(intervalId);
    }, [jobId, router, job?.status]);

    // Smoother progress bar
    useEffect(() => {
        if (job?.status === "completed") return;

        const target = activeSubStage * 25;
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100;
                if (prev < target) return prev + 0.5;
                if (prev < 90) return prev + 0.1; // slow crawl near end
                return prev;
            });
        }, 100);
        return () => clearInterval(timer);
    }, [activeSubStage, job]);

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 flex flex-col font-sans overflow-x-hidden">
            <Navbar variant="contrast" />

            {/* --- TOP: Premium Global Progress matching Results --- */}
            <div className="pt-28 pb-8 flex justify-center bg-transparent z-10 relative">
                <div className="flex items-center gap-8 text-[11px] font-black tracking-[0.1em] uppercase text-neutral-400">
                    <div className="flex items-center gap-2 text-neutral-500 opacity-60">
                        <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-mono font-bold border border-neutral-200">✓</div>
                        <span>Configure</span>
                    </div>
                    <div className="w-8 h-px bg-neutral-200" />
                    <div className="flex items-center gap-2 text-neutral-900">
                        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-mono shadow-md shadow-neutral-900/10">2</div>
                        <span className="tracking-widest font-black">Analyze</span>
                    </div>
                    <div className="w-8 h-px bg-neutral-200" />
                    <div className="flex items-center gap-2 text-neutral-400 opacity-50">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[11px] font-mono border border-neutral-200">3</div>
                        <span>Result</span>
                    </div>
                </div>
            </div>

            <div className="w-full h-px bg-neutral-100 mb-10" />

            {/* --- MAIN CONTENT GRID --- */}
            <main className="flex-1 max-w-[1240px] mx-auto w-full px-6 flex flex-col lg:grid lg:grid-cols-2 gap-10 items-start pb-20">

                {/* LEFT COLUMN: Engine Status & Steps */}
                <div className="w-full flex flex-col space-y-6">
                    <div className="mb-2 space-y-2">
                        <h2 className="text-neutral-400 text-[10px] uppercase font-bold tracking-[0.25em]">Engine Cluster Status</h2>
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                            <h3 className="text-[22px] font-bold tracking-tight text-neutral-800">Active Analysis</h3>
                        </div>
                    </div>

                    <div className="bg-white border border-neutral-200/60 rounded-[16px] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] min-h-[380px] flex flex-col justify-between">

                        <div className="space-y-6">
                            {ANALYSIS_SUB_STAGES.map((s, i) => {
                                const isActive = i === activeSubStage;
                                const isDone = i < activeSubStage;
                                return (
                                    <div key={s.id} className="flex items-center gap-5 group">
                                        <div className={cn(
                                            "w-11 h-11 rounded-[12px] flex items-center justify-center transition-all duration-300 border",
                                            isActive ? "bg-white border-neutral-200 text-black shadow-sm" :
                                                isDone ? "bg-neutral-50 border-neutral-100 text-neutral-400" :
                                                    "bg-transparent border-dashed border-neutral-200 text-neutral-300"
                                        )}>
                                            <s.icon strokeWidth={isActive ? 2.5 : 2} className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-[15px] font-semibold tracking-tight transition-colors",
                                                isActive ? "text-neutral-900" : isDone ? "text-neutral-500" : "text-neutral-300"
                                            )}>
                                                {s.label}
                                            </span>
                                            {isActive && (
                                                <motion.span layoutId="activeSubText" className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest mt-1">
                                                    Processing...
                                                </motion.span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Progress Bar Inside the Left Card */}
                        <div className="pt-8 mt-8 border-t border-neutral-100">
                            <div className="flex justify-between items-center text-[11px] text-neutral-400 font-mono mb-3 uppercase tracking-widest">
                                <span>JOB_ID: {jobId ? jobId.substring(0, 10) : '------'}</span>
                                {progress < 100 && <span>ETA: ~1M 40S</span>}
                                {progress >= 100 && <span>COMPLETE</span>}
                            </div>
                            <div className="bg-neutral-100 h-[6px] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-black rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Center Status Box & Logs */}
                <div className="w-full flex flex-col gap-6 pt-12">

                    {/* Minimalist Center Box (Matching reference quote box) */}
                    <div className="bg-white border border-neutral-200/60 rounded-[16px] p-10 shadow-[0_2px_15px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center min-h-[220px] relative text-center">

                        <motion.div
                            key={quoteIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="max-w-[340px] mx-auto"
                        >
                            <p className="text-[20px] font-medium tracking-tight text-neutral-800 italic leading-[1.4]">
                                &quot;{QUOTES[quoteIndex]}&quot;
                            </p>
                        </motion.div>

                        <div className="mt-10 flex flex-col items-center gap-3">
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                                <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-neutral-600">{statusText}</span>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-[0.25em]">CORE_DESIGN_V3</span>
                        </div>

                    </div>

                    {/* Bottom Logs Split */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[280px]">

                        {/* Pipeline Health / Compute Metrics */}
                        <div className="bg-white border border-neutral-200/60 rounded-[16px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-[11px] font-bold text-neutral-800 uppercase tracking-widest">Pipeline Health</h3>
                                </div>
                                <p className="text-[13px] text-neutral-500 leading-[1.6]">
                                    Your structure is being processed on a distributed cluster of NVIDIA A100 GPUs. Diffusion sampling accuracy is optimized for biological fidelity.
                                </p>
                            </div>

                            <div className="mt-auto border-t border-neutral-100 pt-4 flex items-center justify-between">
                                <div className="flex gap-3">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-7 h-7 rounded-full bg-neutral-50 border-2 border-white flex items-center justify-center text-[8px] font-bold text-neutral-400 shadow-sm">NV</div>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-widest">Conn: 100%</span>
                            </div>

                            {job?.status === "failed" && (
                                <div className="mt-4 bg-[#FFF5F5] border border-[#FFE5E5] p-4 rounded-[12px]">
                                    <div className="flex items-center gap-2 text-red-600 mb-1.5">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="font-semibold text-[11px] uppercase tracking-wider">Analysis Error</span>
                                    </div>
                                    <p className="text-[12px] text-red-800/80 mb-3">{job.error_message || "Engine timeout."}</p>
                                    <Button
                                        variant="outline"
                                        className="w-full bg-white text-neutral-900 border-neutral-200 shadow-sm h-8 text-[11px]"
                                        onClick={() => router.push('/app/new')}
                                    >
                                        Return Home
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Logs */}
                        <LogStream logs={logs} />
                    </div>

                </div>

            </main>
        </div>
    );
}
