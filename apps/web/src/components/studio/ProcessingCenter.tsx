import type { WorkerJob } from "@obscura/shared";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";

const activeStatuses = new Set<WorkerJob["status"]>(["queued", "loading", "processing"]);

export function ProcessingCenter({
  jobs,
  onClearJob,
  t,
}: {
  jobs: WorkerJob[];
  onClearJob?: (jobId: string) => void;
  t: Copy;
}) {
  if (!jobs.length) {
    return null;
  }

  const visibleCount = jobs.length;

  return (
    <div className="processing-center">
      <button
        aria-label={`${t.processingQueue} (${visibleCount})`}
        className="icon-button processing-center-button"
        type="button"
      >
        <StudioIcon name="download" size={19} />
        <span className="processing-center-badge">{visibleCount}</span>
      </button>
      <div aria-label={t.backgroundTasks} className="processing-center-popover" role="status">
        <div className="processing-center-header">
          <strong>{t.backgroundTasks}</strong>
          <span>{`${visibleCount} ${t.tasks}`}</span>
        </div>
        <ul className="processing-job-list">
          {jobs.map((job) => (
            <li className={`processing-job processing-job-${job.status}`} key={job.id}>
              <div className="processing-job-icon">
                <StudioIcon
                  name={job.sourceAssetKind === "video" ? "videoFile" : "image"}
                  size={18}
                />
              </div>
              <div className="processing-job-body">
                <div className="processing-job-title-row">
                  <strong>{job.title ?? job.message ?? getFallbackJobTitle(job, t)}</strong>
                  <span>{getJobStatusLabel(job.status, t)}</span>
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
