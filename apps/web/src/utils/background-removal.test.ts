import { beforeEach, describe, expect, it, vi } from "vitest";
import { runImageBackgroundRemoval } from "./background-removal";

const { removeBackgroundMock } = vi.hoisted(() => ({
  removeBackgroundMock: vi.fn(),
}));

vi.mock("@imgly/background-removal", () => ({
  removeBackground: removeBackgroundMock,
}));

describe("background removal utility", () => {
  beforeEach(() => {
    removeBackgroundMock.mockReset();
  });

  it("runs the local background-removal model and returns a derived image file", async () => {
    const source = new File(["image"], "cover photo.png", { type: "image/png" });
    const progress = vi.fn();
    const resultBlob = new Blob(["foreground"], { type: "image/png" });

    removeBackgroundMock.mockImplementation((_image, config) => {
      config.progress("model", 1, 4);
      return Promise.resolve(resultBlob);
    });

    const result = await runImageBackgroundRemoval({
      onProgress: progress,
      source,
    });

    expect(removeBackgroundMock).toHaveBeenCalledWith(
      source,
      expect.objectContaining({
        model: "isnet_quint8",
        output: { format: "image/png", quality: 0.92 },
        proxyToWorker: true,
      }),
    );
    expect(progress).toHaveBeenCalledWith({
      message: "model",
      progress: 25,
      status: "processing",
    });
    expect(result.file).toBeInstanceOf(File);
    expect(result.file.name).toBe("cover-photo-background-removed.png");
    expect(result.file.type).toBe("image/png");
  });
});
