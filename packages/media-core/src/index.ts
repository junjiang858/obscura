import {
  subtitleCueSchema,
  type MediaKind,
  type SubtitleCue,
  type WorkerJob,
} from "@local-media-studio/shared";

const byteUnits = ["B", "KB", "MB", "GB", "TB"] as const;

export type ImageCropAspect = "free" | "custom" | "1:1" | "4:5" | "9:16" | "16:9";
export type ImageAdjustment = "brightness" | "contrast" | "saturation";
export type ImageFilterPreset = "none" | "vivid" | "warm" | "cool" | "mono" | "film" | "fade";
export type ImageExportFormat = "png" | "jpeg" | "webp" | "avif" | "bmp" | "gif" | "tiff";
export type ImageExportMimeType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/avif"
  | "image/bmp"
  | "image/gif"
  | "image/tiff";
export type VideoExportFormat = "mp4" | "webm";
export type WatermarkPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

type ImageAnnotationBase = {
  color: string;
  id: string;
  rotation?: number;
  x: number;
  y: number;
};

export type ImageCropRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type ImageWatermarkLayer = {
  color: string;
  fontSize: number;
  id: "watermark";
  opacity: number;
  rotation: number;
  visible: boolean;
  x: number;
  y: number;
};

export type ImageTextAnnotation = ImageAnnotationBase & {
  text: string;
  type: "text";
};

export type ImageRectangleAnnotation = ImageAnnotationBase & {
  height: number;
  type: "rectangle";
  width: number;
};

export type ImageArrowAnnotation = ImageAnnotationBase & {
  endX: number;
  endY: number;
  type: "arrow";
};

export type ImageBrushAnnotation = ImageAnnotationBase & {
  points: Array<{ x: number; y: number }>;
  type: "brush";
};

export type ImageAnnotation =
  | ImageArrowAnnotation
  | ImageBrushAnnotation
  | ImageRectangleAnnotation
  | ImageTextAnnotation;

export type ImageEditState = {
  cropRect: ImageCropRect | null;
  cropAspect: ImageCropAspect;
  filterPreset: ImageFilterPreset;
  filterStrength: number;
  rotation: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
  resizeWidth: number | null;
  watermarkText: string;
  watermarkPosition: WatermarkPosition;
  watermarkLayer: ImageWatermarkLayer;
  annotations: ImageAnnotation[];
  adjustments: Record<ImageAdjustment, number>;
};

export type ImageEditHistory = {
  past: ImageEditState[];
  present: ImageEditState;
  future: ImageEditState[];
};

