import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, vi } from "vitest";
import App from "./App";

describe("media workspace shell", () => {
  let getContextSpy: ReturnType<typeof vi.spyOn>;
  let toBlobSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "en-US",
    });

    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      drawImage: vi.fn(),
      fillText: vi.fn(),
      lineTo: vi.fn(),
      measureText: vi.fn(() => ({ width: 96 })),
      moveTo: vi.fn(),
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
    expect(screen.getByText(/magicmedia/i)).toBeInTheDocument();
    expect(screen.getByText(/local only/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^upload$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /explore templates/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export current asset/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^export$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /explore templates/i })).not.toBeInTheDocument();
    expect(screen.getByText(/4k support/i)).toBeInTheDocument();
    expect(screen.getByText(/raw photos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
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
    expect(screen.getByText(/local only/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^edit$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^export$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export current asset/i })).toBeInTheDocument();
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
    await user.click(screen.getByRole("tab", { name: /adjustments/i }));
    await user.clear(screen.getByLabelText(/brightness/i));
    await user.type(screen.getByLabelText(/brightness/i), "18");
    await user.click(screen.getByRole("tab", { name: /layers/i }));
    await user.type(screen.getByLabelText(/watermark text/i), "Draft");
    await user.selectOptions(screen.getByLabelText(/watermark position/i), "top-left");
    await user.click(screen.getByRole("button", { name: /add text/i }));
    expect(screen.getAllByText(/text note/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /export current asset/i }));

    expect(await screen.findByText(/export saved/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /download cover-photo-edited.png/i })).toBeNull();
    expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), "image/png", 0.86);
  });
});
