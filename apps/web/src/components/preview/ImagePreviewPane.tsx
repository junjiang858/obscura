import { useEffect, useRef, useState, type CSSProperties } from "react";
import type {
  ImageCropAspect,
  ImageEditAction,
  ImageEditState,
} from "@local-media-studio/media-core";
import type { Copy } from "../../i18n";
import type { WorkspaceAsset } from "../../stores/media-store";
import { getImagePreviewStyle } from "../../utils/image-export";
import { ImageLayerCanvas } from "./ImageLayerCanvas";

export type PreviewBounds = {
  height: number;
  width: number;
};

export function ImagePreviewPane({
  asset,
  compareOriginal,
  imageState,
  onApplyImageAction,
  previewAspectRatio,
  previewBounds,
  previewSourceUrl,
  t,
}: {
  asset: WorkspaceAsset;
  compareOriginal: boolean;
  imageState: ImageEditState | null;
  onApplyImageAction: (action: ImageEditAction) => void;
  previewAspectRatio?: number | undefined;
  previewBounds: PreviewBounds | null;
  previewSourceUrl?: string | undefined;
  t: Copy;
}) {
  const activeAspect = previewSourceUrl ? "free" : (imageState?.cropAspect ?? "free");
  const compareBounds = getCompareBounds(previewBounds);
  const editedPane = (
    <figure className="image-preview-pane">
      <ImagePreviewFrame
        activeAspect={activeAspect}
        alt={`${t.previewOf} ${asset.name}`}
        asset={asset}
        bounds={previewBounds}
        imageState={previewSourceUrl ? null : imageState}
        interactive={Boolean(imageState) && !previewSourceUrl}
        onApplyImageAction={onApplyImageAction}
        sourceAspectRatio={previewAspectRatio}
        sourceUrl={previewSourceUrl}
      />
    </figure>
  );

  if (!compareOriginal) {
    return editedPane;
  }

  return (
    <div className="compare-preview-grid">
      <figure className="image-preview-pane compare-pane">
        <span>{t.originalVersion}</span>
        <ImagePreviewFrame
          activeAspect="free"
          alt=""
          asset={asset}
          bounds={compareBounds}
          imageState={null}
          interactive={false}
          onApplyImageAction={onApplyImageAction}
        />
      </figure>
      <figure className="image-preview-pane compare-pane">
        <span>{t.editedVersion}</span>
        <ImagePreviewFrame
          activeAspect={activeAspect}
          alt=""
          asset={asset}
          bounds={compareBounds}
          imageState={previewSourceUrl ? null : imageState}
          interactive={false}
          onApplyImageAction={onApplyImageAction}
          sourceAspectRatio={previewAspectRatio}
          sourceUrl={previewSourceUrl}
        />
      </figure>
    </div>
  );
}

function ImagePreviewFrame({
  activeAspect,
  alt,
  asset,
  bounds,
  imageState,
  interactive,
  onApplyImageAction,
  sourceAspectRatio,
  sourceUrl,
}: {
  activeAspect: ImageCropAspect;
  alt: string;
  asset: WorkspaceAsset;
  bounds: PreviewBounds | null;
  imageState: ImageEditState | null;
  interactive: boolean;
  onApplyImageAction: (action: ImageEditAction) => void;
  sourceAspectRatio?: number | undefined;
  sourceUrl?: string | undefined;
}) {
  const cropRef = useRef<HTMLDivElement>(null);
  const [layerSize, setLayerSize] = useState<PreviewBounds>({ height: 0, width: 0 });

  useEffect(() => {
    const crop = cropRef.current;

    if (!crop) {
      return;
    }

    const updateSize = () => {
      const rect = crop.getBoundingClientRect();
      setLayerSize((currentSize) => {
        const nextSize = {
          height: Math.round(rect.height),
          width: Math.round(rect.width),
        };

        return currentSize.height === nextSize.height && currentSize.width === nextSize.width
          ? currentSize
          : nextSize;
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(crop);

    return () => observer.disconnect();
  }, [activeAspect, asset.id, bounds?.height, bounds?.width]);

  return (
    <div
      ref={cropRef}
      className={`image-preview-crop crop-${activeAspect}`}
      style={getPreviewFrameStyle(asset, activeAspect, bounds, sourceAspectRatio)}
    >
      <div className="image-preview-surface">
        <img
          alt={alt}
          src={sourceUrl ?? asset.objectUrl}
          style={getImagePreviewStyle(imageState)}
        />
      </div>
      {imageState ? (
        <ImageLayerCanvas
          imageState={imageState}
          interactive={interactive}
          onApply={onApplyImageAction}
          size={layerSize}
        />
      ) : null}
    </div>
  );
}

function getPreviewFrameStyle(
  asset: WorkspaceAsset,
  aspect: ImageCropAspect,
  bounds: PreviewBounds | null,
  sourceAspectRatio?: number,
): CSSProperties {
  const ratio = sourceAspectRatio ?? getAspectRatio(asset, aspect);

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
  if (aspect === "free" || aspect === "custom") {
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
