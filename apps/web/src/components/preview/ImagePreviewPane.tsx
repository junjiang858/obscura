import type { CSSProperties } from "react";
import type {
  ImageAnnotation,
  ImageCropAspect,
  ImageEditState,
} from "@local-media-studio/media-core";
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
        <AnnotationPreviewOverlay annotations={imageState?.annotations ?? []} />
        {imageState?.watermarkText.trim() ? (
          <figcaption className={`watermark-preview position-${imageState.watermarkPosition}`}>
            {imageState.watermarkText.trim()}
          </figcaption>
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
          <AnnotationPreviewOverlay annotations={imageState?.annotations ?? []} />
          {imageState?.watermarkText.trim() ? (
            <figcaption className={`watermark-preview position-${imageState.watermarkPosition}`}>
              {imageState.watermarkText.trim()}
            </figcaption>
          ) : null}
        </div>
      </figure>
    </div>
  );
}

function AnnotationPreviewOverlay({ annotations }: { annotations: readonly ImageAnnotation[] }) {
  if (annotations.length === 0) {
    return null;
  }

  return (
    <svg aria-hidden="true" className="annotation-preview-overlay" viewBox="0 0 100 100">
      <defs>
        <marker
          id="annotation-arrowhead"
          markerHeight="5"
          markerWidth="5"
          orient="auto"
          refX="4"
          refY="2.5"
        >
          <path d="M0,0 L5,2.5 L0,5 Z" fill="currentColor" />
        </marker>
      </defs>
      {annotations.map((annotation) => (
        <AnnotationPreviewItem annotation={annotation} key={annotation.id} />
      ))}
    </svg>
  );
}

function AnnotationPreviewItem({ annotation }: { annotation: ImageAnnotation }) {
  const x = annotation.x * 100;
  const y = annotation.y * 100;
  const color = annotation.color;

  if (annotation.type === "text") {
    return (
      <text fill={color} fontSize="4.2" fontWeight="760" x={x} y={y}>
        {annotation.text}
      </text>
    );
  }

  if (annotation.type === "rectangle") {
    return (
      <rect
        fill="none"
        height={annotation.height * 100}
        stroke={color}
        strokeWidth="0.7"
        width={annotation.width * 100}
        x={x}
        y={y}
      />
    );
  }

  if (annotation.type === "arrow") {
    return (
      <line
        markerEnd="url(#annotation-arrowhead)"
        stroke={color}
        strokeLinecap="round"
        strokeWidth="0.9"
        x1={x}
        x2={annotation.endX * 100}
        y1={y}
        y2={annotation.endY * 100}
      />
    );
  }

  return (
    <polyline
      fill="none"
      points={annotation.points.map((point) => `${point.x * 100},${point.y * 100}`).join(" ")}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="0.8"
    />
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
