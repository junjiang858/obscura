import { describe, expect, it } from "vitest";
import {
  exportSettingsSchema,
  mediaAssetSchema,
  subtitleCueSchema,
  workerJobSchema,
} from "./index";

describe("shared media schemas", () => {
  it("accepts local image and video media assets with browser object URLs", () => {
    expect(
      mediaAssetSchema.parse({
        id: "asset-1",
        kind: "image",
        name: "cover.png",
        mimeType: "image/png",
        size: 2048,
        objectUrl: "blob:local-cover",
        status: "ready",
      }),
    ).toMatchObject({ kind: "image", status: "ready" });

    expect(
      mediaAssetSchema.parse({
        id: "asset-2",
        kind: "video",
        name: "clip.mp4",
        mimeType: "video/mp4",
        size: 4096,
        objectUrl: "blob:local-clip",
        status: "metadata-loading",
        duration: 8.4,
      }),
    ).toMatchObject({ kind: "video", duration: 8.4 });
  });

  it("rejects subtitle cues whose end time is not after the start time", () => {
    const result = subtitleCueSchema.safeParse({
      id: "cue-1",
      startTime: 4,
      endTime: 3,
      text: "Bad timing",
    });

    expect(result.success).toBe(false);
  });

  it("accepts approved rich export formats and rejects invalid quality", () => {
    expect(
      exportSettingsSchema.safeParse({
        kind: "image",
        format: "gif",
        quality: 80,
      }).success,
    ).toBe(true);

    expect(
      exportSettingsSchema.safeParse({
        kind: "video",
        format: "avi",
        quality: 80,
      }).success,
    ).toBe(true);

    expect(
      exportSettingsSchema.safeParse({
        kind: "video",
        format: "mp4",
        quality: 101,
      }).success,
    ).toBe(false);
  });

  it("tracks local worker jobs with readable states and optional progress", () => {
    expect(
      workerJobSchema.parse({
        id: "job-1",
        type: "video-export",
        status: "processing",
        progress: 42,
      }),
    ).toMatchObject({ type: "video-export", status: "processing" });
  });
});
