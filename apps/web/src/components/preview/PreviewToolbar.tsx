import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";

export function PreviewToolbar({
  compareOriginal,
  isFullscreen,
  onCompareToggle,
  onFullscreenToggle,
  onZoomChange,
  t,
  zoom,
}: {
  compareOriginal: boolean;
  isFullscreen: boolean;
  onCompareToggle: () => void;
  onFullscreenToggle: () => void;
  onZoomChange: (zoom: number) => void;
  t: Copy;
  zoom: number;
}) {
  const nextZoomOut = Math.max(50, zoom - 10);
  const nextZoomIn = Math.min(160, zoom + 10);

  return (
    <div aria-label={t.previewTools} className="preview-toolbar" role="toolbar">
      <button
        aria-label={t.zoomOut}
        className="icon-button"
        disabled={zoom <= 50}
        onClick={() => onZoomChange(nextZoomOut)}
        type="button"
      >
        <StudioIcon name="zoomOut" size={19} />
      </button>
      <span className="zoom-readout">{zoom}%</span>
      <button
        aria-label={t.zoomIn}
        className="icon-button"
        disabled={zoom >= 160}
        onClick={() => onZoomChange(nextZoomIn)}
        type="button"
      >
        <StudioIcon name="zoomIn" size={19} />
      </button>
      <button
        aria-label={compareOriginal ? t.compareOn : t.compareOriginal}
        aria-pressed={compareOriginal}
        className={`icon-button ${compareOriginal ? "is-active" : ""}`}
        onClick={onCompareToggle}
        title={compareOriginal ? t.compareOn : t.compareOriginal}
        type="button"
      >
        <StudioIcon filled={compareOriginal} name="compare" size={18} />
      </button>
      <button
        aria-label={isFullscreen ? t.exitFullscreenPreview : t.fullscreenPreview}
        className="icon-button"
        onClick={onFullscreenToggle}
        type="button"
      >
        <StudioIcon name="fullscreen" size={20} />
      </button>
    </div>
  );
}
