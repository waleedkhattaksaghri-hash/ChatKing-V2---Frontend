import { getJobStatusDetail, startAsyncJob, waitForJob } from "./jobs";

function toNotice(title, job) {
  return {
    title,
    status: job.status || "pending",
    detail: getJobStatusDetail(job),
    jobId: job.id || job.job_id,
  };
}

export async function runBackgroundJobFlow({
  title,
  path,
  body,
  setNotice,
  onComplete,
  intervalMs,
  timeoutMs,
}) {
  const queuedJob = await startAsyncJob(path, body);
  setNotice?.(toNotice(title, queuedJob));

  const finalJob = await waitForJob(queuedJob.job_id, {
    intervalMs,
    timeoutMs,
    onUpdate: (job) => setNotice?.(toNotice(title, job)),
  });

  if (finalJob.status !== "completed") {
    throw new Error(finalJob.error || `${title} failed.`);
  }

  await onComplete?.(finalJob);
  setNotice?.(toNotice(title, finalJob));

  return finalJob;
}
