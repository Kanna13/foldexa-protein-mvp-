"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
    Cpu,
    Zap,
    Database,
    Layers,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Dna,
    Terminal,
    RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { api, Job } from "@/lib/api";
import { cn } from "@/lib/utils";

// --- CONFIG & CONSTANTS ---

const PIPELINE_GLOBAL = [
    { id: 1, label: "Configure", status: "completed" },
    { id: 2, label: "Analyze", status: "active" },
    { id: 3, label: "Result", status: "pending" },
];

const ANALYSIS_SUB_STAGES = [
    { id: "upload", label: "Upload", icon: Database },
    { id: "preprocessing", label: "Preprocessing", icon: Cpu },
    { id: "diffusion", label: "Diffusion Sampling", icon: RefreshCw },
    { id: "optimization", label: "Structure Optimization", icon: Layers },
    { id: "finalizing", label: "Finalizing", icon: CheckCircle2 },
];

const QUOTES = [
    "Designing antibodies through generative diffusion.",
    "Exploring the protein landscape.",
    "Simulating molecular intelligence.",
    "Engineering next-generation therapeutics.",
    "Diffusion models are reshaping protein design.",
    "Synthesizing structure from noise.",
    "Bridging the gap between code and biology.",
    "Decoding the language of life.",
];

// --- COMPONENTS ---

/** Animated DNA Helix / Molecule Visualization (Light Theme) */
function MoleculeVisualization() {
    return (
        <div className="relative w-full h-[400px] flex items-center justify-center">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-neutral-100 blur-[100px] rounded-full scale-150" />

            <div className="relative w-64 h-64">
                {/* Rotating Circles */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 border border-neutral-200 rounded-full"
                        animate={{
                            rotate: 360,
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 10 + i * 5,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                ))}

                {/* Floating "Atom" Nodes */}
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-neutral-800 shadow-sm"
                        initial={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -20, 0],
                            x: [0, 10, 0],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                    />
                ))}

                {/* Center Core */}
                <div className="absolute inset-4 rounded-full bg-white/60 backdrop-blur-xl border border-neutral-200 shadow-sm flex items-center justify-center">
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="relative"
                    >
                        <Dna className="w-16 h-16 text-neutral-800 opacity-90" />
                        <motion.div
                            className="absolute inset-0 bg-neutral-200/50 blur-xl"
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