export type ImageEditAction =
  | { type: "set-crop-aspect"; aspect: ImageCropAspect }
  | { type: "rotate-clockwise" }
  | { type: "rotate-counterclockwise" }
  | { type: "toggle-flip-horizontal" }
  | { type: "toggle-flip-vertical" }
  | { type: "set-resize-width"; width: number | null }
  | { type: "set-crop-rect"; rect: ImageCropRect | null }
  | { type: "set-filter-preset"; preset: ImageFilterPreset }
  | { type: "set-filter-strength"; strength: number }
  | { type: "set-watermark"; text: string }
  | { type: "set-watermark-position"; position: WatermarkPosition }
  | { type: "update-watermark-layer"; patch: Partial<ImageWatermarkLayer> }
  | { type: "add-annotation"; annotation: ImageAnnotation }
  | { type: "update-annotation"; annotationId: string; patch: Partial<ImageAnnotation> }
  | { type: "remove-annotation"; annotationId: string }
  | { type: "set-adjustment"; adjustment: ImageAdjustment; value: number }
  | { type: "reset-beautify" }
  | { type: "reset-transform" }
  | { type: "reset-layers" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" };

export type VideoEditState = {
  exportFormat: VideoExportFormat;
  speed: number;
  subtitles: SubtitleCue[];
  trimEnd: number | null;
  trimStart: number;
};

export type VideoEditAction =
  | { type: "set-trim"; startTime: number; endTime: number | null }
  | { type: "set-speed"; speed: number }
  | { type: "set-format"; format: VideoExportFormat }
  | { type: "add-subtitle"; cue: SubtitleCue }
  | { type: "update-subtitle"; cueId: string; patch: Partial<Omit<SubtitleCue, "id">> }
  | { type: "remove-subtitle"; cueId: string }
  | { type: "reset-trim"; duration?: number | null }
  | { type: "reset-speed" }
  | { type: "reset-format" }
  | { type: "reset-subtitles" }
  | { type: "reset"; duration?: number | null };

export type ImageExportPlan = {
  crop: { x: number; y: number; width: number; height: number };
  outputWidth: number;
  outputHeight: number;
  mimeType: ImageExportMimeType;
  quality: number;
  suggestedFilename: string;
};

export type WorkerJobProgressUpdate = {
  status?: Extract<WorkerJob["status"], "queued" | "loading" | "processing">;
  progress?: number;
  message?: string;
};

const defaultImageEditState: ImageEditState = {
  cropRect: null,
  cropAspect: "free",
  filterPreset: "none",
  filterStrength: 100,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  resizeWidth: null,
  watermarkText: "",
  watermarkPosition: "bottom-right",
  watermarkLayer: {
    color: "#f8fbff",
    fontSize: 0.045,
    id: "watermark",
    opacity: 0.82,
    rotation: 0,
    visible: true,
    x: 0.68,
    y: 0.82,
  },
  annotations: [],
  adjustments: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
  },
};

export function classifyMediaKind(mimeType: string): MediaKind | null {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return null;
}

