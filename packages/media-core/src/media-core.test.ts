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
  getImageExportExtension,
  getImageExportMimeType,
  getNextAssetId,
  initialImageEditHistory,
  initialVideoEditState,
  serializeWebVtt,
  updateVideoEditState,
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
    expect(annotatedState.watermarkLayer).toMatchObject({ x: 0.05, y: 0.06 });
    expect(undoneState.watermarkPosition).toBe("bottom-right");
  });

  it("updates image layer geometry and custom crop export plans", () => {
    const history = applyImageEditAction(
      applyImageEditAction(
        applyImageEditAction(initialImageEditHistory(), {
          annotation: {
            color: "#f8fbff",
            height: 0.3,
            id: "box-1",
            type: "rectangle",
            width: 0.4,
            x: 0.2,
            y: 0.2,
          },
          type: "add-annotation",
        }),
        {
          annotationId: "box-1",
          patch: { height: 0.22, width: 0.32, x: 0.31, y: 0.27 },
          type: "update-annotation",
        },
      ),
      {
        rect: { height: 0.5, width: 0.6, x: 0.1, y: 0.2 },
        type: "set-crop-rect",
      },
    );
    const state = getCurrentImageEditState(history);
    const plan = buildImageExportPlan({
      sourceName: "cover photo.png",
      sourceWidth: 1200,
      sourceHeight: 800,
      state,
      format: "png",
      quality: 86,
    });

    expect(state.cropAspect).toBe("custom");
    expect(state.annotations[0]).toMatchObject({ height: 0.22, width: 0.32, x: 0.31, y: 0.27 });
    expect(plan.crop).toEqual({ height: 400, width: 720, x: 120, y: 160 });
  });

  it("resets beautify controls without clearing transform or layer edits", () => {
    const history = applyImageEditAction(
      applyImageEditAction(
        applyImageEditAction(
          applyImageEditAction(initialImageEditHistory(), { type: "rotate-clockwise" }),
          { adjustment: "contrast", type: "set-adjustment", value: 24 },
        ),
        { preset: "film", type: "set-filter-preset" },
      ),
      { type: "reset-beautify" },
    );
    const state = getCurrentImageEditState(history);

    expect(state.rotation).toBe(90);
    expect(state.adjustments).toEqual({ brightness: 0, contrast: 0, saturation: 0 });
    expect(state.filterPreset).toBe("none");
    expect(state.filterStrength).toBe(100);
  });

  it("resets transform controls without clearing beautify or layer edits", () => {
    const history = applyImageEditAction(
      applyImageEditAction(
        applyImageEditAction(
          applyImageEditAction(
            applyImageEditAction(initialImageEditHistory(), { type: "rotate-clockwise" }),
            { type: "toggle-flip-horizontal" },
          ),
          {
            annotation: {
              color: "#f8fbff",
              id: "annotation-1",
              text: "Keep me",
              type: "text",
              x: 0.2,
              y: 0.2,
            },
            type: "add-annotation",
          },
        ),
        { adjustment: "brightness", type: "set-adjustment", value: 16 },
      ),
      { type: "reset-transform" },
    );
    const state = getCurrentImageEditState(history);

    expect(state.rotation).toBe(0);
    expect(state.flipHorizontal).toBe(false);
    expect(state.cropAspect).toBe("free");
    expect(state.cropRect).toBeNull();
    expect(state.adjustments.brightness).toBe(16);
    expect(state.annotations).toHaveLength(1);
  });

  it("resets image layers without clearing transform or beautify edits", () => {
    const history = applyImageEditAction(
      applyImageEditAction(
        applyImageEditAction(
          applyImageEditAction(
            applyImageEditAction(initialImageEditHistory(), { type: "rotate-clockwise" }),
            { text: "Draft", type: "set-watermark" },
          ),
          {
            annotation: {
              color: "#f8fbff",
              id: "annotation-1",
              text: "Remove me",
              type: "text",
              x: 0.2,
              y: 0.2,
            },
            type: "add-annotation",
          },
        ),
        { adjustment: "contrast", type: "set-adjustment", value: 22 },
      ),
      { type: "reset-layers" },
    );
    const state = getCurrentImageEditState(history);

    expect(state.rotation).toBe(90);
    expect(state.adjustments.contrast).toBe(22);
    expect(state.annotations).toEqual([]);
    expect(state.watermarkText).toBe("");
    expect(state.watermarkPosition).toBe("bottom-right");
    expect(state.watermarkLayer).toMatchObject({ x: 0.68, y: 0.82 });
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

  it("maps rich image export formats to MIME types and extensions", () => {
    expect(getImageExportMimeType("png")).toBe("image/png");
    expect(getImageExportMimeType("jpeg")).toBe("image/jpeg");
    expect(getImageExportMimeType("webp")).toBe("image/webp");
    expect(getImageExportMimeType("avif")).toBe("image/avif");
    expect(getImageExportMimeType("bmp")).toBe("image/bmp");
    expect(getImageExportMimeType("gif")).toBe("image/gif");
    expect(getImageExportMimeType("tiff")).toBe("image/tiff");
    expect(getImageExportExtension("jpeg")).toBe(".jpg");
    expect(getImageExportExtension("tiff")).toBe(".tiff");
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

  it("updates single-video edit settings for trim, speed, subtitles, and format", () => {
    const initialState = initialVideoEditState(12);
    const editedState = updateVideoEditState(
      updateVideoEditState(
        updateVideoEditState(initialState, {
          endTime: 8,
          startTime: 2,
          type: "set-trim",
        }),
        {
          speed: 1.5,
          type: "set-speed",
        },
      ),
      {
        cue: {
          endTime: 4,
          id: "cue-1",
          startTime: 2,
          text: "Hello clip",
        },
        type: "add-subtitle",
      },
    );
    const finalState = updateVideoEditState(editedState, {
      format: "webm",
      type: "set-format",
    });

    expect(finalState).toMatchObject({
      exportFormat: "webm",
      speed: 1.5,
      trimEnd: 8,
      trimStart: 2,
    });
    expect(finalState.subtitles).toEqual([
      {
        endTime: 4,
        id: "cue-1",
        startTime: 2,
        text: "Hello clip",
      },
    ]);
  });

  it("resets individual video edit groups to original defaults", () => {
    const editedState = updateVideoEditState(
      updateVideoEditState(
        updateVideoEditState(
          updateVideoEditState(initialVideoEditState(12), {
            endTime: 8,
            startTime: 2,
            type: "set-trim",
          }),
          { speed: 1.5, type: "set-speed" },
        ),
        {
          cue: { endTime: 4, id: "cue-1", startTime: 2, text: "Hello clip" },
          type: "add-subtitle",
        },
      ),
      { format: "webm", type: "set-format" },
    );
    const trimReset = updateVideoEditState(editedState, { duration: 12, type: "reset-trim" });
    const speedReset = updateVideoEditState(editedState, { type: "reset-speed" });
    const formatReset = updateVideoEditState(editedState, { type: "reset-format" });
    const subtitlesReset = updateVideoEditState(editedState, { type: "reset-subtitles" });

    expect(trimReset).toMatchObject({ trimEnd: 12, trimStart: 0 });
    expect(trimReset.speed).toBe(1.5);
    expect(speedReset.speed).toBe(1);
    expect(speedReset.trimStart).toBe(2);
    expect(formatReset.exportFormat).toBe("mp4");
    expect(formatReset.subtitles).toHaveLength(1);
    expect(subtitlesReset.subtitles).toEqual([]);
    expect(subtitlesReset.exportFormat).toBe("webm");
  });
});
