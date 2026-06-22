import type { CSSProperties } from "react";
import { buildImageExportPlan } from "@local-media-studio/media-core";
import type {
  ImageAnnotation,
  ImageEditState,
  ImageExportFormat,
  WatermarkPosition,
} from "@local-media-studio/media-core";
import type { Copy } from "../i18n";
import type { WorkspaceAsset } from "../stores/media-store";

export type ImageExportResult = {
  blob: Blob;
  url: string;
  filename: string;
  size: number;
};

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
};

type SaveFilePickerHandle = {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void> | void;
    close: () => Promise<void> | void;
  }>;
};

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<SaveFilePickerHandle>;
};

export async function exportEditedImage({
  asset,
  state,
  format,
  quality,
  t,
}: {
  asset: WorkspaceAsset;
  state: ImageEditState;
  format: ImageExportFormat;
  quality: number;
  t: Copy;
}): Promise<ImageExportResult> {
  const image = await loadImage(asset.objectUrl, t);
  const plan = buildImageExportPlan({
    sourceName: asset.name,
    sourceWidth: image.naturalWidth,
    sourceHeight: image.naturalHeight,
    state,
    format,
    quality,
  });
  const canvas = document.createElement("canvas");
  canvas.width = plan.outputWidth;
  canvas.height = plan.outputHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(t.canvasUnavailable);
  }

  const rotated = state.rotation === 90 || state.rotation === 270;
  const drawWidth = rotated ? plan.outputHeight : plan.outputWidth;
  const drawHeight = rotated ? plan.outputWidth : plan.outputHeight;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.filter = getCanvasFilter(state);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((state.rotation * Math.PI) / 180);
  context.scale(state.flipHorizontal ? -1 : 1, state.flipVertical ? -1 : 1);
  context.drawImage(
    image,
    plan.crop.x,
    plan.crop.y,
    plan.crop.width,
    plan.crop.height,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  context.restore();

  drawAnnotations(context, state.annotations, canvas.width, canvas.height);

  if (state.watermarkText.trim()) {
    context.save();
    context.globalAlpha = 0.78;
    context.fillStyle = "#f8fbff";
    context.font = `${Math.max(16, Math.round(canvas.width * 0.04))}px system-ui, sans-serif`;
    const anchor = getWatermarkAnchor(state.watermarkPosition, canvas.width, canvas.height);
    context.textAlign = anchor.textAlign;
    context.textBaseline = anchor.textBaseline;
    context.fillText(state.watermarkText.trim(), anchor.x, anchor.y);
    context.restore();
  }

  const blob = await canvasToBlob(canvas, plan.mimeType, plan.quality / 100, t);

  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: plan.suggestedFilename,
    size: blob.size,
  };
}

