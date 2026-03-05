"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Dna, Network, FlaskConical, Grid, Sparkles,
    Copy, Check, ArrowRight, Loader2, AlertCircle, FileCode
} from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type DiffAbModel = {
    id: string;
    name: string;
    badge?: string;
    badgeClass?: string;
    file: string;
    description: string;
    tags: { label: string; colorClass: string; bgClass: string }[];
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    disabled: boolean;
    pipelineType: string;
};

const MODELS: DiffAbModel[] = [
    {
        id: "codesign_single",
        name: "Single CDR Co-Design",
        badge: "DEFAULT",
        badgeClass: "bg-emerald-500 text-white font-bold",
        file: "codesign_single.yml",
        description: "Co-designs the sequence and structure of one CDR on a fixed antibody scaffold using diffusion.",
        tags: [
            { label: "sequence", colorClass: "text-emerald-500", bgClass: "bg-emerald-50" },
            { label: "structure", colorClass: "text-sky-500", bgClass: "bg-sky-50" },
            { label: "single CDR", colorClass: "text-amber-500", bgClass: "bg-amber-50" },
        ],
        icon: Dna,
        iconBg: "bg-neutral-100",
        iconColor: "text-neutral-900",
        disabled: false,
        pipelineType: "diffab_only",
    },
    {
        id: "codesign_multicdrs",
        name: "Multi-CDR Co-Design",
        badge: "SOON",
        badgeClass: "bg-neutral-200 text-neutral-900 font-bold",
        file: "codesign_multicdrs.yml",
        description: "Simultaneously co-designs sequence and structure across all CDR loops at once.",
        tags: [
            { label: "sequence", colorClass: "text-emerald-500", bgClass: "bg-emerald-50" },
            { label: "structure", colorClass: "text-sky-500", bgClass: "bg-sky-50" },
            { label: "multi-CDR", colorClass: "text-violet-500", bgClass: "bg-violet-50" },
        ],
        icon: Network,
        iconBg: "bg-neutral-100",
        iconColor: "text-neutral-900",
        disabled: true,
        pipelineType: "diffab_only",
    },
    {
        id: "abopt_singlecdr",
        name: "Single CDR Optimization",
        badge: "SOON",
        badgeClass: "bg-neutral-200 text-neutral-900 font-bold",
        file: "abopt_singlecdr.yml",
        description: "Optimizes the sequence and structure of one CDR loop on an existing antibody.",
        tags: [
            { label: "optimize", colorClass: "text-rose-500", bgClass: "bg-rose-50" },
            { label: "sequence", colorClass: "text-emerald-500", bgClass: "bg-emerald-50" },
        ],
        icon: FlaskConical,
        iconBg: "bg-neutral-100",
        iconColor: "text-neutral-900",
        disabled: true,
        pipelineType: "diffab_only",
    },
    {
        id: "fixedbb_design",
        name: "Fixed Backbone Design",
        badge: "SOON",
        badgeClass: "bg-neutral-200 text-neutral-900 font-bold",
        file: "fixedbb_design.yml",
        description: "Designs sequences on a fixed backbone structure for precise binding control.",
        tags: [
            { label: "fixed-bb", colorClass: "text-indigo-500", bgClass: "bg-indigo-50" },
            { label: "sequence", colorClass: "text-emerald-500", bgClass: "bg-emerald-50" },
        ],
        icon: Grid,
        iconBg: "bg-neutral-100",
        iconColor: "text-neutral-900",
        disabled: true,
        pipelineType: "diffab_only",
    },
    {
        id: "denovo_design",
        name: "De Novo Full Design",
        badge: "SOON",
        badgeClass: "bg-neutral-200 text-neutral-900 font-bold",
        file: "denovo_design.yml",
        description: "Full de novo antibody design from scratch — generates sequence and backbone simultaneously.",
        tags: [
            { label: "de novo", colorClass: "text-orange-500", bgClass: "bg-orange-50" },
            { label: "sequence", colorClass: "text-emerald-500", bgClass: "bg-emerald-50" },
            { label: "structure", colorClass: "text-sky-500", bgClass: "bg-sky-50" },
        ],
        icon: Sparkles,
        iconBg: "bg-neutral-100",
        iconColor: "text-neutral-900",
        disabled: true,
        pipelineType: "diffab_only",
    },
];

