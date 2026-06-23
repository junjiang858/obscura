import type { ImageEditAction, ImageEditState, VideoEditState } from "@obscura/media-core";
import type { ImageExportSettings } from "../../config/media";
import type { Copy } from "../../i18n";
import type { WorkspaceAsset } from "../../stores/media-store";
import type { GeneratedPreview } from "../../utils/generated-preview";
import { EmptyPreview } from "./EmptyPreview";
import { SelectedPreview } from "./SelectedPreview";
import type { PreviewBackground } from "./types";

export function PreviewStage({
  compareOriginal,
  currentPreviewFingerprint,
  imageExportSettings,
  imagePreviewRequestKey,
  imageState,
  isFullscreen,
  isVisible,
  onAddMedia,
  onApplyImageAction,
  onCompareToggle,
  onFullscreenToggle,
  onGeneratedPreview,
  onPreviewBackgroundChange,
  onZoomChange,
  previewBackground,
  selectedAsset,
  t,
  videoState,
  videoPreviewRequestKey,
  zoom,
}: {
  compareOriginal: boolean;
  currentPreviewFingerprint: string | null;
  imageExportSettings: ImageExportSettings | null;
  imagePreviewRequestKey: number;
  imageState: ImageEditState | null;
  isFullscreen: boolean;
  isVisible: boolean;
  onAddMedia: () => void;
  onApplyImageAction: (action: ImageEditAction) => void;
  onCompareToggle: () => void;
  onFullscreenToggle: () => void;
  onGeneratedPreview: (preview: GeneratedPreview) => void;
  onPreviewBackgroundChange: (background: PreviewBackground) => void;
  onZoomChange: (zoom: number) => void;
  previewBackground: PreviewBackground;
  selectedAsset: WorkspaceAsset | null;
  t: Copy;
  videoState: VideoEditState | null;
  videoPreviewRequestKey: number;
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
          currentPreviewFingerprint={currentPreviewFingerprint}
          imageExportSettings={imageExportSettings}
          imagePreviewRequestKey={imagePreviewRequestKey}
          imageState={imageState}
          isFullscreen={isFullscreen}
          key={`${selectedAsset.id}-${imageState?.cropAspect ?? "video"}-${compareOriginal ? "compare" : "single"}`}
          onCompareToggle={onCompareToggle}
          onApplyImageAction={onApplyImageAction}
          onFullscreenToggle={onFullscreenToggle}
          onGeneratedPreview={onGeneratedPreview}
          onPreviewBackgroundChange={onPreviewBackgroundChange}
          onZoomChange={onZoomChange}
          previewBackground={previewBackground}
          t={t}
          videoState={videoState}
          videoPreviewRequestKey={videoPreviewRequestKey}
          zoom={zoom}
        />
      ) : (
        <EmptyPreview onAddMedia={onAddMedia} t={t} />
      )}
    </main>
  );
}
