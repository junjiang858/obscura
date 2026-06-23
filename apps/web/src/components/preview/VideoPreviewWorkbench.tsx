import type { CSSProperties } from "react";
import { formatDuration, type VideoEditState } from "@obscura/media-core";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import type { WorkspaceAsset } from "../../stores/media-store";

export type VideoPreviewStatus = "idle" | "busy" | "ready" | "canceled" | "failed" | "stale";

export function VideoPreviewWorkbench({
  asset,
  currentTime,
  duration,
  isDerivedPreview,
  isLooping,
  isPlaying,
  onCancelPreview,
  onGeneratePreview,
  onLoopToggle,
  onPlayToggle,
  onResetTime,
  onScrub,
  previewMessage,
  previewProgress,
  previewStatus,
  t,
  videoState,
}: {
  asset: WorkspaceAsset;
  currentTime: number;
  duration: number;
  isDerivedPreview: boolean;
  isLooping: boolean;
  isPlaying: boolean;
  onCancelPreview: () => void;
  onGeneratePreview: () => void;
  onLoopToggle: () => void;
  onPlayToggle: () => void;
  onResetTime: () => void;
  onScrub: (time: number) => void;
  previewMessage: string | null;
  previewProgress: number;
  previewStatus: VideoPreviewStatus;
  t: Copy;
  videoState: VideoEditState;
}) {
  const safeDuration = Math.max(0.1, duration);
  const progress = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));
  const scrubberStyle = { "--range-progress": `${progress}%` } as CSSProperties;
  const dimensions =
    asset.width && asset.height ? `${Math.round(asset.width)} x ${Math.round(asset.height)}` : "--";

  return (
    <div className="video-workbench">
      <div className="video-workbench-header">
        <div>
          <span>{`${t.composition} ${dimensions}`}</span>
          <strong>{isDerivedPreview ? t.derivedPreview : t.sourcePreview}</strong>
        </div>
        <div className="video-workbench-badges">
          <span>{videoState.exportFormat.toUpperCase()}</span>
          <span>{`${videoState.speed}x`}</span>
        </div>
      </div>

      <div aria-label={t.previewTools} className="video-workbench-controls" role="toolbar">
        <button
          aria-label={isPlaying ? t.pausePreview : t.playPreview}
          className="icon-button"
          onClick={onPlayToggle}
          type="button"
        >
          <StudioIcon name={isPlaying ? "pause" : "play"} size={20} />
        </button>
        <button
          aria-label={t.resetTime}
          className="icon-button"
          onClick={onResetTime}
          type="button"
        >
          <StudioIcon name="restartAlt" size={19} />
        </button>
        <input
          aria-label={t.videoScrubber}
          className="video-scrubber"
          max={safeDuration}
          min={0}
          onChange={(event) => onScrub(Number(event.currentTarget.value))}
          step={0.01}
          style={scrubberStyle}
          type="range"
          value={Math.min(currentTime, safeDuration)}
        />
        <span className="video-time-readout">{`${formatDuration(currentTime)} / ${formatDuration(
          safeDuration,
        )}`}</span>
        <button
          aria-label={t.loopPlayback}
          aria-pressed={isLooping}
          className={`icon-button ${isLooping ? "is-active" : ""}`}
          onClick={onLoopToggle}
          type="button"
        >
          <StudioIcon name="loop" size={19} />
        </button>
        {previewStatus === "busy" ? (
          <button className="secondary-button" onClick={onCancelPreview} type="button">
            <StudioIcon name="close" size={17} />
            <span>{t.cancelVideoPreview}</span>
          </button>
        ) : null}
        {previewStatus === "failed" ? (
          <button className="secondary-button" onClick={onGeneratePreview} type="button">
            <StudioIcon name="checkCircle" size={17} />
            <span>{t.retryVideoPreview}</span>
          </button>
        ) : null}
      </div>

      {previewStatus === "busy" && previewMessage ? (
        <div className={`job-message ${previewStatus}`}>
          <StudioIcon name="checkCircle" size={17} />
          <span>{previewMessage}</span>
        </div>
      ) : null}
      {previewStatus === "busy" ? (
        <div
          aria-label={t.generatingVideoPreview}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={previewProgress}
          className="job-progress"
          role="progressbar"
        >
          <span style={{ width: `${previewProgress}%` }} />
        </div>
      ) : null}
    </div>
  );
}
