import { describe, expect, it } from "vitest";
import {
  applyImageEditAction,
  buildImageExportPlan,
  cancelWorkerJob,
  classifyMediaKind,
  completeWorkerJob,
  createWorkerJob,
  failWorkerJob,
  formatDuration,
  formatFileSize,
  getCurrentImageEditState,
  getNextAssetId,
  initialImageEditHistory,
  serializeWebVtt,
  updateWorkerJobProgress,
} from "./index";

describe("media core helpers", () => {
  it("classifies supported local media from MIME types", () => {
    expect(classifyMediaKind("image/png")).toBe("image");
    expect(classifyMediaKind("video/mp4")).toBe("video");
    expect(classifyMediaKind("text/plain")).toBeNull();
  });

  it("selects the next asset id with wraparound", () => {
    const ids = ["first", "second", "third"];

    expect(getNextAssetId(ids, "first", 1)).toBe("second");
    expect(getNextAssetId(ids, "third", 1)).toBe("first");
    expect(getNextAssetId(ids, "first", -1)).toBe("third");
    expect(getNextAssetId([], "missing", 1)).toBeNull();
  });

  it("formats file sizes and durations for compact media cards", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatDuration(74.2)).toBe("1:14");
  });

  it("serializes manual subtitle cues to WebVTT text", () => {
    expect(
      serializeWebVtt([
        {
          id: "cue-1",
          startTime: 1.5,
          endTime: 3,
          text: "Hello local editor",
        },
      ]),
    ).toContain("00:00:01.500 --> 00:00:03.000");
  });

  it("applies image edit actions with undo, redo, and reset history", () => {
    const initialHistory = initialImageEditHistory();
    const rotatedHistory = applyImageEditAction(initialHistory, { type: "rotate-clockwise" });
    const adjustedHistory = applyImageEditAction(rotatedHistory, {
      type: "set-adjustment",
      adjustment: "brightness",
      value: 18,
    });
    const undoneHistory = applyImageEditAction(adjustedHistory, { type: "undo" });
    const redoneHistory = applyImageEditAction(undoneHistory, { type: "redo" });
    const resetHistory = applyImageEditAction(redoneHistory, { type: "reset" });

    expect(getCurrentImageEditState(rotatedHistory).rotation).toBe(90);
    expect(getCurrentImageEditState(adjustedHistory).adjustments.brightness).toBe(18);
    expect(getCurrentImageEditState(undoneHistory).adjustments.brightness).toBe(0);
    expect(getCurrentImageEditState(redoneHistory).adjustments.brightness).toBe(18);
    expect(getCurrentImageEditState(resetHistory)).toEqual(
      getCurrentImageEditState(initialHistory),
    );
  });

  it("stores image annotations and watermark placement in edit history", () => {
    const annotatedHistory = applyImageEditAction(
      applyImageEditAction(initialImageEditHistory(), {
        annotation: {
          color: "#f8fbff",
          id: "annotation-1",
          text: "Hello",
          type: "text",
          x: 0.18,
          y: 0.24,
        },
        type: "add-annotation",
      }),
      {
        position: "top-left",
        type: "set-watermark-position",
      },
    );
    const annotatedState = getCurrentImageEditState(annotatedHistory);
    const undoneState = getCurrentImageEditState(
      applyImageEditAction(annotatedHistory, { type: "undo" }),
    );

    expect(annotatedState.annotations).toEqual([
      {
        color: "#f8fbff",
        id: "annotation-1",
        text: "Hello",
        type: "text",
        x: 0.18,
        y: 0.24,
      },
    ]);
    expect(annotatedState.watermarkPosition).toBe("top-left");
    expect(undoneState.watermarkPosition).toBe("bottom-right");
  });

  it("builds centered crop and resize plans for image export", () => {
    const history = applyImageEditAction(
      applyImageEditAction(initialImageEditHistory(), {
        type: "set-crop-aspect",
        aspect: "1:1",
      }),
      { type: "set-resize-width", width: 600 },
    );

    const plan = buildImageExportPlan({
      sourceName: "cover photo.png",
      sourceWidth: 1200,
      sourceHeight: 800,
      state: getCurrentImageEditState(history),
      format: "jpeg",
      quality: 82,
    });

    expect(plan.crop).toEqual({ x: 200, y: 0, width: 800, height: 800 });
    expect(plan.outputWidth).toBe(600);
    expect(plan.outputHeight).toBe(600);
    expect(plan.mimeType).toBe("image/jpeg");
    expect(plan.suggestedFilename).toBe("cover-photo-edited.jpg");
  });

  it("tracks worker job lifecycle with progress, failure, and cancellation states", () => {
    const queuedJob = createWorkerJob("job-1", "video-export", "Preparing export");
    const loadingJob = updateWorkerJobProgress(queuedJob, {
      message: "Loading engine",
      progress: 8,
      status: "loading",
    });
    const processingJob = updateWorkerJobProgress(loadingJob, {
      message: "Encoding",
      progress: 64,
      status: "processing",
    });
    const completedJob = completeWorkerJob(processingJob, "Export ready");
    const failedJob = failWorkerJob(processingJob, {
      code: "codec-unsupported",
      message: "Unsupported codec",
      recoverable: true,
    });
    const canceledJob = cancelWorkerJob(processingJob, "Export canceled");

    expect(queuedJob).toMatchObject({
      id: "job-1",
      message: "Preparing export",
      progress: 0,
      status: "queued",
      type: "video-export",
    });
    expect(processingJob.progress).toBe(64);
    expect(completedJob).toMatchObject({
      message: "Export ready",
      progress: 100,
      status: "completed",
    });
    expect(failedJob).toMatchObject({
      error: {
        code: "codec-unsupported",
        message: "Unsupported codec",
        recoverable: true,
      },
      status: "failed",
    });
    expect(canceledJob).toMatchObject({
      message: "Export canceled",
      status: "canceled",
    });
  });
});
