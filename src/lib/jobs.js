import { API_URL } from "./api";

const TERMINAL_JOB_STATES = new Set(["completed", "failed"]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isTerminalJobStatus(status) {
  return TERMINAL_JOB_STATES.has(status);
}

export function getJobStatusDetail(job) {
  if (!job) return "";
  if (job.status === "completed") return "Finished successfully.";
  if (job.status === "failed") return job.error || "Job failed.";
  if (job.status === "processing") return "Running in the background.";
  if (job.status === "retry") return "Retry scheduled after a temporary failure.";
  return "Queued and waiting for a worker.";
}

export async function startAsyncJob(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, async: true }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.details || data?.error || `HTTP ${response.status}`);
  }

  if (!data?.job_id) {
    throw new Error("The server did not return a job id.");
  }

  return data;
}

export async function fetchJob(jobId) {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.details || data?.error || `HTTP ${response.status}`);
  }

  return data;
}

export async function waitForJob(jobId, options = {}) {
  const {
    intervalMs = 2500,
    timeoutMs = 5 * 60 * 1000,
    onUpdate,
  } = options;

  const startedAt = Date.now();

  while (true) {
    const job = await fetchJob(jobId);
    onUpdate?.(job);

    if (isTerminalJobStatus(job.status)) {
      return job;
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Job timed out before completion.");
    }

    await sleep(intervalMs);
  }
}
