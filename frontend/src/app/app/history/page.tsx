"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { api, Job } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Activity, Clock, FileText, CheckCircle, XCircle, PlayCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export default function HistoryPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await api.listJobs();
                setJobs(data);
            } catch (err) {
                console.error("Failed to load history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "text-emerald-600 bg-emerald-50 border-emerald-100";
            case "failed": return "text-red-600 bg-red-50 border-red-100";
            case "running": return "text-blue-600 bg-blue-50 border-blue-100";
            default: return "text-neutral-600 bg-neutral-50 border-neutral-100";
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 font-sans">
            <Navbar variant="contrast" />

            <main className="max-w-5xl mx-auto px-6 py-28">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Job History</h1>
                        <p className="text-neutral-500 mt-1">Recent protein analysis pipelines.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl">
                        <p className="text-neutral-400">No jobs found.</p>
                        <Link href="/app/new" className="text-emerald-600 font-medium hover:underline mt-2 inline-block">Start a new analysis</Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {jobs.map((job) => (
                            <motion.div
                                key={job.job_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", getStatusColor(job.status))}>
                                        {job.status === "completed" ? <CheckCircle className="w-5 h-5" /> :
                                            job.status === "failed" ? <XCircle className="w-5 h-5" /> :
                                                job.status === "running" ? <Activity className="w-5 h-5 animate-pulse" /> :
                                                    <Clock className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-mono text-sm font-bold text-neutral-900">{job.job_id.slice(0, 8)}...</p>
                                        <p className="text-xs text-neutral-500 mt-0.5 capitalize">{job.pipeline_type?.replace(/_/g, " ") || "Unknown Pipeline"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="hidden md:block text-right">
                                        <p className="text-xs text-neutral-400 uppercase tracking-widest">Date</p>
                                        <p className="text-sm text-neutral-700">{new Date(job.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="hidden md:block text-right">
                                        <p className="text-xs text-neutral-400 uppercase tracking-widest">Status</p>
                                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full capitalize", getStatusColor(job.status))}>
                                            {job.status}
                                        </span>
                                    </div>

                                    <Link href={job.status === "completed" ? `/app/results/${job.job_id}` : `/app/jobs/${job.job_id}`}>
                                        <Button variant="ghost" size="sm" className="bg-neutral-50 hover:bg-neutral-100 text-neutral-600">
                                            Details <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
