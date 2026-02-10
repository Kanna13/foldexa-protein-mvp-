import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Job {
    job_id: string;
    status: "created" | "uploaded" | "queued" | "provisioning" | "running" | "post_processing" | "completed" | "failed" | "cancelled";
    created_at: string;
    started_at?: string;
    finished_at?: string;
    error_message?: string;
    pipeline_type?: string;
}

export interface Artifact {
    id: string;
    artifact_type: string;
    s3_key: string;
    size_bytes: number;
    download_url?: string;
}

export interface Metric {
    metric_name: string;
    metric_value: number;
}

export interface JobResult {
    job_id: string;
    status: string;
    artifacts: Artifact[];
    metrics: Metric[];
}

export const api = {
    /** Create a new job with a PDB file */
    createJob: async (file: File, pipelineType: string = "diffab_rfdiffusion_af2", selectedModels: string = ""): Promise<Job> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pipeline_type", pipelineType);
        if (selectedModels) {
            formData.append("selected_models", selectedModels);
        }

        const response = await axios.post(`${API_BASE}/jobs/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    /** Get job status */
    getJob: async (jobId: string): Promise<Job> => {
        const response = await axios.get(`${API_BASE}/jobs/${jobId}`);
        return response.data;
    },

    /** Get job results (artifacts & metrics) */
    getJobResults: async (jobId: string): Promise<JobResult> => {
        const response = await axios.get(`${API_BASE}/jobs/${jobId}/results`);
        return response.data;
    },

    /** List all jobs (History) */
    listJobs: async (limit: number = 20): Promise<Job[]> => {
        const response = await axios.get(`${API_BASE}/jobs/`, { params: { limit } });
        return response.data;
    },

    /** Cancel a job */
    cancelJob: async (jobId: string): Promise<void> => {
        await axios.delete(`${API_BASE}/jobs/${jobId}`);
    }
};
