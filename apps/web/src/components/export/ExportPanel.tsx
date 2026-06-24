import { useEffect, useRef, useState } from "react";
import type { ImageEditState, ImageExportFormat, VideoEditState } from "@obscura/media-core";
import { imageExportFormats, type ImageExportSettings } from "../../config/media";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import { useJobStore } from "../../stores/job-store";
import type { WorkspaceAsset } from "../../stores/media-store";
import { showStudioError, showStudioInfo, showStudioSuccess } from "../studio/studio-toast";
import type { GeneratedPreview } from "../../utils/generated-preview";
import {
  exportEditedImage,
  getImageExportAvailability,
  getExportErrorMessage,
  isAbortError,
  saveImageExport,
  type ImageExportAvailability,
  type ImageExportResult,
} from "../../utils/image-export";
import {
  exportEditedVideo,
  getVideoExportErrorMessage,
  saveVideoExport,
  type VideoExportResult,
} from "../../utils/video-export";

type ExportStatus = "idle" | "busy" | "ready" | "saved" | "canceled" | "failed";

export function ExportPanel({
  currentPreviewFingerprint,
  generatedPreview,
  imageExportSettings,
  imageState,
  onGeneratedResult,
  selectedAsset,
  t,
  videoState,
}: {
  currentPreviewFingerprint: string | null;
  generatedPreview: GeneratedPreview | null;
  imageExportSettings: ImageExportSettings | null;
  imageState: ImageEditState | null;
  onGeneratedResult: (payload: {
    jobId: string;
    result: ImageExportResult | VideoExportResult;
    sourceAssetId: string;
  }) => void;
  selectedAsset: WorkspaceAsset | null;
  t: Copy;
  videoState: VideoEditState | null;
}) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImageExportResult | VideoExportResult | null>(null);
  const [activeExportJobId, setActiveExportJobId] = useState<string | null>(null);
  const [imageAvailability, setImageAvailability] = useState<
    Partial<Record<ImageExportFormat, ImageExportAvailability>>
  >({});
  const launchSequenceRef = useRef(0);
  const jobs = useJobStore((state) => state.jobs);
  const queueJob = useJobStore((state) => state.queueJob);
  const updateJob = useJobStore((state) => state.updateJob);
  const failJob = useJobStore((state) => state.failJob);
  const activeImageAvailability =
    selectedAsset?.kind === "image" && imageExportSettings
      ? imageAvailability[imageExportSettings.format]
      : null;
  const imageFormatUnavailable = activeImageAvailability
    ? !activeImageAvailability.available
    : false;
  const canExportImage =
    selectedAsset?.kind === "image" &&
    selectedAsset.status === "ready" &&
    Boolean(imageState) &&
    Boolean(imageExportSettings) &&
    !imageFormatUnavailable;
  const canExportVideo =
    selectedAsset?.kind === "video" && selectedAsset.status === "ready" && Boolean(videoState);
  const canExport = canExportImage || canExportVideo;
  const activeExportJob = activeExportJobId ? (jobs[activeExportJobId] ?? null) : null;
  const matchingGeneratedPreview =
    generatedPreview &&
    selectedAsset &&
    generatedPreview.assetId === selectedAsset.id &&
    generatedPreview.kind === selectedAsset.kind &&
    generatedPreview.fingerprint === currentPreviewFingerprint
      ? generatedPreview
      : null;
  const jobStatus = activeExportJob?.status ?? status;
  const jobMessage =
    status === "saved" || status === "canceled" || status === "failed"
      ? message
      : (activeExportJob?.error?.message ?? activeExportJob?.message ?? message);

  useEffect(() => {
    return () => {
      if (result) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [result]);

  useEffect(() => {
    let canceled = false;

    if (selectedAsset?.kind !== "image") {
      return undefined;
    }

    void getImageExportAvailability(imageExportFormats, t).then((availability) => {
      if (canceled) {
        return;
      }

      setImageAvailability(availability);
    });

    return () => {
      canceled = true;
    };
  }, [selectedAsset?.kind, t]);

  async function handleExport() {
    if (!selectedAsset) {
      return;
    }

    if (selectedAsset.kind === "video") {
      await handleVideoExport(selectedAsset);
      return;
    }

    if (!imageState || !imageExportSettings) {
      setStatus("failed");
      setMessage(t.imageExportFailed);
      showStudioError(t.imageExportFailed);
      return;
    }

    if (activeImageAvailability && !activeImageAvailability.available) {
      setStatus("failed");
      const unavailableMessage = activeImageAvailability.reason ?? t.imageExportFormatUnsupported;
      setMessage(unavailableMessage);
      showStudioError(unavailableMessage);
      return;
    }

    setStatus("busy");
    setMessage(t.preparingImageExport);
    const imageJobId = getNextLaunchId(`image-export:${selectedAsset.id}`);
    setActiveExportJobId(imageJobId);
    queueJob(imageJobId, "image-export", t.preparingImageExport, {
      fingerprint: currentPreviewFingerprint ?? `${selectedAsset.id}:image-export`,
      inputSnapshot: {
        format: imageExportSettings.format,
        quality: imageExportSettings.quality,
      },
      launchId: imageJobId,
      sourceAssetId: selectedAsset.id,
      sourceAssetKind: "image",
      sourceAssetName: selectedAsset.name,
      title: getFormatTaskTitle(t.imageExportTask, imageExportSettings.format),
    });

    try {
      const nextResult =
        matchingGeneratedPreview?.kind === "image"
          ? matchingGeneratedPreview
          : await exportEditedImage({
              asset: selectedAsset,
              format: imageExportSettings.format,
              quality: imageExportSettings.quality,
              state: imageState,
              t,
            });

      if (result && result.url !== nextResult.url) {
        URL.revokeObjectURL(result.url);
      }

      setResult(matchingGeneratedPreview?.kind === "image" ? null : nextResult);
      onGeneratedResult({
        jobId: imageJobId,
        result: nextResult,
        sourceAssetId: selectedAsset.id,
      });
      setStatus("ready");
      setMessage(t.downloadReady);
      await saveImageExport(nextResult, imageExportSettings.format);
      setStatus("saved");
      setMessage(null);
      showStudioSuccess(t.exportSaved);
    } catch (error) {
      if (isAbortError(error)) {
        setStatus("canceled");
        setMessage(null);
        showStudioInfo(t.exportCanceled);
        return;
      }

      const errorMessage = getExportErrorMessage(error, t);
      failJob(imageJobId, {
        code: "image-export-failed",
        message: errorMessage,
        recoverable: true,
      });
      setStatus("failed");
      setMessage(errorMessage);
      showStudioError(errorMessage);
    }
  }

  async function handleVideoExport(asset: WorkspaceAsset) {
    if (!videoState) {
      setStatus("failed");
      setMessage(t.videoExportNext);
      showStudioError(t.videoExportNext);
      return;
    }

    setStatus("busy");
    setMessage(t.videoExportNext);
    const videoJobId = getNextLaunchId(`video-export:${asset.id}`);
    setActiveExportJobId(videoJobId);
    queueJob(videoJobId, "video-export", t.videoExportNext, {
      fingerprint: currentPreviewFingerprint ?? `${asset.id}:video-export`,
      inputSnapshot: {
        exportFormat: videoState.exportFormat,
        speed: videoState.speed,
        subtitleCount: videoState.subtitles.length,
        trimEnd: videoState.trimEnd,
        trimStart: videoState.trimStart,
      },
      launchId: videoJobId,
      sourceAssetId: asset.id,
      sourceAssetKind: "video",
      sourceAssetName: asset.name,
      title: getFormatTaskTitle(t.videoExportTask, videoState.exportFormat),
    });

    try {
      const nextResult =
        matchingGeneratedPreview?.kind === "video"
          ? matchingGeneratedPreview
          : await exportEditedVideo({
              onProgress: (update) => updateJob(videoJobId, update),
              source: asset.file,
              state: videoState,
            });

      if (result && result.url !== nextResult.url) {
        URL.revokeObjectURL(result.url);
      }

      setResult(matchingGeneratedPreview?.kind === "video" ? null : nextResult);
      onGeneratedResult({
        jobId: videoJobId,
        result: nextResult,
        sourceAssetId: asset.id,
      });
      setStatus("ready");
      setMessage(t.downloadReady);
      await saveVideoExport(nextResult);
      setStatus("saved");
      setMessage(null);
      showStudioSuccess(t.exportSaved);
    } catch (error) {
      if (isAbortError(error)) {
        setStatus("canceled");
        setMessage(null);
        showStudioInfo(t.exportCanceled);
        return;
      }

      const errorMessage = getVideoExportErrorMessage(error, t.videoExportNext);
      failJob(videoJobId, {
        code: "video-export-failed",
        message: errorMessage,
        recoverable: true,
      });
      setStatus("failed");
      setMessage(errorMessage);
      showStudioError(errorMessage);
    }
  }

  function getNextLaunchId(jobId: string) {
    launchSequenceRef.current += 1;
    return `${jobId}:${launchSequenceRef.current}`;
  }

  return (
    <div className="export-panel-content">
      <button
        className="primary-button full-width"
        disabled={!canExport || status === "busy"}
        onClick={() => void handleExport()}
        type="button"
      >
        <StudioIcon name="download" size={20} />
        <span>
          {status === "busy"
            ? t.prepareExport
            : status === "failed"
              ? t.retryExport
              : t.exportCurrentAsset}
        </span>
      </button>
      {jobMessage ? (
        <div className={`job-message ${jobStatus}`}>
          <StudioIcon name={jobStatus === "failed" ? "warning" : "checkCircle"} size={17} />
          <span>{jobMessage}</span>
        </div>
      ) : null}
      {activeExportJob?.status === "loading" || activeExportJob?.status === "processing" ? (
        <div
          aria-label={activeExportJob.message ?? t.videoExportNext}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(activeExportJob.progress ?? 0)}
          className="job-progress"
          role="progressbar"
        >
          <span style={{ width: `${activeExportJob.progress ?? 0}%` }} />
        </div>
      ) : null}
      {result && status === "ready" ? (
        <a className="download-link" download={result.filename} href={result.url}>
          {`${t.download} ${result.filename}`}
        </a>
      ) : null}
    </div>
  );
}

function getFormatTaskTitle(template: string, format: string) {
  return template.replace("{format}", format.toUpperCase());
}
