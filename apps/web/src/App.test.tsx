import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, vi } from "vitest";

const {
  exportEditedVideoMock,
  generateVideoPosterMock,
  generateVideoThumbnailsMock,
  runImageBackgroundRemovalMock,
  saveVideoExportMock,
  toastErrorMock,
  toastInfoMock,
  toastSuccessMock,
} = vi.hoisted(() => ({
  exportEditedVideoMock: vi.fn(),
  generateVideoPosterMock: vi.fn(),
  generateVideoThumbnailsMock: vi.fn(),
  runImageBackgroundRemovalMock: vi.fn(),
  saveVideoExportMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastInfoMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("./utils/video-export", () => ({
  exportEditedVideo: exportEditedVideoMock,
  getVideoExportErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
  saveVideoExport: saveVideoExportMock,
}));

vi.mock("./utils/background-removal", () => ({
  getBackgroundRemovalErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
  runImageBackgroundRemoval: runImageBackgroundRemovalMock,
}));

vi.mock("./utils/video-thumbnails", () => ({
  generateVideoPoster: generateVideoPosterMock,
  generateVideoThumbnails: generateVideoThumbnailsMock,
}));

vi.mock("sonner", () => ({
  Toaster: ({ duration, position }: { duration?: number; position?: string }) => (
    <div data-duration={duration} data-position={position} data-testid="studio-toaster" />
  ),
  toast: {
    error: toastErrorMock,
    info: toastInfoMock,
    success: toastSuccessMock,
  },
}));

import App from "./App";

function expectLocalPrivacyBadge(label: RegExp) {
  const badge = screen.getByText(label).closest(".local-advantage-tag");

  expect(badge).toBeInTheDocument();
  expect(badge?.querySelector(".material-symbols_shield")).toBeInTheDocument();
}

function expectBrandMark(label: RegExp) {
  const brandMark = screen.getByRole("img", { name: label });

  expect(brandMark).toBeInTheDocument();
  expect(brandMark.tagName.toLowerCase()).toBe("canvas");
  expect(brandMark).toHaveAttribute("data-brand-mark", "darkroom-aperture");
}

describe("media workspace shell", () => {
  let getContextSpy: ReturnType<typeof vi.spyOn>;
  let toBlobSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exportEditedVideoMock.mockReset();
    generateVideoPosterMock.mockReset();
    generateVideoPosterMock.mockResolvedValue({
      id: "poster-0",
      time: 0,
      url: "blob:video-poster",
    });
    generateVideoThumbnailsMock.mockReset();
    generateVideoThumbnailsMock.mockResolvedValue([]);
    runImageBackgroundRemovalMock.mockReset();
    saveVideoExportMock.mockReset();
    saveVideoExportMock.mockResolvedValue(undefined);
    toastErrorMock.mockReset();
    toastInfoMock.mockReset();
    toastSuccessMock.mockReset();

    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "en-US",
    });

    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      arc: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      clip: vi.fn(),
      closePath: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      drawImage: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([255, 255, 255, 255]),
        height: 1,
        width: 1,
      })),
      lineTo: vi.fn(),
      measureText: vi.fn(() => ({ width: 96 })),
      moveTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
      translate: vi.fn(),
      set fillStyle(_value: string) {},
      set filter(_value: string) {},
      set font(_value: string) {},
      set globalAlpha(_value: number) {},
      set lineCap(_value: CanvasLineCap) {},
      set lineJoin(_value: CanvasLineJoin) {},
      set lineWidth(_value: number) {},
      set strokeStyle(_value: string) {},
      set textAlign(_value: CanvasTextAlign) {},
      set textBaseline(_value: CanvasTextBaseline) {},
    } as unknown as CanvasRenderingContext2D);

    toBlobSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((callback, type) => {
        callback(new Blob(["edited image"], { type: type ?? "image/png" }));
      });

    Object.defineProperty(window, "showSaveFilePicker", {
      configurable: true,
      value: vi.fn(() =>
        Promise.resolve({
          createWritable: () =>
            Promise.resolve({
              write: vi.fn(),
              close: vi.fn(),
            }),
        }),
      ),
    });
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });

    class MockImage {
      naturalWidth = 1200;
      naturalHeight = 800;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", MockImage);
  });

  afterEach(() => {
    getContextSpy.mockRestore();
    toBlobSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("renders the local-first guided studio with import, edit, and export steps", () => {
    render(<App />);

    expect(screen.getAllByRole("button", { name: /add media/i })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /start your creation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /import media/i })).toBeInTheDocument();
    expect(screen.getByText(/obscura/i)).toBeInTheDocument();
    expectBrandMark(/obscura brand mark/i);
    expectLocalPrivacyBadge(/local & private/i);
    expect(screen.queryByRole("button", { name: /^upload$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /explore templates/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export current asset/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^export$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /explore templates/i })).not.toBeInTheDocument();
    expect(screen.getByText(/4k support/i)).toBeInTheDocument();
    expect(screen.getByText(/raw photos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
    expect(screen.getByTestId("studio-toaster")).toHaveAttribute("data-position", "bottom-right");
    expect(screen.getByTestId("studio-toaster")).toHaveAttribute("data-duration", "3000");
  });

  it("detects Chinese browser language and allows manual switching to English", async () => {
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "zh-CN",
    });

    const user = userEvent.setup();
    render(<App />);

    expect(screen.getAllByRole("button", { name: /添加媒体/i })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /开始你的创作/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /导入媒体/i })).toBeInTheDocument();
    expectBrandMark(/obscura 品牌标识/i);
    expectLocalPrivacyBadge(/本地 & 安全/i);

    await user.selectOptions(screen.getByLabelText(/语言/i), "en");

    expect(screen.getAllByRole("button", { name: /add media/i })).toHaveLength(1);
    expect(screen.getByRole("button", { name: /import media/i })).toBeInTheDocument();
  });

  it("imports user-selected files into the media library without uploading them", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText(/choose media files/i);
    const image = new File(["image"], "cover.png", { type: "image/png" });
    const video = new File(["video"], "clip.mp4", { type: "video/mp4" });

    await user.upload(input, [image, video]);

    expect(screen.getAllByText("cover.png").length).toBeGreaterThan(0);
    expect(screen.getAllByText("clip.mp4").length).toBeGreaterThan(0);
    expect(screen.getByText(/2 assets/i)).toBeInTheDocument();
    expect(screen.queryByText(/privacy status/i)).not.toBeInTheDocument();
    expectLocalPrivacyBadge(/local & private/i);
    expect(screen.getByRole("heading", { name: /^edit$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^export$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export current asset/i })).toBeInTheDocument();
  });

  it("shows first-frame video posters and distinct media type icons in the library", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.upload(screen.getByLabelText(/choose media files/i), [
      new File(["image"], "cover.png", { type: "image/png" }),
      new File(["video"], "clip.mp4", { type: "video/mp4" }),
    ]);

    expect(generateVideoPosterMock).toHaveBeenCalledWith(
      expect.objectContaining({ sourceUrl: expect.stringMatching(/^blob:/) }),
    );
    expect((await screen.findAllByTestId("video-poster-thumbnail"))[0]).toHaveAttribute(
      "src",
      "blob:video-poster",
    );
    expect(screen.getAllByTestId("video-poster-play").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("asset-kind-image").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("asset-kind-video").length).toBeGreaterThan(0);
  });

  it("edits a selected image and prepares a local download", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText(/choose media files/i);
    const image = new File(["image"], "cover photo.png", { type: "image/png" });

    await user.upload(input, image);
    await user.click(screen.getByRole("button", { name: /1:1 square/i }));
    await user.click(screen.getByRole("button", { name: /rotate 90/i }));
    await user.click(screen.getByRole("button", { name: /flip horizontal/i }));
    await user.clear(screen.getByLabelText(/output width/i));
    await user.type(screen.getByLabelText(/output width/i), "600");
    await user.click(screen.getByRole("tab", { name: /beautify/i }));
    await user.clear(screen.getByLabelText(/brightness/i));
    await user.type(screen.getByLabelText(/brightness/i), "18");
    await user.click(screen.getByRole("tab", { name: /layers/i }));
    await user.type(screen.getByLabelText(/watermark text/i), "Draft");
    await user.selectOptions(screen.getByLabelText(/watermark position/i), "top-left");
    await user.click(screen.getByRole("button", { name: /add text/i }));
    expect(screen.getAllByText(/text note/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("tab", { name: /^format$/i }));
    await user.selectOptions(screen.getByLabelText(/image format/i), "webp");
    await user.clear(screen.getByLabelText(/quality/i));
    await user.type(screen.getByLabelText(/quality/i), "70");
    expect(screen.queryByLabelText(/^format$/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /generate format preview/i }));
    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith("Image preview ready."));
    await user.click(screen.getByRole("button", { name: /export current asset/i }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith("Export saved."));
    expect(screen.queryByRole("link", { name: /download cover-photo-edited.webp/i })).toBeNull();
    expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.7);
  });

  it("runs background removal locally and adds the transparent result as a new asset", async () => {
    const user = userEvent.setup();
    const sourceImage = new File(["image"], "cover photo.png", { type: "image/png" });

    runImageBackgroundRemovalMock.mockImplementation(({ onProgress }) => {
      onProgress?.({
        message: "Removing background",
        progress: 64,
        status: "processing",
      });

      return Promise.resolve({
        blob: new Blob(["foreground"], { type: "image/png" }),
        file: new File(["foreground"], "cover-photo-background-removed.png", {
          type: "image/png",
        }),
      });
    });

    render(<App />);

    await user.upload(screen.getByLabelText(/choose media files/i), sourceImage);
    await user.click(screen.getByRole("tab", { name: /background/i }));
    await user.click(screen.getByRole("button", { name: /remove background/i }));

    expect(runImageBackgroundRemovalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        source: sourceImage,
      }),
    );
    expect(await screen.findAllByText("cover-photo-background-removed.png")).not.toHaveLength(0);
    expect(screen.getAllByText("cover photo.png").length).toBeGreaterThan(0);
  });

  it("edits a selected video with trim, speed, subtitles, and format controls", async () => {
    const user = userEvent.setup();
    exportEditedVideoMock.mockImplementation(({ onProgress }) => {
      onProgress?.({
        message: "Encoding video",
        progress: 72,
        status: "processing",
      });

      return Promise.resolve({
        blob: new Blob(["video"], { type: "video/webm" }),
        filename: "clip-edited.webm",
        size: 5,
        url: "blob:video-export",
      });
    });
    render(<App />);

    await user.upload(
      screen.getByLabelText(/choose media files/i),
      new File(["video"], "clip.mp4", { type: "video/mp4" }),
    );

    await user.clear(screen.getByLabelText(/start time/i));
    await user.type(screen.getByLabelText(/start time/i), "1.2");
    await user.clear(screen.getByLabelText(/end time/i));
    await user.type(screen.getByLabelText(/end time/i), "8.4");

    await user.click(screen.getByRole("tab", { name: /speed/i }));
    await user.selectOptions(screen.getByLabelText(/playback speed/i), "1.5");

    await user.click(screen.getByRole("tab", { name: /subtitles/i }));
    await user.click(screen.getByRole("button", { name: /add subtitle/i }));

    expect(screen.getByDisplayValue(/subtitle text/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /format/i }));
    await user.selectOptions(screen.getByLabelText(/video format/i), "webm");

    expect(screen.getByLabelText(/video format/i)).toHaveValue("webm");
    expect(screen.queryByLabelText(/^format$/i)).not.toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: /^generate preview$/i })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /^generate preview$/i }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith("Preview ready."));
    expect(screen.getByText(/derived preview/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /export current asset/i }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith("Export saved."));
    expect(exportEditedVideoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.objectContaining({
          exportFormat: "webm",
          speed: 1.5,
          trimEnd: 8.4,
          trimStart: 1.2,
        }),
      }),
    );
  });

  it("shows cancel, failure, and retry states for video preview jobs", async () => {
    const user = userEvent.setup();

    exportEditedVideoMock
      .mockImplementationOnce(({ onProgress, signal }) => {
        onProgress?.({
          message: "Loading FFmpeg",
          progress: 4,
          status: "loading",
        });

        return new Promise((_resolve, reject) => {
          signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Video export canceled", "AbortError")),
            { once: true },
          );
        });
      })
      .mockRejectedValueOnce(new Error("Unsupported codec"))
      .mockResolvedValueOnce({
        blob: new Blob(["video"], { type: "video/mp4" }),
        filename: "clip-edited.mp4",
        size: 5,
        url: "blob:video-export",
      });

    render(<App />);

    await user.upload(
      screen.getByLabelText(/choose media files/i),
      new File(["video"], "clip.mp4", { type: "video/mp4" }),
    );

    expect(screen.getAllByRole("button", { name: /^generate preview$/i })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /^generate preview$/i }));
    expect(await screen.findByRole("button", { name: /cancel/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => expect(toastInfoMock).toHaveBeenCalledWith("Preview canceled."));

    await user.click(screen.getByRole("button", { name: /^generate preview$/i }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("Unsupported codec"));
    expect(screen.queryByText(/unsupported codec/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry preview/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retry preview/i }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith("Preview ready."));
  });

  it("reuses a fresh generated video preview for export", async () => {
    const user = userEvent.setup();
    const generatedPreview = {
      blob: new Blob(["preview"], { type: "video/webm" }),
      filename: "clip-edited.webm",
      size: 7,
      url: "blob:video-preview",
    };

    exportEditedVideoMock.mockResolvedValue(generatedPreview);

    render(<App />);

    await user.upload(
      screen.getByLabelText(/choose media files/i),
      new File(["video"], "clip.mp4", { type: "video/mp4" }),
    );
    await user.click(screen.getByRole("tab", { name: /format/i }));
    await user.selectOptions(screen.getByLabelText(/video format/i), "webm");
    await user.click(screen.getByRole("button", { name: /^generate preview$/i }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith("Preview ready."));

    await user.click(screen.getByRole("button", { name: /export current asset/i }));

    expect(saveVideoExportMock).toHaveBeenCalledWith(expect.objectContaining(generatedPreview));
    expect(exportEditedVideoMock).toHaveBeenCalledTimes(1);
  });

  it("marks a generated video preview stale when export-affecting settings change", async () => {
    const user = userEvent.setup();

    exportEditedVideoMock
      .mockResolvedValueOnce({
        blob: new Blob(["preview"], { type: "video/mp4" }),
        filename: "clip-edited.mp4",
        size: 7,
        url: "blob:video-preview",
      })
      .mockResolvedValueOnce({
        blob: new Blob(["export"], { type: "video/mp4" }),
        filename: "clip-edited.mp4",
        size: 9,
        url: "blob:video-export",
      });

    render(<App />);

    await user.upload(
      screen.getByLabelText(/choose media files/i),
      new File(["video"], "clip.mp4", { type: "video/mp4" }),
    );
    await user.click(screen.getByRole("button", { name: /^generate preview$/i }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith("Preview ready."));
    expect(screen.getByText(/derived preview/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /speed/i }));
    await user.selectOptions(screen.getByLabelText(/playback speed/i), "1.5");

    expect(screen.getByText(/source preview/i)).toBeInTheDocument();
    await waitFor(() => expect(toastInfoMock).toHaveBeenCalledWith("Preview stale."));
    expect(screen.queryByText(/preview stale/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /export current asset/i }));

    expect(exportEditedVideoMock).toHaveBeenCalledTimes(2);
    expect(saveVideoExportMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: "blob:video-export" }),
    );
  });
});
