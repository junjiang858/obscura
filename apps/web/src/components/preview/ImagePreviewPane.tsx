import type { CSSProperties } from "react";
import type { ImageCropAspect, ImageEditState } from "@local-media-studio/media-core";
import type { Copy } from "../../i18n";
import type { WorkspaceAsset } from "../../stores/media-store";
import { getImagePreviewStyle } from "../../utils/image-export";

export type PreviewBounds = {
  height: number;
  width: number;
};

export function ImagePreviewPane({
  asset,
  compareOriginal,
  imageState,
  previewBounds,
  t,
}: {
  asset: WorkspaceAsset;
  compareOriginal: boolean;
  imageState: ImageEditState | null;
  previewBounds: PreviewBounds | null;
  t: Copy;
}) {
  const activeAspect = imageState?.cropAspect ?? "free";
  const compareBounds = getCompareBounds(previewBounds);
  const editedPane = (
    <figure className="image-preview-pane">
      <div
        className={`image-preview-crop crop-${activeAspect}`}
        style={getPreviewFrameStyle(asset, activeAspect, previewBounds)}
      >
        <img
          alt={`${t.previewOf} ${asset.name}`}
          src={asset.objectUrl}
          style={getImagePreviewStyle(imageState)}
        />
        {imageState?.watermarkText.trim() ? (
          <figcaption className="watermark-preview">{imageState.watermarkText.trim()}</figcaption>
        ) : null}
      </div>
    </figure>
  );

  if (!compareOriginal) {
    return editedPane;
  }

  return (
    <div className="compare-preview-grid">
      <figure className="image-preview-pane compare-pane">
        <span>{t.originalVersion}</span>
        <div
          className="image-preview-crop crop-free"
          style={getPreviewFrameStyle(asset, "free", compareBounds)}
        >
          <img alt="" src={asset.objectUrl} />
        </div>
      </figure>
      <figure className="image-preview-pane compare-pane">
        <span>{t.editedVersion}</span>
        <div
          className={`image-preview-crop crop-${activeAspect}`}
          style={getPreviewFrameStyle(asset, activeAspect, compareBounds)}
        >
          <img alt="" src={asset.objectUrl} style={getImagePreviewStyle(imageState)} />
          {imageState?.watermarkText.trim() ? (
            <figcaption className="watermark-preview">{imageState.watermarkText.trim()}</figcaption>
          ) : null}
        </div>
      </figure>
    </div>
  );
}

function getPreviewFrameStyle(
  asset: WorkspaceAsset,
  aspect: ImageCropAspect,
  bounds: PreviewBounds | null,
): CSSProperties {
  const ratio = getAspectRatio(asset, aspect);

  if (!bounds?.width || !bounds.height) {
    return { aspectRatio: `${ratio}` };
  }

  const size = fitAspectToBounds(ratio, bounds);

  return {
    height: `${size.height}px`,
    width: `${size.width}px`,
  };
}

function getAspectRatio(asset: WorkspaceAsset, aspect: ImageCropAspect) {
  if (aspect === "free") {
    return asset.width && asset.height ? asset.width / asset.height : 4 / 3;
  }

  const [width, height] = aspect.split(":").map(Number);
  return width && height ? width / height : 4 / 3;
}

function fitAspectToBounds(aspectRatio: number, bounds: PreviewBounds) {
  const widthFromHeight = bounds.height * aspectRatio;

  if (widthFromHeight <= bounds.width) {
    return {
      height: Math.round(bounds.height),
      width: Math.round(widthFromHeight),
    };
  }

  return {
    height: Math.round(bounds.width / aspectRatio),
    width: Math.round(bounds.width),
  };
}

function getCompareBounds(bounds: PreviewBounds | null): PreviewBounds | null {
  if (!bounds) {
    return null;
  }

  return {
    height: Math.max(0, bounds.height - 28),
    width: Math.max(0, (bounds.width - 12) / 2),
  };
}
