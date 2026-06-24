import type { WorkerJob } from "@obscura/shared";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";

const activeStatuses = new Set<WorkerJob["status"]>(["queued", "loading", "processing"]);

export function ProcessingCenter({
  jobs,
  onAcknowledgeCompletedJobs,
  onClearJob,
  onClearCompletedJobs,
  t,
}: {
  jobs: WorkerJob[];
  onAcknowledgeCompletedJobs?: () => void;
  onClearJob?: (jobId: string) => void;
  onClearCompletedJobs?: () => void;
  t: Copy;
}) {
  if (!jobs.length) {
    return null;
  }

  const visibleCount = jobs.length;
  const completedOrCanceledCount = jobs.filter(
    (job) => job.status === "completed" || job.status === "canceled",
  ).length;
  const badge = getProcessingBadge(jobs);

  function handleOpenQueue() {
    onAcknowledgeCompletedJobs?.();
  }

  return (
    <div className="processing-center">
      <button
        aria-label={badge ? `${t.processingQueue} (${badge.count})` : t.processingQueue}
        className="icon-button processing-center-button"
        onClick={handleOpenQueue}
        onFocus={handleOpenQueue}
        onPointerEnter={handleOpenQueue}
        type="button"
      >
        <StudioIcon name="download" size={19} />
        {badge ? (
          <span className={`processing-center-badge processing-center-badge-${badge.tone}`}>
            {badge.count}
          </span>
        ) : null}
      </button>
      <div aria-label={t.backgroundTasks} className="processing-center-popover" role="status">
        <div className="processing-center-header">
          <strong>{t.backgroundTasks}</strong>
          <span>{`${visibleCount} ${t.tasks}`}</span>
          {onClearCompletedJobs && completedOrCanceledCount ? (
            <button
              className="processing-center-clear"
              onClick={onClearCompletedJobs}
              type="button"
            >
              {t.clearCompletedTasks}
            </button>
          ) : null}
        </div>
        <ul className="processing-job-list">
          {jobs.map((job) => (
            <li
              className={`processing-job processing-job-${job.status} ${
                isUnacknowledgedCompletedJob(job) ? "processing-job-unread" : ""
              }`}
              key={job.id}
            >
              <div className="processing-job-icon">
                <StudioIcon
                  name={job.sourceAssetKind === "video" ? "videoFile" : "image"}
                  size={18}
                />
              </div>
              <div className="processing-job-body">
                <div className="processing-job-title-row">
                  <strong>{job.title ?? job.message ?? getFallbackJobTitle(job, t)}</strong>
                  <span>
                    {isUnacknowledgedCompletedJob(job)
                      ? t.newResult
                      : getJobStatusLabel(job.status, t)}
                  </span>
                </div>
                <span className="processing-job-source">{job.sourceAssetName ?? job.id}</span>
                {activeStatuses.has(job.status) ? (
                  <div
                    aria-label={job.message ?? t.processing}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={Math.round(job.progress ?? 0)}
                    className="job-progress"
                    role="progressbar"
                  >
                    <span style={{ width: `${job.progress ?? 0}%` }} />
                  </div>
                ) : null}
                {job.error?.message ? (
                  <span className="processing-job-error">{job.error.message}</span>
                ) : null}
              </div>
              {onClearJob && !activeStatuses.has(job.status) ? (
                <button
                  aria-label={t.clearTask}
                  className="icon-button processing-job-action"
                  onClick={() => onClearJob(job.id)}
                  type="button"
                >
                  <StudioIcon name="close" size={17} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function getProcessingBadge(jobs: WorkerJob[]) {
  const failedCount = jobs.filter((job) => job.status === "failed").length;

  if (failedCount) {
    return { count: failedCount, tone: "failed" as const };
  }

  const activeCount = jobs.filter((job) => activeStatuses.has(job.status)).length;

  if (activeCount) {
    return { count: activeCount, tone: "active" as const };
  }

  const newCompletedCount = jobs.filter(isUnacknowledgedCompletedJob).length;

  if (newCompletedCount) {
    return { count: newCompletedCount, tone: "completed" as const };
  }

  return null;
}

function isUnacknowledgedCompletedJob(job: WorkerJob) {
  return job.status === "completed" && !job.acknowledgedAt;
}

function getJobStatusLabel(status: WorkerJob["status"], t: Copy) {
  switch (status) {
    case "queued":
      return t.jobQueued;
    case "loading":
      return t.jobLoading;
    case "processing":
      return t.jobProcessing;
    case "completed":
      return t.jobCompleted;
    case "canceled":
      return t.jobCanceled;
    case "failed":
      return t.jobFailed;
    case "idle":
    default:
      return t.jobIdle;
  }
}

function getFallbackJobTitle(job: WorkerJob, t: Copy) {
  switch (job.type) {
    case "background-removal":
      return t.backgroundRemover;
    case "image-export":
    case "video-export":
      return t.export;
    case "image-preview":
    case "video-preview":
      return t.preview;
    case "metadata":
    case "thumbnail":
    default:
      return t.processing;
  }
}
