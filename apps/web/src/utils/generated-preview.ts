import type { ImageEditState, VideoEditState } from "@obscura/media-core";
import type { ImageExportSettings } from "../config/media";
import type { ImageExportResult } from "./image-export";
import type { VideoExportResult } from "./video-export";

export type GeneratedImagePreview = ImageExportResult & {
  assetId: string;
  fingerprint: string;
  jobId: string;
  kind: "image";
};

export type GeneratedVideoPreview = VideoExportResult & {
  assetId: string;
  fingerprint: string;
  jobId: string;
  kind: "video";
};

export type GeneratedPreview = GeneratedImagePreview | GeneratedVideoPreview;

export function getImagePreviewFingerprint({
  assetId,
  settings,
  state,
}: {
  assetId: string;
  settings: ImageExportSettings;
  state: ImageEditState;
}) {
  return JSON.stringify({
    assetId,
    format: settings.format,
    kind: "image",
    quality: settings.quality,
    state,
  });
}

export function getVideoPreviewFingerprint({
  assetId,
  state,
}: {
  assetId: string;
  state: VideoEditState;
}) {
  return JSON.stringify({
    assetId,
    exportFormat: state.exportFormat,
    kind: "video",
    speed: state.speed,
    subtitles: state.subtitles,
    trimEnd: state.trimEnd,
    trimStart: state.trimStart,
  });
}

export function revokeGeneratedPreview(preview: GeneratedPreview) {
  URL.revokeObjectURL(preview.url);
}
