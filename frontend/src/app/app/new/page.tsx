"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, AlertCircle, X, ArrowRight, Activity, Zap, Layers, Clock, AlertTriangle } from "lucide-react";
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
    color: string;
    bg: string;
    accent: string;
};

const MODELS: PipelineModel[] = [
    {
        id: "diffab",
        name: "DiffAb",
        description: "Antibody CDR loop design via diffusion. Generates high-fidelity backbones.",
        timeEstimate: 12,
        icon: Zap,
        color: "text-blue-600",
        bg: "bg-blue-50",
        accent: "border-blue-500 ring-blue-500",
    },
    {
        id: "rfdiffusion",
        name: "RFdiffusion",
        description: "Scaffold generation. Fine-tunes structure for functional motifs.",
        timeEstimate: 45,
        icon: Activity,
        color: "text-purple-600",
        bg: "bg-purple-50",
        accent: "border-purple-500 ring-purple-500",
    },
    {
        id: "alphafold2",
        name: "AlphaFold 2",
        description: "Structure validation & pLDDT scoring. Ensures physical viability.",
        timeEstimate: 30,
        icon: Layers,
        color: "text-orange-600",
        bg: "bg-orange-50",
        accent: "border-orange-500 ring-orange-500",
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
        if (!canSubmit) return;
        setUploading(true);

        try {
            // Map selected models to backend PipelineType
            let pipelineType = "diffab_rfdiffusion_af2"; // Default fallback

            const hasDiffAb = selectedModels.includes("diffab");
            const hasRF = selectedModels.includes("rfdiffusion");
            const hasAF2 = selectedModels.includes("alphafold2");

            if (hasDiffAb && !hasRF && !hasAF2) pipelineType = "diffab_only";
            else if (!hasDiffAb && hasRF && !hasAF2) pipelineType = "rfdiffusion_only";
            else if (!hasDiffAb && !hasRF && hasAF2) pipelineType = "af2_only";
            // For combinations (e.g. DiffAb+RF), we default to FULL_PIPELINE for MVP 
            // as the backend doesn't support partial custom chains yet.


            const data = await api.createJob(file, pipelineType, selectedModels.join(","));
            // Redirect to the real job page
            router.push(`/app/jobs/${data.job_id}`);

        } catch (error) {
            console.error("Upload error:", error);
            alert(error instanceof Error ? error.message : "Failed to create job");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 font-sans">
            {/* Black Navigation Bar */}
            <Navbar variant="contrast" />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 grid lg:grid-cols-2 gap-16 items-start min-h-[80vh]">

                {/* Left: Upload Area */}
                <div className="space-y-8 z-10 lg:sticky lg:top-32">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-white text-emerald-600 text-xs font-mono uppercase tracking-widest shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Advanced Pipeline
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900">Start Folding Job</h1>
                        <p className="text-neutral-500 text-lg max-w-md leading-relaxed">
                            Upload your PDB structure and configure our proprietary generative pipeline steps.
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-neutral-100 p-2 overflow-hidden">
                        {/* Drag Zone */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`
                relative h-72 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300
                ${isDragging ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]" : "border-neutral-200 hover:border-emerald-200 hover:bg-neutral-50"}
              `}
                        >
                            <AnimatePresence mode="wait">
                                {!file ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center p-8"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
                                            <Upload className="w-8 h-8 text-neutral-400" />
                                        </div>
                                        <p className="text-lg font-medium mb-2 text-neutral-900">Drag & Drop PDB file</p>
                                        <p className="text-sm text-neutral-400 mb-8">or click to browse local files</p>
                                        <input
                                            type="file"
                                            accept=".pdb"
                                            className="hidden"
                                            id="file-upload"
                                            onChange={handleFileSelect}
                                        />
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50 text-neutral-700"
                                            onClick={() => document.getElementById("file-upload")?.click()}
                                        >
                                            Browse Files
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="file"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="flex flex-col items-center gap-4 w-full px-8"
                                    >
                                        <div className="relative">
                                            <FileText className="w-16 h-16 text-emerald-500" />
                                            <div className="absolute -top-2 -right-2 bg-emerald-100 rounded-full p-1 border-2 border-white">
                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-mono text-lg font-medium text-neutral-900">{file.name}</p>
                                            <p className="text-sm text-neutral-400">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                        >
                                            Remove File
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Summary / Estimate */}
                        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                                <Clock className="w-4 h-4" />
                                <span>Estimated Runtime:</span>
                            </div>
                            <div className="font-mono font-medium text-neutral-900">
                                {totalTime > 0 ? `~${totalTime} mins` : "--"}
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="p-6">
                            <Button
                                variant="primary"
                                disabled={!canSubmit || uploading}
                                isLoading={uploading}
                                onClick={handleUpload}
                                className="w-full text-lg h-12 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? "Initializing Pipeline..." : "Run Pipeline"}
                            </Button>
                            {!canSubmit && (
                                <p className="text-xs text-center text-red-500 mt-3 font-medium flex items-center justify-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Please upload a file and select at least one model.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Selectable Models */}
                <div className="space-y-6 pt-8 lg:pt-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-emerald-500" />
                            Select Pipeline Models
                        </h2>
                        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
                            {selectedModels.length} Selected
                        </span>
                    </div>

                    {MODELS.map((model, index) => {
                        const isSelected = selectedModels.includes(model.id);
                        return (
                            <motion.div
                                key={model.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * (index + 1) }}
                                onClick={() => toggleModel(model.id)}
                                className={cn(
                                    "group relative rounded-2xl p-6 shadow-sm border cursor-pointer transition-all duration-300 overflow-hidden",
                                    isSelected && "bg-white shadow-md ring-2",
                                    isSelected && model.accent,
                                    !isSelected && "bg-white border-neutral-100 opacity-60 hover:opacity-100 hover:shadow-md"
                                )}
                            >
                                {/* Selection Indicator */}
                                <div className={cn(
                                    "absolute top-6 right-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    isSelected
                                        ? "bg-emerald-500 border-emerald-500 scale-100"
                                        : "border-neutral-200 bg-transparent scale-90"
                                )}>
                                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                </div>

                                <div className="relative z-10 pr-12">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors", model.bg)}>
                                        <model.icon className={cn("w-5 h-5", model.color)} />
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 mb-2 flex items-center gap-2">
                                        {model.name}
                                        {isSelected && <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>}
                                    </h3>
                                    <p className="text-neutral-500 text-sm leading-relaxed mb-4">
                                        {model.description}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs font-mono text-neutral-400">
                                        <Clock className="w-3 h-3" />
                                        +{model.timeEstimate} mins
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