// Syntax highlighting helpers for config panel
const VKey = ({ children }: { children: React.ReactNode }) => <span className="text-white/90">{children}</span>;
const VStr = ({ children }: { children: React.ReactNode }) => <span className="text-[#fbbf24] font-medium">&quot;{children}&quot;</span>;
const VNum = ({ children }: { children: React.ReactNode }) => <span className="text-emerald-500 font-bold">{children}</span>;
const VBool = ({ val }: { val: boolean }) => <span className={cn("font-bold", val ? "text-emerald-500" : "text-rose-500")}>{val ? "true" : "false"}</span>;

export default function DiffAbModelsPage() {
    const router = useRouter();

    // State
    const [selectedMode, setSelectedMode] = useState<string>("codesign_single");
    const [fileMeta, setFileMeta] = useState<{ name: string, size: number, type: string } | null>(null);
    const [pdbFile, setPdbFile] = useState<File | null>(null);
    const [status, setStatus] = useState({ msg: "Loading...", type: "idle" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Config parameters
    const [numDesigns, setNumDesigns] = useState(10);
    const [samplingTemp, setSamplingTemp] = useState(0.5);
    const [device, setDevice] = useState("cuda");
    const [relaxPdb, setRelaxPdb] = useState(true);
    const [savePdb, setSavePdb] = useState(true);
    const [tqdmBar, setTqdmBar] = useState(false);
    const [fixSeed, setFixSeed] = useState(false);

    // Window control state
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Helper
    const currentModel = MODELS.find(m => m.id === selectedMode) || MODELS[0];

    useEffect(() => {
        // Restore PDB
        const metaStr = sessionStorage.getItem('foldexa_pdb_meta');
        const b64 = sessionStorage.getItem('foldexa_pdb_data');

        if (metaStr && b64) {
            try {
                const meta = JSON.parse(metaStr);

                // Reconstruct Blob -> File
                const byteChars = atob(b64);
                const byteArrays = [];
                for (let i = 0; i < byteChars.length; i += 512) {
                    const slice = byteChars.slice(i, i + 512);
                    const byteNums = new Array(slice.length);
                    for (let j = 0; j < slice.length; j++) byteNums[j] = slice.charCodeAt(j);
                    byteArrays.push(new Uint8Array(byteNums));
                }
                const file = new File(byteArrays, meta.name, { type: meta.type || 'chemical/x-pdb' });

                setTimeout(() => {
                    setFileMeta(meta);
                    setPdbFile(file);
                    setStatus({ msg: `PDB loaded — ${meta.name}. Ready to configure.`, type: "success" });
                }, 0);
            } catch {
                setTimeout(() => {
                    setStatus({ msg: "Failed to parse uploaded file. Please go back.", type: "error" });
                }, 0);
            }
        } else {
            setTimeout(() => {
                setStatus({ msg: "No PDB file detected. Please go back and upload.", type: "error" });
            }, 0);
        }
    }, []);

    const handleCopy = () => {
        const textConfig = `
## PIPELINE
design_mode: "${currentModel.id}"
config_file: "configs/test/${currentModel.file}"
pipeline_type: "${currentModel.pipelineType}"

## SAMPLING
num_designs: ${numDesigns}
sampling_temp: ${samplingTemp}
num_diffusion_steps: 100

## HARDWARE
device: "${device}"
num_workers: 4

## OUTPUT
pdb_relax: ${relaxPdb}
save_pdb: ${savePdb}
output_dir: "./results/"

## LOGGING
tqdm_bar: ${tqdmBar}
fix_seed: ${fixSeed}
log_level: "INFO"
    `.trim();

        navigator.clipboard.writeText(textConfig).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSubmit = async () => {
        if (!pdbFile) {
            router.push('/app/new');
            return;
        }

        if (currentModel.disabled) return;

        setIsSubmitting(true);
        setStatus({ msg: "Uploading PDB + submitting to Foldexa pipeline…", type: "idle" });

        const formData = new FormData();
        formData.append('file', pdbFile);
        formData.append('pipeline_type', currentModel.pipelineType);
        formData.append('selected_models', 'diffab');

        const diffabConfig = {
            design_mode: currentModel.id,
            num_designs: numDesigns,
            sampling_temp: samplingTemp,
            device: device,
            pdb_relax: relaxPdb,
            save_pdb: savePdb,
            tqdm_bar: tqdmBar,
            fix_seed: fixSeed,
        };
        formData.append('diffab_config', JSON.stringify(diffabConfig));

        try {
            const data = await api.createJob(formData);

            setStatus({ msg: `✓ Job created — ID: ${data.job_id}. Redirecting…`, type: "success" });

            // Cleanup
            sessionStorage.removeItem('foldexa_pdb_meta');
            sessionStorage.removeItem('foldexa_pdb_data');

            setTimeout(() => {
                router.push(`/app/analyzing/${data.job_id}`);
            }, 1000);
        } catch (error) {
            console.error(error);
            const msg = error instanceof Error ? error.message : 'Failed to submit job.';
            setStatus({ msg: `Error: ${msg}`, type: "error" });
            setIsSubmitting(false);
        }
    };

    // Render
    return (
        <div className="min-h-screen flex flex-col bg-[#FDFDFD] text-neutral-900 font-sans pt-[72px]">
            <Navbar variant="contrast" />

            {/* Main split view */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-screen">

                {/* Left column: Setup */}
                <div className={cn(
                    "flex-1 bg-neutral-50 px-8 pt-12 pb-24 lg:px-12 lg:pt-16 lg:pb-32 transition-all duration-500",
                    isExpanded ? "opacity-30 blur-[2px] scale-[0.98] pointer-events-none" : ""
                )}>
                    <div className="max-w-3xl mx-auto">

                        {/* Integrated Header & Process Bar (Apple-level) */}
                        <div className="mb-8 flex flex-col items-start px-0">
                            {/* Focused Process Box - ONLY Stepper */}
                            <div className="bg-white border border-neutral-200/80 rounded-[30px] px-10 py-7 shadow-[0_2px_14px_-2px_rgba(0,0,0,0.03)] mb-5">
                                <div className="flex items-center gap-10 text-[12px] font-black tracking-[0.15em] uppercase">
                                    <div className="flex items-center gap-3 text-emerald-600">
                                        <div className="relative group">
                                            {/* Premium Rotating Scanner Animation (Lightweight) */}
                                            <motion.div
                                                className="absolute -inset-2 rounded-full border border-emerald-500/10 border-dashed"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                            />
                                            <motion.div
                                                className="absolute -inset-1 rounded-full border-2 border-emerald-500/20 border-t-emerald-500/60"
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            />
                                            {/* Soft Breath Glow */}
                                            <motion.div
                                                className="absolute inset-0 rounded-full bg-emerald-500/10 blur-md"
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: [0.3, 0.6, 0.3]
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                            <div className="relative w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[15px] font-mono shadow-lg border border-emerald-400/30 z-10 overflow-hidden">
                                                <span className="relative z-10">1</span>
                                                <motion.div
                                                    className="absolute inset-x-0 top-0 h-1/2 bg-white/10"
                                                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-[14px] font-black tracking-widest pl-2">Configure</span>
                                    </div>
                                    <div className="w-12 h-px bg-neutral-200/60" />
                                    <div className="flex items-center gap-3 text-neutral-400">
                                        <div className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center text-[15px] font-mono">2</div>
                                        <span className="text-[14px]">Analyze</span>
                                    </div>
                                    <div className="w-12 h-px bg-neutral-200/60" />
                                    <div className="flex items-center gap-3 text-neutral-400">
                                        <div className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center text-[15px] font-mono">3</div>
                                        <span className="text-[14px]">Result</span>
                                    </div>
                                </div>
                            </div>

                            {/* Standalone File Info - Positioned BELOW box, Aligned START */}
                            <div className="flex items-center gap-4 py-2 px-5 rounded-full bg-neutral-50 border border-neutral-200/60 shadow-inner group transition-all hover:border-neutral-300/80 ml-1">
                                <FileCode className="w-4.5 h-4.5 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                                <span className="text-[14px] font-bold text-neutral-900 truncate max-w-[340px] tracking-tight">
                                    {fileMeta ? fileMeta.name : "mTie2-hTAAB.pdb"}
                                </span>
                                <div className="w-px h-4 bg-neutral-300 mx-2" />
                                <span className="text-[13px] font-mono text-emerald-600 font-black">
                                    {fileMeta ? (fileMeta.size / 1024).toFixed(1) + " KB" : "390.8 KB"}
                                </span>
                            </div>
                        </div>

                        {/* Selection Section */}
                        <div className="mb-6 flex items-center justify-between">
                            <span className="text-[13px] font-black tracking-[0.25em] uppercase text-neutral-900">Select Design Mode</span>
                            <div className="h-px flex-1 mx-6 bg-neutral-200" />
                            <span className="px-4 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-[11px] font-mono font-bold border border-neutral-200 shadow-sm leading-none">
                                {currentModel.file}
                            </span>
                        </div>

                        <div className="bg-neutral-100/70 border border-neutral-200/60 p-2.5 rounded-[20px] flex flex-col gap-2 mb-10 shadow-sm">
                            {MODELS.map((model) => {
                                const isActive = selectedMode === model.id;
                                return (
                                    <motion.div
                                        key={model.id}
                                        onClick={() => setSelectedMode(model.id)}
                                        className={cn(
                                            "relative p-4 rounded-xl flex items-start gap-4 transition-all duration-200 border-2 cursor-pointer",
                                            isActive
                                                ? "bg-white border-emerald-500 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)]"
                                                : "bg-white border-transparent hover:border-neutral-200 hover:shadow-sm"
                                        )}
                                    >
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5", model.iconBg)}>
                                            <model.icon className={cn("w-5 h-5", model.iconColor)} />
                                        </div>

                                        <div className="flex-1 min-w-0 pr-6">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={cn("font-bold text-[15px]", model.disabled && !isActive ? "text-neutral-500" : "text-neutral-900")}>
                                                    {model.name}
                                                </span>
                                                {model.badge && (
                                                    <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[5px]", model.badgeClass)}>
                                                        {model.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-mono text-[13px] text-neutral-900 mb-2">
                                                {model.file}
                                            </div>
                                            <p className="text-neutral-900 text-[15px] font-medium leading-relaxed mb-3 pr-4">
                                                {model.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2.5">
                                                {model.tags.map((t: { label: string, colorClass: string, bgClass: string }) => (
                                                    <span key={t.label} className={cn("text-[12px] font-bold px-3 py-1 rounded-lg", t.colorClass, t.bgClass)}>
                                                        {t.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "absolute right-6 top-1/2 -translate-y-1/2 w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center transition-all",
                                            isActive ? "bg-emerald-500 border-emerald-500" : "border-neutral-400 bg-neutral-100"
                                        )}>
                                            {isActive && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Configuration Options */}
                        <div className="mb-6 flex items-center justify-between">
                            <span className="text-[13px] font-black tracking-[0.2em] uppercase text-neutral-900">02 — Run Parameters</span>
                        </div>

                        <div className="bg-neutral-100/70 border border-neutral-200/60 p-2.5 rounded-[20px] flex flex-col gap-2 mb-10 shadow-sm relative overflow-hidden">

                            <AnimatePresence>
                                {currentModel.disabled && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md flex items-center justify-center rounded-[20px]"
                                    >
                                        <div className="bg-white px-6 py-5 rounded-2xl shadow-xl border border-neutral-200 flex flex-col items-center text-center max-w-sm mx-4">
                                            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                                                <Network className="w-8 h-8 text-neutral-900" />
                                            </div>
                                            <h3 className="text-[20px] font-bold text-neutral-900 mb-2">{currentModel.name}</h3>
                                            <p className="text-[15px] text-neutral-900 font-medium leading-relaxed mb-1">
                                                This design mode will be released in a future Foldexa update.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white border border-neutral-100/80 p-4 rounded-xl flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-[15px] font-bold text-neutral-900">Designs</div>
                                        <div className="text-[13px] text-neutral-900 font-medium mt-0.5">Num. candidates</div>
                                    </div>
                                    <input type="number"
                                        className="w-[100px] bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-[15px] font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                        value={numDesigns} min={1} max={500} onChange={e => setNumDesigns(parseInt(e.target.value) || 10)}
                                        disabled={currentModel.disabled}
                                    />
                                </div>

                                <div className="bg-white border border-neutral-100/80 p-4 rounded-xl flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-[15px] font-bold text-neutral-900">Temperature</div>
                                        <div className="text-[13px] text-neutral-900 font-medium mt-0.5">Diversity control</div>
                                    </div>
                                    <select
                                        className="w-[110px] bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-[13px] font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                                        value={samplingTemp} onChange={e => setSamplingTemp(parseFloat(e.target.value))}
                                        disabled={currentModel.disabled}
                                    >
                                        <option value={0.1}>0.1 - Low</option>
                                        <option value={0.5}>0.5 - Med</option>
                                        <option value={1.0}>1.0 - High</option>
                                    </select>
                                </div>
                            </div>

                            {[
                                {
                                    id: 'device', label: 'Compute Device', hint: 'Hardware target for inference', type: 'select', val: device, setter: setDevice,
                                    opts: [{ v: 'cuda', l: 'CUDA (GPU)' }, { v: 'cpu', l: 'CPU' }, { v: 'mps', l: 'Apple MPS' }]
                                },
                                { id: 'relax', label: 'Relax PDB', hint: 'Energy-minimize output structures', type: 'toggle', val: relaxPdb, setter: setRelaxPdb },
                                { id: 'save', label: 'Save PDB', hint: 'Write structures to disk', type: 'toggle', val: savePdb, setter: setSavePdb },
                                { id: 'tqdm', label: 'Progress Bar', hint: 'Show tqdm in terminal output', type: 'toggle', val: tqdmBar, setter: setTqdmBar },
                                { id: 'seed', label: 'Fix Random Seed', hint: 'For reproducible results', type: 'toggle', val: fixSeed, setter: setFixSeed }
                            ].map((setting) => (
                                <div key={setting.id} className="bg-white border border-neutral-100/80 p-4 rounded-xl flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-[15px] font-bold text-neutral-900">{setting.label}</div>
                                        <div className="text-[13px] text-neutral-900 font-medium mt-0.5">{setting.hint}</div>
                                    </div>
                                    {setting.type === 'select' ? (
                                        <select
                                            className="w-[160px] bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-[13px] font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                                            value={setting.val as string} onChange={e => (setting.setter as (val: string) => void)(e.target.value)}
                                            disabled={currentModel.disabled}
                                        >
                                            {setting.opts?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                        </select>
                                    ) : (
                                        <label className={cn("relative w-10 h-6 shrink-0", currentModel.disabled ? "opacity-50" : "cursor-pointer")}>
                                            <input type="checkbox" className="peer sr-only" checked={setting.val as boolean} onChange={e => (setting.setter as (val: boolean) => void)(e.target.checked)} disabled={currentModel.disabled} />
                                            <div className="absolute inset-0 bg-neutral-200 rounded-full transition-colors peer-checked:bg-emerald-500" />
                                            <div className="absolute left-[3px] top-[3px] w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                                        </label>
                                    )}
                                </div>
                            ))}

                        </div>

                        {/* Run button & Status */}
                        <div>
                            <Button
                                onClick={handleSubmit}
                                disabled={!pdbFile || isSubmitting || currentModel.disabled}
                                className={cn(
                                    "w-full h-14 text-[15px] font-black tracking-wide uppercase transition-all shadow-lg",
                                    currentModel.disabled ? "bg-neutral-200 text-neutral-400 border-neutral-300 shadow-none cursor-not-allowed hover:bg-neutral-200" : "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 hover:shadow-emerald-500/20"
                                )}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Submitting job...</span>
                                ) : currentModel.disabled ? (
                                    "Coming Soon"
                                ) : (
                                    <span className="flex items-center gap-2">START PIPELINE <ArrowRight className="w-5 h-5" /></span>
                                )}
                            </Button>

                            <div className="mt-4 bg-white border border-neutral-200 rounded-xl px-4 py-3 pb-3.5 flex items-center gap-3">
                                {status.type === "error" ? (
                                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                ) : status.type === "success" ? (
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                    <div className={cn("w-2 h-2 rounded-full shrink-0", status.type === "idle" ? "bg-neutral-300" : "bg-emerald-500 animate-pulse")} />
                                )}
                                <span className={cn("text-[14px] font-bold leading-none mt-0.5", status.type === "error" ? "text-rose-600" : "text-neutral-900")}>
                                    {status.msg}
                                </span>
                                {!pdbFile && status.type === "error" && (
                                    <Button variant="secondary" size="sm" onClick={() => router.push('/app/new')} className="ml-auto h-7 text-[11px] px-3">
                                        Go to Upload
                                    </Button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                <div className={cn(
                    "bg-[#050505] border-l border-[#1A1A1A] flex flex-col transition-all duration-500",
                    isMinimized ? "h-[64px] cursor-pointer" : "lg:min-h-screen",
                    isExpanded ? "w-[90%] fixed right-0 top-[72px] bottom-0 z-[60] shadow-2xl" : "hidden lg:flex lg:w-[500px] lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)]"
                )}
                    onClick={() => isMinimized && setIsMinimized(false)}
                >
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="bg-[#0a0a0a] px-6 py-5 border-b border-neutral-900/40 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="flex gap-1.5 grayscale opacity-60">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPdbFile(null); setFileMeta(null); }}
                                        className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-400 transition-colors cursor-pointer"
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); setIsExpanded(false); }}
                                        className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-400 transition-colors cursor-pointer"
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); setIsMinimized(false); }}
                                        className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors cursor-pointer"
                                    />
                                </div>
                                <span className="font-mono text-[12px] text-white font-bold ml-1">configs/test/{currentModel.file}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest leading-none">Live Sync</span>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                <div className="flex-1 overflow-y-auto p-1 scrollbar-none">
                                    <div className="p-8 font-mono text-[13px] leading-[2.2] relative">
                                        <AnimatePresence mode="popLayout">
                                            <motion.div
                                                key={currentModel.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="text-white italic mb-2"># Foldexa.bio — auto-generated config</div>
                                                <div className="text-white italic mb-8"># Do not edit manually. Use the UI.</div>

                                                {currentModel.disabled && (
                                                    <div className="mb-8">
                                                        <div className="text-white text-[11px] font-black tracking-widest leading-none mb-3">## STATUS</div>
                                                        <div className="flex"><div className="w-36 shrink-0"><VKey>status:</VKey></div><VStr>coming_soon</VStr></div>
                                                        <div className="flex"><div className="w-36 shrink-0"><VKey>message:</VKey></div><VStr>This design mode will be released.</VStr></div>
                                                    </div>
                                                )}

                                                <div className="text-white text-[11px] font-black tracking-widest leading-none mb-3">## PIPELINE</div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>design_mode:</VKey></div><VStr>{currentModel.id}</VStr></div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>config_file:</VKey></div><VStr>configs/test/{currentModel.file}</VStr></div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>pipeline_type:</VKey></div><VStr>diffab_only</VStr></div>

                                                <div className="h-8" />
                                                <div className="text-white text-[11px] font-black tracking-widest leading-none mb-3">## SAMPLING</div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>num_designs:</VKey></div><VNum>{numDesigns}</VNum></div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>sampling_temp:</VKey></div><VNum>{samplingTemp}</VNum></div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>num_diffusion_steps:</VKey></div><VNum>100</VNum></div>

                                                <div className="h-8" />
                                                <div className="text-white text-[11px] font-black tracking-widest leading-none mb-3">## HARDWARE</div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>device:</VKey></div><VStr>{device}</VStr></div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>num_workers:</VKey></div><VNum>4</VNum></div>

                                                <div className="h-8" />
                                                <div className="text-white text-[11px] font-black tracking-widest leading-none mb-3">## OUTPUT</div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>pdb_relax:</VKey></div><VBool val={relaxPdb} /></div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>save_pdb:</VKey></div><VBool val={savePdb} /></div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>output_dir:</VKey></div><VStr>./results/</VStr></div>

                                                <div className="h-8" />
                                                <div className="text-white text-[11px] font-black tracking-widest leading-none mb-3">## LOGGING</div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>tqdm_bar:</VKey></div><VBool val={tqdmBar} /></div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>fix_seed:</VKey></div><VBool val={fixSeed} /></div>
                                                <div className="flex mb-2"><div className="w-44 shrink-0"><VKey>log_level:</VKey></div><VStr>INFO</VStr></div>

                                                {/* Action Button - Follows text immediately */}
                                                <div className="mt-12 pt-8 border-t border-white/5">
                                                    <Button
                                                        variant="secondary"
                                                        className={cn(
                                                            "w-full bg-transparent font-medium transition-all h-10 text-[12px] border-neutral-800 hover:border-neutral-700 hover:bg-white/5",
                                                            copied ? "text-emerald-500 border-emerald-500/30" : "text-neutral-500"
                                                        )}
                                                        onClick={handleCopy}
                                                    >
                                                        {copied ? (
                                                            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Copied to Clipboard</span>
                                                        ) : (
                                                            <span className="flex items-center gap-2"><Copy className="w-4 h-4" /> Copy Config</span>
                                                        )}
                                                    </Button>
                                                </div>
                                                <div className="h-12" />
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>

                            </>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
