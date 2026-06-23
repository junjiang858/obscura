import type { CSSProperties } from "react";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import * as UTIF from "utif2";
import {
  buildImageExportPlan,
  getImageExportExtension,
  getImageExportMimeType,
} from "@local-media-studio/media-core";
import type {
  ImageAnnotation,
  ImageEditState,
  ImageExportFormat,
  ImageFilterPreset,
} from "@local-media-studio/media-core";
import type { Copy } from "../i18n";
import type { WorkspaceAsset } from "../stores/media-store";

export type ImageExportResult = {
  blob: Blob;
  filename: string;
  height: number;
  size: number;
  url: string;
  width: number;
};

export type ImageExportAvailability = {
  available: boolean;
  format: ImageExportFormat;
  reason?: string;
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

const browserNativeImageFormats = new Set<ImageExportFormat>(["png", "jpeg", "webp", "avif"]);
const customEncoderFormats = new Set<ImageExportFormat>(["bmp", "gif", "tiff"]);
const nativeSupportCache = new Map<ImageExportFormat, boolean>();

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

  if (state.watermarkText.trim() && state.watermarkLayer.visible) {
    const watermark = state.watermarkLayer;

    context.save();
    context.globalAlpha = watermark.opacity;
    context.fillStyle = watermark.color;
    context.font = `${Math.max(16, Math.round(canvas.width * watermark.fontSize))}px system-ui, sans-serif`;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.translate(watermark.x * canvas.width, watermark.y * canvas.height);
    context.rotate((watermark.rotation * Math.PI) / 180);
    context.fillText(state.watermarkText.trim(), 0, 0);
    context.restore();
  }

  const blob = await encodeCanvasForImageFormat(canvas, format, plan.quality / 100, t);

  return {
    blob,
    filename: plan.suggestedFilename,
    height: canvas.height,
    size: blob.size,
    url: URL.createObjectURL(blob),
    width: canvas.width,
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
              [getImageExportMimeType(format)]: [getImageExportExtension(format)],
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

export async function getImageExportAvailability(
  formats: readonly ImageExportFormat[],
  t: Copy,
): Promise<Record<ImageExportFormat, ImageExportAvailability>> {
  const entries = await Promise.all(
    formats.map(async (format) => {
      if (customEncoderFormats.has(format)) {
        return [format, { available: true, format }] as const;
      }

      if (!browserNativeImageFormats.has(format)) {
        return [
          format,
          {
            available: false,
            format,
            reason: t.imageExportFormatUnsupported,
          },
        ] as const;
      }

      const available = await detectNativeCanvasFormat(format);

      return [
        format,
        {
          available,
          format,
          ...(available ? {} : { reason: t.imageExportFormatUnsupported }),
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<ImageExportFormat, ImageExportAvailability>;
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
  const preset = getFilterPresetProfile(state.filterPreset, state.filterStrength / 100);
  const brightness = Math.max(0, 100 + state.adjustments.brightness + preset.brightness);
  const contrast = Math.max(0, 100 + state.adjustments.contrast + preset.contrast);
  const saturation = Math.max(0, 100 + state.adjustments.saturation + preset.saturation);

  return [
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    `saturate(${saturation}%)`,
    `sepia(${preset.sepia}%)`,
    `grayscale(${preset.grayscale}%)`,
    `hue-rotate(${preset.hueRotate}deg)`,
  ].join(" ");
}

function getFilterPresetProfile(preset: ImageFilterPreset, strength: number) {
  const amount = Math.min(1, Math.max(0, strength));
  const profiles: Record<
    ImageFilterPreset,
    {
      brightness: number;
      contrast: number;
      grayscale: number;
      hueRotate: number;
      saturation: number;
      sepia: number;
    }
  > = {
    cool: { brightness: 2, contrast: 4, grayscale: 0, hueRotate: -10, saturation: 8, sepia: 0 },
    fade: { brightness: 8, contrast: -12, grayscale: 0, hueRotate: 0, saturation: -24, sepia: 8 },
    film: { brightness: -4, contrast: 16, grayscale: 0, hueRotate: -4, saturation: -12, sepia: 18 },
    mono: { brightness: 0, contrast: 8, grayscale: 100, hueRotate: 0, saturation: -100, sepia: 0 },
    none: { brightness: 0, contrast: 0, grayscale: 0, hueRotate: 0, saturation: 0, sepia: 0 },
    vivid: { brightness: 2, contrast: 12, grayscale: 0, hueRotate: 0, saturation: 26, sepia: 0 },
    warm: { brightness: 4, contrast: 4, grayscale: 0, hueRotate: 6, saturation: 10, sepia: 18 },
  };
  const profile = profiles[preset];

  return {
    brightness: Math.round(profile.brightness * amount),
    contrast: Math.round(profile.contrast * amount),
    grayscale: Math.round(profile.grayscale * amount),
    hueRotate: Math.round(profile.hueRotate * amount),
    saturation: Math.round(profile.saturation * amount),
    sepia: Math.round(profile.sepia * amount),
  };
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

async function encodeCanvasForImageFormat(
  canvas: HTMLCanvasElement,
  format: ImageExportFormat,
  quality: number,
  t: Copy,
): Promise<Blob> {
  if (format === "bmp") {
    return encodeBmp(canvas, t);
  }

  if (format === "gif") {
    return encodeGif(canvas, t);
  }

  if (format === "tiff") {
    return encodeTiff(canvas, t);
  }

  const mimeType = getImageExportMimeType(format);
  const blob = await canvasToBlob(canvas, mimeType, quality, t);

  if (blob.type && blob.type !== mimeType) {
    throw new Error(t.imageExportFormatUnsupported);
  }

  return blob;
}

async function detectNativeCanvasFormat(format: ImageExportFormat): Promise<boolean> {
  const cachedSupport = nativeSupportCache.get(format);

  if (typeof cachedSupport === "boolean") {
    return cachedSupport;
  }

  if (format === "png") {
    nativeSupportCache.set(format, true);
    return true;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");

  if (!context) {
    nativeSupportCache.set(format, false);
    return false;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 1, 1);

  try {
    const mimeType = getImageExportMimeType(format);
    const blob = await canvasToBlob(canvas, mimeType, 0.92, {
      canvasExportFailed: "Canvas export failed",
    } as Copy);
    const supported = blob.type === mimeType;

    nativeSupportCache.set(format, supported);
    return supported;
  } catch {
    nativeSupportCache.set(format, false);
    return false;
  }
}

function encodeBmp(canvas: HTMLCanvasElement, t: Copy): Blob {
  const { data, height, width } = getCanvasImageData(canvas, t);
  const rowStride = Math.ceil((width * 3) / 4) * 4;
  const pixelArraySize = rowStride * height;
  const fileSize = 54 + pixelArraySize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  bytes[0] = 0x42;
  bytes[1] = 0x4d;
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);

  let offset = 54;
  for (let y = height - 1; y >= 0; y -= 1) {
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = rowStart + x * 4;
      const alpha = readPixelChannel(data, pixelIndex + 3, 255) / 255;
      const red = flattenAlpha(readPixelChannel(data, pixelIndex), alpha);
      const green = flattenAlpha(readPixelChannel(data, pixelIndex + 1), alpha);
      const blue = flattenAlpha(readPixelChannel(data, pixelIndex + 2), alpha);

      bytes[offset] = blue;
      bytes[offset + 1] = green;
      bytes[offset + 2] = red;
      offset += 3;
    }

    offset += rowStride - width * 3;
  }

  return new Blob([buffer], { type: "image/bmp" });
}

function encodeGif(canvas: HTMLCanvasElement, t: Copy): Blob {
  const { data, height, width } = getCanvasImageData(canvas, t);
  const flattenedData = flattenImageDataToWhite(data);
  const palette = quantize(flattenedData, 256);
  const indexedPixels = applyPalette(flattenedData, palette);
  const gif = GIFEncoder();

  gif.writeFrame(indexedPixels, width, height, { palette });
  gif.finish();

  const bytes = gif.bytes();
  return new Blob([copyToExactArrayBuffer(bytes)], { type: "image/gif" });
}

function encodeTiff(canvas: HTMLCanvasElement, t: Copy): Blob {
  const { data, height, width } = getCanvasImageData(canvas, t);
  const rgba = new Uint8Array(data.byteLength);
  rgba.set(data);
  const encoded = UTIF.encodeImage(copyToExactArrayBuffer(rgba), width, height);

  return new Blob([encoded], { type: "image/tiff" });
}

function getCanvasImageData(canvas: HTMLCanvasElement, t: Copy): ImageData {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(t.canvasUnavailable);
  }

  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function flattenImageDataToWhite(data: Uint8ClampedArray) {
  const flattened = new Uint8Array(data.byteLength);

  for (let index = 0; index < data.length; index += 4) {
    const alpha = readPixelChannel(data, index + 3, 255) / 255;
    flattened[index] = flattenAlpha(readPixelChannel(data, index), alpha);
    flattened[index + 1] = flattenAlpha(readPixelChannel(data, index + 1), alpha);
    flattened[index + 2] = flattenAlpha(readPixelChannel(data, index + 2), alpha);
    flattened[index + 3] = 255;
  }

  return flattened;
}

function flattenAlpha(channel: number, alpha: number) {
  return Math.round(channel * alpha + 255 * (1 - alpha));
}

function readPixelChannel(
  data: Uint8Array | Uint8ClampedArray,
  index: number,
  fallback = 0,
): number {
  return data[index] ?? fallback;
}

function copyToExactArrayBuffer(bytes: Uint8Array | Uint8ClampedArray): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
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
