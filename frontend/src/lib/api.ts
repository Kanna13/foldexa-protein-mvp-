import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://foldexa-protein-mvp-production.up.railway.app";

export interface Job {
  job_id: string;
  status:
  | "created"
  | "uploaded"
  | "queued"
  | "provisioning"
  | "running"
  | "post_processing"
  | "completed"
  | "failed"
  | "cancelled";
  created_at: string;
  started_at?: string;
  finished_at?: string;
  execution_time?: number;
  output_s3_key?: string;
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

/** Statuses from which a job will never transition — polling can stop. */
export const TERMINAL_STATUSES = new Set<Job["status"]>([
  "completed",
  "failed",
  "cancelled",
]);

export const api = {
  /** Create a new job with a PDB file or direct FormData (for advanced configs) */
  createJob: async (
    fileOrFormData: File | FormData,
    pipelineType: string = "diffab_rfdiffusion_af2",
    selectedModels: string = "",
  ): Promise<Job> => {
    let formData: FormData;

    if (fileOrFormData instanceof FormData) {
      formData = fileOrFormData;
    } else {
      formData = new FormData();
      formData.append("file", fileOrFormData);
      formData.append("pipeline_type", pipelineType);
      if (selectedModels) {
        formData.append("selected_models", selectedModels);
      }
    }

    const response = await axios.post(`${API_BASE}/api/v1/jobs/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Get job status.
   * Accepts an optional AbortSignal so React Query can cancel the in-flight
   * request when the component unmounts — preventing stale setState calls.
   */
  getJob: async (jobId: string, signal?: AbortSignal): Promise<Job> => {
    const response = await axios.get(`${API_BASE}/api/v1/jobs/${jobId}`, {
      signal,
    });
    return response.data;
  },

  /** Get job results (artifacts & metrics) */
  getJobResults: async (jobId: string, signal?: AbortSignal): Promise<JobResult> => {
    const response = await axios.get(
      `${API_BASE}/api/v1/jobs/${jobId}/results`,
      { signal },
    );
    return response.data;
  },

  /**
   * List all jobs (History).
   * Accepts AbortSignal for proper fetch cancellation.
   */
  listJobs: async (limit: number = 20, signal?: AbortSignal): Promise<Job[]> => {
    const response = await axios.get(`${API_BASE}/api/v1/jobs/`, {
      params: { limit },
      signal,
    });
    return response.data;
  },

  /** Cancel a job */
  cancelJob: async (jobId: string): Promise<void> => {
    await axios.delete(`${API_BASE}/api/v1/jobs/${jobId}`);
  },

  /** Get a presigned download URL for a completed job */
  downloadJobResult: async (jobId: string): Promise<string> => {
    const response = await axios.get(
      `${API_BASE}/api/v1/jobs/${jobId}/download`,
    );
    return response.data.download_url;
  },
};
