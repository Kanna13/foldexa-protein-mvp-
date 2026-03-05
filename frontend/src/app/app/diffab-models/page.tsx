"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Dna, Network, FlaskConical, Grid, Sparkles,
    Copy, Check, ArrowRight, Loader2, AlertCircle
} from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
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
        badgeClass: "bg-emerald-50 text-emerald-600 border border-emerald-100",
        file: "codesign_single.yml",
        description: "Co-designs the sequence and structure of one CDR on a fixed antibody scaffold using diffusion.",
        tags: [
            { label: "sequence", colorClass: "text-emerald-600", bgClass: "bg-emerald-50 border border-emerald-100/50" },
            { label: "structure", colorClass: "text-blue-500", bgClass: "bg-blue-50 border border-blue-100/50" },
            { label: "single CDR", colorClass: "text-neutral-500", bgClass: "bg-neutral-100 border border-neutral-200/50" },
        ],
        icon: Dna,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        disabled: false,
        pipelineType: "diffab_only",
    },
    {
        id: "codesign_multicdrs",
        name: "Multi-CDR Co-Design",
        badge: "SOON",
        badgeClass: "bg-neutral-100 text-neutral-400 font-medium",
        file: "codesign_multicdrs.yml",
        description: "Simultaneously co-designs sequence and structure across all CDR loops at once.",
        tags: [
            { label: "sequence", colorClass: "text-neutral-400", bgClass: "bg-neutral-100/60" },
            { label: "structure", colorClass: "text-neutral-400", bgClass: "bg-neutral-100/60" },
            { label: "multi-CDR", colorClass: "text-neutral-400", bgClass: "bg-neutral-100/60" },
        ],
        icon: Network,
        iconBg: "bg-blue-50/30",
        iconColor: "text-blue-400/70",
        disabled: true,
        pipelineType: "diffab_only",
    },
    {
        id: "abopt_singlecdr",
        name: "Single CDR Optimization",
        badge: "SOON",
        badgeClass: "bg-neutral-100 text-neutral-400 font-medium",
        file: "abopt_singlecdr.yml",
        description: "Optimizes the sequence and structure of one CDR loop on an existing antibody.",
        tags: [
            { label: "optimize", colorClass: "text-neutral-400", bgClass: "bg-neutral-100/60" },
            { label: "sequence", colorClass: "text-neutral-400", bgClass: "bg-neutral-100/60" },
        ],
        icon: FlaskConical,
        iconBg: "bg-amber-50/30",
        iconColor: "text-amber-400/70",
        disabled: true,
        pipelineType: "diffab_only",
    },
    {
        id: "fixedbb_design",
        name: "Fixed Backbone Design",
        badge: "SOON",
        badgeClass: "bg-neutral-100 text-neutral-400 font-medium",
        file: "fixedbb_design.yml",
        description: "Designs sequences on a fixed backbone structure for precise binding control.",
        tags: [
            { label: "fixed-bb", colorClass: "text-neutral-400", bgClass: "bg-neutral-100/60" },
            { label: "sequence", colorClass: "text-neutral-400", bgClass: "bg-neutral-100/60" },
        ],
        icon: Grid,
        iconBg: "bg-purple-50/30",
        iconColor: "text-purple-400/70",
        disabled: true,
        pipelineType: "diffab_only",
    },
    {
        id: "denovo_design",
        name: "De Novo Full Design",
        badge: "SOON",
        badgeClass: "bg-neutral-100 text-neutral-400 font-medium",
        file: "denovo_design.yml",
        description: "Full de novo antibody design from scratch — generates sequence and backbone simultaneously.",
        tags: [
            { label: "de novo", colorClass: "text-neutral-400", bgClass: "bg-neutral-100/60" },
            { label: "sequence", colorClass: "text-neutral-400", bgClass: "bg-neutral-100/60" },
            { label: "structure", colorClass: "text-neutral-400", bgClass: "bg-neutral-100/60" },
        ],
        icon: Sparkles,
        iconBg: "bg-rose-50/30",
        iconColor: "text-rose-400/70",
        disabled: true,
        pipelineType: "diffab_only",
    },
];