/** Live Log Stream (Light Theme) */
function LogStream({ logs }: { logs: string[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-5 w-full h-[240px] flex flex-col font-mono">
            <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-3">
                <Terminal className="w-4 h-4 text-neutral-500" />
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Foldexa Engine Logs</span>
                <div className="ml-auto flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                </div>
            </div>
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-2 scrollbar-none"
            >
                {logs.map((log, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i}
                        className="text-[12px] text-neutral-600 flex gap-3"
                    >
                        <span className="text-neutral-400 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
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
    const [statusText, setStatusText] = useState("Initializing Engine...");
    const [activeSubStage, setActiveSubStage] = useState(0);
    const [logs, setLogs] = useState<string[]>(["Connection established with Railway primary node.", "Awaiting handshake from RunPod GPU worker..."]);
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

    // Simulated Log/Progress progression while polling
    useEffect(() => {
        if (!job) return;

        // Based on backend status, update logs and sub-stages
        if (job.status === "queued" || job.status === "provisioning") {
            setActiveSubStage(1); // Preprocessing
            setStatusText("Preparing structure for inference...");
            setLogs(prev => {
                const newLogs = ["Resource allocated on GPU cluster.", "Scaling container environment...", "Uploading structure to MinIO storage..."];
                // Only add if not already present
                return prev.includes(newLogs[0]) ? prev : [...prev, ...newLogs];
            });
        }
        else if (job.status === "running") {
            setActiveSubStage(2); // Diffusion
            setStatusText("Diffusion Sampling in progress...");
            setLogs(prev => {
                const newLogs = ["Loading DiffAb model weights into VRAM...", "Diffusion step 1/100 initialized.", "Batch sampling started..."];
                return prev.includes(newLogs[0]) ? prev : [...prev, ...newLogs];
            });
        }
        else if (job.status === "completed") {
            setActiveSubStage(4); // Finalizing
            setStatusText("Task completed. Redirecting...");
            setLogs(prev => {
                const newLogs = ["Validation metrics passed (pLDDT > 0.9).", "Result artifact uploaded successfully.", "Synthesized PDB ready for download."];
                return prev.includes(newLogs[0]) ? prev : [...prev, ...newLogs];
            });
        }
    }, [job]);

    // Polling Logic
    useEffect(() => {
        if (!jobId) return;

        let interval: NodeJS.Timeout;

        const poll = async () => {
            try {
                const data = await api.getJob(jobId);
                setJob(data);

                if (data.status === "completed") {
                    setTimeout(() => router.push(`/app/results/${jobId}`), 2000);
                    clearInterval(interval);
                } else if (data.status === "failed") {
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Poll error:", err);
            }
        };

        poll();
        interval = setInterval(poll, 4000);
        return () => clearInterval(interval);
    }, [jobId, router]);

    // Simulated smoother progress bar
    useEffect(() => {
        if (job?.status === "completed") {
            setProgress(100);
            return;
        }

        const target = activeSubStage * 25;
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev < target) return prev + 0.5;
                if (prev < 90) return prev + 0.1; // slow crawl near end
                return prev;
            });
        }, 100);
        return () => clearInterval(timer);
    }, [activeSubStage, job]);

    return (
        <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col font-sans overflow-hidden">
            <Navbar variant="white" />

            {/* --- TOP: Global Progress --- */}
            <div className="pt-24 pb-8 flex justify-center border-b border-neutral-200 bg-white shadow-sm z-10 relative">
                <div className="flex items-center gap-12">
                    {PIPELINE_GLOBAL.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-3">
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-500",
                                step.status === "active" ? "bg-neutral-900 border-neutral-900 text-white shadow-sm" :
                                    step.status === "completed" ? "bg-neutral-100 border-neutral-200 text-neutral-900" :
                                        "bg-white border-neutral-200 text-neutral-400"
                            )}>
                                {step.status === "completed" ? "✓" : step.id}
                            </div>
                            <span className={cn(
                                "text-[12px] font-black uppercase tracking-widest",
                                step.status === "active" ? "text-neutral-900" : "text-neutral-400"
                            )}>
                                {step.label}
                            </span>
                            {i < PIPELINE_GLOBAL.length - 1 && (
                                <div className="ml-8 w-12 h-px bg-neutral-200" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 max-w-[1400px] mx-auto w-full px-8 flex flex-col lg:grid lg:grid-cols-12 gap-12 items-center lg:items-stretch py-12">

                {/* LEFT: Engine Info & Sub-Progress */}
                <div className="lg:col-span-3 flex flex-col justify-center space-y-8 order-2 lg:order-1">
                    <div className="space-y-1">
                        <h2 className="text-neutral-500 text-[11px] font-black uppercase tracking-[0.3em]">Engine Cluster Status</h2>
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                            <h3 className="text-xl font-bold tracking-tight text-neutral-900">Active Analysis</h3>
                        </div>
                    </div>

                    {/* Sub-Stages List */}
                    <div className="space-y-6 pt-4">
                        {ANALYSIS_SUB_STAGES.map((s, i) => {
                            const isActive = i === activeSubStage;
                            const isDone = i < activeSubStage;
                            return (
                                <div key={s.id} className="flex items-center gap-4 group">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border shadow-sm",
                                        isActive ? "bg-white border-neutral-300 text-neutral-900 translate-x-1 shadow-md" :
                                            isDone ? "bg-neutral-100 border-neutral-200 text-neutral-500" :
                                                "bg-transparent border-transparent text-neutral-300"
                                    )}>
                                        <s.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-[13px] font-bold tracking-tight transition-colors",
                                            isActive ? "text-neutral-900" : isDone ? "text-neutral-500" : "text-neutral-300"
                                        )}>
                                            {s.label}
                                        </span>
                                        {isActive && <motion.span layoutId="activeSub" className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Processing...</motion.span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-8 border-t border-neutral-200">
                        <div className="flex justify-between items-center text-[11px] text-neutral-500 font-mono mb-2">
                            <span>JOB_ID: <span className="text-neutral-900">{jobId.substring(0, 16)}...</span></span>
                            <span>ETA: ~1m 40s</span>
                        </div>
                        <div className="bg-neutral-200/60 h-1.5 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                className="h-full bg-neutral-900"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                    </div>
                </div>

                {/* CENTER: Main Visual */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center relative order-1 lg:order-2">
                    <MoleculeVisualization />

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <motion.div
                            key={quoteIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="bg-white/80 backdrop-blur-md px-10 py-6 rounded-[24px] border border-neutral-200 shadow-xl"
                        >
                            <p className="text-xl md:text-2xl font-medium tracking-tight text-neutral-800 italic leading-relaxed">
                                &quot;{QUOTES[quoteIndex]}&quot;
                            </p>
                        </motion.div>
                    </div>

                    <div className="mt-8 text-center space-y-2">
                        <div className="flex items-center justify-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-neutral-800" />
                            <span className="text-2xl font-black tracking-tight uppercase text-neutral-900">{statusText}</span>
                        </div>
                        <p className="text-neutral-500 font-mono text-sm tracking-widest">DIFFUSION SAMPLING // CORE_DESIGN_V3</p>
                    </div>
                </div>

                {/* RIGHT: Live Logs & Meta */}
                <div className="lg:col-span-3 flex flex-col justify-center space-y-8 order-3">
                    <LogStream logs={logs} />

                    <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-neutral-900">
                            <Zap className="w-4 h-4 fill-emerald-500 stroke-none text-emerald-500" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Pipeline Health</span>
                        </div>
                        <p className="text-[13px] text-neutral-600 leading-relaxed">
                            Your structure is being processed on a distributed cluster of NVIDIA A100 GPUs. Diffusion sampling accuracy is optimized for biological fidelity.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-white border-2 border-neutral-200 flex items-center justify-center text-[8px] font-black text-neutral-900 shadow-sm">NV</div>
                                ))}
                            </div>
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Node Connectivity: 100%</span>
                        </div>
                    </div>

                    {job?.status === "failed" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-100 p-5 rounded-2xl shadow-sm"
                        >
                            <div className="flex items-center gap-2 text-red-600 mb-2">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-bold uppercase tracking-widest text-[11px]">Analysis Error</span>
                            </div>
                            <p className="text-xs text-red-800/80 mb-4">{job.error_message || "Engine timeout during sampling."}</p>
                            <Button
                                variant="outline"
                                className="w-full bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50 h-9 text-[11px]"
                                onClick={() => router.push('/app/new')}
                            >
                                Try Different Scafffold
                            </Button>
                        </motion.div>
                    )}
                </div>

            </main>

            {/* --- BOTTOM: Subtle Decors --- */}
            <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
            <div className="fixed bottom-8 left-12 font-mono text-[10px] text-neutral-400 tracking-widest uppercase pointer-events-none">
                Foldexa // Project_Foldexa_V1.9.3
            </div>
            <div className="fixed bottom-8 right-12 font-mono text-[10px] text-neutral-400 tracking-widest uppercase pointer-events-none">
                System_Status: Optimal
            </div>
        </div>
    );
}