export function getNextAssetId(
  assetIds: readonly string[],
  currentAssetId: string | null,
  direction: 1 | -1,
): string | null {
  if (assetIds.length === 0) {
    return null;
  }

  const currentIndex = currentAssetId ? assetIds.indexOf(currentAssetId) : -1;
  const startingIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = (startingIndex + direction + assetIds.length) % assetIds.length;

  return assetIds[nextIndex] ?? null;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }

  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < byteUnits.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded = value >= 10 || unitIndex === 0 ? Math.round(value) : Math.round(value * 10) / 10;

  return `${rounded} ${byteUnits[unitIndex]}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function serializeWebVtt(cues: readonly SubtitleCue[]): string {
  const lines = ["WEBVTT", ""];

  cues.forEach((cue, index) => {
    const parsedCue = subtitleCueSchema.parse(cue);

    lines.push(String(index + 1));
    lines.push(`${formatTimestamp(parsedCue.startTime)} --> ${formatTimestamp(parsedCue.endTime)}`);
    lines.push(parsedCue.text);
    lines.push("");
  });

  return lines.join("\n");
}

export function createWorkerJob(id: string, type: WorkerJob["type"], message?: string): WorkerJob {
  return {
    id,
    type,
    status: "queued",
    progress: 0,
    ...(message ? { message } : {}),
  };
}

export function updateWorkerJobProgress(
  job: WorkerJob,
  update: WorkerJobProgressUpdate,
): WorkerJob {
  return {
    ...job,
    status: update.status ?? job.status,
    progress:
      typeof update.progress === "number"
        ? Math.round(clamp(update.progress, 0, 100))
        : job.progress,
    ...(update.message ? { message: update.message } : {}),
  };
}

export function completeWorkerJob(job: WorkerJob, message?: string): WorkerJob {
  return {
    ...job,
    status: "completed",
    progress: 100,
    ...(message ? { message } : {}),
    error: undefined,
  };
}

export function failWorkerJob(job: WorkerJob, error: NonNullable<WorkerJob["error"]>): WorkerJob {
  return {
    ...job,
    status: "failed",
    error,
  };
}

export function cancelWorkerJob(job: WorkerJob, message?: string): WorkerJob {
  return {
    ...job,
    status: "canceled",
    ...(message ? { message } : {}),
  };
}

export function initialImageEditHistory(): ImageEditHistory {
  return {
    past: [],
    present: cloneImageEditState(defaultImageEditState),
    future: [],
  };
}

export function getCurrentImageEditState(history: ImageEditHistory): ImageEditState {
  return cloneImageEditState(history.present);
}

export function initialVideoEditState(duration?: number | null): VideoEditState {
  return {
    exportFormat: "mp4",
    speed: 1,
    subtitles: [],
    trimEnd: typeof duration === "number" && duration > 0 ? Math.round(duration * 100) / 100 : null,
    trimStart: 0,
  };
}

export function updateVideoEditState(
  state: VideoEditState,
  action: VideoEditAction,
): VideoEditState {
  if (action.type === "reset") {
    return initialVideoEditState(action.duration);
  }

  if (action.type === "reset-trim") {
    return {
      ...cloneVideoEditState(state),
      trimEnd:
        typeof action.duration === "number" && action.duration > 0
          ? Math.round(action.duration * 100) / 100
          : null,
      trimStart: 0,
    };
  }

  if (action.type === "reset-speed") {
    return {
      ...cloneVideoEditState(state),
      speed: 1,
    };
  }

  if (action.type === "reset-format") {
    return {
      ...cloneVideoEditState(state),
      exportFormat: "mp4",
    };
  }

  if (action.type === "reset-subtitles") {
    return {
      ...cloneVideoEditState(state),
      subtitles: [],
    };
  }

  if (action.type === "set-trim") {
    const trimStart = Math.max(0, roundSeconds(action.startTime));
    const trimEnd =
      typeof action.endTime === "number"
        ? Math.max(trimStart + 0.1, roundSeconds(action.endTime))
        : null;

    return {
      ...cloneVideoEditState(state),
      trimEnd,
      trimStart,
    };
  }

  if (action.type === "set-speed") {
    return {
      ...cloneVideoEditState(state),
      speed: Math.round(clamp(action.speed, 0.25, 4) * 100) / 100,
    };
  }

  if (action.type === "set-format") {
    return {
      ...cloneVideoEditState(state),
      exportFormat: action.format,
    };
  }

  if (action.type === "add-subtitle") {
    return {
      ...cloneVideoEditState(state),
      subtitles: [...state.subtitles, normalizeSubtitleCue(action.cue)],
    };
  }

  if (action.type === "update-subtitle") {
    return {
      ...cloneVideoEditState(state),
      subtitles: state.subtitles.map((cue) =>
        cue.id === action.cueId ? normalizeSubtitleCue({ ...cue, ...action.patch }) : cue,
      ),
    };
  }

  return {
    ...cloneVideoEditState(state),
    subtitles: state.subtitles.filter((cue) => cue.id !== action.cueId),
  };
}

export function getActiveSubtitleCue(
  state: VideoEditState,
  currentTime: number,
): SubtitleCue | null {
  return (
    state.subtitles.find((cue) => currentTime >= cue.startTime && currentTime <= cue.endTime) ??
    null
  );
}

export function applyImageEditAction(
  history: ImageEditHistory,
  action: ImageEditAction,
): ImageEditHistory {
  if (action.type === "undo") {
    const previous = history.past.at(-1);

    if (!previous) {
      return history;
    }

    return {
      past: history.past.slice(0, -1),
      present: cloneImageEditState(previous),
      future: [cloneImageEditState(history.present), ...history.future],
    };
  }

  if (action.type === "redo") {
    const next = history.future[0];

    if (!next) {
      return history;
    }

    return {
      past: [...history.past, cloneImageEditState(history.present)],
      present: cloneImageEditState(next),
      future: history.future.slice(1),
    };
  }

  if (action.type === "reset") {
    return initialImageEditHistory();
  }

  const next = reduceImageEditState(history.present, action);

  if (JSON.stringify(next) === JSON.stringify(history.present)) {
    return history;
  }

  return {
    past: [...history.past, cloneImageEditState(history.present)],
    present: next,
    future: [],
  };
}

export function buildImageExportPlan({
  sourceName,
  sourceWidth,
  sourceHeight,
  state,
  format,
  quality,
}: {
  sourceName: string;
  sourceWidth: number;
  sourceHeight: number;
  state: ImageEditState;
  format: ImageExportFormat;
  quality: number;
}): ImageExportPlan {
  const crop = getImageCrop(sourceWidth, sourceHeight, state);
  const rotated = state.rotation === 90 || state.rotation === 270;
  const naturalWidth = rotated ? crop.height : crop.width;
  const naturalHeight = rotated ? crop.width : crop.height;
  const outputWidth = state.resizeWidth ?? naturalWidth;
  const outputHeight = Math.round((outputWidth / naturalWidth) * naturalHeight);

  return {
    crop,
    outputWidth,
    outputHeight,
    mimeType: getImageExportMimeType(format),
    quality: clamp(quality, 1, 100),
    suggestedFilename: `${sanitizeBaseName(sourceName)}-edited${getImageExportExtension(format)}`,
  };
}

export function getImageExportMimeType(format: ImageExportFormat): ImageExportMimeType {
  if (format === "jpeg") {
    return "image/jpeg";
  }

  if (format === "tiff") {
    return "image/tiff";
  }

  return `image/${format}` as ImageExportMimeType;
}

export function getImageExportExtension(format: ImageExportFormat): string {
  if (format === "jpeg") {
    return ".jpg";
  }

  if (format === "tiff") {
    return ".tiff";
  }

  return `.${format}`;
}

function formatTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  const milliseconds = Math.round((safeSeconds - Math.floor(safeSeconds)) * 1000);

  return (
    [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      wholeSeconds.toString().padStart(2, "0"),
    ].join(":") + `.${milliseconds.toString().padStart(3, "0")}`
  );
}

function reduceImageEditState(
  state: ImageEditState,
  action: Exclude<ImageEditAction, { type: "undo" | "redo" | "reset" }>,
): ImageEditState {
  switch (action.type) {
    case "set-crop-aspect":
      return {
        ...cloneImageEditState(state),
        cropAspect: action.aspect,
        cropRect: action.aspect === "custom" ? (state.cropRect ?? getDefaultCropRect()) : null,
      };
    case "rotate-clockwise":
      return { ...cloneImageEditState(state), rotation: rotate(state.rotation, 90) };
    case "rotate-counterclockwise":
      return { ...cloneImageEditState(state), rotation: rotate(state.rotation, -90) };
    case "toggle-flip-horizontal":
      return { ...cloneImageEditState(state), flipHorizontal: !state.flipHorizontal };
    case "toggle-flip-vertical":
      return { ...cloneImageEditState(state), flipVertical: !state.flipVertical };
    case "set-resize-width":
      return {
        ...cloneImageEditState(state),
        resizeWidth: action.width ? Math.round(clamp(action.width, 16, 12000)) : null,
      };
    case "set-crop-rect":
      return {
        ...cloneImageEditState(state),
        cropAspect: action.rect ? "custom" : state.cropAspect,
        cropRect: action.rect ? normalizeCropRect(action.rect) : null,
      };
    case "set-filter-preset":
      return {
        ...cloneImageEditState(state),
        filterPreset: action.preset,
      };
    case "set-filter-strength":
      return {
        ...cloneImageEditState(state),
        filterStrength: Math.round(clamp(action.strength, 0, 100)),
      };
    case "set-watermark":
      return { ...cloneImageEditState(state), watermarkText: action.text.slice(0, 120) };
    case "set-watermark-position":
      return {
        ...cloneImageEditState(state),
        watermarkLayer: {
          ...cloneWatermarkLayer(state.watermarkLayer),
          ...getWatermarkLayerPosition(action.position),
        },
        watermarkPosition: action.position,
      };
    case "update-watermark-layer":
      return {
        ...cloneImageEditState(state),
        watermarkLayer: normalizeWatermarkLayer({
          ...state.watermarkLayer,
          ...action.patch,
        }),
      };
    case "add-annotation":
      return {
        ...cloneImageEditState(state),
        annotations: [...state.annotations, normalizeAnnotation(action.annotation)],
      };
    case "update-annotation":
      return {
        ...cloneImageEditState(state),
        annotations: state.annotations.map((annotation) =>
          annotation.id === action.annotationId
            ? normalizeAnnotation({ ...annotation, ...action.patch } as ImageAnnotation)
            : cloneAnnotation(annotation),
        ),
      };
    case "remove-annotation":
      return {
        ...cloneImageEditState(state),
        annotations: state.annotations.filter(
          (annotation) => annotation.id !== action.annotationId,
        ),
      };
    case "set-adjustment":
      return {
        ...cloneImageEditState(state),
        adjustments: {
          ...state.adjustments,
          [action.adjustment]: clamp(action.value, -100, 100),
        },
      };
    case "reset-beautify":
      return {
        ...cloneImageEditState(state),
        adjustments: { ...defaultImageEditState.adjustments },
        filterPreset: defaultImageEditState.filterPreset,
        filterStrength: defaultImageEditState.filterStrength,
      };
    case "reset-transform":
      return {
        ...cloneImageEditState(state),
        cropAspect: defaultImageEditState.cropAspect,
        cropRect: defaultImageEditState.cropRect,
        flipHorizontal: defaultImageEditState.flipHorizontal,
        flipVertical: defaultImageEditState.flipVertical,
        resizeWidth: defaultImageEditState.resizeWidth,
        rotation: defaultImageEditState.rotation,
      };
    case "reset-layers":
      return {
        ...cloneImageEditState(state),
        annotations: [],
        watermarkLayer: cloneWatermarkLayer(defaultImageEditState.watermarkLayer),
        watermarkPosition: defaultImageEditState.watermarkPosition,
        watermarkText: defaultImageEditState.watermarkText,
      };
  }
}

function cloneImageEditState(state: ImageEditState): ImageEditState {
  return {
    ...state,
    adjustments: { ...state.adjustments },
    annotations: state.annotations.map(cloneAnnotation),
    cropRect: state.cropRect ? { ...state.cropRect } : null,
    watermarkLayer: cloneWatermarkLayer(state.watermarkLayer),
  };
}

function cloneVideoEditState(state: VideoEditState): VideoEditState {
  return {
    ...state,
    subtitles: state.subtitles.map((cue) => ({ ...cue })),
  };
}

function normalizeSubtitleCue(cue: SubtitleCue): SubtitleCue {
  const startTime = Math.max(0, roundSeconds(cue.startTime));
  const endTime = Math.max(startTime + 0.1, roundSeconds(cue.endTime));
  const text = cue.text.trim() || "Subtitle";

  return subtitleCueSchema.parse({
    ...cue,
    endTime,
    startTime,
    text,
  });
}

function cloneAnnotation(annotation: ImageAnnotation): ImageAnnotation {
  if (annotation.type === "brush") {
    return {
      ...annotation,
      points: annotation.points.map((point) => ({ ...point })),
    };
  }

  return { ...annotation };
}

function cloneWatermarkLayer(layer: ImageWatermarkLayer): ImageWatermarkLayer {
  return { ...layer };
}

function normalizeAnnotation(annotation: ImageAnnotation): ImageAnnotation {
  const base = {
    color: annotation.color.slice(0, 32),
    id: annotation.id.slice(0, 80),
    ...(typeof annotation.rotation === "number"
      ? { rotation: clamp(annotation.rotation, -360, 360) }
      : {}),
    x: clamp(annotation.x, 0, 1),
    y: clamp(annotation.y, 0, 1),
  };

  if (annotation.type === "text") {
    return {
      ...base,
      text: annotation.text.slice(0, 160),
      type: "text",
    };
  }

  if (annotation.type === "rectangle") {
    return {
      ...base,
      height: clamp(annotation.height, 0.02, 1),
      type: "rectangle",
      width: clamp(annotation.width, 0.02, 1),
    };
  }

  if (annotation.type === "arrow") {
    return {
      ...base,
      endX: clamp(annotation.endX, 0, 1),
      endY: clamp(annotation.endY, 0, 1),
      type: "arrow",
    };
  }

  return {
    ...base,
    points: annotation.points.map((point) => ({
      x: clamp(point.x, 0, 1),
      y: clamp(point.y, 0, 1),
    })),
    type: "brush",
  };
}

function normalizeCropRect(rect: ImageCropRect): ImageCropRect {
  const x = clamp(rect.x, 0, 0.98);
  const y = clamp(rect.y, 0, 0.98);
  const width = clamp(rect.width, 0.02, 1 - x);
  const height = clamp(rect.height, 0.02, 1 - y);

  return { height, width, x, y };
}

function normalizeWatermarkLayer(layer: ImageWatermarkLayer): ImageWatermarkLayer {
  return {
    color: layer.color.slice(0, 32),
    fontSize: clamp(layer.fontSize, 0.018, 0.16),
    id: "watermark",
    opacity: clamp(layer.opacity, 0.05, 1),
    rotation: clamp(layer.rotation, -360, 360),
    visible: layer.visible,
    x: clamp(layer.x, 0, 1),
    y: clamp(layer.y, 0, 1),
  };
}

function getDefaultCropRect(): ImageCropRect {
  return {
    height: 0.78,
    width: 0.78,
    x: 0.11,
    y: 0.11,
  };
}

function getWatermarkLayerPosition(
  position: WatermarkPosition,
): Pick<ImageWatermarkLayer, "x" | "y"> {
  if (position === "top-left") {
    return { x: 0.05, y: 0.06 };
  }

  if (position === "top-right") {
    return { x: 0.68, y: 0.06 };
  }

  if (position === "bottom-left") {
    return { x: 0.05, y: 0.82 };
  }

  if (position === "center") {
    return { x: 0.38, y: 0.46 };
  }

  return { x: 0.68, y: 0.82 };
}

function rotate(current: ImageEditState["rotation"], delta: 90 | -90): ImageEditState["rotation"] {
  return ((((current + delta) % 360) + 360) % 360) as ImageEditState["rotation"];
}

function getCenteredCrop(
  sourceWidth: number,
  sourceHeight: number,
  aspect: ImageCropAspect,
): ImageExportPlan["crop"] {
  const targetAspect = parseAspectRatio(aspect);

  if (!targetAspect) {
    return { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
  }

  const sourceAspect = sourceWidth / sourceHeight;

  if (sourceAspect > targetAspect) {
    const width = Math.round(sourceHeight * targetAspect);
    return {
      x: Math.round((sourceWidth - width) / 2),
      y: 0,
      width,
      height: sourceHeight,
    };
  }

  const height = Math.round(sourceWidth / targetAspect);

  return {
    x: 0,
    y: Math.round((sourceHeight - height) / 2),
    width: sourceWidth,
    height,
  };
}

function getImageCrop(
  sourceWidth: number,
  sourceHeight: number,
  state: ImageEditState,
): ImageExportPlan["crop"] {
  if (state.cropAspect === "custom" && state.cropRect) {
    return {
      height: Math.max(1, Math.round(state.cropRect.height * sourceHeight)),
      width: Math.max(1, Math.round(state.cropRect.width * sourceWidth)),
      x: Math.round(state.cropRect.x * sourceWidth),
      y: Math.round(state.cropRect.y * sourceHeight),
    };
  }

  return getCenteredCrop(sourceWidth, sourceHeight, state.cropAspect);
}

function parseAspectRatio(aspect: ImageCropAspect): number | null {
  if (aspect === "free" || aspect === "custom") {
    return null;
  }

  const [width, height] = aspect.split(":").map(Number);

  if (!width || !height) {
    return null;
  }

  return width / height;
}

function sanitizeBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const slug = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "media";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}
