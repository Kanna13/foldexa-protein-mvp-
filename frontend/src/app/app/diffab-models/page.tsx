"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Copy, Check, ArrowRight, Loader2, AlertCircle, FileCode
} from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type DiffAbModel = {
    id: string;
    name: string;
    badge?: string;
    file: string;
    description: string;
    tags: string[];
    disabled: boolean;
    pipelineType: string;
};

const MODELS: DiffAbModel[] = [
    {
        id: "codesign_single",
        name: "Single CDR Co-Design",
        badge: "DEFAULT",
        file: "codesign_single.yml",
        description: "Co-designs the sequence and structure of one CDR on a fixed antibody scaffold using diffusion.",
        tags: ["sequence", "structure", "single CDR"],
        disabled: false,
        pipelineType: "diffab_only",
    },
    {
        id: "codesign_multicdrs",
        name: "Multi-CDR Co-Design",
        badge: "SOON",
        file: "codesign_multicdrs.yml",
        description: "Simultaneously co-designs sequence and structure across all CDR loops at once.",
        tags: ["sequence", "structure", "multi-CDR"],
        disabled: true,
        pipelineType: "diffab_only",
    },
    {
        id: "abopt_singlecdr",
        name: "Single CDR Optimization",
        badge: "SOON",
        file: "abopt_singlecdr.yml",
        description: "Optimizes the sequence and structure of one CDR loop on an existing antibody.",
        tags: ["optimize", "sequence"],
        disabled: true,
        pipelineType: "diffab_only",
    },
    {
        id: "fixedbb_design",
        name: "Fixed Backbone Design",
        badge: "SOON",
        file: "fixedbb_design.yml",
        description: "Designs sequences on a fixed backbone structure for precise binding control.",
        tags: ["fixed-bb", "sequence"],
        disabled: true,
        pipelineType: "diffab_only",
    },
    {
        id: "denovo_design",
        name: "De Novo Full Design",
        badge: "SOON",
        file: "denovo_design.yml",
        description: "Full de novo antibody design from scratch — generates sequence and backbone simultaneously.",
        tags: ["de novo", "sequence", "structure"],
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
                            <span className="text-[13px] font-black tracking-[0.2em] uppercase text-neutral-900">Select Design Mode</span>
                            <div className="h-px flex-1 mx-6 bg-neutral-200" />
                            <span className="px-4 py-1.5 rounded-full bg-neutral-100/50 text-neutral-500 text-[11px] font-mono font-bold border border-neutral-200 shadow-sm leading-none">
                                {currentModel.file}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3 mb-10">
                            {MODELS.map((model) => {
                                const isActive = selectedMode === model.id;
                                return (
                                    <motion.div
                                        key={model.id}
                                        onClick={() => setSelectedMode(model.id)}
                                        className={cn(
                                            "relative p-5 rounded-2xl flex items-start flex-col sm:flex-row transition-all duration-300 border cursor-pointer",
                                            isActive
                                                ? "bg-white border-neutral-900 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] ring-1 ring-neutral-900"
                                                : "bg-white border-neutral-200 hover:border-neutral-300 opacity-[0.65] hover:opacity-100"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0 pr-8 w-full">
                                            <div className="flex justify-between w-full">
                                                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                                    <span className={cn("font-bold text-[16px] tracking-tight", isActive ? "text-neutral-900" : "text-neutral-700")}>
                                                        {model.name}
                                                    </span>
                                                    {model.badge && (
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-[5px]",
                                                            isActive && model.badge === "DEFAULT" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"
                                                        )}>
                                                            {model.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border flex items-center justify-center transition-all absolute right-5 top-5",
                                                    isActive ? "bg-neutral-900 border-neutral-900" : "border-neutral-300 bg-neutral-50"
                                                )}>
                                                    {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                            </div>
                                            <div className="font-mono text-[11px] text-neutral-400 font-bold mb-3 tracking-wide">
                                                {model.file}
                                            </div>
                                            <p className={cn(
                                                "text-[14px] leading-relaxed mb-4 max-w-[95%]",
                                                isActive ? "text-neutral-700 font-medium" : "text-neutral-500"
                                            )}>
                                                {model.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {model.tags.map((t) => (
                                                    <span key={t} className="text-[11px] font-bold px-3 py-1 rounded-[6px] bg-neutral-100/80 text-neutral-500 uppercase tracking-widest border border-neutral-200/50">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Configuration Options */}
                        <div className="mb-6 flex items-center justify-between">
                            <span className="text-[13px] font-black tracking-[0.2em] uppercase text-neutral-900">02 — Run Parameters</span>
                            <div className="h-px flex-1 ml-6 bg-neutral-200" />
                        </div>

                        <div className="flex flex-col gap-3 mb-10 relative">

                            <AnimatePresence>
                                {currentModel.disabled && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-20 bg-neutral-50/80 backdrop-blur-sm flex items-center justify-center rounded-2xl"
                                    >
                                        <div className="bg-white px-8 py-6 rounded-2xl shadow-lg border border-neutral-200 flex flex-col items-center text-center max-w-sm mx-4">
                                            <h3 className="text-[18px] font-bold text-neutral-900 tracking-tight mb-2">{currentModel.name}</h3>
                                            <p className="text-[14px] text-neutral-500 font-medium leading-relaxed">
                                                This design mode will be natively integrated in a future Foldexa update.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white border border-neutral-200 p-5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:border-neutral-300">
                                    <div>
                                        <div className="text-[14px] font-bold text-neutral-900 tracking-tight">Designs</div>
                                        <div className="text-[12px] text-neutral-500 font-medium mt-0.5">Num. candidates</div>
                                    </div>
                                    <input type="number"
                                        className="w-[80px] bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-[14px] font-mono focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all text-center font-bold text-neutral-900"
                                        value={numDesigns} min={1} max={10000} onChange={e => setNumDesigns(parseInt(e.target.value) || 10)}
                                        disabled={currentModel.disabled}
                                    />
                                </div>

                                <div className="bg-white border border-neutral-200 p-5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:border-neutral-300">
                                    <div>
                                        <div className="text-[14px] font-bold text-neutral-900 tracking-tight">Temperature</div>
                                        <div className="text-[12px] text-neutral-500 font-medium mt-0.5">Diversity control</div>
                                    </div>
                                    <select
                                        className="w-[90px] bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-[14px] font-mono focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all cursor-pointer font-bold text-neutral-900"
                                        value={samplingTemp} onChange={e => setSamplingTemp(parseFloat(e.target.value))}
                                        disabled={currentModel.disabled}
                                    >
                                        <option value={0.1}>0.1</option>
                                        <option value={0.5}>0.5</option>
                                        <option value={1.0}>1.0</option>
                                    </select>
                                </div>
                            </div>

                            {[
                                {
                                    id: 'device', label: 'Compute Device', hint: 'Hardware target for inference', type: 'select', val: device, setter: setDevice,
                                    opts: [{ v: 'cuda', l: 'CUDA' }, { v: 'cpu', l: 'CPU' }, { v: 'mps', l: 'Apple MPS' }]
                                },
                                { id: 'relax', label: 'Relax PDB', hint: 'Energy-minimize output structures', type: 'toggle', val: relaxPdb, setter: setRelaxPdb },
                                { id: 'save', label: 'Save PDB', hint: 'Write structures to disk', type: 'toggle', val: savePdb, setter: setSavePdb },
                                { id: 'tqdm', label: 'Progress Bar', hint: 'Show tqdm in terminal output', type: 'toggle', val: tqdmBar, setter: setTqdmBar },
                                { id: 'seed', label: 'Fix Random Seed', hint: 'For reproducible results', type: 'toggle', val: fixSeed, setter: setFixSeed }
                            ].map((setting) => (
                                <div key={setting.id} className="bg-white border border-neutral-200 p-5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:border-neutral-300">
                                    <div>
                                        <div className="text-[14px] font-bold text-neutral-900 tracking-tight">{setting.label}</div>
                                        <div className="text-[12px] text-neutral-500 font-medium mt-0.5">{setting.hint}</div>
                                    </div>
                                    {setting.type === 'select' ? (
                                        <select
                                            className="w-[120px] bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-[14px] font-mono focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all cursor-pointer font-bold text-neutral-900"
                                            value={setting.val as string} onChange={e => (setting.setter as (val: string) => void)(e.target.value)}
                                            disabled={currentModel.disabled}
                                        >
                                            {setting.opts?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                        </select>
                                    ) : (
                                        <label className={cn("relative w-10 h-6 shrink-0", currentModel.disabled ? "opacity-50" : "cursor-pointer")}>
                                            <input type="checkbox" className="peer sr-only" checked={setting.val as boolean} onChange={e => (setting.setter as (val: boolean) => void)(e.target.checked)} disabled={currentModel.disabled} />
                                            <div className="absolute inset-0 bg-neutral-200 rounded-full transition-colors peer-checked:bg-neutral-900" />
                                            <div className="absolute left-[3px] top-[3px] w-4.5 h-4.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-transform peer-checked:translate-x-4" />
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
                                    "w-full h-14 text-[13px] font-black tracking-[0.15em] uppercase transition-all shadow-md rounded-2xl",
                                    currentModel.disabled ? "bg-neutral-100 text-neutral-400 border border-neutral-200 shadow-none cursor-not-allowed hover:bg-neutral-100" : "bg-neutral-900 border border-neutral-900 text-white hover:bg-black hover:shadow-xl hover:shadow-neutral-900/20"
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
                                    <Check className="w-4 h-4 text-neutral-900 shrink-0" />
                                ) : (
                                    <div className={cn("w-2 h-2 rounded-full shrink-0", status.type === "idle" ? "bg-neutral-300" : "bg-neutral-900 animate-pulse")} />
                                )}
                                <span className={cn("text-[13px] font-bold leading-none mt-0.5 tracking-tight", status.type === "error" ? "text-rose-600" : "text-neutral-900")}>
                                    {status.msg}
                                </span>
                                {!pdbFile && status.type === "error" && (
                                    <Button variant="secondary" size="sm" onClick={() => router.push('/app/new')} className="ml-auto h-7 text-[11px] px-3 font-semibold transition-all">
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
        </div>
    );
}
