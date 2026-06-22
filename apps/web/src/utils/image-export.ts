import { buildImageExportPlan } from "@local-media-studio/media-core";
import type { CSSProperties } from "react";
import type { ImageEditState, ImageExportFormat } from "@local-media-studio/media-core";
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

  if (state.watermarkText.trim()) {
    context.save();
    context.globalAlpha = 0.78;
    context.fillStyle = "#f8fbff";
    context.font = `${Math.max(16, Math.round(canvas.width * 0.04))}px system-ui, sans-serif`;
    context.textAlign = "right";
    context.textBaseline = "bottom";
    context.fillText(state.watermarkText.trim(), canvas.width - 18, canvas.height - 18);
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
