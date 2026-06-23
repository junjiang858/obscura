import type { CSSProperties } from "react";
import { formatDuration, type VideoEditState } from "@obscura/media-core";
import { getVideoExportFormatFromMimeType } from "../../config/media";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import type { WorkspaceAsset } from "../../stores/media-store";

export function VideoPreviewWorkbench({
  asset,
  currentTime,
  duration,
  isLooping,
  isPlaying,
  onLoopToggle,
  onPlayToggle,
  onResetTime,
  onScrub,
  t,
  videoState,
}: {
  asset: WorkspaceAsset;
  currentTime: number;
  duration: number;
  isLooping: boolean;
  isPlaying: boolean;
  onLoopToggle: () => void;
  onPlayToggle: () => void;
  onResetTime: () => void;
  onScrub: (time: number) => void;
  t: Copy;
  videoState: VideoEditState;
}) {
  const safeDuration = Math.max(0.1, duration);
  const progress = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));
  const scrubberStyle = { "--range-progress": `${progress}%` } as CSSProperties;
  const dimensions =
    asset.width && asset.height ? `${Math.round(asset.width)} x ${Math.round(asset.height)}` : "--";
  const sourceFormat = getVideoExportFormatFromMimeType(asset.mimeType).toUpperCase();

  return (
    <div className="video-workbench">
      <div className="video-workbench-header">
        <div>
          <span>{`${t.composition} ${dimensions}`}</span>
        </div>
        <div className="video-workbench-badges">
          <span>{sourceFormat}</span>
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
      </div>
    </div>
  );
}
