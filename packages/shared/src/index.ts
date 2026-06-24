import { z } from "zod";

export const mediaKindSchema = z.enum(["image", "video"]);

export const mediaStatusSchema = z.enum(["metadata-loading", "ready", "unsupported", "failed"]);

export const mediaAssetSchema = z.object({
  id: z.string().min(1),
  kind: mediaKindSchema,
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  objectUrl: z.string().min(1),
  status: mediaStatusSchema,
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  duration: z.number().nonnegative().optional(),
  error: z.string().optional(),
});

export const subtitleCueSchema = z
  .object({
    id: z.string().min(1),
    startTime: z.number().min(0),
    endTime: z.number().min(0),
    text: z.string().trim().min(1),
  })
  .refine((cue) => cue.endTime > cue.startTime, {
    message: "Subtitle cue end time must be after the start time.",
    path: ["endTime"],
  });

export const imageExportFormatSchema = z.enum([
  "png",
  "jpeg",
  "webp",
  "avif",
  "bmp",
  "gif",
  "tiff",
]);
export const videoExportFormatSchema = z.enum(["mp4", "webm", "mov", "mkv", "avi"]);

export const exportSettingsSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("image"),
    format: imageExportFormatSchema,
    quality: z.number().int().min(1).max(100),
    filename: z.string().min(1).optional(),
  }),
  z.object({
    kind: z.literal("video"),
    format: videoExportFormatSchema,
    quality: z.number().int().min(1).max(100),
    filename: z.string().min(1).optional(),
  }),
]);

export const workerJobStatusSchema = z.enum([
  "idle",
  "queued",
  "loading",
  "processing",
  "completed",
  "canceled",
  "failed",
]);

export const workerJobTypeSchema = z.enum([
  "metadata",
  "thumbnail",
  "image-preview",
  "image-export",
  "background-removal",
  "video-preview",
  "video-export",
]);

export const workerJobSchema = z.object({
  id: z.string().min(1),
  type: workerJobTypeSchema,
  status: workerJobStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  message: z.string().optional(),
  fingerprint: z.string().min(1).optional(),
  inputSnapshot: z.record(z.string(), z.unknown()).optional(),
  launchId: z.string().min(1).optional(),
  result: z
    .object({
      filename: z.string().min(1).optional(),
      resultAssetId: z.string().min(1).optional(),
      url: z.string().min(1).optional(),
    })
    .optional(),
  resultAssetId: z.string().min(1).optional(),
  sourceAssetId: z.string().min(1).optional(),
  sourceAssetKind: mediaKindSchema.optional(),
  sourceAssetName: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  acknowledgedAt: z.number().nonnegative().optional(),
  error: z
    .object({
      code: z.string().min(1),
      message: z.string().min(1),
      recoverable: z.boolean(),
    })
    .optional(),
});

export type MediaKind = z.infer<typeof mediaKindSchema>;
export type MediaStatus = z.infer<typeof mediaStatusSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type SubtitleCue = z.infer<typeof subtitleCueSchema>;
export type ExportSettings = z.infer<typeof exportSettingsSchema>;
export type WorkerJob = z.infer<typeof workerJobSchema>;
