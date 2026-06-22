import type { ImageEditState } from "@local-media-studio/media-core";
import type { Copy } from "../../i18n";
import type { WorkspaceAsset } from "../../stores/media-store";
import { EmptyPreview } from "./EmptyPreview";
import { SelectedPreview } from "./SelectedPreview";

export function PreviewStage({
  compareOriginal,
  imageState,
  isFullscreen,
  isVisible,
  onAddMedia,
  onCompareToggle,
  onFullscreenToggle,
  onZoomChange,
  selectedAsset,
  t,
  zoom,
}: {
  compareOriginal: boolean;
  imageState: ImageEditState | null;
  isFullscreen: boolean;
  isVisible: boolean;
  onAddMedia: () => void;
  onCompareToggle: () => void;
  onFullscreenToggle: () => void;
  onZoomChange: (zoom: number) => void;
  selectedAsset: WorkspaceAsset | null;
  t: Copy;
  zoom: number;
}) {
  return (
    <main
      className={`preview-stage ${isFullscreen ? "is-fullscreen" : ""} ${isVisible ? "is-mobile-visible" : ""}`}
    >
      {selectedAsset ? (
        <SelectedPreview
          asset={selectedAsset}
          compareOriginal={compareOriginal}
          imageState={imageState}
          isFullscreen={isFullscreen}
          key={`${selectedAsset.id}-${imageState?.cropAspect ?? "video"}-${compareOriginal ? "compare" : "single"}`}
          onCompareToggle={onCompareToggle}
          onFullscreenToggle={onFullscreenToggle}
          onZoomChange={onZoomChange}
          t={t}
          zoom={zoom}
        />
      ) : (
        <EmptyPreview onAddMedia={onAddMedia} t={t} />
      )}
    </main>
  );
}