export async function saveImageExport(result: ImageExportResult, format: ImageExportFormat) {
  const savePicker = (window as SaveFilePickerWindow).showSaveFilePicker;

  if (savePicker && window.isSecureContext) {
    try {
      const handle = await savePicker({
        suggestedName: result.filename,
        types: [
          {
            description: getExportDescription(format),
            accept: {
              [getExportMimeType(format)]: [getExportExtension(format)],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(result.blob);
      await writable.close();
      return;
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
    }
  }

  triggerBrowserDownload(result);
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function getExportErrorMessage(error: unknown, t: Copy) {
  return error instanceof Error ? error.message : t.imageExportFailed;
}

export function getImagePreviewStyle(state: ImageEditState | null): CSSProperties {
  if (!state) {
    return {};
  }

  return {
    filter: getCanvasFilter(state),
    transform: [
      `rotate(${state.rotation}deg)`,
      `scaleX(${state.flipHorizontal ? -1 : 1})`,
      `scaleY(${state.flipVertical ? -1 : 1})`,
    ].join(" "),
  };
}

export function getCanvasFilter(state: ImageEditState): string {
  return [
    `brightness(${100 + state.adjustments.brightness}%)`,
    `contrast(${100 + state.adjustments.contrast}%)`,
    `saturate(${100 + state.adjustments.saturation}%)`,
  ].join(" ");
}

function drawAnnotations(
  context: CanvasRenderingContext2D,
  annotations: readonly ImageAnnotation[],
  width: number,
  height: number,
) {
  annotations.forEach((annotation) => {
    const x = annotation.x * width;
    const y = annotation.y * height;

    context.save();
    context.strokeStyle = annotation.color;
    context.fillStyle = annotation.color;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = Math.max(3, Math.round(Math.min(width, height) * 0.006));

    if (annotation.type === "text") {
      context.font = `${Math.max(16, Math.round(width * 0.036))}px system-ui, sans-serif`;
      context.textAlign = "left";
      context.textBaseline = "top";
      context.fillText(annotation.text, x, y);
    }

    if (annotation.type === "rectangle") {
      context.strokeRect(x, y, annotation.width * width, annotation.height * height);
    }

    if (annotation.type === "arrow") {
      drawArrow(context, x, y, annotation.endX * width, annotation.endY * height);
    }

    if (annotation.type === "brush") {
      drawBrush(context, annotation.points, width, height);
    }

    context.restore();
  });
}

function drawArrow(
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = 18;

  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();

  context.beginPath();
  context.moveTo(endX, endY);
  context.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6),
  );
  context.moveTo(endX, endY);
  context.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6),
  );
  context.stroke();
}

function drawBrush(
  context: CanvasRenderingContext2D,
  points: ReadonlyArray<{ x: number; y: number }>,
  width: number,
  height: number,
) {
  if (points.length < 2) {
    return;
  }

  context.beginPath();
  points.forEach((point, index) => {
    const x = point.x * width;
    const y = point.y * height;

    if (index === 0) {
      context.moveTo(x, y);
      return;
    }

    context.lineTo(x, y);
  });
  context.stroke();
}

function getWatermarkAnchor(position: WatermarkPosition, width: number, height: number) {
  const inset = Math.max(18, Math.round(Math.min(width, height) * 0.035));

  if (position === "top-left") {
    return {
      x: inset,
      y: inset,
      textAlign: "left" as CanvasTextAlign,
      textBaseline: "top" as CanvasTextBaseline,
    };
  }

  if (position === "top-right") {
    return {
      x: width - inset,
      y: inset,
      textAlign: "right" as CanvasTextAlign,
      textBaseline: "top" as CanvasTextBaseline,
    };
  }

  if (position === "bottom-left") {
    return {
      x: inset,
      y: height - inset,
      textAlign: "left" as CanvasTextAlign,
      textBaseline: "bottom" as CanvasTextBaseline,
    };
  }

  if (position === "center") {
    return {
      x: width / 2,
      y: height / 2,
      textAlign: "center" as CanvasTextAlign,
      textBaseline: "middle" as CanvasTextBaseline,
    };
  }

  return {
    x: width - inset,
    y: height - inset,
    textAlign: "right" as CanvasTextAlign,
    textBaseline: "bottom" as CanvasTextBaseline,
  };
}

function triggerBrowserDownload(result: ImageExportResult) {
  const link = document.createElement("a");
  link.href = result.url;
  link.download = result.filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

function getExportMimeType(format: ImageExportFormat) {
  if (format === "jpeg") {
    return "image/jpeg";
  }

  return `image/${format}`;
}

function getExportExtension(format: ImageExportFormat) {
  return format === "jpeg" ? ".jpg" : `.${format}`;
}

function getExportDescription(format: ImageExportFormat) {
  if (format === "jpeg") {
    return "JPEG image";
  }

  return `${format.toUpperCase()} image`;
}

function loadImage(src: string, t: Copy): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(t.imageLoadFailed));
    image.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
  t: Copy,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(t.canvasExportFailed));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}
