"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, Activity, Zap, Layers, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type PipelineModel = {
    id: string;
    name: string;
    description: string;
    timeEstimate: number; // in minutes
    icon: React.ElementType<{ className?: string }>;
    accentClass: string;
};

const MODELS: PipelineModel[] = [
    {
        id: "diffab",
        name: "DiffAb",
        description: "Antibody CDR loop design via diffusion. Generates high-fidelity backbones.",
        timeEstimate: 12,
        icon: Zap,
        accentClass: "text-emerald-500",
    },
    {
        id: "rfdiffusion",
        name: "RFdiffusion",
        description: "Scaffold generation. Fine-tunes structure for functional motifs.",
        timeEstimate: 45,
        icon: Activity,
        accentClass: "text-blue-500",
    },
    {
        id: "alphafold2",
        name: "AlphaFold 2",
        description: "Structure validation & pLDDT scoring. Ensures physical viability.",
        timeEstimate: 30,
        icon: Layers,
        accentClass: "text-purple-500",
    },
];

export default function UploadPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const router = useRouter();

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        // Check extension
        if (!file.name.toLowerCase().endsWith(".pdb")) {
            alert("Only .pdb files are allowed!");
            return;
        }
        setFile(file);
    };

    const loadSampleStructure = () => {
        // Create a fake file for demonstration
        const sampleContent = "HEADER    SAMPLE STRUCTURE\\n";
        const sampleFile = new File([sampleContent], "sample_antibody_6vxx.pdb", { type: "chemical/x-pdb" });
        setFile(sampleFile);
    };

    const toggleModel = (id: string) => {
        setSelectedModels(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const totalTime = useMemo(() => {
        return MODELS
            .filter(m => selectedModels.includes(m.id))
            .reduce((acc, curr) => acc + curr.timeEstimate, 0);
    }, [selectedModels]);

    const canSubmit = file !== null && selectedModels.length > 0;

    const handleUpload = async () => {
        if (!canSubmit || !file) return;
        setUploading(true);

        const hasDiffAb = selectedModels.includes("diffab");
        const hasRF = selectedModels.includes("rfdiffusion");
        const hasAF2 = selectedModels.includes("alphafold2");

        // ── DiffAb-only: redirect to model selection page instead of submitting ──
        if (hasDiffAb && !hasRF && !hasAF2) {
            try {
                // Serialise File → base64 so it survives the page navigation
                const buffer = await file.arrayBuffer();
                const bytes = new Uint8Array(buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                const b64 = btoa(binary);

                sessionStorage.setItem('foldexa_pdb_meta', JSON.stringify({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                }));
                sessionStorage.setItem('foldexa_pdb_data', b64);

                // Navigate to the DiffAb models page
                router.push('/app/diffab-models');
            } catch (err) {
                console.error('Failed to serialise file:', err);
                alert('Could not prepare file for transfer. Please try again.');
                setUploading(false);
            }
            return;
        }

        // ── All other pipeline combos: submit directly ──
        try {
            let pipelineType = "diffab_rfdiffusion_af2"; // Default fallback
            if (!hasDiffAb && hasRF && !hasAF2) pipelineType = "rfdiffusion_only";
            else if (!hasDiffAb && !hasRF && hasAF2) pipelineType = "af2_only";

            const data = await api.createJob(file, pipelineType, selectedModels.join(","));
            router.push(`/app/jobs/${data.job_id}`);
        } catch (error) {
            console.error("Upload error:", error);
            alert(error instanceof Error ? error.message : "Failed to create job");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans relative overflow-x-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none select-none opacity-[0.4]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

                {/* Floating Orbs */}
                <motion.div
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] min-w-[500px] min-h-[500px] rounded-full bg-emerald-100/50 blur-[100px] mix-blend-multiply"
                />
                <motion.div
                    animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] min-w-[600px] min-h-[600px] rounded-full bg-blue-50/50 blur-[120px] mix-blend-multiply"
                />
            </div>

            <Navbar variant="white" className="bg-transparent border-none z-50" />

            <main className="relative z-10 max-w-[1100px] mx-auto px-6 pt-32 pb-24 flex flex-col items-center">

                {/* Hero Section */}
                <div className="text-center max-w-2xl mb-16 space-y-6">
                    {/* Minimal Molecular Visual */}
                    <div className="mx-auto w-24 h-24 relative mb-10 flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border border-neutral-300 rounded-full border-dashed opacity-50"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-3 border border-neutral-200 rounded-full opacity-60"
                        />
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="w-10 h-10 bg-white border border-neutral-200 shadow-sm rounded-full flex items-center justify-center text-neutral-800">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                        {/* Orbiting Particles */}
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 origin-center">
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        </motion.div>
                        <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-3 origin-center">
                            <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.5)]" />
                        </motion.div>
                    </div>

                    <h1 className="text-[40px] md:text-[52px] font-bold tracking-tight text-neutral-900 leading-[1.1]">
                        Design the next generation of proteins
                    </h1>
                    <p className="text-[17px] text-neutral-500 leading-relaxed font-normal max-w-xl mx-auto">
                        Upload a PDB structure and run our AI-powered diffusion models to generate high-fidelity protein designs.
                    </p>
                </div>

                {/* Main Action Area */}
                <div className="w-full grid lg:grid-cols-12 gap-8 items-start">

                    {/* Left: Upload Dropzone */}
                    <div className="lg:col-span-7 flex flex-col items-center w-full">
                        <div className="w-full bg-white/70 backdrop-blur-xl rounded-[24px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-neutral-200/60 p-2 overflow-hidden hover:shadow-[0_4px_40px_rgba(0,0,0,0.05)] transition-shadow">
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={cn(
                                    "relative h-72 rounded-[18px] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300",
                                    isDragging ? "border-emerald-500 bg-emerald-50/30 scale-[0.99]" : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50"
                                )}
                            >
                                <AnimatePresence mode="wait">
                                    {!file ? (
                                        <motion.div
                                            key="empty"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-center p-8 w-full"
                                        >
                                            <div className="w-14 h-14 rounded-[14px] bg-white border border-neutral-100 shadow-sm flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-105">
                                                <Upload className="w-6 h-6 text-neutral-600" />
                                            </div>
                                            <p className="text-[16px] font-medium mb-1.5 text-neutral-900">Drag & drop your PDB file</p>
                                            <p className="text-[13px] text-neutral-400 mb-8 font-normal">or <span className="text-neutral-600 underline cursor-pointer" onClick={() => document.getElementById("file-upload")?.click()}>browse your computer</span></p>
                                            <input
                                                type="file"
                                                accept=".pdb"
                                                className="hidden"
                                                id="file-upload"
                                                onChange={handleFileSelect}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="file"
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.95, opacity: 0 }}
                                            className="flex flex-col items-center gap-5 w-full px-8"
                                        >
                                            <div className="relative">
                                                <div className="w-16 h-16 bg-white border border-neutral-100 shadow-sm rounded-[16px] flex items-center justify-center">
                                                    <FileText className="w-7 h-7 text-neutral-800" />
                                                </div>
                                                <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-0.5 border-2 border-white shadow-sm">
                                                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-mono text-[14px] font-semibold text-neutral-800 tracking-tight">{file.name}</p>
                                                <p className="text-[12px] text-neutral-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-neutral-500 hover:text-red-500 hover:bg-neutral-100 text-[12px] h-8 mt-2"
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            >
                                                Choose another file
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Compute Config UI (Only fully visible when file exists to keep empty state minimal) */}
                            {file && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 border-t border-neutral-100 px-6 py-5">
                                    <Button
                                        variant="primary"
                                        disabled={!canSubmit || uploading}
                                        isLoading={uploading}
                                        onClick={handleUpload}
                                        className="w-full text-[15px] font-medium h-12 rounded-[12px] shadow-sm tracking-wide"
                                    >
                                        {uploading
                                            ? (selectedModels.includes("diffab") && selectedModels.length === 1
                                                ? "Preparing…"
                                                : "Initializing Pipeline...")
                                            : (selectedModels.includes("diffab") && selectedModels.length === 1
                                                ? "Configure pipeline →"
                                                : "Run selected pipelines")}
                                    </Button>
                                    {!canSubmit && (
                                        <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px] text-red-500 font-medium bg-red-50/50 py-1.5 rounded-md">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            <span>Please select at least one AI model</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>

                        {/* Hint Section */}
                        <AnimatePresence>
                            {!file && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 text-center">
                                    <button
                                        onClick={loadSampleStructure}
                                        className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                                    >
                                        Try a sample structure
                                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Pipeline Cards */}
                    <div className="lg:col-span-5 flex flex-col space-y-3">
                        {MODELS.map((model, index) => {
                            const isSelected = selectedModels.includes(model.id);
                            return (
                                <motion.div
                                    key={model.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * (index + 1), duration: 0.4 }}
                                    onClick={() => toggleModel(model.id)}
                                    className={cn(
                                        "group relative flex items-start gap-4 rounded-[16px] p-5 cursor-pointer transition-all duration-300 border bg-white/50 backdrop-blur-md",
                                        isSelected ? "border-neutral-900 shadow-sm ring-1 ring-neutral-900 bg-white" : "border-neutral-200/60 hover:border-neutral-300 hover:bg-white"
                                    )}
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        "w-10 h-10 shrink-0 rounded-[10px] flex items-center justify-center border transition-colors",
                                        isSelected ? "bg-neutral-900 border-neutral-900" : "bg-white border-neutral-100 group-hover:bg-neutral-50"
                                    )}>
                                        <model.icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-neutral-500")} />
                                    </div>

                                    <div className="flex-1 pr-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-[15px] font-semibold text-neutral-900 tracking-tight">{model.name}</h3>
                                        </div>
                                        <p className="text-[13px] text-neutral-500 leading-relaxed mb-3">
                                            {model.description}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 bg-neutral-100/50 w-fit px-2 py-0.5 rounded-md">
                                            <Clock className="w-3 h-3" />
                                            ~{model.timeEstimate}m
                                        </div>
                                    </div>

                                    {/* Selection Toggle Visual */}
                                    <div className="absolute top-5 right-5">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                            isSelected ? "bg-neutral-900 border-neutral-900" : "bg-transparent border-neutral-300"
                                        )}>
                                            {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Total runtime calculation */}
                        {selectedModels.length > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 px-2 flex items-center justify-between text-[13px] font-medium text-neutral-500">
                                <span>Estimated total runtime</span>
                                <span className="text-neutral-900 font-mono">~{totalTime}m</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