// Syntax highlighting helpers for config panel
const VKey = ({ children }: { children: React.ReactNode }) => <span className="text-neutral-400">{children}</span>;
const VStr = ({ children }: { children: React.ReactNode }) => <span className="text-amber-400">&quot;{children}&quot;</span>;
const VNum = ({ children }: { children: React.ReactNode }) => <span className="text-emerald-400">{children}</span>;
const VBool = ({ val }: { val: boolean }) => <span className={val ? "text-emerald-400" : "text-rose-400"}>{val ? "true" : "false"}</span>;

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
                router.push(`/app/jobs/${data.job_id}`);
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
        <div className="min-h-screen flex flex-col bg-[#FDFDFD] text-neutral-900 font-sans">
            <Navbar variant="contrast" />

            {/* Main split view */}
            <div className="flex-1 grid lg:grid-cols-[1fr_420px] items-stretch">

                {/* Left column: Setup */}
                <div className="bg-neutral-50 p-8 lg:p-12 overflow-y-auto min-h-[calc(100vh-64px)]">
                    <div className="max-w-3xl mx-auto">

                        {/* Context Badge */}
                        <div className="flex items-center gap-3 bg-white border border-neutral-200 shadow-sm rounded-xl px-4 py-2 w-fit mb-8 font-mono text-xs">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-semibold text-neutral-700">{fileMeta ? fileMeta.name : "no file loaded"}</span>
                            <span className="text-neutral-300">•</span>
                            <span className="text-neutral-500">{fileMeta ? (fileMeta.size / 1024).toFixed(1) + " KB" : "—"}</span>
                        </div>

                        <div className="mb-10">
                            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-emerald-600 mb-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                DiffAb Pipeline
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-3">
                                DiffAb <span className="text-emerald-600">Models.</span>
                            </h1>
                            <p className="text-neutral-500 text-[15px] leading-relaxed max-w-lg">
                                Configure and launch antibody design models powered by DiffAb.
                            </p>
                        </div>

                        {/* Models list */}
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-neutral-400">01 — Design Mode</span>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/50 text-emerald-600 text-[10px] font-mono font-semibold">
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
                                            <div className="font-mono text-[11px] text-neutral-400 mb-2">
                                                {model.file}
                                            </div>
                                            <p className="text-neutral-500 text-[13px] leading-relaxed mb-3 pr-4">
                                                {model.description}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {model.tags.map(t => (
                                                    <span key={t.label} className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md", t.colorClass, t.bgClass)}>
                                                        {t.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "absolute right-4 top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all",
                                            isActive ? "bg-emerald-500 border-emerald-500" : "border-neutral-300 bg-neutral-50"
                                        )}>
                                            {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Configuration Options */}
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-neutral-400">02 — Run Parameters</span>
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
                                            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                                                <Network className="w-6 h-6 text-neutral-400" />
                                            </div>
                                            <h3 className="text-[17px] font-bold text-neutral-900 mb-1.5">{currentModel.name}</h3>
                                            <p className="text-[13px] text-neutral-500 leading-relaxed mb-1">
                                                This design mode will be released in a future Foldexa update.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white border border-neutral-100/80 p-4 rounded-xl flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-[13px] font-bold text-neutral-900">Designs</div>
                                        <div className="text-[11px] text-neutral-400 mt-0.5">Num. candidates</div>
                                    </div>
                                    <input type="number"
                                        className="w-[100px] bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-[13px] font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                        value={numDesigns} min={1} max={500} onChange={e => setNumDesigns(parseInt(e.target.value) || 10)}
                                        disabled={currentModel.disabled}
                                    />
                                </div>

                                <div className="bg-white border border-neutral-100/80 p-4 rounded-xl flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-[13px] font-bold text-neutral-900">Temperature</div>
                                        <div className="text-[11px] text-neutral-400 mt-0.5">Diversity control</div>
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
                                        <div className="text-[13px] font-bold text-neutral-900">{setting.label}</div>
                                        <div className="text-[11px] text-neutral-400 mt-0.5">{setting.hint}</div>
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
                                <span className={cn("text-[12px] font-medium leading-none mt-0.5", status.type === "error" ? "text-rose-600" : "text-neutral-500")}>
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

                {/* Right column: Config Preview */}
                <div className="bg-[#0A0A0A] border-l border-[#1A1A1A] flex flex-col h-full sticky top-[64px]">

                    <div className="p-6 border-b border-[#1A1A1A]">
                        <div className="flex justify-between items-center mb-1.5">
                            <h2 className="text-[11px] font-bold tracking-[1.5px] uppercase text-neutral-500">Configuration File</h2>
                            <span className="font-mono text-[12px] text-emerald-500">{currentModel.file}</span>
                        </div>
                        <p className="text-[12px] text-neutral-600">Live preview — updates automatically</p>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
                        <div className="flex items-center gap-1.5 px-4 py-3 bg-[#111] border-b border-[#1A1A1A]">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                            <span className="font-mono text-[11px] text-neutral-500 ml-2">configs/test/{currentModel.file}</span>
                        </div>

                        <div className="p-6 font-mono text-[13px] leading-[2] relative">
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    key={currentModel.id + numDesigns + samplingTemp + device + relaxPdb + savePdb + tqdmBar + fixSeed}
                                    initial={{ opacity: 0, filter: "blur(2px)", y: 2 }}
                                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="text-neutral-600"># Foldexa.bio — auto-generated config</div>
                                    <div className="text-neutral-600"># Do not edit manually. Use the UI.</div>

                                    {currentModel.disabled && (
                                        <>
                                            <div className="h-4"></div>
                                            <div className="text-neutral-500 text-[11px] tracking-wider">## STATUS</div>
                                            <div className="flex"><div className="w-32"><VKey>status:</VKey></div><VStr>coming_soon</VStr></div>
                                            <div className="flex"><div className="w-32"><VKey>message:</VKey></div><VStr>This design mode will be released.</VStr></div>
                                        </>
                                    )}

                                    <div className="h-4"></div>
                                    <div className="text-neutral-500 text-[11px] tracking-wider">## PIPELINE</div>
                                    <div className="flex"><div className="w-48"><VKey>design_mode:</VKey></div><VStr>{currentModel.id}</VStr></div>
                                    <div className="flex"><div className="w-48"><VKey>config_file:</VKey></div><VStr>configs/test/{currentModel.file}</VStr></div>
                                    <div className="flex"><div className="w-48"><VKey>pipeline_type:</VKey></div><VStr>diffab_only</VStr></div>

                                    <div className="h-4"></div>
                                    <div className="text-neutral-500 text-[11px] tracking-wider">## SAMPLING</div>
                                    <div className="flex"><div className="w-48"><VKey>num_designs:</VKey></div><VNum>{numDesigns}</VNum></div>
                                    <div className="flex"><div className="w-48"><VKey>sampling_temp:</VKey></div><VNum>{samplingTemp}</VNum></div>
                                    <div className="flex"><div className="w-48"><VKey>num_diffusion_steps:</VKey></div><VNum>100</VNum></div>

                                    <div className="h-4"></div>
                                    <div className="text-neutral-500 text-[11px] tracking-wider">## HARDWARE</div>
                                    <div className="flex"><div className="w-48"><VKey>device:</VKey></div><VStr>{device}</VStr></div>
                                    <div className="flex"><div className="w-48"><VKey>num_workers:</VKey></div><VNum>4</VNum></div>

                                    <div className="h-4"></div>
                                    <div className="text-neutral-500 text-[11px] tracking-wider">## OUTPUT</div>
                                    <div className="flex"><div className="w-48"><VKey>pdb_relax:</VKey></div><VBool val={relaxPdb} /></div>
                                    <div className="flex"><div className="w-48"><VKey>save_pdb:</VKey></div><VBool val={savePdb} /></div>
                                    <div className="flex"><div className="w-48"><VKey>output_dir:</VKey></div><VStr>./results/</VStr></div>

                                    <div className="h-4"></div>
                                    <div className="text-neutral-500 text-[11px] tracking-wider">## LOGGING</div>
                                    <div className="flex"><div className="w-48"><VKey>tqdm_bar:</VKey></div><VBool val={tqdmBar} /></div>
                                    <div className="flex"><div className="w-48"><VKey>fix_seed:</VKey></div><VBool val={fixSeed} /></div>
                                    <div className="flex"><div className="w-48"><VKey>log_level:</VKey></div><VStr>INFO</VStr></div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="p-4 border-t border-[#1A1A1A] bg-[#0A0A0A]">
                        <Button
                            variant="secondary"
                            className={cn(
                                "w-full bg-transparent font-medium transition-all h-10 text-[13px] border-[#2A2A2A] hover:bg-[#111] hover:text-white hover:border-[#444]",
                                copied ? "text-emerald-500 border-emerald-500/30 hover:bg-transparent hover:text-emerald-500" : "text-neutral-400"
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

                </div>

            </div>

        </div>
    );
}
