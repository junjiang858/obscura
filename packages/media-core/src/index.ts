import { subtitleCueSchema, type MediaKind, type SubtitleCue } from "@local-media-studio/shared";

const byteUnits = ["B", "KB", "MB", "GB", "TB"] as const;

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
