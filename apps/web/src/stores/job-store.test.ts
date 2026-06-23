import { describe, expect, it } from "vitest";
import { useJobStore } from "./job-store";

describe("job store", () => {
  it("queues, progresses, completes, fails, and clears local worker jobs", () => {
    useJobStore.getState().resetJobs();

    useJobStore.getState().queueJob("job-1", "background-removal", "Loading model");
    useJobStore.getState().updateJob("job-1", {
      message: "Removing background",
      progress: 42,
      status: "processing",
    });

    expect(useJobStore.getState().jobs["job-1"]).toMatchObject({
      message: "Removing background",
      progress: 42,
      status: "processing",
      type: "background-removal",
    });

    useJobStore.getState().completeJob("job-1", "Background removed");
    expect(useJobStore.getState().jobs["job-1"]?.status).toBe("completed");

    useJobStore.getState().queueJob("job-2", "video-export", "Preparing video");
    useJobStore.getState().failJob("job-2", {
      code: "codec-unsupported",
      message: "Unsupported codec",
      recoverable: true,
    });
    expect(useJobStore.getState().jobs["job-2"]).toMatchObject({
      error: {
        code: "codec-unsupported",
        message: "Unsupported codec",
        recoverable: true,
      },
      status: "failed",
    });

    useJobStore.getState().clearJob("job-1");
    expect(useJobStore.getState().jobs["job-1"]).toBeUndefined();
  });

  it("captures submitted background job metadata at launch time", () => {
    useJobStore.getState().resetJobs();

    useJobStore.getState().queueJob("preview-job-1", "video-preview", "Generating preview", {
      fingerprint: "asset-1:trim=0-1.5:mp4",
      inputSnapshot: { exportFormat: "mp4", trimEnd: 1.5, trimStart: 0 },
      launchId: "launch-1",
      sourceAssetId: "asset-1",
      sourceAssetKind: "video",
      sourceAssetName: "clip.webm",
      title: "Generate MP4 preview",
    });

    expect(useJobStore.getState().jobs["preview-job-1"]).toMatchObject({
      fingerprint: "asset-1:trim=0-1.5:mp4",
      inputSnapshot: { exportFormat: "mp4", trimEnd: 1.5, trimStart: 0 },
      launchId: "launch-1",
      sourceAssetId: "asset-1",
      sourceAssetKind: "video",
      sourceAssetName: "clip.webm",
      status: "queued",
      title: "Generate MP4 preview",
      type: "video-preview",
    });
  });

  it("attaches generated result metadata when a background job completes", () => {
    useJobStore.getState().resetJobs();

    useJobStore.getState().queueJob("image-job-1", "image-preview", "Generating image", {
      fingerprint: "asset-2:webp",
      sourceAssetId: "asset-2",
      sourceAssetKind: "image",
      sourceAssetName: "cover.png",
      title: "Generate WEBP preview",
    });

    useJobStore.getState().completeJob("image-job-1", "Image ready", {
      filename: "cover-edited.webp",
      resultAssetId: "asset-generated-1",
    });

    expect(useJobStore.getState().jobs["image-job-1"]).toMatchObject({
      message: "Image ready",
      result: {
        filename: "cover-edited.webp",
        resultAssetId: "asset-generated-1",
      },
      resultAssetId: "asset-generated-1",
      status: "completed",
    });
  });
});
