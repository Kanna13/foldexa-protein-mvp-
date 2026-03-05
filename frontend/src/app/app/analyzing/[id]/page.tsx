"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    Cpu,
    Zap,
    Database,
    Layers,
    Code,
    ChevronRight,
    AlertCircle,
    Loader2,
    CheckCircle2,
    FlaskConical,
    Dna,
    Network,
    Terminal,
    Clock,
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

/** Animated DNA Helix / Molecule Visualization */
function MoleculeVisualization() {
    return (
        <div className="relative w-full h-[400px] flex items-center justify-center">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full scale-150" />

            <div className="relative w-64 h-64">
                {/* Rotating Circles */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 border border-emerald-500/10 rounded-full"
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
                        className="absolute w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                        initial={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -20, 0],
                            x: [0, 10, 0],
                            opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                    />
                ))}

                {/* Center Core */}
                <div className="absolute inset-4 rounded-full bg-emerald-500/5 backdrop-blur-3xl border border-emerald-500/20 flex items-center justify-center">
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="relative"
                    >
                        <Dna className="w-16 h-16 text-emerald-500 opacity-80" />
                        <motion.div
                            className="absolute inset-0 bg-emerald-500/20 blur-2xl"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

/** Live Log Stream */
function LogStream({ logs }: { logs: string[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 w-full h-[240px] flex flex-col font-mono">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Foldexa Engine Logs</span>
                <div className="ml-auto flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
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
                        className="text-[12px] text-neutral-500 flex gap-3"
                    >
                        <span className="text-emerald-500/40 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
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
            if (logs.length < 5) {
                setLogs(prev => [...prev, "Resource allocated on GPU cluster.", "Scaling container environment...", "Uploading structure to MinIO storage..."]);
            }
        }
        else if (job.status === "running") {
            setActiveSubStage(2); // Diffusion
            setStatusText("Diffusion Sampling in progress...");
            if (!logs.includes("Loading DiffAb model weights into VRAM...")) {
                setLogs(prev => [...prev, "Loading DiffAb model weights into VRAM...", "Diffusion step 1/100 initialized.", "Batch sampling started..."]);
            }
        }
        else if (job.status === "completed") {
            setActiveSubStage(4); // Finalizing
            setStatusText("Task completed. Redirecting...");
            setLogs(prev => [...prev, "Validation metrics passed (pLDDT > 0.9).", "Result artifact uploaded successfully.", "Synthesized PDB ready for download."]);
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
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
            <Navbar variant="contrast" />

            {/* --- TOP: Global Progress --- */}
            <div className="pt-24 pb-8 flex justify-center border-b border-white/5 bg-[#080808]">
                <div className="flex items-center gap-12">
                    {PIPELINE_GLOBAL.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-3">
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-500",
                                step.status === "active" ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
                                    step.status === "completed" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-500" :
                                        "bg-neutral-900 border-neutral-800 text-neutral-500"
                            )}>
                                {step.status === "completed" ? "✓" : step.id}
                            </div>
                            <span className={cn(
                                "text-[12px] font-black uppercase tracking-widest",
                                step.status === "active" ? "text-white" : "text-neutral-600"
                            )}>
                                {step.label}
                            </span>
                            {i < PIPELINE_GLOBAL.length - 1 && (
                                <div className="ml-8 w-12 h-px bg-neutral-800/50" />
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
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <h3 className="text-xl font-bold tracking-tight">Active Analysis</h3>
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
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border",
                                        isActive ? "bg-emerald-500 border-emerald-500 text-black translate-x-1" :
                                            isDone ? "bg-white/5 border-emerald-500/30 text-emerald-500" :
                                                "bg-white/5 border-white/5 text-neutral-700"
                                    )}>
                                        <s.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-[13px] font-bold tracking-tight transition-colors",
                                            isActive ? "text-white" : isDone ? "text-neutral-400" : "text-neutral-700"
                                        )}>
                                            {s.label}
                                        </span>
                                        {isActive && <motion.span layoutId="activeSub" className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Processing...</motion.span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        <div className="flex justify-between items-center text-[11px] text-neutral-500 font-mono mb-2">
                            <span>JOB_ID: {jobId}</span>
                            <span>ETA: ~1m 40s</span>
                        </div>
                        <div className="bg-neutral-900 h-1 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
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
                            className="bg-black/40 backdrop-blur-md px-10 py-6 rounded-[30px] border border-white/10 shadow-2xl"
                        >
                            <p className="text-xl md:text-2xl font-medium tracking-tight text-white/90 italic leading-relaxed">
                                &quot;{QUOTES[quoteIndex]}&quot;
                            </p>
                        </motion.div>
                    </div>

                    <div className="mt-8 text-center space-y-2">
                        <div className="flex items-center justify-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                            <span className="text-2xl font-black tracking-tight uppercase">{statusText}</span>
                        </div>
                        <p className="text-neutral-500 font-mono text-sm tracking-widest">DIFFUSION SAMPLING // CORE_DESIGN_V3</p>
                    </div>
                </div>

                {/* RIGHT: Live Logs & Meta */}
                <div className="lg:col-span-3 flex flex-col justify-center space-y-8 order-3">
                    <LogStream logs={logs} />

                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <Zap className="w-4 h-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Pipeline Health</span>
                        </div>
                        <p className="text-[13px] text-neutral-400 leading-relaxed">
                            Your structure is being processed on a distributed cluster of NVIDIA A100 GPUs. Diffusion sampling accuracy is optimized for biological fidelity.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-neutral-800 border-2 border-[#050505] flex items-center justify-center text-[8px] font-black">NV</div>
                                ))}
                            </div>
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Node Connectivity: 100%</span>
                        </div>
                    </div>

                    {job?.status === "failed" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl"
                        >
                            <div className="flex items-center gap-2 text-red-500 mb-2">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-bold uppercase tracking-widest text-[11px]">Analysis Error</span>
                            </div>
                            <p className="text-xs text-red-100/70 mb-4">{job.error_message || "Engine timeout during sampling."}</p>
                            <Button
                                variant="secondary"
                                className="w-full bg-white text-black hover:bg-neutral-200 h-9 text-[11px]"
                                onClick={() => router.push('/app/new')}
                            >
                                Try Different Scafffold
                            </Button>
                        </motion.div>
                    )}
                </div>

            </main>

            {/* --- BOTTOM: Subtle Decors --- */}
            <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            <div className="fixed bottom-8 left-12 font-mono text-[10px] text-neutral-800 tracking-widest uppercase pointer-events-none">
                Foldexa // Project_Foldexa_V1.9.3
            </div>
            <div className="fixed bottom-8 right-12 font-mono text-[10px] text-neutral-800 tracking-widest uppercase pointer-events-none">
                System_Status: Optimal
            </div>
        </div>
    );
}
